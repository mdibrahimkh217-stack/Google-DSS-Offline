export type DocType = 'doc' | 'sheet' | 'slide';

export type UIScale = 90 | 100 | 110 | 125 | 150;

export interface DocumentItem {
  id: string;
  type: DocType;
  title: string;
  createdAt: number;
  updatedAt: number;
  isEncrypted: boolean;
  content: DocContent | SheetContent | SlideContent;
}

export interface DocContent {
  html: string;
  pageCount?: number;
  margins?: { top: number; bottom: number; left: number; right: number };
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'percent' | 'number';
}

export interface SheetCell {
  raw: string;
  formula?: string;
  computed?: string;
  style?: CellStyle;
}

export interface SheetContent {
  activeSheet: string;
  sheets: {
    [sheetName: string]: {
      [cellId: string]: SheetCell;
    };
  };
  columnWidths?: { [col: string]: number };
}

export interface SlideElement {
  id: string;
  type: 'text' | 'heading' | 'shape' | 'bullet';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontColor?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  shapeType?: 'rect' | 'rounded' | 'circle';
}

export interface SlideDeckItem {
  id: string;
  background: string;
  elements: SlideElement[];
}

export interface SlideContent {
  slides: SlideDeckItem[];
  activeSlideIndex: number;
}

export interface TabItem {
  id: string;
  docId: string;
  title: string;
  type: DocType;
  isDirty?: boolean;
}

export interface VaultState {
  isUnlocked: boolean;
  hasMasterPassword: boolean;
  masterPassword?: string;
  autoLockMinutes: number;
}
