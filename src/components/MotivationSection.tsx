import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clipboard,
  Lightbulb,
  PiggyBank,
  Quote,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {
  ActiveSection,
  FinancialSummary,
  Rule503020Summary,
} from '../types/finance';
import { formatCurrency, getTodayISO } from '../utils/formatters';

interface MotivationSectionProps {
  summary: FinancialSummary;
  rule: Rule503020Summary;
  fixedExpenseCount: number;
  onNavigate: (section: ActiveSection) => void;
}

type TipCategory = 'ahorro' | 'gastos' | 'deudas' | 'inversion' | 'habitos' | 'metas';

interface QuoteItem {
  text: string;
  author: string;
}

interface TipItem {
  id: string;
  category: TipCategory;
  title: string;
  body: string;
  action?: { label: string; section: ActiveSection };
}

interface ContextTip {
  title: string;
  body: string;
  tone: 'good' | 'warn' | 'info';
  icon: LucideIcon;
  action: { label: string; section: ActiveSection };
}

const QUOTES: QuoteItem[] = [
  {
    text: 'La libertad financiera no empieza con un sueldo mayor, sino con un hábito menor repetido cada día.',
    author: 'Consejo FinanzaPro',
  },
  {
    text: 'Un presupuesto no es una jaula: es el mapa que te permite decidir adónde va tu dinero.',
    author: 'Sabiduría financiera',
  },
  {
    text: 'Paga primero a tu yo futuro. Lo que apartas hoy se convierte en tranquilidad mañana.',
    author: 'Principio del ahorro consciente',
  },
  {
    text: 'Si no sabes adónde se va tu dinero, no puedes decidir adónde debe ir.',
    author: 'Consejo FinanzaPro',
  },
  {
    text: 'La mejor inversión es aquella que entiendes, puedes sostener y no necesitas vender con miedo.',
    author: 'Consejo FinanzaPro',
  },
  {
    text: 'Gasta menos de lo que ganas: la diferencia, repetida en el tiempo, se convierte en libertad.',
    author: 'Paráfrasis de Warren Buffett',
  },
  {
    text: 'Cada peso que ahorras es una decisión que tomas hoy en lugar de una preocupación de mañana.',
    author: 'Consejo FinanzaPro',
  },
  {
    text: 'Las metas grandes se alcanzan con aportes pequeños que nadie ve, menos tú.',
    author: 'Consejo FinanzaPro',
  },
];

const CATEGORY_META: Record<
  TipCategory,
  { label: string; icon: LucideIcon; accent: string; text: string }
> = {
  ahorro: {
    label: 'Ahorro',
    icon: PiggyBank,
    accent: 'from-yellow-300 to-amber-400',
    text: 'text-yellow-300',
  },
  gastos: {
    label: 'Gastos',
    icon: Wallet,
    accent: 'from-orange-300 to-red-400',
    text: 'text-orange-300',
  },
  deudas: {
    label: 'Deudas',
    icon: ShieldCheck,
    accent: 'from-red-300 to-orange-400',
    text: 'text-red-300',
  },
  inversion: {
    label: 'Inversión',
    icon: TrendingUp,
    accent: 'from-amber-300 to-red-400',
    text: 'text-amber-300',
  },
  habitos: {
    label: 'Hábitos',
    icon: Sparkles,
    accent: 'from-orange-400 to-red-500',
    text: 'text-orange-300',
  },
  metas: {
    label: 'Metas',
    icon: Target,
    accent: 'from-red-400 to-red-500',
    text: 'text-red-300',
  },
};

