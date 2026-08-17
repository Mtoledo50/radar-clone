--
-- PostgreSQL database dump
--

\restrict s1LWJxl1bIY2JWQLLaEZKOxfVVRJcuEOy44CegJrvvpTCVsOHvZvJgPprLh3iF1

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccountNature; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."AccountNature" AS ENUM (
    'DEVEDORA',
    'CREDORA'
);


ALTER TYPE public."AccountNature" OWNER TO radar_user;

--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."AccountType" AS ENUM (
    'ATIVO',
    'PASSIVO',
    'PATRIMONIO_LIQUIDO',
    'RECEITA',
    'DESPESA'
);


ALTER TYPE public."AccountType" OWNER TO radar_user;

--
-- Name: ApprovalDecision; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."ApprovalDecision" AS ENUM (
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApprovalDecision" OWNER TO radar_user;

--
-- Name: AutonomyLevel; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."AutonomyLevel" AS ENUM (
    'AUTO',
    'REVIEW',
    'MANUAL'
);


ALTER TYPE public."AutonomyLevel" OWNER TO radar_user;

--
-- Name: ClientStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."ClientStatus" AS ENUM (
    'ATIVO',
    'PROSPECT',
    'INATIVO',
    'CHURN',
    'SUSPENSO'
);


ALTER TYPE public."ClientStatus" OWNER TO radar_user;

--
-- Name: Complexity; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."Complexity" AS ENUM (
    'BAIXA',
    'MEDIA',
    'ALTA'
);


ALTER TYPE public."Complexity" OWNER TO radar_user;

--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISMISSED'
);


ALTER TYPE public."EmployeeStatus" OWNER TO radar_user;

--
-- Name: FiscalDocumentType; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."FiscalDocumentType" AS ENUM (
    'NFE_ENTRADA',
    'NFE_DEVOLUCAO',
    'CTE'
);


ALTER TYPE public."FiscalDocumentType" OWNER TO radar_user;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'UPLOADED',
    'PARSING',
    'PARSED',
    'PARSE_ERROR',
    'AWAITING_REVIEW',
    'CONFIRMED',
    'CANCELLED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO radar_user;

--
-- Name: MatchStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."MatchStatus" AS ENUM (
    'SUGESTAO',
    'CONFIRMADO',
    'DESCARTADO'
);


ALTER TYPE public."MatchStatus" OWNER TO radar_user;

--
-- Name: MatchType; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."MatchType" AS ENUM (
    'AUTO',
    'MANUAL'
);


ALTER TYPE public."MatchType" OWNER TO radar_user;

--
-- Name: MovementType; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."MovementType" AS ENUM (
    'ENTRADA',
    'DEVOLUCAO',
    'AJUSTE_POSITIVO',
    'AJUSTE_NEGATIVO',
    'TRANSFERENCIA',
    'SALDO_INICIAL'
);


ALTER TYPE public."MovementType" OWNER TO radar_user;

--
-- Name: PendingStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."PendingStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
);


ALTER TYPE public."PendingStatus" OWNER TO radar_user;

--
-- Name: PlanningStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."PlanningStatus" AS ENUM (
    'PENDENTE',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'CANCELADO'
);


ALTER TYPE public."PlanningStatus" OWNER TO radar_user;

--
-- Name: PricingStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."PricingStatus" AS ENUM (
    'RASCUNHO',
    'APROVADO',
    'REJEITADO'
);


ALTER TYPE public."PricingStatus" OWNER TO radar_user;

--
-- Name: ProductMatchStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."ProductMatchStatus" AS ENUM (
    'IDENTIFIED',
    'SUGGESTED',
    'NEW'
);


ALTER TYPE public."ProductMatchStatus" OWNER TO radar_user;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ProjectStatus" OWNER TO radar_user;

--
-- Name: ProposalStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."ProposalStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'VIEWED',
    'CLOSED_WON',
    'CLOSED_LOST'
);


ALTER TYPE public."ProposalStatus" OWNER TO radar_user;

--
-- Name: Recurrence; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."Recurrence" AS ENUM (
    'AVULSO',
    'MENSAL',
    'TRIMESTRAL',
    'ANUAL'
);


ALTER TYPE public."Recurrence" OWNER TO radar_user;

--
-- Name: RobotWorkerStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."RobotWorkerStatus" AS ENUM (
    'ACTIVE',
    'PAUSED'
);


ALTER TYPE public."RobotWorkerStatus" OWNER TO radar_user;

--
-- Name: RunStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."RunStatus" AS ENUM (
    'RUNNING',
    'SUCCESS',
    'PARTIAL',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."RunStatus" OWNER TO radar_user;

--
-- Name: ServiceType; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."ServiceType" AS ENUM (
    'CONTABIL',
    'FISCAL',
    'PESSOAL',
    'MEI',
    'IRPF',
    'CONSULTORIA',
    'OUTROS'
);


ALTER TYPE public."ServiceType" OWNER TO radar_user;

--
-- Name: SkillKey; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."SkillKey" AS ENUM (
    'RECONCILIATION',
    'CLASSIFICATION',
    'ACCOUNTING_BRIDGE',
    'MONTHLY_REPORT',
    'TAX_GUIDES',
    'NFSE_IMPORT',
    'BILLING',
    'OBLIGATIONS'
);


ALTER TYPE public."SkillKey" OWNER TO radar_user;

--
-- Name: TaskCategory; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."TaskCategory" AS ENUM (
    'FISCAL',
    'CONTABIL',
    'DEPARTAMENTO_PESSOAL',
    'SOCIETARIO',
    'FINANCEIRO',
    'COMERCIAL',
    'INTERNO',
    'OUTRO'
);


ALTER TYPE public."TaskCategory" OWNER TO radar_user;

--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."TaskPriority" OWNER TO radar_user;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'BACKLOG',
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'BLOCKED',
    'DONE'
);


ALTER TYPE public."TaskStatus" OWNER TO radar_user;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."TransactionType" AS ENUM (
    'RECEITA',
    'DESPESA'
);


ALTER TYPE public."TransactionType" OWNER TO radar_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: radar_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'USER',
    'CLIENTE'
);


ALTER TYPE public."UserRole" OWNER TO radar_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO radar_user;

