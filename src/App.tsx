import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, RotateCcw } from 'lucide-react';
import { BackupSettingsView } from './components/BackupSettingsView';
import { ChartsSection } from './components/ChartsSection';
import { FixedExpenseModal } from './components/FixedExpenseModal';
import { FixedExpensesView } from './components/FixedExpensesView';
import { KpiStrip } from './components/KpiStrip';
import { MotivationSection } from './components/MotivationSection';
import { PocketModal } from './components/PocketModal';
import { Rule503020Card } from './components/Rule503020Card';
import { SavingsPocketsSection } from './components/SavingsPocketsSection';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsTable } from './components/TransactionsTable';
import { useFinanceStore } from './hooks/useFinanceStore';
import {
  CUENTA_MAESTRA_URL,
  initSubaccount,
  type SubaccountSession,
} from './subaccount';
import {
  ActiveSection,
  FixedExpense,
  PocketIconKey,
  SavingsPocket,
  Transaction,
  TransactionType,
} from './types/finance';
import {
  calculateCategoryBreakdown,
  calculateFinancialSummary,
  calculateMonthlyMetrics,
  calculatePocketsWithBalances,
  calculateRule503020,
} from './utils/financeEngine';
import { formatMonthLong, getCurrentMonthKey } from './utils/formatters';

const SECTION_TITLES: Record<ActiveSection, string> = {
  overview: 'Resumen General',
  transactions: 'Historial de Movimientos',
  fixed: 'Gastos Fijos Mensuales',
  pockets: 'Bolsillos y Metas de Ahorro',
  motivation: 'Motivación Financiera',
  backup: 'Respaldo y Ajustes',
};

