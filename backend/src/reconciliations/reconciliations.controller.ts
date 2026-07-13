import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReconciliationsService } from './reconciliations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/reconciliations')
export class ReconciliationsController {
  constructor(private service: ReconciliationsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }
}
