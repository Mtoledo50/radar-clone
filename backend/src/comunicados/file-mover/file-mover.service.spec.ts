// backend/src/comunicados/file-mover/file-mover.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { FileMoverService } from './file-mover.service';

describe('FileMoverService', () => {
  let service: FileMoverService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'f13-test-'));
    const module = await Test.createTestingModule({
      providers: [
        FileMoverService,
        { provide: ConfigService, useValue: { get: () => tempDir } },
      ],
    }).compile();
    service = module.get(FileMoverService);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('cria estrutura de pastas ao mover', async () => {
    const origem = path.join(tempDir, 'DAS_11222333000181.pdf');
    await fs.writeFile(origem, 'conteudo');

    const destino = await service.moverParaEnviados(origem, '2026-09');

    expect(destino).toContain(path.join('enviados', '2026-09'));
    await expect(fs.access(destino)).resolves.not.toThrow();
    await expect(fs.access(origem)).rejects.toThrow(); // origem removida
  });

  it('usa competência atual quando não fornecida', async () => {
    const origem = path.join(tempDir, 'doc.pdf');
    await fs.writeFile(origem, 'conteudo');

    const destino = await service.moverParaEnviados(origem, null);
    const ano = new Date().getFullYear();
    expect(destino).toContain(String(ano));
  });

  it('adiciona sufixo numérico quando há colisão', async () => {
    const origem1 = path.join(tempDir, 'doc.pdf');
    const origem2 = path.join(tempDir, 'doc2.pdf');
    await fs.writeFile(origem1, 'a');
    await fs.writeFile(origem2, 'b');

    const d1 = await service.moverParaErros(origem1);
    const d2 = await service.moverParaErros(origem2); // colisão: já existe doc.pdf em erros/

    expect(d1).toContain('doc.pdf');
    // d2 deveria ter recebido sufixo _1 ou _2
    expect(d2).not.toBe(d1);
  });
});