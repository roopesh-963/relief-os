import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Loader2, RadioTower } from 'lucide-react';
import { BackToDashboardButton } from '../components/navigation/BackToDashboardButton';
import { useNotifications } from '../hooks/useNotifications';
import {
  getAlerts,
  getAllSOS,
  getCurrentUser,
  type CrisisAlert,
  type SOSRequest,
} from '../services/api';
import { useSocket } from '../hooks/useSocket';

type FeedItem = {
  id: string;
  kind: 'system' | 'alert' | 'sos';
  title: string;
  message: string;
  tone: 'info' | 'warning' | 'critical' | 'success';
  timestamp: Date;
  meta?: string;
};

const toneStyles: Record<FeedItem['tone'], string> = {
  info: 'text-cyan-200',
  success: 'text-emerald-200',
  warning: 'text-amber-200',
  critical: 'text-red-200',
};

const sosSeverityToTone = (severity: SOSRequest['severity']): FeedItem['tone'] => {
  if (severity === 'critical' || severity === 'high') {
    return 'critical';
  }
  if (severity === 'medium') {
    return 'warning';
  }
  return 'info';
};

const formatAlertItem = (alert: CrisisAlert): FeedItem => ({
  id: `alert-${alert._id}`,
  kind: 'alert',
  title: alert.title,
  message: alert.message,
  tone: alert.type,
  timestamp: new Date(alert.createdAt),
  meta: alert.affectedCity ? `Affected area: ${alert.affectedCity}` : undefined,
});

const formatSosItem = (sos: SOSRequest): FeedItem => ({
  id: `sos-${sos._id}`,
  kind: 'sos',
  title: `${String(sos.severity).toUpperCase()} SOS ${sos.crisisType ? `- ${sos.crisisType}` : ''}`,
  message: sos.message || `Emergency request from ${sos.location?.label || sos.region || 'unknown location'}`,
  tone: sosSeverityToTone(sos.severity),
  timestamp: new Date(sos.createdAt),
  meta: [sos.region || sos.location?.label, sos.status.replace('_', ' ')].filter(Boolean).join(' • '),
});

