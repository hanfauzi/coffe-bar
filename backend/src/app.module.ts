import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtStrategy } from './auth/jwt.strategy';

import { IngredientsService } from './ingredients/ingredients.service';
import { IngredientsController } from './ingredients/ingredients.controller';

import { InventoryService } from './inventory/inventory.service';
import { InventoryController } from './inventory/inventory.controller';

import { ExpensesService } from './expenses/expenses.service';
import { ExpensesController } from './expenses/expenses.controller';

import { MenusService } from './menus/menus.service';
import { MenusController } from './menus/menus.controller';

import { RecipesService } from './recipes/recipes.service';
import { RecipesController } from './recipes/recipes.controller';

import { SalesService } from './sales/sales.service';
import { SalesController } from './sales/sales.controller';

import { PersonalCupsService } from './personal-cups/personal-cups.service';
import { PersonalCupsController } from './personal-cups/personal-cups.controller';

import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';

import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';

import { ReconciliationsService } from './reconciliations/reconciliations.service';
import { ReconciliationsController } from './reconciliations/reconciliations.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'coffee_secret_key_12345',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    IngredientsController,
    InventoryController,
    ExpensesController,
    MenusController,
    RecipesController,
    SalesController,
    PersonalCupsController,
    ReportsController,
    OrdersController,
    ReconciliationsController,
  ],
  providers: [
    AppService,
    PrismaService,
    AuthService,
    JwtStrategy,
    IngredientsService,
    InventoryService,
    ExpensesService,
    MenusService,
    RecipesService,
    SalesService,
    PersonalCupsService,
    ReportsService,
    OrdersService,
    ReconciliationsService,
  ],
})
export class AppModule {}
