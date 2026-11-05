import {
  Bold,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  FileDown,
  Heading,
  Italic,
  Lock,
  Maximize2,
  PaintBucket,
  Play,
  Plus,
  Square,
  Trash2,
  Type
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { exportToPdf, exportToPptx } from '../services/officeExportService';
import { DocumentItem, SlideContent, SlideDeckItem, SlideElement } from '../types/suite';
import { NativeContextMenu } from './NativeContextMenu';

interface SlidesEditorProps {
  document: DocumentItem;
  zoom: number; // 50 to 200
  onUpdateContent: (content: SlideContent, isDirty?: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onStatusChange?: (status: string) => void;
}

export const SlidesEditor: React.FC<SlidesEditorProps> = ({
  document: docItem,
  zoom,
  onUpdateContent,
  onUpdateTitle,
  onStatusChange,
}) => {
  const content = docItem.content as SlideContent;
  const slides = content.slides || [];
  const [activeSlideIndex, setActiveSlideIndex] = useState(content.activeSlideIndex || 0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState(docItem.title);
  const [isPresenting, setIsPresenting] = useState(false);

  // Mouse Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId?: string;
  } | null>(null);

  const currentSlide = slides[activeSlideIndex] || slides[0] || { id: 'default', background: '#ffffff', elements: [] };

  useEffect(() => {
    setActiveTitle(docItem.title);
  }, [docItem.title]);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(`স্লাইড ${activeSlideIndex + 1} / ${slides.length}`);
    }
  }, [activeSlideIndex, slides.length]);

  // Slideshow keyboard navigation (Arrow keys / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresenting) {
        if (e.key === 'F5') {
          e.preventDefault();
          setIsPresenting(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsPresenting(false);
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

  const updateSlides = (newSlides: SlideDeckItem[]) => {
    onUpdateContent({ ...content, slides: newSlides, activeSlideIndex }, true);
  };

  const handleAddSlide = () => {
    const newSlide: SlideDeckItem = {
      id: `slide-${Date.now()}`,
      background: '#ffffff',
      elements: [
        {
          id: `el-${Date.now()}-title`,
          type: 'heading',
          content: 'নতুন স্লাইড শিরোনাম (Title)',
          x: 60,
          y: 60,
          width: 840,
          height: 60,
          fontSize: 28,
          fontColor: '#202124',
          bold: true,
        },
        {
          id: `el-${Date.now()}-body`,
          type: 'text',
          content: 'এখানে বিবরণ লিখুন...',
          x: 60,
          y: 150,
          width: 840,
          height: 80,
          fontSize: 16,
          fontColor: '#3c4043',
        },
      ],
    };
    const newSlides = [...slides, newSlide];
    updateSlides(newSlides);
    setActiveSlideIndex(newSlides.length - 1);
  };

  const handleDuplicateSlide = () => {
    if (!currentSlide) return;
    const cloned: SlideDeckItem = {
      ...currentSlide,
      id: `slide-${Date.now()}`,
      elements: currentSlide.elements.map((el) => ({ ...el, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIndex + 1, 0, cloned);
    updateSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, idx) => idx !== activeSlideIndex);
    updateSlides(newSlides);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const handleAddElement = (type: 'heading' | 'text' | 'shape') => {
    const newElement: SlideElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === 'heading' ? 'নতুন শিরোনাম' : type === 'text' ? 'টেক্সট লিখুন' : '',
      x: 100,
      y: 120,
      width: type === 'shape' ? 140 : 400,
      height: type === 'shape' ? 140 : 50,
      fontSize: type === 'heading' ? 24 : 16,
      fontColor: '#202124',
      bg: type === 'shape' ? '#1a73e8' : undefined,
      shapeType: type === 'shape' ? 'rounded' : undefined,
    };

    const newSlides = [...slides];
    newSlides[activeSlideIndex] = {
      ...currentSlide,
      elements: [...currentSlide.elements, newElement],
    };
    updateSlides(newSlides);
    setSelectedElementId(newElement.id);
  };

  const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
    const newElements = currentSlide.elements.map((el) =>
      el.id === elId ? { ...el, ...updates } : el
    );
    const newSlides = [...slides];
    newSlides[activeSlideIndex] = {
      ...currentSlide,
      elements: newElements,
    };
    updateSlides(newSlides);
  };

  const handleDeleteElement = (elId: string) => {
    const newElements = currentSlide.elements.filter((el) => el.id !== elId);
    const newSlides = [...slides];
    newSlides[activeSlideIndex] = {
      ...currentSlide,
      elements: newElements,
    };
    updateSlides(newSlides);
    setSelectedElementId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-neutral-900 overflow-hidden font-sans select-none">
      {/* Top Google Slides Menubar */}
      <div className="no-print bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={activeTitle}
              onChange={(e) => {
                setActiveTitle(e.target.value);
                onUpdateTitle(e.target.value);
              }}
              className="text-base font-semibold text-neutral-800 dark:text-neutral-100 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-700 px-2 py-0.5 rounded border border-transparent focus:border-amber-500 focus:outline-none transition max-w-lg"
            />
            {docItem.isEncrypted && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-medium">
                <Lock className="w-3 h-3" />
                <span>AES-256 এনক্রিপ্টেড</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-[#f29900] hover:bg-amber-600 text-white transition shadow-sm"
              title="ফুলস্ক্রিন প্রেজেন্টেশন (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>উপস্থাপন (Present)</span>
            </button>
            <button
              onClick={() => exportToPptx(docItem)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition"
              title="Download Microsoft PowerPoint .pptx"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-500" />
              <span>.pptx</span>
            </button>
            <button
              onClick={() => exportToPdf(docItem)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5 text-red-500" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-300">
          <button onClick={() => exportToPptx(docItem)} className="hover:text-neutral-900 dark:hover:text-white transition">ফাইল (File)</button>
          <button onClick={handleDuplicateSlide} className="hover:text-neutral-900 dark:hover:text-white transition">সম্পাদনা (Edit)</button>
          <button onClick={() => setIsPresenting(true)} className="hover:text-neutral-900 dark:hover:text-white transition">ভিউ (View)</button>
          <button onClick={() => handleAddElement('heading')} className="hover:text-neutral-900 dark:hover:text-white transition">ইনসার্ট (Insert)</button>
          <button onClick={handleAddSlide} className="hover:text-neutral-900 dark:hover:text-white transition">স্লাইড (Slide)</button>
        </div>
      </div>

      {/* Slides Action Toolbar */}
      <div className="no-print bg-[#edf2fc] dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 px-3 py-1 flex items-center gap-1 shrink-0 text-neutral-700 dark:text-neutral-300 text-xs flex-wrap">
        <button onClick={handleAddSlide} className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 font-medium text-amber-600" title="নতুন স্লাইড যোগ করুন">
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন স্লাইড</span>
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Insert Elements */}
        <button onClick={() => handleAddElement('heading')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1" title="শিরোনাম যোগ করুন">
          <Heading className="w-3.5 h-3.5 text-blue-500" />
        </button>
        <button onClick={() => handleAddElement('text')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1" title="টেক্সট বক্স যোগ করুন">
          <Type className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-200" />
        </button>
        <button onClick={() => handleAddElement('shape')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1" title="শেপ যোগ করুন">
          <Square className="w-3.5 h-3.5 text-amber-500" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Change Slide Background Color */}
        <button
          onClick={() => {
            const bg = prompt('স্লাইড ব্যাকগ্রাউন্ড কালার লিখুন (যেমন: #1a73e8, #ffffff, #202124):', currentSlide.background);
            if (bg) {
              const newSlides = [...slides];
              newSlides[activeSlideIndex] = { ...currentSlide, background: bg };
              updateSlides(newSlides);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
          title="ব্যাকগ্রাউন্ড পরিবর্তন"
        >
          <PaintBucket className="w-3.5 h-3.5 text-neutral-600" />
          <span>ব্যাকগ্রাউন্ড</span>
        </button>

        {/* Delete selected element */}
        {selectedElementId && (
          <button
            onClick={() => handleDeleteElement(selectedElementId)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-950/60 text-red-600 text-xs ml-auto"
            title="এলিমেন্ট মুছুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>মুছুন</span>
          </button>
        )}
      </div>

      {/* Main Workspace: Left Filmstrip & Center Slide Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Filmstrip */}
        <div className="no-print w-48 bg-[#f1f3f4] dark:bg-neutral-850 border-r border-neutral-300 dark:border-neutral-700 p-3 overflow-y-auto flex flex-col gap-3 shrink-0">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => {
                setActiveSlideIndex(idx);
                setSelectedElementId(null);
              }}
              className={`group flex items-start gap-2 cursor-pointer transition ${
                activeSlideIndex === idx ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span className="text-[11px] font-mono text-neutral-500 font-semibold w-4 mt-1">
                {idx + 1}
              </span>

              <div
                style={{ backgroundColor: s.background || '#ffffff' }}
                className={`w-36 h-20 rounded shadow-xs border relative overflow-hidden transition-all ${
                  activeSlideIndex === idx
                    ? 'border-[#f29900] ring-2 ring-[#f29900]/40'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
              >
                {/* Miniature slide contents */}
                <div className="scale-[0.16] origin-top-left w-[960px] h-[540px] pointer-events-none p-4">
                  {s.elements.map((el) => (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        backgroundColor: el.bg || 'transparent',
                        color: el.fontColor || '#202124',
                        fontSize: `${el.fontSize || 16}px`,
                        fontWeight: el.bold ? 'bold' : 'normal',
                      }}
                    >
                      {el.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddSlide}
            className="w-full py-2 rounded border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:text-neutral-800 hover:border-neutral-400 text-xs flex items-center justify-center gap-1 transition mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>স্লাইড যোগ করুন</span>
          </button>
        </div>

        {/* Central Presentation Canvas with Zoom Scaling */}
        <div
          className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-900 p-8 flex items-center justify-center relative cursor-default"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedElementId(null);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out',
            }}
          >
            {/* 16:9 Slide Canvas (960x540) */}
            <div
              style={{ backgroundColor: currentSlide.background || '#ffffff' }}
              className="w-[960px] h-[540px] shadow-2xl rounded-sm border border-neutral-300 dark:border-neutral-700 relative overflow-hidden"
            >
              {currentSlide.elements.map((el) => {
                const isSelected = selectedElementId === el.id;

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                      setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      backgroundColor: el.bg || 'transparent',
                      color: el.fontColor || '#202124',
                      fontSize: `${el.fontSize || 16}px`,
                      fontWeight: el.bold ? 'bold' : 'normal',
                      borderRadius: el.shapeType === 'rounded' ? '8px' : el.shapeType === 'circle' ? '50%' : '0px',
                    }}
                    className={`cursor-move transition-shadow ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-neutral-400'
                    }`}
                  >
                    <input
                      type="text"
                      value={el.content}
                      onChange={(e) => handleUpdateElement(el.id, { content: e.target.value })}
                      className="w-full h-full bg-transparent px-2 focus:outline-none cursor-text font-sans"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Presentation Mode (F5) */}
      {isPresenting && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none animate-in fade-in duration-200">
          <div
            style={{ backgroundColor: currentSlide.background || '#ffffff' }}
            className="w-[960px] h-[540px] relative rounded shadow-2xl overflow-hidden scale-125"
          >
            {currentSlide.elements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  backgroundColor: el.bg || 'transparent',
                  color: el.fontColor || '#202124',
                  fontSize: `${el.fontSize || 16}px`,
                  fontWeight: el.bold ? 'bold' : 'normal',
                  borderRadius: el.shapeType === 'rounded' ? '8px' : el.shapeType === 'circle' ? '50%' : '0px',
                }}
                className="px-2 font-sans flex items-center"
              >
                {el.content}
              </div>
            ))}
          </div>

          {/* Presentation control bar */}
          <div className="absolute bottom-6 flex items-center gap-4 bg-neutral-900/90 text-white px-5 py-2 rounded-full border border-neutral-700 text-xs">
            <span>স্লাইড {activeSlideIndex + 1} / {slides.length}</span>
            <button
              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40"
            >
              পূর্ববর্তী
            </button>
            <button
              onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={activeSlideIndex === slides.length - 1}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40"
            >
              পরবর্তী
            </button>
            <button
              onClick={() => setIsPresenting(false)}
              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 ml-2"
            >
              বন্ধ (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Mouse Context Menu for Cut/Copy/Paste */}
      {contextMenu && (
        <NativeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onPasteText={(text) => {
            if (contextMenu.elementId) {
              handleUpdateElement(contextMenu.elementId, { content: text });
            } else {
              handleAddElement('text');
            }
          }}
          onCut={() => {
            if (contextMenu.elementId) handleDeleteElement(contextMenu.elementId);
          }}
          onCopy={() => {}}
        />
      )}
    </div>
  );
};
