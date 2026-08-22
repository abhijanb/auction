import express from "express";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket";
import prisma from "./lib/prisma";

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});

setupSocket(httpServer);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/api/users", async (req, res) => {
    const users = await prisma.user.findMany({ select: { id: true, name: true } });
    res.json({ users });
});

app.get("/api/auction", async (req, res) => {
    const auction = await prisma.auction.findFirst({ where: { status: "active" } });
    if (!auction) {
        res.status(404).json({ error: "No active auction" });
        return;
    }
    res.json(auction);
});

app.get("/api/bids", async (req, res) => {
    const auction = await prisma.auction.findFirst({ where: { status: "active" } });
    if (!auction) {
        res.status(404).json({ error: "No active auction" });
        return;
    }
    const count = await prisma.bid.count({ where: { auctionId: auction.id } });
    res.json({ count, auctionId: auction.id });
});
