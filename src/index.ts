import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { joinRoom } from "./socket/event/joinRoom";
import { setupSocket } from "./socket";
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});
io.engine.on("connection_error", (err) => {
    console.error(`Connection error: ${err.message}`);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});

setupSocket(httpServer);


app.get("/", (req, res) => {
    console.log("Hello World!");
    res.send("Hello World!");
});
