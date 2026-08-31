'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, Plus, Clock, AlertCircle } from 'lucide-react';

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-slate-100 text-slate-700' },
  { id: 'TODO', label: 'A Fazer', color: 'bg-blue-100 text-blue-700' },
  { id: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-amber-100 text-amber-700' },
  { id: 'REVIEW', label: 'Revisão', color: 'bg-purple-100 text-purple-700' },
  { id: 'DONE', label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
];

const PRIORITY_COLORS: any = {
  LOW: 'bg-slate-200 text-slate-700',
  MEDIUM: 'bg-blue-200 text-blue-800',
  HIGH: 'bg-orange-200 text-orange-800',
  URGENT: 'bg-red-200 text-red-800',
};

export default function TarefasPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch { toast.error('Erro ao carregar tarefas'); }
    finally { setLoading(false); }
  }

  // 🆕 Drag & Drop Handlers (Nativo HTML5)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Tarefa movida!');
      loadTasks();
    } catch { toast.error('Erro ao mover tarefa'); }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Quadro de Tarefas (Kanban)</h1>
      
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1000px] h-full">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div 
                key={col.id} 
                onDrop={(e) => handleDrop(e, col.id)} 
                onDragOver={handleDragOver}
                className="flex-1 bg-slate-50 rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                <div className={`flex items-center justify-between mb-3 px-2 py-1 rounded-lg ${col.color}`}>
                  <span className="font-bold text-sm">{col.label}</span>
                  <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div 
                      key={task.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-teal-400 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{task.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                          <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}