import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: [
                { emit: "event", level: "query" },
                { emit: "stdout", level: "info" },
                { emit: "stdout", level: "warn" },
                { emit: "stdout", level: "error" },
            ],
            errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
        } catch (error) {
            Logger.error(error);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
