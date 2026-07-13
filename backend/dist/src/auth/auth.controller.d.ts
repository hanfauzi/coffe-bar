import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<{
        username: string;
        id: string;
        role: string;
    }>;
}
