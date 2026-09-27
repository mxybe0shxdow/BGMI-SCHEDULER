import React, { useState, useEffect } from 'react';
import {
  SquadUser,
  AvailabilityEntry,
  SquadSession,
  ActivityLogEntry,
} from './types';
import {
  subscribeToUsers,
  subscribeToAvailability,
  subscribeToSessions,
  subscribeToActivity,
  createOrUpdateUser,
  addAvailability,
  updateAvailability,
  deleteAvailability,
  createSession,
  joinSession,
  leaveSession,
  deleteSession,
} from './lib/dbService';
import { OnboardingModal } from './components/OnboardingModal';
import { AvailabilityModal } from './components/AvailabilityModal';
import { CreateSessionModal } from './components/CreateSessionModal';
import { ScheduleView } from './components/ScheduleView';
import { SquadFinder } from './components/SquadFinder';
import { SessionsList } from './components/SessionsList';
import { ActivityLog } from './components/ActivityLog';
import { MembersView } from './components/MembersView';
import { DeploymentHelpModal } from './components/DeploymentHelpModal';
import { getLocalDateString, getUserTimezoneName } from './utils/dateUtils';
import {
  Calendar,
  Flame,
  Gamepad2,
  History,
  Users,
  Plus,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
  HelpCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

const LOCAL_USER_KEY = 'bgmi_current_user_profile';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'schedule' | 'finder' | 'sessions' | 'activity' | 'members'>('schedule');

  // Real-time Database State
  const [users, setUsers] = useState<SquadUser[]>([]);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [sessions, setSessions] = useState<SquadSession[]>([]);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Current Local User Identity
  const [currentUser, setCurrentUser] = useState<SquadUser | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Modals state
  const [showAvailModal, setShowAvailModal] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<AvailabilityEntry | null>(null);
  const [availModalDefaultDate, setAvailModalDefaultDate] = useState<string | undefined>(undefined);

  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [sessionModalDefaults, setSessionModalDefaults] = useState<{
    date?: string;
    startTime?: string;
    endTime?: string;
    playerIds?: string[];
  }>({});

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Setup Firestore real-time listeners on mount
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    try {
      const unsubUsers = subscribeToUsers((data) => {
        setUsers(data);
        setIsInitialLoading(false);
        setIsConnected(true);
      });

      const unsubAvail = subscribeToAvailability((data) => {
        setAvailability(data);
        setIsConnected(true);
      });

      const unsubSessions = subscribeToSessions((data) => {
        setSessions(data);
        setIsConnected(true);
      });

      const unsubActivity = subscribeToActivity(50, (data) => {
        setActivities(data);
        setIsConnected(true);
      });

      unsubs = [unsubUsers, unsubAvail, unsubSessions, unsubActivity];
    } catch (err) {
      console.error('Failed to subscribe to database:', err);
      setIsConnected(false);
      setIsInitialLoading(false);
    }

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, []);

  // Restore saved identity on this browser
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr) as SquadUser;
        setCurrentUser(parsed);
      } else {
        setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  // Sync currentUser with users collection if remote has updated
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const remoteMatch = users.find((u) => u.id === currentUser.id);
      if (remoteMatch && (remoteMatch.name !== currentUser.name || remoteMatch.avatarColor !== currentUser.avatarColor)) {
        setCurrentUser(remoteMatch);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(remoteMatch));
      }
    }
  }, [users, currentUser]);

  // Handle User Onboarding completion
  const handleCompleteOnboarding = async (user: SquadUser) => {
    await createOrUpdateUser(user);
    setCurrentUser(user);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    setShowOnboarding(false);
  };

  // Switch User Profile handler
  const handleSwitchUser = () => {
    setShowOnboarding(true);
  };

  // Quick Open Add Availability
  const handleOpenAddAvailability = (date?: string) => {
    if (!currentUser) {
      setShowOnboarding(true);
      return;
    }
    setEditingEntry(null);
    setAvailModalDefaultDate(date || getLocalDateString(new Date()));
    setShowAvailModal(true);
  };

  // Quick Open Edit Availability
  const handleOpenEditAvailability = (entry: AvailabilityEntry) => {
    if (!currentUser) {
      setShowOnboarding(true);
      return;
    }
    setEditingEntry(entry);
    setShowAvailModal(true);
  };

  // Save new availability
  const handleSaveAvailability = async (
    entryData: Omit<AvailabilityEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) return;
    await addAvailability(entryData, currentUser);
  };

  // Update existing availability
  const handleUpdateAvailability = async (
    id: string,
    updates: Partial<AvailabilityEntry>,
    oldSummary?: string
  ) => {
    if (!currentUser) return;
    await updateAvailability(id, updates, currentUser, oldSummary);
  };

  // Delete availability
  const handleDeleteAvailability = async (id: string, details?: string) => {
    if (!currentUser) return;
    await deleteAvailability(id, currentUser, details);
  };

  // Create session
  const handleSaveSession = async (
    sessionData: Omit<SquadSession, 'id' | 'createdAt'>
  ) => {
    if (!currentUser) return;
    await createSession(sessionData, currentUser);
  };

  // Join session
  const handleJoinSession = async (session: SquadSession) => {
    if (!currentUser) {
      setShowOnboarding(true);
      return;
    }
    await joinSession(session, currentUser);
  };

  // Leave session
  const handleLeaveSession = async (session: SquadSession) => {
    if (!currentUser) return;
    await leaveSession(session, currentUser);
  };

  // Delete session
  const handleDeleteSession = async (session: SquadSession) => {
    if (!currentUser) return;
    await deleteSession(session, currentUser);
  };

  // Turn time slot into planned session
  const handleCreateSessionFromSlot = (slot: {
    date: string;
    startTime: string;
    endTime: string;
    playerIds: string[];
  }) => {
    if (!currentUser) {
      setShowOnboarding(true);
      return;
    }
    setSessionModalDefaults(slot);
    setShowSessionModal(true);
  };

  // Compute calculated live dashboard statistics
  const todayStr = getLocalDateString(new Date());
  const upcomingSessions = sessions.filter((s) => s.date >= todayStr);
  const totalSquadMembers = users.length;
  
  // Available players today
  const todayAvailabilities = availability.filter(
    (a) => a.date === todayStr && a.status === 'available'
  );
  const todayUniquePlayerIds = new Set(todayAvailabilities.map((a) => a.userId));
  const availablePlayersTodayCount = todayUniquePlayerIds.size;

  // Next Squad Session
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-400 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/20">
              <Gamepad2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-white">
                  BGMI Squad Scheduler
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 -mt-0.5 hidden xs:block">
                Find the perfect time to squad up.
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule
            </button>

            <button
              onClick={() => setActiveTab('finder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'finder'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Squad Times
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              Sessions
              {upcomingSessions.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 rounded-full font-black ${
                    activeTab === 'sessions'
                      ? 'bg-zinc-950 text-emerald-400'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {upcomingSessions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Activity
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Members
              <span
                className={`text-[10px] px-1.5 rounded-full font-bold ${
                  activeTab === 'members'
                    ? 'bg-zinc-950 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {users.length}
              </span>
            </button>
          </nav>

          {/* User Profile Badge / Check-in button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpModal(true)}
              title="Deployment & Database Status"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer hidden sm:flex items-center gap-1 text-xs"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[11px] font-mono text-zinc-300">Live</span>
            </button>

            {currentUser ? (
              <button
                onClick={handleSwitchUser}
                title="Click to switch player profile"
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 p-1.5 pr-3 rounded-xl transition cursor-pointer"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow"
                  style={{ backgroundColor: currentUser.avatarColor || '#10B981' }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-white leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium leading-tight">
                    {currentUser.role || 'Member'}
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Squad Check-in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD STATS BAR */}
      <section className="bg-zinc-900/60 border-b border-zinc-800/80 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Squad Members */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block truncate">
                  Squad Members
                </span>
                <span className="text-base font-black text-white">
                  {totalSquadMembers}
                </span>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block truncate">
                  Upcoming Sessions
                </span>
                <span className="text-base font-black text-amber-400">
                  {upcomingSessions.length}
                </span>
              </div>
            </div>

            {/* Ready Players Today */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block truncate">
                  Available Today
                </span>
                <span className="text-base font-black text-emerald-400">
                  {availablePlayersTodayCount} Players
                </span>
              </div>
            </div>

            {/* Next Squad Session */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3 col-span-2 sm:col-span-1 lg:col-span-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block truncate">
                  Next Squad Match
                </span>
                <div className="text-xs font-black text-white truncate">
                  {nextSession ? (
                    <span>
                      {nextSession.date} • {nextSession.startTime} ({nextSession.map})
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-normal">None scheduled yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* Connection Notice banner if offline */}
        {!isConnected && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-amber-200 text-xs">
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Real-time connection is synchronizing. Any changes will automatically reflect once online.
            </span>
          </div>
        )}

        {/* Tab 1: Schedule */}
        {activeTab === 'schedule' && (
          <ScheduleView
            currentUser={currentUser}
            users={users}
            availability={availability}
            onAddClick={handleOpenAddAvailability}
            onEditClick={handleOpenEditAvailability}
            onQuickToggle={() => {}}
          />
        )}

        {/* Tab 2: Best Squad Times */}
        {activeTab === 'finder' && (
          <SquadFinder
            availability={availability}
            users={users}
            currentUser={currentUser}
            onCreateSessionFromSlot={handleCreateSessionFromSlot}
          />
        )}

        {/* Tab 3: Planned Sessions */}
        {activeTab === 'sessions' && (
          <SessionsList
            sessions={sessions}
            currentUser={currentUser}
            onJoin={handleJoinSession}
            onLeave={handleLeaveSession}
            onDelete={handleDeleteSession}
            onCreateClick={() => {
              if (!currentUser) {
                setShowOnboarding(true);
                return;
              }
              setSessionModalDefaults({});
              setShowSessionModal(true);
            }}
          />
        )}

        {/* Tab 4: Activity Log */}
        {activeTab === 'activity' && <ActivityLog activities={activities} />}

        {/* Tab 5: Squad Members */}
        {activeTab === 'members' && (
          <MembersView
            users={users}
            availability={availability}
            sessions={sessions}
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'schedule'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('finder')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'finder'
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Best Times</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition relative ${
              activeTab === 'sessions'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Sessions</span>
            {upcomingSessions.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'activity'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'members'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Members</span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showOnboarding && (
        <OnboardingModal
          existingUsers={users}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {showAvailModal && currentUser && (
        <AvailabilityModal
          currentUser={currentUser}
          initialEntry={editingEntry}
          defaultDate={availModalDefaultDate}
          onSave={handleSaveAvailability}
          onUpdate={handleUpdateAvailability}
          onDelete={handleDeleteAvailability}
          onClose={() => {
            setShowAvailModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {showSessionModal && currentUser && (
        <CreateSessionModal
          currentUser={currentUser}
          allUsers={users}
          defaultDate={sessionModalDefaults.date}
          defaultStartTime={sessionModalDefaults.startTime}
          defaultEndTime={sessionModalDefaults.endTime}
          preselectedPlayerIds={sessionModalDefaults.playerIds}
          onSave={handleSaveSession}
          onClose={() => {
            setShowSessionModal(false);
            setSessionModalDefaults({});
          }}
        />
      )}

      {showHelpModal && (
        <DeploymentHelpModal
          isConnected={isConnected}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </div>
  );
}
