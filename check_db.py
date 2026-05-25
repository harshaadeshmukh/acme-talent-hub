import sqlite3
conn = sqlite3.connect('backend/acme.db')
cursor = conn.cursor()
cursor.execute('SELECT email, profile_pic_url FROM users')
print(cursor.fetchall())
