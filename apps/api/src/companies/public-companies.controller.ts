import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '../users/users.service';

/**
 * Endpoints publicos de empresas.
 * Los usa el registro: un vendedor tiene que poder elegir su empresa antes de
 * tener cuenta.
 */
@Controller('public/companies')
export class PublicCompaniesController {
  constructor(private readonly usersService: UsersService) {}

  @Get('suppliers')
  listSuppliers(@Query('search') search?: string) {
    return this.usersService.listSupplierDirectory(search);
  }
}
