import prisma from "../../lib/prisma";

export default async function bidService(amount: number, userId: string, auctionId: string) {
    const result = await prisma.bid.create({
        data: {
            amount,
            userId,
            auctionId,
        },
    });

    await prisma.auction.update({
        where: { id: auctionId },
        data: { currentBid: amount },
    });

    return result;
}
