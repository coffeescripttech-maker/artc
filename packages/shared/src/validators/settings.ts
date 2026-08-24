import { z } from "zod";

// ============================================================
// Site settings — Brand (theme colors) + General (organization)
// ============================================================

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex color (e.g. #1A2B3C)");

/**
 * Brand color bases picked by the admin. Each base derives a full
 * semantic token ramp (hover / subtle / foreground) via
 * `deriveBrandTokens`. All fields optional — unset roles fall back
 * to the CSS defaults in globals.css.
 */
export const brandSettingsSchema = z.object({
  primary: hexColor.optional(),
  accent: hexColor.optional(),
  success: hexColor.optional(),
  warning: hexColor.optional(),
  danger: hexColor.optional(),
  // Advanced neutrals — applied as-is, no derivation
  secondary: hexColor.optional(),
  background: hexColor.optional(),
  surface: hexColor.optional(),
  text: hexColor.optional(),
});

export const generalSettingsSchema = z.object({
  organizationName: z.string().min(1).optional(),
  organizationEmail: z.string().email().optional(),
  contactNumber: z.string().optional(),
});

export type BrandSettings = z.infer<typeof brandSettingsSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;

/** The default ARC brand — matches the semantic tokens in globals.css. */
export const DEFAULT_BRAND_SETTINGS: Required<BrandSettings> = {
  primary: "#0B2553",
  accent: "#F26522",
  success: "#16B364",
  warning: "#F59E0B",
  danger: "#F04438",
  secondary: "#F3F4F6",
  background: "#F6F9FC",
  surface: "#FFFFFF",
  text: "#111827",
};

/** Default general settings shown before anything is saved. */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  organizationName: "ARATC Learning",
  organizationEmail: "admin@aratc.edu.ph",
  contactNumber: "+63 912 345 6789",
};

/** Every CSS variable `deriveBrandTokens` can emit. */
export const BRAND_TOKEN_NAMES = [
  "--primary",
  "--primary-hover",
  "--primary-foreground",
  "--primary-subtle",
  "--accent",
  "--accent-hover",
  "--accent-foreground",
  "--accent-subtle",
  "--success",
  "--success-hover",
  "--success-subtle",
  "--success-foreground",
  "--warning",
  "--warning-hover",
  "--warning-subtle",
  "--warning-foreground",
  "--danger",
  "--danger-hover",
  "--danger-subtle",
  "--danger-foreground",
  "--secondary",
  "--secondary-hover",
  "--arc-bg",
  "--arc-surface",
  "--arc-text",
] as const;

// ------------------------------------------------------------
// Color math — hex <-> HSL and shade derivation
// ------------------------------------------------------------

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) {
      h = 60 * ((((g - b) / d) % 6) + 6) % 6;
    } else if (max === g) {
      h = 60 * ((b - r) / d + 2);
    } else {
      h = 60 * ((r - g) / d + 4);
    }
  }
  return { h, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((((h % 360) + 360) % 360) / 60);
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  const channel = (v: number) =>
    Math.round(Math.min(Math.max(v + m, 0), 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(rgb[0])}${channel(rgb[1])}${channel(rgb[2])}`;
}

export interface RoleShades {
  base: string;
  hover: string;
  subtle: string;
  foreground: string;
}

/**
 * Derives the semantic token ramp for one base color:
 * - hover: very dark bases lighten, everything else darkens
 * - subtle: near-white tint of the same hue
 * - foreground: darkened shade that stays readable on the subtle tint
 */
export function deriveRoleShades(base: string): RoleShades {
  const { h, s, l } = hexToHsl(base);
  const hoverL = l < 0.3 ? Math.min(l + 0.15, 0.85) : Math.max(l - 0.08, 0.08);
  return {
    base,
    hover: hslToHex({ h, s, l: hoverL }),
    subtle: hslToHex({ h, s: Math.min(s * 0.55, 0.6), l: 0.94 }),
    foreground: hslToHex({ h, s: Math.min(s + 0.1, 1), l: Math.min(l, 0.3) }),
  };
}

/** Text color that stays readable on a solid base fill. */
function readableOn(base: string): string {
  return hexToHsl(base).l > 0.55 ? "#111827" : "#FFFFFF";
}

/**
 * Expands saved brand bases into a map of CSS variable name → value,
 * ready to inject as `:root` overrides (server layout) or apply via
 * `document.documentElement.style.setProperty` (live preview).
 * Only roles present in `brand` are emitted.
 */
export function deriveBrandTokens(brand: BrandSettings): Record<string, string> {
  const tokens: Record<string, string> = {};

  if (brand.primary) {
    const p = deriveRoleShades(brand.primary);
    tokens["--primary"] = p.base;
    tokens["--primary-hover"] = p.hover;
    tokens["--primary-foreground"] = readableOn(p.base);
    tokens["--primary-subtle"] = p.subtle;
  }
  if (brand.accent) {
    const a = deriveRoleShades(brand.accent);
    tokens["--accent"] = a.base;
    tokens["--accent-hover"] = a.hover;
    tokens["--accent-foreground"] = readableOn(a.base);
    tokens["--accent-subtle"] = a.subtle;
  }
  if (brand.success) {
    const c = deriveRoleShades(brand.success);
    tokens["--success"] = c.base;
    tokens["--success-hover"] = c.hover;
    tokens["--success-subtle"] = c.subtle;
    tokens["--success-foreground"] = c.foreground;
  }
  if (brand.warning) {
    const c = deriveRoleShades(brand.warning);
    tokens["--warning"] = c.base;
    tokens["--warning-hover"] = c.hover;
    tokens["--warning-subtle"] = c.subtle;
    tokens["--warning-foreground"] = c.foreground;
  }
  if (brand.danger) {
    const c = deriveRoleShades(brand.danger);
    tokens["--danger"] = c.base;
    tokens["--danger-hover"] = c.hover;
    tokens["--danger-subtle"] = c.subtle;
    tokens["--danger-foreground"] = c.foreground;
  }
  if (brand.secondary) {
    const sec = hexToHsl(brand.secondary);
    tokens["--secondary"] = brand.secondary;
    tokens["--secondary-hover"] = hslToHex({ ...sec, l: Math.max(sec.l - 0.04, 0.05) });
  }
  if (brand.background) tokens["--arc-bg"] = brand.background;
  if (brand.surface) tokens["--arc-surface"] = brand.surface;
  if (brand.text) tokens["--arc-text"] = brand.text;

  return tokens;
}
