// =================================================================
// INÍCIO: frontend/src/app/dashboard/funcionario-digital/page.tsx
// =================================================================
// Mesa de trabalho da Aurora — a funcionária digital do escritório.
//
// Seções (de cima para baixo):
//   1. Header da Aurora (avatar 🌅 + status + pausa/retoma)
//   2. 4 KPI cards (runs hoje, auto-aprovados, pendências, tempo)
//   3. Timeline de execuções (histórico visual)
//   4. Fila de revisão 🟡 (pendências aguardando humano)
//   5. Painel de skills (ligar/desligar + cron)
//   6. Trilha de auditoria (log de compliance)
//
// ADRs aplicadas: ADR-001 (CSS puro), ADR-021 (Lucide), ADR-023 (?.)
// =================================================================
'use client';

import { useEffect } from 'react';
import { useDigitalEmployee } from '@/lib/hooks/useDigitalEmployee';
import { EmployeeHeader } from './components/EmployeeHeader';
import { KpiCards } from './components/KpiCards';
import { RunsTimeline } from './components/RunsTimeline';
import { PendingQueue } from './components/PendingQueue';
import { SkillsPanel } from './components/SkillsPanel';
import { AuditTrail } from './components/AuditTrail';
import { toast } from 'sonner';

export default function FuncionarioDigitalPage() {
  const {
    worker,
    dashboard,
    runs,
    pendings,
    audits,
    loading,
    error,
    fetchAll,
    toggleWorker,
    toggleSkill,
    runSkillNow,
    resolvePending,
  } = useDigitalEmployee();

  // Carrega todos os dados na montagem
  useEffect(() => {
    fetchAll();
    // Refresh automático a cada 30s (Aurora pode estar trabalhando)
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Toast de erro global
  useEffect(() => {
    if (error) {
      toast.error(`Erro ao carregar Aurora: ${error}`);
    }
  }, [error]);

  if (loading && !worker) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header da Aurora */}
      <EmployeeHeader
        worker={worker}
        onToggle={() => toggleWorker(worker?.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
      />

      {/* 2. KPI cards */}
      <KpiCards dashboard={dashboard} />

      {/* 3. Grid 2 colunas: Timeline + Pendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RunsTimeline runs={runs} onRunNow={runSkillNow} />
        <PendingQueue pendings={pendings} onResolve={resolvePending} />
      </div>

      {/* 4. Painel de skills (largura total) */}
      <SkillsPanel
        skills={worker?.skills || []}
        onToggle={(skillId, enabled) => toggleSkill(skillId, enabled)}
        onRunNow={runSkillNow}
      />

      {/* 5. Trilha de auditoria (largura total) */}
      <AuditTrail audits={audits} />
    </div>
  );
}
// =================================================================
// FIM: frontend/src/app/dashboard/funcionario-digital/page.tsx
// =================================================================