--
-- Name: account_templates; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.account_templates (
    id text NOT NULL,
    "reducedCode" integer NOT NULL,
    code text NOT NULL,
    "parentCode" text,
    name text NOT NULL,
    nickname text,
    "accountType" text NOT NULL,
    report text NOT NULL,
    "isSynthetic" boolean DEFAULT false NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.account_templates OWNER TO radar_user;

--
-- Name: accounting_accounts; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.accounting_accounts (
    id text NOT NULL,
    "companyId" text,
    code text NOT NULL,
    name text NOT NULL,
    type public."AccountType" NOT NULL,
    nature public."AccountNature" NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sciCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "reducedCode" integer
);


ALTER TABLE public.accounting_accounts OWNER TO radar_user;

--
-- Name: accounting_entries; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.accounting_entries (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "entryDate" timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    "documentNumber" text,
    "counterpartyName" text,
    "counterpartyCpfCnpj" text,
    "counterpartyType" text,
    "clientId" text,
    "debitAccountId" text,
    "debitValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "creditAccountId" text,
    "creditValue" numeric(12,2) DEFAULT 0 NOT NULL,
    source text DEFAULT 'MANUAL'::text NOT NULL,
    status text DEFAULT 'PENDENTE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bankTransactionId" text
);


ALTER TABLE public.accounting_entries OWNER TO radar_user;

--
-- Name: approval_records; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.approval_records (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    decision public."ApprovalDecision" NOT NULL,
    "decidedBy" text NOT NULL,
    "decidedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip text,
    notes text
);


ALTER TABLE public.approval_records OWNER TO radar_user;

--
-- Name: automation_audits; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.automation_audits (
    id text NOT NULL,
    "companyId" text NOT NULL,
    actor text DEFAULT 'AURORA'::text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text NOT NULL,
    detail jsonb,
    "robotVersion" text,
    ip text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.automation_audits OWNER TO radar_user;

--
-- Name: automation_pendings; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.automation_pendings (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "runId" text,
    type text NOT NULL,
    confidence double precision,
    payload jsonb NOT NULL,
    status public."PendingStatus" DEFAULT 'PENDING'::public."PendingStatus" NOT NULL,
    "resolvedBy" text,
    "resolvedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.automation_pendings OWNER TO radar_user;

--
-- Name: automation_runs; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.automation_runs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "workerId" text NOT NULL,
    "skillKey" public."SkillKey" NOT NULL,
    "triggerType" text DEFAULT 'CRON'::text NOT NULL,
    "triggeredBy" text,
    status public."RunStatus" DEFAULT 'RUNNING'::public."RunStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    "itemsProcessed" integer DEFAULT 0 NOT NULL,
    "itemsAutoApproved" integer DEFAULT 0 NOT NULL,
    "itemsPendingHuman" integer DEFAULT 0 NOT NULL,
    "itemsFailed" integer DEFAULT 0 NOT NULL,
    "secondsSaved" integer DEFAULT 0 NOT NULL,
    "errorMessage" text
);


ALTER TABLE public.automation_runs OWNER TO radar_user;

--
-- Name: bank_categories; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.bank_categories (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text,
    label text NOT NULL,
    "group" text NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bank_categories OWNER TO radar_user;

--
-- Name: bank_classification_rules; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.bank_classification_rules (
    id text NOT NULL,
    "companyId" text NOT NULL,
    pattern text NOT NULL,
    hits integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nature text NOT NULL
);


ALTER TABLE public.bank_classification_rules OWNER TO radar_user;

--
-- Name: bank_nfe_matches; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.bank_nfe_matches (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "bankTransactionId" text NOT NULL,
    "fiscalInvoiceId" text NOT NULL,
    score double precision NOT NULL,
    "matchType" public."MatchType" DEFAULT 'AUTO'::public."MatchType" NOT NULL,
    status public."MatchStatus" DEFAULT 'SUGESTAO'::public."MatchStatus" NOT NULL,
    "scoreBreakdown" jsonb,
    "confirmedAt" timestamp(3) without time zone,
    "confirmedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bank_nfe_matches OWNER TO radar_user;

--
-- Name: bank_statements; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.bank_statements (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text,
    year integer NOT NULL,
    month integer NOT NULL,
    "fileName" text,
    status text DEFAULT 'ABERTO'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bank_statements OWNER TO radar_user;

--
-- Name: bank_transactions; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.bank_transactions (
    id text NOT NULL,
    "statementId" text NOT NULL,
    "companyId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    counterparty text,
    amount numeric(12,2) NOT NULL,
    "classifiedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nature text DEFAULT 'NAO_CLASSIFICADO'::text NOT NULL
);


ALTER TABLE public.bank_transactions OWNER TO radar_user;

--
-- Name: cells; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.cells (
    id text NOT NULL,
    "sectorId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cells OWNER TO radar_user;

--
-- Name: client_contracts; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.client_contracts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    "commercialPlanId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "monthlyFee" numeric(10,2) NOT NULL,
    status text DEFAULT 'ATIVO'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.client_contracts OWNER TO radar_user;

--
-- Name: client_monthly_data; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.client_monthly_data (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "initialClients" integer DEFAULT 0 NOT NULL,
    "newClients" integer DEFAULT 0 NOT NULL,
    "churnedClients" integer DEFAULT 0 NOT NULL,
    "finalClients" integer DEFAULT 0 NOT NULL,
    "newRevenue" double precision DEFAULT 0 NOT NULL,
    "lostRevenue" double precision DEFAULT 0 NOT NULL,
    "finalRevenue" double precision DEFAULT 0 NOT NULL,
    "churnRate" double precision DEFAULT 0 NOT NULL,
    "accumulatedChurn" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.client_monthly_data OWNER TO radar_user;

--
-- Name: client_services; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.client_services (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    "serviceItemId" text NOT NULL,
    recurrence public."Recurrence" NOT NULL,
    status text DEFAULT 'ATIVO'::text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.client_services OWNER TO radar_user;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.clients (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyName" text NOT NULL,
    cnpj text,
    "monthlyFee" double precision NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "contactName" text,
    "contactEmail" text,
    "contactPhone" text,
    observations text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "serviceType" public."ServiceType" DEFAULT 'CONTABIL'::public."ServiceType" NOT NULL,
    status public."ClientStatus" DEFAULT 'ATIVO'::public."ClientStatus" NOT NULL,
    installments integer,
    "lastPaymentDate" timestamp(3) without time zone,
    "openAmount" double precision,
    "overdueAmount" double precision,
    "paidAmount" double precision
);


ALTER TABLE public.clients OWNER TO radar_user;

--
-- Name: commercial_plans; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.commercial_plans (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    multiplier double precision DEFAULT 1.0 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isIndependent" boolean DEFAULT false NOT NULL,
    color text,
    badge text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.commercial_plans OWNER TO radar_user;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    cnpj text,
    state text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    plan text DEFAULT 'BASIC'::text NOT NULL,
    "allowedModules" text[] DEFAULT ARRAY['dashboard'::text, 'pessoas'::text, 'clientes'::text],
    address text,
    "businessGoals" text,
    "deletedAt" timestamp(3) without time zone,
    email text,
    "logoUrl" text,
    phone text,
    "softwareStack" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public.companies OWNER TO radar_user;

--
-- Name: company_profiles; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.company_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "razaoSocial" text,
    cnpj text,
    estado text,
    "softwareConsultoria" boolean DEFAULT false NOT NULL,
    "softwareContabil" boolean DEFAULT false NOT NULL,
    "softwareFiscal" boolean DEFAULT false NOT NULL,
    "clientesHoje" integer DEFAULT 0 NOT NULL,
    "clientesAno" integer DEFAULT 0 NOT NULL,
    "funcionariosHoje" integer DEFAULT 0 NOT NULL,
    "funcionariosAno" integer DEFAULT 0 NOT NULL,
    "visaoEmpresa" text,
    "maiorDesafio" text,
    compromisso text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.company_profiles OWNER TO radar_user;

--
-- Name: dismissal_reasons; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.dismissal_reasons (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.dismissal_reasons OWNER TO radar_user;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.employees (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    "position" text NOT NULL,
    department text,
    "admissionDate" timestamp(3) without time zone NOT NULL,
    "dismissalDate" timestamp(3) without time zone,
    salary double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    status public."EmployeeStatus" DEFAULT 'ACTIVE'::public."EmployeeStatus" NOT NULL
);


ALTER TABLE public.employees OWNER TO radar_user;

--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.financial_transactions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "clientId" text,
    category text NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    type public."TransactionType" NOT NULL
);


ALTER TABLE public.financial_transactions OWNER TO radar_user;

--
-- Name: fiscal_icms_apurations; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_icms_apurations (
    id text NOT NULL,
    "companyId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "creditsIcms" numeric(12,2) DEFAULT 0 NOT NULL,
    "creditsIcmsSt" numeric(12,2) DEFAULT 0 NOT NULL,
    "purchasesValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "invoicesCount" integer DEFAULT 0 NOT NULL,
    "salesValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "debitRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "debitsIcms" numeric(12,2) DEFAULT 0 NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'ABERTA'::text NOT NULL,
    "closedAt" timestamp(3) without time zone,
    observations text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text
);


ALTER TABLE public.fiscal_icms_apurations OWNER TO radar_user;

--
-- Name: fiscal_inventory_balances; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_inventory_balances (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "productId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "initialQty" numeric(12,4) DEFAULT 0 NOT NULL,
    "initialValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "inQty" numeric(12,4) DEFAULT 0 NOT NULL,
    "inValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "outQty" numeric(12,4) DEFAULT 0 NOT NULL,
    "outValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "finalQty" numeric(12,4) DEFAULT 0 NOT NULL,
    "finalValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "averageCost" numeric(12,4) DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fiscal_inventory_balances OWNER TO radar_user;

--
-- Name: fiscal_inventory_movements; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_inventory_movements (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "productId" text NOT NULL,
    "invoiceId" text,
    type public."MovementType" NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    quantity numeric(12,4) NOT NULL,
    "unitCost" numeric(12,4) NOT NULL,
    "totalCost" numeric(12,2) NOT NULL,
    "averageCostAfter" numeric(12,4) NOT NULL,
    reason text,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clientId" text
);


ALTER TABLE public.fiscal_inventory_movements OWNER TO radar_user;

--
-- Name: fiscal_invoice_items; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_invoice_items (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "productId" text,
    "productMatchStatus" public."ProductMatchStatus" DEFAULT 'NEW'::public."ProductMatchStatus" NOT NULL,
    "itemNumber" integer NOT NULL,
    "supplierCode" text,
    description text NOT NULL,
    ncm text NOT NULL,
    cfop text NOT NULL,
    cst text,
    csosn text,
    quantity numeric(12,4) NOT NULL,
    "unitValue" numeric(12,4) NOT NULL,
    "totalValue" numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsBase" numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "icmsValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsStBase" numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsStValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "ipiBase" numeric(12,2) DEFAULT 0 NOT NULL,
    "ipiRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "ipiValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "pisBase" numeric(12,2) DEFAULT 0 NOT NULL,
    "pisRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "pisValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "cofinsBase" numeric(12,2) DEFAULT 0 NOT NULL,
    "cofinsRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "cofinsValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.fiscal_invoice_items OWNER TO radar_user;

--
-- Name: fiscal_invoices; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_invoices (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "supplierId" text NOT NULL,
    "documentType" public."FiscalDocumentType" DEFAULT 'NFE_ENTRADA'::public."FiscalDocumentType" NOT NULL,
    status public."InvoiceStatus" DEFAULT 'UPLOADED'::public."InvoiceStatus" NOT NULL,
    number text NOT NULL,
    series text NOT NULL,
    "accessKey" text NOT NULL,
    "emissionDate" timestamp(3) without time zone NOT NULL,
    "entryDate" timestamp(3) without time zone,
    cfop text,
    "natOp" text,
    "totalValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "discountValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "freightValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "insuranceValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "otherValues" numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsBase" numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "icmsStValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "ipiValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "pisValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "cofinsValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "xmlOriginalUrl" text,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text
);


ALTER TABLE public.fiscal_invoices OWNER TO radar_user;

--
-- Name: fiscal_products; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_products (
    id text NOT NULL,
    "companyId" text NOT NULL,
    code text,
    ean text,
    description text NOT NULL,
    ncm text NOT NULL,
    unit text NOT NULL,
    "averageCost" numeric(12,4) DEFAULT 0 NOT NULL,
    "currentStock" numeric(12,4) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "clientId" text,
    "unifiedCode" text
);


ALTER TABLE public.fiscal_products OWNER TO radar_user;

--
-- Name: fiscal_suppliers; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.fiscal_suppliers (
    id text NOT NULL,
    "companyId" text NOT NULL,
    cnpj text NOT NULL,
    name text NOT NULL,
    "tradeName" text,
    "stateRegistration" text,
    state text,
    email text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.fiscal_suppliers OWNER TO radar_user;

--
-- Name: historical_entries; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.historical_entries (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text,
    year integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "debitCode" text,
    "creditCode" text,
    amount numeric(12,2) NOT NULL,
    "historyCode" text,
    description text NOT NULL,
    "docNumber" text,
    "entryType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reducedCode" integer
);


ALTER TABLE public.historical_entries OWNER TO radar_user;

--
-- Name: plan_service_items; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.plan_service_items (
    id text NOT NULL,
    "planId" text NOT NULL,
    "serviceItemId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    quantity integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.plan_service_items OWNER TO radar_user;

--
-- Name: planning_action_plans; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.planning_action_plans (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "goalId" text NOT NULL,
    action text NOT NULL,
    responsible text NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDENTE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.planning_action_plans OWNER TO radar_user;

--
-- Name: planning_areas; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.planning_areas (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    leader text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.planning_areas OWNER TO radar_user;

--
-- Name: planning_cycles; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.planning_cycles (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    responsible text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.planning_cycles OWNER TO radar_user;

--
-- Name: planning_goals; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.planning_goals (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "objectiveId" text NOT NULL,
    "areaId" text,
    title text NOT NULL,
    "targetValue" double precision NOT NULL,
    unit text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.planning_goals OWNER TO radar_user;

--
-- Name: planning_kpis; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.planning_kpis (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    formula text,
    unit text NOT NULL,
    direction text NOT NULL,
    frequency text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.planning_kpis OWNER TO radar_user;

--
-- Name: planning_objectives; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.planning_objectives (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "cycleId" text NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    context text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.planning_objectives OWNER TO radar_user;

--
-- Name: plannings; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.plannings (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'GERAL'::text NOT NULL,
    "targetDate" timestamp(3) without time zone NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    status public."PlanningStatus" DEFAULT 'PENDENTE'::public."PlanningStatus" NOT NULL
);


ALTER TABLE public.plannings OWNER TO radar_user;

--
-- Name: positions; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.positions (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.positions OWNER TO radar_user;

--
-- Name: pricing_calculations; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.pricing_calculations (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    "proposalNumber" text,
    "clientName" text NOT NULL,
    "taxRegime" text NOT NULL,
    annex text,
    activity text NOT NULL,
    "monthlyRevenue" double precision NOT NULL,
    "employeeCount" integer NOT NULL,
    "dpMethod" text DEFAULT 'MARGIN'::text NOT NULL,
    "dpValue" double precision DEFAULT 0 NOT NULL,
    "hasBranches" boolean DEFAULT false NOT NULL,
    "hasErp" boolean DEFAULT false NOT NULL,
    "hoursFiscal" double precision DEFAULT 0 NOT NULL,
    "hoursAccounting" double precision DEFAULT 0 NOT NULL,
    "costPerHour" double precision DEFAULT 0 NOT NULL,
    "basePrice" double precision DEFAULT 0 NOT NULL,
    "currentCharge" double precision,
    "planPrices" jsonb,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pricing_calculations OWNER TO radar_user;

--
-- Name: pricing_configs; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.pricing_configs (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "salaryAverage" double precision DEFAULT 4000 NOT NULL,
    "chargesPercent" double precision DEFAULT 69 NOT NULL,
    "hoursPerMonth" double precision DEFAULT 160 NOT NULL,
    "livesPerEmployee" double precision DEFAULT 150 NOT NULL,
    "taxesPercent" double precision DEFAULT 10 NOT NULL,
    "backOfficePercent" double precision DEFAULT 4 NOT NULL,
    "adminPercent" double precision DEFAULT 5 NOT NULL,
    "marginFC" double precision DEFAULT 15 NOT NULL,
    "marginDP" double precision DEFAULT 15 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pricing_configs OWNER TO radar_user;

--
-- Name: pricing_hour_rules; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.pricing_hour_rules (
    id text NOT NULL,
    "companyId" text NOT NULL,
    regime text NOT NULL,
    activity text NOT NULL,
    annex text,
    "revenueMin" double precision DEFAULT 0 NOT NULL,
    "revenueMax" double precision DEFAULT 0 NOT NULL,
    "hoursFiscal" double precision DEFAULT 0 NOT NULL,
    "hoursAccounting" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pricing_hour_rules OWNER TO radar_user;

--
-- Name: pricings; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.pricings (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    "estimatedHours" double precision NOT NULL,
    "hourlyRate" double precision NOT NULL,
    "softwareCost" double precision DEFAULT 0 NOT NULL,
    "profitMargin" double precision DEFAULT 20 NOT NULL,
    "finalValue" double precision NOT NULL,
    observations text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "serviceType" public."ServiceType" DEFAULT 'CONTABIL'::public."ServiceType" NOT NULL,
    complexity public."Complexity" DEFAULT 'MEDIA'::public."Complexity" NOT NULL,
    status public."PricingStatus" DEFAULT 'RASCUNHO'::public."PricingStatus" NOT NULL
);


ALTER TABLE public.pricings OWNER TO radar_user;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.projects (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    status public."ProjectStatus" DEFAULT 'PLANNING'::public."ProjectStatus" NOT NULL,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    color text,
    "startDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "clientId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.projects OWNER TO radar_user;

--
-- Name: proposal_items; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.proposal_items (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    "commercialPlanId" text,
    "serviceItemId" text,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.proposal_items OWNER TO radar_user;

--
-- Name: proposals; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.proposals (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    "proposalNumber" text NOT NULL,
    slug text NOT NULL,
    "clientName" text NOT NULL,
    "clientCnpj" text,
    "taxRegime" text NOT NULL,
    activity text NOT NULL,
    "monthlyRevenue" double precision NOT NULL,
    "employeeCount" integer NOT NULL,
    "basePrice" double precision NOT NULL,
    "aboutOffice" text,
    differentials text,
    onboarding text,
    "commercialTerms" text,
    "specificNote" text,
    "sentAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "closedPlanId" text,
    "closedPrice" double precision,
    "lossReason" text,
    views integer DEFAULT 0 NOT NULL,
    "whatsappClicks" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."ProposalStatus" DEFAULT 'DRAFT'::public."ProposalStatus" NOT NULL,
    "isCurrent" boolean DEFAULT true NOT NULL,
    "originalProposalId" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.proposals OWNER TO radar_user;

--
-- Name: resignations; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.resignations (
    id text NOT NULL,
    "userId" text NOT NULL,
    "employeeName" text NOT NULL,
    "admissionDate" timestamp(3) without time zone NOT NULL,
    "dismissalDate" timestamp(3) without time zone NOT NULL,
    "sectorId" text,
    "cellId" text,
    "positionId" text,
    "contractType" text NOT NULL,
    "dismissalReasonId" text,
    observations text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.resignations OWNER TO radar_user;

--
-- Name: robot_worker_skills; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.robot_worker_skills (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "workerId" text NOT NULL,
    "skillKey" public."SkillKey" NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "cronExpr" text DEFAULT '0 2 * * *'::text NOT NULL,
    autonomy public."AutonomyLevel" DEFAULT 'REVIEW'::public."AutonomyLevel" NOT NULL,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    "lastRunAt" timestamp(3) without time zone,
    "lastRunId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.robot_worker_skills OWNER TO radar_user;

--
-- Name: robot_workers; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.robot_workers (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text DEFAULT 'Aurora'::text NOT NULL,
    avatar text DEFAULT '🌅'::text NOT NULL,
    status public."RobotWorkerStatus" DEFAULT 'ACTIVE'::public."RobotWorkerStatus" NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.robot_workers OWNER TO radar_user;

--
-- Name: sectors; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.sectors (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    mandatory boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.sectors OWNER TO radar_user;

--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.service_categories (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    icon text,
    "order" integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.service_categories OWNER TO radar_user;

--
-- Name: service_items; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.service_items (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "basePrice" numeric(10,2) NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "estimatedHours" double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "outOfScope" text,
    recurrence public."Recurrence" DEFAULT 'MENSAL'::public."Recurrence" NOT NULL,
    "requiredDocs" text,
    scope text,
    "slaDays" integer DEFAULT 5 NOT NULL
);


ALTER TABLE public.service_items OWNER TO radar_user;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    "companyId" text NOT NULL,
    title text NOT NULL,
    description text,
    status public."TaskStatus" DEFAULT 'TODO'::public."TaskStatus" NOT NULL,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    category public."TaskCategory" DEFAULT 'OUTRO'::public."TaskCategory" NOT NULL,
    "projectId" text,
    "clientId" text,
    "assigneeId" text,
    "startDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "estimatedHours" numeric(8,2),
    "actualHours" numeric(8,2),
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.tasks OWNER TO radar_user;

--
-- Name: turnover_monthly; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.turnover_monthly (
    id text NOT NULL,
    "userId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "cltInitial" integer DEFAULT 0 NOT NULL,
    "cltAdmissions" integer DEFAULT 0 NOT NULL,
    "cltDismissals" integer DEFAULT 0 NOT NULL,
    "internInitial" integer DEFAULT 0 NOT NULL,
    "internAdmissions" integer DEFAULT 0 NOT NULL,
    "internDismissals" integer DEFAULT 0 NOT NULL,
    "thirdInitial" integer DEFAULT 0 NOT NULL,
    "thirdAdmissions" integer DEFAULT 0 NOT NULL,
    "thirdDismissals" integer DEFAULT 0 NOT NULL,
    "partnerInitial" integer DEFAULT 0 NOT NULL,
    "partnerAdmissions" integer DEFAULT 0 NOT NULL,
    "partnerDismissals" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.turnover_monthly OWNER TO radar_user;

--
-- Name: turnover_sector_distribution; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.turnover_sector_distribution (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "sectorId" text NOT NULL,
    initial integer DEFAULT 0 NOT NULL,
    admissions integer DEFAULT 0 NOT NULL,
    dismissals integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.turnover_sector_distribution OWNER TO radar_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: radar_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL
);


ALTER TABLE public.users OWNER TO radar_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9cecd244-c14b-4c7e-b73e-70d33a11dd47	257e2fdf7390d21fa904e50d655138389ea6ed44a45a1d4b0db1458871b89249	2026-08-14 09:34:23.018255-03	20260810154541_modulo_bancario_fechamento_mensal	\N	\N	2026-08-14 09:34:23.006229-03	1
cac43885-a9c1-4cdb-b487-35085a1287fa	4b0602301824ca6042ca3ba3d5794a6ef11abca3fbbf483f1cd671b50e2aad37	2026-08-14 09:34:22.712643-03	20260730172438_init	\N	\N	2026-08-14 09:34:22.701312-03	1
8c70eb54-5d6f-4dab-853f-5edeae4fdfa4	55eb0c1b13bb60ce9215b965dd0cc608ea1cdae63dca2e09f9d2ce36c774eea3	2026-08-14 09:34:22.846353-03	20260803150121_add_proposals_module	\N	\N	2026-08-14 09:34:22.837859-03	1
8d1778e3-0f6b-40dc-9bd3-8765ee79e0c7	e7b753ae19c6c029f745b68784784dede70937499c885d0286a90ad18681faec	2026-08-14 09:34:22.718435-03	20260730193800_add_company_profile	\N	\N	2026-08-14 09:34:22.713205-03	1
f2aec8af-bd81-4e2f-bba2-630381ad158a	ea8cdf2e7292aa62dc6743847eb40d355ed6ac2b8944eea3a8e514bcfd101e55	2026-08-14 09:34:22.723921-03	20260731124513_add_employee	\N	\N	2026-08-14 09:34:22.718951-03	1
593ba7ec-baca-407e-8e64-8eb891f3acfd	5ea36213a576945f46a577287ee29d0f3007372e327a72dfa4548ef9fb6ab0b1	2026-08-14 09:34:22.990886-03	20260807204155_add_fiscal_icms_apuration	\N	\N	2026-08-14 09:34:22.984209-03	1
a732e99d-a626-4e8c-ac47-e7210b910e62	ec985140d7ba588977df3a37e747dd5a22abe7f6d95fef502f54b6eeffe5c0e6	2026-08-14 09:34:22.729026-03	20260731141704_add_client_model	\N	\N	2026-08-14 09:34:22.724379-03	1
a71bccc2-74b6-4f9a-9c3c-170f57d0b700	0eff13a353eeecec58c2d7efdd2b43bf60b97679c7345abfd8f618e93cc38507	2026-08-14 09:34:22.918681-03	20260805125812_add_catalog_and_contracts	\N	\N	2026-08-14 09:34:22.84695-03	1
95e8d6cf-bcd1-4ee4-a42b-9c7bef739046	1126237060f01b043b7d36e3a2328d4e1e6ab0c87e61bbcf093b7a1c46f143b6	2026-08-14 09:34:22.734814-03	20260731144915_add_pricing_model	\N	\N	2026-08-14 09:34:22.729501-03	1
02e032e1-1b73-41e9-aae7-f9d1aea9666b	4fbbf1608f2944728f3b7ac0e933090c69438f5d7edb83703aaf0b75825946c4	2026-08-14 09:34:22.740885-03	20260731150747_add_planning_model	\N	\N	2026-08-14 09:34:22.735274-03	1
242c7c71-de02-4653-945c-003a4209f7c7	2a946600f4bff53aa0d3fa9c72e95a0c44287ad375b47b1db2611bb5947e3275	2026-08-14 09:34:22.747876-03	20260731211232_add_financial_transactions	\N	\N	2026-08-14 09:34:22.741327-03	1
ba5beb4a-db2c-40ab-b0f4-e870de8812e2	790f6a5bd69d6d166117fbd3defda53e6045140f58d4b2a5d08a1d8f4735bb9d	2026-08-14 09:34:22.921205-03	20260805140123_add_unique_company_code_constraint	\N	\N	2026-08-14 09:34:22.919193-03	1
4555a52a-f3f4-4e17-94b3-90f792846242	22015098b52183133604c4ffe2b244a7cb716c13e13414558e6152b93b62c497	2026-08-14 09:34:22.775473-03	20260801004217_add_turnover_module	\N	\N	2026-08-14 09:34:22.748412-03	1
d3ecb6a6-9ebc-46ce-8eef-b001466e370b	1493424524ecf476c477378ec1b933460aaf17938d1960fe897e4bbb9d544bf5	2026-08-14 09:34:22.794469-03	20260801005649_add_multi_tenant_support	\N	\N	2026-08-14 09:34:22.776012-03	1
f5e99be7-2cc8-4735-843d-354af8861f33	58a40b0bd9d537a082b9676b9f881ac0ab990e8c44f10d978d6ff49758c15408	2026-08-14 09:34:22.796885-03	20260801010918_	\N	\N	2026-08-14 09:34:22.794946-03	1
9ee932bb-7687-45a6-871a-35e6be946c42	fc97dee51a2d35b03c02ca7a88f0b2d5f02eb8617ac844eef9c5d052defeb2d2	2026-08-14 09:34:22.927065-03	20260805204524_account_template_global	\N	\N	2026-08-14 09:34:22.921696-03	1
b47a9338-fe83-483d-a357-9924d1d1c5da	d0d91f3df240e7301897b7a5835cb880d94936a22add7e65660339c66d69ef07	2026-08-14 09:34:22.803959-03	20260801020206_add_turnover_sector_distribution	\N	\N	2026-08-14 09:34:22.797347-03	1
51245de0-3c61-4d2b-97c1-0f13e14468c8	8a79c6dab81e2c343d265108741dd0e3f5710088da30a73a525930324b9cc91f	2026-08-14 09:34:22.822346-03	20260803132247_add_commercial_plans_module	\N	\N	2026-08-14 09:34:22.804451-03	1
157e9e3d-b9ff-4a93-9f5b-c8612d7729b5	c179bffe2975f94c5c4d908f501dcd45f55943bff68d8f96f9395869ae1b3fe1	2026-08-14 09:34:23.001324-03	20260807220104_fiscal_per_client	\N	\N	2026-08-14 09:34:22.991357-03	1
4f5e6cee-8d4b-4ebb-8ffa-3be6e55c2465	aaa77eb1a40dcc7835f1153841012f0223d9206ae4e4c81db1c5bf361523424a	2026-08-14 09:34:22.837363-03	20260803143604_add_pricing_calculator_models	\N	\N	2026-08-14 09:34:22.822888-03	1
b77f3ee0-4b1d-4e4c-8e43-497313d90912	e04ec8e8eb9159772775bf36c5eb6b027c8c1c25549a2a91de0af0aca7b5bf1c	2026-08-14 09:34:22.932256-03	20260805210025_historical_base_and_reduced_code	\N	\N	2026-08-14 09:34:22.927497-03	1
7631ce38-56eb-4702-83a4-bc8a6fd38bf1	0256798ad5e06ad6f19ec2c5bc35285a54ef968a45c1a36d895cfca456a5f615	2026-08-14 09:34:22.933687-03	20260805211032_historical_base_and_reduced_code	\N	\N	2026-08-14 09:34:22.93273-03	1
8852b668-848d-427a-86e1-b8e8a73b081f	77973a43379c63105fcf9765e44c6516106e4449d25ab125507b73f4cadcda0c	2026-08-14 09:34:22.948981-03	20260806215912_add_tasks_and_projects	\N	\N	2026-08-14 09:34:22.934147-03	1
1aae5899-cc20-40aa-befd-5332c2077b5c	706887b3beacbb09dc03f0ec04ede93d756653e71112b5bd656b417bde45843a	2026-08-14 09:34:23.003184-03	20260808012246_add_saldo_inicial_movement	\N	\N	2026-08-14 09:34:23.002244-03	1
c067109c-68aa-49d1-a796-3116d76a2bde	8934055babafe02b97404ae7d11ad5212881cbf5d520db6acd6d5c0e363b3dc8	2026-08-14 09:34:22.983697-03	20260807110002_add_fiscal_movements_relation	\N	\N	2026-08-14 09:34:22.949589-03	1
a1017f8b-f6d3-4ec3-bf07-98335d7ebcf0	2ffed441804694e6f1aebeccb030ac75f9e6bb1a1e111391f35e744263601427	2026-08-14 09:34:23.004498-03	20260810000148_product_code_nullable	\N	\N	2026-08-14 09:34:23.003588-03	1
2636561e-d6d9-4799-9753-20bd7f8a05f4	acd03f9d4b53db245c16432a134cea7bc86850e2ae617d23461cdc45f37a9c9b	2026-08-14 09:34:23.005813-03	20260810005520_add_unified_code_field	\N	\N	2026-08-14 09:34:23.004971-03	1
43dee918-8f53-4b18-97b5-98570fa3ecc4	510028f9a8372fa126330bde0afda505f2302c0c24ece30a1640ba066cf2e703	\N	20260814145127_add_client_contractual_fields	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260814145127_add_client_contractual_fields\n\nDatabase error code: 42710\n\nDatabase error:\nERRO: tipo "MatchStatus" já existe\n\nDbError { severity: "ERRO", parsed_severity: Some(Error), code: SqlState(E42710), message: "tipo \\"MatchStatus\\" já existe", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1213), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260814145127_add_client_contractual_fields"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260814145127_add_client_contractual_fields"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-08-14 20:09:22.96387-03	2026-08-14 20:05:39.992244-03	0
2463f308-cb49-4d59-a345-190d0162d325	510028f9a8372fa126330bde0afda505f2302c0c24ece30a1640ba066cf2e703	2026-08-14 20:09:22.974303-03	20260814145127_add_client_contractual_fields		\N	2026-08-14 20:09:22.974303-03	0
94a6bc33-af83-4bbc-a2a9-275e20ea694d	785baed79d838c83ef13f9f267a50a915394f09dfd6f06e630258d0b3bf433fa	2026-08-14 20:09:35.745477-03	20260814170922_add_proposal_versions	\N	\N	2026-08-14 20:09:35.727493-03	1
89db3b8b-9b72-4d12-8ec5-81f555a49666	2322bf3545342eadd029faf8831c06e3b7d9b7188232d4763fd104a236e7e57a	2026-08-14 20:09:35.774976-03	20260814193945_fd1_foundation_robot_worker	\N	\N	2026-08-14 20:09:35.746017-03	1
\.


--
-- Data for Name: account_templates; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.account_templates (id, "reducedCode", code, "parentCode", name, nickname, "accountType", report, "isSynthetic", level, "createdAt") FROM stdin;
\.


--
-- Data for Name: accounting_accounts; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.accounting_accounts (id, "companyId", code, name, type, nature, level, "parentId", "isActive", "sciCode", "createdAt", "updatedAt", "reducedCode") FROM stdin;
\.


--
-- Data for Name: accounting_entries; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.accounting_entries (id, "companyId", "entryDate", description, "documentNumber", "counterpartyName", "counterpartyCpfCnpj", "counterpartyType", "clientId", "debitAccountId", "debitValue", "creditAccountId", "creditValue", source, status, "createdAt", "updatedAt", "bankTransactionId") FROM stdin;
\.


--
-- Data for Name: approval_records; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.approval_records (id, "companyId", "entityType", "entityId", decision, "decidedBy", "decidedAt", ip, notes) FROM stdin;
cmsx9q1gk0001gnqbm5i8x0er	00000000-0000-0000-0000-000000000001	CLASSIFICATION	cmsx9mi3h0000ahmchegiw3kj	APPROVED	test-admin-fd1	2026-08-17 13:27:10.82	\N	\N
cmsx9q25x0004gnqb4c2gki92	00000000-0000-0000-0000-000000000001	CLASSIFICATION	cmsx9cg7s0000r0nvawedcg4n	APPROVED	test-admin-fd1	2026-08-17 13:27:11.734	\N	\N
\.


--
-- Data for Name: automation_audits; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.automation_audits (id, "companyId", actor, action, entity, "entityId", detail, "robotVersion", ip, "createdAt") FROM stdin;
cmstm8ms60002hj8p4spiy7dc	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:RECONCILIATION	AutomationRun	cmstm8ms00001hj8ppmzq9jr8	{"status": "SUCCESS", "durationMs": 3, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-15 00:06:28.95
cmsx6llnw0002n0lpwvc54tr8	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:CLASSIFICATION	AutomationRun	cmsx6llnr0001n0lp5h9868a4	{"detail": {"motivo": "Nenhuma transação NAO_CLASSIFICADA encontrada."}, "status": "SUCCESS", "durationMs": 4, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 11:59:44.877
cmsx6lmkl0005n0lpbqjmnldv	00000000-0000-0000-0000-000000000001	AURORA	ACCOUNTING_BRIDGE:PROMOTE_SKIPPED	AccountingEntry	cmsx6lmkj0004n0lpjvs3391g	{"year": 2026, "month": 7, "motivo": "Fechamento não encontrado."}	1.0.0	\N	2026-08-17 11:59:46.054
cmsx6lmkn0006n0lpfx2jluit	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:ACCOUNTING_BRIDGE	AutomationRun	cmsx6lmkj0004n0lpjvs3391g	{"detail": {"year": 2026, "month": 7, "motivo": "Fechamento não encontrado.", "skipped": true}, "status": "SUCCESS", "durationMs": 4, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 11:59:46.056
cmsx6n3240009n0lpwkut1hac	00000000-0000-0000-0000-000000000001	AURORA	ACCOUNTING_BRIDGE:PROMOTE_SKIPPED	AccountingEntry	cmsx6n3220008n0lpabxy9yzt	{"year": 2026, "month": 7, "motivo": "Fechamento não encontrado."}	1.0.0	\N	2026-08-17 12:00:54.077
cmsx6n328000an0lp8aarpog1	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:ACCOUNTING_BRIDGE	AutomationRun	cmsx6n3220008n0lpabxy9yzt	{"detail": {"year": 2026, "month": 7, "motivo": "Fechamento não encontrado.", "skipped": true}, "status": "SUCCESS", "durationMs": 4, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 12:00:54.08
cmsx6n3r0000dn0lpxul1fstf	00000000-0000-0000-0000-000000000001	AURORA	ACCOUNTING_BRIDGE:PROMOTE_SKIPPED	AccountingEntry	cmsx6n3qq000cn0lpja0j73e3	{"year": 2026, "month": 7, "motivo": "Fechamento não encontrado."}	1.0.0	\N	2026-08-17 12:00:54.972
cmsx6n3r1000en0lpfq3xjxdt	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:ACCOUNTING_BRIDGE	AutomationRun	cmsx6n3qq000cn0lpja0j73e3	{"detail": {"year": 2026, "month": 7, "motivo": "Fechamento não encontrado.", "skipped": true}, "status": "SUCCESS", "durationMs": 2, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 12:00:54.974
cmsx6n4of000hn0lpoqpvlou0	00000000-0000-0000-0000-000000000001	AURORA	ACCOUNTING_BRIDGE:PROMOTE_SKIPPED	AccountingEntry	cmsx6n4od000gn0lpk19ui8er	{"year": 2026, "month": 7, "motivo": "Fechamento não encontrado."}	1.0.0	\N	2026-08-17 12:00:56.176
cmsx6n4oh000in0lpybjlgznn	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:ACCOUNTING_BRIDGE	AutomationRun	cmsx6n4od000gn0lpk19ui8er	{"detail": {"year": 2026, "month": 7, "motivo": "Fechamento não encontrado.", "skipped": true}, "status": "SUCCESS", "durationMs": 3, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 12:00:56.178
cmsx6n5du000ln0lptk2rno73	00000000-0000-0000-0000-000000000001	AURORA	ACCOUNTING_BRIDGE:PROMOTE_SKIPPED	AccountingEntry	cmsx6n5dt000kn0lp0zpzr9nc	{"year": 2026, "month": 7, "motivo": "Fechamento não encontrado."}	1.0.0	\N	2026-08-17 12:00:57.091
cmsx6n5dw000mn0lptkqi02gx	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:ACCOUNTING_BRIDGE	AutomationRun	cmsx6n5dt000kn0lp0zpzr9nc	{"detail": {"year": 2026, "month": 7, "motivo": "Fechamento não encontrado.", "skipped": true}, "status": "SUCCESS", "durationMs": 2, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 12:00:57.092
cmsx6n6fy000pn0lp01lwgch4	00000000-0000-0000-0000-000000000001	AURORA	ACCOUNTING_BRIDGE:PROMOTE_SKIPPED	AccountingEntry	cmsx6n6fx000on0lpfksr2qwt	{"year": 2026, "month": 7, "motivo": "Fechamento não encontrado."}	1.0.0	\N	2026-08-17 12:00:58.463
cmsx6n6g0000qn0lp046gpqm0	00000000-0000-0000-0000-000000000001	AURORA	SKILL_FINISHED:ACCOUNTING_BRIDGE	AutomationRun	cmsx6n6fx000on0lpfksr2qwt	{"detail": {"year": 2026, "month": 7, "motivo": "Fechamento não encontrado.", "skipped": true}, "status": "SUCCESS", "durationMs": 2, "itemsFailed": 0, "secondsSaved": 0, "itemsProcessed": 0, "itemsAutoApproved": 0, "itemsPendingHuman": 0}	1.0.0	\N	2026-08-17 12:00:58.464
cmsx9q1gn0002gnqbq694zov6	00000000-0000-0000-0000-000000000001	USER_test-admin-fd1	USER_APPROVED:CLASSIFICATION	AutomationPending	cmsx9mi3h0000ahmchegiw3kj	{"type": "CLASSIFICATION", "notes": null}	1.0.0	\N	2026-08-17 13:27:10.823
cmsx9q2680005gnqb9u0zg9kh	00000000-0000-0000-0000-000000000001	USER_test-admin-fd1	USER_APPROVED:CLASSIFICATION	AutomationPending	cmsx9cg7s0000r0nvawedcg4n	{"type": "CLASSIFICATION", "notes": null}	1.0.0	\N	2026-08-17 13:27:11.744
\.


--
-- Data for Name: automation_pendings; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.automation_pendings (id, "companyId", "runId", type, confidence, payload, status, "resolvedBy", "resolvedAt", notes, "createdAt") FROM stdin;
cmsx9mi3h0000ahmchegiw3kj	00000000-0000-0000-0000-000000000001	\N	CLASSIFICATION	72	{"amount": 350, "description": "PIX RECEBIDO ACADEMIA TESTE", "transactionId": "teste-sem-transacao", "suggestedNature": "Vendas PIX"}	APPROVED	test-admin-fd1	2026-08-17 13:27:10.818	\N	2026-08-17 13:24:25.757
cmsx9cg7s0000r0nvawedcg4n	00000000-0000-0000-0000-000000000001	\N	CLASSIFICATION	72	{"amount": 350, "description": "PIX RECEBIDO ACADEMIA TESTE", "transactionId": "teste-sem-transacao", "suggestedNature": "Vendas PIX"}	APPROVED	test-admin-fd1	2026-08-17 13:27:11.732	\N	2026-08-17 13:16:36.761
cmsx9qwgx00001mym20yu1dls	00000000-0000-0000-0000-000000000001	\N	CLASSIFICATION	72	{"amount": 350, "description": "PIX RECEBIDO ACADEMIA TESTE", "transactionId": "teste-sem-transacao", "suggestedNature": "Vendas PIX"}	PENDING	\N	\N	\N	2026-08-17 13:27:51.009
\.


--
-- Data for Name: automation_runs; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.automation_runs (id, "companyId", "workerId", "skillKey", "triggerType", "triggeredBy", status, "startedAt", "finishedAt", "itemsProcessed", "itemsAutoApproved", "itemsPendingHuman", "itemsFailed", "secondsSaved", "errorMessage") FROM stdin;
cmstm8ms00001hj8ppmzq9jr8	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	RECONCILIATION	MANUAL	test-admin-fd1	SUCCESS	2026-08-15 00:06:28.944	2026-08-15 00:06:28.947	0	0	0	0	0	\N
cmsx6llnr0001n0lp5h9868a4	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	CLASSIFICATION	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 11:59:44.871	2026-08-17 11:59:44.873	0	0	0	0	0	\N
cmsx6lmkj0004n0lpjvs3391g	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 11:59:46.051	2026-08-17 11:59:46.053	0	0	0	0	0	\N
cmsx6n3220008n0lpabxy9yzt	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 12:00:54.075	2026-08-17 12:00:54.077	0	0	0	0	0	\N
cmsx6n3qq000cn0lpja0j73e3	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 12:00:54.962	2026-08-17 12:00:54.972	0	0	0	0	0	\N
cmsx6n4od000gn0lpk19ui8er	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 12:00:56.174	2026-08-17 12:00:56.176	0	0	0	0	0	\N
cmsx6n5dt000kn0lp0zpzr9nc	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 12:00:57.09	2026-08-17 12:00:57.091	0	0	0	0	0	\N
cmsx6n6fx000on0lpfksr2qwt	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	MANUAL	test-admin-fd1	SUCCESS	2026-08-17 12:00:58.462	2026-08-17 12:00:58.462	0	0	0	0	0	\N
\.


--
-- Data for Name: bank_categories; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.bank_categories (id, "companyId", "clientId", label, "group", "isSystem", "order", "createdAt") FROM stdin;
cmssz35o30001erdaszl32avu	00000000-0000-0000-0000-000000000001	ff1ec187-5a93-4b19-aa88-f3216be1dfaa	Receita Operacional	RECEITA	t	1	2026-08-14 13:18:22.323
cmssz35o70002erda5s347hiz	00000000-0000-0000-0000-000000000001	ff1ec187-5a93-4b19-aa88-f3216be1dfaa	Receita Financeira	FINANCEIRA	t	2	2026-08-14 13:18:22.328
cmssz35o80003erdaf44leh9u	00000000-0000-0000-0000-000000000001	ff1ec187-5a93-4b19-aa88-f3216be1dfaa	Despesa Operacional	DESPESA	t	3	2026-08-14 13:18:22.328
cmssz35o80004erda3hydfny3	00000000-0000-0000-0000-000000000001	ff1ec187-5a93-4b19-aa88-f3216be1dfaa	Imposto	IMPOSTO	t	4	2026-08-14 13:18:22.329
cmssz35o90005erda1ciw5kll	00000000-0000-0000-0000-000000000001	ff1ec187-5a93-4b19-aa88-f3216be1dfaa	Sócio	SOCIO	t	5	2026-08-14 13:18:22.329
cmssz35o90006erdankcb3e9e	00000000-0000-0000-0000-000000000001	ff1ec187-5a93-4b19-aa88-f3216be1dfaa	Não Classificado	PENDENTE	t	6	2026-08-14 13:18:22.33
\.


--
-- Data for Name: bank_classification_rules; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.bank_classification_rules (id, "companyId", pattern, hits, "createdAt", nature) FROM stdin;
\.


--
-- Data for Name: bank_nfe_matches; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.bank_nfe_matches (id, "companyId", "bankTransactionId", "fiscalInvoiceId", score, "matchType", status, "scoreBreakdown", "confirmedAt", "confirmedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bank_statements; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.bank_statements (id, "companyId", "clientId", year, month, "fileName", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bank_transactions; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.bank_transactions (id, "statementId", "companyId", date, description, counterparty, amount, "classifiedBy", "createdAt", nature) FROM stdin;
\.


--
-- Data for Name: cells; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.cells (id, "sectorId", name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: client_contracts; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.client_contracts (id, "companyId", "clientId", "commercialPlanId", "startDate", "endDate", "monthlyFee", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: client_monthly_data; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.client_monthly_data (id, "companyId", "userId", year, month, "initialClients", "newClients", "churnedClients", "finalClients", "newRevenue", "lostRevenue", "finalRevenue", "churnRate", "accumulatedChurn", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: client_services; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.client_services (id, "companyId", "clientId", "serviceItemId", recurrence, status, "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.clients (id, "userId", "companyName", cnpj, "monthlyFee", "startDate", "endDate", "contactName", "contactEmail", "contactPhone", observations, "createdAt", "updatedAt", "companyId", "deletedAt", "serviceType", status, installments, "lastPaymentDate", "openAmount", "overdueAmount", "paidAmount") FROM stdin;
\.


--
-- Data for Name: commercial_plans; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.commercial_plans (id, "companyId", name, multiplier, "order", "isIndependent", color, badge, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.companies (id, name, cnpj, state, "createdAt", "updatedAt", plan, "allowedModules", address, "businessGoals", "deletedAt", email, "logoUrl", phone, "softwareStack") FROM stdin;
00000000-0000-0000-0000-000000000001	Escritório Padrão (Admin)	\N	\N	2026-08-14 09:34:22.777	2026-08-14 09:34:22.777	ENTERPRISE	{dashboard,pessoas,clientes,precificacao,planejamento,bi,ponto-fora-da-curva,indicadores,planejamento-tributario,reforma-tributaria,turnover}	\N	\N	\N	\N	\N	\N	{}
\.


--
-- Data for Name: company_profiles; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.company_profiles (id, "userId", "razaoSocial", cnpj, estado, "softwareConsultoria", "softwareContabil", "softwareFiscal", "clientesHoje", "clientesAno", "funcionariosHoje", "funcionariosAno", "visaoEmpresa", "maiorDesafio", compromisso, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dismissal_reasons; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.dismissal_reasons (id, "userId", name, description, "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.employees (id, "userId", name, email, phone, "position", department, "admissionDate", "dismissalDate", salary, "createdAt", "updatedAt", "companyId", "deletedAt", status) FROM stdin;
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.financial_transactions (id, "userId", "clientId", category, description, amount, date, "createdAt", "updatedAt", "companyId", type) FROM stdin;
\.


--
-- Data for Name: fiscal_icms_apurations; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_icms_apurations (id, "companyId", year, month, "creditsIcms", "creditsIcmsSt", "purchasesValue", "invoicesCount", "salesValue", "debitRate", "debitsIcms", balance, status, "closedAt", observations, "createdAt", "updatedAt", "clientId") FROM stdin;
\.


--
-- Data for Name: fiscal_inventory_balances; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_inventory_balances (id, "companyId", "productId", year, month, "initialQty", "initialValue", "inQty", "inValue", "outQty", "outValue", "finalQty", "finalValue", "averageCost", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fiscal_inventory_movements; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_inventory_movements (id, "companyId", "productId", "invoiceId", type, date, quantity, "unitCost", "totalCost", "averageCostAfter", reason, "userId", "createdAt", "clientId") FROM stdin;
\.


--
-- Data for Name: fiscal_invoice_items; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_invoice_items (id, "invoiceId", "productId", "productMatchStatus", "itemNumber", "supplierCode", description, ncm, cfop, cst, csosn, quantity, "unitValue", "totalValue", discount, "icmsBase", "icmsRate", "icmsValue", "icmsStBase", "icmsStValue", "ipiBase", "ipiRate", "ipiValue", "pisBase", "pisRate", "pisValue", "cofinsBase", "cofinsRate", "cofinsValue", "createdAt") FROM stdin;
\.


--
-- Data for Name: fiscal_invoices; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_invoices (id, "companyId", "supplierId", "documentType", status, number, series, "accessKey", "emissionDate", "entryDate", cfop, "natOp", "totalValue", "discountValue", "freightValue", "insuranceValue", "otherValues", "icmsBase", "icmsValue", "icmsStValue", "ipiValue", "pisValue", "cofinsValue", "xmlOriginalUrl", "errorMessage", "createdAt", "updatedAt", "clientId") FROM stdin;
\.


--
-- Data for Name: fiscal_products; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_products (id, "companyId", code, ean, description, ncm, unit, "averageCost", "currentStock", "createdAt", "updatedAt", "deletedAt", "clientId", "unifiedCode") FROM stdin;
\.


--
-- Data for Name: fiscal_suppliers; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.fiscal_suppliers (id, "companyId", cnpj, name, "tradeName", "stateRegistration", state, email, phone, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: historical_entries; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.historical_entries (id, "companyId", "clientId", year, date, "debitCode", "creditCode", amount, "historyCode", description, "docNumber", "entryType", "createdAt", "reducedCode") FROM stdin;
\.


--
-- Data for Name: plan_service_items; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.plan_service_items (id, "planId", "serviceItemId", "createdAt", discount, quantity) FROM stdin;
\.


--
-- Data for Name: planning_action_plans; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.planning_action_plans (id, "companyId", "goalId", action, responsible, "dueDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: planning_areas; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.planning_areas (id, "companyId", name, leader, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: planning_cycles; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.planning_cycles (id, "companyId", name, "startDate", "endDate", responsible, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: planning_goals; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.planning_goals (id, "companyId", "objectiveId", "areaId", title, "targetValue", unit, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: planning_kpis; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.planning_kpis (id, "companyId", name, description, formula, unit, direction, frequency, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: planning_objectives; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.planning_objectives (id, "companyId", "cycleId", code, title, context, "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: plannings; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.plannings (id, "userId", title, description, category, "targetDate", progress, "createdAt", "updatedAt", "companyId", status) FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.positions (id, "userId", name, description, "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: pricing_calculations; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.pricing_calculations (id, "companyId", "userId", "proposalNumber", "clientName", "taxRegime", annex, activity, "monthlyRevenue", "employeeCount", "dpMethod", "dpValue", "hasBranches", "hasErp", "hoursFiscal", "hoursAccounting", "costPerHour", "basePrice", "currentCharge", "planPrices", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pricing_configs; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.pricing_configs (id, "companyId", "salaryAverage", "chargesPercent", "hoursPerMonth", "livesPerEmployee", "taxesPercent", "backOfficePercent", "adminPercent", "marginFC", "marginDP", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pricing_hour_rules; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.pricing_hour_rules (id, "companyId", regime, activity, annex, "revenueMin", "revenueMax", "hoursFiscal", "hoursAccounting", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pricings; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.pricings (id, "userId", title, "estimatedHours", "hourlyRate", "softwareCost", "profitMargin", "finalValue", observations, "createdAt", "updatedAt", "companyId", "serviceType", complexity, status) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.projects (id, "companyId", name, description, status, priority, color, "startDate", "dueDate", "completedAt", "clientId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: proposal_items; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.proposal_items (id, "proposalId", "commercialPlanId", "serviceItemId", quantity, "unitPrice", "totalPrice", "createdAt") FROM stdin;
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.proposals (id, "companyId", "userId", "proposalNumber", slug, "clientName", "clientCnpj", "taxRegime", activity, "monthlyRevenue", "employeeCount", "basePrice", "aboutOffice", differentials, onboarding, "commercialTerms", "specificNote", "sentAt", "closedAt", "closedPlanId", "closedPrice", "lossReason", views, "whatsappClicks", "createdAt", "updatedAt", status, "isCurrent", "originalProposalId", version) FROM stdin;
\.


--
-- Data for Name: resignations; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.resignations (id, "userId", "employeeName", "admissionDate", "dismissalDate", "sectorId", "cellId", "positionId", "contractType", "dismissalReasonId", observations, "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: robot_worker_skills; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.robot_worker_skills (id, "companyId", "workerId", "skillKey", enabled, "cronExpr", autonomy, params, "lastRunAt", "lastRunId", "createdAt", "updatedAt") FROM stdin;
cmstkv98x0008qscktf35w4zv	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	ACCOUNTING_BRIDGE	f	0 3 * * *	REVIEW	{}	2026-08-17 12:00:58.463	cmsx6n6fx000on0lpfksr2qwt	2026-08-14 23:28:05.266	2026-08-17 12:31:03.147
cmstkv98x0006qsckex1mpbv0	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	CLASSIFICATION	f	30 2 * * *	REVIEW	{}	2026-08-17 11:59:44.875	cmsx6llnr0001n0lp5h9868a4	2026-08-14 23:28:05.265	2026-08-17 12:31:03.748
cmstkv98y000aqsckk19ethsk	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	MONTHLY_REPORT	f	0 8 5 * *	REVIEW	{}	\N	\N	2026-08-14 23:28:05.266	2026-08-17 12:31:04.815
cmstkv98v0004qsckbtpdw7fx	00000000-0000-0000-0000-000000000001	cmstkv98m0002qsck347tvg0n	RECONCILIATION	f	0 2 * * *	REVIEW	{}	2026-08-15 00:06:28.948	cmstm8ms00001hj8ppmzq9jr8	2026-08-14 23:28:05.263	2026-08-17 12:31:05.763
\.


--
-- Data for Name: robot_workers; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.robot_workers (id, "companyId", name, avatar, status, config, "createdAt", "updatedAt") FROM stdin;
cmstkv98m0002qsck347tvg0n	00000000-0000-0000-0000-000000000001	Aurora	🌅	ACTIVE	{}	2026-08-14 23:28:05.254	2026-08-14 23:28:05.254
\.


--
-- Data for Name: sectors; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.sectors (id, "userId", name, mandatory, "order", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.service_categories (id, "companyId", name, icon, "order", description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: service_items; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.service_items (id, "companyId", "categoryId", name, description, "order", "createdAt", "updatedAt", "basePrice", "deletedAt", "estimatedHours", "isActive", "outOfScope", recurrence, "requiredDocs", scope, "slaDays") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.tasks (id, "companyId", title, description, status, priority, category, "projectId", "clientId", "assigneeId", "startDate", "dueDate", "completedAt", "estimatedHours", "actualHours", "position", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: turnover_monthly; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.turnover_monthly (id, "userId", year, month, "cltInitial", "cltAdmissions", "cltDismissals", "internInitial", "internAdmissions", "internDismissals", "thirdInitial", "thirdAdmissions", "thirdDismissals", "partnerInitial", "partnerAdmissions", "partnerDismissals", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: turnover_sector_distribution; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.turnover_sector_distribution (id, "companyId", "userId", year, month, "sectorId", initial, admissions, dismissals, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: radar_user
--

COPY public.users (id, name, email, password, "companyId", "createdAt", "updatedAt", "deletedAt", role) FROM stdin;
test-admin-fd1	Admin Aurora	admin@aurora.com	$2b$10$tnSV5a.b/nYz1SjTJXh/J.gscN/FvdBnOJgG1Tzw3cUTArfRXQMgq	00000000-0000-0000-0000-000000000001	2026-08-14 23:26:10.681	2026-08-14 23:26:10.681	\N	ADMIN
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account_templates account_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.account_templates
    ADD CONSTRAINT account_templates_pkey PRIMARY KEY (id);


--
-- Name: accounting_accounts accounting_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_accounts
    ADD CONSTRAINT accounting_accounts_pkey PRIMARY KEY (id);


--
-- Name: accounting_entries accounting_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT accounting_entries_pkey PRIMARY KEY (id);


--
-- Name: approval_records approval_records_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.approval_records
    ADD CONSTRAINT approval_records_pkey PRIMARY KEY (id);


--
-- Name: automation_audits automation_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.automation_audits
    ADD CONSTRAINT automation_audits_pkey PRIMARY KEY (id);


--
-- Name: automation_pendings automation_pendings_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.automation_pendings
    ADD CONSTRAINT automation_pendings_pkey PRIMARY KEY (id);


--
-- Name: automation_runs automation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT automation_runs_pkey PRIMARY KEY (id);


--
-- Name: bank_categories bank_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_categories
    ADD CONSTRAINT bank_categories_pkey PRIMARY KEY (id);


--
-- Name: bank_classification_rules bank_classification_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_classification_rules
    ADD CONSTRAINT bank_classification_rules_pkey PRIMARY KEY (id);


--
-- Name: bank_nfe_matches bank_nfe_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_nfe_matches
    ADD CONSTRAINT bank_nfe_matches_pkey PRIMARY KEY (id);


--
-- Name: bank_statements bank_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_statements
    ADD CONSTRAINT bank_statements_pkey PRIMARY KEY (id);


--
-- Name: bank_transactions bank_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT bank_transactions_pkey PRIMARY KEY (id);


--
-- Name: cells cells_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.cells
    ADD CONSTRAINT cells_pkey PRIMARY KEY (id);


--
-- Name: client_contracts client_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_pkey PRIMARY KEY (id);


--
-- Name: client_monthly_data client_monthly_data_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_monthly_data
    ADD CONSTRAINT client_monthly_data_pkey PRIMARY KEY (id);


--
-- Name: client_services client_services_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: commercial_plans commercial_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.commercial_plans
    ADD CONSTRAINT commercial_plans_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_profiles company_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT company_profiles_pkey PRIMARY KEY (id);


--
-- Name: dismissal_reasons dismissal_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.dismissal_reasons
    ADD CONSTRAINT dismissal_reasons_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: fiscal_icms_apurations fiscal_icms_apurations_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_icms_apurations
    ADD CONSTRAINT fiscal_icms_apurations_pkey PRIMARY KEY (id);


--
-- Name: fiscal_inventory_balances fiscal_inventory_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_balances
    ADD CONSTRAINT fiscal_inventory_balances_pkey PRIMARY KEY (id);


--
-- Name: fiscal_inventory_movements fiscal_inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_movements
    ADD CONSTRAINT fiscal_inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: fiscal_invoice_items fiscal_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoice_items
    ADD CONSTRAINT fiscal_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: fiscal_invoices fiscal_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoices
    ADD CONSTRAINT fiscal_invoices_pkey PRIMARY KEY (id);


--
-- Name: fiscal_products fiscal_products_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_products
    ADD CONSTRAINT fiscal_products_pkey PRIMARY KEY (id);


--
-- Name: fiscal_suppliers fiscal_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_suppliers
    ADD CONSTRAINT fiscal_suppliers_pkey PRIMARY KEY (id);


--
-- Name: historical_entries historical_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.historical_entries
    ADD CONSTRAINT historical_entries_pkey PRIMARY KEY (id);


--
-- Name: plan_service_items plan_service_items_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.plan_service_items
    ADD CONSTRAINT plan_service_items_pkey PRIMARY KEY (id);


--
-- Name: planning_action_plans planning_action_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_action_plans
    ADD CONSTRAINT planning_action_plans_pkey PRIMARY KEY (id);


--
-- Name: planning_areas planning_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_areas
    ADD CONSTRAINT planning_areas_pkey PRIMARY KEY (id);


--
-- Name: planning_cycles planning_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_cycles
    ADD CONSTRAINT planning_cycles_pkey PRIMARY KEY (id);


--
-- Name: planning_goals planning_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_goals
    ADD CONSTRAINT planning_goals_pkey PRIMARY KEY (id);


--
-- Name: planning_kpis planning_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_kpis
    ADD CONSTRAINT planning_kpis_pkey PRIMARY KEY (id);


--
-- Name: planning_objectives planning_objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_objectives
    ADD CONSTRAINT planning_objectives_pkey PRIMARY KEY (id);


--
-- Name: plannings plannings_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: pricing_calculations pricing_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_calculations
    ADD CONSTRAINT pricing_calculations_pkey PRIMARY KEY (id);


--
-- Name: pricing_configs pricing_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_configs
    ADD CONSTRAINT pricing_configs_pkey PRIMARY KEY (id);


--
-- Name: pricing_hour_rules pricing_hour_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_hour_rules
    ADD CONSTRAINT pricing_hour_rules_pkey PRIMARY KEY (id);


--
-- Name: pricings pricings_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricings
    ADD CONSTRAINT pricings_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: proposal_items proposal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT proposal_items_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: resignations resignations_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT resignations_pkey PRIMARY KEY (id);


--
-- Name: robot_worker_skills robot_worker_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.robot_worker_skills
    ADD CONSTRAINT robot_worker_skills_pkey PRIMARY KEY (id);


--
-- Name: robot_workers robot_workers_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.robot_workers
    ADD CONSTRAINT robot_workers_pkey PRIMARY KEY (id);


--
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_items service_items_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: turnover_monthly turnover_monthly_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.turnover_monthly
    ADD CONSTRAINT turnover_monthly_pkey PRIMARY KEY (id);


--
-- Name: turnover_sector_distribution turnover_sector_distribution_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.turnover_sector_distribution
    ADD CONSTRAINT turnover_sector_distribution_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_templates_accountType_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "account_templates_accountType_idx" ON public.account_templates USING btree ("accountType");


--
-- Name: account_templates_code_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX account_templates_code_idx ON public.account_templates USING btree (code);


--
-- Name: account_templates_reducedCode_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "account_templates_reducedCode_key" ON public.account_templates USING btree ("reducedCode");


--
-- Name: accounting_accounts_code_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX accounting_accounts_code_idx ON public.accounting_accounts USING btree (code);


--
-- Name: accounting_accounts_companyId_code_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "accounting_accounts_companyId_code_key" ON public.accounting_accounts USING btree ("companyId", code);


--
-- Name: accounting_accounts_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "accounting_accounts_companyId_idx" ON public.accounting_accounts USING btree ("companyId");


--
-- Name: accounting_entries_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "accounting_entries_companyId_idx" ON public.accounting_entries USING btree ("companyId");


--
-- Name: accounting_entries_entryDate_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "accounting_entries_entryDate_idx" ON public.accounting_entries USING btree ("entryDate");


--
-- Name: accounting_entries_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX accounting_entries_status_idx ON public.accounting_entries USING btree (status);


--
-- Name: approval_records_companyId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "approval_records_companyId_entityType_entityId_idx" ON public.approval_records USING btree ("companyId", "entityType", "entityId");


--
-- Name: automation_audits_companyId_createdAt_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_audits_companyId_createdAt_idx" ON public.automation_audits USING btree ("companyId", "createdAt");


--
-- Name: automation_audits_companyId_entity_entityId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_audits_companyId_entity_entityId_idx" ON public.automation_audits USING btree ("companyId", entity, "entityId");


--
-- Name: automation_pendings_companyId_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_pendings_companyId_status_idx" ON public.automation_pendings USING btree ("companyId", status);


--
-- Name: automation_pendings_companyId_type_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_pendings_companyId_type_idx" ON public.automation_pendings USING btree ("companyId", type);


--
-- Name: automation_pendings_runId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_pendings_runId_idx" ON public.automation_pendings USING btree ("runId");


--
-- Name: automation_runs_companyId_startedAt_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_runs_companyId_startedAt_idx" ON public.automation_runs USING btree ("companyId", "startedAt");


--
-- Name: automation_runs_companyId_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_runs_companyId_status_idx" ON public.automation_runs USING btree ("companyId", status);


--
-- Name: automation_runs_workerId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "automation_runs_workerId_idx" ON public.automation_runs USING btree ("workerId");


--
-- Name: bank_categories_companyId_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "bank_categories_companyId_clientId_idx" ON public.bank_categories USING btree ("companyId", "clientId");


--
-- Name: bank_categories_companyId_clientId_label_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "bank_categories_companyId_clientId_label_key" ON public.bank_categories USING btree ("companyId", "clientId", label);


--
-- Name: bank_classification_rules_companyId_pattern_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "bank_classification_rules_companyId_pattern_key" ON public.bank_classification_rules USING btree ("companyId", pattern);


--
-- Name: bank_nfe_matches_bankTransactionId_fiscalInvoiceId_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "bank_nfe_matches_bankTransactionId_fiscalInvoiceId_key" ON public.bank_nfe_matches USING btree ("bankTransactionId", "fiscalInvoiceId");


--
-- Name: bank_nfe_matches_companyId_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "bank_nfe_matches_companyId_status_idx" ON public.bank_nfe_matches USING btree ("companyId", status);


--
-- Name: bank_statements_companyId_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "bank_statements_companyId_clientId_idx" ON public.bank_statements USING btree ("companyId", "clientId");


--
-- Name: bank_statements_companyId_clientId_year_month_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "bank_statements_companyId_clientId_year_month_key" ON public.bank_statements USING btree ("companyId", "clientId", year, month);


--
-- Name: bank_transactions_companyId_nature_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "bank_transactions_companyId_nature_idx" ON public.bank_transactions USING btree ("companyId", nature);


--
-- Name: bank_transactions_statementId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "bank_transactions_statementId_idx" ON public.bank_transactions USING btree ("statementId");


--
-- Name: client_contracts_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "client_contracts_clientId_idx" ON public.client_contracts USING btree ("clientId");


--
-- Name: client_contracts_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "client_contracts_companyId_idx" ON public.client_contracts USING btree ("companyId");


--
-- Name: client_monthly_data_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "client_monthly_data_companyId_idx" ON public.client_monthly_data USING btree ("companyId");


--
-- Name: client_monthly_data_companyId_year_month_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "client_monthly_data_companyId_year_month_key" ON public.client_monthly_data USING btree ("companyId", year, month);


--
-- Name: client_monthly_data_userId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "client_monthly_data_userId_idx" ON public.client_monthly_data USING btree ("userId");


--
-- Name: client_services_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "client_services_clientId_idx" ON public.client_services USING btree ("clientId");


--
-- Name: client_services_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "client_services_companyId_idx" ON public.client_services USING btree ("companyId");


--
-- Name: clients_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "clients_companyId_idx" ON public.clients USING btree ("companyId");


--
-- Name: clients_userId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "clients_userId_idx" ON public.clients USING btree ("userId");


--
-- Name: commercial_plans_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "commercial_plans_companyId_idx" ON public.commercial_plans USING btree ("companyId");


--
-- Name: companies_cnpj_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX companies_cnpj_key ON public.companies USING btree (cnpj);


--
-- Name: company_profiles_userId_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "company_profiles_userId_key" ON public.company_profiles USING btree ("userId");


--
-- Name: dismissal_reasons_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "dismissal_reasons_companyId_idx" ON public.dismissal_reasons USING btree ("companyId");


--
-- Name: employees_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "employees_companyId_idx" ON public.employees USING btree ("companyId");


--
-- Name: employees_userId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "employees_userId_idx" ON public.employees USING btree ("userId");


--
-- Name: financial_transactions_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "financial_transactions_companyId_idx" ON public.financial_transactions USING btree ("companyId");


--
-- Name: financial_transactions_userId_date_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "financial_transactions_userId_date_idx" ON public.financial_transactions USING btree ("userId", date);


--
-- Name: fiscal_icms_apurations_companyId_clientId_year_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_icms_apurations_companyId_clientId_year_idx" ON public.fiscal_icms_apurations USING btree ("companyId", "clientId", year);


--
-- Name: fiscal_icms_apurations_companyId_clientId_year_month_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "fiscal_icms_apurations_companyId_clientId_year_month_key" ON public.fiscal_icms_apurations USING btree ("companyId", "clientId", year, month);


--
-- Name: fiscal_icms_apurations_companyId_year_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_icms_apurations_companyId_year_idx" ON public.fiscal_icms_apurations USING btree ("companyId", year);


--
-- Name: fiscal_inventory_balances_companyId_productId_year_month_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "fiscal_inventory_balances_companyId_productId_year_month_key" ON public.fiscal_inventory_balances USING btree ("companyId", "productId", year, month);


--
-- Name: fiscal_inventory_balances_companyId_year_month_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_inventory_balances_companyId_year_month_idx" ON public.fiscal_inventory_balances USING btree ("companyId", year, month);


--
-- Name: fiscal_inventory_movements_companyId_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_inventory_movements_companyId_clientId_idx" ON public.fiscal_inventory_movements USING btree ("companyId", "clientId");


--
-- Name: fiscal_inventory_movements_companyId_date_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_inventory_movements_companyId_date_idx" ON public.fiscal_inventory_movements USING btree ("companyId", date);


--
-- Name: fiscal_inventory_movements_companyId_productId_date_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_inventory_movements_companyId_productId_date_idx" ON public.fiscal_inventory_movements USING btree ("companyId", "productId", date);


--
-- Name: fiscal_inventory_movements_invoiceId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_inventory_movements_invoiceId_idx" ON public.fiscal_inventory_movements USING btree ("invoiceId");


--
-- Name: fiscal_invoice_items_invoiceId_itemNumber_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "fiscal_invoice_items_invoiceId_itemNumber_key" ON public.fiscal_invoice_items USING btree ("invoiceId", "itemNumber");


--
-- Name: fiscal_invoice_items_ncm_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX fiscal_invoice_items_ncm_idx ON public.fiscal_invoice_items USING btree (ncm);


--
-- Name: fiscal_invoice_items_productId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_invoice_items_productId_idx" ON public.fiscal_invoice_items USING btree ("productId");


--
-- Name: fiscal_invoices_companyId_accessKey_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "fiscal_invoices_companyId_accessKey_key" ON public.fiscal_invoices USING btree ("companyId", "accessKey");


--
-- Name: fiscal_invoices_companyId_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_invoices_companyId_clientId_idx" ON public.fiscal_invoices USING btree ("companyId", "clientId");


--
-- Name: fiscal_invoices_companyId_emissionDate_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_invoices_companyId_emissionDate_idx" ON public.fiscal_invoices USING btree ("companyId", "emissionDate");


--
-- Name: fiscal_invoices_companyId_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_invoices_companyId_status_idx" ON public.fiscal_invoices USING btree ("companyId", status);


--
-- Name: fiscal_invoices_companyId_supplierId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_invoices_companyId_supplierId_idx" ON public.fiscal_invoices USING btree ("companyId", "supplierId");


--
-- Name: fiscal_products_companyId_clientId_code_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "fiscal_products_companyId_clientId_code_key" ON public.fiscal_products USING btree ("companyId", "clientId", code);


--
-- Name: fiscal_products_companyId_clientId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_products_companyId_clientId_idx" ON public.fiscal_products USING btree ("companyId", "clientId");


--
-- Name: fiscal_products_companyId_description_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_products_companyId_description_idx" ON public.fiscal_products USING btree ("companyId", description);


--
-- Name: fiscal_products_companyId_ncm_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_products_companyId_ncm_idx" ON public.fiscal_products USING btree ("companyId", ncm);


--
-- Name: fiscal_suppliers_companyId_cnpj_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "fiscal_suppliers_companyId_cnpj_key" ON public.fiscal_suppliers USING btree ("companyId", cnpj);


--
-- Name: fiscal_suppliers_companyId_name_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "fiscal_suppliers_companyId_name_idx" ON public.fiscal_suppliers USING btree ("companyId", name);


--
-- Name: historical_entries_companyId_amount_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "historical_entries_companyId_amount_idx" ON public.historical_entries USING btree ("companyId", amount);


--
-- Name: historical_entries_companyId_clientId_year_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "historical_entries_companyId_clientId_year_idx" ON public.historical_entries USING btree ("companyId", "clientId", year);


--
-- Name: plan_service_items_planId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "plan_service_items_planId_idx" ON public.plan_service_items USING btree ("planId");


--
-- Name: plan_service_items_planId_serviceItemId_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "plan_service_items_planId_serviceItemId_key" ON public.plan_service_items USING btree ("planId", "serviceItemId");


--
-- Name: plan_service_items_serviceItemId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "plan_service_items_serviceItemId_idx" ON public.plan_service_items USING btree ("serviceItemId");


--
-- Name: planning_action_plans_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_action_plans_companyId_idx" ON public.planning_action_plans USING btree ("companyId");


--
-- Name: planning_action_plans_goalId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_action_plans_goalId_idx" ON public.planning_action_plans USING btree ("goalId");


--
-- Name: planning_areas_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_areas_companyId_idx" ON public.planning_areas USING btree ("companyId");


--
-- Name: planning_cycles_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_cycles_companyId_idx" ON public.planning_cycles USING btree ("companyId");


--
-- Name: planning_goals_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_goals_companyId_idx" ON public.planning_goals USING btree ("companyId");


--
-- Name: planning_goals_objectiveId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_goals_objectiveId_idx" ON public.planning_goals USING btree ("objectiveId");


--
-- Name: planning_kpis_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_kpis_companyId_idx" ON public.planning_kpis USING btree ("companyId");


--
-- Name: planning_objectives_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_objectives_companyId_idx" ON public.planning_objectives USING btree ("companyId");


--
-- Name: planning_objectives_cycleId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "planning_objectives_cycleId_idx" ON public.planning_objectives USING btree ("cycleId");


--
-- Name: plannings_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "plannings_companyId_idx" ON public.plannings USING btree ("companyId");


--
-- Name: positions_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "positions_companyId_idx" ON public.positions USING btree ("companyId");


--
-- Name: pricing_calculations_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "pricing_calculations_companyId_idx" ON public.pricing_calculations USING btree ("companyId");


--
-- Name: pricing_calculations_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX pricing_calculations_status_idx ON public.pricing_calculations USING btree (status);


--
-- Name: pricing_configs_companyId_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "pricing_configs_companyId_key" ON public.pricing_configs USING btree ("companyId");


--
-- Name: pricing_hour_rules_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "pricing_hour_rules_companyId_idx" ON public.pricing_hour_rules USING btree ("companyId");


--
-- Name: pricing_hour_rules_regime_activity_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX pricing_hour_rules_regime_activity_idx ON public.pricing_hour_rules USING btree (regime, activity);


--
-- Name: pricings_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "pricings_companyId_idx" ON public.pricings USING btree ("companyId");


--
-- Name: projects_companyId_deletedAt_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "projects_companyId_deletedAt_idx" ON public.projects USING btree ("companyId", "deletedAt");


--
-- Name: projects_companyId_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "projects_companyId_status_idx" ON public.projects USING btree ("companyId", status);


--
-- Name: proposal_items_proposalId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "proposal_items_proposalId_idx" ON public.proposal_items USING btree ("proposalId");


--
-- Name: proposals_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "proposals_companyId_idx" ON public.proposals USING btree ("companyId");


--
-- Name: proposals_isCurrent_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "proposals_isCurrent_idx" ON public.proposals USING btree ("isCurrent");


--
-- Name: proposals_originalProposalId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "proposals_originalProposalId_idx" ON public.proposals USING btree ("originalProposalId");


--
-- Name: proposals_proposalNumber_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "proposals_proposalNumber_key" ON public.proposals USING btree ("proposalNumber");


--
-- Name: proposals_slug_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX proposals_slug_key ON public.proposals USING btree (slug);


--
-- Name: proposals_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX proposals_status_idx ON public.proposals USING btree (status);


--
-- Name: proposals_userId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "proposals_userId_idx" ON public.proposals USING btree ("userId");


--
-- Name: resignations_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "resignations_companyId_idx" ON public.resignations USING btree ("companyId");


--
-- Name: resignations_dismissalDate_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "resignations_dismissalDate_idx" ON public.resignations USING btree ("dismissalDate");


--
-- Name: robot_worker_skills_companyId_enabled_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "robot_worker_skills_companyId_enabled_idx" ON public.robot_worker_skills USING btree ("companyId", enabled);


--
-- Name: robot_worker_skills_companyId_skillKey_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "robot_worker_skills_companyId_skillKey_key" ON public.robot_worker_skills USING btree ("companyId", "skillKey");


--
-- Name: robot_workers_companyId_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "robot_workers_companyId_key" ON public.robot_workers USING btree ("companyId");


--
-- Name: sectors_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "sectors_companyId_idx" ON public.sectors USING btree ("companyId");


--
-- Name: service_categories_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "service_categories_companyId_idx" ON public.service_categories USING btree ("companyId");


--
-- Name: service_items_categoryId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "service_items_categoryId_idx" ON public.service_items USING btree ("categoryId");


--
-- Name: service_items_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "service_items_companyId_idx" ON public.service_items USING btree ("companyId");


--
-- Name: tasks_companyId_assigneeId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "tasks_companyId_assigneeId_idx" ON public.tasks USING btree ("companyId", "assigneeId");


--
-- Name: tasks_companyId_deletedAt_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "tasks_companyId_deletedAt_idx" ON public.tasks USING btree ("companyId", "deletedAt");


--
-- Name: tasks_companyId_dueDate_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "tasks_companyId_dueDate_idx" ON public.tasks USING btree ("companyId", "dueDate");


--
-- Name: tasks_companyId_priority_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "tasks_companyId_priority_idx" ON public.tasks USING btree ("companyId", priority);


--
-- Name: tasks_companyId_projectId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "tasks_companyId_projectId_idx" ON public.tasks USING btree ("companyId", "projectId");


--
-- Name: tasks_companyId_status_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "tasks_companyId_status_idx" ON public.tasks USING btree ("companyId", status);


--
-- Name: turnover_monthly_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "turnover_monthly_companyId_idx" ON public.turnover_monthly USING btree ("companyId");


--
-- Name: turnover_monthly_companyId_year_month_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "turnover_monthly_companyId_year_month_key" ON public.turnover_monthly USING btree ("companyId", year, month);


--
-- Name: turnover_sector_distribution_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "turnover_sector_distribution_companyId_idx" ON public.turnover_sector_distribution USING btree ("companyId");


--
-- Name: turnover_sector_distribution_companyId_year_month_sectorId_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX "turnover_sector_distribution_companyId_year_month_sectorId_key" ON public.turnover_sector_distribution USING btree ("companyId", year, month, "sectorId");


--
-- Name: users_companyId_idx; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE INDEX "users_companyId_idx" ON public.users USING btree ("companyId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: radar_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: accounting_accounts accounting_accounts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_accounts
    ADD CONSTRAINT "accounting_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounting_accounts accounting_accounts_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_accounts
    ADD CONSTRAINT "accounting_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.accounting_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: accounting_entries accounting_entries_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT "accounting_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: accounting_entries accounting_entries_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT "accounting_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounting_entries accounting_entries_creditAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT "accounting_entries_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES public.accounting_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: accounting_entries accounting_entries_debitAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.accounting_entries
    ADD CONSTRAINT "accounting_entries_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES public.accounting_accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automation_pendings automation_pendings_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.automation_pendings
    ADD CONSTRAINT "automation_pendings_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.automation_runs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automation_runs automation_runs_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.automation_runs
    ADD CONSTRAINT "automation_runs_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.robot_workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bank_nfe_matches bank_nfe_matches_bankTransactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_nfe_matches
    ADD CONSTRAINT "bank_nfe_matches_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES public.bank_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bank_nfe_matches bank_nfe_matches_fiscalInvoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_nfe_matches
    ADD CONSTRAINT "bank_nfe_matches_fiscalInvoiceId_fkey" FOREIGN KEY ("fiscalInvoiceId") REFERENCES public.fiscal_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bank_statements bank_statements_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_statements
    ADD CONSTRAINT "bank_statements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bank_statements bank_statements_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_statements
    ADD CONSTRAINT "bank_statements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bank_transactions bank_transactions_statementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.bank_transactions
    ADD CONSTRAINT "bank_transactions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES public.bank_statements(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cells cells_sectorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.cells
    ADD CONSTRAINT "cells_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES public.sectors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_contracts client_contracts_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT "client_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_contracts client_contracts_commercialPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT "client_contracts_commercialPlanId_fkey" FOREIGN KEY ("commercialPlanId") REFERENCES public.commercial_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: client_contracts client_contracts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT "client_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_monthly_data client_monthly_data_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_monthly_data
    ADD CONSTRAINT "client_monthly_data_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_monthly_data client_monthly_data_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_monthly_data
    ADD CONSTRAINT "client_monthly_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_services client_services_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT "client_services_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_services client_services_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT "client_services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_services client_services_serviceItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT "client_services_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES public.service_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: clients clients_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: commercial_plans commercial_plans_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.commercial_plans
    ADD CONSTRAINT "commercial_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_profiles company_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.company_profiles
    ADD CONSTRAINT "company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dismissal_reasons dismissal_reasons_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.dismissal_reasons
    ADD CONSTRAINT "dismissal_reasons_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employees employees_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: financial_transactions financial_transactions_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "financial_transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "financial_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_icms_apurations fiscal_icms_apurations_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_icms_apurations
    ADD CONSTRAINT "fiscal_icms_apurations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fiscal_icms_apurations fiscal_icms_apurations_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_icms_apurations
    ADD CONSTRAINT "fiscal_icms_apurations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_inventory_balances fiscal_inventory_balances_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_balances
    ADD CONSTRAINT "fiscal_inventory_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_inventory_balances fiscal_inventory_balances_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_balances
    ADD CONSTRAINT "fiscal_inventory_balances_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.fiscal_products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_inventory_movements fiscal_inventory_movements_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_movements
    ADD CONSTRAINT "fiscal_inventory_movements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fiscal_inventory_movements fiscal_inventory_movements_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_movements
    ADD CONSTRAINT "fiscal_inventory_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_inventory_movements fiscal_inventory_movements_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_movements
    ADD CONSTRAINT "fiscal_inventory_movements_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.fiscal_invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fiscal_inventory_movements fiscal_inventory_movements_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_inventory_movements
    ADD CONSTRAINT "fiscal_inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.fiscal_products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_invoice_items fiscal_invoice_items_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoice_items
    ADD CONSTRAINT "fiscal_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.fiscal_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_invoice_items fiscal_invoice_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoice_items
    ADD CONSTRAINT "fiscal_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.fiscal_products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fiscal_invoices fiscal_invoices_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoices
    ADD CONSTRAINT "fiscal_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fiscal_invoices fiscal_invoices_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoices
    ADD CONSTRAINT "fiscal_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_invoices fiscal_invoices_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_invoices
    ADD CONSTRAINT "fiscal_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.fiscal_suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fiscal_products fiscal_products_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_products
    ADD CONSTRAINT "fiscal_products_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fiscal_products fiscal_products_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_products
    ADD CONSTRAINT "fiscal_products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fiscal_suppliers fiscal_suppliers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.fiscal_suppliers
    ADD CONSTRAINT "fiscal_suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plan_service_items plan_service_items_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.plan_service_items
    ADD CONSTRAINT "plan_service_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.commercial_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plan_service_items plan_service_items_serviceItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.plan_service_items
    ADD CONSTRAINT "plan_service_items_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES public.service_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_action_plans planning_action_plans_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_action_plans
    ADD CONSTRAINT "planning_action_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_action_plans planning_action_plans_goalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_action_plans
    ADD CONSTRAINT "planning_action_plans_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES public.planning_goals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_areas planning_areas_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_areas
    ADD CONSTRAINT "planning_areas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_cycles planning_cycles_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_cycles
    ADD CONSTRAINT "planning_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_goals planning_goals_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_goals
    ADD CONSTRAINT "planning_goals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_goals planning_goals_objectiveId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_goals
    ADD CONSTRAINT "planning_goals_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES public.planning_objectives(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_kpis planning_kpis_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_kpis
    ADD CONSTRAINT "planning_kpis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_objectives planning_objectives_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_objectives
    ADD CONSTRAINT "planning_objectives_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planning_objectives planning_objectives_cycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.planning_objectives
    ADD CONSTRAINT "planning_objectives_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES public.planning_cycles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plannings plannings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT "plannings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: positions positions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pricing_calculations pricing_calculations_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_calculations
    ADD CONSTRAINT "pricing_calculations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pricing_calculations pricing_calculations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_calculations
    ADD CONSTRAINT "pricing_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pricing_configs pricing_configs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_configs
    ADD CONSTRAINT "pricing_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pricing_hour_rules pricing_hour_rules_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricing_hour_rules
    ADD CONSTRAINT "pricing_hour_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pricings pricings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.pricings
    ADD CONSTRAINT "pricings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_items proposal_items_commercialPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT "proposal_items_commercialPlanId_fkey" FOREIGN KEY ("commercialPlanId") REFERENCES public.commercial_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proposal_items proposal_items_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_items proposal_items_serviceItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT "proposal_items_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES public.service_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proposals proposals_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposals proposals_originalProposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_originalProposalId_fkey" FOREIGN KEY ("originalProposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proposals proposals_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resignations resignations_dismissalReasonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT "resignations_dismissalReasonId_fkey" FOREIGN KEY ("dismissalReasonId") REFERENCES public.dismissal_reasons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resignations resignations_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT "resignations_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resignations resignations_sectorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT "resignations_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES public.sectors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resignations resignations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.resignations
    ADD CONSTRAINT "resignations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: robot_worker_skills robot_worker_skills_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.robot_worker_skills
    ADD CONSTRAINT "robot_worker_skills_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.robot_workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: robot_workers robot_workers_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.robot_workers
    ADD CONSTRAINT "robot_workers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sectors sectors_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT "sectors_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_categories service_categories_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT "service_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_items service_items_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT "service_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.service_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_items service_items_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT "service_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: turnover_monthly turnover_monthly_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.turnover_monthly
    ADD CONSTRAINT "turnover_monthly_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: turnover_sector_distribution turnover_sector_distribution_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.turnover_sector_distribution
    ADD CONSTRAINT "turnover_sector_distribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: turnover_sector_distribution turnover_sector_distribution_sectorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.turnover_sector_distribution
    ADD CONSTRAINT "turnover_sector_distribution_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES public.sectors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: turnover_sector_distribution turnover_sector_distribution_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.turnover_sector_distribution
    ADD CONSTRAINT "turnover_sector_distribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: radar_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO radar_user;


--
-- PostgreSQL database dump complete
--

\unrestrict s1LWJxl1bIY2JWQLLaEZKOxfVVRJcuEOy44CegJrvvpTCVsOHvZvJgPprLh3iF1

