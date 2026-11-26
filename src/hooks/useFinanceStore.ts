import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyState, createSeedState } from '../data/seedData';
import {
  AppSettings,
  ExpenseBucket,
  FinanceState,
  FixedExpense,
  PocketIconKey,
  SavingsPocket,
  Transaction,
  TransactionType,
} from '../types/finance';
import { getDefaultBucketForCategory, getTodayISO } from '../utils/formatters';
import {
  fetchSubFinance,
  saveSubFinance,
  type SubaccountSession,
} from '../subaccount';

const STORAGE_KEY = 'finanzapro_state_v1';

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense', 'transfer'];
const EXPENSE_BUCKETS: ExpenseBucket[] = ['needs', 'wants'];
const POCKET_ICONS: PocketIconKey[] = [
  'shield',
  'plane',
  'trending',
  'home',
  'laptop',
  'heart',
  'graduation',
  'car',
];
const ROUND_UP_STEPS = [1000, 5000, 10000];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
}

function readDate(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : fallback;
}

function readTimestamp(value: unknown, fallback: string): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readId(
  value: unknown,
  prefix: string,
  used: Set<string>,
  index: number
): string {
  const candidate = typeof value === 'string' && value.trim() ? value : '';
  if (candidate && !used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  let next = index;
  while (used.has(`${prefix}-${next}`)) next += 1;
  const id = `${prefix}-${next}`;
  used.add(id);
  return id;
}

/**
 * Validates and sanitizes data coming from localStorage or an imported backup.
 * Malformed entries used to crash every calculation (e.g. `tx.date.slice`).
 */
function normalizeState(candidate: unknown): FinanceState | null {
  if (
    !isRecord(candidate) ||
    !Array.isArray(candidate.transactions) ||
    !Array.isArray(candidate.pockets)
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const today = getTodayISO();
  const usedIds = new Set<string>();

  const pockets: SavingsPocket[] = candidate.pockets.filter(isRecord).map((raw, index) => ({
    id: readId(raw.id, 'pocket', usedIds, index),
    name: readString(raw.name, `Meta ${index + 1}`).slice(0, 80),
    targetAmount: Math.max(0, readNumber(raw.targetAmount)),
    deadline: readDate(raw.deadline, today),
    icon: POCKET_ICONS.includes(raw.icon as PocketIconKey)
      ? (raw.icon as PocketIconKey)
      : 'shield',
    isPrimary: raw.isPrimary === true,
    createdAt: readTimestamp(raw.createdAt, now),
  }));

  if (pockets.length === 0) {
    pockets.push(...createEmptyState().pockets);
  }
  const primary = pockets.find((p) => p.isPrimary) ?? pockets[0];
  primary.isPrimary = true;
  const pocketIds = new Set(pockets.map((p) => p.id));

  const transactions: Transaction[] = candidate.transactions
    .filter(isRecord)
    .map((raw, index) => {
      const type = TRANSACTION_TYPES.includes(raw.type as TransactionType)
        ? (raw.type as TransactionType)
        : 'expense';
      const validPocketId =
        typeof raw.pocketId === 'string' && pocketIds.has(raw.pocketId)
          ? raw.pocketId
          : undefined;

      const tx: Transaction = {
        id: readId(raw.id, 'tx', usedIds, index + 1000),
        type,
        amount: Math.max(0, readNumber(raw.amount)),
        category: readString(
          raw.category,
          type === 'income'
            ? 'Salario'
            : type === 'transfer'
            ? 'Aporte a Meta'
            : 'Otros Gastos'
        ).slice(0, 80),
        date: readDate(raw.date, today),
        note: readString(raw.note).slice(0, 200),
        createdAt: readTimestamp(raw.createdAt, now),
      };

      if (type === 'income') {
        const retained = Math.max(0, readNumber(raw.retainedAmount));
        if (retained > 0) {
          tx.retainedAmount = retained;
          tx.retentionPercent = Math.max(
            0,
            Math.min(100, readNumber(raw.retentionPercent))
          );
          tx.pocketId = validPocketId ?? primary?.id;
        }
      } else if (type === 'expense') {
        const roundUp = Math.max(0, readNumber(raw.roundUpAmount));
        if (roundUp > 0) {
          tx.roundUpAmount = roundUp;
          const step = readNumber(raw.roundUpStep, 5000);
          tx.roundUpStep = ROUND_UP_STEPS.includes(step) ? step : 5000;
          tx.pocketId = validPocketId ?? primary?.id;
        }
        tx.bucket = EXPENSE_BUCKETS.includes(raw.bucket as ExpenseBucket)
          ? (raw.bucket as ExpenseBucket)
          : getDefaultBucketForCategory(tx.category);
        if (typeof raw.fixedExpenseId === 'string') {
          tx.fixedExpenseId = raw.fixedExpenseId;
        }
      } else if (validPocketId) {
        tx.pocketId = validPocketId;
      }

      return tx;
    });

  const rawFixed = Array.isArray(candidate.fixedExpenses)
    ? candidate.fixedExpenses
    : [];
  const fixedExpenses: FixedExpense[] = rawFixed.filter(isRecord).map((raw, index) => ({
    id: readId(raw.id, 'fe', usedIds, index + 2000),
    name: readString(raw.name, `Gasto fijo ${index + 1}`).slice(0, 80),
    amount: Math.max(0, readNumber(raw.amount)),
    category: readString(raw.category, 'Vivienda').slice(0, 80),
    dayOfMonth: Math.max(1, Math.min(31, Math.round(readNumber(raw.dayOfMonth, 1)))),
    bucket: EXPENSE_BUCKETS.includes(raw.bucket as ExpenseBucket)
      ? (raw.bucket as ExpenseBucket)
      : 'needs',
    active: raw.active !== false,
    note: readString(raw.note).slice(0, 200),
    createdAt: readTimestamp(raw.createdAt, now),
  }));

  const rawSettings = isRecord(candidate.settings) ? candidate.settings : {};
  const roundUpStep = readNumber(rawSettings.roundUpStep, 5000);
  const settings: AppSettings = {
    defaultRetentionEnabled: rawSettings.defaultRetentionEnabled !== false,
    defaultRetentionPercent: Math.max(
      0,
      Math.min(100, readNumber(rawSettings.defaultRetentionPercent, 15))
    ),
    defaultRoundUpEnabled: rawSettings.defaultRoundUpEnabled !== false,
    roundUpStep: ROUND_UP_STEPS.includes(roundUpStep) ? roundUpStep : 5000,
    hideTotalSavings: rawSettings.hideTotalSavings !== false,
  };

  return { transactions, pockets, fixedExpenses, settings };
}

function loadInitialState(): FinanceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedState();
    }
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    if (normalized) {
      return normalized;
    }
    return createSeedState();
  } catch {
    return createSeedState();
  }
}

