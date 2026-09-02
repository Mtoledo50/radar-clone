# 🗺️ Mapa de Módulos (ownership)

## Backend
| Módulo | Services | Rotas principais |
|---|---|---|
| auth | AuthService | /auth/login, /auth/refresh, /users/me |
| clients | ClientService | /clients, /clients/metrics |
| employees | EmployeesService | /employees, /employees/position-benchmark |
| pricings | PricingsService | /pricings, /commercial-plans/* |
| accounting | AccountingService, HistoryService, TrialBalanceService, LedgerService, ReconciliationService, SmartImportService, PdfExtractService, ClientWorkspaceService | /accounting/*, /client-workspace/* |
| financial/bi | FinancialService, BiService | /financial/*, /bi/* |
| digital-employee | AuroraService | /digital-employee/* |
| admin | AdminService | /admin/* |

## Frontend (rotas → páginas)
/dashboard, /dashboard/clientes, /dashboard/clientes/workspace,
/dashboard/lancamentos, /dashboard/contabil/*, /dashboard/fechamento,
/dashboard/fechamento/extrato-pdf, /dashboard/fiscal/*, /dashboard/pessoas/*,
/dashboard/precificacao/*, /dashboard/bi/*, /dashboard/admin/*

## Regra de registro (NestJS)
Controller → array `controllers` do módulo.
Service → array `providers` (+ `exports` se usado fora).
Arquivo novo = atualizar módulo NO MESMO commit.