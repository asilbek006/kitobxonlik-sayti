#!/usr/bin/env python3
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
ROOT = os.path.dirname(os.path.abspath(__file__))


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            index = os.path.join(ROOT, "index.html")
            if os.path.exists(index):
                self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
        print(f"Serving shonazarov-clone on http://localhost:{PORT}")
        httpd.serve_forever()
