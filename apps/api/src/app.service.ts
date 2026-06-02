import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'ATAR API',
      status: 'ok',
      version: '0.1.0',
      surfaces: ['web', 'mobile', 'api'],
      modules: ['auth', 'catalog', 'users', 'requests', 'quotes'],
    };
  }
}
