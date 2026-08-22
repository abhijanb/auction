import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

io.on("connection", (socket) => {
    console.log("A user connected");
    io.emit("message", "Welcome to the server!");

    socket.on("message", (data) => {
        console.log("Received message:", data);
        io.emit("message", data);
    });
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });

});

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});

app.get("/", (req, res) => {
    console.log("Hello World!");
    res.send("Hello World!");
});
