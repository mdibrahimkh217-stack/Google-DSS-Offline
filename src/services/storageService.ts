import { DocumentItem } from '../types/suite';
import { createPasswordHash, decryptData, encryptData, verifyPassword } from './cryptoService';

const STORAGE_KEYS = {
  DOCS_INDEX: 'gsuite_offline_docs_index_v1',
  DOC_PREFIX: 'gsuite_offline_doc_',
  VAULT_HASH: 'gsuite_offline_vault_hash',
  VAULT_ENABLED: 'gsuite_offline_vault_enabled',
  UI_SCALE: 'gsuite_offline_ui_scale',
};

// Seed sample documents for first-time use
function getSeedDocuments(): DocumentItem[] {
  const now = Date.now();
  return [
    {
      id: 'doc-seed-1',
      type: 'doc',
      title: 'লিনাক্স ডেক্সটপ অফিস স্যুট প্রজেক্ট নোট (Project Overview)',
      createdAt: now - 3600000 * 24,
      updatedAt: now - 1800000,
      isEncrypted: false,
      content: {
        html: `
          <h1 style="font-size: 24pt; font-weight: bold; color: #1a73e8; margin-bottom: 12pt;">লিনাক্স অফলাইন অফিস স্যুট (Linux Offline Suite)</h1>
          <p style="font-size: 11pt; line-height: 1.6; color: #3c4043; margin-bottom: 10pt;">
            স্বাগতম! এটি একটি সম্পূর্ণ দেশীয় ও স্বয়ংসম্পূর্ণ লিনাক্স ডেক্সটপ অফিস স্যুট যা গুগল ডকস, শিটস্ এবং স্লাইডস-এর মতোই কাজ করে।
          </p>
          <h2 style="font-size: 16pt; font-weight: 600; color: #202124; margin-top: 16pt; margin-bottom: 8pt;">মূল বৈশিষ্ঠ্যসমূহ (Key Highlights)</h2>
          <ul style="padding-left: 20pt; line-height: 1.8; color: #3c4043;">
            <li><strong>১০০% অফলাইন ও ব্যক্তিগত:</strong> কোনো ক্লাউড একাউন্ট ছাড়াই সরাসরি ডিভাইসে কাজ করে।</li>
            <li><strong>AES-256 এনক্রিপশন:</strong> মাস্টার পাসওয়ার্ড দিয়ে সকল ফাইল সম্পূর্ণ এনক্রিপ্ট রাখা যায়।</li>
            <li><strong>দ্বিভাষিক স্পেল চেকিং:</strong> বাংলা এবং ইংরেজি উভয় ভাষার বানান পরীক্ষা ও কাস্টম ডিকশনারি সাপোর্ট।</li>
            <li><strong>মাউস কাট/কপি/পেস্ট:</strong> কোনো ব্রাউজার এক্সটেনশন ছাড়াই সরাসরি মাউসের রাইট ক্লিক মেনু দিয়ে কাজ করে।</li>
            <li><strong>ডেস্কটপ UI স্কেলিং:</strong> ১০৮০p ও ৪K মনিটরের জন্য বিশেষ জুম এবং স্কেলিং কন্ট্রোল।</li>
          </ul>
          <p style="font-size: 11pt; line-height: 1.6; color: #5f6368; margin-top: 14pt;">
            <em>নোট: আপনি চাইলে এই লেখার যেকোনো অংশ সম্পাদনা করতে পারেন অথবা নিচের বটম বার দিয়ে পেজের জুম পরিবর্তন করতে পারেন।</em>
          </p>
        `,
      },
    },
    {
      id: 'sheet-seed-1',
      type: 'sheet',
      title: 'মাসিক বাজেট ও খরচ ট্র্যাকার (Monthly Budget & Expenses)',
      createdAt: now - 3600000 * 48,
      updatedAt: now - 3600000 * 2,
      isEncrypted: false,
      content: {
        activeSheet: 'বাজেট সামারি',
        sheets: {
          'বাজেট সামারি': {
            'A1': { raw: 'খাত (Category)', style: { bold: true, bg: '#e8f0fe', color: '#1a73e8' } },
            'B1': { raw: 'বরাদ্দ (Budget $)', style: { bold: true, bg: '#e8f0fe', color: '#1a73e8', align: 'right' } },
            'C1': { raw: 'প্রকৃত খরচ (Actual $)', style: { bold: true, bg: '#e8f0fe', color: '#1a73e8', align: 'right' } },
            'D1': { raw: 'অবশিষ্ট (Remaining $)', style: { bold: true, bg: '#e8f0fe', color: '#1a73e8', align: 'right' } },

            'A2': { raw: 'হার্ডওয়্যার ও সার্ভার' },
            'B2': { raw: '1200', style: { format: 'currency', align: 'right' } },
            'C2': { raw: '950', style: { format: 'currency', align: 'right' } },
            'D2': { raw: '', formula: '=B2-C2', style: { format: 'currency', align: 'right' } },

            'A3': { raw: 'অফিস ভাড়া ও ইউটিলিটি' },
            'B3': { raw: '800', style: { format: 'currency', align: 'right' } },
            'C3': { raw: '780', style: { format: 'currency', align: 'right' } },
            'D3': { raw: '', formula: '=B3-C3', style: { format: 'currency', align: 'right' } },

            'A4': { raw: 'সফটওয়্যার টুলস ও ডোমেইন' },
            'B4': { raw: '450', style: { format: 'currency', align: 'right' } },
            'C4': { raw: '320', style: { format: 'currency', align: 'right' } },
            'D4': { raw: '', formula: '=B4-C4', style: { format: 'currency', align: 'right' } },

            'A5': { raw: 'মোট (TOTAL)', style: { bold: true, bg: '#f1f3f4' } },
            'B5': { raw: '', formula: '=SUM(B2:B4)', style: { bold: true, bg: '#f1f3f4', format: 'currency', align: 'right' } },
            'C5': { raw: '', formula: '=SUM(C2:C4)', style: { bold: true, bg: '#f1f3f4', format: 'currency', align: 'right' } },
            'D5': { raw: '', formula: '=SUM(D2:D4)', style: { bold: true, bg: '#e6f4ea', color: '#137333', format: 'currency', align: 'right' } },
          },
        },
      },
    },
    {
      id: 'slide-seed-1',
      type: 'slide',
      title: 'প্রোডাক্ট রোডম্যাপ প্রেজেন্টেশন (Desktop Suite Presentation)',
      createdAt: now - 3600000 * 72,
      updatedAt: now - 3600000 * 5,
      isEncrypted: false,
      content: {
        activeSlideIndex: 0,
        slides: [
          {
            id: 'slide-1',
            background: '#1a73e8',
            elements: [
              {
                id: 'el-1',
                type: 'heading',
                content: 'Google Workspace Offline Suite',
                x: 80,
                y: 120,
                width: 800,
                height: 70,
                fontSize: 36,
                fontColor: '#ffffff',
                bold: true,
              },
              {
                id: 'el-2',
                type: 'text',
                content: 'Privacy-First, Ultra-Fast Native Linux Desktop Office Experience',
                x: 80,
                y: 210,
                width: 800,
                height: 40,
                fontSize: 18,
                fontColor: '#e8f0fe',
              },
              {
                id: 'el-3',
                type: 'shape',
                shapeType: 'rounded',
                content: 'AES-256 ENCRYPTED • 100% OFFLINE • DUAL-LAYER SCALING',
                x: 80,
                y: 310,
                width: 480,
                height: 44,
                bg: '#ffffff',
                fontColor: '#1a73e8',
                bold: true,
                fontSize: 12,
              },
            ],
          },
          {
            id: 'slide-2',
            background: '#ffffff',
            elements: [
              {
                id: 'el-2-1',
                type: 'heading',
                content: 'কোর ফিচার এবং আর্কিটেকচার (Core Features)',
                x: 60,
                y: 50,
                width: 840,
                height: 50,
                fontSize: 26,
                fontColor: '#202124',
                bold: true,
              },
              {
                id: 'el-2-2',
                type: 'bullet',
                content: '১. কোনো ভারী ব্রাউজার ফ্রেমওয়ার্ক ছাড়া সরাসরি লিনাক্স সিস্টেম লাইব্রেরি দিয়ে পরিচালিত।',
                x: 60,
                y: 130,
                width: 840,
                height: 35,
                fontSize: 16,
                fontColor: '#3c4043',
              },
              {
                id: 'el-2-3',
                type: 'bullet',
                content: '২. ডকস, শিট এবং স্লাইডস একই উইন্ডোর ট্যাবে একসাথে ব্যবহারের সুবিধা।',
                x: 60,
                y: 180,
                width: 840,
                height: 35,
                fontSize: 16,
                fontColor: '#3c4043',
              },
              {
                id: 'el-2-4',
                type: 'bullet',
                content: '৩. এক্সটেনশন ছাড়াই সরাসরি মাউস রাইট ক্লিক কপি, কাট ও পেস্ট সমর্থন।',
                x: 60,
                y: 230,
                width: 840,
                height: 35,
                fontSize: 16,
                fontColor: '#3c4043',
              },
              {
                id: 'el-2-5',
                type: 'bullet',
                content: '৪. বটম জুমিং বার ও ডেস্কটপ UI রেজোলিউশন স্কেলিং।',
                x: 60,
                y: 280,
                width: 840,
                height: 35,
                fontSize: 16,
                fontColor: '#3c4043',
              },
            ],
          },
        ],
      },
    },
  ];
}

