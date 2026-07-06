import type { Appearance } from "@/utils/themeSettings";

export type ResolvedAppearance = Exclude<Appearance, "system">;

export const DEFAULT_BACKGROUND_ALIGNMENT = "cover,center";
export const DEFAULT_SURFACE_OPACITY = 100;

// 卡片不透明度高于此值就当作完全不透明:不画可读性遮罩,所以默认值(100)没有任何额外
// 绘制开销。低于此值才在背景图上叠加遮罩。
export const SURFACE_SCRIM_THRESHOLD = 95;

const BACKGROUND_SIZE_VALUES = ["cover", "contain", "auto"] as const;
const BACKGROUND_POSITION_VALUES = ["top", "center", "bottom"] as const;

export type BackgroundSize = (typeof BACKGROUND_SIZE_VALUES)[number];
export type BackgroundPosition = (typeof BACKGROUND_POSITION_VALUES)[number];

const MAX_URL_LENGTH = 2048;

// 去掉所有可能逃出 CSS url("…") 上下文或夹带额外声明的字符:控制字符(含 DEL)、空白(URL 里空格
// 用 %20)、引号、反引号、括号、尖括号、反斜杠。这些值还会经过 element.style(本身就禁止跨属性注入),
// 所以这只是纵深防御,不是唯一防线。
const UNSAFE_URL_CHARS = new RegExp("[\\x00-\\x1f\\x7f\"'`()<>\\\\\\s]", "g");

function sanitizeUrlPart(part: string): string {
  return part.replace(UNSAFE_URL_CHARS, "").slice(0, MAX_URL_LENGTH);
}

/**
 * 规范化背景图设置。值可能用 `lightUrl|darkUrl` 编码明暗两套;最多保留这两段,
 * 各自 sanitize,light 和 dark 相同时塌缩成单个 url。空的 light 段(`|darkUrl`)会保留,这样
 * 只有 dark 背景也能原样往返。
 */
export function normalizeBackgroundUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const parts = value.split("|").map((part) => sanitizeUrlPart(part.trim()));
  const light = parts[0] ?? "";
  const dark = parts[1] ?? "";
  if (dark && dark !== light) return `${light}|${dark}`;
  return light;
}

/**
 * 从规范化后的背景值里挑出对应外观的 url。单个 url 对明暗都生效;`light|dark` 一对则按解析出的
 * 外观选取。
 */
export function resolveBackgroundUrl(
  raw: string,
  appearance: ResolvedAppearance,
): string {
  if (!raw) return "";
  const parts = raw.split("|").map((part) => part.trim());
  if (parts.length >= 2) {
    return (appearance === "dark" ? parts[1] : parts[0]) ?? "";
  }
  return parts[0] ?? "";
}

export function parseBackgroundAlignment(value: unknown): {
  size: BackgroundSize;
  position: BackgroundPosition;
} {
  const fallback = { size: "cover" as BackgroundSize, position: "center" as BackgroundPosition };
  if (typeof value !== "string") return fallback;
  const [rawSize, rawPosition] = value.split(",").map((part) => part.trim().toLowerCase());
  const size = (BACKGROUND_SIZE_VALUES as readonly string[]).includes(rawSize)
    ? (rawSize as BackgroundSize)
    : fallback.size;
  const position = (BACKGROUND_POSITION_VALUES as readonly string[]).includes(rawPosition)
    ? (rawPosition as BackgroundPosition)
    : fallback.position;
  return { size, position };
}

export function normalizeBackgroundAlignment(value: unknown): string {
  const { size, position } = parseBackgroundAlignment(value);
  return `${size},${position}`;
}

export function normalizeSurfaceOpacity(value: unknown): number {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(num)) return DEFAULT_SURFACE_OPACITY;
  return Math.min(100, Math.max(0, Math.round(num)));
}

/**
 * 由卡片不透明度推导可读性遮罩强度(--bg-0 覆盖在图片上的 0–100 混合比例,0 = 不加遮罩)。
 * 达到/超过阈值返回 0(不透明表面、零开销);低于阈值时随透明度温和增强(封顶 16%)保底
 * 可读性。刻意不做 backdrop-filter 磨砂:它依赖 GPU 合成,不同设备/浏览器渲染差异大
 * (关闭硬件加速的桌面浏览器甚至完全不画),纯半透明表面 + 普通绘制的遮罩才能在所有设备上
 * 逐像素一致。
 */
export function computeBackgroundScrim(opacity: unknown): number {
  const resolved = normalizeSurfaceOpacity(opacity);
  if (resolved >= SURFACE_SCRIM_THRESHOLD) return 0;
  const t = (SURFACE_SCRIM_THRESHOLD - resolved) / SURFACE_SCRIM_THRESHOLD; // 取值 0–1
  return Math.round(t * 16);
}

