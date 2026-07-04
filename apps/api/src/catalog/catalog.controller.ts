import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CompanyType, MembershipRole, QuoteStatus, RequestStatus } from '../common/enums/domain.enums';
import { CatalogService } from './catalog.service';
import { UsersService } from '../users/users.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly usersService: UsersService,
    private readonly catalogService: CatalogService,
  ) {}

  @Get('bootstrap')
  getBootstrapCatalog() {
    return {
      roles: Object.values(MembershipRole),
      companyTypes: Object.values(CompanyType),
      requestStatuses: Object.values(RequestStatus),
      quoteStatuses: Object.values(QuoteStatus),
    };
  }

  @Get('request-categories')
  listRequestCategories() {
    return this.catalogService.listRequestCategories();
  }

  @Get('suppliers')
  listMarketplaceSuppliers() {
    return this.usersService.listMarketplaceSuppliers();
  }

  @Get('stats')
  getMarketplaceStats() {
    return this.usersService.getMarketplaceStats();
  }

  @Get('suppliers/:slug')
  async findMarketplaceSupplier(@Param('slug') slug: string) {
    const supplier = await this.usersService.findMarketplaceSupplierBySlug(slug);

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado.');
    }

    return supplier;
  }
}