class StorageService {
  private inMemoryCache: Map<string, DocumentItem> = new Map();
  private masterPassword: string | null = null;

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCS_INDEX);
      if (!stored) {
        const seedDocs = getSeedDocuments();
        const indexList = seedDocs.map((d) => ({
          id: d.id,
          type: d.type,
          title: d.title,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          isEncrypted: d.isEncrypted,
        }));
        localStorage.setItem(STORAGE_KEYS.DOCS_INDEX, JSON.stringify(indexList));
        seedDocs.forEach((doc) => {
          localStorage.setItem(STORAGE_KEYS.DOC_PREFIX + doc.id, JSON.stringify(doc));
          this.inMemoryCache.set(doc.id, doc);
        });
      }
    } catch (e) {
      console.warn('Local storage init error', e);
    }
  }

  public setMasterPassword(password: string | null) {
    this.masterPassword = password;
  }

  public getMasterPassword(): string | null {
    return this.masterPassword;
  }

  public hasVault(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.VAULT_HASH);
  }

  public async setupVault(password: string): Promise<void> {
    const hash = await createPasswordHash(password);
    localStorage.setItem(STORAGE_KEYS.VAULT_HASH, hash);
    localStorage.setItem(STORAGE_KEYS.VAULT_ENABLED, 'true');
    this.masterPassword = password;
  }

  public async unlockVault(password: string): Promise<boolean> {
    const storedHash = localStorage.getItem(STORAGE_KEYS.VAULT_HASH);
    if (!storedHash) return false;
    const isValid = await verifyPassword(password, storedHash);
    if (isValid) {
      this.masterPassword = password;
      return true;
    }
    return false;
  }

  public lockVault() {
    this.masterPassword = null;
  }

  public async listDocuments(): Promise<DocumentItem[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCS_INDEX);
      if (!stored) return [];
      const indexList: Array<Omit<DocumentItem, 'content'>> = JSON.parse(stored);

      const fullDocs: DocumentItem[] = [];
      for (const item of indexList) {
        const doc = await this.getDocument(item.id);
        if (doc) fullDocs.push(doc);
      }
      return fullDocs.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  public async getDocument(id: string): Promise<DocumentItem | null> {
    if (this.inMemoryCache.has(id)) {
      return this.inMemoryCache.get(id)!;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DOC_PREFIX + id);
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      if (parsed.isEncrypted) {
        if (!this.masterPassword) {
          // Document is locked
          return {
            ...parsed,
            content: { html: '<p>Document encrypted with master password</p>' } as any,
          };
        }
        const decryptedContent = await decryptData(parsed.encryptedPayload, this.masterPassword);
        const fullDoc: DocumentItem = {
          ...parsed,
          content: decryptedContent,
        };
        this.inMemoryCache.set(id, fullDoc);
        return fullDoc;
      }

      this.inMemoryCache.set(id, parsed);
      return parsed;
    } catch (e) {
      console.warn('Error reading document ' + id, e);
      return null;
    }
  }

  public async saveDocument(doc: DocumentItem): Promise<void> {
    doc.updatedAt = Date.now();
    this.inMemoryCache.set(doc.id, doc);

    // Save to localStorage
    if (doc.isEncrypted && this.masterPassword) {
      const encryptedPayload = await encryptData(doc.content, this.masterPassword);
      const toStore = {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        isEncrypted: true,
        encryptedPayload,
      };
      localStorage.setItem(STORAGE_KEYS.DOC_PREFIX + doc.id, JSON.stringify(toStore));
    } else {
      localStorage.setItem(STORAGE_KEYS.DOC_PREFIX + doc.id, JSON.stringify(doc));
    }

    // Update index
    const stored = localStorage.getItem(STORAGE_KEYS.DOCS_INDEX);
    let indexList: Array<Omit<DocumentItem, 'content'>> = stored ? JSON.parse(stored) : [];
    const existingIdx = indexList.findIndex((item) => item.id === doc.id);

    const indexEntry = {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isEncrypted: doc.isEncrypted,
    };

    if (existingIdx >= 0) {
      indexList[existingIdx] = indexEntry;
    } else {
      indexList.unshift(indexEntry);
    }
    localStorage.setItem(STORAGE_KEYS.DOCS_INDEX, JSON.stringify(indexList));
  }

  public async deleteDocument(id: string): Promise<void> {
    this.inMemoryCache.delete(id);
    localStorage.removeItem(STORAGE_KEYS.DOC_PREFIX + id);

    const stored = localStorage.getItem(STORAGE_KEYS.DOCS_INDEX);
    if (stored) {
      const indexList: Array<Omit<DocumentItem, 'content'>> = JSON.parse(stored);
      const filtered = indexList.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.DOCS_INDEX, JSON.stringify(filtered));
    }
  }

  public async createDocument(type: 'doc' | 'sheet' | 'slide', title?: string): Promise<DocumentItem> {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    let defaultTitle = 'Untitled Document';
    let defaultContent: any = { html: '<p><br></p>' };

    if (type === 'doc') {
      defaultTitle = title || 'নামহীন নথি (Untitled Document)';
      defaultContent = { html: '<p>নতুন ডকুমেন্ট এখানে টাইপ করুন...</p>' };
    } else if (type === 'sheet') {
      defaultTitle = title || 'নামহীন স্প্রেডশিট (Untitled Spreadsheet)';
      defaultContent = {
        activeSheet: 'Sheet1',
        sheets: {
          Sheet1: {
            A1: { raw: 'আইটেম', style: { bold: true } },
            B1: { raw: 'পরিমাণ', style: { bold: true, align: 'right' } },
            C1: { raw: 'দর', style: { bold: true, align: 'right' } },
          },
        },
      };
    } else if (type === 'slide') {
      defaultTitle = title || 'নামহীন প্রেজেন্টেশন (Untitled Presentation)';
      defaultContent = {
        activeSlideIndex: 0,
        slides: [
          {
            id: 'slide-1',
            background: '#ffffff',
            elements: [
              {
                id: 'el-title',
                type: 'heading',
                content: 'শিরোনাম যোগ করতে ক্লিক করুন',
                x: 100,
                y: 140,
                width: 760,
                height: 60,
                fontSize: 32,
                fontColor: '#202124',
                bold: true,
              },
              {
                id: 'el-sub',
                type: 'text',
                content: 'উপশিরোনাম যোগ করুন',
                x: 100,
                y: 220,
                width: 760,
                height: 40,
                fontSize: 18,
                fontColor: '#5f6368',
              },
            ],
          },
        ],
      };
    }

    const newDoc: DocumentItem = {
      id,
      type,
      title: defaultTitle,
      createdAt: now,
      updatedAt: now,
      isEncrypted: !!this.masterPassword,
      content: defaultContent,
    };

    await this.saveDocument(newDoc);
    return newDoc;
  }
}

export const storageService = new StorageService();