// Legacy key retained so existing users keep their saved background after the rename.
export const BACKGROUND_CACHE_KEY = "komaritheme:bg";

interface BackgroundSettingsInput {
  enableBackgroundImage: boolean;
  backgroundImage: string;
  backgroundImageMobile: string;
  backgroundAlignment: string;
  surfaceOpacity: number;
}

/**
 * 预解析好、可直接用于 CSS 的背景值,缓存在 localStorage 里,这样 index.html 的内联脚本能在第一帧
 * 就画出背景 + 表面透明度(避免首帧表面透明度闪烁)。明暗两套都存,因为内联脚本知道解析出的外观
 * 但跑不了 React。
 */
export interface BackgroundCache {
  v: 1;
  size: string;
  position: string;
  /** 卡片不透明度 0–100 的字符串形式,可直接给 --surface-alpha 变量用。 */
  alpha: string;
  /** "" 或 color-mix(...) 字符串,给 --bg-scrim 用。 */
  scrim: string;
  lightDesktop: string;
  lightMobile: string;
  darkDesktop: string;
  darkMobile: string;
}

function toCssUrl(url: string): string {
  return url ? `url("${url}")` : "none";
}

export function buildBackgroundCache(settings: BackgroundSettingsInput): BackgroundCache | null {
  // 开关关闭时与"未配置背景图"完全等价:不写任何 CSS 变量、清掉缓存,body::before 无图可画,
  // 浏览器不会发起任何背景图请求;URL 配置本身原样保留在设置里,随时可再打开。
  if (!settings.enableBackgroundImage) return null;
  const lightDesktop = resolveBackgroundUrl(settings.backgroundImage, "light");
  const darkDesktop = resolveBackgroundUrl(settings.backgroundImage, "dark");
  const lightMobile = resolveBackgroundUrl(settings.backgroundImageMobile, "light") || lightDesktop;
  const darkMobile = resolveBackgroundUrl(settings.backgroundImageMobile, "dark") || darkDesktop;
  if (!lightDesktop && !darkDesktop && !lightMobile && !darkMobile) return null;

  const { size, position } = parseBackgroundAlignment(settings.backgroundAlignment);
  const scrimPct = computeBackgroundScrim(settings.surfaceOpacity);
  return {
    v: 1,
    size,
    position,
    alpha: String(normalizeSurfaceOpacity(settings.surfaceOpacity)),
    scrim:
      scrimPct > 0
        ? `color-mix(in srgb, var(--bg-0) ${scrimPct}%, transparent)`
        : "",
    lightDesktop: toCssUrl(lightDesktop),
    lightMobile: toCssUrl(lightMobile),
    darkDesktop: toCssUrl(darkDesktop),
    darkMobile: toCssUrl(darkMobile),
  };
}

const BACKGROUND_VAR_NAMES = [
  "--bg-image-desktop",
  "--bg-image-mobile",
  "--bg-size",
  "--bg-position",
  "--surface-alpha",
  "--bg-scrim",
] as const;

/**
 * 按给定外观把背景 CSS 变量写到(或清除自)<html> 上。与 index.html 内联脚本保持一致,
 * 让 React 和预绘制引导收敛到完全相同的值。
 */
export function applyBackgroundCache(
  cache: BackgroundCache | null,
  appearance: ResolvedAppearance,
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!cache) {
    for (const name of BACKGROUND_VAR_NAMES) root.style.removeProperty(name);
    return;
  }
  const dark = appearance === "dark";
  const desktop = dark ? cache.darkDesktop : cache.lightDesktop;
  const mobile = (dark ? cache.darkMobile : cache.lightMobile) || desktop;
  root.style.setProperty("--bg-image-desktop", desktop);
  root.style.setProperty("--bg-image-mobile", mobile);
  root.style.setProperty("--bg-size", cache.size);
  root.style.setProperty("--bg-position", cache.position);
  root.style.setProperty("--surface-alpha", cache.alpha);
  if (cache.scrim) root.style.setProperty("--bg-scrim", cache.scrim);
  else root.style.removeProperty("--bg-scrim");
}

export function persistBackgroundCache(cache: BackgroundCache | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (cache) localStorage.setItem(BACKGROUND_CACHE_KEY, JSON.stringify(cache));
    else localStorage.removeItem(BACKGROUND_CACHE_KEY);
  } catch {
    // 大不了下次首屏背景没缓存而已,非致命。
  }
}
