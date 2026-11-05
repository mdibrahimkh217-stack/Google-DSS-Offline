import { Check, CheckCircle2, Languages, Minus, Monitor, Plus, ZoomIn } from 'lucide-react';
import React, { useState } from 'react';
import { UIScale } from '../types/suite';

interface BottomZoomBarProps {
  zoom: number;
  onChangeZoom: (zoom: number) => void;
  statusText?: string;
  wordCount?: { words: number; chars: number };
  uiScale: UIScale;
  onChangeUiScale: (scale: UIScale) => void;
  docType?: 'doc' | 'sheet' | 'slide';
}

const PRESET_ZOOMS = [50, 75, 90, 100, 125, 150, 200];

export const BottomZoomBar: React.FC<BottomZoomBarProps> = ({
  zoom,
  onChangeZoom,
  statusText,
  wordCount,
  uiScale,
  onChangeUiScale,
  docType,
}) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showScaleMenu, setShowScaleMenu] = useState(false);

  const handleStepZoom = (delta: number) => {
    const nextZoom = Math.max(50, Math.min(200, zoom + delta));
    onChangeZoom(nextZoom);
  };

  return (
    <footer className="no-print bg-white dark:bg-[#202124] border-t border-neutral-200 dark:border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 select-none z-20 shrink-0">
      {/* Left: Document Telemetry & Statistics */}
      <div className="flex items-center gap-4">
        {/* Autosave status indicator */}
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-[11px]">লোকাল ডিভাইসে সংরক্ষিত (Saved)</span>
        </div>

        {/* Word / Character count for Docs */}
        {docType === 'doc' && wordCount && (
          <div className="hidden sm:flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-700 pl-3 text-neutral-500 font-mono text-[11px]">
            <span>{wordCount.words} শব্দ (Words)</span>
            <span>·</span>
            <span>{wordCount.chars} অক্ষর (Chars)</span>
          </div>
        )}

        {/* Active cell or slide status */}
        {statusText && (
          <div className="hidden md:flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-3 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
            <span>{statusText}</span>
          </div>
        )}

        {/* Bilingual Spellcheck Indicator */}
        <div className="hidden lg:flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-3 text-[11px] text-neutral-500">
          <Languages className="w-3 h-3 text-blue-500" />
          <span>দ্বিভাষিক ডিকশনারি: EN / বাংলা ✓</span>
        </div>
      </div>

      {/* Right: Desktop UI Scaling and Independent Document Zoom Slider */}
      <div className="flex items-center gap-3">
        {/* Desktop UI Scaling Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowScaleMenu(!showScaleMenu)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 transition"
            title="ডেস্কটপ UI রেজোলিউশন স্কেলিং"
          >
            <Monitor className="w-3 h-3 text-neutral-500" />
            <span>UI: {uiScale}%</span>
          </button>

          {showScaleMenu && (
            <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1.5 w-32 z-50">
              <div className="px-3 py-1 text-[10px] text-neutral-400 font-semibold uppercase">ডেস্কটপ রেজোলিউশন</div>
              {([90, 100, 110, 125, 150] as UIScale[]).map((scale) => (
                <button
                  key={scale}
                  onClick={() => {
                    onChangeUiScale(scale);
                    setShowScaleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-750 transition ${
                    uiScale === scale ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/30' : 'text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  <span>{scale}%</span>
                  {uiScale === scale && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />

        {/* Zoom Controls Bar (Independent of browser zoom) */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Out (-) */}
          <button
            onClick={() => handleStepZoom(-10)}
            disabled={zoom <= 50}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 transition"
            title="জুম আউট (Ctrl -)"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Interactive Zoom Slider */}
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={zoom}
            onChange={(e) => onChangeZoom(parseInt(e.target.value, 10))}
            className="w-20 md:w-28 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            title={`ক্যানভাস জুম: ${zoom}%`}
          />

          {/* Zoom In (+) */}
          <button
            onClick={() => handleStepZoom(10)}
            disabled={zoom >= 200}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 transition"
            title="জুম ইন (Ctrl +)"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Preset Percentage Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="px-2 py-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] font-medium min-w-12 text-center"
              title="জুম প্রিসেট নির্বাচন করুন"
            >
              {zoom}%
            </button>

            {showPresetMenu && (
              <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1.5 w-28 z-50">
                <div className="px-3 py-1 text-[10px] text-neutral-400 font-semibold uppercase">ক্যানভাস জুম</div>
                {PRESET_ZOOMS.map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      onChangeZoom(z);
                      setShowPresetMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-750 transition ${
                      zoom === z ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/30' : 'text-neutral-700 dark:text-neutral-200'
                    }`}
                  >
                    <span>{z}%</span>
                    {zoom === z && <Check className="w-3 h-3 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fit to Page Button */}
          <button
            onClick={() => onChangeZoom(100)}
            className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[11px] font-medium transition flex items-center gap-1"
            title="১০০% ক্যানভাস ফিট"
          >
            <ZoomIn className="w-3 h-3" />
            <span>ফিট</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
