import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { AppSettings } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface BackupSettingsViewProps {
  settings: AppSettings;
  transactionCount: number;
  pocketCount: number;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onExportJson: () => void;
  onImportJson: (text: string) => { ok: boolean; message: string };
  onResetToZero: () => void;
  onLoadDemoData: () => void;
}

export function BackupSettingsView({
  settings,
  transactionCount,
  pocketCount,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onResetToZero,
  onLoadDemoData,
}: BackupSettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const result = onImportJson(content);
      setFeedback(result);
    } catch {
      setFeedback({
        ok: false,
        message: 'Error al leer el archivo seleccionado.',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <section className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold neon-gradient">
          Respaldo de Datos y Reglas Automáticas
        </h2>
        <p className="text-xs text-stone-400">
          Tus datos se guardan automáticamente en este navegador ({transactionCount}{' '}
          movimientos · {pocketCount} bolsillos).
        </p>
      </div>

      {/* Automatic Savings Rules Defaults */}
      <div className="p-6 rounded-2xl surface-card lift space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Preferencias Predeterminadas de Ahorro Efectivo
          </h3>
          <p className="text-xs text-stone-400">
            Configura los valores iniciales al registrar nuevos ingresos o gastos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div className="p-4 rounded-xl surface-sub space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-100">
                Retención automática en ingresos
              </span>
              <input
                type="checkbox"
                checked={settings.defaultRetentionEnabled}
                onChange={(e) =>
                  onUpdateSettings({ defaultRetentionEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              {[10, 15, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateSettings({ defaultRetentionPercent: pct })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-medium transition-colors cursor-pointer ${
                    settings.defaultRetentionPercent === pct
                      ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold shadow-[0_0_18px_-6px_rgba(251,146,60,0.9)]'
                      : 'bg-white/[0.04] text-stone-300 border border-white/10 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl surface-sub space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-100">
                Redondeo de vuelto en gastos
              </span>
              <input
                type="checkbox"
                checked={settings.defaultRoundUpEnabled}
                onChange={(e) =>
                  onUpdateSettings({ defaultRoundUpEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              {[1000, 5000, 10000].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onUpdateSettings({ roundUpStep: step })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-medium transition-colors cursor-pointer ${
                    settings.roundUpStep === step
                      ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold shadow-[0_0_18px_-6px_rgba(251,146,60,0.9)]'
                      : 'bg-white/[0.04] text-stone-300 border border-white/10 hover:text-white'
                  }`}
                >
                  {formatCurrency(step)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JSON Export / Import */}
      <div className="p-6 rounded-2xl surface-card lift space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Copia de Seguridad en JSON
          </h3>
          <p className="text-xs text-stone-400">
            Exporta tu historial y metas para resguardarlos o importarlos en otro equipo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onExportJson();
              setFeedback({
                ok: true,
                message: 'Copia de seguridad descargada en formato JSON.',
              });
            }}
            className="cta-vivid flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Respaldo JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl surface-sub hover:bg-white/5 text-stone-100 text-xs font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-300" />
            <span>Importar Respaldo JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {feedback && (
          <div
            role="status"
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs border ${
              feedback.ok
                ? 'bg-[#f59e0b]/10 border-[#f59e0b]/40 text-amber-200'
                : 'bg-[#ef4444]/10 border-[#ef4444]/40 text-red-200'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 text-[#f59e0b] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Reset & Sample Data Controls */}
      <div className="p-6 rounded-xl bg-[#2a1a10] border border-[#4a2e1b] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-100">
            Gestión de Datos Iniciales
          </h3>
          <p className="text-xs text-stone-400">
            Reinicia tu cuenta en cero para comenzar con tus finanzas reales o carga datos de ejemplo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ef4444]/15 hover:bg-[#ef4444]/25 border border-[#ef4444]/40 text-[#ef4444] text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar datos a cero</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/40">
              <span className="text-xs text-red-100">
                ¿Seguro? Se borrarán todos los movimientos actuales.
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetToZero();
                  setConfirmReset(false);
                  setFeedback({
                    ok: true,
                    message: 'Todos los datos se reiniciaron a cero.',
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-[#ef4444] text-white text-xs font-semibold cursor-pointer"
              >
                Sí, reiniciar a cero
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onLoadDemoData();
              setConfirmReset(false);
              setFeedback({
                ok: true,
                message: 'Datos de ejemplo precargados nuevamente.',
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#150c07] hover:bg-stone-800 border border-[#4a2e1b] text-stone-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#f59e0b]" />
            <span>Cargar datos de ejemplo</span>
          </button>
        </div>
      </div>
    </section>
  );
}
