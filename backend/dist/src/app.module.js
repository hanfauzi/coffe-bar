"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma.service");
const auth_service_1 = require("./auth/auth.service");
const auth_controller_1 = require("./auth/auth.controller");
const jwt_strategy_1 = require("./auth/jwt.strategy");
const ingredients_service_1 = require("./ingredients/ingredients.service");
const ingredients_controller_1 = require("./ingredients/ingredients.controller");
const inventory_service_1 = require("./inventory/inventory.service");
const inventory_controller_1 = require("./inventory/inventory.controller");
const expenses_service_1 = require("./expenses/expenses.service");
const expenses_controller_1 = require("./expenses/expenses.controller");
const menus_service_1 = require("./menus/menus.service");
const menus_controller_1 = require("./menus/menus.controller");
const recipes_service_1 = require("./recipes/recipes.service");
const recipes_controller_1 = require("./recipes/recipes.controller");
const sales_service_1 = require("./sales/sales.service");
const sales_controller_1 = require("./sales/sales.controller");
const personal_cups_service_1 = require("./personal-cups/personal-cups.service");
const personal_cups_controller_1 = require("./personal-cups/personal-cups.controller");
const reports_service_1 = require("./reports/reports.service");
const reports_controller_1 = require("./reports/reports.controller");
const orders_service_1 = require("./orders/orders.service");
const orders_controller_1 = require("./orders/orders.controller");
const reconciliations_service_1 = require("./reconciliations/reconciliations.service");
const reconciliations_controller_1 = require("./reconciliations/reconciliations.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const secret = configService.get('JWT_SECRET');
                    if (!secret) {
                        throw new Error('JWT_SECRET must be defined in the configuration.');
                    }
                    return {
                        secret,
                        signOptions: { expiresIn: '7d' },
                    };
                },
            }),
        ],
        controllers: [
            app_controller_1.AppController,
            auth_controller_1.AuthController,
            ingredients_controller_1.IngredientsController,
            inventory_controller_1.InventoryController,
            expenses_controller_1.ExpensesController,
            menus_controller_1.MenusController,
            recipes_controller_1.RecipesController,
            sales_controller_1.SalesController,
            personal_cups_controller_1.PersonalCupsController,
            reports_controller_1.ReportsController,
            orders_controller_1.OrdersController,
            reconciliations_controller_1.ReconciliationsController,
        ],
        providers: [
            app_service_1.AppService,
            prisma_service_1.PrismaService,
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            ingredients_service_1.IngredientsService,
            inventory_service_1.InventoryService,
            expenses_service_1.ExpensesService,
            menus_service_1.MenusService,
            recipes_service_1.RecipesService,
            sales_service_1.SalesService,
            personal_cups_service_1.PersonalCupsService,
            reports_service_1.ReportsService,
            orders_service_1.OrdersService,
            reconciliations_service_1.ReconciliationsService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map