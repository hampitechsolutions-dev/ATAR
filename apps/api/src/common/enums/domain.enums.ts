export enum MembershipRole {
  ADMIN = 'ADMIN',
  BUYER = 'BUYER',
  SUPPLIER = 'SUPPLIER',
  SELLER = 'SELLER',
}

export enum CompanyType {
  BUYER = 'BUYER',
  SUPPLIER = 'SUPPLIER',
  HYBRID = 'HYBRID',
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REVIEWING = 'REVIEWING',
  AWARDED = 'AWARDED',
  CANCELLED = 'CANCELLED',
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  WITHDRAWN = 'WITHDRAWN',
}
