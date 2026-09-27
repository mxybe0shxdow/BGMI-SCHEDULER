import React, { useState } from 'react';
import { HelpCircle, Database, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
  isConnected: boolean;
  onClose?: () => void;
}

export const DeploymentHelpModal: React.FC<Props> = ({ isConnected, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<number | null>(null);

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSection = (idx: number) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide uppercase text-white flex items-center gap-2">
                Production Deployment & Database Architecture
              </h3>
              <p className="text-xs text-zinc-400">
                Shared real-time Firestore database verification and hosting setup
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Current Connection Status Banner */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-white">
                Live Shared Database:{' '}
                <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isConnected ? 'Connected & Active (Real-Time Firestore)' : 'Connecting...'}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                All changes, availability slots, and sessions are immediately stored and broadcast to all users.
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Steps Accordion */}
        <div className="mt-5 space-y-3">
          <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-800">
            <h4 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 1. Real-Time Multi-User Synchronization
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              The application uses Firebase Firestore with client snapshot listeners (<code className="text-emerald-400 font-mono">onSnapshot</code>). When Player A marks Friday 9 PM as Available or joins a session, Firestore broadcasts the updated collection state instantly to every other connected device without needing manual reloads.
            </p>
          </div>

          <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-800">
            <h4 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 2. Persistent Collections Schema
            </h4>
            <div className="text-xs text-zinc-300 space-y-1.5 mt-2 font-mono text-[11px]">
              <div>• <strong className="text-white">users:</strong> id, name, avatarColor, role, bgmiId, createdAt</div>
              <div>• <strong className="text-white">availability:</strong> id, userId, userName, date, startTime, endTime, status, note, createdAt, updatedAt</div>
              <div>• <strong className="text-white">sessions:</strong> id, hostUserId, hostUserName, title, date, startTime, endTime, mode, map, maxPlayers, players[], createdAt</div>
              <div>• <strong className="text-white">activity_log:</strong> id, userId, userName, action, description, metadata, createdAt</div>
            </div>
          </div>

          <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-800">
            <h4 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
              <Database className="w-4 h-4" /> 3. Deploying to Netlify / Vercel / Cloud Run
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed mb-2">
              The project builds a static bundle via <code className="text-emerald-400 font-mono">npm run build</code>. Frontend client configuration keys are public-safe (Firebase API keys are client-identifiers, with security managed by <code className="text-emerald-400 font-mono">firestore.rules</code>).
            </p>
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-400 flex items-center justify-between">
              <span>npm run build</span>
              <button
                onClick={() => copySnippet('build', 'npm run build')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copied === 'build' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Got it, Let's Squad Up
          </button>
        </div>
      </div>
    </div>
  );
};
