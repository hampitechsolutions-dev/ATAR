import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PublicCompaniesController } from './public-companies.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CompaniesController, PublicCompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
