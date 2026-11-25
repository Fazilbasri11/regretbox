export type TimeOfDay = 'morning' | 'afternoon' | 'dusk' | 'night';

export interface TimeThemeConfig {
  id: TimeOfDay;
  label: string;
  weatherLabel: string;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  fogDensity: number;
  ambientSky: string;
  ambientGround: string;
  ambientIntensity: number;
  keyLightColor: string;
  keyLightIntensity: number;
  keyLightPos: [number, number, number];
  lanternIntensity: number;
  chapelWindowIntensity: number;
  showStars: boolean;
  celestialType: 'moon' | 'sun';
  celestialColor: string;
  celestialPos: [number, number, number];
  uiAccentGlow: string;
}

export const TIME_THEMES: Record<TimeOfDay, TimeThemeConfig> = {
  morning: {
    id: 'morning',
    label: 'Morning Mist',
    weatherLabel: 'Cool Mist',
    skyTop: '#24374a',
    skyHorizon: '#6c8094',
    fogColor: '#56697a',
    fogDensity: 0.016,
    ambientSky: '#9bb3c9',
    ambientGround: '#1c261f',
    ambientIntensity: 0.95,
    keyLightColor: '#ffe0b5',
    keyLightIntensity: 1.45,
    keyLightPos: [32, 20, -18],
    lanternIntensity: 0.55,
    chapelWindowIntensity: 0.35,
    showStars: false,
    celestialType: 'sun',
    celestialColor: '#ffe5bd',
    celestialPos: [48, 22, -78],
    uiAccentGlow: 'rgba(255, 212, 148, 0.14)',
  },
  afternoon: {
    id: 'afternoon',
    label: 'Overcast Day',
    weatherLabel: 'Quiet Clouds',
    skyTop: '#31475e',
    skyHorizon: '#788fa3',
    fogColor: '#667b8e',
    fogDensity: 0.013,
    ambientSky: '#b2c8dc',
    ambientGround: '#243025',
    ambientIntensity: 1.15,
    keyLightColor: '#f3f1ea',
    keyLightIntensity: 1.8,
    keyLightPos: [18, 44, 14],
    lanternIntensity: 0.25,
    chapelWindowIntensity: 0.18,
    showStars: false,
    celestialType: 'sun',
    celestialColor: '#fff5e0',
    celestialPos: [20, 48, -72],
    uiAccentGlow: 'rgba(176, 204, 232, 0.14)',
  },
  dusk: {
    id: 'dusk',
    label: 'Twilight Dusk',
    weatherLabel: 'Evening Dusk',
    skyTop: '#191c33',
    skyHorizon: '#874c3e',
    fogColor: '#372936',
    fogDensity: 0.017,
    ambientSky: '#7c5c70',
    ambientGround: '#161a1e',
    ambientIntensity: 0.78,
    keyLightColor: '#ff9b5e',
    keyLightIntensity: 1.35,
    keyLightPos: [-36, 12, -32],
    lanternIntensity: 1.95,
    chapelWindowIntensity: 1.75,
    showStars: true,
    celestialType: 'sun',
    celestialColor: '#ff9354',
    celestialPos: [-42, 13, -84],
    uiAccentGlow: 'rgba(255, 148, 88, 0.16)',
  },
  night: {
    id: 'night',
    label: 'Moonlit Night',
    weatherLabel: 'Foggy',
    skyTop: '#060a13',
    skyHorizon: '#162136',
    fogColor: '#0e1624',
    fogDensity: 0.019,
    ambientSky: '#2f4569',
    ambientGround: '#0b0e14',
    ambientIntensity: 0.65,
    keyLightColor: '#a8c2eb',
    keyLightIntensity: 1.2,
    keyLightPos: [18, 28, -46],
    lanternIntensity: 2.5,
    chapelWindowIntensity: 2.3,
    showStars: true,
    celestialType: 'moon',
    celestialColor: '#eef3ff',
    celestialPos: [16, 26, -78],
    uiAccentGlow: 'rgba(224, 159, 62, 0.15)',
  },
};

export function resolveTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'dusk';
  return 'night';
}

export function formatLocalClock(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
