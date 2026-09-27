import React, { useState } from 'react';
import { SquadUser, SquadSession, AvailabilityEntry } from '../types';
import { UserAvatar } from './UserAvatar';
import { SQUAD_COLORS } from '../utils/dateUtils';
import { compressImageFile } from '../utils/imageUtils';
import {
  Shield,
  ShieldAlert,
  Users,
  X,
  Trash2,
  Edit2,
  Lock,
  Key,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Gamepad2,
  Calendar,
  Save,
} from 'lucide-react';

interface Props {
  adminUser: SquadUser;
  allUsers: SquadUser[];
  allSessions: SquadSession[];
  allAvailability: AvailabilityEntry[];
  initialEditingUser?: SquadUser | null;
  onUpdateUser: (userId: string, updates: Partial<SquadUser>) => Promise<void>;
  onDeleteUser: (user: SquadUser) => Promise<void>;
  onDeleteSession: (session: SquadSession) => Promise<void>;
  onDeleteAvailability: (id: string, details?: string) => Promise<void>;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<Props> = ({
  adminUser,
  allUsers,
  allSessions,
  allAvailability,
  initialEditingUser,
  onUpdateUser,
  onDeleteUser,
  onDeleteSession,
  onDeleteAvailability,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'availability'>('users');
  const [editingUser, setEditingUser] = useState<SquadUser | null>(initialEditingUser || null);

  // Edit form state
  const [editName, setEditName] = useState(initialEditingUser?.name || '');
  const [editBgmiId, setEditBgmiId] = useState(initialEditingUser?.bgmiId || '');
  const [editRole, setEditRole] = useState<SquadUser['role']>(initialEditingUser?.role || 'Assault');
  const [editColor, setEditColor] = useState(initialEditingUser?.avatarColor || '#10B981');
  const [editPhoto, setEditPhoto] = useState<string | undefined>(initialEditingUser?.photoUrl);
  const [editPassword, setEditPassword] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(!!initialEditingUser?.isAdmin);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleStartEdit = (user: SquadUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditBgmiId(user.bgmiId || '');
    setEditRole(user.role || 'Assault');
    setEditColor(user.avatarColor || '#10B981');
    setEditPhoto(user.photoUrl);
    setEditPassword('');
    setEditIsAdmin(!!user.isAdmin);
    setError('');
    setSuccessMsg('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 200, 200, 0.8);
      setEditPhoto(compressed);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photo');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim()) {
      setError('Player name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updates: Partial<SquadUser> = {
        name: editName.trim(),
        bgmiId: editBgmiId.trim() || undefined,
        role: editRole,
        avatarColor: editColor,
        photoUrl: editPhoto,
        isAdmin: editIsAdmin,
      };

      if (editPassword.trim()) {
        updates.password = editPassword.trim();
      }

      await onUpdateUser(editingUser.id, updates);
      setSuccessMsg(`Updated user "${editName.trim()}" successfully.`);
      setTimeout(() => {
        setEditingUser(null);
        setSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<SquadUser | null>(null);
  const [deleteSelfError, setDeleteSelfError] = useState(false);

  const handleDeleteUserClick = (user: SquadUser) => {
    if (user.id === adminUser.id || user.id === '8999144585') {
      setDeleteSelfError(true);
      setTimeout(() => setDeleteSelfError(false), 3000);
      return;
    }
    setDeleteConfirmUser(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const target = deleteConfirmUser;
    setLoading(true);
    try {
      await onDeleteUser(target);
      if (editingUser?.id === target.id) {
        setEditingUser(null);
      }
      setDeleteConfirmUser(null);
      setSuccessMsg(`Squad member "${target.name}" was permanently removed.`);
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wide uppercase text-white">
                  Admin Control Panel
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-black">
                  SHXDOW (UID 8999144585)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Squad moderation, member management, user data editor, and security settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Alert notifications */}
        {deleteSelfError && (
          <div className="mt-3 p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>You cannot delete your own active Admin account (SHXDOW)!</span>
          </div>
        )}
        {deleteConfirmUser && (
          <div className="mt-3 p-4 bg-red-950/90 border border-red-500 rounded-xl text-white text-xs space-y-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-red-200">
                  Confirm Deletion: {deleteConfirmUser.name} ({deleteConfirmUser.id})
                </div>
                <div className="text-zinc-300 mt-1">
                  Are you sure you want to permanently delete this squad member? This will remove their profile and all their availability slots from the shared database.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[11px] tracking-wider transition cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Deleting...' : 'Yes, Delete Member'}
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'users'
                ? 'bg-red-500 text-zinc-950 shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Squad Members ({allUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-red-500 text-zinc-950 shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Sessions ({allSessions.length})
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'availability'
                ? 'bg-red-500 text-zinc-950 shadow-md'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Availability Entries ({allAvailability.length})
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
          {/* TAB 1: USERS */}
          {activeTab === 'users' && !editingUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allUsers.map((user) => {
                  const isCurrentAdmin = user.id === adminUser.id || user.id === '8999144585';
                  const hasPassword = !!user.password;

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isCurrentAdmin
                          ? 'bg-red-950/20 border-red-500/40 ring-1 ring-red-500/20'
                          : 'bg-zinc-800/50 border-zinc-700/60 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          name={user.name}
                          avatarColor={user.avatarColor}
                          photoUrl={user.photoUrl}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-white truncate">
                              {user.name}
                            </span>
                            {user.isAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
                                Admin
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                            <span>Role: <strong className="text-zinc-200">{user.role || 'Player'}</strong></span>
                            {user.bgmiId && (
                              <span>• ID: <code className="text-emerald-400 font-mono text-[11px]">{user.bgmiId}</code></span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                            {hasPassword ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                <Lock className="w-3 h-3" /> Password Protected
                              </span>
                            ) : (
                              <span className="text-amber-400/90 flex items-center gap-1 font-medium">
                                <Key className="w-3 h-3" /> No Password Set
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartEdit(user)}
                          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Edit User Data"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isCurrentAdmin && (
                          <button
                            onClick={() => handleDeleteUserClick(user)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950/80 border border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-300 transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EDIT USER FORM */}
          {activeTab === 'users' && editingUser && (
            <div className="bg-zinc-800/70 border border-zinc-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={editName}
                    avatarColor={editColor}
                    photoUrl={editPhoto}
                    size="lg"
                  />
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Editing Squad Member: {editingUser.name}
                    </h4>
                    <span className="text-xs text-zinc-400 font-mono">ID: {editingUser.id}</span>
                  </div>
                </div>

                <button
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Nickname / In-Game Name (IGN)
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                    />
                  </div>

                  {/* BGMI Character ID */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      BGMI Character ID
                    </label>
                    <input
                      type="text"
                      value={editBgmiId}
                      onChange={(e) => setEditBgmiId(e.target.value)}
                      placeholder="e.g. 8999144585"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Role & Admin Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Squad Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                    >
                      <option value="Admin">Admin / Squad Leader</option>
                      <option value="IGL">IGL (In-Game Leader)</option>
                      <option value="Assault">Assault</option>
                      <option value="Sniper">Sniper</option>
                      <option value="Support">Support</option>
                      <option value="All-Rounder">All-Rounder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Admin Privileges
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={editIsAdmin}
                          onChange={(e) => setEditIsAdmin(e.target.checked)}
                          className="w-4 h-4 rounded text-red-500 focus:ring-red-500"
                        />
                        <span className={editIsAdmin ? 'text-red-400' : 'text-zinc-400'}>
                          Grant full Admin & Moderation Access
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Profile Picture Upload & Color Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-700/60">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-red-400" />
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                      />
                      {editPhoto && (
                        <button
                          type="button"
                          onClick={() => setEditPhoto(undefined)}
                          className="text-xs text-rose-400 hover:underline cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Avatar Color (Fallback)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {SQUAD_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            editColor === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset / Set Password */}
                <div className="pt-2 border-t border-zinc-700/60">
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-red-400" />
                    Reset or Set Player Password
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password, or enter new password..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500 font-mono placeholder:text-zinc-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    As Admin, you can set or reset passwords if a squad member forgets their login code.
                  </p>
                </div>

                {/* Save and Danger Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
                  <button
                    type="button"
                    onClick={() => handleDeleteUserClick(editingUser)}
                    className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete User
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              {allSessions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No sessions scheduled.</div>
              ) : (
                allSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{s.title}</div>
                      <div className="text-xs text-zinc-400">
                        {s.date} • {s.startTime}–{s.endTime} • {s.map} ({s.mode}) • Host: {s.hostUserName}
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1">
                        {s.players.length}/{s.maxPlayers} players joined: {s.players.map((p) => p.userName).join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteSession(s)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950 border border-zinc-700 hover:border-red-500 text-red-400 transition cursor-pointer"
                      title="Cancel Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AVAILABILITY */}
          {activeTab === 'availability' && (
            <div className="space-y-2">
              {allAvailability.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No availability registered.</div>
              ) : (
                allAvailability.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          a.status === 'available'
                            ? 'bg-emerald-400'
                            : a.status === 'maybe'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-white">{a.userName}:</span>
                      <span className="text-zinc-300">{a.date}</span>
                      <span className="font-mono text-zinc-400 text-[11px]">
                        {a.startTime}–{a.endTime}
                      </span>
                      {a.preferredMaps && a.preferredMaps.length > 0 && (
                        <span className="text-emerald-400 text-[10px]">
                          [{a.preferredMaps.join(', ')}]
                        </span>
                      )}
                      {a.note && <span className="text-zinc-400 italic">"{a.note}"</span>}
                    </div>

                    <button
                      onClick={() => onDeleteAvailability(a.id, `${a.userName} on ${a.date}`)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
