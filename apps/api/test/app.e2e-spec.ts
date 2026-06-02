import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({
        name: 'ATAR API',
        status: 'ok',
        version: '0.1.0',
        surfaces: ['web', 'mobile', 'api'],
        modules: ['auth', 'catalog', 'users', 'requests', 'quotes'],
      });
  });

  it('registers, logs in and returns the authenticated profile', async () => {
    const email = `buyer.${Date.now()}@atar.test`;

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123',
        firstName: 'Juan',
        lastName: 'Compras',
        companyName: 'Compradora Demo',
        companyType: 'BUYER',
        role: 'BUYER',
      })
      .expect(201);

    expect(registerResponse.body.accessToken).toBeDefined();
    expect(registerResponse.body.user.email).toBe(email);
    expect(registerResponse.body.user.memberships).toHaveLength(1);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'Password123',
      })
      .expect(201);

    expect(loginResponse.body.accessToken).toBeDefined();

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe(email);
    expect(meResponse.body.memberships[0].role).toBe('BUYER');
    expect(meResponse.body.memberships[0].company.name).toBe('Compradora Demo');
  });

  it('allows a buyer to publish a request and a supplier to submit a quote', async () => {
    const buyerEmail = `buyer.flow.${Date.now()}@atar.test`;
    const supplierEmail = `supplier.flow.${Date.now()}@atar.test`;

    const buyerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: buyerEmail,
        password: 'Password123',
        firstName: 'Ana',
        lastName: 'Compradora',
        companyName: 'Compras Industriales SA',
        companyType: 'BUYER',
        role: 'BUYER',
      })
      .expect(201);

    const supplierRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: supplierEmail,
        password: 'Password123',
        firstName: 'Pedro',
        lastName: 'Proveedor',
        companyName: 'Proveedor Metal SRL',
        companyType: 'SUPPLIER',
        role: 'SUPPLIER',
      })
      .expect(201);

    const buyerToken = buyerRegister.body.accessToken;
    const supplierToken = supplierRegister.body.accessToken;

    const requestResponse = await request(app.getHttpServer())
      .post('/api/requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Chapas galvanizadas',
        description: 'Necesitamos una cotizacion para chapas galvanizadas de 2 mm con entrega en CABA.',
        category: 'Metales',
        privateRequest: false,
        status: 'PUBLISHED',
      })
      .expect(201);

    expect(requestResponse.body.title).toBe('Chapas galvanizadas');
    expect(requestResponse.body.status).toBe('PUBLISHED');

    const requestId = requestResponse.body.id;

    const openRequests = await request(app.getHttpServer())
      .get('/api/requests/open')
      .set('Authorization', `Bearer ${supplierToken}`)
      .expect(200);

    expect(openRequests.body.some((item: { id: string }) => item.id === requestId)).toBe(true);

    const quoteResponse = await request(app.getHttpServer())
      .post(`/api/quotes/request/${requestId}`)
      .set('Authorization', `Bearer ${supplierToken}`)
      .send({
        amount: 1250000,
        currency: 'ARS',
        leadTimeDays: 7,
        paymentTerms: '30 dias',
        technicalComment: 'Incluye corte a medida y embalaje industrial.',
      })
      .expect(201);

    expect(quoteResponse.body.status).toBe('SUBMITTED');
    expect(quoteResponse.body.supplierCompany.name).toBe('Proveedor Metal SRL');

    const quotesForBuyer = await request(app.getHttpServer())
      .get(`/api/requests/${requestId}/quotes`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(quotesForBuyer.body).toHaveLength(1);
    expect(quotesForBuyer.body[0].amount).toBe(1250000);

    const supplierQuotes = await request(app.getHttpServer())
      .get('/api/quotes/mine')
      .set('Authorization', `Bearer ${supplierToken}`)
      .expect(200);

    expect(supplierQuotes.body).toHaveLength(1);
    expect(supplierQuotes.body[0].request.id).toBe(requestId);

    const requestDetail = await request(app.getHttpServer())
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(requestDetail.body.events).toHaveLength(2);
    expect(requestDetail.body.events[0].type).toBe('QUOTE_SUBMITTED');
    expect(requestDetail.body.events[1].type).toBe('REQUEST_CREATED');
  });

  it('allows a buyer to award a submitted quote and closes the request', async () => {
    const buyerEmail = `buyer.award.${Date.now()}@atar.test`;
    const supplierAEmail = `supplier.award.a.${Date.now()}@atar.test`;
    const supplierBEmail = `supplier.award.b.${Date.now()}@atar.test`;

    const buyerRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: buyerEmail,
        password: 'Password123',
        firstName: 'Laura',
        lastName: 'Compradora',
        companyName: 'Compras Tecnicas SA',
        companyType: 'BUYER',
        role: 'BUYER',
      })
      .expect(201);

    const supplierARegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: supplierAEmail,
        password: 'Password123',
        firstName: 'Mario',
        lastName: 'Proveedor',
        companyName: 'Proveedor Uno SRL',
        companyType: 'SUPPLIER',
        role: 'SUPPLIER',
      })
      .expect(201);

    const supplierBRegister = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: supplierBEmail,
        password: 'Password123',
        firstName: 'Sofia',
        lastName: 'Proveedor',
        companyName: 'Proveedor Dos SRL',
        companyType: 'SUPPLIER',
        role: 'SUPPLIER',
      })
      .expect(201);

    const buyerToken = buyerRegister.body.accessToken;
    const supplierAToken = supplierARegister.body.accessToken;
    const supplierBToken = supplierBRegister.body.accessToken;

    const requestResponse = await request(app.getHttpServer())
      .post('/api/requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Valvulas industriales',
        description: 'Necesitamos cotizacion por lote para valvulas de acero inoxidable.',
        category: 'Valvulas',
        privateRequest: false,
        status: 'PUBLISHED',
      })
      .expect(201);

    const requestId = requestResponse.body.id;

    const quoteAResponse = await request(app.getHttpServer())
      .post(`/api/quotes/request/${requestId}`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        amount: 980000,
        currency: 'ARS',
        leadTimeDays: 5,
        paymentTerms: 'Contado anticipado',
        technicalComment: 'Entrega inmediata desde stock.',
      })
      .expect(201);

    const quoteBResponse = await request(app.getHttpServer())
      .post(`/api/quotes/request/${requestId}`)
      .set('Authorization', `Bearer ${supplierBToken}`)
      .send({
        amount: 1100000,
        currency: 'ARS',
        leadTimeDays: 9,
        paymentTerms: '30 dias',
        technicalComment: 'Incluye garantia extendida.',
      })
      .expect(201);

    expect(quoteAResponse.body.request.status).toBe('REVIEWING');

    const awardResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/award`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        quoteId: quoteAResponse.body.id,
      })
      .expect(201);

    expect(awardResponse.body.status).toBe('AWARDED');
    expect(awardResponse.body.awardedQuoteId).toBe(quoteAResponse.body.id);
    expect(awardResponse.body.awardedQuote.id).toBe(quoteAResponse.body.id);

    const negotiationResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/progress`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        action: 'START_NEGOTIATION',
      })
      .expect(201);

    expect(negotiationResponse.body.status).toBe('NEGOTIATING');

    const orderIssuedResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/progress`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        action: 'ISSUE_ORDER',
      })
      .expect(201);

    expect(orderIssuedResponse.body.status).toBe('ORDER_ISSUED');
    expect(orderIssuedResponse.body.order.orderNumber).toBeDefined();

    const orderUpdateResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/order`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        orderNumber: 'ATAR-TEST-0001',
        promisedDate: '2026-12-20',
        notes: 'Entrega parcial permitida en dos tandas.',
        fulfillmentStatus: 'CONFIRMED',
      })
      .expect(201);

    expect(orderUpdateResponse.body.order.orderNumber).toBe('ATAR-TEST-0001');
    expect(orderUpdateResponse.body.order.fulfillmentStatus).toBe('CONFIRMED');

    const quotesForBuyer = await request(app.getHttpServer())
      .get(`/api/requests/${requestId}/quotes`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(quotesForBuyer.body).toHaveLength(2);
    expect(quotesForBuyer.body.find((quote: { id: string }) => quote.id === quoteAResponse.body.id)?.status).toBe(
      'AWARDED',
    );
    expect(quotesForBuyer.body.find((quote: { id: string }) => quote.id === quoteBResponse.body.id)?.status).toBe(
      'REJECTED',
    );

    const supplierAQuotes = await request(app.getHttpServer())
      .get('/api/quotes/mine')
      .set('Authorization', `Bearer ${supplierAToken}`)
      .expect(200);

    expect(supplierAQuotes.body[0].status).toBe('AWARDED');
    expect(supplierAQuotes.body[0].request.status).toBe('ORDER_ISSUED');
    expect(supplierAQuotes.body[0].request.order.orderNumber).toBe('ATAR-TEST-0001');

    const supplierBQuotes = await request(app.getHttpServer())
      .get('/api/quotes/mine')
      .set('Authorization', `Bearer ${supplierBToken}`)
      .expect(200);

    expect(supplierBQuotes.body[0].status).toBe('REJECTED');
    expect(supplierBQuotes.body[0].request.status).toBe('ORDER_ISSUED');

    const confirmOrderResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/order/fulfillment`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        action: 'CONFIRM_ORDER',
      })
      .expect(201);

    expect(confirmOrderResponse.body.order.fulfillmentStatus).toBe('CONFIRMED');

    const productionResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/order/fulfillment`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        action: 'START_PRODUCTION',
      })
      .expect(201);

    expect(productionResponse.body.order.fulfillmentStatus).toBe('IN_PRODUCTION');

    const dispatchResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/order/fulfillment`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        action: 'MARK_DISPATCHED',
      })
      .expect(201);

    expect(dispatchResponse.body.order.fulfillmentStatus).toBe('DISPATCHED');

    const deliveredResponse = await request(app.getHttpServer())
      .post(`/api/requests/${requestId}/order/fulfillment`)
      .set('Authorization', `Bearer ${supplierAToken}`)
      .send({
        action: 'MARK_DELIVERED',
      })
      .expect(201);

    expect(deliveredResponse.body.order.fulfillmentStatus).toBe('DELIVERED');

    const openRequestsForSupplierA = await request(app.getHttpServer())
      .get('/api/requests/open')
      .set('Authorization', `Bearer ${supplierAToken}`)
      .expect(200);

    expect(openRequestsForSupplierA.some((item: { id: string }) => item.id === requestId)).toBe(false);

    const awardedRequestDetail = await request(app.getHttpServer())
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(awardedRequestDetail.body.status).toBe('ORDER_ISSUED');
    expect(awardedRequestDetail.body.order.orderNumber).toBe('ATAR-TEST-0001');
    expect(awardedRequestDetail.body.order.fulfillmentStatus).toBe('DELIVERED');
    expect(awardedRequestDetail.body.events).toHaveLength(11);
    expect(awardedRequestDetail.body.events[0].type).toBe('ORDER_DELIVERED');
    expect(awardedRequestDetail.body.events[1].type).toBe('ORDER_DISPATCHED');
    expect(awardedRequestDetail.body.events[2].type).toBe('PRODUCTION_STARTED');
    expect(awardedRequestDetail.body.events[3].type).toBe('ORDER_CONFIRMED');
  });

  afterEach(async () => {
    await app.close();
  });
});
