export const BASE_GRID_SIZE = 8;
export const WALL_HEIGHT = 2;
export const CELL_SIZE = 2;
export const MOVEMENT_SPEED = 0.15;
export const ROTATION_SPEED = 0.1;

export const STORAGE_KEY = 'infinite_maze_stats_v2';

export const COLOR_PALETTES = [
  ['#ff00ff', '#00ffff', '#ffff00'],
  ['#ff3333', '#33ff33', '#3333ff'],
  ['#FF5F6D', '#FFC371', '#24FE41'],
];

export interface MusicTrack {
  id: string;
  filename: string;
  nameCN: string;
  nameEN: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "01", filename: "01-幻梦之旅-Dreamy Voyage.mp3", nameCN: "幻梦之旅", nameEN: "Dreamy Voyage" },
  { id: "02", filename: "02-某日-Another Day.mp3", nameCN: "某日", nameEN: "Another Day" },
  { id: "03", filename: "03-前夜-The Eve.mp3", nameCN: "前夜", nameEN: "The Eve" },
  { id: "04", filename: "04-步步-Step By.mp3", nameCN: "步步", nameEN: "Step By" },
  { id: "05", filename: "05-远遥-Far Away.mp3", nameCN: "远遥", nameEN: "Far Away" },
  { id: "06", filename: "06-幻梦 Disco-Dreamy Disco.mp3", nameCN: "幻梦 Disco", nameEN: "Dreamy Disco" },
  { id: "07", filename: "07-林中行-Jungle Proceeding .mp3", nameCN: "林中行", nameEN: "Jungle Proceeding" },
  { id: "08", filename: "08-攀登-Climbing.mp3", nameCN: "攀登", nameEN: "Climbing" },
  { id: "09", filename: "09-闪耀-Shining Move.mp3", nameCN: "闪耀", nameEN: "Shining Move" },
  { id: "10", filename: "10-无尽-Endless .mp3", nameCN: "无尽", nameEN: "Endless" },
  { id: "11", filename: "11-求索-Uncharted Odyssey.mp3", nameCN: "求索", nameEN: "Uncharted Odyssey" },
  { id: "12", filename: "12-意识迷走-Consciousness Drift.mp3", nameCN: "意识迷走", nameEN: "Consciousness Drift" },
  { id: "13", filename: "13-抽搐无限-Convulsion Infinity.mp3", nameCN: "抽搐无限", nameEN: "Convulsion Infinity" },
  { id: "14", filename: "14-谎言逃脱-Lie Escape.mp3", nameCN: "谎言逃脱", nameEN: "Lie Escape" },
  { id: "15", filename: "15-幻影囚禁-Phantom Imprisonment.mp3", nameCN: "幻影囚禁", nameEN: "Phantom Imprisonment" },
  { id: "16", filename: "16-加密频谱-Encrypt Spectrum.mp3", nameCN: "加密频谱", nameEN: "Encrypt Spectrum" },
  { id: "17", filename: "17-恍惚眩晕-Trance Vertigo.mp3", nameCN: "恍惚眩晕", nameEN: "Trance Vertigo" },
  { id: "18", filename: "18-饱和残影-Saturation Afterglow.mp3", nameCN: "饱和残影", nameEN: "Saturation Afterglow" },
  { id: "19", filename: "19-潜意识嘶吼-Subconscious Howling.mp3", nameCN: "潜意识嘶吼", nameEN: "Subconscious Howling" },
  { id: "20", filename: "20-毁灭宿命-Destruction Fate.mp3", nameCN: "毁灭宿命", nameEN: "Destruction Fate" },
  { id: "21", filename: "21-蒸发熵增-Evaporation Entropy.mp3", nameCN: "蒸发熵增", nameEN: "Evaporation Entropy" },
  { id: "22", filename: "22-窒息催眠-Suffocation Hypnosis.mp3", nameCN: "窒息催眠", nameEN: "Suffocation Hypnosis" },
  { id: "23", filename: "23-和谐恨-Harmony Hate.mp3", nameCN: "和谐恨", nameEN: "Harmony Hate" },
  { id: "24", filename: "24-矛盾波形-Contradiction Waveform.mp3", nameCN: "矛盾波形", nameEN: "Contradiction Waveform" },
  { id: "25", filename: "25-发狂他者-Madness Other.mp3", nameCN: "发狂他者", nameEN: "Madness Other" },
  { id: "26", filename: "26-狂怒无限-Fury Infinity.mp3", nameCN: "狂怒无限", nameEN: "Fury Infinity" },
  { id: "27", filename: "27-毁灭权力-Destruction Power.mp3", nameCN: "毁灭权力", nameEN: "Destruction Power" },
  { id: "28", filename: "28-幻影集体-Phantom Collective.mp3", nameCN: "幻影集体", nameEN: "Phantom Collective" },
  { id: "29", filename: "29-语言空间-Language Spatial.mp3", nameCN: "语言空间", nameEN: "Language Spatial" },
  { id: "30", filename: "30-陷阱逃脱-Trap Escape.mp3", nameCN: "陷阱逃脱", nameEN: "Trap Escape" },
  { id: "31", filename: "31-数据孤独-Dataflow Loneliness.mp3", nameCN: "数据孤独", nameEN: "Dataflow Loneliness" },
  { id: "32", filename: "32-幻象痴迷-Mirage Obsession.mp3", nameCN: "幻象痴迷", nameEN: "Mirage Obsession" },
  { id: "33", filename: "33-迭代震动-Iteration Vibration.mp3", nameCN: "迭代震动", nameEN: "Iteration Vibration" },
  { id: "34", filename: "34-平衡递归-Balance Recursion.mp3", nameCN: "平衡递归", nameEN: "Balance Recursion" },
  { id: "35", filename: "35-极悲自我-Despair Self.mp3", nameCN: "极悲自我", nameEN: "Despair Self" },
  { id: "36", filename: "36-痉挛崩溃-Spasm Breakdown.mp3", nameCN: "痉挛崩溃", nameEN: "Spasm Breakdown" },
  { id: "37", filename: "37-憎恨符号-Hatred Symbol.mp3", nameCN: "憎恨符号", nameEN: "Hatred Symbol" },
  { id: "38", filename: "38-延迟战栗-Delay Trembling.mp3", nameCN: "延迟战栗", nameEN: "Delay Trembling" },
  { id: "39", filename: "39-偏执狂怒-Paranoia Fury.mp3", nameCN: "偏执狂怒", nameEN: "Paranoia Fury" },
  { id: "40", filename: "40-同步集体-Sync Collective.mp3", nameCN: "同步集体", nameEN: "Sync Collective" },
  { id: "41", filename: "41-抵抗重生-Resistance Rebirth.mp3", nameCN: "抵抗重生", nameEN: "Resistance Rebirth" },
  { id: "42", filename: "42-粒子乌托邦-Particle Utopia.mp3", nameCN: "粒子乌托邦", nameEN: "Particle Utopia" },
  { id: "43", filename: "43-沉默同步-Silence Sync.mp3", nameCN: "沉默同步", nameEN: "Silence Sync" },
  { id: "44", filename: "44-迷雾反乌托邦-Mist Dystopia.mp3", nameCN: "迷雾反乌托邦", nameEN: "Mist Dystopia" },
  { id: "45", filename: "45-循环坠落-Loop Falling.mp3", nameCN: "循环坠落", nameEN: "Loop Falling" },
  { id: "46", filename: "46-逃脱光影-Escape Luminescence.mp3", nameCN: "逃脱光影", nameEN: "Escape Luminescence" },
  { id: "47", filename: "47-超维退化-Hyperdimension Degeneration.mp3", nameCN: "超维退化", nameEN: "Hyperdimension Degeneration" },
  { id: "48", filename: "48-凝固痉挛-Solidification Spasm.mp3", nameCN: "凝固痉挛", nameEN: "Solidification Spasm" },
  { id: "49", filename: "49-正义焦虑-Justice Anxiety.mp3", nameCN: "正义焦虑", nameEN: "Justice Anxiety" },
  { id: "50", filename: "50-静态延迟-Static Delay.mp3", nameCN: "静态延迟", nameEN: "Static Delay" },
];