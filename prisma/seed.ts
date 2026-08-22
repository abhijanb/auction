import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: `file:${import.meta.dir}/../dev.db` });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.bid.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.user.deleteMany();

    const creator = await prisma.user.create({
        data: {
            name: "Creator",
            email: "creator@example.com",
        },
    });

    const auction = await prisma.auction.create({
        data: {
            title: "First Auction",
            description: "The very first auction item",
            startingBid: 100,
            creatorId: creator.id,
        },
    });

    await prisma.user.createMany({
        data: Array.from({ length: 99 }, (_, i) => ({
            name: `User ${i + 2}`,
            email: `user${i + 2}@example.com`,
        })),
    });

    console.log(`Created creator: ${creator.name} (${creator.id})`);
    console.log(`Created auction: ${auction.title} (${auction.id})`);
    console.log("Created 99 bidder users");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
