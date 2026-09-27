import React, { useState, useMemo } from 'react';
import { AvailabilityEntry, SquadTimeSlotAnalysis, SquadUser } from '../types';
import { formatTime12h, getLocalDateString } from '../utils/dateUtils';
import { UserAvatar } from './UserAvatar';
import { Flame, Users, Calendar, ArrowRight, Gamepad2, Filter, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  availability: AvailabilityEntry[];
  users: SquadUser[];
  currentUser: SquadUser | null;
  onCreateSessionFromSlot: (slot: {
    date: string;
    startTime: string;
    endTime: string;
    playerIds: string[];
  }) => void;
}

export const SquadFinder: React.FC<Props> = ({
  availability,
  users,
  currentUser,
  onCreateSessionFromSlot,
}) => {
  const [minPlayers, setMinPlayers] = useState<number>(4);
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'today' | 'all'>('upcoming');

  // Analyze time slots:
  // We divide days into 1-hour blocks from 12:00 to 24:00 (peak gaming slots) and 00:00 to 02:00
  const candidateTimeSlots = useMemo(() => {
    const slots = [
      '14:00', '15:00', '16:00', '17:00', '18:00',
      '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'
    ];

    // Collect all unique dates from today onwards in availability
    const todayStr = getLocalDateString(new Date());
    const uniqueDates = Array.from(new Set(availability.map((a) => a.date)))
      .filter((d) => {
        if (dateFilter === 'today') return d === todayStr;
        if (dateFilter === 'upcoming') return d >= todayStr;
        return true;
      })
      .sort();

    // If no dates from availability, use today + next 6 days
    if (uniqueDates.length === 0) {
      const d = new Date();
      for (let i = 0; i < 5; i++) {
        const cur = new Date(d);
        cur.setDate(d.getDate() + i);
        uniqueDates.push(getLocalDateString(cur));
      }
    }

    const analyses: SquadTimeSlotAnalysis[] = [];

    uniqueDates.forEach((date) => {
      const dayEntries = availability.filter((a) => a.date === date);

      slots.forEach((slotTime) => {
        const availableUsers: { id: string; name: string; color: string; photoUrl?: string; note?: string; preferredMaps?: string[] }[] = [];
        const maybeUsers: { id: string; name: string; color: string; photoUrl?: string; note?: string; preferredMaps?: string[] }[] = [];
        const busyUsers: { id: string; name: string; color: string }[] = [];

          // Check each squad member
          users.forEach((u) => {
            const userEntries = dayEntries.filter((e) => e.userId === u.id);
            // Check if slot falls within any entry
            let userStatus: 'available' | 'maybe' | 'busy' | null = null;
            let userNote: string | undefined;
            let userPreferredMaps: string[] | undefined;

            for (const e of userEntries) {
              // E.g., slotTime: "20:00", entry: 20:00 to 23:00
              if (e.startTime <= slotTime && e.endTime > slotTime) {
                userStatus = e.status;
                userNote = e.note;
                userPreferredMaps = e.preferredMaps;
                break;
              }
            }

            if (userStatus === 'available') {
              availableUsers.push({ id: u.id, name: u.name, color: u.avatarColor, photoUrl: u.photoUrl, note: userNote, preferredMaps: userPreferredMaps });
            } else if (userStatus === 'maybe') {
              maybeUsers.push({ id: u.id, name: u.name, color: u.avatarColor, photoUrl: u.photoUrl, note: userNote, preferredMaps: userPreferredMaps });
            } else if (userStatus === 'busy') {
              busyUsers.push({ id: u.id, name: u.name, color: u.avatarColor });
            }
          });

        // Calculate score: available * 2 + maybe * 1
        const score = availableUsers.length * 2 + maybeUsers.length;

        // Calculate 2-hour session end time for convenience
        const [hStr] = slotTime.split(':');
        const endHour = (parseInt(hStr, 10) + 2) % 24;
        const endSlot = `${String(endHour).padStart(2, '0')}:00`;

        if (availableUsers.length > 0 || maybeUsers.length > 0) {
          analyses.push({
            date,
            timeSlot: slotTime,
            displayTime: `${formatTime12h(slotTime)} – ${formatTime12h(endSlot)}`,
            availableUsers,
            maybeUsers,
            busyUsers,
            score,
          });
        }
      });
    });

    // Sort descending by score, then available count, then date
    return analyses.sort((a, b) => {
      if (b.availableUsers.length !== a.availableUsers.length) {
        return b.availableUsers.length - a.availableUsers.length;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.date.localeCompare(b.date);
    });
  }, [availability, users, dateFilter]);

  // Filter by minimum squad size requested
  const filteredSlots = useMemo(() => {
    return candidateTimeSlots.filter(
      (slot) => slot.availableUsers.length >= minPlayers ||
        (slot.availableUsers.length + slot.maybeUsers.length >= minPlayers && slot.availableUsers.length >= 2)
    );
  }, [candidateTimeSlots, minPlayers]);

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-5 h-5 fill-orange-500 stroke-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white">
                Best Squad Times
              </h2>
              <p className="text-xs text-zinc-400">
                Data-driven match finder: overlaps calculated from everyone's shared availability
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Squad size filter */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
            <Users className="w-4 h-4 text-emerald-400" />
            <label className="text-xs font-semibold text-zinc-300">Min Squad:</label>
            <select
              value={minPlayers}
              onChange={(e) => setMinPlayers(Number(e.target.value))}
              className="bg-zinc-900 text-emerald-400 font-black text-xs rounded-lg px-2 py-1 border border-zinc-700 outline-none cursor-pointer"
            >
              <option value={2}>Duo (2+ players)</option>
              <option value={3}>Trio (3+ players)</option>
              <option value={4}>Full Squad (4+ players)</option>
              <option value={5}>5+ Players</option>
              <option value={6}>Custom War (6+)</option>
            </select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60 text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-orange-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('upcoming')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'upcoming'
                  ? 'bg-orange-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Upcoming Days
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-orange-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Slot List */}
      {filteredSlots.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSlots.map((slot, idx) => {
            const dateObj = new Date(slot.date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            });

            const isTopRanked = idx === 0 && slot.availableUsers.length >= 4;

            // Compute end time 2h later
            const [h] = slot.timeSlot.split(':');
            const endH = String((parseInt(h, 10) + 2) % 24).padStart(2, '0');
            const endSlot = `${endH}:00`;

            const allReadyIds = slot.availableUsers.map((u) => u.id);

            return (
              <div
                key={`${slot.date}-${slot.timeSlot}`}
                className={`relative rounded-2xl border transition-all p-5 ${
                  isTopRanked
                    ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border-amber-500/60 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/30'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-lg'
                }`}
              >
                {/* Badge if full 4-man squad is ready */}
                {slot.availableUsers.length >= 4 && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Full Squad Ready!
                  </div>
                )}

                {/* Day & Time Header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[10px] uppercase text-zinc-400">
                      {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-black text-white">{dateObj.getDate()}</span>
                  </div>

                  <div>
                    <div className="text-base font-black text-white">{formattedDate}</div>
                    <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 font-mono mt-0.5">
                      <span>{slot.displayTime}</span>
                    </div>
                  </div>
                </div>

                {/* Availability Metrics Bar */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>🟢 {slot.availableUsers.length} Available</span>
                  </div>

                  {slot.maybeUsers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold bg-amber-950/50 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-xl">
                      <span>🟡 {slot.maybeUsers.length} Maybe</span>
                    </div>
                  )}

                  {slot.busyUsers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold bg-rose-950/40 border border-rose-500/30 text-rose-300 px-2.5 py-1 rounded-xl">
                      <span>🔴 {slot.busyUsers.length} Busy</span>
                    </div>
                  )}
                </div>

                {/* Player List */}
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Squad Roster for this slot:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.availableUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col gap-0.5 p-1.5 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs font-medium text-emerald-200"
                        title={u.note ? `Note: ${u.note}` : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            name={u.name}
                            avatarColor={u.color}
                            photoUrl={u.photoUrl}
                            size="xs"
                          />
                          <span className="font-semibold">{u.name}</span>
                          {u.note && <span className="text-[10px] text-zinc-400">💬</span>}
                        </div>
                        {u.preferredMaps && u.preferredMaps.length > 0 && (
                          <div className="text-[10px] text-emerald-300/80 font-normal pl-5">
                            🗺️ {u.preferredMaps.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}

                    {slot.maybeUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col gap-0.5 p-1.5 px-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs font-medium text-amber-200"
                        title={u.note ? `Note: ${u.note}` : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            name={u.name}
                            avatarColor={u.color}
                            photoUrl={u.photoUrl}
                            size="xs"
                          />
                          <span className="font-semibold">{u.name} (maybe)</span>
                        </div>
                        {u.preferredMaps && u.preferredMaps.length > 0 && (
                          <div className="text-[10px] text-amber-300/80 font-normal pl-5">
                            🗺️ {u.preferredMaps.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Creation Button */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    Ready to play? Turn into official match:
                  </span>
                  <button
                    onClick={() =>
                      onCreateSessionFromSlot({
                        date: slot.date,
                        startTime: slot.timeSlot,
                        endTime: endSlot,
                        playerIds: allReadyIds,
                      })
                    }
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Create Squad Session
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            No overlapping squad times found for {minPlayers}+ players
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
            Try adjusting the minimum player filter (e.g. to Duo / 2 players) or have teammates add their available hours on the Schedule tab!
          </p>
        </div>
      )}
    </div>
  );
};
