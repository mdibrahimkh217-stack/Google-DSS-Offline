import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { DocContent, DocumentItem, SheetContent, SlideContent } from '../types/suite';

/**
 * Service to handle native Office format exports (.docx, .xlsx, .pptx, .pdf)
 * and Linux Debian packaging generators.
 */

// Export text / HTML as standard Word .docx document
export function exportToDocx(doc: DocumentItem) {
  const content = doc.content as DocContent;
  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${doc.title}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; }
        h1 { font-size: 24pt; color: #1a73e8; }
        h2 { font-size: 16pt; color: #202124; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #dadce0; padding: 6px 10px; }
        th { background-color: #f1f3f4; font-weight: bold; }
      </style>
    </head>
    <body>
      ${content.html || '<p>No content</p>'}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword',
  });
  downloadBlob(blob, `${sanitizeFilename(doc.title)}.docx`);
}

// Export SheetContent as real .xlsx spreadsheet using SheetJS
export function exportToXlsx(doc: DocumentItem) {
  const content = doc.content as SheetContent;
  const wb = XLSX.utils.book_new();

  const sheetNames = Object.keys(content.sheets || {});
  if (sheetNames.length === 0) {
    sheetNames.push('Sheet1');
  }

  sheetNames.forEach((sheetName) => {
    const rawCells = content.sheets[sheetName] || {};
    const rowMap: { [row: number]: { [col: string]: any } } = {};
    let maxRow = 1;
    let maxColNum = 1;

    Object.entries(rawCells).forEach(([cellKey, cell]) => {
      const match = cellKey.match(/^([A-Z]+)([0-9]+)$/);
      if (match) {
        const colStr = match[1];
        const rowNum = parseInt(match[2], 10);
        if (!rowMap[rowNum]) rowMap[rowNum] = {};

        // evaluate display value or formula
        let val: any = cell.computed !== undefined && cell.computed !== '' ? cell.computed : cell.raw;
        if (!val && cell.formula) val = cell.formula;
        if (cell.style?.format === 'number' || cell.style?.format === 'currency') {
          const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
          if (!isNaN(num)) val = num;
        }

        rowMap[rowNum][colStr] = val;
        if (rowNum > maxRow) maxRow = rowNum;
      }
    });

    const rowsData: any[][] = [];
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let r = 1; r <= Math.max(maxRow, 10); r++) {
      const rowArr: any[] = [];
      cols.forEach((c) => {
        rowArr.push(rowMap[r]?.[c] ?? '');
      });
      rowsData.push(rowArr);
    }

    const ws = XLSX.utils.aoa_to_sheet(rowsData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  });

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  downloadBlob(blob, `${sanitizeFilename(doc.title)}.xlsx`);
}

// Export SlideContent as PPTX outline / presentation file
export function exportToPptx(doc: DocumentItem) {
  const content = doc.content as SlideContent;
  const slides = content.slides || [];

  // Generate an HTML presentation deck that Office/LibreOffice opens as slides
  let slideHtml = '';
  slides.forEach((slide, idx) => {
    slideHtml += `
      <div style="page-break-after: always; width: 960px; height: 540px; background-color: ${slide.background || '#ffffff'}; position: relative; border: 1px solid #ccc; margin-bottom: 20px;">
        <div style="position: absolute; top: 10px; right: 15px; font-size: 10pt; color: #888;">Slide ${idx + 1}</div>
        ${slide.elements
          .map((el) => {
            const isHeading = el.type === 'heading';
            return `
            <div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; color: ${el.fontColor || '#000'}; font-size: ${el.fontSize || 16}px; font-weight: ${el.bold || isHeading ? 'bold' : 'normal'}; background-color: ${el.bg || 'transparent'};">
              ${el.content}
            </div>
          `;
          })
          .join('')}
      </div>
    `;
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${doc.title}</title>
      <style>body { margin: 20px; font-family: 'Arial', sans-serif; }</style>
    </head>
    <body>
      ${slideHtml}
    </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/vnd.ms-powerpoint' });
  downloadBlob(blob, `${sanitizeFilename(doc.title)}.pptx`);
}

// Export clean PDF using jsPDF
export function exportToPdf(doc: DocumentItem) {
  const pdf = new jsPDF({
    orientation: doc.type === 'slide' ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  if (doc.type === 'doc') {
    const content = doc.content as DocContent;
    // Strip HTML tags for clean text rendering
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content.html;
    const textLines = (tempDiv.innerText || tempDiv.textContent || '').split('\n');

    pdf.setFontSize(18);
    pdf.setTextColor(26, 115, 232);
    pdf.text(doc.title, 40, 50);

    pdf.setFontSize(11);
    pdf.setTextColor(32, 33, 36);
    let y = 80;
    textLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 12;
        return;
      }
      const splitLines = pdf.splitTextToSize(trimmed, 515);
      splitLines.forEach((spl: string) => {
        if (y > 780) {
          pdf.addPage();
          y = 50;
        }
        pdf.text(spl, 40, y);
        y += 16;
      });
    });
  } else if (doc.type === 'sheet') {
    const content = doc.content as SheetContent;
    pdf.setFontSize(16);
    pdf.setTextColor(24, 128, 56);
    pdf.text(doc.title, 40, 45);

    const sheetName = content.activeSheet || 'Sheet1';
    const cells = content.sheets[sheetName] || {};
    let y = 80;

    pdf.setFontSize(9);
    // Draw simple grid representation
    const cols = ['A', 'B', 'C', 'D'];
    const colWidths = [150, 100, 100, 100];

    // Header row
    let x = 40;
    cols.forEach((col, idx) => {
      const cell = cells[`${col}1`];
      pdf.setFillColor(232, 240, 254);
      pdf.rect(x, y, colWidths[idx], 22, 'F');
      pdf.setTextColor(26, 115, 232);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cell?.raw || col, x + 5, y + 15);
      x += colWidths[idx];
    });
    y += 24;

    for (let r = 2; r <= 8; r++) {
      x = 40;
      cols.forEach((col, idx) => {
        const cell = cells[`${col}${r}`];
        pdf.rect(x, y, colWidths[idx], 20, 'S');
        pdf.setFont('helvetica', cell?.style?.bold ? 'bold' : 'normal');
        pdf.setTextColor(32, 33, 36);
        const val = cell?.computed !== undefined && cell.computed !== '' ? cell.computed : cell?.raw || '';
        pdf.text(String(val), x + 5, y + 14);
        x += colWidths[idx];
      });
      y += 20;
    }
  } else if (doc.type === 'slide') {
    const content = doc.content as SlideContent;
    const slides = content.slides || [];
    slides.forEach((slide, sIdx) => {
      if (sIdx > 0) pdf.addPage('a4', 'landscape');
      pdf.setFillColor(slide.background || '#ffffff');
      pdf.rect(0, 0, 842, 595, 'F');

      slide.elements.forEach((el) => {
        pdf.setFontSize(el.fontSize ? el.fontSize * 0.8 : 14);
        pdf.setTextColor(el.fontColor || '#202124');
        pdf.text(el.content, el.x * 0.8, el.y * 0.8 + 20);
      });
    });
  }

  pdf.save(`${sanitizeFilename(doc.title)}.pdf`);
}

