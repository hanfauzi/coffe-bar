"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(body) {
        const { username, password } = body;
        if (!username || !password) {
            this.logger.warn('Registrasi gagal: Username atau password kosong');
            throw new common_1.BadRequestException('Username and password are required');
        }
        try {
            const existing = await this.prisma.user.findUnique({
                where: { username },
            });
            if (existing) {
                this.logger.warn(`Registrasi gagal: Username "${username}" sudah digunakan`);
                throw new common_1.BadRequestException('Username already exists');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await this.prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: 'owner',
                },
            });
            this.logger.log(`Registrasi berhasil: User "${username}" (ID: ${user.id}) telah didaftarkan`);
            return {
                message: 'Registration successful',
                userId: user.id,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Registrasi gagal untuk user "${username}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async login(body) {
        const { username, password } = body;
        if (!username || !password) {
            this.logger.warn('Login gagal: Username atau password kosong');
            throw new common_1.BadRequestException('Username and password are required');
        }
        try {
            const user = await this.prisma.user.findUnique({
                where: { username },
            });
            if (!user) {
                this.logger.warn(`Login gagal: Username "${username}" tidak ditemukan`);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const matches = await bcrypt.compare(password, user.password);
            if (!matches) {
                this.logger.warn(`Login gagal: Password salah untuk username "${username}"`);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const payload = { sub: user.id, username: user.username, role: user.role };
            this.logger.log(`Login berhasil: User "${username}" (ID: ${user.id}) masuk`);
            return {
                token: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException)
                throw error;
            this.logger.error(`Login error untuk user "${username}": ${error.message}`, error.stack);
            throw error;
        }
    }
    async getProfile(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, username: true, role: true },
            });
            if (!user) {
                this.logger.warn(`Profil tidak ditemukan untuk User ID: "${userId}"`);
                throw new common_1.UnauthorizedException('User not found');
            }
            return user;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            this.logger.error(`Gagal mengambil profil untuk User ID "${userId}": ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map