import { Cloud, Download, FileSpreadsheet, FileText, Lock, Plus, Presentation, Search, Shield, Trash2, Unlock, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { exportToDocx, exportToPdf, exportToPptx, exportToXlsx } from '../services/officeExportService';
import { DocType, DocumentItem } from '../types/suite';

interface SuiteHomeProps {
  documents: DocumentItem[];
  onOpenDoc: (doc: DocumentItem) => void;
  onNewDoc: (type: DocType, title?: string) => void;
  onDeleteDoc: (id: string) => void;
  isVaultUnlocked: boolean;
  hasVault: boolean;
  onSetupOrUnlockVault: () => void;
  onOpenGoogleDriveSync: () => void;
}

export const SuiteHome: React.FC<SuiteHomeProps> = ({
  documents,
  onOpenDoc,
  onNewDoc,
  onDeleteDoc,
  isVaultUnlocked,
  hasVault,
  onSetupOrUnlockVault,
  onOpenGoogleDriveSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DocType | 'all'>('all');

  const filteredDocs = documents.filter((doc) => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getDocTypeIcon = (type: DocType) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-5 h-5 text-[#1a73e8]" />;
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-[#188038]" />;
      case 'slide':
        return <Presentation className="w-5 h-5 text-[#f29900]" />;
    }
  };

  const handleExport = (doc: DocumentItem, format: string) => {
    if (format === 'pdf') {
      exportToPdf(doc);
    } else if (doc.type === 'doc') {
      exportToDocx(doc);
    } else if (doc.type === 'sheet') {
      exportToXlsx(doc);
    } else if (doc.type === 'slide') {
      exportToPptx(doc);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa] dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header & Security Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Google Workspace <span className="font-normal text-neutral-500">Offline Suite</span>
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                ১০০% অফলাইন ও ব্যক্তিগত
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              কোনো ক্লাউড বা সার্ভার নির্ভরতা ছাড়া সরাসরি লিনাক্স ডিভাইসে গুগল ডকস, শিটস্ ও স্লাইডস এর সম্পূর্ণ কর্মক্ষমতা।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Optional Google Drive Sync */}
            <button
              onClick={onOpenGoogleDriveSync}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition"
              title="ঐচ্ছিক গুগল ড্রাইভ ব্যাকআপ ও অটো-সিঙ্ক"
            >
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>গুগল ড্রাইভ সিঙ্ক</span>
            </button>

            {/* Master Password Vault Button */}
            <button
              onClick={onSetupOrUnlockVault}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white shadow-sm transition ${
                isVaultUnlocked
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : hasVault
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isVaultUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>AES-256 ভল্ট সচল</span>
                </>
              ) : hasVault ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>ভল্ট আনলক করুন</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>মাস্টার পাসওয়ার্ড সেট করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Start a New Document Shelf */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              নতুন শুরু করুন (Start a New Document)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Blank Document (Docs Blue) */}
            <div
              onClick={() => onNewDoc('doc')}
              className="group cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 p-5 hover:border-[#1a73e8] hover:shadow-md transition flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#1a73e8] mb-3 group-hover:scale-105 transition">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                <span>নতুন ডক (Google Docs)</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-[#1a73e8]" />
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                দ্বিভাষিক স্পেলচেক, টেবিল ও মার্জিন রুলার সহ পূর্ণাঙ্গ ওয়ার্ড প্রসেসর।
              </p>
            </div>

            {/* Blank Sheet (Sheets Green) */}
            <div
              onClick={() => onNewDoc('sheet')}
              className="group cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 p-5 hover:border-[#188038] hover:shadow-md transition flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-950/60 flex items-center justify-center text-[#188038] mb-3 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                <span>নতুন স্প্রেডশিট (Google Sheets)</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-[#188038]" />
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                ফর্মুলা বার (SUM, AVG, IF), সেল ফরম্যাটিং ও এক্সেল .xlsx সাপোর্ট।
              </p>
            </div>

            {/* Blank Slide (Slides Amber) */}
            <div
              onClick={() => onNewDoc('slide')}
              className="group cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 p-5 hover:border-[#f29900] hover:shadow-md transition flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-[#f29900] mb-3 group-hover:scale-105 transition">
                <Presentation className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                <span>নতুন স্লাইড (Google Slides)</span>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-[#f29900]" />
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                ফিল্মস্ট্রিপ, শেপস, ড্র্যাগ অ্যান্ড ড্রপ এবং ফুলস্ক্রিন প্রেজেন্টেশন মোড।
              </p>
            </div>
          </div>
        </section>

        {/* Recent Documents Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              রিসেন্ট ফাইলসমূহ (Recent Documents)
            </h2>

            <div className="flex items-center gap-3">
              {/* Type Filter Buttons */}
              <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  সব ({documents.length})
                </button>
                <button
                  onClick={() => setFilterType('doc')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'doc'
                      ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  ডকস
                </button>
                <button
                  onClick={() => setFilterType('sheet')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'sheet'
                      ? 'bg-white dark:bg-neutral-700 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  শিটস্
                </button>
                <button
                  onClick={() => setFilterType('slide')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === 'slide'
                      ? 'bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  স্লাইডস
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="নথি খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                />
              </div>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center text-neutral-500 dark:text-neutral-400">
              <p className="text-sm font-medium">কোনো ফাইল পাওয়া যায়নি</p>
              <p className="text-xs mt-1">উপরে ক্লিক করে নতুন ডকুমেন্ট, শিট বা স্লাইড তৈরি করুন।</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">ফাইলের নাম</th>
                    <th className="py-2.5 px-4 font-semibold hidden md:table-cell">টাইপ</th>
                    <th className="py-2.5 px-4 font-semibold hidden sm:table-cell">সর্বশেষ পরিবর্তন</th>
                    <th className="py-2.5 px-4 font-semibold">এনক্রিপশন</th>
                    <th className="py-2.5 px-4 font-semibold text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {filteredDocs.map((doc) => {
                    const modifiedStr = new Date(doc.updatedAt).toLocaleDateString('bn-BD', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => onOpenDoc(doc)}
                        className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 font-medium text-neutral-900 dark:text-white">
                            <span className="shrink-0">{getDocTypeIcon(doc.type)}</span>
                            <span className="truncate max-w-xs md:max-w-md">{doc.title}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 hidden md:table-cell text-neutral-500 dark:text-neutral-400 capitalize">
                          {doc.type === 'doc' ? 'Google Doc' : doc.type === 'sheet' ? 'Google Sheet' : 'Google Slide'}
                        </td>

                        <td className="py-3 px-4 hidden sm:table-cell text-neutral-500 dark:text-neutral-400 tabular-nums">
                          {modifiedStr}
                        </td>

                        <td className="py-3 px-4">
                          {doc.isEncrypted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <Lock className="w-3 h-3" />
                              <span>AES-256</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400">সাধারণ</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleExport(doc, 'native')}
                              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition"
                              title={doc.type === 'doc' ? 'Download .docx' : doc.type === 'sheet' ? 'Download .xlsx' : 'Download .pptx'}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleExport(doc, 'pdf')}
                              className="px-1.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold transition"
                              title="Export as PDF"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`"${doc.title}" ডিলিট করতে চান?`)) {
                                  onDeleteDoc(doc.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
