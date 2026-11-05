import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Download,
  FileDown,
  Highlighter,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Lock,
  Minus,
  Palette,
  Plus,
  Printer,
  Redo,
  Sparkles,
  Table as TableIcon,
  Underline,
  Undo
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { dictionaryService } from '../services/dictionaryService';
import { exportToDocx, exportToPdf } from '../services/officeExportService';
import { DocContent, DocumentItem } from '../types/suite';
import { NativeContextMenu } from './NativeContextMenu';

interface DocsEditorProps {
  document: DocumentItem;
  zoom: number; // 50 to 200
  onUpdateContent: (content: DocContent, isDirty?: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onWordCountChange?: (words: number, characters: number) => void;
  onToggleLock?: () => void;
}

export const DocsEditor: React.FC<DocsEditorProps> = ({
  document: docItem,
  zoom,
  onUpdateContent,
  onUpdateTitle,
  onWordCountChange,
  onToggleLock,
}) => {
  const content = docItem.content as DocContent;
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTitle, setActiveTitle] = useState(docItem.title);
  const [isSpellcheckActive, setIsSpellcheckActive] = useState(true);

  // Native mouse context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
    targetElement: HTMLElement | null;
  } | null>(null);

  // Sync title
  useEffect(() => {
    setActiveTitle(docItem.title);
  }, [docItem.title]);

  // Initial HTML content population
  useEffect(() => {
    if (editorRef.current && content.html) {
      if (editorRef.current.innerHTML !== content.html) {
        editorRef.current.innerHTML = content.html;
      }
      calculateStats();
    }
  }, [docItem.id]);

  const calculateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    if (onWordCountChange) onWordCountChange(words, chars);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onUpdateContent({ ...content, html }, true);
      calculateStats();
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    window.document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Right click handler for mouse Cut/Copy/Paste
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      selectedText,
      targetElement: e.target as HTMLElement,
    });
  };

  // Replace misspelled word from suggestions
  const handleReplaceWord = (oldWord: string, newWord: string) => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(window.document.createTextNode(newWord));
    } else {
      // Global fallback replace
      editorRef.current.innerHTML = editorRef.current.innerHTML.replace(
        new RegExp(oldWord, 'g'),
        newWord
      );
    }
    handleInput();
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #dadce0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #dadce0; padding: 6px 10px; font-weight: 600;">কলাম ১</th>
            <th style="border: 1px solid #dadce0; padding: 6px 10px; font-weight: 600;">কলাম ২</th>
            <th style="border: 1px solid #dadce0; padding: 6px 10px; font-weight: 600;">কলাম ৩</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #dadce0; padding: 6px 10px;">ডাটা ১</td>
            <td style="border: 1px solid #dadce0; padding: 6px 10px;">ডাটা ২</td>
            <td style="border: 1px solid #dadce0; padding: 6px 10px;">ডাটা ৩</td>
          </tr>
          <tr>
            <td style="border: 1px solid #dadce0; padding: 6px 10px;">ডাটা ৪</td>
            <td style="border: 1px solid #dadce0; padding: 6px 10px;">ডাটা ৫</td>
            <td style="border: 1px solid #dadce0; padding: 6px 10px;">ডাটা ৬</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    window.document.execCommand('insertHTML', false, tableHtml);
    handleInput();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-neutral-900 overflow-hidden font-sans select-none">
      {/* Top Google Docs Menubar & Document Title */}
      <div className="no-print bg-white dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Title edit */}
            <input
              type="text"
              value={activeTitle}
              onChange={(e) => {
                setActiveTitle(e.target.value);
                onUpdateTitle(e.target.value);
              }}
              className="text-base font-semibold text-neutral-800 dark:text-neutral-100 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-700 px-2 py-0.5 rounded border border-transparent focus:border-blue-500 focus:outline-none transition max-w-lg"
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
              onClick={() => exportToDocx(docItem)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition"
              title="Download Microsoft Word .docx"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-500" />
              <span>.docx</span>
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

        {/* Menu Items (File, Edit, View, Insert, Format, Tools) */}
        <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-300">
          <button onClick={() => exportToDocx(docItem)} className="hover:text-neutral-900 dark:hover:text-white transition">ফাইল (File)</button>
          <button onClick={() => exec('undo')} className="hover:text-neutral-900 dark:hover:text-white transition">সম্পাদনা (Edit)</button>
          <button onClick={() => setIsSpellcheckActive(!isSpellcheckActive)} className="hover:text-neutral-900 dark:hover:text-white transition">ভিউ (View)</button>
          <button onClick={handleInsertTable} className="hover:text-neutral-900 dark:hover:text-white transition">ইনসার্ট (Insert)</button>
          <button onClick={() => exec('bold')} className="hover:text-neutral-900 dark:hover:text-white transition">ফরম্যাট (Format)</button>
          <button
            onClick={() => {
              const text = editorRef.current?.innerText || '';
              const words = text.trim() ? text.trim().split(/\s+/).length : 0;
              alert(`নথি পরিসংখ্যান:\nশব্দ সংখ্যা: ${words}\nঅক্ষর সংখ্যা: ${text.length}`);
            }}
            className="hover:text-neutral-900 dark:hover:text-white transition"
          >
            টুলস (Tools)
          </button>
        </div>
      </div>

      {/* Primary Formatting Toolbar */}
      <div className="no-print bg-[#edf2fc] dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 px-3 py-1 flex items-center gap-1 flex-wrap shrink-0 text-neutral-700 dark:text-neutral-300 text-xs">
        {/* Undo / Redo */}
        <button onClick={() => exec('undo')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="পূর্বাবস্থা (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('redo')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="পুনরায় করুন (Ctrl+Y)">
          <Redo className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => window.print()} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="প্রিন্ট (Ctrl+P)">
          <Printer className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Headings / Style Dropdown */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') exec('formatBlock', '<p>');
            else if (val === 'h1') exec('formatBlock', '<h1>');
            else if (val === 'h2') exec('formatBlock', '<h2>');
            else if (val === 'h3') exec('formatBlock', '<h3>');
          }}
          className="bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-0.5 text-xs focus:outline-none"
        >
          <option value="p">সাধারণ টেক্সট</option>
          <option value="h1">শিরোনাম ১ (Heading 1)</option>
          <option value="h2">শিরোনাম ২ (Heading 2)</option>
          <option value="h3">শিরোনাম ৩ (Heading 3)</option>
        </select>

        {/* Font Family */}
        <select
          onChange={(e) => exec('fontName', e.target.value)}
          className="bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-0.5 text-xs focus:outline-none w-32"
          defaultValue="Plus Jakarta Sans"
        >
          <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
          <option value="Noto Sans Bengali">বাংলা (Noto Sans)</option>
          <option value="SolaimanLipi, Kalpurush, sans-serif">বাংলা (SolaimanLipi)</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier Monospace</option>
        </select>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Bold, Italic, Underline */}
        <button onClick={() => exec('bold')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold" title="বোল্ড (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('italic')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 italic" title="ইটালিক (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('underline')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 underline" title="আন্ডারলাইন (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </button>

        {/* Text Color / Highlight */}
        <button
          onClick={() => {
            const color = window.prompt('টেক্সট কালার কোড লিখুন (যেমন: #1a73e8, red):', '#1a73e8');
            if (color) exec('foreColor', color);
          }}
          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center"
          title="টেক্সট রঙ"
        >
          <Palette className="w-3.5 h-3.5 text-blue-500" />
        </button>
        <button
          onClick={() => exec('hiliteColor', '#fef08a')}
          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center"
          title="হাইলাইট হলুদ"
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Alignments */}
        <button onClick={() => exec('justifyLeft')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="বামে সাজান">
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('justifyCenter')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="মাঝে সাজান">
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('justifyRight')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="ডানে সাজান">
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('justifyFull')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="জাস্টিফাই">
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Lists & Table */}
        <button onClick={() => exec('insertUnorderedList')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="বুলেট পয়েন্ট">
          <List className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => exec('insertOrderedList')} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="সংখ্যাতালিকা">
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleInsertTable} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="টেবিল তৈরি করুন">
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        {/* Spellcheck Toggle */}
        <button
          onClick={() => setIsSpellcheckActive(!isSpellcheckActive)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ml-auto ${
            isSpellcheckActive ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-neutral-200 text-neutral-500'
          }`}
          title="দ্বিভাষিক বানান পরীক্ষা"
        >
          <Sparkles className="w-3 h-3" />
          <span>বানান পরীক্ষা ({isSpellcheckActive ? 'চালু' : 'বন্ধ'})</span>
        </button>
      </div>

      {/* Margin Ruler (Google Docs style) */}
      <div className="no-print bg-[#f1f3f4] dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700 h-4 flex items-center justify-center relative overflow-hidden text-[9px] text-neutral-400 font-mono">
        <div className="w-[816px] flex justify-between px-2">
          <span>| 1</span>
          <span>| 2</span>
          <span>| 3</span>
          <span>| 4</span>
          <span>| 5</span>
          <span>| 6</span>
          <span>| 7</span>
          <span>| 8</span>
        </div>
      </div>

      {/* Scrollable Document Canvas with Zoom Scaling */}
      <div
        className="flex-1 overflow-auto p-6 md:p-10 flex justify-center bg-[#f0f2f5] dark:bg-neutral-950/80 cursor-text"
        onClick={(e) => {
          if (e.target === e.currentTarget && editorRef.current) {
            editorRef.current.focus();
          }
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.1s ease-out',
          }}
          className="print-area"
        >
          {/* A4 Document Paper Sheet */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onContextMenu={handleContextMenu}
            spellCheck={isSpellcheckActive}
            className="w-[816px] min-h-[1056px] bg-white text-neutral-900 p-16 shadow-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-400 font-sans text-sm leading-relaxed"
            style={{
              boxShadow: '0 1px 3px rgba(60,64,67,0.15), 0 4px 8px 3px rgba(60,64,67,0.08)',
            }}
          />
        </div>
      </div>

      {/* Native Mouse Context Menu for Cut, Copy, Paste & Spell Check */}
      {contextMenu && (
        <NativeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.selectedText}
          targetElement={contextMenu.targetElement}
          onClose={() => setContextMenu(null)}
          onPasteText={(text) => {
            document.execCommand('insertText', false, text);
            handleInput();
          }}
          onCut={() => {
            document.execCommand('delete');
            handleInput();
          }}
          onCopy={() => {}}
          onSelectAll={() => {
            document.execCommand('selectAll');
          }}
          onReplaceWord={handleReplaceWord}
        />
      )}
    </div>
  );
};
