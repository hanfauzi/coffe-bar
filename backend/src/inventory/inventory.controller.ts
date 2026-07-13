import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get('transactions')
  async getTransactions(@Query('ingredientId') ingredientId?: string) {
    return this.service.getTransactions(ingredientId);
  }

  @Post('adjust')
  async adjustStock(@Body() body: any) {
    return this.service.adjustStock(body);
  }
}
