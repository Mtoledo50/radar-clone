🏦 Extrator Bancário Inteligente (Radar Conta Certa)
Módulo autônomo de ingestão, classificação e exportação de extratos bancários via PDF.
O Extrator Bancário é um microserviço especializado que elimina as horas manuais de digitação e classificação de extratos. Ele lê PDFs nativos ou escaneados, identifica o banco automaticamente, extrai os lançamentos com precisão contábil, aplica um Motor de Regras com IA de Aprendizado (Fallback Inteligente) e exporta um CSV padronizado pronto para importação no SaaS principal (NestJS/Prisma).
<div align="center">
<img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-0.103+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Homologado_✅-22c55e?style=for-the-badge" />
</div>

🌟 Destaques da Sprint A2 (Setembro/2026)
🧠 Motor de Regras V4 (Fallback Inteligente): O sistema aprende com o contador. Se você classificar um "PIX - RECEITA FEDERAL" hoje, ele sempre cairá na conta de impostos. Os demais PIX genéricos herdam automaticamente a regra "pai" (Fallback).
📅 Suporte Multimes (Itaú PJ): Parser capaz de ler extratos consolidados de até 12 meses, extraindo a data completa (DD/MM/AAAA) de cada lançamento.
🛡️ Blindagem Windows/Linux: Persistência de regras usando caminhos absolutos (pathlib.Path.resolve()), eliminando erros de FileNotFound dependendo de onde o terminal é aberto.
🔄 Human-in-the-Loop: Revisão manual inline no Frontend antes de gravar as regras ou gerar o CSV final, garantindo compliance contábil.

🏗️ Arquitetura do Módulo
O módulo é dividido em duas aplicações independentes que se comunicam via REST API:
1. Backend (FastAPI + Python)
Responsável pelo processamento pesado, extração de texto e motor de inteligência.
Parser Factory: Detecta automaticamente o banco (Itaú, BB, Banrisul, Sicredi) analisando o conteúdo do PDF.
Extração Híbrida: Usa pdfplumber para PDFs nativos e PyMuPDF como fallback. Se o PDF for uma imagem escaneada, aciona o Mistral OCR.
Motor de Classificação: Lê o arquivo data/regras/regras_aprendidas.json, normaliza strings (remove hífens, espaços, upper case) e aplica matches por especificidade.
Gerador CSV: Cria arquivos com encoding UTF-8+BOM e separador ;, incluindo as colunas Conta_Debito e Conta_Credito.
2. Frontend (React + Vite)
Interface de usuário para upload, revisão e aprovação.
Upload Drag & Drop: Envio seguro de PDFs (limite 10MB).
Tabela Interativa: Edição inline das contas contábeis (Débito/Crédito).
Modal de Aprendizado: Agrupa edições manuais por descrição completa e salva em lote no backend.
🚀 Instalação e Execução Local
Pré-requisitos
Python 3.11+
Node.js 18+
npm 9+
Passo 1: Backend (API Python)

# Navegue até a pasta do backend
cd extrator-bancario/backend

# Crie e ative o ambiente virtual (recomendado)
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor FastAPI (porta 8000)
uvicorn app.main:app --reload --port 8000

A API estará disponível em http://localhost:8000 (Docs Swagger em /docs).
Passo 2: Frontend (Interface React)

# Em um novo terminal, navegue até a pasta do frontend
cd extrator-bancario/frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento (porta 5173 ou 5174)
npm run dev

Acesse http://localhost:5173 no navegador.
🧠 Como funciona o Motor de Regras (IA Contábil)
O grande diferencial do Extrator é a sua capacidade de aprendizado contínuo sem precisar de treinos complexos de Machine Learning. Ele usa um sistema de Regras Baseadas em Especificidade com Fallback.
Exemplo Prático:
Imagine que você tem estas regras salvas no JSON:
PAGAMENTOS PIX QR-CODE ➔ Débito: 150, Crédito: 616 (Regra Genérica)
PAGAMENTOS PIX QR-CODE - RECEITA FEDERAL ➔ Débito: 1881, Crédito: 616 (Regra Específica)
Ao subir um extrato com 100 lançamentos, o Motor V4 faz o seguinte:
Ordena as regras da mais longa/específica para a mais curta/genérica.
Para cada lançamento, tenta casar com a Receita Federal primeiro. Se o lançamento for "PAGAMENTOS PIX QR-CODE - RECEITA FEDERAL 00.394...", ele aplica 1881/616.
Se o lançamento for "PAGAMENTOS PIX QR-CODE - CLARO", ele não acha a regra específica. Então, ativa o Fallback Genérico: procura a regra pai "PAGAMENTOS PIX QR-CODE" e aplica 150/616.
Normalização Blindada
Para garantir que "Pix - Receita" case com "PIX - RECEITA", o sistema aplica a função normalizar_texto() tanto no salvamento quanto na leitura:
Converte tudo para UPPER CASE.
Remove espaços duplicados.
Remove hífens soltos nas pontas.
Compara contas bancárias usando apenas números (re.sub(r'\D', '', conta)), ignorando hífens ou pontos.

