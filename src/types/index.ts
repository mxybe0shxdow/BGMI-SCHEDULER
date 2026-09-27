export type AvailabilityStatus = 'available' | 'maybe' | 'busy';

export interface SquadUser {
  id: string;
  name: string;
  avatarColor: string;
  bgmiId?: string;
  role?: 'Assault' | 'Sniper' | 'Support' | 'IGL' | 'All-Rounder';
  createdAt: number;
}

export interface AvailabilityEntry {
  id: string;
  userId: string;
  userName: string;
  userColor?: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM in 24-hr format (e.g. "20:00")
  endTime: string; // HH:MM in 24-hr format (e.g. "23:00")
  status: AvailabilityStatus;
  preferredMaps?: string[];
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionPlayer {
  userId: string;
  userName: string;
  userColor?: string;
  role?: string;
  joinedAt: number;
}

export interface SquadSession {
  id: string;
  hostUserId: string;
  hostUserName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  mode: 'Classic' | 'Ranked' | 'Custom Room' | 'Arena / TDM' | 'Scrims' | 'Other';
  map: 'Erangel' | 'Miramar' | 'Sanhok' | 'Livik' | 'Vikendi' | 'Karakin' | 'Any Map';
  maxPlayers: number;
  notes?: string;
  players: SessionPlayer[];
  createdAt: number;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  userColor?: string;
  action: 'add_availability' | 'edit_availability' | 'delete_availability' | 'create_session' | 'join_session' | 'leave_session' | 'delete_session';
  description: string;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface SquadTimeSlotAnalysis {
  date: string;
  timeSlot: string; // "20:00"
  displayTime: string; // "8:00 PM"
  availableUsers: { id: string; name: string; color: string; note?: string; preferredMaps?: string[] }[];
  maybeUsers: { id: string; name: string; color: string; note?: string; preferredMaps?: string[] }[];
  busyUsers: { id: string; name: string; color: string }[];
  score: number; // weighted score
}
