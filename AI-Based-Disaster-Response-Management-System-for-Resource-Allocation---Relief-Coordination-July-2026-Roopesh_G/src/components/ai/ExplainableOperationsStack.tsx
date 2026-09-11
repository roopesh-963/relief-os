import { AlertTriangle, ArrowRight, Brain, Truck, Waves } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AssistantContextSnapshot } from '../../services/assistant';

type PriorityItem = AssistantContextSnapshot['prioritizedIncidents'][number];
type ShortageItem = AssistantContextSnapshot['shortagePredictions'][number];
type DispatchItem = AssistantContextSnapshot['dispatchRecommendations'][number];

function toneForPriority(label: string) {
  if (label === 'Critical') return 'border-red-600 bg-red-100 text-red-950 font-bold';
  if (label === 'High') return 'border-amber-600 bg-amber-100 text-amber-950 font-bold';
  if (label === 'Elevated') return 'border-blue-600 bg-blue-100 text-blue-950 font-bold';
  return 'border-gray-600 bg-gray-100 text-[var(--color-crav-black)] font-bold';
}

function toneForRisk(label: string) {
  if (label === 'Critical') return 'text-red-700 font-bold';
  if (label === 'High') return 'text-amber-800 font-bold';
  if (label === 'Watch') return 'text-blue-800 font-bold';
  return 'text-[var(--color-crav-black)] font-bold';
}

function SectionFrame({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border-2 border-[var(--color-crav-black)] bg-white/90 p-5 shadow-[4px_4px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]">
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--color-crav-black)]">
        <Icon className="h-4 w-4 text-[var(--color-crav-black)] stroke-[3]" />
        {title}
      </div>
      {children}
    </section>
  );
}

export function ExplainableOperationsStack({
  priorities = [],
  shortages = [],
  dispatches = [],
  compact = false,
  className,
}: {
  priorities?: PriorityItem[];
  shortages?: ShortageItem[];
  dispatches?: DispatchItem[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4', compact ? 'lg:grid-cols-2' : 'xl:grid-cols-3', className)}>
      <SectionFrame title="Priority Queue" icon={AlertTriangle}>
        <div className="space-y-3">
          {priorities.length > 0 ? (
            priorities.slice(0, compact ? 2 : 3).map((item) => (
              <div key={item.id} className="rounded-[1.1rem] border-2 border-[var(--color-crav-black)] bg-white p-4 shadow-[2px_2px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[var(--color-crav-black)]">{item.region}</div>
                    <div className="mt-1 text-xs font-semibold text-[var(--color-crav-black)] opacity-80">
                      {item.crisisType} | {item.ageMinutes} min old
                    </div>
                  </div>
                  <span className={cn('border px-2 py-1 text-[10px] uppercase tracking-[0.22em]', toneForPriority(item.priorityLabel))}>
                    {item.priorityLabel}
                  </span>
                </div>
                <div className="mt-3 text-sm font-bold text-[var(--color-crav-black)]">{item.recommendedAction}</div>
                {item.why?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.why.slice(0, 3).map((reason) => (
                      <span key={reason} className="rounded-full border border-[var(--color-crav-black)] bg-[var(--color-crav-beige)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-crav-black)]">
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm font-bold text-[var(--color-crav-black)]">No priority escalations are active.</div>
          )}
        </div>
      </SectionFrame>

      <SectionFrame title="Shortage Forecast" icon={Waves}>
        <div className="space-y-3">
          {shortages.length > 0 ? (
            shortages.slice(0, compact ? 2 : 3).map((item) => (
              <div key={item.id} className="rounded-[1.1rem] border-2 border-[var(--color-crav-black)] bg-white p-4 shadow-[2px_2px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[var(--color-crav-black)]">{item.type}</div>
                    <div className="mt-1 text-xs font-semibold text-[var(--color-crav-black)] opacity-80">{item.location}</div>
                  </div>
                  <div className={cn('text-sm font-bold', toneForRisk(item.riskLevel))}>{item.riskLevel}</div>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold text-[var(--color-crav-black)]">{item.daysRemaining}</div>
                    <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-[var(--color-crav-black)] opacity-80">days remaining</div>
                  </div>
                  <div className="text-right text-xs font-bold text-[var(--color-crav-black)]">
                    {item.currentQuantity} {item.unit}
                  </div>
                </div>
                {item.why?.length > 0 && (
                  <div className="mt-3 space-y-1.5 text-xs font-semibold text-[var(--color-crav-black)]">
                    {item.why.slice(0, 2).map((reason) => (
                      <div key={reason}>{reason}</div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm font-bold text-[var(--color-crav-black)]">No shortage pressure is projected yet.</div>
          )}
        </div>
      </SectionFrame>

      <SectionFrame title="Dispatch Recommendations" icon={Truck}>
        <div className="space-y-3">
          {dispatches.length > 0 ? (
            dispatches.slice(0, compact ? 2 : 3).map((item) => (
              <div key={item.id} className="rounded-[1.1rem] border-2 border-[var(--color-crav-black)] bg-white p-4 shadow-[2px_2px_0px_var(--color-crav-black)] text-[var(--color-crav-black)]">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn('border px-2 py-1 text-[10px] uppercase tracking-[0.22em]', toneForPriority(item.priorityLabel))}>
                    {item.priorityLabel}
                  </span>
                  <div className="text-xs font-bold text-[var(--color-crav-black)]">{item.etaMinutes} min ETA</div>
                </div>
                <div className="mt-3 text-sm font-bold text-[var(--color-crav-black)]">{item.action}</div>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[var(--color-crav-black)]">
                  <span>{item.from}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--color-crav-black)] stroke-[3]" />
                  <span>{item.to}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-[var(--color-crav-black)]">
                  <span>
                    {item.quantity} {item.unit} of {item.resourceType}
                  </span>
                  {item.shipmentId && <span>Linked {item.shipmentId}</span>}
                </div>
                {item.why?.length > 0 && (
                  <div className="mt-3 rounded-xl border border-[var(--color-crav-black)] bg-[var(--color-crav-beige)] px-3 py-2 text-xs font-bold text-[var(--color-crav-black)]">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-crav-black)]">
                      <Brain className="h-3 w-3 stroke-[3]" />
                      Why
                    </div>
                    {item.why[0]}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm font-bold text-[var(--color-crav-black)]">No dispatch interventions are pending.</div>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}

export default ExplainableOperationsStack;
