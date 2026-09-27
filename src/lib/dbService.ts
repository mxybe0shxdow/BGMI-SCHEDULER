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
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SquadUser,
  AvailabilityEntry,
  SquadSession,
  ActivityLogEntry,
  SessionPlayer,
} from '../types';

// Admin constants
export const ADMIN_UID = '8999144585';
export const ADMIN_NAME = 'SHXDOW';

/**
 * Clean data before sending to Firestore to avoid:
 * "Unsupported field value: undefined" errors that prevent saving when optional fields are empty
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue; // completely strip undefined properties
    } else if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      result[key] = cleanFirestoreData(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Collection references
const USERS_COL = 'users';
const AVAILABILITY_COL = 'availability';
const SESSIONS_COL = 'sessions';
const ACTIVITY_COL = 'activity_log';

// Default Admin User specification
export const DEFAULT_ADMIN: SquadUser = {
  id: ADMIN_UID,
  name: ADMIN_NAME,
  avatarColor: '#EF4444',
  role: 'Admin',
  bgmiId: '8999144585',
  isAdmin: true,
  createdAt: 1727395200000,
};

// Check if user has admin privileges
export function checkIsAdmin(user: SquadUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.isAdmin === true ||
    user.id === ADMIN_UID ||
    user.name?.toUpperCase() === ADMIN_NAME.toUpperCase() ||
    user.bgmiId === ADMIN_UID ||
    user.role === 'Admin'
  );
}

// --- USERS ---

export function subscribeToUsers(onUpdate: (users: SquadUser[]) => void) {
  const q = query(collection(db, USERS_COL), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    async (snapshot) => {
      const users: SquadUser[] = [];
      let foundAdmin = false;

      snapshot.forEach((doc) => {
        const u = { id: doc.id, ...doc.data() } as SquadUser;
        if (checkIsAdmin(u)) {
          u.isAdmin = true;
          foundAdmin = true;
        }
        users.push(u);
      });

      // If SHXDOW does not exist yet in Firestore, automatically create the admin user
      if (!foundAdmin && snapshot.docs.length >= 0) {
        try {
          await createOrUpdateUser(DEFAULT_ADMIN);
          // Snapshot listener will receive the update automatically
        } catch (err) {
          console.error('Error auto-seeding admin user:', err);
        }
      }

      onUpdate(users);
    },
    (err) => {
      console.error('Error fetching users:', err);
    }
  );
}

export async function createOrUpdateUser(user: SquadUser): Promise<void> {
  const isAdm = checkIsAdmin(user);
  const sanitized = cleanFirestoreData({
    ...user,
    isAdmin: isAdm,
    role: isAdm ? 'Admin' : (user.role || 'Assault'),
  });

  await setDoc(doc(db, USERS_COL, user.id), sanitized, { merge: true });
}

export async function adminUpdateUser(
  targetUserId: string,
  updates: Partial<SquadUser>,
  adminUser: SquadUser
): Promise<void> {
  const docRef = doc(db, USERS_COL, targetUserId);
  const sanitized = cleanFirestoreData({
    ...updates,
  });

  await updateDoc(docRef, sanitized);

  await logActivity({
    userId: adminUser.id,
    userName: adminUser.name,
    userColor: adminUser.avatarColor,
    action: 'admin_update_user',
    description: `Admin ${adminUser.name} updated profile details for user ID ${targetUserId}`,
    metadata: { targetUserId, updates: Object.keys(updates) },
  });
}

export async function adminDeleteUser(
  targetUser: SquadUser,
  adminUser: SquadUser
): Promise<void> {
  // 1. Delete user doc
  await deleteDoc(doc(db, USERS_COL, targetUser.id));

  // 2. Clean up any availability by this user
  try {
    const availQ = query(collection(db, AVAILABILITY_COL), where('userId', '==', targetUser.id));
    const availSnap = await getDocs(availQ);
    for (const d of availSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) {
    console.warn('Non-fatal: Error deleting user availability:', e);
  }

  // 3. Log action
  await logActivity({
    userId: adminUser.id,
    userName: adminUser.name,
    userColor: adminUser.avatarColor,
    action: 'admin_delete_user',
    description: `Admin ${adminUser.name} removed squad member "${targetUser.name}" (${targetUser.id})`,
    metadata: { deletedUserId: targetUser.id, deletedUserName: targetUser.name },
  });
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
  const newEntry: AvailabilityEntry = cleanFirestoreData({
    ...entry,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  });

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
  const sanitized = cleanFirestoreData({
    ...updates,
    updatedAt: now,
  });

  await updateDoc(docRef, sanitized);

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
  const newSession: SquadSession = cleanFirestoreData({
    ...sessionData,
    id: docRef.id,
    createdAt: now,
  });

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

  const newPlayer: SessionPlayer = cleanFirestoreData({
    userId: user.id,
    userName: user.name,
    userColor: user.avatarColor,
    userPhotoUrl: user.photoUrl,
    role: user.role,
    joinedAt: Date.now(),
  });

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
    const cleanEntry = cleanFirestoreData({
      ...entry,
      id: docRef.id,
      createdAt: Date.now(),
    });
    await setDoc(docRef, cleanEntry);
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

