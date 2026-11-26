import type { FinanceState } from './types/finance';

export const CUENTA_MAESTRA_URL =
  (import.meta.env.VITE_CUENTA_MAESTRA_URL as string | undefined) ||
  'https://cuenta-maestra.vercel.app';
const CM_URL = CUENTA_MAESTRA_URL;
const TOKEN_KEY = 'fp_api_token';
const DEVICE_KEY = 'cm_device_id';
const LINK_KEY = 'fp_link_token';
const LABEL_KEY = 'fp_sub_label';

export interface SubaccountSession {
  token: string;
  deviceId: string;
  label: string;
}

export async function initSubaccount(): Promise<SubaccountSession | null> {
  const params = new URLSearchParams(window.location.search);
  const link = params.get('link');
  const deviceFromUrl = params.get('device');

  if (link) {
    window.localStorage.setItem(LINK_KEY, link);
    if (deviceFromUrl) window.localStorage.setItem(DEVICE_KEY, deviceFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  let deviceId = window.localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, deviceId);
  }

  const cached = window.localStorage.getItem(TOKEN_KEY);
  if (cached) {
    return {
      token: cached,
      deviceId,
      label: window.localStorage.getItem(LABEL_KEY) || 'Subcuenta',
    };
  }

  const linkToken = window.localStorage.getItem(LINK_KEY);
  if (!linkToken) return null;

  const response = await fetch(`${CM_URL}/api/sub/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify({ token: linkToken }),
  });
  if (!response.ok) {
    throw new Error('El enlace de vinculación no es válido o ya venció.');
  }
  const data = (await response.json()) as {
    token: string;
    sub: { label: string } | null;
  };
  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.removeItem(LINK_KEY);
  if (data.sub?.label) window.localStorage.setItem(LABEL_KEY, data.sub.label);
  return { token: data.token, deviceId, label: data.sub?.label || 'Subcuenta' };
}

export async function fetchSubFinance(
  session: SubaccountSession
): Promise<FinanceState> {
  const response = await fetch(`${CM_URL}/api/sub/finance`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
      'X-Device-Id': session.deviceId,
    },
  });
  if (!response.ok) throw new Error('No se pudieron cargar los datos de la subcuenta.');
  return (await response.json()) as FinanceState;
}

export async function saveSubFinance(
  session: SubaccountSession,
  state: FinanceState
): Promise<void> {
  const response = await fetch(`${CM_URL}/api/sub/finance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      'X-Device-Id': session.deviceId,
    },
    body: JSON.stringify(state),
  });
  if (!response.ok) throw new Error('No se pudieron guardar los datos de la subcuenta.');
}
