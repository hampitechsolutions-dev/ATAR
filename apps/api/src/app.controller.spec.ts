import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return the API status payload', () => {
      expect(appController.getStatus()).toEqual({
        name: 'ATAR API',
        status: 'ok',
        version: '0.1.0',
        surfaces: ['web', 'mobile', 'api'],
        modules: ['auth', 'catalog', 'users', 'requests', 'quotes'],
      });
    });
  });
});
