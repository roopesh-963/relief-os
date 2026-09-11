import { FormEvent, useEffect, useState } from 'react';
import { Loader2, PencilLine, Save, Shield, UserCircle, X } from 'lucide-react';
import { BackToDashboardButton } from '../components/navigation/BackToDashboardButton';
import { getCurrentUser, updateMe } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

export default function Profile() {
  const user = getCurrentUser();
  const { addNotification } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user?.name, user?.email]);

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      addNotification({
        type: 'warning',
        title: 'Missing details',
        message: 'Name and email are both required.',
      });
      return;
    }

    setSaving(true);
    try {
      await updateMe({
        name: name.trim(),
        email: email.trim(),
      });

      addNotification({
        type: 'success',
        title: 'Profile updated',
        message: 'Your profile details were saved successfully.',
      });
      setIsEditing(false);
    } catch (error: any) {
      addNotification({
        type: 'critical',
        title: 'Update failed',
        message: error?.response?.data?.message || 'Unable to update your profile right now.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-crav-beige)] text-[var(--color-crav-black)] pb-24">
      <BackToDashboardButton />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pt-24 pb-24 sm:px-6">

        <section className="crav-card bg-white p-6 sm:p-10 relative overflow-hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="crav-card bg-[var(--color-crav-mustard)] text-[var(--color-crav-black)] p-4 rotate-[-3deg] inline-block">
                <UserCircle className="h-10 w-10 stroke-[3]" />
              </div>
              <div>
                <div className="crav-card inline-flex items-center gap-2 bg-[var(--color-crav-black)] text-white px-4 py-1 font-[var(--font-mouse)] text-2xl uppercase rotate-[2deg]">
                  <Shield className="h-5 w-5 stroke-[3]" />
                  Operator Profile
                </div>
                <h1 className="mt-4 font-[var(--font-modak)] text-5xl uppercase tracking-wider md:text-6xl text-[var(--color-crav-black)]">
                  {user?.name || 'ReliefOS Operator'}
                </h1>
                <p className="mt-4 font-bold text-lg md:text-xl max-w-xl">
                  Update your command identity and account details used across ReliefOS AI.
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="crav-button inline-flex items-center gap-2 bg-[var(--color-crav-black)] px-6 py-4 font-[var(--font-mouse)] text-3xl uppercase text-white hover:bg-[var(--color-crav-red)] rotate-2"
              >
                <PencilLine className="h-6 w-6 stroke-[3]" />
                EDIT PROFILE
              </button>
            ) : null}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <label className="crav-card bg-white p-6 sm:p-8 transition-transform hover:-translate-y-2">
            <div className="font-[var(--font-mouse)] text-3xl uppercase opacity-80">NAME</div>
            {isEditing ? (
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-4 w-full bg-[var(--color-crav-beige)] border-2 border-[var(--color-crav-black)] p-4 font-bold text-xl outline-none text-[var(--dm-card-text)] rounded-xl"
                placeholder="YOUR NAME"
                disabled={saving}
              />
            ) : (
              <div className="mt-4 font-[var(--font-mouse)] text-4xl uppercase tracking-wide">{user?.name || 'UNKNOWN'}</div>
            )}
          </label>

          <label className="crav-card bg-white p-6 sm:p-8 transition-transform hover:-translate-y-2">
            <div className="font-[var(--font-mouse)] text-3xl uppercase opacity-80">EMAIL</div>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-4 w-full bg-[var(--color-crav-beige)] border-2 border-[var(--color-crav-black)] p-4 font-bold text-xl outline-none text-[var(--dm-card-text)] rounded-xl"
                placeholder="YOU@EXAMPLE.COM"
                disabled={saving}
              />
            ) : (
              <div className="mt-4 font-[var(--font-mouse)] text-4xl uppercase tracking-wide">{user?.email || 'NOT SIGNED IN'}</div>
            )}
          </label>

          <div className="crav-card bg-[var(--color-crav-mustard)] p-6 sm:p-8 transition-transform hover:-translate-y-2">
            <div className="font-[var(--font-mouse)] text-3xl uppercase opacity-80">ROLE</div>
            <div className="mt-4 font-[var(--font-mouse)] text-4xl uppercase tracking-wide">{user?.role || 'GUEST'}</div>
            <div className="mt-4 font-bold text-sm">Role is managed by the system and can’t be edited here.</div>
          </div>

          {isEditing ? (
            <div className="lg:col-span-3 flex flex-wrap gap-4 mt-4">
              <button
                type="submit"
                disabled={saving}
                className="crav-button inline-flex items-center gap-2 bg-[var(--color-crav-green)] px-8 py-4 font-[var(--font-mouse)] text-3xl uppercase text-[var(--color-crav-black)] disabled:opacity-70 hover:bg-[var(--color-crav-black)] hover:text-white rotate-[-1deg]"
              >
                {saving ? <Loader2 className="h-6 w-6 animate-spin stroke-[3]" /> : <Save className="h-6 w-6 stroke-[3]" />}
                SAVE CHANGES
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="crav-button inline-flex items-center gap-2 bg-white px-8 py-4 font-[var(--font-mouse)] text-3xl uppercase text-[var(--color-crav-black)] disabled:opacity-70 hover:bg-[var(--color-crav-red)] hover:text-white rotate-[1deg]"
              >
                <X className="h-6 w-6 stroke-[3]" />
                CANCEL
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
