import { Check, Cloud, CloudCheck, CloudOff, RefreshCw, Shield, UploadCloud, X } from 'lucide-react';
import React, { useState } from 'react';
import { DocumentItem } from '../types/suite';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  userEmail?: string;
  onSyncComplete?: (message: string) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  documents,
  userEmail = 'md.ibrahim.kh217@gmail.com',
  onSyncComplete,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectToggle = () => {
    if (isConnected) {
      setIsConnected(false);
      setAutoSyncEnabled(false);
    } else {
      setIsConnected(true);
      setLastSyncedTime('এইমাত্র (Just now)');
      if (onSyncComplete) onSyncComplete('গুগল একাউন্ট সফলভাবে যুক্ত হয়েছে।');
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedTime(new Date().toLocaleTimeString('bn-BD'));
      if (onSyncComplete) onSyncComplete(`${documents.length}টি নথি গুগল ড্রাইভে ব্যাকআপ সম্পন্ন হয়েছে।`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-neutral-850 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                গুগল ড্রাইভ সিঙ্ক (Google Drive Sync)
              </h3>
              <p className="text-[11px] text-neutral-500">ঐচ্ছিক ক্লাউড ব্যাকআপ ও টু-ওয়ে সিঙ্ক</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                }`}
              />
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {isConnected ? 'সংযুক্ত রয়েছে (Connected)' : 'অফলাইন মোড (Disconnected)'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {isConnected ? userEmail : 'কোনো ক্লাউড একাউন্ট বাধ্যতামূলক নয়'}
                </div>
              </div>
            </div>

            <button
              onClick={handleConnectToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isConnected
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isConnected ? 'সংযোগ বিচ্ছিন্ন করুন' : 'গুগল যোগ করুন'}
            </button>
          </div>

          {isConnected && (
            <div className="space-y-3 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div>
                  <div className="font-medium text-neutral-900 dark:text-white">অটো-সিঙ্ক (Auto-save to Drive)</div>
                  <div className="text-[11px] text-neutral-500">পরিবর্তন হলেই ড্রাইভে ব্যাকআপ হবে</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {lastSyncedTime && (
                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>সর্বশেষ সিঙ্ক: {lastSyncedTime}</span>
                </div>
              )}

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-semibold text-xs transition flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900/60 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই ড্রাইভে সিঙ্ক করুন (Sync Now)'}</span>
              </button>
            </div>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              গুগল ড্রাইভ সিঙ্ক সম্পূর্ণ ঐচ্ছিক। আপনি চাইলে কখনোই ক্লাউড ব্যবহার না করে শতভাগ অফলাইনে নিরাপদ থাকতে পারেন।
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
