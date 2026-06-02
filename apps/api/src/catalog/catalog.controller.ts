import { Controller, Get } from '@nestjs/common';
import { CompanyType, MembershipRole, QuoteStatus, RequestStatus } from '../common/enums/domain.enums';

@Controller('catalog')
export class CatalogController {
  @Get('bootstrap')
  getBootstrapCatalog() {
    return {
      roles: Object.values(MembershipRole),
      companyTypes: Object.values(CompanyType),
      requestStatuses: Object.values(RequestStatus),
      quoteStatuses: Object.values(QuoteStatus),
    };
  }
}