function buildDateForMonth(monthKey: string, dayOfMonth: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return getTodayISO();
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.max(1, Math.min(daysInMonth, dayOfMonth));
  return `${yearStr}-${monthStr}-${String(safeDay).padStart(2, '0')}`;
}

export function useFinanceStore(remote: SubaccountSession | null = null) {
  const [state, setState] = useState<FinanceState>(() =>
    remote ? createEmptyState() : loadInitialState()
  );
  const remoteLoaded = useRef(false);

  useEffect(() => {
    if (!remote) return;
    remoteLoaded.current = false;
    fetchSubFinance(remote)
      .then((data) => {
        setState(normalizeState(data) ?? createEmptyState());
        remoteLoaded.current = true;
      })
      .catch(() => {
        remoteLoaded.current = true;
      });
  }, [remote]);

  useEffect(() => {
    if (!remote) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage quota errors silently
      }
      return;
    }
    if (!remoteLoaded.current) return;
    saveSubFinance(remote, state).catch(() => {
      // La siguiente edición volverá a intentarlo.
    });
  }, [state, remote]);

  const addTransaction = useCallback(
    (input: Omit<Transaction, 'id' | 'createdAt'>) => {
      const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newTx: Transaction = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      return newTx;
    },
    []
  );

  const updateTransaction = useCallback((updated: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.id === updated.id ? updated : tx
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    }));
  }, []);

  const addFixedExpense = useCallback(
    (input: Omit<FixedExpense, 'id' | 'createdAt'>): FixedExpense => {
      const id = `fe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const created: FixedExpense = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        fixedExpenses: [...prev.fixedExpenses, created],
      }));
      return created;
    },
    []
  );

  const updateFixedExpense = useCallback((updated: FixedExpense) => {
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((fe) =>
        fe.id === updated.id ? updated : fe
      ),
    }));
  }, []);

  const deleteFixedExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((fe) => fe.id !== id),
    }));
  }, []);

  const applyFixedExpensesToMonth = useCallback(
    (items: FixedExpense[], monthKey: string) => {
      if (items.length === 0) return;
      const nowIso = new Date().toISOString();
      setState((prev) => {
        const alreadyApplied = new Set(
          prev.transactions
            .filter(
              (tx) =>
                tx.type === 'expense' &&
                tx.fixedExpenseId &&
                tx.date.slice(0, 7) === monthKey
            )
            .map((tx) => tx.fixedExpenseId as string)
        );

        const newTxs: Transaction[] = [];
        for (const fe of items) {
          if (alreadyApplied.has(fe.id)) continue;
          newTxs.push({
            id: `tx-fe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'expense',
            amount: fe.amount,
            category: fe.category,
            date: buildDateForMonth(monthKey, fe.dayOfMonth),
            note: fe.note ? `${fe.name} · ${fe.note}` : fe.name,
            bucket: fe.bucket,
            fixedExpenseId: fe.id,
            createdAt: nowIso,
          });
        }

        if (newTxs.length === 0) return prev;
        return {
          ...prev,
          transactions: [...newTxs, ...prev.transactions],
        };
      });
    },
    []
  );

  const addPocket = useCallback(
    (input: {
      name: string;
      targetAmount: number;
      deadline: string;
      icon: PocketIconKey;
      isPrimary: boolean;
    }) => {
      const id = `pocket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newPocket: SavingsPocket = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const shouldBePrimary = input.isPrimary || prev.pockets.length === 0;
        const normalizedPockets = shouldBePrimary
          ? prev.pockets.map((p) => ({ ...p, isPrimary: false }))
          : prev.pockets;

        return {
          ...prev,
          pockets: [
            ...normalizedPockets,
            { ...newPocket, isPrimary: shouldBePrimary },
          ],
        };
      });
    },
    []
  );

  const updatePocket = useCallback((updated: SavingsPocket) => {
    setState((prev) => {
      const nextPockets = prev.pockets.map((p) => {
        if (p.id === updated.id) return updated;
        if (updated.isPrimary) return { ...p, isPrimary: false };
        return p;
      });
      if (!nextPockets.some((p) => p.isPrimary) && nextPockets.length > 0) {
        // Never silently turn the pocket the user just unchecked back into primary.
        const otherIndex = nextPockets.findIndex((p) => p.id !== updated.id);
        const fallbackIndex = otherIndex >= 0 ? otherIndex : 0;
        nextPockets[fallbackIndex] = {
          ...nextPockets[fallbackIndex],
          isPrimary: true,
        };
      }
      return {
        ...prev,
        pockets: nextPockets,
      };
    });
  }, []);

  const deletePocket = useCallback(
    (id: string): boolean => {
      // Decide from the current state instead of the setState updater: updaters
      // run during render, so a flag set inside one is not readable here.
      if (state.pockets.length <= 1 || !state.pockets.some((p) => p.id === id)) {
        return false;
      }
      setState((prev) => {
        if (prev.pockets.length <= 1) {
          return prev;
        }
        const remaining = prev.pockets.filter((p) => p.id !== id);
        if (!remaining.some((p) => p.isPrimary)) {
          remaining[0] = { ...remaining[0], isPrimary: true };
        }
        const fallbackPrimary = remaining.find((p) => p.isPrimary) ?? remaining[0];
        const reassignedTransactions = prev.transactions.map((tx) =>
          tx.pocketId === id ? { ...tx, pocketId: fallbackPrimary.id } : tx
        );
        return {
          ...prev,
          pockets: remaining,
          transactions: reassignedTransactions,
        };
      });
      return true;
    },
    [state.pockets]
  );

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...partial,
      },
    }));
  }, []);

  const resetToZero = useCallback(() => {
    setState(createEmptyState());
  }, []);

  const loadDemoData = useCallback(() => {
    setState(createSeedState());
  }, []);

  const exportBackupJson = useCallback(() => {
    const payload = {
      app: 'FinanzaPro',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanzapro-respaldo-${getTodayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Give the browser time to start the download before releasing the URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [state]);

  const importBackupJson = useCallback(
    (jsonText: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonText) as Record<string, unknown>;
        const rawCandidate =
          parsed && typeof parsed === 'object' && 'data' in parsed
            ? parsed.data
            : parsed;

        const candidate = normalizeState(rawCandidate);
        if (!candidate) {
          return {
            ok: false,
            message:
              'El archivo JSON no tiene una estructura válida de FinanzaPro.',
          };
        }

        if (candidate.pockets.length === 0) {
          candidate.pockets = createEmptyState().pockets;
        }
        if (!candidate.pockets.some((p) => p.isPrimary)) {
          candidate.pockets[0] = { ...candidate.pockets[0], isPrimary: true };
        }

        setState(candidate);
        return {
          ok: true,
          message: `Copia restaurada: ${candidate.transactions.length} movimientos, ${candidate.fixedExpenses.length} gastos fijos y ${candidate.pockets.length} bolsillos cargados.`,
        };
      } catch {
        return {
          ok: false,
          message: 'No se pudo leer el archivo. Verifica que sea un JSON válido.',
        };
      }
    },
    []
  );

  return {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    applyFixedExpensesToMonth,
    addPocket,
    updatePocket,
    deletePocket,
    updateSettings,
    resetToZero,
    loadDemoData,
    exportBackupJson,
    importBackupJson,
  };
}
