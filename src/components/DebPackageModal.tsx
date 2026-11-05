import { Check, Copy, Download, HardDrive, PackageCheck, Terminal, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { downloadDebianPackageScript } from '../services/officeExportService';

interface DebPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebPackageModal: React.FC<DebPackageModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const terminalCommand = `chmod +x build-deb.sh && ./build-deb.sh
sudo dpkg -i gsuite-offline_1.0.0_amd64.deb
sudo apt-get install -f`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(terminalCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-850 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                নেটিভ লিনাক্স .deb প্যাকেজিং (Native Linux Deb)
              </h3>
              <p className="text-[11px] text-neutral-500">
                ক্রোমিয়াম ছাড়া সরাসরি সিস্টেম WebKitGTK ও GTK3 লাইব্রেরি নির্ভর
              </p>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>মেমোরি খরচ: &lt; ৬০ MB</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                ভারী ব্রাউজার ছাড়া সিস্টেম লাইব্রেরি ব্যবহার করায় কম গতির কম্পিউটারেও সুপার ফাস্ট।
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-800/40">
              <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                <span>প্যাকেজ সাইজ: ~ ৮ MB</span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                ২০০ মেগাবাইটের ক্রোমিয়াম ব্লট বাদ দিয়ে ১০০% লিনাক্স নেটিভ।
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              সিস্টেম ডিপেন্ডেন্সি (Debian System Dependencies):
            </h4>
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
              Depends: libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37, libgtk-3-0, libc6
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                <span>লিনাক্স টার্মিনাল ইনস্টলেশন কমান্ড:</span>
              </span>
              <button
                onClick={handleCopyCommand}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কমান্ড কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              {terminalCommand}
            </pre>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <a
              href="/gsuite-offline_1.0.0_amd64.deb"
              download="gsuite-offline_1.0.0_amd64.deb"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>সরাসরি .deb ফাইল ডাউনলোড করুন (832 KB)</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={downloadDebianPackageScript}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs transition"
                title="build-deb.sh স্ক্রিপ্ট ডাউনলোড করুন"
              >
                <span>বিল্ড স্ক্রিপ্ট</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-xs"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
