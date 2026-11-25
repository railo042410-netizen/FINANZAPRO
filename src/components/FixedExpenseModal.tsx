import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ExpenseBucket, FixedExpense } from '../types/finance';
import {
  CATEGORY_CATALOG,
  formatGroupedNumberInput,
  handleGroupedNumberChange,
  getDefaultBucketForCategory,
  parseGroupedNumber,
} from '../utils/formatters';

interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFixedExpense: FixedExpense | null;
  onSave: (
    data: Omit<FixedExpense, 'id' | 'createdAt'>,
    existing: FixedExpense | null
  ) => void;
}

const QUICK_CATEGORIES = ['Vivienda', 'Alimentación', 'Transporte', 'Servicios'];

export function FixedExpenseModal({
  isOpen,
  onClose,
  editingFixedExpense,
  onSave,
}: FixedExpenseModalProps) {
  const expenseCategories = useMemo(
    () => CATEGORY_CATALOG.filter((c) => c.type === 'expense'),
    []
  );

  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState('Vivienda');
  const [dayOfMonth, setDayOfMonth] = useState(5);
  const [bucket, setBucket] = useState<ExpenseBucket>('needs');
  const [active, setActive] = useState(true);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    if (editingFixedExpense) {
      setName(editingFixedExpense.name);
      setAmountInput(
        formatGroupedNumberInput(
          String(Math.round(editingFixedExpense.amount))
        )
      );
      setCategory(editingFixedExpense.category);
      setDayOfMonth(editingFixedExpense.dayOfMonth);
      setBucket(editingFixedExpense.bucket);
      setActive(editingFixedExpense.active);
      setNote(editingFixedExpense.note);
    } else {
      setName('');
      setAmountInput('');
      setCategory('Vivienda');
      setDayOfMonth(5);
      setBucket('needs');
      setActive(true);
      setNote('');
    }
  }, [isOpen, editingFixedExpense]);

  if (!isOpen) return null;

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    setBucket(getDefaultBucketForCategory(nextCategory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseGroupedNumber(amountInput);
    if (!name.trim()) {
      setErrorMsg('Ingresa un nombre para identificar el gasto fijo.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('El monto mensual debe ser mayor a cero.');
      return;
    }

    const safeDay = Math.max(1, Math.min(31, Number(dayOfMonth) || 1));

    onSave(
      {
        name: name.trim(),
        amount,
        category,
        dayOfMonth: safeDay,
        bucket,
        active,
        note: note.trim(),
      },
      editingFixedExpense
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fe-modal-title"
    >
      <div className="animate-pop w-full max-w-lg rounded-2xl surface-card shadow-2xl max-h-[92vh] overflow-y-auto border-orange-400/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="fe-modal-title" className="text-base font-semibold neon-gradient">
            {editingFixedExpense ? 'Editar Gasto Fijo' : 'Registrar Gasto Fijo'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Category Buttons */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-stone-300">
              Categorías frecuentes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-yellow-400/15 border-yellow-300 text-yellow-200'
                      : 'bg-[#150c07] border-[#4a2e1b] text-stone-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="fe-name"
              className="block text-xs font-medium text-stone-300"
            >
              Nombre del gasto fijo
            </label>
            <input
              id="fe-name"
              type="text"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Arriendo, Mercado mensual, Transporte público"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fe-amount"
                className="block text-xs font-medium text-stone-300"
              >
                Monto mensual
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -transtone-y-1/2 font-mono-tabular text-sm text-stone-400">
                  $
                </span>
                <input
                  id="fe-amount"
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={(e) =>
                    handleGroupedNumberChange(e, setAmountInput)
                  }
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] font-mono-tabular text-sm font-semibold text-stone-100 focus:outline-none focus:border-[#f59e0b]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="fe-day"
                className="block text-xs font-medium text-stone-300"
              >
                Día de cobro al mes (1–31)
              </label>
              <input
                id="fe-day"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) =>
                  setDayOfMonth(
                    Math.max(1, Math.min(31, Number(e.target.value) || 1))
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] font-mono-tabular text-sm text-stone-100 focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fe-category"
                className="block text-xs font-medium text-stone-300"
              >
                Categoría
              </label>
              <select
                id="fe-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 focus:outline-none focus:border-[#f59e0b]"
              >
                {expenseCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-stone-300">
                Regla 50/30/20
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#150c07] border border-[#4a2e1b]">
                <button
                  type="button"
                  onClick={() => setBucket('needs')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    bucket === 'needs'
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Necesidad
                </button>
                <button
                  type="button"
                  onClick={() => setBucket('wants')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    bucket === 'wants'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Deseo
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="fe-note"
              className="block text-xs font-medium text-stone-300"
            >
              Nota breve (opcional)
            </label>
            <input
              id="fe-note"
              type="text"
              maxLength={80}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Transferencia día 3, tarjeta transporte..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#150c07] border border-[#4a2e1b] cursor-pointer">
            <div>
              <div className="text-xs font-medium text-stone-100">
                Gasto fijo activo
              </div>
              <div className="text-[11px] text-stone-400">
                Incluye este monto en tu compromiso mensual fijo
              </div>
            </div>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 accent-[#f59e0b] cursor-pointer"
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
              {editingFixedExpense ? 'Guardar Cambios' : 'Guardar Gasto Fijo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
