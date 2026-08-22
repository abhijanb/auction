import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({ url: process.env["DATABASE_URL"] ?? "file:./prisma/dev.db" });
const adapter = new PrismaLibSql(libsql);

const prisma = new PrismaClient({ adapter });

export default prisma;
