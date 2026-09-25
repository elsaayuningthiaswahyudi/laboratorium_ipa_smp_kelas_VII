#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import sys
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

EVAL_FILE = os.path.join(DATA_DIR, 'evaluations.json')
LKPD_FILE = os.path.join(DATA_DIR, 'lkpd.json')

def load_json(filepath, default):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return default
    return default

def save_json(filepath, data):
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving {filepath}: {e}")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/evaluations':
            data = load_json(EVAL_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return
        elif parsed.path == '/api/lkpd':
            data = load_json(LKPD_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return
        elif parsed.path == '/api/ping':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "message": "Server IPA Lab Active"}).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            payload = json.loads(post_body)
        except Exception:
            payload = {}

        if parsed.path == '/api/evaluations':
            evals = load_json(EVAL_FILE, [])
            # Check if this evaluation already exists by id
            existing_idx = next((i for i, item in enumerate(evals) if item.get('id') == payload.get('id')), -1)
            if existing_idx >= 0:
                evals[existing_idx] = payload
            else:
                evals.insert(0, payload)
            save_json(EVAL_FILE, evals)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "data": evals}).encode('utf-8'))
            return

        elif parsed.path == '/api/lkpd':
            lkpds = load_json(LKPD_FILE, [])
            existing_idx = next((i for i, item in enumerate(lkpds) if item.get('id') == payload.get('id')), -1)
            if existing_idx >= 0:
                lkpds[existing_idx] = payload
            else:
                lkpds.insert(0, payload)
            save_json(LKPD_FILE, lkpds)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "data": lkpds}).encode('utf-8'))
            return

        elif parsed.path == '/api/delete-eval':
            target_id = payload.get('id')
            evals = load_json(EVAL_FILE, [])
            evals = [e for e in evals if str(e.get('id')) != str(target_id)]
            save_json(EVAL_FILE, evals)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "data": evals}).encode('utf-8'))
            return

        elif parsed.path == '/api/delete-lkpd':
            target_id = payload.get('id')
            lkpds = load_json(LKPD_FILE, [])
            lkpds = [l for l in lkpds if str(l.get('id')) != str(target_id)]
            save_json(LKPD_FILE, lkpds)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "data": lkpds}).encode('utf-8'))
            return

        elif parsed.path == '/api/clear-all':
            save_json(EVAL_FILE, [])
            save_json(LKPD_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "All data cleared"}).encode('utf-8'))
            return

        elif parsed.path == '/api/inject-demo':
            demo_evals = payload.get('evaluations', [])
            demo_lkpds = payload.get('lkpd', [])
            save_json(EVAL_FILE, demo_evals)
            save_json(LKPD_FILE, demo_lkpds)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    with ThreadedHTTPServer(("", PORT), CustomHandler) as httpd:
        print(f"🚀 Server Media Pembelajaran IPA berjalan di port {PORT}...")
        print(f"📡 API Sinkronisasi Dashboard Guru aktif: http://localhost:{PORT}/api/evaluations")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server dihentikan.")
            httpd.server_close()
