import os
import sqlite3
import json
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.urandom(32)
DB_FILE = 'sovereign.db'

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            failed_attempts INTEGER DEFAULT 0
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_encrypted INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )''')
        conn.commit()

init_db()

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('index.html', username=session.get('username'))

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        with sqlite3.connect(DB_FILE) as conn:
            c = conn.cursor()
            c.execute("SELECT id, password_hash, failed_attempts FROM users WHERE username = ?", (username,))
            user = c.fetchone()
            
            if user:
                user_id, stored_hash, failed = user
                if failed >= 6:
                    c.execute("DELETE FROM notes WHERE user_id = ?", (user_id,))
                    c.execute("UPDATE users SET failed_attempts = 0 WHERE id = ?", (user_id,))
                    conn.commit()
                    return render_template('login.html', error="SECURITY WIPE EXECUTED: 6 consecutive failed logins detected. Encrypted data purged.")
                
                if check_password_hash(stored_hash, password):
                    c.execute("UPDATE users SET failed_attempts = 0 WHERE id = ?", (user_id,))
                    conn.commit()
                    session['user_id'] = user_id
                    session['username'] = username
                    return redirect(url_for('index'))
                else:
                    new_failed = failed + 1
                    c.execute("UPDATE users SET failed_attempts = ? WHERE id = ?", (new_failed, user_id))
                    conn.commit()
                    return render_template('login.html', error=f"Invalid credentials. Failed attempt {new_failed}/6")
            else:
                return render_template('login.html', error="User account does not exist.")
    return render_template('login.html')

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    hashed = generate_password_hash(password)
    try:
        with sqlite3.connect(DB_FILE) as conn:
            c = conn.cursor()
            c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed))
            conn.commit()
        return render_template('login.html', msg="Account created successfully! Log in below.")
    except sqlite3.IntegrityError:
        return render_template('login.html', error="Username already exists.")

@app.route('/api/notes', methods=['GET', 'POST', 'DELETE'])
def api_notes():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        if request.method == 'GET':
            c.execute("SELECT id, title, content, is_encrypted FROM notes WHERE user_id = ?", (user_id,))
            rows = c.fetchall()
            return jsonify([{'id': r[0], 'title': r[1], 'content': r[2], 'is_encrypted': r[3]} for r in rows])
        
        elif request.method == 'POST':
            data = request.json
            c.execute("INSERT INTO notes (user_id, title, content, is_encrypted) VALUES (?, ?, ?, ?)",
                      (user_id, data['title'], data['content'], data.get('is_encrypted', 0)))
            conn.commit()
            return jsonify({'status': 'success'})
        
        elif request.method == 'DELETE':
            note_id = request.json.get('id')
            c.execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id))
            conn.commit()
            return jsonify({'status': 'deleted'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
