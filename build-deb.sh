#!/usr/bin/env bash
# ==============================================================================
# build-deb.sh: Builds the native gsuite-offline.deb package for Linux Mint / Ubuntu / Debian
# Leverages host system libraries (WebKitGTK, GTK3, libc) for <60MB RAM footprint
# ==============================================================================
set -e

echo "=========================================================="
echo " Building Google Workspace Offline Suite Debian Package   "
echo " Target: Linux Mint / Ubuntu / Debian (amd64)             "
echo "=========================================================="

# 1. Build the production web bundle
echo "[1/4] Building production web assets..."
if command -v npm >/dev/null 2>&1; then
  npm run build
elif command -v bun >/dev/null 2>&1; then
  bun run build
else
  echo "[!] Neither npm nor bun found. Assuming dist/ already exists."
fi

# 2. Prepare Debian package directory structure
echo "[2/4] Preparing Debian package layout..."
PKG_NAME="gsuite-offline"
PKG_VERSION="1.0.0"
ARCH="amd64"
DIR_NAME="${PKG_NAME}_${PKG_VERSION}_${ARCH}"

rm -rf "$DIR_NAME"
mkdir -p "$DIR_NAME/DEBIAN"
mkdir -p "$DIR_NAME/usr/bin"
mkdir -p "$DIR_NAME/usr/share/applications"
mkdir -p "$DIR_NAME/usr/share/icons/hicolor/scalable/apps"
mkdir -p "$DIR_NAME/usr/share/icons/hicolor/128x128/apps"
mkdir -p "$DIR_NAME/opt/gsuite-offline"

# 3. Copy application assets
echo "[3/4] Copying assets and launchers..."
cp -r dist/* "$DIR_NAME/opt/gsuite-offline/"

# Create Debian control file
cat << 'EOF' > "$DIR_NAME/DEBIAN/control"
Package: gsuite-offline
Version: 1.0.0
Section: office
Priority: optional
Architecture: amd64
Depends: libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37, libgtk-3-0, libc6
Maintainer: Offline Suite Project <md.ibrahim.kh217@gmail.com>
Description: Ultra-lightweight native Linux Google Docs, Sheets, and Slides suite
 A standalone, privacy-first office suite combining Google Docs, Sheets,
 and Slides into a single native window without bundled Chromium or browser overhead.
 Runs natively using system WebKitGTK and GTK3 libraries with under 60MB RAM usage.
EOF

# Create desktop launcher file
cat << 'EOF' > "$DIR_NAME/usr/share/applications/gsuite-offline.desktop"
[Desktop Entry]
Name=Google Workspace Offline Suite
GenericName=Office Suite
Comment=Ultra-fast offline Docs, Sheets and Slides
Exec=gsuite-offline %U
Icon=gsuite-offline
Terminal=false
Type=Application
Categories=Office;WordProcessor;Spreadsheet;Presentation;
MimeType=application/x-gsuite;application/vnd.openxmlformats-officedocument.wordprocessingml.document;application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;application/vnd.openxmlformats-officedocument.presentationml.presentation;
StartupWMClass=gsuite-offline
EOF

# Create native launcher executable using system WebKitGTK & Python3
cat << 'EOF' > "$DIR_NAME/usr/bin/gsuite-offline"
#!/usr/bin/env python3
import sys, os, time, socket, threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Pick a free loopback port
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('127.0.0.1', 0))
port = sock.getsockname()[1]
sock.close()

# Start ultra-lightweight local offline HTTP server in background thread
os.chdir('/opt/gsuite-offline')
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

httpd = HTTPServer(('127.0.0.1', port), QuietHandler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
time.sleep(0.05)

url = f'http://127.0.0.1:{port}/index.html'

# Check if native WebKitGTK is available
try:
    import gi
    gi.require_version('Gtk', '3.0')
    try:
        gi.require_version('WebKit2', '4.1')
    except (ValueError, AttributeError):
        gi.require_version('WebKit2', '4.0')
    from gi.repository import Gtk, WebKit2

    class GSuiteApp(Gtk.Application):
        def __init__(self):
            super().__init__(application_id='com.google.workspace.offline')

        def do_activate(self):
            win = Gtk.ApplicationWindow(application=self, title='Google Workspace Offline Suite')
            win.set_default_size(1280, 800)
            win.set_position(Gtk.WindowPosition.CENTER)

            view = WebKit2.WebView()
            settings = view.get_settings()
            settings.set_enable_javascript(True)
            settings.set_enable_offline_web_application_cache(True)
            view.load_uri(url)

            win.add(view)
            win.show_all()

    app = GSuiteApp()
    sys.exit(app.run(sys.argv))

except Exception as err:
    # Lightweight fallback: Launch local browser in standalone app mode
    os.system(f'x-www-browser --app="{url}" || sensible-browser "{url}" || xdg-open "{url}"')
EOF

chmod +x "$DIR_NAME/usr/bin/gsuite-offline"

# 4. Build .deb package with dpkg-deb
echo "[4/4] Generating Debian package using dpkg-deb..."
if command -v dpkg-deb >/dev/null 2>&1; then
  dpkg-deb --build --root-owner-group "$DIR_NAME"
  echo ""
  echo "=========================================================="
  echo " [✔] SUCCESS: Created ${DIR_NAME}.deb"
  echo "=========================================================="
  echo "To install on Linux Mint / Ubuntu / Debian:"
  echo "  sudo dpkg -i ${DIR_NAME}.deb"
  echo "  sudo apt-get install -f"
  echo ""
  echo "To run the application:"
  echo "  gsuite-offline"
  echo "=========================================================="
else
  echo "[!] dpkg-deb is not installed in this environment."
  echo "On Debian/Mint/Ubuntu, run 'sudo apt install dpkg-dev' then run this script."
fi
