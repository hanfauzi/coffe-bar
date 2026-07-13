import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/recipes')
export class RecipesController {
  constructor(private service: RecipesService) {}

  @Get('menu/:menuId')
  async findByMenu(@Param('menuId') menuId: string) {
    return this.service.findByMenu(menuId);
  }

  @Post('menu/:menuId')
  async updateRecipe(@Param('menuId') menuId: string, @Body() body: { recipes: any[] }) {
    return this.service.updateRecipe(menuId, body.recipes);
  }
}
