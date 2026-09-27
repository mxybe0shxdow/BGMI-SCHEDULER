import React from 'react';
import { ActivityLogEntry } from '../types';
import { timeAgo } from '../utils/dateUtils';
import { UserAvatar } from './UserAvatar';
import {
  History,
  PlusCircle,
  Edit,
  Trash2,
  Gamepad2,
  UserCheck,
  UserX,
  Activity,
  ShieldAlert,
  UserMinus,
} from 'lucide-react';

interface Props {
  activities: ActivityLogEntry[];
}

export const ActivityLog: React.FC<Props> = ({ activities }) => {
  const getActionBadge = (action: ActivityLogEntry['action']) => {
    switch (action) {
      case 'add_availability':
        return {
          icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          label: 'Availability Added',
        };
      case 'edit_availability':
        return {
          icon: <Edit className="w-4 h-4 text-blue-400" />,
          color: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
          label: 'Availability Changed',
        };
      case 'delete_availability':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-400" />,
          color: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
          label: 'Availability Removed',
        };
      case 'create_session':
        return {
          icon: <Gamepad2 className="w-4 h-4 text-amber-400" />,
          color: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          label: 'Session Created',
        };
      case 'join_session':
        return {
          icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          label: 'Joined Session',
        };
      case 'leave_session':
        return {
          icon: <UserX className="w-4 h-4 text-zinc-400" />,
          color: 'bg-zinc-800 border-zinc-700 text-zinc-300',
          label: 'Left Session',
        };
      case 'delete_session':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-400" />,
          color: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
          label: 'Session Cancelled',
        };
      case 'admin_update_user':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
          color: 'bg-red-500/10 border-red-500/30 text-red-300',
          label: 'Admin: Member Updated',
        };
      case 'admin_delete_user':
        return {
          icon: <UserMinus className="w-4 h-4 text-red-400" />,
          color: 'bg-red-500/10 border-red-500/30 text-red-300',
          label: 'Admin: Member Removed',
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-zinc-400" />,
          color: 'bg-zinc-800 border-zinc-700 text-zinc-300',
          label: 'Action',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            Squad Activity History
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time audit log of all schedule updates, sessions created, and teammate check-ins
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          {activities.length} Events Logged
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="relative border-l-2 border-zinc-800 ml-4 sm:ml-6 space-y-6">
            {activities.map((item) => {
              const badge = getActionBadge(item.action);

              return (
                <div key={item.id} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow">
                    {badge.icon}
                  </div>

                  <div className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-800 rounded-xl p-3.5 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={item.userName}
                          avatarColor={item.userColor}
                          size="xs"
                        />
                        <span className="text-xs font-bold text-white">{item.userName}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <span className="text-[11px] text-zinc-500 font-mono">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 font-normal leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No activity recorded yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
            Whenever anyone adds availability or plans a match, the action will show up here live for everyone.
          </p>
        </div>
      )}
    </div>
  );
};
