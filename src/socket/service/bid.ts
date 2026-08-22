import prisma from "../../lib/prisma";

// mutex to ensure that only one bid is processed at a time
// because sqlite is being used and it does not support concurrent writes, we need to ensure that only one bid is processed at a time. This is done using a simple mutex implementation.

// if process is already processing a bid, we will queue the next bid and process it after the current bid is finished. This ensures that bids are processed in order and that the database is not corrupted by concurrent writes.
let processing = false;
const queue: (() => void)[] = [];

async function acquire() {
    if (!processing) {
        processing = true;
        return;
    }
    return new Promise<void>((resolve) => {
        queue.push(resolve);
    });
}

function release() {
    const next = queue.shift();
    if (next) {
        next();
    } else {
        processing = false;
    }
}

export default async function bidService(amount: number, userId: string, auctionId: string) {
    await acquire();
    try {
        const auction = await prisma.auction.findUniqueOrThrow({ where: { id: auctionId } });

        if (auction.status !== "active") {
            throw new Error("Auction is not active");
        }

        const minBid = auction.currentBid ?? auction.startingBid;
        if (amount <= minBid) {
            throw new Error(`Bid must be higher than current bid of ${minBid}`);
        }

        const result = await prisma.bid.create({
            data: { amount, userId, auctionId },
        });

        await prisma.auction.update({
            where: { id: auctionId },
            data: { currentBid: amount },
        });

        return result;
    } finally {
        release();
    }
}
