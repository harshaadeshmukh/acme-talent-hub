from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.room_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if room:
            if room not in self.room_connections:
                self.room_connections[room] = []
            self.room_connections[room].append(websocket)

    def disconnect(self, websocket: WebSocket, room: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if room and room in self.room_connections:
            if websocket in self.room_connections[room]:
                self.room_connections[room].remove(websocket)
            if not self.room_connections[room]:
                del self.room_connections[room]

    async def broadcast(self, message: str):
        # Broadcast to all active connections
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

    async def broadcast_to_room(self, room: str, message: str):
        if room in self.room_connections:
            for connection in list(self.room_connections[room]):
                try:
                    await connection.send_text(message)
                except Exception:
                    self.disconnect(connection, room)

manager = ConnectionManager()
