import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(body: any): Promise<{
        message: string;
        userId: string;
    }>;
    login(body: any): Promise<{
        token: string;
        user: {
            id: string;
            username: string;
            role: string;
        };
    }>;
    getProfile(userId: string): Promise<{
        username: string;
        id: string;
        role: string;
    }>;
}
