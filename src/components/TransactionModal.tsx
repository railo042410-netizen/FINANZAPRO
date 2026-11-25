import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Coins, Percent, Repeat, X } from 'lucide-react';
import {
  AppSettings,
  ExpenseBucket,
  FixedExpense,
  SavingsPocket,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  CATEGORY_CATALOG,
  formatCurrency,
  formatGroupedNumberInput,
  handleGroupedNumberChange,
  getDefaultBucketForCategory,
  getTodayISO,
  parseGroupedNumber,
} from '../utils/formatters';
import { calculateRoundUp } from '../utils/financeEngine';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pockets: SavingsPocket[];
  settings: AppSettings;
  currentAvailableBalance: number;
  editingTransaction: Transaction | null;
  initialType?: TransactionType;
  initialPocketId?: string;
  onSave: (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string,
    fixedTemplate?: Omit<FixedExpense, 'id' | 'createdAt'>
  ) => void;
}

const RETENTION_PRESETS = [10, 15, 20, 25];
const ROUNDUP_STEPS = [1000, 5000, 10000];

export function TransactionModal({
  isOpen,
  onClose,
  pockets,
  settings,
  currentAvailableBalance,
  editingTransaction,
  initialType = 'expense',
  initialPocketId,
  onSave,
}: TransactionModalProps) {
  const primaryPocket = useMemo(
    () => pockets.find((p) => p.isPrimary) ?? pockets[0],
    [pockets]
  );

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState('');

  // Income retention
  const [retentionEnabled, setRetentionEnabled] = useState(
    settings.defaultRetentionEnabled
  );
  const [retentionPercent, setRetentionPercent] = useState(
    settings.defaultRetentionPercent
  );

  // Expense round-up & 50/30/20 bucket
  const [roundUpEnabled, setRoundUpEnabled] = useState(
    settings.defaultRoundUpEnabled
  );
  const [roundUpStep, setRoundUpStep] = useState(settings.roundUpStep || 5000);
  const [bucket, setBucket] = useState<ExpenseBucket>('needs');

  // Target pocket
  const [pocketId, setPocketId] = useState<string>(primaryPocket?.id ?? '');
  // Save as fixed expense
  const [saveAsFixed, setSaveAsFixed] = useState(false);
  const [fixedName, setFixedName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Read settings at open time only: changing a preference while the form is
  // open must not wipe what the user has typed.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');

    const currentSettings = settingsRef.current;
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountInput(
        formatGroupedNumberInput(String(Math.round(editingTransaction.amount)))
      );
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note);
      setRetentionEnabled((editingTransaction.retainedAmount ?? 0) > 0);
      setRetentionPercent(
        editingTransaction.retentionPercent ?? currentSettings.defaultRetentionPercent
      );
      setRoundUpEnabled((editingTransaction.roundUpAmount ?? 0) > 0);
      setRoundUpStep(
        editingTransaction.roundUpStep ?? currentSettings.roundUpStep ?? 5000
      );
      setBucket(
        editingTransaction.bucket ??
          getDefaultBucketForCategory(editingTransaction.category)
      );
      setPocketId(editingTransaction.pocketId ?? primaryPocket?.id ?? '');
      setSaveAsFixed(false);
      setFixedName('');
    } else {
      const startType = initialType;
      setType(startType);
      setAmountInput('');
      const defaultCat =
        startType === 'income'
          ? 'Salario'
          : startType === 'transfer'
          ? 'Aporte a Meta'
          : 'Alimentación';
      setCategory(defaultCat);
      setDate(getTodayISO());
      setNote('');
      setRetentionEnabled(currentSettings.defaultRetentionEnabled);
      setRetentionPercent(currentSettings.defaultRetentionPercent);
      setRoundUpEnabled(currentSettings.defaultRoundUpEnabled);
      setRoundUpStep(currentSettings.roundUpStep || 5000);
      setBucket(getDefaultBucketForCategory(defaultCat));
      setPocketId(initialPocketId ?? primaryPocket?.id ?? '');
      setSaveAsFixed(false);
      setFixedName('');
    }
  }, [isOpen, editingTransaction, initialType, initialPocketId, primaryPocket]);

  const categoriesForType = useMemo(
    () => CATEGORY_CATALOG.filter((c) => c.type === type),
    [type]
  );

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const firstCat =
      CATEGORY_CATALOG.find((c) => c.type === nextType)?.name ?? '';
    setCategory(firstCat);
    if (nextType === 'expense') {
      setBucket(getDefaultBucketForCategory(firstCat));
    }
  };

  const handleCategoryChange = (nextCat: string) => {
    setCategory(nextCat);
    if (type === 'expense') {
      setBucket(getDefaultBucketForCategory(nextCat));
    }
  };

  const numericAmount = parseGroupedNumber(amountInput);

  // Retention math
  const retainedAmount =
    type === 'income' && retentionEnabled && numericAmount > 0
      ? Math.round((numericAmount * Math.max(0, Math.min(100, retentionPercent))) / 100)
      : 0;
  const netAvailableIncome = Math.max(0, numericAmount - retainedAmount);

  // Round-up math
  const roundUpPreview = useMemo(() => {
    if (type !== 'expense' || !roundUpEnabled || numericAmount <= 0) {
      return { roundedTotal: numericAmount, roundUpAmount: 0 };
    }
    return calculateRoundUp(numericAmount, roundUpStep);
  }, [type, roundUpEnabled, numericAmount, roundUpStep]);

  // Projected Available Balance Check (adjusting if editing existing transaction)
  const effectiveBalanceBeforeThisTx = useMemo(() => {
    if (!editingTransaction) return currentAvailableBalance;
    if (editingTransaction.type === 'income') {
      const prevNet =
        editingTransaction.amount - (editingTransaction.retainedAmount ?? 0);
      return currentAvailableBalance - prevNet;
    }
    if (editingTransaction.type === 'expense') {
      const prevOut =
        editingTransaction.amount + (editingTransaction.roundUpAmount ?? 0);
      return currentAvailableBalance + prevOut;
    }
    return currentAvailableBalance + editingTransaction.amount;
  }, [currentAvailableBalance, editingTransaction]);

  const outflowAmount =
    type === 'expense'
      ? numericAmount + roundUpPreview.roundUpAmount
      : type === 'transfer'
      ? numericAmount
      : 0;

  const projectedBalanceAfter =
    type === 'income'
      ? effectiveBalanceBeforeThisTx + netAvailableIncome
      : effectiveBalanceBeforeThisTx - outflowAmount;

  const exceedsAvailable =
    (type === 'expense' || type === 'transfer') &&
    numericAmount > 0 &&
    projectedBalanceAfter < 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setErrorMsg('Ingresa un monto mayor a cero.');
      return;
    }
    if (!date) {
      setErrorMsg('Selecciona una fecha válida.');
      return;
    }

    const chosenPocketId = pocketId || primaryPocket?.id;

    const payload: Omit<Transaction, 'id' | 'createdAt'> = {
      type,
      amount: numericAmount,
      category: category || (type === 'transfer' ? 'Aporte a Meta' : 'Otros'),
      date,
      note: note.trim(),
      ...(type === 'income'
        ? {
            retentionPercent: retentionEnabled ? retentionPercent : 0,
            retainedAmount,
            pocketId: retainedAmount > 0 ? chosenPocketId : undefined,
          }
        : {}),
      ...(type === 'expense'
        ? {
            roundUpAmount: roundUpPreview.roundUpAmount,
            roundUpStep:
              roundUpPreview.roundUpAmount > 0 ? roundUpStep : undefined,
            pocketId:
              roundUpPreview.roundUpAmount > 0
                ? primaryPocket?.id ?? chosenPocketId
                : undefined,
            bucket,
          }
        : {}),
      ...(type === 'transfer'
        ? {
            pocketId: chosenPocketId,
          }
        : {}),
    };

    const fixedTemplate: Omit<FixedExpense, 'id' | 'createdAt'> | undefined =
      type === 'expense' && !editingTransaction && saveAsFixed
        ? {
            name: fixedName.trim() || note.trim() || category,
            amount: numericAmount,
            category,
            dayOfMonth: Math.max(
              1,
              Math.min(31, parseInt(date.split('-')[2] || '1', 10) || 1)
            ),
            bucket,
            active: true,
            note: note.trim(),
          }
        : undefined;

    onSave(payload, editingTransaction?.id, fixedTemplate);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="animate-pop w-full max-w-lg rounded-2xl surface-card shadow-2xl max-h-[92vh] overflow-y-auto border-orange-400/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="tx-modal-title" className="text-base font-semibold neon-gradient">
            {editingTransaction ? 'Editar Movimiento' : 'Registrar Movimiento'}
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
          {/* Segmented Type Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl surface-sub">
            {(
              [
                { id: 'expense', label: 'Gasto' },
                { id: 'income', label: 'Ingreso' },
                { id: 'transfer', label: 'Ahorro' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleTypeSwitch(opt.id)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  type === opt.id
                    ? opt.id === 'income'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-300 text-stone-950'
                      : opt.id === 'expense'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-amber-400 to-red-400 text-stone-950'
                    : 'text-stone-400 hover:text-stone-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="tx-amount"
              className="block text-xs font-medium text-stone-300"
            >
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -transtone-y-1/2 font-mono-tabular text-lg font-semibold text-stone-400">
                $
              </span>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) =>
                  handleGroupedNumberChange(e, setAmountInput)
                }
                placeholder="0"
                autoFocus
                className="w-full pl-9 pr-4 py-3 rounded-xl surface-sub font-mono-tabular text-2xl font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>Saldo disponible actual:</span>
              <span className="font-mono-tabular text-stone-200 font-medium">
                {formatCurrency(effectiveBalanceBeforeThisTx)}
              </span>
            </div>
          </div>

          {/* Exceeds Available Warning */}
          {exceedsAvailable && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/40 text-xs text-red-100"
            >
              <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#ef4444]">
                  Atención: estás afectando tus metas de ahorro.
                </span>{' '}
                Este movimiento supera tu saldo disponible en{' '}
                <span className="font-mono-tabular font-bold text-white">
                  {formatCurrency(Math.abs(projectedBalanceAfter))}
                </span>
                .
              </div>
            </div>
          )}

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-stone-300"
              >
                Categoría
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 focus:outline-none focus:border-[#f59e0b]"
              >
                {categoriesForType.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-stone-300"
              >
                Fecha
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] font-mono-tabular text-sm text-stone-100 focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* 50/30/20 Bucket Classification for Expenses */}
          {type === 'expense' && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#150c07] border border-[#4a2e1b]">
              <span className="text-xs text-stone-300">
                Clasificación Regla 50/30/20
              </span>
              <div className="inline-flex rounded-lg bg-[#2a1a10] p-0.5 border border-[#4a2e1b]">
                <button
                  type="button"
                  onClick={() => setBucket('needs')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    bucket === 'needs'
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Necesidad (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setBucket('wants')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    bucket === 'wants'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Deseo (30%)
                </button>
              </div>
            </div>
          )}

          {/* Mechanism 1: Automatic Retention on Income */}
          {type === 'income' && (
            <div className="p-4 rounded-xl bg-[#150c07] border border-[#4a2e1b] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#f59e0b]" />
                  <span className="text-xs font-semibold text-stone-100">
                    Retención Automática para Ahorro
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={retentionEnabled}
                  onClick={() => setRetentionEnabled((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    retentionEnabled
                      ? 'bg-gradient-to-r from-orange-400 to-red-500'
                      : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      retentionEnabled ? 'transtone-x-5' : 'transtone-x-0'
                    }`}
                  />
                </button>
              </div>

              {retentionEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {RETENTION_PRESETS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setRetentionPercent(pct)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-medium transition-colors cursor-pointer ${
                          retentionPercent === pct
                            ? 'bg-[#f59e0b] text-stone-950'
                            : 'bg-[#2a1a10] text-stone-300 border border-[#4a2e1b] hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={retentionPercent}
                        onChange={(e) =>
                          setRetentionPercent(
                            Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          )
                        }
                        aria-label="Porcentaje personalizado"
                        className="w-14 px-2 py-1 rounded-lg bg-[#2a1a10] border border-[#4a2e1b] font-mono-tabular text-xs text-stone-100 text-right"
                      />
                      <span className="text-xs text-stone-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="retention-pocket"
                      className="block text-[11px] text-stone-400"
                    >
                      Bolsillo destino de la retención
                    </label>
                    <select
                      id="retention-pocket"
                      value={pocketId}
                      onChange={(e) => setPocketId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#2a1a10] border border-[#4a2e1b] text-xs text-stone-100"
                    >
                      {pockets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {numericAmount > 0 && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#4a2e1b]/80 font-mono-tabular">
                      <span className="text-[#f59e0b]">
                        Ahorro directo: {formatCurrency(retainedAmount)}
                      </span>
                      <span className="text-stone-300">
                        Disponible: {formatCurrency(netAvailableIncome)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mechanism 3: Smart Round-up Micro-savings on Expense */}
          {type === 'expense' && (
            <div className="p-4 rounded-xl bg-[#150c07] border border-[#4a2e1b] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#f59e0b]" />
                  <div>
                    <div className="text-xs font-semibold text-stone-100">
                      Reto de Redondeo (Micro-ahorro)
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Envía el vuelto a {primaryPocket?.name ?? 'tu bolsillo principal'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={roundUpEnabled}
                  onClick={() => setRoundUpEnabled((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                    roundUpEnabled
                      ? 'bg-gradient-to-r from-yellow-300 to-amber-400'
                      : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      roundUpEnabled ? 'transtone-x-5' : 'transtone-x-0'
                    }`}
                  />
                </button>
              </div>

              {roundUpEnabled && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400">
                      Redondear al múltiplo de:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ROUNDUP_STEPS.map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setRoundUpStep(step)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono-tabular font-medium transition-colors cursor-pointer ${
                            roundUpStep === step
                              ? 'bg-[#f59e0b] text-stone-950'
                              : 'bg-[#2a1a10] text-stone-300 border border-[#4a2e1b]'
                          }`}
                        >
                          {formatCurrency(step)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {numericAmount > 0 && (
                    <div className="text-xs font-mono-tabular pt-2 border-t border-[#4a2e1b]/80 flex items-center justify-between">
                      <span className="text-stone-300">
                        Redondea a {formatCurrency(roundUpPreview.roundedTotal)}
                      </span>
                      <span className="text-[#f59e0b] font-semibold">
                        +{formatCurrency(roundUpPreview.roundUpAmount)} a ahorro
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Option to also save new expense as monthly fixed expense */}
          {type === 'expense' && !editingTransaction && (
            <div className="p-4 rounded-xl bg-[#150c07] border border-[#4a2e1b] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="text-xs font-semibold text-stone-100">
                      Guardar también como gasto fijo mensual
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Ideal para vivienda, alimentación o transporte recurrente
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={saveAsFixed}
                  onClick={() => setSaveAsFixed((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                    saveAsFixed
                      ? 'bg-gradient-to-r from-amber-400 to-red-500'
                      : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      saveAsFixed ? 'transtone-x-5' : 'transtone-x-0'
                    }`}
                  />
                </button>
              </div>

              {saveAsFixed && (
                <div className="space-y-1.5 pt-1">
                  <label
                    htmlFor="tx-fixed-name"
                    className="block text-[11px] text-stone-400"
                  >
                    Nombre del gasto fijo (se repetirá cada día{' '}
                    {parseInt(date.split('-')[2] || '1', 10) || 1} del mes)
                  </label>
                  <input
                    id="tx-fixed-name"
                    type="text"
                    maxLength={50}
                    value={fixedName}
                    onChange={(e) => setFixedName(e.target.value)}
                    placeholder={`Ej. ${category} mensual`}
                    className="w-full px-3 py-2 rounded-lg bg-[#2a1a10] border border-[#4a2e1b] text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Transfer Destination Pocket */}
          {type === 'transfer' && (
            <div className="space-y-1.5">
              <label
                htmlFor="transfer-pocket"
                className="block text-xs font-medium text-stone-300"
              >
                Bolsillo / Meta de Destino
              </label>
              <select
                id="transfer-pocket"
                value={pocketId}
                onChange={(e) => setPocketId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 focus:outline-none focus:border-[#f59e0b]"
              >
                {pockets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-stone-300"
            >
              Nota breve (opcional)
            </label>
            <input
              id="tx-note"
              type="text"
              maxLength={80}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Mercado quincenal, nómina, abono..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#150c07] border border-[#4a2e1b] text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

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
              {editingTransaction ? 'Guardar Cambios' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
