import prisma from "../../lib/prisma";

export default async function bidService(amount: number, userId: string, auctionId: string) {
    return await prisma.$transaction(async (tx) => {
        const auction = await tx.auction.findUnique({ where: { id: auctionId } });
        if (!auction) throw new Error("Auction not found");
        if (auction.status !== "active") throw new Error("Auction is not active");

        const updated = await tx.auction.updateMany({
            where: {
                id: auctionId,
                OR: [{ currentBid: null }, { currentBid: { lt: amount } }],
            },
            data: { currentBid: amount },
        });

        if (updated.count === 0) {
            throw new Error(`Bid must be higher than current bid of ${auction.currentBid ?? auction.startingBid}`);
        }

        return await tx.bid.create({ data: { amount, userId, auctionId } });
    });
}
