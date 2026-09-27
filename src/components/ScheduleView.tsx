import React, { useState } from 'react';
import { AvailabilityEntry, SquadUser } from '../types';
import {
  formatDayHeader,
  formatTime12h,
  getLocalDateString,
  getWeekDates,
  getUserTimezoneName,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  MapPin,
} from 'lucide-react';

interface Props {
  currentUser: SquadUser | null;
  users: SquadUser[];
  availability: AvailabilityEntry[];
  onAddClick: (date?: string) => void;
  onEditClick: (entry: AvailabilityEntry) => void;
  onQuickToggle: (userId: string, date: string) => void;
}

export const ScheduleView: React.FC<Props> = ({
  currentUser,
  users,
  availability,
  onAddClick,
  onEditClick,
}) => {
  // Week navigation state
  const [currentWeekReference, setCurrentWeekReference] = useState<Date>(new Date());
  const weekDates = getWeekDates(currentWeekReference);
  const tzName = getUserTimezoneName();

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekReference);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekReference(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekReference);
    next.setDate(next.getDate() + 7);
    setCurrentWeekReference(next);
  };

  const handleThisWeek = () => {
    setCurrentWeekReference(new Date());
  };

  // Helper to format week range header
  const weekStartStr = weekDates[0].toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const weekEndStr = weekDates[6].toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Check if reference is current week
  const isCurrentWeek =
    getLocalDateString(weekDates[0]) <= getLocalDateString(new Date()) &&
    getLocalDateString(new Date()) <= getLocalDateString(weekDates[6]);

  // Map of date string -> entries
  const entriesByDateAndUser: Record<string, Record<string, AvailabilityEntry[]>> = {};
  weekDates.forEach((d) => {
    const dStr = getLocalDateString(d);
    entriesByDateAndUser[dStr] = {};
  });

  availability.forEach((entry) => {
    if (entriesByDateAndUser[entry.date]) {
      if (!entriesByDateAndUser[entry.date][entry.userId]) {
        entriesByDateAndUser[entry.date][entry.userId] = [];
      }
      entriesByDateAndUser[entry.date][entry.userId].push(entry);
    }
  });

  // Calculate total available players per day
  const dailyPlayerCounts = weekDates.map((d) => {
    const dStr = getLocalDateString(d);
    const dayMap = entriesByDateAndUser[dStr] || {};
    let availableCount = 0;
    let maybeCount = 0;
    let busyCount = 0;

    Object.values(dayMap).forEach((entries) => {
      const hasAvailable = entries.some((e) => e.status === 'available');
      const hasMaybe = entries.some((e) => e.status === 'maybe');
      const hasBusy = entries.some((e) => e.status === 'busy');

      if (hasAvailable) availableCount++;
      else if (hasMaybe) maybeCount++;
      else if (hasBusy) busyCount++;
    });

    return {
      dateStr: dStr,
      availableCount,
      maybeCount,
      busyCount,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        {/* Navigation & Current Week */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-800 rounded-xl p-1 border border-zinc-700/60">
            <button
              onClick={handlePrevWeek}
              title="Previous Week"
              className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleThisWeek}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                isCurrentWeek
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              title="Next Week"
              className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>
                {weekStartStr} – {weekEndStr}
              </span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Timezone:</span>
              <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {tzName}
              </span>
            </div>
          </div>
        </div>

        {/* Legend & Add button */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 text-xs bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-700/50">
            <span className="flex items-center gap-1 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Maybe
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Busy
            </span>
          </div>

          {currentUser && (
            <button
              onClick={() => onAddClick()}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add Availability
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP MATRIX TABLE (Hidden on small mobile) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-4 px-4 w-44 sticky left-0 bg-zinc-950/90 backdrop-blur z-20">
                  Player / IGN
                </th>
                {weekDates.map((date) => {
                  const { dayName, dayNumber, isToday } = formatDayHeader(date);
                  return (
                    <th
                      key={date.toISOString()}
                      className={`py-3 px-3 text-center min-w-[130px] border-l border-zinc-800/80 ${
                        isToday ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-xs uppercase font-extrabold ${
                            isToday ? 'text-emerald-400' : 'text-zinc-400'
                          }`}
                        >
                          {dayName}
                        </span>
                        <span
                          className={`text-lg font-black mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                              : 'text-zinc-200'
                          }`}
                        >
                          {dayNumber}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Daily Squad Strength Summary Row */}
              <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-xs font-semibold">
                <td className="py-2.5 px-4 sticky left-0 bg-zinc-900/95 backdrop-blur z-10 text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Squad Count
                </td>
                {dailyPlayerCounts.map((count, idx) => (
                  <td
                    key={count.dateStr}
                    className="py-2.5 px-2 text-center border-l border-zinc-800/80"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                      {count.availableCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                          🟢 {count.availableCount}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs font-normal">—</span>
                      )}
                      {count.maybeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                          🟡 {count.maybeCount}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Each Squad Member's Row */}
              {users.map((u) => {
                const isCurrentUser = currentUser?.id === u.id;
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${
                      isCurrentUser ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    {/* User Profile Header Column */}
                    <td className="py-3 px-4 sticky left-0 bg-zinc-900/95 backdrop-blur z-10 border-r border-zinc-800/60">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md"
                          style={{ backgroundColor: u.avatarColor || '#10B981' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{u.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-semibold shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {u.role || 'Member'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Week Days for this user */}
                    {weekDates.map((date) => {
                      const dStr = getLocalDateString(date);
                      const userEntries = entriesByDateAndUser[dStr]?.[u.id] || [];

                      return (
                        <td
                          key={dStr}
                          className="py-2 px-2 border-l border-zinc-800/60 align-top text-center"
                        >
                          {userEntries.length === 0 ? (
                            // Empty slot: if it's the current user, quick click to add
                            isCurrentUser ? (
                              <button
                                onClick={() => onAddClick(dStr)}
                                title={`Add availability for ${dStr}`}
                                className="w-full h-14 rounded-xl border border-dashed border-zinc-700/60 hover:border-emerald-500/60 hover:bg-emerald-500/5 flex flex-col items-center justify-center text-zinc-600 hover:text-emerald-400 transition group cursor-pointer"
                              >
                                <Plus className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition" />
                                <span className="text-[9px] opacity-0 group-hover:opacity-100">
                                  Add
                                </span>
                              </button>
                            ) : (
                              <div className="w-full h-14 flex items-center justify-center text-zinc-700 text-xs">
                                —
                              </div>
                            )
                          ) : (
                            <div className="space-y-1.5">
                              {userEntries.map((entry) => {
                                const canEdit = isCurrentUser;
                                const isAvailable = entry.status === 'available';
                                const isMaybe = entry.status === 'maybe';
                                const isBusy = entry.status === 'busy';

                                return (
                                  <div
                                    key={entry.id}
                                    onClick={() => canEdit && onEditClick(entry)}
                                    title={
                                      canEdit
                                        ? 'Click to edit or delete your availability'
                                        : `${entry.userName}: ${entry.status}`
                                    }
                                    className={`p-2 rounded-xl border text-left transition-all ${
                                      canEdit ? 'cursor-pointer hover:scale-[1.02] shadow-sm' : ''
                                    } ${
                                      isAvailable
                                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                        : isMaybe
                                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="flex items-center gap-1">
                                        {isAvailable && '🟢 Free'}
                                        {isMaybe && '🟡 Maybe'}
                                        {isBusy && '🔴 Busy'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] opacity-90 font-mono mt-0.5">
                                      {formatTime12h(entry.startTime)}–{formatTime12h(entry.endTime)}
                                    </div>
                                    {entry.preferredMaps && entry.preferredMaps.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {entry.preferredMaps.map((m) => (
                                          <span
                                            key={m}
                                            className="px-1 py-0.2 text-[9px] rounded bg-zinc-900/80 text-zinc-200 border border-zinc-700/80 font-semibold"
                                            title={`Preferred map: ${m}`}
                                          >
                                            🗺️ {m}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {entry.note && (
                                      <div className="text-[10px] text-zinc-300 italic truncate mt-0.5">
                                        "{entry.note}"
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <p className="text-sm">No squad members joined yet.</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Check in with your squad name to build the schedule!
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE COMPACT LIST / CARDS VIEW */}
      <div className="block md:hidden space-y-3">
        {weekDates.map((date) => {
          const dStr = getLocalDateString(date);
          const { dayName, dayNumber, fullDate, isToday } = formatDayHeader(date);
          const dayEntries = availability.filter((a) => a.date === dStr);
          const availablePlayers = dayEntries.filter((e) => e.status === 'available');
          const maybePlayers = dayEntries.filter((e) => e.status === 'maybe');
          const busyPlayers = dayEntries.filter((e) => e.status === 'busy');

          return (
            <div
              key={dStr}
              className={`rounded-2xl border transition-all p-4 ${
                isToday
                  ? 'bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                  : 'bg-zinc-900/80 border-zinc-800'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold ${
                      isToday
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span className="text-[10px] uppercase -mb-1">{dayName}</span>
                    <span className="text-sm font-black">{dayNumber}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{fullDate}</span>
                      {isToday && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {availablePlayers.length > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          🟢 {availablePlayers.length} squad member{availablePlayers.length > 1 ? 's' : ''} available
                        </span>
                      ) : (
                        <span>No players marked ready yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {currentUser && (
                  <button
                    onClick={() => onAddClick(dStr)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-950/60 border border-zinc-700 hover:border-emerald-500 text-emerald-400 transition cursor-pointer"
                    title="Add availability for this day"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Day Entries List */}
              <div className="mt-3 space-y-2">
                {dayEntries.length === 0 ? (
                  <div className="py-2 text-center text-xs text-zinc-600">
                    No availability registered for this day
                  </div>
                ) : (
                  dayEntries.map((entry) => {
                    const isCurrentUser = currentUser?.id === entry.userId;
                    const isAvailable = entry.status === 'available';
                    const isMaybe = entry.status === 'maybe';

                    return (
                      <div
                        key={entry.id}
                        onClick={() => isCurrentUser && onEditClick(entry)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                          isCurrentUser ? 'cursor-pointer hover:border-emerald-400' : ''
                        } ${
                          isAvailable
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                            : isMaybe
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                            : 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                            style={{ backgroundColor: entry.userColor || '#10B981' }}
                          >
                            {entry.userName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{entry.userName}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] opacity-80 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {formatTime12h(entry.startTime)} – {formatTime12h(entry.endTime)}
                            </div>
                            {entry.preferredMaps && entry.preferredMaps.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.preferredMaps.map((m) => (
                                  <span
                                    key={m}
                                    className="px-1.5 py-0.5 text-[9px] rounded bg-zinc-900/80 text-zinc-300 border border-zinc-700/80 font-medium"
                                  >
                                    🗺️ {m}
                                  </span>
                                ))}
                              </div>
                            )}
                            {entry.note && (
                              <div className="text-[10px] italic text-zinc-300 mt-0.5">
                                "{entry.note}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              isAvailable
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : isMaybe
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