📁 Estrutura de Arquivos Principais

extrator-bancario/
├── backend/
│   ├── app/
│   │   ├── main.py                 # API FastAPI, CORS, Endpoints e Motor V4
│   │   ├── models/
│   │   │   └── lancamento.py       # Pydantic models (ExtratoBancario, Lancamento)
│   │   ├── parsers/
│   │   │   ├── itau.py             # 🆕 Parser Itaú PJ Multimes
│   │   │   ├── bb.py               # Parser Banco do Brasil (anti-falso positivo)
│   │   │   ├── banrisul.py         # Parser Banrisul
│   │   │   ├── sicredi.py          # Parser Sicredi
│   │   │   └── parser_factory.py   # Detecção automática de banco
│   │   └── services/
│   │       └── ocr_service.py      # Integração Mistral OCR (fallback)
│   └── data/
│       ├── exports/                # CSVs gerados prontos para download
│       ├── regras/
│       │   └── regras_aprendidas.json # 🧠 Cérebro do sistema (persistência)
│       └── uploads/                # PDFs temporários durante o processamento
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Orquestração de estado e chamadas API
│   │   ├── components/
│   │   │   ├── FileUpload.jsx      # Dropzone de PDFs
│   │   │   ├── LancamentosTable.jsx# Tabela editável com data inteligente
│   │   │   └── ModalSalvarRegrasLote.jsx
│   │   └── services/
│   │       └── api.js              # Cliente Axios configurado para localhost:8000

🔌 Endpoints da API (Backend)

Método      Rota                        Descrição
GET         /api/health                 Verifica se a API está online.
POST        /api/parse-extrato          Recebe o PDF (multipart/form-data), extrai e retorna JSON bruto.
POST        /api/classificar            Recebe os lançamentos brutos, aplica o Motor de Regras V4 e devolve classificados.
POST        /api/salvar-regras-lote     Salva/atualiza regras aprendidas no regras_aprendidas.json.
GET         /api/regras                 Lista todas as regras atualmente salvas no disco.
POST        /api/gerar-csv              Gera o arquivo CSV final com as contas contábeis preenchidas.
GET         /api/download/{filename}    Retorna o arquivo CSV para download no navegador.

🛠️ Decisões Técnicas (ADRs do Módulo)
ADR-M01 (Caminho Absoluto): Uso de Path(__file__).resolve().parent.parent para definir o diretório de regras. Resolve bugs críticos no Windows onde o caminho relativo mudava dependendo do diretório de execução do terminal.
ADR-M02 (Matching por Especificidade): Regras ordenadas por len(descricao) decrescente. Garante que sufixos (ex: - CLARO) tenham prioridade absoluta sobre tipos genéricos.
ADR-M03 (Conta Apenas Números): Comparação de contas bancárias ignora qualquer caractere não numérico (re.sub(r'\D', '', ...)). Permite que 0099485-1 case perfeitamente com 00994851.
ADR-M04 (Payload Aninhado): O endpoint /api/classificar retorna { success: true, data: { lancamentos: [...] } }. O Frontend foi ajustado para ler response.data.data.lancamentos, resolvendo o bug de tela vazia após F5.
🤝 Integração com o SaaS Principal
O objetivo final deste módulo é alimentar o endpoint POST /banking/import do backend NestJS principal.
Fluxo Futuro (Sprint 32+):
Usuário faz upload do PDF no Frontend Principal (Next.js).
Next.js envia o PDF para o Microserviço Extrator (FastAPI).
Extrator processa, aplica regras e devolve o JSON classificado.
Next.js recebe o JSON e chama o NestJS (/banking/import) já com as contas contábeis preenchidas.
NestJS grava no PostgreSQL via Prisma ORM.

Desenvolvido com ❤️ para o Radar Conta Certa — Transformando a contabilidade brasileira, um extrato por vez.