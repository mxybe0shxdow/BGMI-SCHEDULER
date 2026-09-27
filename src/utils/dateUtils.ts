// Date and time utilities for BGMI Squad Scheduler

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ? minutesStr.padStart(2, '0') : '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

export function formatTimeRange(start24: string, end24: string): string {
  return `${formatTime12h(start24)} – ${formatTime12h(end24)}`;
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get the Monday-Sunday week dates for a given reference date
export function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
  // In Monday-start week: Monday is 0, Sunday is 6
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export function formatDayHeader(date: Date): { dayName: string; dayNumber: string; fullDate: string; isToday: boolean } {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[date.getDay()];
  const dayNumber = String(date.getDate());
  const todayStr = getLocalDateString(new Date());
  const dateStr = getLocalDateString(date);

  const fullDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return {
    dayName,
    dayNumber,
    fullDate,
    isToday: todayStr === dateStr,
  };
}

export function getUserTimezoneName(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Map common timezones to shorthand or clean display
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz === 'Asia/Kolkata') return 'IST';
    // Get short timezone name
    const shortTz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    return shortTz || tz;
  } catch {
    return 'Local';
  }
}

export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

// Pre-defined BGMI squad colors
export const SQUAD_COLORS = [
  '#10B981', // Emerald green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function getRandomColor(): string {
  return SQUAD_COLORS[Math.floor(Math.random() * SQUAD_COLORS.length)];
}
