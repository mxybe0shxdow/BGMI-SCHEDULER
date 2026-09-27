import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SquadUser,
  AvailabilityEntry,
  SquadSession,
  ActivityLogEntry,
  SessionPlayer,
} from '../types';

// Collection references
const USERS_COL = 'users';
const AVAILABILITY_COL = 'availability';
const SESSIONS_COL = 'sessions';
const ACTIVITY_COL = 'activity_log';

// --- USERS ---

export function subscribeToUsers(onUpdate: (users: SquadUser[]) => void) {
  const q = query(collection(db, USERS_COL), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const users: SquadUser[] = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as SquadUser);
      });
      onUpdate(users);
    },
    (err) => {
      console.error('Error fetching users:', err);
    }
  );
}

export async function createOrUpdateUser(user: SquadUser): Promise<void> {
  await setDoc(doc(db, USERS_COL, user.id), {
    ...user,
  }, { merge: true });
}

// --- AVAILABILITY ---

export function subscribeToAvailability(onUpdate: (items: AvailabilityEntry[]) => void) {
  const q = query(collection(db, AVAILABILITY_COL), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AvailabilityEntry[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AvailabilityEntry);
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error fetching availability:', err);
    }
  );
}

export async function addAvailability(
  entry: Omit<AvailabilityEntry, 'id' | 'createdAt' | 'updatedAt'>,
  user: SquadUser
): Promise<string> {
  const docRef = doc(collection(db, AVAILABILITY_COL));
  const now = Date.now();
  const newEntry: AvailabilityEntry = {
    ...entry,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, newEntry);

  // Log activity
  const mapSuffix = entry.preferredMaps && entry.preferredMaps.length > 0 ? ` [Maps: ${entry.preferredMaps.join(', ')}]` : '';
  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'add_availability',
    description: `${user.name} added availability for ${entry.date} (${entry.startTime}–${entry.endTime}) as ${entry.status}${mapSuffix}`,
    metadata: { availId: docRef.id, date: entry.date, status: entry.status, preferredMaps: entry.preferredMaps || [] },
  });

  return docRef.id;
}

export async function updateAvailability(
  id: string,
  updates: Partial<AvailabilityEntry>,
  user: SquadUser,
  oldSummary?: string
): Promise<void> {
  const docRef = doc(db, AVAILABILITY_COL, id);
  const now = Date.now();
  await updateDoc(docRef, {
    ...updates,
    updatedAt: now,
  });

  // Log activity
  const desc = oldSummary
    ? `${user.name} changed availability: ${oldSummary}`
    : `${user.name} updated availability for ${updates.date || 'a date'}`;

  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'edit_availability',
    description: desc,
    metadata: { availId: id, ...updates },
  });
}

export async function deleteAvailability(
  id: string,
  user: SquadUser,
  details?: string
): Promise<void> {
  await deleteDoc(doc(db, AVAILABILITY_COL, id));

  // Log activity
  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'delete_availability',
    description: `${user.name} removed availability${details ? ` (${details})` : ''}`,
    metadata: { availId: id },
  });
}

// --- SESSIONS ---

export function subscribeToSessions(onUpdate: (sessions: SquadSession[]) => void) {
  const q = query(collection(db, SESSIONS_COL), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: SquadSession[] = [];
      snapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as SquadSession);
      });
      onUpdate(sessions);
    },
    (err) => {
      console.error('Error fetching sessions:', err);
    }
  );
}

export async function createSession(
  sessionData: Omit<SquadSession, 'id' | 'createdAt'>,
  user: SquadUser
): Promise<string> {
  const docRef = doc(collection(db, SESSIONS_COL));
  const now = Date.now();
  const newSession: SquadSession = {
    ...sessionData,
    id: docRef.id,
    createdAt: now,
  };

  await setDoc(docRef, newSession);

  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'create_session',
    description: `${user.name} scheduled a BGMI squad session on ${sessionData.date} (${sessionData.startTime}–${sessionData.endTime}) [${sessionData.map}]`,
    metadata: { sessionId: docRef.id, date: sessionData.date, map: sessionData.map },
  });

  return docRef.id;
}

export async function joinSession(
  session: SquadSession,
  user: SquadUser
): Promise<void> {
  // Prevent duplicate join
  const alreadyJoined = session.players.some((p) => p.userId === user.id);
  if (alreadyJoined) return;

  const newPlayer: SessionPlayer = {
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    role: user.role,
    joinedAt: Date.now(),
  };

  const updatedPlayers = [...session.players, newPlayer];
  await updateDoc(doc(db, SESSIONS_COL, session.id), {
    players: updatedPlayers,
  });

  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'join_session',
    description: `${user.name} joined ${session.title || 'the session'} (${session.date} ${session.startTime})`,
    metadata: { sessionId: session.id, playerCount: updatedPlayers.length },
  });
}

export async function leaveSession(
  session: SquadSession,
  user: SquadUser
): Promise<void> {
  const updatedPlayers = session.players.filter((p) => p.userId !== user.id);
  await updateDoc(doc(db, SESSIONS_COL, session.id), {
    players: updatedPlayers,
  });

  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'leave_session',
    description: `${user.name} left the session for ${session.date}`,
    metadata: { sessionId: session.id, remainingPlayers: updatedPlayers.length },
  });
}

export async function deleteSession(
  session: SquadSession,
  user: SquadUser
): Promise<void> {
  await deleteDoc(doc(db, SESSIONS_COL, session.id));

  await logActivity({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    action: 'delete_session',
    description: `${user.name} cancelled squad session (${session.date} ${session.startTime})`,
    metadata: { sessionId: session.id },
  });
}

// --- ACTIVITY LOG ---

export function subscribeToActivity(
  limitCount: number = 60,
  onUpdate: (logs: ActivityLogEntry[]) => void
) {
  const q = query(
    collection(db, ACTIVITY_COL),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLogEntry[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as ActivityLogEntry);
      });
      onUpdate(logs);
    },
    (err) => {
      console.error('Error fetching activity log:', err);
    }
  );
}

export async function logActivity(
  entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const docRef = doc(collection(db, ACTIVITY_COL));
    await setDoc(docRef, {
      ...entry,
      id: docRef.id,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
