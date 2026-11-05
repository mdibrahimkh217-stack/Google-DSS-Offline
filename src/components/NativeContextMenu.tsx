import { Check, Clipboard, Copy, Scissors, Trash2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { dictionaryService } from '../services/dictionaryService';

interface ContextMenuProps {
  x: number;
  y: number;
  selectedText?: string;
  targetElement?: HTMLElement | null;
  onClose: () => void;
  onPasteText?: (text: string) => void;
  onCut?: () => void;
  onCopy?: () => void;
  onSelectAll?: () => void;
  onReplaceWord?: (oldWord: string, newWord: string) => void;
}

export const NativeContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  selectedText = '',
  targetElement,
  onClose,
  onPasteText,
  onCut,
  onCopy,
  onSelectAll,
  onReplaceWord,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Spell checking evaluation for clicked word
  const activeWord = selectedText.trim() || targetElement?.innerText?.trim() || '';
  const isSingleWord = activeWord.split(/\s+/).length === 1 && activeWord.length > 1;
  const spellCheckResult = isSingleWord ? dictionaryService.checkWord(activeWord) : null;
  const isMisspelled = spellCheckResult && !spellCheckResult.isValid;

  const handleCut = async () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString() : selectedText;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        if (onCut) {
          onCut();
        } else {
          document.execCommand('delete');
        }
      } catch (err) {
        console.warn('Clipboard write error', err);
      }
    }
    onClose();
  };

  const handleCopy = async () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString() : selectedText;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        if (onCopy) onCopy();
      } catch (err) {
        console.warn('Clipboard write error', err);
      }
    }
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (onPasteText) {
        onPasteText(text);
      } else {
        document.execCommand('insertText', false, text);
      }
    } catch (err) {
      console.warn('Clipboard read error, fallback to prompt', err);
      const text = window.prompt('Paste text here:');
      if (text) {
        if (onPasteText) onPasteText(text);
        else document.execCommand('insertText', false, text);
      }
    }
    onClose();
  };

  const handlePastePlainText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const plain = text.replace(/<[^>]*>/g, '');
      if (onPasteText) {
        onPasteText(plain);
      } else {
        document.execCommand('insertText', false, plain);
      }
    } catch {
      handlePaste();
    }
    onClose();
  };

  const handleAddToDict = () => {
    if (activeWord) {
      dictionaryService.addToDictionary(activeWord);
    }
    onClose();
  };

  // Adjust position so it doesn't clip screen boundaries
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 min-w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Spellcheck suggestions if misspelled */}
      {isMisspelled && (
        <div className="px-2 py-1 border-b border-neutral-100 dark:border-neutral-700 mb-1">
          <div className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1 px-1">
            বানান সংশোধন (Suggestions)
          </div>
          {spellCheckResult.suggestions.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {spellCheckResult.suggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => {
                    if (onReplaceWord) onReplaceWord(activeWord, sug);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-left font-medium text-neutral-900 dark:text-neutral-100 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition"
                >
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-neutral-400 px-1 py-0.5 italic">কোনো পরামর্শ পাওয়া যায়নি</div>
          )}
          <button
            onClick={handleAddToDict}
            className="w-full text-left mt-1 px-2 py-1 rounded text-[11px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
          >
            + অভিধানে যোগ করুন (Add to Dictionary)
          </button>
        </div>
      )}

      {/* Native Cut / Copy / Paste actions - No extension required */}
      <button
        onClick={handleCut}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
      >
        <span className="flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5 text-neutral-500" />
          কাট (Cut)
        </span>
        <span className="text-[10px] text-neutral-400">Ctrl+X</span>
      </button>

      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
      >
        <span className="flex items-center gap-2">
          <Copy className="w-3.5 h-3.5 text-neutral-500" />
          কপি (Copy)
        </span>
        <span className="text-[10px] text-neutral-400">Ctrl+C</span>
      </button>

      <button
        onClick={handlePaste}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-blue-600 dark:text-blue-400 font-medium"
      >
        <span className="flex items-center gap-2">
          <Clipboard className="w-3.5 h-3.5 text-blue-500" />
          পেস্ট (Paste)
        </span>
        <span className="text-[10px] text-neutral-400">Ctrl+V</span>
      </button>

      <button
        onClick={handlePastePlainText}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
      >
        <span className="flex items-center gap-2 pl-5.5 text-neutral-600 dark:text-neutral-300">
          ফরম্যাটিং ছাড়া পেস্ট (Paste Plain Text)
        </span>
        <span className="text-[10px] text-neutral-400">Ctrl+Shift+V</span>
      </button>

      <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

      <button
        onClick={() => {
          if (onSelectAll) onSelectAll();
          else document.execCommand('selectAll');
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
      >
        <span>সব নির্বাচন (Select All)</span>
        <span className="text-[10px] text-neutral-400">Ctrl+A</span>
      </button>

      <button
        onClick={() => {
          document.execCommand('delete');
          onClose();
        }}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition"
      >
        <span className="flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
          মুছুন (Delete)
        </span>
        <span className="text-[10px] text-neutral-400">Del</span>
      </button>
    </div>
  );
};
