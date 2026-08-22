import type { Socket } from "socket.io";
import bidService from "../service/bid";

export async function bid(socket: Socket, userId: string, roomId: string, bidAmount: number, io: any) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) {
        socket.emit("bidResult", { success: false, error: `Room ${roomId} does not exist.` });
        return;
    }

    try {
        const result = await bidService(bidAmount, userId, roomId);
        console.log(`User ${userId} placed a bid of ${bidAmount} in room ${roomId}`);
        io.to(roomId).emit("newBid", { userId, bidAmount, bidId: result.id });
        socket.emit("bidResult", { success: true, bidId: result.id });
    } catch (err: any) {
        socket.emit("bidResult", { success: false, error: err.message });
    }
}
