/**
 * Offline bilingual English and Bengali (বাংলা) spellcheck engine.
 * Includes embedded vocabularies, phonetic/Levenshtein suggestions,
 * and user custom dictionary persistence.
 */

// Core English dictionary words
const ENGLISH_WORDLIST = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
  'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'file', 'edit', 'view', 'insert', 'format', 'tools', 'help', 'document', 'sheet',
  'slide', 'presentation', 'spreadsheet', 'google', 'linux', 'ubuntu', 'debian', 'system', 'offline',
  'encryption', 'password', 'secure', 'table', 'chart', 'summary', 'budget', 'report', 'project',
  'proposal', 'quarter', 'revenue', 'expense', 'total', 'average', 'formula', 'cell', 'font', 'color',
  'style', 'alignment', 'center', 'left', 'right', 'bold', 'italic', 'underline', 'save', 'open',
  'export', 'download', 'upload', 'cloud', 'drive', 'local', 'storage', 'data', 'zoom', 'scale', 'ratio',
  'native', 'performance', 'desktop', 'keyboard', 'shortcut', 'copy', 'paste', 'clipboard', 'select'
]);

// Core Bengali (বাংলা) dictionary words
const BENGALI_WORDLIST = new Set([
  'আমি', 'তুমি', 'আমরা', 'তোমরা', 'সে', 'তিনি', 'তারা', 'কাজ', 'বাংলা', 'বাংলাদেশ',
  'নথি', 'ফাইল', 'ডকুমেন্ট', 'হিসাব', 'শিট', 'স্লাইড', 'উপস্থাপন', 'তথ্য', 'ব্যবস্থাপনা',
  'সুন্দর', 'সহজ', 'দ্রুত', 'লিনাক্স', 'সিস্টেম', 'অফলাইন', 'নিরাপদ', 'এনক্রিপশন',
  'গুগল', 'টেবিল', 'তালিকা', 'যোগ', 'বিয়োগ', 'গুণ', 'ভাগ', 'গড়', 'মোট', 'খরচ',
  'আয়', 'বাজেট', 'পরিকল্পনা', 'প্রতিবেদন', 'প্রকল্প', 'প্রস্তাবনা', 'মাস', 'বছর',
  'দিন', 'তারিখ', 'সময়', 'পৃষ্ঠা', 'লেখালিখি', 'অক্ষর', 'শব্দ', 'বাক্য', 'রং',
  'হরফ', 'বড়', 'ছোট', 'মাঝারি', 'ডানে', 'বামে', 'মাঝে', 'সেভ', 'সংরক্ষণ', 'মুছে',
  'যোগ', 'সম্পাদনা', 'দেখা', 'সাহায্য', 'সেটিং', 'ডেস্কটপ', 'পাসওয়ার্ড', 'চাবি',
  'কপি', 'পেস্ট', 'কাট', 'নির্বাচন', 'সব', 'ঠিক', 'ভুল', 'শব্দকোষ', 'অভিধান'
]);

const USER_DICT_STORAGE_KEY = 'gsuite_offline_custom_dict';

class DictionaryService {
  private userDict: Set<string> = new Set();

  constructor() {
    this.loadUserDictionary();
  }

  private loadUserDictionary() {
    try {
      const stored = localStorage.getItem(USER_DICT_STORAGE_KEY);
      if (stored) {
        const words: string[] = JSON.parse(stored);
        this.userDict = new Set(words);
      }
    } catch {
      this.userDict = new Set();
    }
  }

  public addToDictionary(word: string) {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;
    this.userDict.add(cleanWord);
    try {
      localStorage.setItem(USER_DICT_STORAGE_KEY, JSON.stringify(Array.from(this.userDict)));
    } catch (e) {
      console.warn('Could not save user dictionary', e);
    }
  }

  public isBengali(text: string): boolean {
    return /[\u0980-\u09FF]/.test(text);
  }

  // Levenshtein distance for fuzzy suggestions
  private levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }

  /**
   * Check if a word is spelled correctly according to English or Bengali rules
   */
  public checkWord(rawWord: string): { isValid: boolean; suggestions: string[]; lang: 'en' | 'bn' } {
    // Strip leading and trailing punctuation
    const cleanWord = rawWord.replace(/^[^\w\u0980-\u09FF]+|[^\w\u0980-\u09FF]+$/g, '').trim();

    // Ignore numbers, empty strings, or single characters
    if (!cleanWord || cleanWord.length <= 1 || /^\d+$/.test(cleanWord)) {
      return { isValid: true, suggestions: [], lang: 'en' };
    }

    // Check user dictionary first
    if (this.userDict.has(cleanWord.toLowerCase())) {
      return { isValid: true, suggestions: [], lang: this.isBengali(cleanWord) ? 'bn' : 'en' };
    }

    const isBn = this.isBengali(cleanWord);
    const targetWord = isBn ? cleanWord : cleanWord.toLowerCase();
    const dictionary = isBn ? BENGALI_WORDLIST : ENGLISH_WORDLIST;

    if (dictionary.has(targetWord)) {
      return { isValid: true, suggestions: [], lang: isBn ? 'bn' : 'en' };
    }

    // Generate up to 3 closest suggestions
    const suggestions: { word: string; dist: number }[] = [];
    dictionary.forEach((dictWord) => {
      // Fast length filter
      if (Math.abs(dictWord.length - targetWord.length) <= 2) {
        const dist = this.levenshtein(targetWord, dictWord);
        if (dist <= 2) {
          suggestions.push({ word: dictWord, dist });
        }
      }
    });

    suggestions.sort((a, b) => a.dist - b.dist);

    return {
      isValid: false,
      suggestions: suggestions.slice(0, 4).map((s) => s.word),
      lang: isBn ? 'bn' : 'en',
    };
  }

  public getCustomDictionaryWords(): string[] {
    return Array.from(this.userDict);
  }
}

export const dictionaryService = new DictionaryService();