const TIPS: TipItem[] = [
  {
    id: 'tip-ahorro-1',
    category: 'ahorro',
    title: 'Aparta el ahorro antes de gastar',
    body: 'Cuando recibas tus ingresos, separa automáticamente un porcentaje. Lo que queda es lo que realmente puedes usar.',
    action: { label: 'Ver mis bolsillos', section: 'pockets' },
  },
  {
    id: 'tip-ahorro-2',
    category: 'ahorro',
    title: 'El vuelto también cuenta',
    body: 'Redondear cada gasto al siguiente múltiplo reúne pequeños ahorros que, sin darte cuenta, suman una meta.',
    action: { label: 'Registrar un gasto', section: 'transactions' },
  },
  {
    id: 'tip-gastos-1',
    category: 'gastos',
    title: 'Separa necesidades de deseos',
    body: 'Antes de pagar, pregúntate si es una necesidad (50%), un deseo (30%) o un aporte a tu futuro (20%).',
    action: { label: 'Ver mi equilibrio', section: 'overview' },
  },
  {
    id: 'tip-gastos-2',
    category: 'gastos',
    title: 'Revisa tus gastos fijos cada trimestre',
    body: 'Suscripciones y servicios olvidados suelen ser la fuga más silenciosa de tu presupuesto mensual.',
    action: { label: 'Revisar gastos fijos', section: 'fixed' },
  },
  {
    id: 'tip-deudas-1',
    category: 'deudas',
    title: 'Paga primero la deuda más costosa',
    body: 'Ordenar tus deudas por tasa de interés te permite liberar dinero más rápido con el mismo esfuerzo.',
  },
  {
    id: 'tip-deudas-2',
    category: 'deudas',
    title: 'Nueva deuda, nueva cuota',
    body: 'Antes de adquirir una obligación, comprueba que la cuota quepa dentro de tu saldo disponible real.',
    action: { label: 'Ver mi saldo', section: 'overview' },
  },
  {
    id: 'tip-inversion-1',
    category: 'inversion',
    title: 'Diversifica antes de buscar rentabilidad',
    body: 'Repartir tus aportes entre varias metas reduce el riesgo de que un solo objetivo frene tu progreso.',
    action: { label: 'Ver mis metas', section: 'pockets' },
  },
  {
    id: 'tip-inversion-2',
    category: 'inversion',
    title: 'El tiempo hace el trabajo pesado',
    body: 'Aportes constantes y prolongados suelen ser más poderosos que intentar adivinar el momento perfecto.',
    action: { label: 'Planificar aportes', section: 'pockets' },
  },
  {
    id: 'tip-habitos-1',
    category: 'habitos',
    title: 'Registra cada movimiento el mismo día',
    body: 'Un historial honesto es la base de cualquier decisión financiera. Anotar es el primer acto de control.',
    action: { label: 'Registrar movimiento', section: 'transactions' },
  },
  {
    id: 'tip-habitos-2',
    category: 'habitos',
    title: 'Date una pausa de 24 horas',
    body: 'Antes de una compra impulsiva, espera un día. La mayoría de los deseos desaparecen con el tiempo.',
  },
  {
    id: 'tip-metas-1',
    category: 'metas',
    title: 'Ponle fecha y monto a cada meta',
    body: 'Una meta concreta convierte el ahorro en un plan: calcula la cuota mensual y empieza desde hoy.',
    action: { label: 'Crear una meta', section: 'pockets' },
  },
  {
    id: 'tip-metas-2',
    category: 'metas',
    title: 'Celebra cada avance',
    body: 'Reconocer cada aporte, por pequeño que sea, mantiene viva la motivación para continuar.',
    action: { label: 'Ver mi progreso', section: 'pockets' },
  },
];

const HABITS = [
  { id: 'registro', text: 'Registrar todos mis movimientos del día' },
  { id: 'saldo', text: 'Revisar mi saldo disponible antes de comprar' },
  { id: 'ahorro', text: 'Aportar a una meta de ahorro' },
  { id: 'pausa', text: 'Pausar 24 horas una compra impulsiva' },
];

const HABITS_STORAGE_KEY = 'finanzapro_habits_v1';

