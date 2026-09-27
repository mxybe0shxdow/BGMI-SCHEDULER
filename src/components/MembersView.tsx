import React, { useState } from 'react';
import { AvailabilityEntry, SquadSession, SquadUser } from '../types';
import { formatTime12h, getLocalDateString } from '../utils/dateUtils';
import { Users, Shield, Plus, Calendar, Clock, Crosshair, Award } from 'lucide-react';

interface Props {
  users: SquadUser[];
  availability: AvailabilityEntry[];
  sessions: SquadSession[];
  currentUser: SquadUser | null;
  onSwitchUser: () => void;
  onAddAvailabilityForUser?: (user: SquadUser) => void;
}

export const MembersView: React.FC<Props> = ({
  users,
  availability,
  sessions,
  currentUser,
  onSwitchUser,
}) => {
  const [filterRole, setFilterRole] = useState<string>('all');
  const todayStr = getLocalDateString(new Date());

  const filteredUsers = users.filter((u) => {
    if (filterRole === 'all') return true;
    return u.role === filterRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Squad Roster & Profiles
          </h2>
          <p className="text-xs text-zinc-400">
            Registered squad members, preferred in-game roles, and availability readiness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700/60 text-xs">
            {['all', 'Assault', 'Sniper', 'IGL', 'Support'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1 rounded-lg font-bold transition capitalize cursor-pointer ${
                  filterRole === r
                    ? 'bg-emerald-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={onSwitchUser}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
          >
            Switch Profile
          </button>
        </div>
      </div>

      {/* Grid of squad members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isMe = currentUser?.id === user.id;
          const userAvailabilities = availability.filter((a) => a.userId === user.id);
          const upcomingSlots = userAvailabilities.filter((a) => a.date >= todayStr);
          const userSessions = sessions.filter((s) =>
            s.players.some((p) => p.userId === user.id)
          );

          return (
            <div
              key={user.id}
              className={`rounded-2xl border p-5 shadow-xl transition-all ${
                isMe
                  ? 'bg-gradient-to-br from-zinc-900 to-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/20'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shrink-0"
                    style={{ backgroundColor: user.avatarColor || '#10B981' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <span>{user.name}</span>
                      {isMe && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          You
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {user.role || 'Player'}
                      </span>
                    </div>
                  </div>
                </div>

                {user.bgmiId && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                      BGMI ID
                    </span>
                    <span className="text-xs font-mono text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                      {user.bgmiId}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats for this squad member */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-800/40 rounded-xl border border-zinc-800 mb-4 text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                    Upcoming Ready Slots
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {upcomingSlots.length} slot{upcomingSlots.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-semibold block">
                    Matches Joined
                  </span>
                  <span className="font-bold text-amber-400 text-sm">
                    {userSessions.length} session{userSessions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Latest Availability preview */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                  Next Known Availability
                </span>
                {upcomingSlots.length > 0 ? (
                  <div className="space-y-1.5">
                    {upcomingSlots.slice(0, 2).map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2 rounded-lg bg-zinc-800/50 text-xs border border-zinc-700/50 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                slot.status === 'available'
                                  ? 'bg-emerald-400'
                                  : slot.status === 'maybe'
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="text-zinc-300 font-medium">{slot.date}</span>
                          </div>
                          <span className="font-mono text-zinc-400 text-[11px]">
                            {formatTime12h(slot.startTime)}–{formatTime12h(slot.endTime)}
                          </span>
                        </div>
                        {slot.preferredMaps && slot.preferredMaps.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {slot.preferredMaps.map((m) => (
                              <span
                                key={m}
                                className="px-1 py-0.2 text-[9px] rounded bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 font-semibold"
                              >
                                🗺️ {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-zinc-800/20 border border-dashed border-zinc-800 text-center text-xs text-zinc-600">
                    No upcoming slots posted
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
