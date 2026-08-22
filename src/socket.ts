import type { Server as httpServer } from "http";
import { Server } from "socket.io";
import { joinRoom } from "./socket/event/joinRoom";
import { bid } from "./socket/event/bid";

let io: Server;

export function setupSocket(httpServer: httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    });

    io.engine.on("connection_error", (err) => {
        console.error(`Connection error: ${err.message}`);
    });

    io.on("connection", (socket) => {
        socket.on("error", (err) => {
            console.error(`Socket error for ${socket.id}: ${err.message}`);
        });

        socket.emit("message", "Welcome to the server!");

        socket.on("joinRoom", (roomId) => {
            joinRoom(socket, roomId, io);
        });

        socket.on("bid", (userId: string, roomId: string, bidAmount: number) => {
            bid(socket, userId, roomId, bidAmount, io);
        });

        socket.on("disconnect", (reason) => {
            console.log(`User ${socket.id} disconnected: ${reason}`);
        });
    });
}