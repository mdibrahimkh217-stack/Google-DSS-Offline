/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BottomZoomBar } from './components/BottomZoomBar';
import { DebPackageModal } from './components/DebPackageModal';
import { DocsEditor } from './components/DocsEditor';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { SheetsEditor } from './components/SheetsEditor';
import { SlidesEditor } from './components/SlidesEditor';
import { SuiteHome } from './components/SuiteHome';
import { VaultModal } from './components/VaultModal';
import { WindowFrame } from './components/WindowFrame';
import { storageService } from './services/storageService';
import { DocContent, DocType, DocumentItem, SheetContent, SlideContent, TabItem, UIScale } from './types/suite';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Desktop Display & Zoom Controls
  const [uiScale, setUiScale] = useState<UIScale>(100);
  const [zoom, setZoom] = useState<number>(100);

  // Status & Telemetry
  const [statusText, setStatusText] = useState<string>('');
  const [wordCount, setWordCount] = useState<{ words: number; chars: number }>({ words: 0, chars: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vault Security State
  const [hasVault, setHasVault] = useState<boolean>(storageService.hasVault());
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(!!storageService.getMasterPassword());
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Other Modals
  const [isDebModalOpen, setIsDebModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);

  // Load initial documents
  useEffect(() => {
    refreshDocuments();
  }, []);

  const refreshDocuments = async () => {
    const list = await storageService.listDocuments();
    setDocuments(list);
  };

  // Sync Desktop UI Scale to document root CSS variable
  useEffect(() => {
    const scaleFactor = uiScale / 100;
    document.documentElement.style.setProperty('--ui-scale', String(scaleFactor));
  }, [uiScale]);

  // Global Keyboard Shortcuts (Ctrl+, Ctrl-, Ctrl0, F11, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((prev) => Math.min(200, prev + 10));
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setZoom((prev) => Math.max(50, prev - 10));
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setZoom(100);
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showToast('লোকাল ডিভাইসে সংরক্ষিত (Saved Locally)');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Tab management
  const handleOpenDoc = (doc: DocumentItem) => {
    const existingTab = tabs.find((t) => t.docId === doc.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: TabItem = {
        id: `tab-${Date.now()}`,
        docId: doc.id,
        title: doc.title,
        type: doc.type,
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const handleCloseTab = (tabId: string) => {
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const handleNewDoc = async (type: DocType, title?: string) => {
    const newDoc = await storageService.createDocument(type, title);
    await refreshDocuments();
    handleOpenDoc(newDoc);
    showToast(`নতুন ${type === 'doc' ? 'ডকুমেন্ট' : type === 'sheet' ? 'স্প্রেডশিট' : 'স্লাইড'} তৈরি হয়েছে`);
  };

  const handleDeleteDoc = async (id: string) => {
    await storageService.deleteDocument(id);
    setTabs(tabs.filter((t) => t.docId !== id));
    if (activeTab?.docId === id) {
      setActiveTabId(null);
    }
    await refreshDocuments();
    showToast('ফাইল সফলভাবে মুছে ফেলা হয়েছে');
  };

  // Find active tab and active document
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDoc = activeTab ? documents.find((d) => d.id === activeTab.docId) : null;

  // Document Content Updates
  const handleUpdateDocContent = async (newContent: any, isDirty: boolean = false) => {
    if (!activeDoc) return;
    const updated: DocumentItem = {
      ...activeDoc,
      content: newContent,
    };
    await storageService.saveDocument(updated);

    // Update in-memory state
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (activeTab && isDirty) {
      setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, isDirty: true } : t)));
    }
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!activeDoc) return;
    const updated: DocumentItem = {
      ...activeDoc,
      title: newTitle,
    };
    await storageService.saveDocument(updated);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (activeTab) {
      setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, title: newTitle } : t)));
    }
  };

  // Vault Setup / Unlock Handlers
  const handleSetupVault = async (password: string) => {
    await storageService.setupVault(password);
    setHasVault(true);
    setIsVaultUnlocked(true);
    await refreshDocuments();
    showToast('মাস্টার পাসওয়ার্ড ভল্ট সফলভাবে কনফিগার হয়েছে');
  };

  const handleUnlockVault = async (password: string): Promise<boolean> => {
    const success = await storageService.unlockVault(password);
    if (success) {
      setIsVaultUnlocked(true);
      await refreshDocuments();
      showToast('ভল্ট সফলভাবে আনলক হয়েছে');
      return true;
    }
    return false;
  };

  const handleLockVault = () => {
    storageService.lockVault();
    setIsVaultUnlocked(false);
    refreshDocuments();
    showToast('ভল্ট লক করা হয়েছে');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#202124] text-neutral-900 select-none desktop-ui-scaled">
      {/* Top Linux GTK Window Frame & Tab Strip */}
      <WindowFrame
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewDoc={handleNewDoc}
        isVaultUnlocked={isVaultUnlocked}
        hasVault={hasVault}
        onToggleVaultLock={() => setIsVaultModalOpen(true)}
        uiScale={uiScale}
        onChangeUiScale={setUiScale}
        onOpenDebModal={() => setIsDebModalOpen(true)}
      />

      {/* Main Workspace Area (Home or Active Editor) */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTabId === null || !activeDoc ? (
          <SuiteHome
            documents={documents}
            onOpenDoc={handleOpenDoc}
            onNewDoc={handleNewDoc}
            onDeleteDoc={handleDeleteDoc}
            isVaultUnlocked={isVaultUnlocked}
            hasVault={hasVault}
            onSetupOrUnlockVault={() => setIsVaultModalOpen(true)}
            onOpenGoogleDriveSync={() => setIsGoogleDriveModalOpen(true)}
          />
        ) : activeDoc.type === 'doc' ? (
          <DocsEditor
            key={activeDoc.id}
            document={activeDoc}
            zoom={zoom}
            onUpdateContent={(content, isDirty) => handleUpdateDocContent(content, isDirty)}
            onUpdateTitle={handleUpdateTitle}
            onWordCountChange={(words, chars) => setWordCount({ words, chars })}
            onToggleLock={() => setIsVaultModalOpen(true)}
          />
        ) : activeDoc.type === 'sheet' ? (
          <SheetsEditor
            key={activeDoc.id}
            document={activeDoc}
            zoom={zoom}
            onUpdateContent={(content, isDirty) => handleUpdateDocContent(content, isDirty)}
            onUpdateTitle={handleUpdateTitle}
            onStatusChange={setStatusText}
          />
        ) : (
          <SlidesEditor
            key={activeDoc.id}
            document={activeDoc}
            zoom={zoom}
            onUpdateContent={(content, isDirty) => handleUpdateDocContent(content, isDirty)}
            onUpdateTitle={handleUpdateTitle}
            onStatusChange={setStatusText}
          />
        )}
      </main>

      {/* Dedicated Bottom Zoom Control Bar & Desktop Resolution Scaler */}
      <BottomZoomBar
        zoom={zoom}
        onChangeZoom={setZoom}
        statusText={statusText}
        wordCount={wordCount}
        uiScale={uiScale}
        onChangeUiScale={setUiScale}
        docType={activeDoc?.type}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white px-4 py-2 rounded-full text-xs font-medium shadow-xl border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* AES-256 Vault Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        hasVault={hasVault}
        isUnlocked={isVaultUnlocked}
        onClose={() => setIsVaultModalOpen(false)}
        onSetupVault={handleSetupVault}
        onUnlockVault={handleUnlockVault}
        onLockVault={handleLockVault}
      />

      {/* Linux .deb Packaging Helper Modal */}
      <DebPackageModal
        isOpen={isDebModalOpen}
        onClose={() => setIsDebModalOpen(false)}
      />

      {/* Optional Google Drive Cloud Sync Modal */}
      <GoogleDriveSyncModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        documents={documents}
        onSyncComplete={showToast}
      />
    </div>
  );
}
