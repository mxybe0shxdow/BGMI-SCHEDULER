import React, { useState } from 'react';
import { SquadUser } from '../types';
import { getRandomColor, SQUAD_COLORS } from '../utils/dateUtils';
import { Shield, Crosshair, Users, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  existingUsers: SquadUser[];
  onComplete: (user: SquadUser) => Promise<void>;
}

export const OnboardingModal: React.FC<Props> = ({ existingUsers, onComplete }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(getRandomColor());
  const [role, setRole] = useState<SquadUser['role']>('Assault');
  const [bgmiId, setBgmiId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if they want to select an existing squad profile
  const [mode, setMode] = useState<'create' | 'select'>(existingUsers.length > 0 ? 'create' : 'create');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your Squad In-Game Name (IGN) or Nickname');
      return;
    }

    // Check duplicate name warning
    const exists = existingUsers.find(
      (u) => u.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists && mode === 'create') {
      setError(`A player named "${exists.name}" is already in the squad. If that is you, switch to "Select Existing Player" below, or choose a unique handle.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newUser: SquadUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: trimmed,
        avatarColor: selectedColor,
        role,
        bgmiId: bgmiId.trim() || undefined,
        createdAt: Date.now(),
      };
      await onComplete(newUser);
    } catch (err: any) {
      setError(err?.message || 'Failed to save identity. Try again.');
      setLoading(false);
    }
  };

  const handleSelectExisting = async (user: SquadUser) => {
    setLoading(true);
    try {
      await onComplete(user);
    } catch (err: any) {
      setError(err?.message || 'Failed to select player profile.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 text-white">
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-emerald-500/20">
            <Crosshair className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-wide uppercase text-white flex items-center gap-2">
              Squad Check-in
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                BGMI
              </span>
            </h2>
            <p className="text-sm text-zinc-400">
              Set your gaming handle to coordinate schedules & sessions
            </p>
          </div>
        </div>

        {/* Existing Player Quick Select */}
        {existingUsers.length > 0 && (
          <div className="mb-6 bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Already in this squad?
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'create' ? 'select' : 'create')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline cursor-pointer"
              >
                {mode === 'create' ? 'Switch to returning player' : 'Create new player'}
              </button>
            </div>

            {mode === 'select' && (
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-44 overflow-y-auto pr-1">
                {existingUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectExisting(u)}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/80 hover:bg-emerald-950/40 border border-zinc-700 hover:border-emerald-500 transition-all text-left text-xs font-medium text-zinc-200 cursor-pointer"
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0"
                      style={{ backgroundColor: u.avatarColor || '#10B981' }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* In-Game Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Squad Nickname / In-Game Name (IGN) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mortal, Dynamo, Viper, Scout"
                maxLength={24}
                required
                className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition placeholder:text-zinc-500"
              />
            </div>

            {/* BGMI Character ID (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                BGMI Character ID <span className="text-zinc-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={bgmiId}
                onChange={(e) => setBgmiId(e.target.value)}
                placeholder="e.g. 5123456789 (for quick in-game invites)"
                maxLength={18}
                className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl px-4 py-2 text-sm outline-none transition placeholder:text-zinc-500"
              />
            </div>

            {/* Squad Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Primary Squad Role
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['Assault', 'Sniper', 'IGL', 'Support', 'All-Rounder'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all text-center ${
                      role === r
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Avatar Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Badge Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {SQUAD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      selectedColor === c
                        ? 'scale-125 border-white ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900'
                        : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black tracking-wide uppercase py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                  Join Squad Board
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <p className="text-[11px] text-zinc-500">
            Changes sync in real-time across all teammates using this URL.
          </p>
        </div>
      </div>
    </div>
  );
};
