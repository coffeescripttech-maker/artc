import { prisma } from "@aratc/database";
import type { BrandSettings, GeneralSettings } from "@aratc/shared";

const SETTINGS_ID = "default";

export async function getBrandSettings(): Promise<BrandSettings> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  return (settings?.brand as BrandSettings | null) ?? {};
}

export async function updateBrandSettings(brand: BrandSettings): Promise<BrandSettings> {
  await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { brand },
    create: { id: SETTINGS_ID, brand },
  });
  return brand;
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  return (settings?.general as GeneralSettings | null) ?? {};
}

export async function updateGeneralSettings(
  general: GeneralSettings
): Promise<GeneralSettings> {
  await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { general },
    create: { id: SETTINGS_ID, general },
  });
  return general;
}
