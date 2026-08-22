import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:3000";
const NUM_USERS = 99;

interface BidResult {
    userId: string;
    userName: string;
    success: boolean;
    error?: string;
    bidAmount?: number;
}

interface UserData {
    id: string;
    name: string;
}

async function main() {
    console.log(`Concurrency test: ${NUM_USERS} simultaneous bids\n`);

    const usersResponse = await fetch(`${SERVER_URL}/api/users`);
    if (!usersResponse.ok) {
        console.error("Failed to fetch users. Is the server running?");
        process.exit(1);
    }
    const userData = await usersResponse.json() as any;
    const users: UserData[] = userData.users;

    const auctionResponse = await fetch(`${SERVER_URL}/api/auction`);
    if (!auctionResponse.ok) {
        console.error("Failed to fetch auction.");
        process.exit(1);
    }
    const auction: any = await auctionResponse.json();

    console.log(`Auction: ${auction.title} (ID: ${auction.id})`);
    console.log(`Current bid: ${auction.currentBid ?? auction.startingBid}`);

    const bidderUsers = users.filter((u) => u.id !== auction.creatorId).slice(0, NUM_USERS);
    console.log(`Connecting ${bidderUsers.length} users...`);

    const sockets: Socket[] = [];
    const connected = await Promise.all(
        bidderUsers.map(
            () =>
                new Promise<boolean>((resolve) => {
                    const socket = io(SERVER_URL, { transports: ["websocket"] });
                    sockets.push(socket);
                    socket.on("connect", () => resolve(true));
                    socket.on("connect_error", () => resolve(false));
                })
        )
    );

    const connectedCount = connected.filter(Boolean).length;
    console.log(`${connectedCount}/${bidderUsers.length} connected\n`);

    await new Promise((r) => setTimeout(r, 500));

    console.log("All users joining auction room...");
    const activeSockets: { socket: Socket; user: UserData; index: number }[] = [];
    for (let i = 0; i < sockets.length; i++) {
        if (sockets[i].connected) {
            sockets[i].emit("joinRoom", auction.id);
            activeSockets.push({ socket: sockets[i], user: bidderUsers[i], index: i });
        }
    }

    await new Promise((r) => setTimeout(r, 500));
    console.log(`${activeSockets.length} users joined room\n`);

    const results: Promise<BidResult>[] = activeSockets.map(({ socket, user, index }) => {
        return new Promise((resolve) => {
            const bidAmount = 200 + index;

            socket.once("bidResult", (result: { success: boolean; error?: string; bidId?: string }) => {
                resolve({
                    userId: user.id,
                    userName: user.name,
                    success: result.success,
                    error: result.error,
                    bidAmount,
                });
            });

            setTimeout(() => {
                resolve({
                    userId: user.id,
                    userName: user.name,
                    success: false,
                    error: "Timeout (no response)",
                    bidAmount,
                });
            }, 60000);

            socket.emit("bid", user.id, auction.id, bidAmount);
        });
    });

    console.log(`Firing ${activeSockets.length} bids simultaneously...\n`);
    const start = performance.now();
    const bidResults = await Promise.all(results);
    const elapsed = performance.now() - start;

    const succeeded = bidResults.filter((r) => r.success);
    const failed = bidResults.filter((r) => !r.success);

    console.log("=== RESULTS ===");
    console.log(`Total bids: ${bidResults.length}`);
    console.log(`Succeeded: ${succeeded.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Time: ${(elapsed / 1000).toFixed(1)}s\n`);

    if (succeeded.length > 0) {
        const amounts = succeeded.map((r) => r.bidAmount!).sort((a, b) => a - b);
        console.log(`Succeeded bid range: ${amounts[0]} - ${amounts[amounts.length - 1]}`);
    }

    if (failed.length > 0) {
        const timeoutFails = failed.filter((f) => f.error?.includes("Timeout"));
        const bidFails = failed.filter((f) => !f.error?.includes("Timeout"));
        console.log(`\nFailed (timeout): ${timeoutFails.length}`);
        console.log(`Failed (rejected): ${bidFails.length}`);
        if (bidFails.length > 0) {
            console.log("\nRejected bids:");
            for (const f of bidFails.slice(0, 10)) {
                console.log(`  ${f.userName}: bid ${f.bidAmount} - ${f.error}`);
            }
        }
    }

    console.log("\n--- Verification ---");
    const verifyResponse = await fetch(`${SERVER_URL}/api/auction`);
    if (verifyResponse.ok) {
        const finalAuction: any = await verifyResponse.json();
        console.log(`Final currentBid: ${finalAuction.currentBid}`);
    }

    const bidsResponse = await fetch(`${SERVER_URL}/api/bids`);
    if (bidsResponse.ok) {
        const bidData: any = await bidsResponse.json();
        console.log(`Total bids in DB: ${bidData.count}`);
    }

    for (const s of sockets) {
        s.disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
