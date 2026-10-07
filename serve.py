import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Translate requested path to filesystem
        req_path = self.path.split('?')[0].split('#')[0]
        local_path = os.path.normpath(os.path.join(DIRECTORY, req_path.lstrip('/')))
        
        # If the file does not exist and doesn't look like a static asset with extension, serve index.html
        if not os.path.exists(local_path):
            basename = os.path.basename(req_path)
            if '.' not in basename:
                self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), SPAHandler) as httpd:
        print(f"VivekSeva SPA Server running on http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
