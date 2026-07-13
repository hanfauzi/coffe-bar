import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.service.getDashboard();
  }

  @Get('financials')
  async getReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getReports(startDate, endDate);
  }
}
