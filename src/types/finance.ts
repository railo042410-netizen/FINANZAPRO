export type TransactionType = 'income' | 'expense' | 'transfer';

export type ExpenseBucket = 'needs' | 'wants';

export type PocketIconKey =
  | 'shield'
  | 'plane'
  | 'trending'
  | 'home'
  | 'laptop'
  | 'heart'
  | 'graduation'
  | 'car';

export interface SavingsPocket {
  id: string;
  name: string;
  targetAmount: number;
  deadline: string; // YYYY-MM-DD
  icon: PocketIconKey;
  isPrimary: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Base gross income, base expense, or transfer amount
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  // Optional automatic retention on 'income'
  retentionPercent?: number;
  retainedAmount?: number;
  // Optional micro-savings round-up on 'expense'
  roundUpAmount?: number;
  // Multiple used for the round-up, kept so later edits don't recalculate it differently
  roundUpStep?: number;
  // Destination pocket for retention, round-up, or transfer
  pocketId?: string;
  // Explicit 50/30/20 classification for 'expense'
  bucket?: ExpenseBucket;
  // Link to recurring FixedExpense template if generated from one
  fixedExpenseId?: string;
  createdAt: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number; // 1 - 31
  bucket: ExpenseBucket;
  active: boolean;
  note: string;
  createdAt: string;
}

export interface AppSettings {
  defaultRetentionEnabled: boolean;
  defaultRetentionPercent: number; // e.g. 15
  defaultRoundUpEnabled: boolean;
  roundUpStep: number; // e.g. 1000, 5000, 10000
  hideTotalSavings?: boolean;
}

export interface FinanceState {
  transactions: Transaction[];
  pockets: SavingsPocket[];
  fixedExpenses: FixedExpense[];
  settings: AppSettings;
}

export interface PocketWithBalance extends SavingsPocket {
  currentAmount: number;
  progressPercent: number;
  remainingAmount: number;
  monthlyRequired: number;
  biweeklyRequired: number;
  monthsRemaining: number;
  isCompleted: boolean;
  isOverdue: boolean;
}

export interface FinancialSummary {
  patrimonioTotal: number;
  saldoDisponibleReal: number;
  totalAhorrado: number;
  totalIngresos: number;
  totalGastos: number;
  monthIngresos: number;
  monthGastos: number;
  monthAhorrado: number;
  isAffectingSavings: boolean;
  savingsDeficit: number;
}

export interface MonthlyMetric {
  monthKey: string; // YYYY-MM
  label: string; // e.g., "Jul", "Ago"
  ingresos: number;
  gastos: number;
  ahorro: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  bucket: ExpenseBucket;
}

export interface Rule503020Summary {
  referenceIncome: number;
  needsAmount: number;
  needsPercent: number;
  wantsAmount: number;
  wantsPercent: number;
  savingsAmount: number;
  savingsPercent: number;
}

export type ActiveSection =
  | 'overview'
  | 'transactions'
  | 'fixed'
  | 'pockets'
  | 'motivation'
  | 'backup';

export interface CategoryMeta {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  defaultBucket?: ExpenseBucket;
  color: string;
}
