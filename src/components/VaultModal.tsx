import { AlertCircle, CheckCircle2, KeyRound, Lock, Shield, Unlock, X } from 'lucide-react';
import React, { useState } from 'react';

interface VaultModalProps {
  isOpen: boolean;
  hasVault: boolean;
  isUnlocked: boolean;
  onClose: () => void;
  onSetupVault: (password: string) => Promise<void>;
  onUnlockVault: (password: string) => Promise<boolean>;
  onLockVault: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  hasVault,
  isUnlocked,
  onClose,
  onSetupVault,
  onUnlockVault,
  onLockVault,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!hasVault) {
        if (!password || password.length < 4) {
          setError('পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে।');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('পাসওয়ার্ড দুটি মেলেনি। অনুগ্রহ করে আবার চেক করুন।');
          setIsSubmitting(false);
          return;
        }
        await onSetupVault(password);
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        const success = await onUnlockVault(password);
        if (success) {
          setPassword('');
          onClose();
        } else {
          setError('ভুল মাস্টার পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'একটি ত্রুটি হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-neutral-850 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {hasVault ? (isUnlocked ? 'AES-256 এনক্রিপশন ভল্ট সচল' : 'ভল্ট আনলক করুন') : 'মাস্টার পাসওয়ার্ড সেটআপ'}
              </h3>
              <p className="text-[11px] text-neutral-500">১০০% ক্লায়েন্ট-সাইড জিরো-নলেজ এনক্রিপশন</p>
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
        <div className="p-6 space-y-4">
          {isUnlocked ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Unlock className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                আপনার স্থানীয় ফাইলগুলো বর্তমানে আনলক করা রয়েছে এবং নতুন যেকোনো ফাইল স্বয়ংক্রিয়ভাবে AES-256-GCM দ্বারা এনক্রিপ্ট হয়ে ডিভাইসে জমা হচ্ছে।
              </p>
              <button
                onClick={() => {
                  onLockVault();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>এখনই ভল্ট লক করুন (Lock Vault)</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {hasVault
                    ? 'আপনার সুরক্ষিত নথিগুলো দেখতে ও সম্পাদনা করতে মাস্টার পাসওয়ার্ড প্রদান করুন।'
                    : 'একটি শক্তিশালী মাস্টার পাসওয়ার্ড দিন। এই পাসওয়ার্ডটি ব্যবহার করে আপনার সব নথি ডিভাইসেই এনক্রিপ্ট থাকবে।'}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    {hasVault ? 'মাস্টার পাসওয়ার্ড লিখুন' : 'নতুন মাস্টার পাসওয়ার্ড'}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {!hasVault && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'প্রসেসিং...' : hasVault ? 'আনলক করুন' : 'ভল্ট তৈরি করুন'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
