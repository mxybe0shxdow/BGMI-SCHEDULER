import React, { useState } from 'react';
import { SquadSession, SquadUser } from '../types';
import { formatTime12h, getLocalDateString } from '../utils/dateUtils';
import { Gamepad2, Calendar, Clock, MapPin, Users, X, AlertCircle } from 'lucide-react';

interface Props {
  currentUser: SquadUser;
  allUsers: SquadUser[];
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  preselectedPlayerIds?: string[];
  onSave: (session: Omit<SquadSession, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

const MAP_OPTIONS: SquadSession['map'][] = [
  'Erangel',
  'Miramar',
  'Sanhok',
  'Livik',
  'Vikendi',
  'Karakin',
  'Any Map',
];

const MODE_OPTIONS: SquadSession['mode'][] = [
  'Classic',
  'Ranked',
  'Custom Room',
  'Arena / TDM',
  'Scrims',
  'Other',
];

export const CreateSessionModal: React.FC<Props> = ({
  currentUser,
  allUsers,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  preselectedPlayerIds = [],
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('BGMI Squad Grind');
  const [date, setDate] = useState(defaultDate || getLocalDateString(new Date()));
  const [startTime, setStartTime] = useState(defaultStartTime || '21:00');
  const [endTime, setEndTime] = useState(defaultEndTime || '23:30');
  const [mode, setMode] = useState<SquadSession['mode']>('Classic');
  const [map, setMap] = useState<SquadSession['map']>('Erangel');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [notes, setNotes] = useState('');
  
  // Starting players: creator + preselected players
  const initialPlayerIds = Array.from(new Set([currentUser.id, ...preselectedPlayerIds]));
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialPlayerIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePlayer = (userId: string) => {
    // Creator is always included
    if (userId === currentUser.id) return;
    if (selectedPlayerIds.includes(userId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== userId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, userId]);
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
      // Map player details
      const players = selectedPlayerIds.map((pId) => {
        const u = allUsers.find((x) => x.id === pId) || (pId === currentUser.id ? currentUser : null);
        return {
          userId: pId,
          userName: u ? u.name : 'Teammate',
          userColor: u?.avatarColor || '#10B981',
          userPhotoUrl: u?.photoUrl || '',
          role: u?.role || 'Assault',
          joinedAt: Date.now(),
        };
      });

      await onSave({
        hostUserId: currentUser.id,
        hostUserName: currentUser.name,
        title: title.trim() || 'BGMI Squad Session',
        date,
        startTime,
        endTime,
        mode,
        map,
        maxPlayers,
        notes: notes.trim(),
        players,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create session. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide uppercase text-white">
                Create Squad Session
              </h3>
              <p className="text-xs text-zinc-400">
                Lock in a match time with your squad
              </p>
            </div>
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
              Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conqueror Rank Push, Weekend Custom War"
              maxLength={40}
              required
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3.5 py-2 text-sm outline-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Map and Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Map
              </label>
              <select
                value={map}
                onChange={(e) => setMap(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              >
                {MAP_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                Game Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3 py-2 text-sm outline-none"
              >
                {MODE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Squad Size Limit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Target Squad Size
              </label>
              <span className="text-xs font-bold text-amber-400">{maxPlayers} Players</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setMaxPlayers(size)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition ${
                    maxPlayers === size
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {size === 2 ? 'Duo (2)' : size === 4 ? 'Squad (4)' : size === 6 ? 'Team (6)' : 'Custom (8)'}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Players Selection */}
          {allUsers.length > 1 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
                Pre-add Teammates ({selectedPlayerIds.length}/{maxPlayers})
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-zinc-800/40 rounded-xl border border-zinc-800">
                {allUsers.map((u) => {
                  const isHost = u.id === currentUser.id;
                  const isSelected = selectedPlayerIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => togglePlayer(u.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                          : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: u.avatarColor || '#10B981' }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span>{u.name}</span>
                      {isHost && <span className="text-[10px] text-amber-400 font-bold">(Host)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
              Mission Brief / Notes <span className="text-zinc-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring Discord mic, hot drops only at Pochinki!"
              maxLength={100}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-3.5 py-2 text-sm outline-none placeholder:text-zinc-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Publish Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
