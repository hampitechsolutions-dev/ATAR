import { Injectable } from '@nestjs/common';
import {
  RequestCatalogFieldType,
  RequestCatalogInputType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listRequestCategories() {
    const categories = await this.prisma.requestCatalogCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      include: {
        fields: {
          where: {
            isActive: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      label: category.label,
      subtitle: category.subtitle,
      imageSrc: category.imageSrc,
      imageClassName: category.imageClassName,
      searchKeywords: category.searchKeywords,
      fields: category.fields.map((field) => ({
        id: field.key,
        label: field.label,
        type: this.mapFieldType(field.type),
        options: field.options,
        placeholder: field.placeholder,
        helper: field.helper,
        required: field.required,
        fullWidth: field.fullWidth,
        inputType: this.mapInputType(field.inputType),
      })),
    }));
  }

  private mapFieldType(value: RequestCatalogFieldType) {
    switch (value) {
      case RequestCatalogFieldType.CHOICES:
        return 'choices';
      case RequestCatalogFieldType.SEGMENTED:
        return 'segmented';
      case RequestCatalogFieldType.INPUT:
        return 'input';
      case RequestCatalogFieldType.QUANTITY:
        return 'quantity';
      case RequestCatalogFieldType.UPLOADER:
        return 'uploader';
      default:
        return 'textarea';
    }
  }

  private mapInputType(value: RequestCatalogInputType | null) {
    if (value === RequestCatalogInputType.DATE) {
      return 'date';
    }

    if (value === RequestCatalogInputType.TEXT) {
      return 'text';
    }

    return null;
  }
}
