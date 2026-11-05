import { FileSpreadsheet, FileText, Home, Lock, Minus, Plus, Presentation, ShieldCheck, Square, Unlock, X } from 'lucide-react';
import React from 'react';
import { DocType, TabItem, UIScale } from '../types/suite';

interface WindowFrameProps {
  tabs: TabItem[];
  activeTabId: string | null; // null means Home
  onSelectTab: (tabId: string | null) => void;
  onCloseTab: (tabId: string) => void;
  onNewDoc: (type: DocType) => void;
  isVaultUnlocked: boolean;
  hasVault: boolean;
  onToggleVaultLock: () => void;
  uiScale: UIScale;
  onChangeUiScale: (scale: UIScale) => void;
  onOpenDebModal: () => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewDoc,
  isVaultUnlocked,
  hasVault,
  onToggleVaultLock,
  uiScale,
  onChangeUiScale,
  onOpenDebModal,
}) => {
  const [showNewMenu, setShowNewMenu] = React.useState(false);
  const [showScaleMenu, setShowScaleMenu] = React.useState(false);

  const getTabIcon = (type: DocType) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-3.5 h-3.5 text-[#1a73e8]" />;
      case 'sheet':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-[#188038]" />;
      case 'slide':
        return <Presentation className="w-3.5 h-3.5 text-[#f29900]" />;
    }
  };

  return (
    <header className="no-print bg-[#202124] text-neutral-200 text-xs flex flex-col border-b border-neutral-800 select-none">
      {/* Top Linux Window Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#18191c] border-b border-neutral-800/80">
        {/* Left: App Logo & System Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <span className="font-semibold tracking-tight text-white flex items-center gap-1">
              <span className="text-[#4285f4]">G</span>
              <span className="text-[#ea4335]">o</span>
              <span className="text-[#fbbc05]">o</span>
              <span className="text-[#4285f4]">g</span>
              <span className="text-[#34a853]">l</span>
              <span className="text-[#ea4335]">e</span>
              <span className="text-neutral-300 font-normal ml-1">Workspace Linux Suite</span>
            </span>
            <span className="text-neutral-500 text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700/60">
              Linux Mint / Cinnamon
            </span>
          </div>
        </div>

        {/* Right: Actions, Utilities, and Linux Mint / Cinnamon Window Controls */}
        <div className="flex items-center gap-2">
          {/* Linux .deb Packaging helper button */}
          <button
            onClick={onOpenDebModal}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-[11px]"
            title="Native Linux .deb installer information & build script"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Linux .deb Package</span>
          </button>

          {/* Desktop UI Scaling dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScaleMenu(!showScaleMenu)}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-mono"
              title="Desktop HiDPI and UI Resolution Scaling"
            >
              UI: {uiScale}%
            </button>
            {showScaleMenu && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg py-1 w-28 z-50">
                <div className="px-2 py-1 text-[10px] text-neutral-400 uppercase font-semibold">ডেস্কটপ স্কেল</div>
                {([90, 100, 110, 125, 150] as UIScale[]).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => {
                      onChangeUiScale(scale);
                      setShowScaleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-xs hover:bg-neutral-700 transition ${
                      uiScale === scale ? 'text-blue-400 font-bold' : 'text-neutral-300'
                    }`}
                  >
                    {scale}% {scale === 100 ? '(ডিফল্ট)' : scale > 100 ? '(HiDPI)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vault Lock/Unlock Button */}
          <button
            onClick={onToggleVaultLock}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
              isVaultUnlocked
                ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-amber-950/70 border border-amber-800 text-amber-400 hover:bg-amber-900/60'
            }`}
            title={hasVault ? (isVaultUnlocked ? 'ভল্ট আনলকড (ক্লিক করে লক করুন)' : 'ভল্ট লকড (ক্লিক করে আনলক করুন)') : 'এনক্রিপশন সেটআপ করুন'}
          >
            {isVaultUnlocked ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span>AES-256 ভল্ট</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span>লকড ভল্ট</span>
              </>
            )}
          </button>

          {/* Vertical Divider */}
          <div className="w-px h-4 bg-neutral-700/80 mx-1" />

          {/* Native Linux Mint / Cinnamon Window Controls (Minimize, Maximize, Close on RIGHT side) */}
          <div className="flex items-center gap-1">
            {/* Minimize (_) */}
            <button
              title="Minimize (ছোট করুন)"
              className="w-7 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700/80 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximize / Restore (□) */}
            <button
              title="Maximize / Restore (বড় করুন)"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="w-7 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700/80 transition"
            >
              <Square className="w-3 h-3" />
            </button>

            {/* Close (✕) - Turns red on hover like Cinnamon / Mint */}
            <button
              title="Close (উইন্ডো বন্ধ করুন)"
              onClick={() => {
                if (window.confirm('Google Workspace Offline Suite বন্ধ করতে চান?')) {
                  window.close();
                }
              }}
              className="w-7 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#e81123] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Linux Tab Strip */}
      <div className="flex items-center px-2 pt-1 gap-1 overflow-x-auto bg-[#2b2d30]">
        {/* Home Tab */}
        <button
          onClick={() => onSelectTab(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium transition shrink-0 ${
            activeTabId === null
              ? 'bg-[#f8f9fa] text-neutral-900 shadow-sm'
              : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-blue-500" />
          <span>হোম (Home)</span>
        </button>

        {/* Document Tabs */}
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-medium cursor-pointer transition shrink-0 max-w-56 ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm border-t-2' +
                    (tab.type === 'doc'
                      ? ' border-t-[#1a73e8]'
                      : tab.type === 'sheet'
                      ? ' border-t-[#188038]'
                      : ' border-t-[#f29900]')
                  : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <span className="shrink-0">{getTabIcon(tab.type)}</span>
              <span className="truncate">{tab.title}</span>
              {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="অসংরক্ষিত পরিবর্তন" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="w-4 h-4 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center opacity-60 hover:opacity-100 transition shrink-0 ml-1"
                title="ট্যাব বন্ধ করুন"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add New Tab Button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-700 hover:text-white transition ml-1"
            title="নতুন ডকুমেন্ট বা ট্যাব খুলুন"
          >
            <Plus className="w-4 h-4" />
          </button>

          {showNewMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1.5 w-44 z-50 text-neutral-800 dark:text-neutral-200">
              <button
                onClick={() => {
                  onNewDoc('doc');
                  setShowNewMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
              >
                <FileText className="w-4 h-4 text-[#1a73e8]" />
                <span>নতুন ডক (Google Docs)</span>
              </button>
              <button
                onClick={() => {
                  onNewDoc('sheet');
                  setShowNewMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#188038]" />
                <span>নতুন শিট (Google Sheets)</span>
              </button>
              <button
                onClick={() => {
                  onNewDoc('slide');
                  setShowNewMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
              >
                <Presentation className="w-4 h-4 text-[#f29900]" />
                <span>নতুন স্লাইড (Google Slides)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
