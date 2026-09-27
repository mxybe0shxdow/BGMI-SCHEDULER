import React, { useState } from 'react';
import { SquadUser } from '../types';
import { SQUAD_COLORS } from '../utils/dateUtils';
import { compressImageFile } from '../utils/imageUtils';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Camera,
  Lock,
  Key,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Props {
  currentUser: SquadUser;
  onSave: (updates: Partial<SquadUser>) => Promise<void>;
  onSwitchUser: () => void;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<Props> = ({
  currentUser,
  onSave,
  onSwitchUser,
  onClose,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [bgmiId, setBgmiId] = useState(currentUser.bgmiId || '');
  const [role, setRole] = useState<SquadUser['role']>(currentUser.role || 'Assault');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#10B981');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentUser.photoUrl);

  // Password fields
  const [hasPassword] = useState(!!currentUser.password);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 200, 200, 0.8);
      setPhotoUrl(compressed);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Player name cannot be empty');
      return;
    }

    // Password validation if updating/setting password
    if (newPassword.trim()) {
      if (hasPassword && currentPasswordInput !== currentUser.password) {
        setError('Current password is incorrect.');
        return;
      }
      if (newPassword.length < 3) {
        setError('New password must be at least 3 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates: Partial<SquadUser> = {
        name: name.trim(),
        bgmiId: bgmiId.trim() || undefined,
        role,
        avatarColor,
        photoUrl: photoUrl || undefined,
      };

      if (newPassword.trim()) {
        updates.password = newPassword.trim();
      }

      await onSave(updates);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={name}
              avatarColor={avatarColor}
              photoUrl={photoUrl}
              size="lg"
            />
            <div>
              <h3 className="text-base font-black uppercase text-white flex items-center gap-1.5">
                Player Profile & Security
                {currentUser.isAdmin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    ADMIN
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                Manage your IGN, avatar photo, BGMI ID & login password
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

        {/* Notifications */}
        {error && (
          <div className="mt-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
          {/* Profile Picture Upload */}
          <div className="p-3.5 bg-zinc-800/40 border border-zinc-800 rounded-xl space-y-2">
            <label className="block text-xs font-semibold uppercase text-zinc-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              Profile Picture
            </label>
            <div className="flex items-center gap-3">
              <UserAvatar
                name={name}
                avatarColor={avatarColor}
                photoUrl={photoUrl}
                size="xl"
              />
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer w-full"
                />
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-zinc-400">Lightweight photo synced to squad</span>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Name & BGMI ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Squad Nickname / IGN *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                BGMI Character ID (Optional)
              </label>
              <input
                type="text"
                value={bgmiId}
                onChange={(e) => setBgmiId(e.target.value)}
                placeholder="e.g. 5123456789"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Role & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Squad Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              >
                {currentUser.isAdmin && <option value="Admin">Admin / Squad Leader</option>}
                <option value="Assault">Assault</option>
                <option value="Sniper">Sniper</option>
                <option value="IGL">IGL</option>
                <option value="Support">Support</option>
                <option value="All-Rounder">All-Rounder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Avatar Accent Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {SQUAD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      avatarColor === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Password Security Section */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                Login Password Configuration
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                hasPassword ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {hasPassword ? 'Password Active' : 'No Password Set'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400">
              {hasPassword
                ? 'Your account is secured with a password. Enter your current password below to change it.'
                : 'Protect your squad profile! Set up a password now so nobody else can take or modify your availability.'}
            </p>

            {hasPassword && (
              <div>
                <label className="block text-xs text-zinc-300 mb-1">
                  Current Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">
                  {hasPassword ? 'New Password' : 'Create Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPassword ? 'Hide password text' : 'Show password text'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchUser();
              }}
              className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Switch / Log out Account
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