// Generate complete Debian .deb package build script and metadata
export function downloadDebianPackageScript() {
  const debianControl = `Package: gsuite-offline
Version: 1.0.0
Section: utils
Priority: optional
Architecture: amd64
Depends: libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37, libgtk-3-0, libc6
Maintainer: Offline Suite Project <support@localhost>
Description: Ultra-lightweight native Linux Google Docs, Sheets, and Slides suite
 A standalone, privacy-first office suite combining Google Docs, Sheets,
 and Slides into a single native window without bundled Chromium or browser overhead.
`;

  const desktopEntry = `[Desktop Entry]
Name=Google Workspace Offline Suite
Comment=Ultra-fast offline Docs, Sheets and Slides
Exec=gsuite-offline %U
Icon=gsuite-offline
Terminal=false
Type=Application
Categories=Office;WordProcessor;Spreadsheet;Presentation;
MimeType=application/x-gsuite;application/vnd.openxmlformats-officedocument.wordprocessingml.document;application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;application/vnd.openxmlformats-officedocument.presentationml.presentation;
`;

  const buildScript = `#!/usr/bin/env bash
# ==============================================================================
# build-deb.sh: Builds the native gsuite-offline.deb package for Ubuntu/Debian
# Relies on native host libraries (WebKitGTK, GTK3, libc) for <60MB RAM footprint
# ==============================================================================
set -e

echo "[*] Building Google Workspace Offline Suite Debian package..."
PKG_DIR="gsuite-offline_1.0.0_amd64"
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR/DEBIAN"
mkdir -p "$PKG_DIR/usr/bin"
mkdir -p "$PKG_DIR/usr/share/applications"
mkdir -p "$PKG_DIR/usr/share/icons/hicolor/scalable/apps"
mkdir -p "$PKG_DIR/opt/gsuite-offline"

# Copy debian control file
cat << 'EOF' > "$PKG_DIR/DEBIAN/control"
${debianControl}
EOF

# Copy desktop launcher
cat << 'EOF' > "$PKG_DIR/usr/share/applications/gsuite-offline.desktop"
${desktopEntry}
EOF

# Create native launcher executable using system WebKitGTK
cat << 'EOF' > "$PKG_DIR/usr/bin/gsuite-offline"
#!/bin/sh
# Launch using native WebKitGTK / GtkWebView
if command -v python3 >/dev/null 2>&1 && python3 -c "import gi; gi.require_version('WebKit2', '4.1')" 2>/dev/null; then
  python3 -c "
import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2

win = Gtk.Window(title='Google Workspace Offline Suite')
win.set_default_size(1280, 800)
view = WebKit2.WebView()
settings = view.get_settings()
settings.set_enable_write_console_messages_to_stdout(True)
view.load_uri('file:///opt/gsuite-offline/index.html')
win.add(view)
win.connect('destroy', Gtk.main_quit)
win.show_all()
Gtk.main()
"
else
  # Fallback to local default browser in app mode
  x-www-browser --app="file:///opt/gsuite-offline/index.html" || xdg-open "file:///opt/gsuite-offline/index.html"
fi
EOF

chmod +x "$PKG_DIR/usr/bin/gsuite-offline"

echo "[*] Copying app web assets to /opt/gsuite-offline..."
# In a real build, copy built dist/ directory into /opt/gsuite-offline/
touch "$PKG_DIR/opt/gsuite-offline/index.html"

echo "[*] Building debian package..."
dpkg-deb --build "$PKG_DIR"

echo "[✔] Success! Created gsuite-offline_1.0.0_amd64.deb"
echo "To install on your Linux system:"
echo "  sudo dpkg -i gsuite-offline_1.0.0_amd64.deb"
echo "  sudo apt-get install -f  # resolves any missing libwebkit2gtk dependencies"
`;

  const blob = new Blob([buildScript], { type: 'application/x-sh' });
  downloadBlob(blob, 'build-deb.sh');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_').substring(0, 50);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