export default function Notifications() {
  const { notifications } = useNotifications();
  const { on, joinDashboard } = useSocket();
  const user = getCurrentUser();
  const canViewSOS = user?.role === 'admin' || user?.role === 'rescue_team';

  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [sosItems, setSosItems] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFeed = async () => {
      setLoading(true);
      setError(null);

      try {
        const [alertData, sosData] = await Promise.all([
          getAlerts(),
          canViewSOS ? getAllSOS({ limit: 25 }) : Promise.resolve([] as SOSRequest[]),
        ]);

        if (cancelled) {
          return;
        }

        setAlerts(alertData);
        setSosItems(sosData);
      } catch (loadError) {
        console.error('Notification feed load failed:', loadError);
        if (!cancelled) {
          setError('Unable to fetch alert data right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [canViewSOS]);

  useEffect(() => {
    joinDashboard();

    const offAlert = on<{
      id: string;
      title: string;
      message: string;
      type: CrisisAlert['type'];
      affectedCity: string;
      createdAt: string;
    }>('new_alert', (payload) => {
      setAlerts((prev) => [
        {
          _id: payload.id,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          affectedCity: payload.affectedCity,
          isActive: true,
          createdAt: payload.createdAt,
        },
        ...prev.filter((item) => item._id !== payload.id),
      ]);
    });

    const offSos = canViewSOS
      ? on<{
          id: string;
          submittedBy?: { name: string; email: string; role: string };
          location: { coordinates: [number, number]; label: string };
          severity: SOSRequest['severity'];
          crisisType?: SOSRequest['crisisType'];
          region?: string;
          message: string;
          status: SOSRequest['status'];
          createdAt: string;
        }>('new_sos', (payload) => {
          setSosItems((prev) => [
            {
              _id: payload.id,
              submittedBy: payload.submittedBy || { name: 'Citizen', email: '', role: 'citizen' },
              location: payload.location,
              severity: payload.severity,
              crisisType: payload.crisisType,
              region: payload.region,
              message: payload.message,
              status: payload.status,
              assignedTeam: null,
              createdAt: payload.createdAt,
            },
            ...prev.filter((item) => item._id !== payload.id),
          ]);
        })
      : () => undefined;

    const offSosUpdated = canViewSOS
      ? on<{ id: string; status: SOSRequest['status']; assignedTeam: string | null; resolvedAt?: string | null }>(
          'sos_updated',
          (payload) => {
            setSosItems((prev) =>
              prev.map((item) =>
                item._id === payload.id
                  ? {
                      ...item,
                      status: payload.status,
                      assignedTeam: payload.assignedTeam,
                      resolvedAt: payload.resolvedAt ?? item.resolvedAt,
                    }
                  : item
              )
            );
          }
        )
      : () => undefined;

    return () => {
      offAlert();
      offSos();
      offSosUpdated();
    };
  }, [canViewSOS, joinDashboard, on]);

  const localFeed = useMemo<FeedItem[]>(
    () =>
      notifications.map((notification) => ({
        id: `local-${notification.id}`,
        kind: 'system',
        title: notification.title,
        message: notification.message,
        tone: notification.type,
        timestamp: notification.timestamp,
      })),
    [notifications]
  );

  const serverFeed = useMemo<FeedItem[]>(
    () => [...alerts.map(formatAlertItem), ...sosItems.map(formatSosItem)],
    [alerts, sosItems]
  );

  const items = useMemo(
    () =>
      [...serverFeed, ...localFeed]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .filter((item, index, arr) => arr.findIndex((entry) => entry.id === item.id) === index),
    [localFeed, serverFeed]
  );

  return (
    <div className="min-h-screen bg-[var(--color-crav-beige)] text-[var(--color-crav-black)] pb-24">
      <BackToDashboardButton />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pt-24 pb-24 sm:px-6">

        <section className="crav-card bg-white p-6 sm:p-10 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="crav-card bg-[var(--color-crav-red)] text-white p-4 rotate-[-3deg] inline-block">
              <Bell className="h-10 w-10 stroke-[3]" />
            </div>
            <div>
              <div className="crav-card inline-flex items-center gap-2 bg-[var(--color-crav-mustard)] px-4 py-1 font-[var(--font-mouse)] text-2xl uppercase rotate-[2deg]">
                Alert Feed
              </div>
              <h1 className="mt-4 font-[var(--font-modak)] text-5xl uppercase tracking-wider md:text-6xl text-[var(--color-crav-black)]">
                NOTIFICATIONS CENTER
              </h1>
              <p className="mt-4 font-bold text-lg md:text-xl max-w-xl">
                Live crisis alerts, SOS activity, and in-app operational updates.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <div className="crav-card bg-white p-10 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin stroke-[3] text-[var(--color-crav-red)]" />
              <div className="mt-6 font-[var(--font-mouse)] text-4xl uppercase">LOADING ALERTS...</div>
              <div className="mt-2 font-bold text-lg opacity-70">Fetching live notifications and SOS activity.</div>
            </div>
          ) : error ? (
            <div className="crav-card bg-[var(--color-crav-mustard)] p-10 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 stroke-[3]" />
              <div className="mt-6 font-[var(--font-mouse)] text-4xl uppercase">FEED UNAVAILABLE</div>
              <div className="mt-2 font-bold text-lg">{error}</div>
            </div>
          ) : items.length > 0 ? (
            items.map((item, i) => (
              <div 
                key={item.id} 
                className={"crav-card p-6 transition-transform hover:-translate-y-2 " + (
                  item.tone === 'critical' ? 'bg-[var(--color-crav-red)] text-[var(--color-crav-black)]' :
                  item.tone === 'warning' ? 'bg-[var(--color-crav-mustard)] text-[var(--color-crav-black)]' :
                  item.tone === 'success' ? 'bg-[var(--color-crav-green)] text-[var(--color-crav-black)]' :
                  'bg-white text-[var(--color-crav-black)]'
                )}
                style={{ transform: `rotate(${i % 2 === 0 ? 1 : -1}deg)` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      {item.kind === 'sos' ? (
                        <RadioTower className="h-6 w-6 stroke-[3]" />
                      ) : (
                        <Bell className="h-6 w-6 stroke-[3]" />
                      )}
                      <div className="font-[var(--font-mouse)] text-3xl uppercase tracking-wide">{item.title}</div>
                    </div>
                    <div className="mt-3 font-bold text-lg leading-relaxed opacity-90">{item.message}</div>
                    {item.meta ? <div className="mt-3 inline-block border-2 border-current px-3 py-1 font-bold text-sm uppercase">{item.meta}</div> : null}
                  </div>
                  <div className="shrink-0 font-[var(--font-mouse)] text-2xl uppercase opacity-80">
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="crav-card bg-white p-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 stroke-[3] text-[var(--color-crav-green)]" />
              <div className="mt-6 font-[var(--font-mouse)] text-4xl uppercase">NO ACTIVE NOTIFICATIONS</div>
              <div className="mt-2 font-bold text-lg opacity-70">Fresh alerts will appear here as operations update in real time.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