function loadDoneHabits(): string[] {
  try {
    const raw = window.localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date?: string; done?: unknown };
    if (parsed?.date !== getTodayISO() || !Array.isArray(parsed.done)) return [];
    return parsed.done.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function MotivationSection({
  summary,
  rule,
  fixedExpenseCount,
  onNavigate,
}: MotivationSectionProps) {
  const [quoteIndex, setQuoteIndex] = useState(
    () => new Date().getDate() % QUOTES.length
  );
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState<TipCategory | 'all'>('all');
  const [doneHabits, setDoneHabits] = useState<string[]>(loadDoneHabits);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify({ date: getTodayISO(), done: doneHabits })
      );
    } catch {
      // Storage may be unavailable; the checklist still works for this session.
    }
  }, [doneHabits]);

  const quote = QUOTES[quoteIndex];
  const filteredTips = useMemo(
    () =>
      category === 'all'
        ? TIPS
        : TIPS.filter((tip) => tip.category === category),
    [category]
  );
  const habitsProgress = Math.round((doneHabits.length / HABITS.length) * 100);

  const contextualTip = useMemo((): ContextTip => {
    if (summary.isAffectingSavings) {
      return {
        title: 'Hoy: vuelve a poner tu saldo en cero',
        body: `Tus gastos superan el disponible por ${formatCurrency(
          summary.savingsDeficit
        )}. Revisa los últimos movimientos y decide qué ajustar antes de seguir ahorrando.`,
        tone: 'warn',
        icon: ShieldCheck,
        action: { label: 'Revisar movimientos', section: 'transactions' },
      };
    }
    if (rule.referenceIncome > 0 && rule.savingsPercent < 20) {
      return {
        title: 'Hoy: sube un poco tu ahorro',
        body: `Estás ahorrando ${rule.savingsPercent}% de tus ingresos; la meta es 20%. Un aporte de ${formatCurrency(
          Math.max(1, rule.referenceIncome * 0.2 - rule.savingsAmount)
        )} te acercaría al equilibrio.`,
        tone: 'info',
        icon: PiggyBank,
        action: { label: 'Aportar a una meta', section: 'pockets' },
      };
    }
    if (fixedExpenseCount === 0) {
      return {
        title: 'Hoy: haz visible lo que se repite',
        body: 'Registrar tus gastos fijos te permite anticiparte a ellos cada mes en lugar de descubrirlos al final.',
        tone: 'info',
        icon: Wallet,
        action: { label: 'Crear gasto fijo', section: 'fixed' },
      };
    }
    return {
      title: 'Hoy: vas por buen camino',
      body: `Tu saldo disponible es ${formatCurrency(
        summary.saldoDisponibleReal
      )} y tus metas siguen protegidas. Mantén el hábito: constancia es mejor que intensidad.`,
      tone: 'good',
      icon: Sparkles,
      action: { label: 'Ver mi resumen', section: 'overview' },
    };
  }, [summary, rule, fixedExpenseCount]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`«${quote.text}» — ${quote.author}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const toggleHabit = (id: string) => {
    setDoneHabits((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const ContextIcon = contextualTip.icon;
  const toneStyles = {
    good: 'border-yellow-300/50 bg-yellow-400/10 text-yellow-200',
    warn: 'border-red-300/50 bg-red-400/10 text-red-100',
    info: 'border-amber-300/50 bg-amber-400/10 text-amber-100',
  }[contextualTip.tone];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold neon-gradient">
          Motivación Financiera
        </h2>
        <p className="text-xs text-stone-400">
          Pequeñas ideas que, repetidas, cambian tu relación con el dinero.
        </p>
      </div>

      {/* Quote of the day */}
      <div className="animate-pop relative overflow-hidden rounded-2xl surface-card lift border-orange-400/40 px-6 py-7 sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-gradient-to-br from-orange-500/25 via-red-500/20 to-amber-400/20 blur-3xl"
        />
        <div className="relative space-y-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200/70">
            <Sparkles className="w-3.5 h-3.5 neon-dot" />
            Frase para hoy
          </div>
          <div key={quoteIndex} className="animate-pop space-y-3">
            <Quote className="w-9 h-9 text-orange-300/50" />
            <blockquote className="font-display text-xl sm:text-2xl font-semibold leading-relaxed text-white max-w-3xl">
              «{quote.text}»
            </blockquote>
            <p className="text-xs text-amber-200/70">— {quote.author}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setQuoteIndex((i) => (i + 1) % QUOTES.length)}
              className="icon-button inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl surface-sub text-xs font-semibold text-orange-200 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Otra frase
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="icon-button inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl surface-sub text-xs font-semibold text-amber-200 hover:text-white"
            >
              <Clipboard className="w-3.5 h-3.5" />
              {copied ? '¡Copiada!' : 'Copiar frase'}
            </button>
            {copied && (
              <span role="status" className="text-[11px] text-yellow-300">
                Compártela con quien la necesite.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual advice */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${toneStyles}`}
      >
        <div className="flex items-start gap-3">
          <ContextIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              {contextualTip.title}
            </h3>
            <p className="text-xs mt-1 leading-relaxed text-stone-200/90 max-w-2xl">
              {contextualTip.body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(contextualTip.action.section)}
          className="icon-button shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/25 text-xs font-semibold"
        >
          {contextualTip.action.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Tips */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`chip cursor-pointer transition-colors ${
                category === 'all'
                  ? 'border-orange-300 bg-orange-500/20 text-orange-100'
                  : 'border-white/15 text-stone-400 hover:text-orange-200'
              }`}
            >
              Todos
            </button>
            {(Object.keys(CATEGORY_META) as TipCategory[]).map((key) => {
              const meta = CATEGORY_META[key];
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`chip cursor-pointer transition-colors ${
                    category === key
                      ? `border-current bg-white/10 ${meta.text}`
                      : 'border-white/15 text-stone-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTips.map((tip) => {
              const meta = CATEGORY_META[tip.category];
              const Icon = meta.icon;
              return (
                <article
                  key={tip.id}
                  className="p-5 rounded-2xl surface-card lift flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`icon-tile p-2 rounded-xl bg-gradient-to-br ${meta.accent} text-white shadow-[0_0_18px_-8px_rgba(251,146,60,0.9)]`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`chip border-white/25 ${meta.text}`}>
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {tip.title}
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed flex-1">
                    {tip.body}
                  </p>
                  {tip.action && (
                    <button
                      type="button"
                      onClick={() => onNavigate(tip.action!.section)}
                      className={`icon-button self-start inline-flex items-center gap-1.5 text-xs font-semibold ${meta.text}`}
                    >
                      {tip.action.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* Daily micro-habits */}
        <div className="p-5 rounded-2xl surface-card lift space-y-5 h-fit">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-300 neon-dot" />
                <h3 className="text-sm font-semibold text-white">
                  Micro-hábitos de hoy
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Se reinician cada día. Marca los que cumplas.
              </p>
            </div>
            <span className="font-mono-tabular text-sm font-bold text-yellow-300">
              {habitsProgress}%
            </span>
          </div>

          <div className="h-2.5 rounded-full bg-[#140b06] border border-white/10 overflow-hidden">
            <div
              className="progress-fill h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400"
              style={{ width: `${habitsProgress}%` }}
            />
          </div>

          <div className="space-y-2">
            {HABITS.map((habit) => {
              const done = doneHabits.includes(habit.id);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    done
                      ? 'bg-yellow-400/10 border border-yellow-300/40 text-yellow-100'
                      : 'surface-sub text-stone-300 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-md border shrink-0 ${
                      done
                        ? 'bg-yellow-300 border-yellow-300 text-stone-950'
                        : 'border-white/25 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className={done ? 'line-through opacity-80' : ''}>
                    {habit.text}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-orange-200/70 leading-relaxed">
            {habitsProgress === 100
              ? '¡Día completo! La constancia es tu mejor inversión.'
              : 'Cada hábito marcado es una prueba de que puedes con el siguiente.'}
          </p>
        </div>
      </div>
    </section>
  );
}
