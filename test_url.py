import urllib.request
try:
    response = urllib.request.urlopen('http://127.0.0.1:8000/static/uploads/user_9514530_1779652754.jpg')
    print("Status:", response.status)
except Exception as e:
    print("Error:", e)
