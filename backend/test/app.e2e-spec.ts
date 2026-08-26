/**
 * =================================================================
 * E2E Bootstrap — valida que o AppModule compila e inicializa
 * =================================================================
 * Teste mínimo de integridade do módulo raiz, sem dependências
 * externas problemáticas (supertest/types não existe).
 *
 * Rodar: npm run test:e2e
 * =================================================================
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('AppModule (e2e bootstrap)', () => {
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterAll(async () => {
    if (moduleFixture) {
      await moduleFixture.close();
    }
  });

  it('compila e inicializa o módulo raiz', async () => {
    const app = moduleFixture.createNestApplication();
    await app.init();
    expect(app).toBeDefined();
    await app.close();
  });
});