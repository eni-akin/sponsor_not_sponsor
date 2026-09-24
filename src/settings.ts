import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = { paused: false, disabledHosts: [] };
export function parseSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS };
  const candidate = value as Partial<Settings>;
  return {
    paused: candidate.paused === true,
    disabledHosts: Array.isArray(candidate.disabledHosts)
      ? candidate.disabledHosts.filter((host): host is string => typeof host === 'string')
      : [],
  };
}
