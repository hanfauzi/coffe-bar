import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(body: any) {
    const { username, password } = body;
    if (!username || !password) {
      this.logger.warn('Registrasi gagal: Username atau password kosong');
      throw new BadRequestException('Username and password are required');
    }

    try {
      const existing = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existing) {
        this.logger.warn(`Registrasi gagal: Username "${username}" sudah digunakan`);
        throw new BadRequestException('Username already exists');
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
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Registrasi gagal untuk user "${username}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(body: any) {
    const { username, password } = body;
    if (!username || !password) {
      this.logger.warn('Login gagal: Username atau password kosong');
      throw new BadRequestException('Username and password are required');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        this.logger.warn(`Login gagal: Username "${username}" tidak ditemukan`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const matches = await bcrypt.compare(password, user.password);
      if (!matches) {
        this.logger.warn(`Login gagal: Password salah untuk username "${username}"`);
        throw new UnauthorizedException('Invalid credentials');
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
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) throw error;
      this.logger.error(`Login error untuk user "${username}": ${error.message}`, error.stack);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, role: true },
      });
      if (!user) {
        this.logger.warn(`Profil tidak ditemukan untuk User ID: "${userId}"`);
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Gagal mengambil profil untuk User ID "${userId}": ${error.message}`, error.stack);
      throw error;
    }
  }
}
