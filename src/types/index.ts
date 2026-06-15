export type FixtureId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const FIXTURE_IDS: FixtureId[] = [1, 2, 3, 4, 5, 6, 7, 8];

export interface LightState {
  pan: number;
  tilt: number;
  colorR: number;
  colorG: number;
  colorB: number;
  pattern: number;
  strobeHz: number;
  intensity: number;
}

export const DEFAULT_LIGHT_STATE: LightState = {
  pan: 0,
  tilt: -45,
  colorR: 255,
  colorG: 255,
  colorB: 255,
  pattern: 0,
  strobeHz: 0,
  intensity: 80,
};

export interface Keyframe {
  id: string;
  time: number;
  fixtureId: FixtureId;
  state: Partial<LightState>;
}

export interface FixtureTrack {
  fixtureId: FixtureId;
  keyframes: Keyframe[];
}

export interface AudioTrack {
  name: string;
  duration: number;
  beats: number[];
  bpm: number;
  audioBufferBase64?: string;
}

export interface LightShow {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  duration: number;
  description?: string;
  thumbnailDataUrl?: string;
  tracks: FixtureTrack[];
  audioTrack?: AudioTrack;
}

export interface DMXChannelMap {
  pan: number;
  panFine: number;
  tilt: number;
  tiltFine: number;
  intensity: number;
  strobe: number;
  colorR: number;
  colorG: number;
  colorB: number;
  pattern: number;
  reserved1: number;
  reserved2: number;
}

export const DEFAULT_DMX_CHANNEL_MAP: DMXChannelMap = {
  pan: 1,
  panFine: 2,
  tilt: 3,
  tiltFine: 4,
  intensity: 5,
  strobe: 6,
  colorR: 7,
  colorG: 8,
  colorB: 9,
  pattern: 10,
  reserved1: 11,
  reserved2: 12,
};

export interface DMXExportConfig {
  frameRate: number;
  startAddress: Record<FixtureId, number>;
  channelMap: DMXChannelMap;
}

export const DEFAULT_DMX_EXPORT_CONFIG: DMXExportConfig = {
  frameRate: 30,
  startAddress: { 1: 1, 2: 13, 3: 25, 4: 37, 5: 49, 6: 61, 7: 73, 8: 85 },
  channelMap: DEFAULT_DMX_CHANNEL_MAP,
};

export const PATTERN_NAMES = [
  '无图案',
  '圆点聚焦',
  '条状光束',
  '星形图案',
  '网格纹理',
  '波浪花纹',
  '放射光束',
  '漩涡图案',
];

export interface FixturePosition {
  x: number;
  y: number;
  z: number;
  name: string;
}

export const FIXTURE_POSITIONS: Record<FixtureId, FixturePosition> = {
  1: { x: -7.5, y: 8, z: -8, name: '前左 A1' },
  2: { x: -2.5, y: 8, z: -8, name: '前中左 A2' },
  3: { x: 2.5, y: 8, z: -8, name: '前中右 A3' },
  4: { x: 7.5, y: 8, z: -8, name: '前右 A4' },
  5: { x: -7.5, y: 9, z: 8, name: '后左 B1' },
  6: { x: -2.5, y: 9, z: 8, name: '后中左 B2' },
  7: { x: 2.5, y: 9, z: 8, name: '后中右 B3' },
  8: { x: 7.5, y: 9, z: 8, name: '后右 B4' },
};
