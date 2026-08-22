import type { Socket } from "socket.io";

export function joinRoom(socket: Socket, roomId: string, io: any) {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
    io.to(roomId).emit("message", `A user has joined the room: ${roomId} 
            total users in room: ${io.sockets.adapter.rooms.get(roomId)?.size}`);
}