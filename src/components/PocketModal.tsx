import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PocketIconKey, SavingsPocket } from '../types/finance';
import {
  formatGroupedNumberInput,
  handleGroupedNumberChange,
  parseGroupedNumber,
} from '../utils/formatters';
import { POCKET_ICON_OPTIONS, PocketIcon } from './PocketIcon';

interface PocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPocket: SavingsPocket | null;
  onSave: (
    data: {
      name: string;
      targetAmount: number;
      deadline: string;
      icon: PocketIconKey;
      isPrimary: boolean;
    },
    existingPocket: SavingsPocket | null
  ) => void;
}

export function PocketModal({
  isOpen,
  onClose,
  editingPocket,
  onSave,
}: PocketModalProps) {
  const [name, setName] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState<PocketIconKey>('shield');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingPocket) {
      setName(editingPocket.name);
      setTargetInput(
        formatGroupedNumberInput(String(Math.round(editingPocket.targetAmount)))
      );
      setDeadline(editingPocket.deadline);
      setIcon(editingPocket.icon);
      setIsPrimary(editingPocket.isPrimary);
    } else {
      const nextYear = new Date();
      nextYear.setMonth(nextYear.getMonth() + 12);
      const iso = `${nextYear.getFullYear()}-${String(
        nextYear.getMonth() + 1
      ).padStart(2, '0')}-28`;
      setName('');
      setTargetInput('');
      setDeadline(iso);
      setIcon('shield');
      setIsPrimary(false);
    }
  }, [isOpen, editingPocket]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseGroupedNumber(targetInput);
    if (!name.trim()) {
      setErrorMsg('Ingresa un nombre para la meta.');
      return;
    }
    if (targetAmount <= 0) {
      setErrorMsg('El monto objetivo debe ser mayor a cero.');
      return;
    }
    if (!deadline) {
      setErrorMsg('Selecciona una fecha límite.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        targetAmount,
        deadline,
        icon,
        isPrimary,
      },
      editingPocket
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pocket-modal-title"
    >
      <div className="animate-pop w-full max-w-md rounded-2xl surface-card shadow-2xl border-orange-400/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="pocket-modal-title" className="text-base font-semibold neon-gradient">
            {editingPocket ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="pocket-name"
              className="block text-xs font-medium text-stone-300"
            >
              Nombre de la meta
            </label>
            <input
              id="pocket-name"
              type="text"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fondo de Emergencia, Viaje, Inversión"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="pocket-target"
                className="block text-xs font-medium text-stone-300"
              >
                Monto objetivo
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -transtone-y-1/2 font-mono-tabular text-sm text-stone-400">
                  $
                </span>
                <input
                  id="pocket-target"
                  type="text"
                  inputMode="numeric"
                  value={targetInput}
                  onChange={(e) =>
                    handleGroupedNumberChange(e, setTargetInput)
                  }
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] font-mono-tabular text-sm font-semibold text-stone-100 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pocket-deadline"
                className="block text-xs font-medium text-stone-300"
              >
                Fecha límite
              </label>
              <input
                id="pocket-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] font-mono-tabular text-sm text-stone-100 focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-stone-300">
              Ícono de la meta
            </span>
            <div className="grid grid-cols-4 gap-2">
              {POCKET_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setIcon(opt.key)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-[11px] transition-colors cursor-pointer ${
                    icon === opt.key
                      ? 'bg-orange-500/20 border-orange-400 text-orange-200 shadow-[0_0_18px_-8px_rgba(251,146,60,0.9)]'
                      : 'bg-[#150c07] border-[#4a2e1b] text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <PocketIcon icon={opt.key} className="w-4 h-4" />
                  <span className="truncate max-w-full">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#150c07] border border-[#4a2e1b] cursor-pointer">
            <div>
              <div className="text-xs font-medium text-stone-100">
                Bolsillo principal
              </div>
              <div className="text-[11px] text-stone-400">
                Recibirá automáticamente los redondeos de gastos
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 accent-orange-500 cursor-pointer"
            />
          </label>

          {errorMsg && (
            <p className="text-xs text-[#ef4444] font-medium">{errorMsg}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-medium text-stone-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="cta-vivid px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {editingPocket ? 'Guardar Meta' : 'Crear Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
