import React, { useState } from 'react';
import { SquadUser } from '../types';
import { getRandomColor, SQUAD_COLORS } from '../utils/dateUtils';
import { compressImageFile } from '../utils/imageUtils';
import { UserAvatar } from './UserAvatar';
import {
  Shield,
  Crosshair,
  Users,
  Sparkles,
  AlertCircle,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Key,
  CheckCircle2,
  X,
  UserPlus,
} from 'lucide-react';

interface Props {
  existingUsers: SquadUser[];
  currentUser?: SquadUser | null;
  onComplete: (user: SquadUser) => Promise<void>;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<Props> = ({
  existingUsers,
  currentUser,
  onComplete,
  onClose,
}) => {
  // Mode: 'select' (choose existing) | 'create' (new user) | 'login_password' | 'setup_password'
  const [mode, setMode] = useState<'select' | 'create' | 'login_password' | 'setup_password'>(
    existingUsers.length > 0 ? 'select' : 'create'
  );

  const [selectedUser, setSelectedUser] = useState<SquadUser | null>(null);

  // New User Form State
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(getRandomColor());
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<SquadUser['role']>('Assault');
  const [bgmiId, setBgmiId] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Existing User Password verification or setup state
  const [enteredPassword, setEnteredPassword] = useState('');
  const [setupPasswordInput, setSetupPasswordInput] = useState('');
  const [setupConfirmPasswordInput, setSetupConfirmPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Photo File Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 200, 200, 0.75);
      setPhotoUrl(compressed);
    } catch (err: any) {
      setError(err?.message || 'Failed to process image');
    }
  };

  // Clicking an existing player in list
  const handlePickExisting = (user: SquadUser) => {
    setSelectedUser(user);
    setError('');
    setEnteredPassword('');
    setSetupPasswordInput('');
    setSetupConfirmPasswordInput('');

    if (user.password && user.password.trim() !== '') {
      setMode('login_password');
    } else {
      // User has no password configured yet -> ask them to set up their password!
      setMode('setup_password');
    }
  };

  // Verify password for existing user
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (enteredPassword !== selectedUser.password) {
      setError('Incorrect password. Please try again or ask Admin SHXDOW to reset it.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onComplete(selectedUser);
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
      setLoading(false);
    }
  };

  // Setup password for existing user who doesn't have one yet
  const handleSaveInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!setupPasswordInput || setupPasswordInput.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    if (setupPasswordInput !== setupConfirmPasswordInput) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updatedUser: SquadUser = {
        ...selectedUser,
        password: setupPasswordInput.trim(),
      };
      await onComplete(updatedUser);
    } catch (err: any) {
      setError(err?.message || 'Failed to save password.');
      setLoading(false);
    }
  };

  // Create brand new player
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your Squad In-Game Name (IGN) or Nickname');
      return;
    }

    // Check duplicate name warning
    const exists = existingUsers.find(
      (u) => u.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(`A player named "${exists.name}" is already registered. If that is you, switch to "Select Player" and log in.`);
      return;
    }

    if (createPassword && createPassword.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    if (createPassword && createPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    // Check if user is SHXDOW or UID 8999144585
    const isAdminUser = trimmed.toUpperCase() === 'SHXDOW' || bgmiId.trim() === '8999144585';

    try {
      const newUser: SquadUser = {
        id: isAdminUser ? '8999144585' : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: trimmed,
        avatarColor: selectedColor,
        photoUrl: photoUrl || undefined,
        role: isAdminUser ? 'Admin' : role,
        isAdmin: isAdminUser,
        bgmiId: bgmiId.trim() ? bgmiId.trim() : undefined,
        password: createPassword.trim() ? createPassword.trim() : undefined,
        createdAt: Date.now(),
      };
      await onComplete(newUser);
    } catch (err: any) {
      setError(err?.message || 'Failed to save identity. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/50 text-white max-h-[92vh] overflow-y-auto">
        {/* Header with Close option if user is already logged in */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-emerald-500/20">
              <Crosshair className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide uppercase text-white flex items-center gap-2">
                Squad Check-in
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  BGMI
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Identify your account, secure your profile & squad schedules
              </p>
            </div>
          </div>

          {currentUser && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: SELECT EXISTING PLAYER */}
        {mode === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Select Your Profile to Log In
              </span>
              <button
                type="button"
                onClick={() => setMode('create')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Create New Player
              </button>
            </div>

            {existingUsers.length === 0 ? (
              <div className="p-8 text-center bg-zinc-800/40 rounded-xl border border-zinc-700/60">
                <p className="text-sm font-bold text-white mb-1">No players registered yet</p>
                <p className="text-xs text-zinc-400 mb-3">Be the first to join the squad board!</p>
                <button
                  onClick={() => setMode('create')}
                  className="px-4 py-2 bg-emerald-500 text-zinc-950 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Create Player Profile
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {existingUsers.map((u) => {
                  const isAdmin = u.isAdmin || u.id === '8999144585' || u.name?.toUpperCase() === 'SHXDOW';
                  const hasPassword = !!u.password;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handlePickExisting(u)}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 hover:bg-emerald-950/40 border border-zinc-700 hover:border-emerald-500 transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          name={u.name}
                          avatarColor={u.avatarColor}
                          photoUrl={u.photoUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{u.name}</span>
                            {isAdmin && (
                              <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold shrink-0">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            {u.role || 'Member'}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {hasPassword ? (
                          <span
                            title="Password Protected"
                            className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 text-xs"
                          >
                            <Lock className="w-3 h-3" />
                          </span>
                        ) : (
                          <span
                            title="Set up password"
                            className="text-[10px] text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                          >
                            Set Key
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: ENTER PASSWORD FOR EXISTING USER */}
        {mode === 'login_password' && selectedUser && (
          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 flex items-center gap-3">
              <UserAvatar
                name={selectedUser.name}
                avatarColor={selectedUser.avatarColor}
                photoUrl={selectedUser.photoUrl}
                size="lg"
              />
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{selectedUser.name}</span>
                  {selectedUser.isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  {selectedUser.role || 'Player'} • ID: {selectedUser.bgmiId || selectedUser.id}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Enter Account Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  {showPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPasswordText ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showPasswordText ? 'text' : 'password'}
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter your squad password..."
                required
                autoFocus
                className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase cursor-pointer"
              >
                Back to Players
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Verifying...' : 'Log In & Squad Up'}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: FIRST-TIME PASSWORD CONFIGURATION FOR EXISTING USER */}
        {mode === 'setup_password' && selectedUser && (
          <form onSubmit={handleSaveInitialPassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block mb-0.5">Set Up Your Account Password</strong>
                Player <strong>{selectedUser.name}</strong> doesn't have a password configured yet. Set a password below to secure your schedule and availability.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Create Password
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  value={setupPasswordInput}
                  onChange={(e) => setSetupPasswordInput(e.target.value)}
                  placeholder="Choose a password (min 3 characters)"
                  required
                  autoFocus
                  className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  value={setupConfirmPasswordInput}
                  onChange={(e) => setSetupConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter password to confirm"
                  required
                  className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Remember this password for future check-ins.</span>
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  {showPasswordText ? 'Hide Password' : 'Show Password'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Saving...' : 'Set Password & Enter'}
              </button>
            </div>
          </form>
        )}

        {/* MODE 4: CREATE NEW PLAYER */}
        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-400">
                New Player Profile
              </span>
              {existingUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Back to Select Player
                </button>
              )}
            </div>

            {/* Profile Picture Upload + Avatar Preview */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex items-center gap-4">
              <UserAvatar
                name={name || 'Player'}
                avatarColor={selectedColor}
                photoUrl={photoUrl}
                size="xl"
              />
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  Upload Profile Picture
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Photo
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Optional. Stored and visible to your squad.
                </span>
              </div>
            </div>

            {/* In-Game Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Squad Nickname / In-Game Name (IGN) <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SHXDOW, Mortal, Dynamo, Viper"
                maxLength={24}
                required
                className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none transition placeholder:text-zinc-500"
              />
            </div>

            {/* BGMI Character ID (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                BGMI Character ID <span className="text-zinc-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={bgmiId}
                onChange={(e) => setBgmiId(e.target.value)}
                placeholder="e.g. 8999144585 (for in-game invites)"
                maxLength={18}
                className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2 text-sm outline-none transition placeholder:text-zinc-500"
              />
            </div>

            {/* Account Password Setup */}
            <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/60 space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Account Login Password <span className="text-zinc-500 font-normal">(Optional but recommended)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Create password"
                  className="bg-zinc-900 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-xs outline-none font-mono"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="bg-zinc-900 border border-zinc-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-xs outline-none font-mono"
                />
              </div>
            </div>

            {/* Squad Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Primary Squad Role
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['Assault', 'Sniper', 'IGL', 'Support', 'All-Rounder'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                      role === r
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Avatar Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Avatar Theme Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {SQUAD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      selectedColor === c
                        ? 'scale-125 border-white ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900'
                        : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black tracking-wide uppercase py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                  Join Squad Board
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
