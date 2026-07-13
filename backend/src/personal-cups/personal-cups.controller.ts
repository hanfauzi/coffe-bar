import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PersonalCupsService } from './personal-cups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/personal-cups')
export class PersonalCupsController {
  constructor(private service: PersonalCupsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
