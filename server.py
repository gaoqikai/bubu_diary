import json
import os
import glob
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse

PORT = 8000
NOTES_DIR = 'notes'

if not os.path.exists(NOTES_DIR):
    os.makedirs(NOTES_DIR)

class DiaryHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/notes':
            self.handle_get_notes()
        elif parsed_path.path == '/api/note':
            self.handle_get_single_note(parsed_path.query)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/note':
            self.handle_save_note()
        elif self.path == '/api/note/undo':
            self.handle_undo_note()
        elif self.path == '/api/note/delete':
            self.handle_delete_note()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_get_notes(self):
        notes = []
        for file_path in glob.glob(os.path.join(NOTES_DIR, '*.json')):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    note_data = json.load(f)
                    notes.append({
                        'id': note_data['id'],
                        'title': note_data.get('title', 'Untitled'),
                        'current_content': note_data.get('current_content', '')
                    })
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        
        # Sort by id (timestamp usually)
        notes.sort(key=lambda x: x['id'], reverse=True)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(notes).encode('utf-8'))

    def handle_get_single_note(self, query):
        params = urllib.parse.parse_qs(query)
        note_id = params.get('id', [None])[0]
        if not note_id:
            self.send_error(400, "Missing note id")
            return
            
        file_path = os.path.join(NOTES_DIR, f"{note_id}.json")
        if not os.path.exists(file_path):
            self.send_error(404, "Note not found")
            return
            
        with open(file_path, 'r', encoding='utf-8') as f:
            note_data = json.load(f)
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(note_data).encode('utf-8'))

    def handle_save_note(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        note_id = data.get('id')
        new_content = data.get('content', '')
        title = data.get('title', 'Untitled')
        
        if not note_id:
            self.send_error(400, "Missing note id")
            return
            
        file_path = os.path.join(NOTES_DIR, f"{note_id}.json")
        note_data = {
            'id': note_id,
            'title': title,
            'current_content': new_content,
            'history': []
        }
        
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
                note_data['history'] = old_data.get('history', [])
                # Only save to history if content changed
                if old_data.get('current_content') != new_content:
                    note_data['history'].append(old_data.get('current_content', ''))
                    # Keep max 2 versions in history
                    if len(note_data['history']) > 2:
                        note_data['history'] = note_data['history'][-2:]
                else:
                    note_data['history'] = old_data.get('history', [])

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(note_data, f, ensure_ascii=False, indent=2)
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'note': note_data}).encode('utf-8'))

    def handle_undo_note(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        note_id = data.get('id')
        if not note_id:
            self.send_error(400, "Missing note id")
            return
            
        file_path = os.path.join(NOTES_DIR, f"{note_id}.json")
        if not os.path.exists(file_path):
            self.send_error(404, "Note not found")
            return
            
        with open(file_path, 'r', encoding='utf-8') as f:
            note_data = json.load(f)
            
        history = note_data.get('history', [])
        if len(history) == 0:
             self.send_response(200)
             self.send_header('Content-Type', 'application/json')
             self.end_headers()
             self.wfile.write(json.dumps({'success': False, 'message': 'No history to undo'}).encode('utf-8'))
             return
             
        # Pop the last state
        previous_content = history.pop()
        note_data['current_content'] = previous_content
        note_data['history'] = history
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(note_data, f, ensure_ascii=False, indent=2)
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'content': previous_content}).encode('utf-8'))

    def handle_delete_note(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        note_id = data.get('id')
        if not note_id:
            self.send_error(400, "Missing note id")
            return
            
        file_path = os.path.join(NOTES_DIR, f"{note_id}.json")
        if os.path.exists(file_path):
            os.remove(file_path)
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

if __name__ == '__main__':
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, DiaryHandler)
    print(f"Starting Diary & Calculator server on port {PORT}...")
    httpd.serve_forever()
