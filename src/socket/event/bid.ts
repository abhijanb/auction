import type { Socket } from "socket.io";
import bidService from "../service/bid";

export function bid(socket: Socket, roomId: string, bidAmount: number, io: any) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) {
        socket.emit("error", `Room ${roomId} does not exist.`);
        return;
    }

    // Here you can implement your bidding logic, e.g., checking if the bid is valid
    console.log(`User ${socket.id} placed a bid of ${bidAmount} in room ${roomId}`);
    bidService(bidAmount, socket.id, roomId); // Call the bid service with the bid amount
    io.to(roomId).emit("newBid", { userId: socket.id, bidAmount });
}