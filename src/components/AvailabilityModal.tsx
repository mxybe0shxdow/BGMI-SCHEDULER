import React, { useState } from 'react';
import { AvailabilityEntry, AvailabilityStatus, SquadUser } from '../types';
import { formatTime12h, getLocalDateString } from '../utils/dateUtils';
import { Clock, Calendar, X, AlertCircle, FileText, CheckCircle2, MapPin, Check } from 'lucide-react';

interface Props {
  currentUser: SquadUser;
  initialEntry?: AvailabilityEntry | null;
  defaultDate?: string;
  onSave: (data: Omit<AvailabilityEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<AvailabilityEntry>, oldSummary?: string) => Promise<void>;
  onDelete?: (id: string, details?: string) => Promise<void>;
  onClose: () => void;
}

// Available BGMI Maps for multi-select
export const BGMI_AVAILABLE_MAPS = [
  { id: 'Erangel', name: 'Erangel', icon: '🌲', type: '8x8 Classic' },
  { id: 'Livik', name: 'Livik', icon: '⚡', type: '2x2 Fast-Paced' },
  { id: 'Miramar', name: 'Miramar', icon: '🏜️', type: '8x8 Desert' },
  { id: 'Sanhok', name: 'Sanhok', icon: '🌴', type: '4x4 Jungle' },
  { id: 'Vikendi', name: 'Vikendi', icon: '❄️', type: '6x6 Snow' },
  { id: 'Karakin', name: 'Karakin', icon: '💣', type: '2x2 Black Zone' },
  { id: 'Nusa', name: 'Nusa', icon: '🏝️', type: '1x1 Mini' },
];

// Generate 30-min time slots from 00:00 to 23:30
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:30`);
}
// Add 23:59 as end of day option
TIME_OPTIONS.push('23:59');

export const AvailabilityModal: React.FC<Props> = ({
  currentUser,
  initialEntry,
  defaultDate,
  onSave,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const isEditing = !!initialEntry;

  const [date, setDate] = useState(
    initialEntry?.date || defaultDate || getLocalDateString(new Date())
  );
  const [startTime, setStartTime] = useState(initialEntry?.startTime || '20:00');
  const [endTime, setEndTime] = useState(initialEntry?.endTime || '23:00');
  const [status, setStatus] = useState<AvailabilityStatus>(
    initialEntry?.status || 'available'
  );
  const [preferredMaps, setPreferredMaps] = useState<string[]>(
    initialEntry?.preferredMaps || []
  );
  const [note, setNote] = useState(initialEntry?.note || '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const toggleMap = (mapId: string) => {
    if (preferredMaps.includes(mapId)) {
      setPreferredMaps(preferredMaps.filter((m) => m !== mapId));
    } else {
      setPreferredMaps([...preferredMaps, mapId]);
    }
  };

  const handleSelectAllMaps = () => {
    if (preferredMaps.length === BGMI_AVAILABLE_MAPS.length) {
      setPreferredMaps([]);
    } else {
      setPreferredMaps(BGMI_AVAILABLE_MAPS.map((m) => m.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing && onUpdate && initialEntry) {
        const oldSummary = `${initialEntry.date} (${initialEntry.startTime}-${initialEntry.endTime}) [${initialEntry.status}]`;
        await onUpdate(
          initialEntry.id,
          {
            date,
            startTime,
            endTime,
            status,
            preferredMaps: preferredMaps.length > 0 ? preferredMaps : undefined,
            note: note.trim() || undefined,
            userName: currentUser.name,
            userColor: currentUser.avatarColor,
          },
          oldSummary
        );
      } else {
        await onSave({
          userId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.avatarColor,
          date,
          startTime,
          endTime,
          status,
          preferredMaps: preferredMaps.length > 0 ? preferredMaps : undefined,
          note: note.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save availability. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEntry || !onDelete) return;
    if (!window.confirm('Are you sure you want to remove this availability slot?')) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(
        initialEntry.id,
        `${initialEntry.date} (${initialEntry.startTime}–${initialEntry.endTime})`
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete entry.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-black tracking-wide uppercase text-white flex items-center gap-2">
              {isEditing ? 'Edit Availability' : 'Add Availability'}
            </h3>
            <p className="text-xs text-zinc-400">
              Player: <span className="text-emerald-400 font-semibold">{currentUser.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Squad Availability Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'available'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                🟢 Available
              </button>

              <button
                type="button"
                onClick={() => setStatus('maybe')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'maybe'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                🟡 Maybe
              </button>

              <button
                type="button"
                onClick={() => setStatus('busy')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'busy'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                🔴 Busy
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl px-3.5 py-2 text-sm outline-none"
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              >
                {TIME_OPTIONS.filter((t) => t !== '23:59').map((t) => (
                  <option key={t} value={t}>
                    {formatTime12h(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                End Time
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {formatTime12h(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-medium text-zinc-400 mb-1 block">Quick Evening Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '8 PM – 11 PM', s: '20:00', e: '23:00' },
                { label: '9 PM – 12 AM', s: '21:00', e: '23:59' },
                { label: '10 PM – 1 AM', s: '22:00', e: '23:59' },
                { label: 'All Night (11 PM - late)', s: '23:00', e: '23:59' },
                { label: 'Afternoon (2 PM - 5 PM)', s: '14:00', e: '17:00' },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setStartTime(p.s);
                    setEndTime(p.e);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Maps Multi-Select List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Preferred Maps <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllMaps}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {preferredMaps.length === BGMI_AVAILABLE_MAPS.length ? 'Clear Maps' : 'Any Map / All'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BGMI_AVAILABLE_MAPS.map((m) => {
                const isSelected = preferredMaps.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMap(m.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-950/50'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{m.icon}</span>
                      <div className="truncate">
                        <span className="block truncate text-xs">{m.name}</span>
                        <span className="block text-[9px] text-zinc-500 font-normal leading-none">{m.type}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 ml-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {preferredMaps.length > 0 && (
              <p className="text-[11px] text-emerald-400/90 mt-1.5 font-medium flex items-center gap-1">
                ✓ Teammates will see you want to play: {preferredMaps.join(', ')}
              </p>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Note <span className="text-zinc-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Can play after dinner, mic off after 11 PM"
              maxLength={80}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-3.5 py-2 text-sm outline-none placeholder:text-zinc-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isEditing && onDelete && (
              <button
                type="button"
                disabled={deleting || loading}
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-200 text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || deleting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? 'Save Changes' : 'Confirm'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