export default function App() {
  const [session, setSession] = useState<SubaccountSession | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'ready' | 'gate'>(
    'loading'
  );

  useEffect(() => {
    initSubaccount()
      .then((linked) => {
        if (linked) {
          setSession(linked);
          setAuthStatus('ready');
        } else {
          setAuthStatus('gate');
        }
      })
      .catch(() => setAuthStatus('gate'));
  }, []);

  const {
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
  } = useFinanceStore(session);

  const currentMonth = getCurrentMonthKey();
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Transaction Modal state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('expense');
  const [txInitialPocketId, setTxInitialPocketId] = useState<string | undefined>(
    undefined
  );

  // Pocket Modal state
  const [pocketModalOpen, setPocketModalOpen] = useState(false);
  const [editingPocket, setEditingPocket] = useState<SavingsPocket | null>(null);

  // Fixed Expense Modal state
  const [fixedModalOpen, setFixedModalOpen] = useState(false);
  const [editingFixedExpense, setEditingFixedExpense] =
    useState<FixedExpense | null>(null);

  // Quick Reset Confirm state
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const set = new Set<string>([currentMonth]);
    state.transactions.forEach((tx) => set.add(tx.date.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [state.transactions, currentMonth]);

  const summaryMonth =
    selectedMonth === 'all' ? currentMonth : selectedMonth;

  const summary = useMemo(
    () => calculateFinancialSummary(state.transactions, selectedMonth),
    [state.transactions, selectedMonth]
  );

  const pocketsWithBalances = useMemo(
    () => calculatePocketsWithBalances(state.pockets, state.transactions),
    [state.pockets, state.transactions]
  );

  const monthlyMetrics = useMemo(
    () => calculateMonthlyMetrics(state.transactions, summaryMonth, 6),
    [state.transactions, summaryMonth]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(state.transactions, selectedMonth),
    [state.transactions, selectedMonth]
  );

  const rule503020 = useMemo(
    () => calculateRule503020(state.transactions, selectedMonth),
    [state.transactions, selectedMonth]
  );

  const openNewTransaction = (
    type: TransactionType = 'expense',
    pocketId?: string
  ) => {
    setEditingTx(null);
    setTxInitialType(type);
    setTxInitialPocketId(pocketId);
    setTxModalOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxInitialType(tx.type);
    setTxInitialPocketId(tx.pocketId);
    setTxModalOpen(true);
  };

  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string,
    fixedTemplate?: Omit<FixedExpense, 'id' | 'createdAt'>
  ) => {
    if (existingId && editingTx) {
      updateTransaction({
        ...editingTx,
        ...data,
      });
    } else if (fixedTemplate) {
      const createdFixed = addFixedExpense(fixedTemplate);
      addTransaction({
        ...data,
        fixedExpenseId: createdFixed.id,
      });
    } else {
      addTransaction(data);
    }
  };

  const openNewFixedExpense = () => {
    setEditingFixedExpense(null);
    setFixedModalOpen(true);
  };

  const openEditFixedExpense = (fe: FixedExpense) => {
    setEditingFixedExpense(fe);
    setFixedModalOpen(true);
  };

  const handleSaveFixedExpense = (
    data: Omit<FixedExpense, 'id' | 'createdAt'>,
    existing: FixedExpense | null
  ) => {
    if (existing) {
      updateFixedExpense({
        ...existing,
        ...data,
      });
    } else {
      addFixedExpense(data);
    }
  };

  const handleToggleFixedExpenseActive = (fe: FixedExpense) => {
    updateFixedExpense({
      ...fe,
      active: !fe.active,
    });
  };

  const openNewPocket = () => {
    setEditingPocket(null);
    setPocketModalOpen(true);
  };

  const openEditPocket = (pocket: SavingsPocket) => {
    setEditingPocket(pocket);
    setPocketModalOpen(true);
  };

  const handleSavePocket = (
    data: {
      name: string;
      targetAmount: number;
      deadline: string;
      icon: PocketIconKey;
      isPrimary: boolean;
    },
    existingPocket: SavingsPocket | null
  ) => {
    if (existingPocket) {
      updatePocket({
        ...existingPocket,
        ...data,
      });
    } else {
      addPocket(data);
    }
  };

  const hideTotalSavings = state.settings.hideTotalSavings ?? true;
  const toggleHideTotalSavings = () => {
    updateSettings({ hideTotalSavings: !hideTotalSavings });
  };

  if (authStatus === 'loading') {
    return <div className="app center muted">Conectando con tu subcuenta…</div>;
  }
  if (authStatus === 'gate') {
    return <AccessGate />;
  }

  return (
    <div className="relative min-h-screen bg-[#140b06] text-stone-100 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Ambient animated aurora */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="aurora-blob absolute -top-44 left-[12%] w-[560px] h-[560px] rounded-full bg-orange-500/20 blur-[130px]" />
        <div className="aurora-blob slow absolute top-1/4 -right-40 w-[520px] h-[520px] rounded-full bg-red-500/20 blur-[130px]" />
        <div className="aurora-blob fast absolute -bottom-48 left-1/4 w-[540px] h-[540px] rounded-full bg-amber-400/15 blur-[140px]" />
        <div className="aurora-blob slow absolute bottom-10 -left-40 w-[380px] h-[380px] rounded-full bg-yellow-400/10 blur-[120px]" />
      </div>

      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        patrimonioTotal={summary.patrimonioTotal}
        saldoDisponibleReal={summary.saldoDisponibleReal}
        totalAhorrado={summary.totalAhorrado}
        hideTotalSavings={hideTotalSavings}
        onToggleHideTotalSavings={toggleHideTotalSavings}
        onOpenNewTransaction={() => openNewTransaction('expense')}
        mobileOpen={mobileMenuOpen}
        onToggleMobile={setMobileMenuOpen}
      />

      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#140b06]/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-orange-200/70">FinanzaPro</span>
            <span className="text-orange-400/50" aria-hidden="true">
              /
            </span>
            <h1 className="font-display font-semibold neon-gradient">
              {SECTION_TITLES[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Seleccionar período"
              className="px-3.5 py-2 rounded-xl surface-sub text-xs font-medium text-stone-200 focus:outline-none focus:border-orange-400"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLong(m)}
                </option>
              ))}
              <option value="all">Todo el histórico</option>
            </select>

            <button
              type="button"
              onClick={() => openNewTransaction('expense')}
              className="cta-vivid hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Movimiento</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto space-y-6">
          {activeSection === 'overview' && (
            <>
              <KpiStrip
                summary={summary}
                selectedMonth={selectedMonth}
                onOpenTransfer={() => openNewTransaction('transfer')}
                hideTotalSavings={hideTotalSavings}
                onToggleHideTotalSavings={toggleHideTotalSavings}
              />

              <FixedExpensesView
                fixedExpenses={state.fixedExpenses}
                transactions={state.transactions}
                targetMonth={summaryMonth}
                currentAvailableBalance={summary.saldoDisponibleReal}
                onCreateFixedExpense={openNewFixedExpense}
                onEditFixedExpense={openEditFixedExpense}
                onToggleActive={handleToggleFixedExpenseActive}
                onDeleteFixedExpense={deleteFixedExpense}
                onApplyFixedExpenses={applyFixedExpensesToMonth}
                compact
                onViewAll={() => setActiveSection('fixed')}
              />

              <ChartsSection
                monthlyMetrics={monthlyMetrics}
                categoryBreakdown={categoryBreakdown}
                selectedMonth={selectedMonth}
                onQuickAddExpense={() => openNewTransaction('expense')}
              />

              <Rule503020Card
                rule={rule503020}
                selectedMonth={selectedMonth}
              />

              <SavingsPocketsSection
                pockets={pocketsWithBalances}
                onCreatePocket={openNewPocket}
                onEditPocket={openEditPocket}
                onDeletePocket={deletePocket}
                onDepositToPocket={(pocketId) =>
                  openNewTransaction('transfer', pocketId)
                }
                compact
                onViewAll={() => setActiveSection('pockets')}
              />

              <TransactionsTable
                transactions={state.transactions}
                pockets={state.pockets}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                onEditTransaction={openEditTransaction}
                onDeleteTransaction={deleteTransaction}
                onOpenNewTransaction={() => openNewTransaction('expense')}
                limit={6}
                onViewAll={() => setActiveSection('transactions')}
                defaultExpanded={false}
              />
            </>
          )}

          {activeSection === 'transactions' && (
            <TransactionsTable
              transactions={state.transactions}
              pockets={state.pockets}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onEditTransaction={openEditTransaction}
              onDeleteTransaction={deleteTransaction}
              onOpenNewTransaction={() => openNewTransaction('expense')}
            />
          )}

          {activeSection === 'fixed' && (
            <FixedExpensesView
              fixedExpenses={state.fixedExpenses}
              transactions={state.transactions}
              targetMonth={summaryMonth}
              currentAvailableBalance={summary.saldoDisponibleReal}
              onCreateFixedExpense={openNewFixedExpense}
              onEditFixedExpense={openEditFixedExpense}
              onToggleActive={handleToggleFixedExpenseActive}
              onDeleteFixedExpense={deleteFixedExpense}
              onApplyFixedExpenses={applyFixedExpensesToMonth}
            />
          )}

          {activeSection === 'pockets' && (
            <div className="space-y-6">
              <SavingsPocketsSection
                pockets={pocketsWithBalances}
                onCreatePocket={openNewPocket}
                onEditPocket={openEditPocket}
                onDeletePocket={deletePocket}
                onDepositToPocket={(pocketId) =>
                  openNewTransaction('transfer', pocketId)
                }
              />
            </div>
          )}

          {activeSection === 'motivation' && (
            <MotivationSection
              summary={summary}
              rule={rule503020}
              fixedExpenseCount={state.fixedExpenses.length}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'backup' && (
            <BackupSettingsView
              settings={state.settings}
              transactionCount={state.transactions.length}
              pocketCount={state.pockets.length}
              onUpdateSettings={updateSettings}
              onExportJson={exportBackupJson}
              onImportJson={importBackupJson}
              onResetToZero={resetToZero}
              onLoadDemoData={loadDemoData}
            />
          )}
        </main>

        {/* Quiet Utility Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400 max-w-[1400px] w-full mx-auto">
          <span>
            FinanzaPro · Persistencia local automática en este navegador
          </span>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={exportBackupJson}
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('backup')}
              className="text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              Importar respaldo
            </button>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar datos a cero</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        pockets={state.pockets}
        settings={state.settings}
        currentAvailableBalance={summary.saldoDisponibleReal}
        editingTransaction={editingTx}
        initialType={txInitialType}
        initialPocketId={txInitialPocketId}
        onSave={handleSaveTransaction}
      />

      <PocketModal
        isOpen={pocketModalOpen}
        onClose={() => setPocketModalOpen(false)}
        editingPocket={editingPocket}
        onSave={handleSavePocket}
      />

      <FixedExpenseModal
        isOpen={fixedModalOpen}
        onClose={() => setFixedModalOpen(false)}
        editingFixedExpense={editingFixedExpense}
        onSave={handleSaveFixedExpense}
      />

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <div className="w-full max-w-sm rounded-2xl surface-card p-6 space-y-4 shadow-2xl">
            <h2
              id="reset-dialog-title"
              className="text-base font-semibold text-stone-100"
            >
              Reiniciar datos a cero
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              Esta acción eliminará todos los movimientos de ejemplo o registrados
              y dejará un único bolsillo limpio en $0 para que comiences desde cero.
            </p>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#4a2e1b] text-xs font-medium text-stone-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToZero();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#ef4444] hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
              >
                Confirmar reinicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccessGate() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#140b06]">
      <div className="surface-card animate-pop max-w-md w-full p-8 space-y-4 text-center">
        <div className="brand-mark mx-auto">CM</div>
        <h1 className="neon-gradient text-xl font-semibold">
          Acceso por subcuenta
        </h1>
        <p className="text-xs text-stone-300 leading-relaxed">
          FinanzaPro solo se abre con una subcuenta emitida por Cuenta Maestra.
          Tus datos quedan vinculados al dispositivo donde se instala y no se
          pueden compartir.
        </p>
        <a
          href={`${CUENTA_MAESTRA_URL}/?mode=sub`}
          className="cta-vivid inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-semibold"
        >
          Ir a Cuenta Maestra
        </a>
        <p className="text-[11px] text-stone-400">
          Si ya tienes una subcuenta, ábrela desde el panel de Cuenta Maestra con
          el botón «Abrir FinanzaPro con esta subcuenta».
        </p>
      </div>
    </div>
  );
}
