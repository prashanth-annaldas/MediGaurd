import socket
try:
    host = "generativelanguage.googleapis.com"
    print(f"Resolving {host}...")
    addr = socket.getaddrinfo(host, 443)
    print(f"Success: {addr[0][4][0]}")
except Exception as e:
    print(f"Failed: {e}")
