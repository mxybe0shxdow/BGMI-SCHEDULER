import React, { useState } from 'react';
import { AvailabilityEntry, SquadSession, SquadUser } from '../types';
import { formatTime12h, getLocalDateString } from '../utils/dateUtils';
import { checkIsAdmin } from '../lib/dbService';
import { UserAvatar } from './UserAvatar';
import { Users, Shield, Plus, Calendar, Clock, Crosshair, Award, ShieldAlert, Edit2, Trash2 } from 'lucide-react';

interface Props {
  users: SquadUser[];
  availability: AvailabilityEntry[];
  sessions: SquadSession[];
  currentUser: SquadUser | null;
  onSwitchUser: () => void;
  onOpenAdminSettings?: () => void;
  onAdminEditUser?: (user: SquadUser) => void;
  onAdminDeleteUser?: (user: SquadUser) => void;
}

export const MembersView: React.FC<Props> = ({
  users,
  availability,
  sessions,
  currentUser,
  onSwitchUser,
  onOpenAdminSettings,
  onAdminEditUser,
  onAdminDeleteUser,
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

        <div className="flex flex-wrap items-center gap-3">
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

          {checkIsAdmin(currentUser) && onOpenAdminSettings && (
            <button
              onClick={onOpenAdminSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Controls
            </button>
          )}

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
                user.isAdmin
                  ? 'bg-gradient-to-br from-zinc-900 to-red-950/20 border-red-500/50 ring-1 ring-red-500/20'
                  : isMe
                  ? 'bg-gradient-to-br from-zinc-900 to-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/20'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={user.name}
                    avatarColor={user.avatarColor}
                    photoUrl={user.photoUrl}
                    size="xl"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{user.name}</span>
                      {user.isAdmin && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                          ADMIN
                        </span>
                      )}
                      {isMe && !user.isAdmin && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold shrink-0">
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

                <div className="text-right shrink-0">
                  {user.bgmiId && (
                    <div className="mb-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                        BGMI ID
                      </span>
                      <span className="text-xs font-mono text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                        {user.bgmiId}
                      </span>
                    </div>
                  )}

                  {/* Admin Direct Action triggers on Member Cards */}
                  {checkIsAdmin(currentUser) && onAdminEditUser && (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <button
                        onClick={() => onAdminEditUser(user)}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Edit User Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {user.id !== currentUser?.id && onAdminDeleteUser && (
                        <button
                          onClick={() => onAdminDeleteUser(user)}
                          className="p-1 rounded bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
