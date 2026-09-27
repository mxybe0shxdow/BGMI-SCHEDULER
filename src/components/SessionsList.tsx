import React, { useState } from 'react';
import { SquadSession, SquadUser } from '../types';
import { formatTime12h, getLocalDateString } from '../utils/dateUtils';
import {
  Gamepad2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  LogOut,
  AlertCircle,
  Share2,
  Copy,
} from 'lucide-react';

interface Props {
  sessions: SquadSession[];
  currentUser: SquadUser | null;
  onJoin: (session: SquadSession) => Promise<void>;
  onLeave: (session: SquadSession) => Promise<void>;
  onDelete: (session: SquadSession) => Promise<void>;
  onCreateClick: () => void;
}

export const SessionsList: React.FC<Props> = ({
  sessions,
  currentUser,
  onJoin,
  onLeave,
  onDelete,
  onCreateClick,
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const todayStr = getLocalDateString(new Date());

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'upcoming') return s.date >= todayStr;
    if (filter === 'past') return s.date < todayStr;
    return true;
  });

  const handleShare = (session: SquadSession) => {
    const text = `🎮 BGMI Squad Session!\n📅 Date: ${session.date}\n⏰ Time: ${formatTime12h(session.startTime)} – ${formatTime12h(session.endTime)}\n🗺️ Map: ${session.map} (${session.mode})\n👑 Host: ${session.hostUserName}\n👥 Squad: ${session.players.map((p) => p.userName).join(', ')} (${session.players.length}/${session.maxPlayers})\nJoin here: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleJoinClick = async (session: SquadSession) => {
    setActionLoading(session.id);
    try {
      await onJoin(session);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveClick = async (session: SquadSession) => {
    setActionLoading(session.id);
    try {
      await onLeave(session);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = async (session: SquadSession) => {
    if (!window.confirm(`Cancel session "${session.title}" on ${session.date}?`)) return;
    setActionLoading(session.id);
    try {
      await onDelete(session);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sessions Header Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-amber-400" />
            Planned BGMI Sessions
          </h2>
          <p className="text-xs text-zinc-400">
            Official squad matches and custom scrims locked into the calendar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700/60 text-xs">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'upcoming'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Upcoming ({sessions.filter((s) => s.date >= todayStr).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({sessions.length})
            </button>
          </div>

          {currentUser && (
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Schedule Session
            </button>
          )}
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSessions.map((session) => {
            const isHost = currentUser?.id === session.hostUserId;
            const hasJoined = currentUser
              ? session.players.some((p) => p.userId === currentUser.id)
              : false;
            const isFull = session.players.length >= session.maxPlayers;
            const isPast = session.date < todayStr;
            const isLoading = actionLoading === session.id;

            return (
              <div
                key={session.id}
                className={`relative rounded-2xl border transition-all p-5 shadow-xl flex flex-col justify-between ${
                  isPast
                    ? 'bg-zinc-900/50 border-zinc-800/60 opacity-70'
                    : 'bg-zinc-900/95 border-zinc-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  {/* Top Bar with Map, Mode & Host */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                          {session.mode}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold">
                          🗺️ {session.map}
                        </span>
                        {isPast && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-[10px]">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white tracking-wide">
                        {session.title}
                      </h3>
                    </div>

                    {/* Share / Copy details button */}
                    <button
                      onClick={() => handleShare(session)}
                      title="Copy match invite text for WhatsApp/Discord"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                    >
                      {copiedId === session.id ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Date, Time & Host details */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-800/40 rounded-xl border border-zinc-800 mb-4 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{session.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-300 font-mono">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-zinc-400 pt-1 border-t border-zinc-800/80">
                      <span className="text-[11px]">Host:</span>
                      <span className="font-semibold text-zinc-200">
                        {session.hostUserName} {isHost && '(You)'}
                      </span>
                    </div>
                  </div>

                  {session.notes && (
                    <div className="text-xs text-zinc-400 italic bg-zinc-800/20 p-2.5 rounded-lg border border-zinc-800/50 mb-4">
                      "{session.notes}"
                    </div>
                  )}

                  {/* Joined Players Roster */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        Roster
                      </span>
                      <span
                        className={`text-xs font-black ${
                          isFull ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {session.players.length} / {session.maxPlayers} Joined
                        {isFull && ' (FULL)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {session.players.map((p) => {
                        const isThisMe = currentUser?.id === p.userId;
                        return (
                          <div
                            key={p.userId}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs ${
                              isThisMe
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0"
                              style={{ backgroundColor: p.userColor || '#10B981' }}
                            >
                              {p.userName.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0 truncate">
                              <span className="font-bold truncate">{p.userName}</span>
                              {isThisMe && (
                                <span className="text-[10px] text-emerald-400 ml-1">(You)</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty slots representation */}
                      {Array.from({
                        length: Math.max(0, session.maxPlayers - session.players.length),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="flex items-center justify-center p-2 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-xs"
                        >
                          + Open Slot
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  {currentUser ? (
                    hasJoined ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex-1 justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ✓ Joined
                        </div>
                        <button
                          onClick={() => handleLeaveClick(session)}
                          disabled={isLoading}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-500 text-zinc-400 hover:text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Leave Session"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Leave
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinClick(session)}
                        disabled={isFull || isPast || isLoading}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                          isFull
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        ) : isFull ? (
                          'Session Full'
                        ) : (
                          'Join Session'
                        )}
                      </button>
                    )
                  ) : (
                    <div className="text-xs text-zinc-500 text-center w-full">
                      Check in to join session
                    </div>
                  )}

                  {/* Host can cancel session */}
                  {isHost && (
                    <button
                      onClick={() => handleDeleteClick(session)}
                      disabled={isLoading}
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-500 text-zinc-400 hover:text-rose-300 transition cursor-pointer"
                      title="Cancel Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No squad sessions planned yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-4">
            Coordinate with your teammates or turn one of the high-availability slots from the Best Times tab into a session!
          </p>
          {currentUser && (
            <button
              onClick={onCreateClick}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              + Create First Session
            </button>
          )}
        </div>
      )}
    </div>
  );
};
