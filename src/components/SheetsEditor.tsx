import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  DollarSign,
  Download,
  FileDown,
  FunctionSquare,
  Italic,
  Lock,
  PaintBucket,
  Palette,
  Percent,
  Plus,
  Redo,
  Undo
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { exportToPdf, exportToXlsx } from '../services/officeExportService';
import { CellStyle, DocumentItem, SheetCell, SheetContent } from '../types/suite';
import { NativeContextMenu } from './NativeContextMenu';

interface SheetsEditorProps {
  document: DocumentItem;
  zoom: number; // 50 to 200
  onUpdateContent: (content: SheetContent, isDirty?: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onStatusChange?: (status: string) => void;
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_COUNT = 40;

export const SheetsEditor: React.FC<SheetsEditorProps> = ({
  document: docItem,
  zoom,
  onUpdateContent,
  onUpdateTitle,
  onStatusChange,
}) => {
  const content = docItem.content as SheetContent;
  const [activeSheet, setActiveSheet] = useState(content.activeSheet || 'Sheet1');
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [cellInputVal, setCellInputVal] = useState<string>('');
  const [activeTitle, setActiveTitle] = useState(docItem.title);

  // Mouse Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cellId: string;
  } | null>(null);

  // Ensure current sheet exists in content
  const sheets = content.sheets || {};
  const currentSheetCells = sheets[activeSheet] || {};

  useEffect(() => {
    setActiveTitle(docItem.title);
  }, [docItem.title]);

  useEffect(() => {
    const cell = currentSheetCells[selectedCell];
    setCellInputVal(cell?.formula || cell?.raw || '');
    if (onStatusChange) {
      const comp = cell?.computed || cell?.raw || '';
      onStatusChange(`সেল: ${selectedCell} ${comp ? `| মান: ${comp}` : ''}`);
    }
  }, [selectedCell, activeSheet, docItem]);

  // Evaluate simple Excel formula
  const evaluateFormula = (formula: string, cells: { [id: string]: SheetCell }): string => {
    try {
      const f = formula.trim().substring(1).toUpperCase(); // remove '='

      // SUM(A1:A5)
      const sumMatch = f.match(/^SUM\(([A-J])([0-9]+):([A-J])([0-9]+)\)$/);
      if (sumMatch) {
        const startCol = sumMatch[1];
        const startRow = parseInt(sumMatch[2], 10);
        const endCol = sumMatch[3];
        const endRow = parseInt(sumMatch[4], 10);

        let total = 0;
        const colStartIdx = COLUMNS.indexOf(startCol);
        const colEndIdx = COLUMNS.indexOf(endCol);

        for (let c = colStartIdx; c <= colEndIdx; c++) {
          for (let r = startRow; r <= endRow; r++) {
            const id = `${COLUMNS[c]}${r}`;
            const val = parseFloat(cells[id]?.computed || cells[id]?.raw || '0');
            if (!isNaN(val)) total += val;
          }
        }
        return String(total);
      }

      // AVERAGE(A1:A5)
      const avgMatch = f.match(/^(?:AVERAGE|AVG)\(([A-J])([0-9]+):([A-J])([0-9]+)\)$/);
      if (avgMatch) {
        const startCol = avgMatch[1];
        const startRow = parseInt(avgMatch[2], 10);
        const endCol = avgMatch[3];
        const endRow = parseInt(avgMatch[4], 10);

        let sum = 0;
        let count = 0;
        const colStartIdx = COLUMNS.indexOf(startCol);
        const colEndIdx = COLUMNS.indexOf(endCol);

        for (let c = colStartIdx; c <= colEndIdx; c++) {
          for (let r = startRow; r <= endRow; r++) {
            const id = `${COLUMNS[c]}${r}`;
            const val = parseFloat(cells[id]?.computed || cells[id]?.raw || '');
            if (!isNaN(val)) {
              sum += val;
              count++;
            }
          }
        }
        return count > 0 ? (sum / count).toFixed(2) : '0';
      }

      // Simple arithmetic: A1+B1, A1-B1, A1*B1, A1/B1
      const expr = f.replace(/([A-J])([0-9]+)/g, (match) => {
        const val = parseFloat(cells[match]?.computed || cells[match]?.raw || '0');
        return isNaN(val) ? '0' : String(val);
      });

      // Safe arithmetic evaluator (numbers and standard operators only)
      if (/^[0-9.+\-*/ ()]+$/.test(expr)) {
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${expr})`)();
        return String(Number(result.toFixed(2)));
      }

      return '#VALUE!';
    } catch {
      return '#ERROR!';
    }
  };

  const updateCell = (cellId: string, rawVal: string, styleUpdate?: Partial<CellStyle>) => {
    const isFormula = rawVal.startsWith('=');
    const computedVal = isFormula ? evaluateFormula(rawVal, currentSheetCells) : rawVal;

    const existing = currentSheetCells[cellId] || { raw: '' };
    const updatedCell: SheetCell = {
      ...existing,
      raw: rawVal,
      formula: isFormula ? rawVal : undefined,
      computed: computedVal,
      style: styleUpdate ? { ...(existing.style || {}), ...styleUpdate } : existing.style,
    };

    const newSheets = {
      ...sheets,
      [activeSheet]: {
        ...currentSheetCells,
        [cellId]: updatedCell,
      },
    };

    // Re-evaluate dependent formulas in sheet
    Object.keys(newSheets[activeSheet]).forEach((cId) => {
      const cell = newSheets[activeSheet][cId];
      if (cell.formula) {
        cell.computed = evaluateFormula(cell.formula, newSheets[activeSheet]);
      }
    });

    onUpdateContent({ ...content, sheets: newSheets, activeSheet }, true);
  };

  const applyStyleToSelected = (styleUpdate: Partial<CellStyle>) => {
    const existing = currentSheetCells[selectedCell] || { raw: '' };
    updateCell(selectedCell, existing.formula || existing.raw || '', styleUpdate);
  };

  const formatCellValue = (cell?: SheetCell): string => {
    if (!cell) return '';
    const val = cell.computed !== undefined && cell.computed !== '' ? cell.computed : cell.raw;
    if (!val) return '';

    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (cell.style?.format === 'currency') {
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (cell.style?.format === 'percent') {
        return `${(num * 100).toFixed(1)}%`;
      }
      if (cell.style?.format === 'number') {
        return num.toLocaleString();
      }
    }
    return val;
  };

  const handleAddSheet = () => {
    const newName = `Sheet${Object.keys(sheets).length + 1}`;
    const newSheets = {
      ...sheets,
      [newName]: {},
    };
    onUpdateContent({ ...content, sheets: newSheets, activeSheet: newName }, true);
    setActiveSheet(newName);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-neutral-900 overflow-hidden font-sans select-none">
      {/* Top Google Sheets Menubar */}
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
              className="text-base font-semibold text-neutral-800 dark:text-neutral-100 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-700 px-2 py-0.5 rounded border border-transparent focus:border-green-600 focus:outline-none transition max-w-lg"
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
              onClick={() => exportToXlsx(docItem)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition"
              title="Download Microsoft Excel .xlsx"
            >
              <FileDown className="w-3.5 h-3.5 text-green-600" />
              <span>.xlsx</span>
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
          <button onClick={() => exportToXlsx(docItem)} className="hover:text-neutral-900 dark:hover:text-white transition">ফাইল (File)</button>
          <button onClick={() => updateCell(selectedCell, '')} className="hover:text-neutral-900 dark:hover:text-white transition">সম্পাদনা (Edit)</button>
          <button onClick={() => setSelectedCell('A1')} className="hover:text-neutral-900 dark:hover:text-white transition">ভিউ (View)</button>
          <button onClick={() => setCellInputVal('=SUM(B2:B4)')} className="hover:text-neutral-900 dark:hover:text-white transition">ইনসার্ট (Insert)</button>
          <button onClick={() => applyStyleToSelected({ bold: true })} className="hover:text-neutral-900 dark:hover:text-white transition">ফরম্যাট (Format)</button>
          <button onClick={() => alert(`Active Cell: ${selectedCell}\nValue: ${formatCellValue(currentSheetCells[selectedCell])}`)} className="hover:text-neutral-900 dark:hover:text-white transition">ডাটা (Data)</button>
        </div>
      </div>

      {/* Sheets Action Toolbar */}
      <div className="no-print bg-[#edf2fc] dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 px-3 py-1 flex items-center gap-1 shrink-0 text-neutral-700 dark:text-neutral-300 text-xs flex-wrap">
        <button onClick={() => applyStyleToSelected({ bold: !currentSheetCells[selectedCell]?.style?.bold })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold" title="বোল্ড">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => applyStyleToSelected({ italic: !currentSheetCells[selectedCell]?.style?.italic })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 italic" title="ইটালিক">
          <Italic className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Currency & Percent */}
        <button onClick={() => applyStyleToSelected({ format: 'currency', align: 'right' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="মুদ্রা ফরম্যাট ($)">
          <DollarSign className="w-3.5 h-3.5 text-green-600" />
        </button>
        <button onClick={() => applyStyleToSelected({ format: 'percent', align: 'right' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="শতকরা (%)">
          <Percent className="w-3.5 h-3.5 text-blue-600" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Alignment */}
        <button onClick={() => applyStyleToSelected({ align: 'left' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="বামে সারিবদ্ধ">
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => applyStyleToSelected({ align: 'center' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="মাঝে সারিবদ্ধ">
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => applyStyleToSelected({ align: 'right' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="ডানে সারিবদ্ধ">
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        {/* Fill Colors */}
        <button onClick={() => applyStyleToSelected({ bg: '#e8f0fe' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="নীল ব্যাকগ্রাউন্ড">
          <PaintBucket className="w-3.5 h-3.5 text-blue-500" />
        </button>
        <button onClick={() => applyStyleToSelected({ bg: '#e6f4ea' })} className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700" title="সবুজ ব্যাকগ্রাউন্ড">
          <PaintBucket className="w-3.5 h-3.5 text-green-600" />
        </button>
        <button onClick={() => applyStyleToSelected({ bg: undefined })} className="px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px]" title="রং সাফ">
          রং মুছুন
        </button>

        {/* Quick formula helper button */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => {
              setCellInputVal('=SUM(B2:B5)');
              updateCell(selectedCell, '=SUM(B2:B5)');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-[11px] font-semibold"
          >
            <FunctionSquare className="w-3 h-3" />
            <span>=SUM(...)</span>
          </button>
          <button
            onClick={() => {
              setCellInputVal('=AVERAGE(B2:B5)');
              updateCell(selectedCell, '=AVERAGE(B2:B5)');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold"
          >
            <span>=AVERAGE(...)</span>
          </button>
        </div>
      </div>

      {/* Formula Bar (fx) */}
      <div className="no-print bg-white dark:bg-neutral-850 border-b border-neutral-300 dark:border-neutral-700 px-3 py-1 flex items-center gap-2 text-xs shrink-0">
        <div className="w-14 font-mono font-bold text-center bg-neutral-100 dark:bg-neutral-800 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200">
          {selectedCell}
        </div>
        <div className="text-neutral-400 font-serif italic font-bold">fx</div>
        <input
          type="text"
          value={cellInputVal}
          onChange={(e) => {
            setCellInputVal(e.target.value);
            updateCell(selectedCell, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const match = selectedCell.match(/^([A-J])([0-9]+)$/);
              if (match) {
                const nextRow = Math.min(ROW_COUNT, parseInt(match[2], 10) + 1);
                setSelectedCell(`${match[1]}${nextRow}`);
              }
            }
          }}
          placeholder="মান বা সূত্র লিখুন (যেমন: =SUM(B2:B4) অথবা 500)"
          className="flex-1 bg-transparent px-2 py-1 text-xs focus:outline-none font-mono text-neutral-800 dark:text-neutral-100"
        />
      </div>

      {/* Spreadsheet Grid View with Zoom Scaling */}
      <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-900 relative">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${100 / (zoom / 100)}%`,
          }}
        >
          <table className="border-collapse bg-white dark:bg-neutral-850 text-xs w-full select-none">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                <th className="w-12 border border-neutral-300 dark:border-neutral-700 py-1 text-center font-normal text-[11px] bg-neutral-100 dark:bg-neutral-800 sticky left-0 z-10">
                  #
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="min-w-24 border border-neutral-300 dark:border-neutral-700 py-1 text-center font-semibold text-neutral-700 dark:text-neutral-200"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROW_COUNT }, (_, rIdx) => {
                const rowNum = rIdx + 1;
                return (
                  <tr key={rowNum} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    {/* Row Number */}
                    <td className="w-12 border border-neutral-300 dark:border-neutral-700 text-center font-mono text-[11px] text-neutral-500 dark:text-neutral-400 bg-[#f8f9fa] dark:bg-neutral-800 sticky left-0 z-10">
                      {rowNum}
                    </td>

                    {/* Columns A-J */}
                    {COLUMNS.map((col) => {
                      const cellId = `${col}${rowNum}`;
                      const cell = currentSheetCells[cellId];
                      const isSelected = selectedCell === cellId;
                      const formattedVal = formatCellValue(cell);

                      return (
                        <td
                          key={cellId}
                          onClick={() => setSelectedCell(cellId)}
                          onDoubleClick={() => {
                            const input = prompt(`সম্পাদনা করুন ${cellId}:`, cell?.formula || cell?.raw || '');
                            if (input !== null) {
                              setCellInputVal(input);
                              updateCell(cellId, input);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedCell(cellId);
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              cellId,
                            });
                          }}
                          style={{
                            backgroundColor: cell?.style?.bg || (isSelected ? '#e8f0fe' : undefined),
                            color: cell?.style?.color || undefined,
                            textAlign: cell?.style?.align || 'left',
                            fontWeight: cell?.style?.bold ? 'bold' : 'normal',
                            fontStyle: cell?.style?.italic ? 'italic' : 'normal',
                          }}
                          className={`min-w-24 h-7 border border-neutral-300 dark:border-neutral-700 px-2 py-1 font-mono text-neutral-800 dark:text-neutral-100 truncate cursor-cell transition-colors ${
                            isSelected ? 'ring-2 ring-[#188038] ring-inset z-10' : ''
                          }`}
                        >
                          {formattedVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Sheets Tab Bar */}
      <div className="no-print bg-[#f1f3f4] dark:bg-neutral-850 border-t border-neutral-300 dark:border-neutral-700 px-2 py-1 flex items-center gap-1 shrink-0 text-xs">
        <button
          onClick={handleAddSheet}
          className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          title="নতুন শিট যোগ করুন"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto">
          {Object.keys(sheets).map((sName) => (
            <button
              key={sName}
              onClick={() => setActiveSheet(sName)}
              className={`px-3 py-1 rounded-t-md text-xs font-medium transition ${
                activeSheet === sName
                  ? 'bg-white dark:bg-neutral-700 text-[#188038] dark:text-emerald-400 border-b-2 border-b-[#188038] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {sName}
            </button>
          ))}
        </div>
      </div>

      {/* Mouse Right-Click Context Menu for Cut, Copy, Paste in Sheets */}
      {contextMenu && (
        <NativeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={formatCellValue(currentSheetCells[contextMenu.cellId])}
          onClose={() => setContextMenu(null)}
          onPasteText={(text) => {
            setCellInputVal(text);
            updateCell(contextMenu.cellId, text);
          }}
          onCut={() => {
            updateCell(contextMenu.cellId, '');
            setCellInputVal('');
          }}
          onCopy={() => {}}
        />
      )}
    </div>
  );
};
