import { getRemoteConfig } from "firebase-admin/remote-config";
import { getAdminApp } from "@/lib/db";

const SERVER_FLAG_DEFAULTS = {
  email_onboarding_enabled: false,
  new_project_creation_enabled: true,
} as const;

type ServerFeatureFlag = keyof typeof SERVER_FLAG_DEFAULTS;

const CACHE_TTL_MS = 60_000;
let cachedFlags: Record<ServerFeatureFlag, boolean> = {
  email_onboarding_enabled: SERVER_FLAG_DEFAULTS.email_onboarding_enabled,
  new_project_creation_enabled: SERVER_FLAG_DEFAULTS.new_project_creation_enabled,
};
let cacheExpiresAt = 0;
let inFlight: Promise<Record<ServerFeatureFlag, boolean>> | null = null;

async function fetchServerFlags(): Promise<Record<ServerFeatureFlag, boolean>> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return { ...SERVER_FLAG_DEFAULTS };
  }

  try {
    const remoteConfig = getRemoteConfig(getAdminApp());
    const template = await remoteConfig.getServerTemplate({
      defaultConfig: SERVER_FLAG_DEFAULTS,
    });
    await template.load();
    const config = template.evaluate();

    return {
      email_onboarding_enabled: config.getBoolean("email_onboarding_enabled"),
      new_project_creation_enabled: config.getBoolean(
        "new_project_creation_enabled",
      ),
    };
  } catch (error) {
    console.warn("Failed to load Remote Config server flags:", error);
    return { ...SERVER_FLAG_DEFAULTS };
  }
}

export async function getServerFeatureFlag(
  flag: ServerFeatureFlag,
): Promise<boolean> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return SERVER_FLAG_DEFAULTS[flag];
  }

  const now = Date.now();
  if (now < cacheExpiresAt) {
    return cachedFlags[flag];
  }

  if (!inFlight) {
    inFlight = fetchServerFlags();
  }

  const flags = await inFlight;
  inFlight = null;
  cachedFlags = flags;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;

  return flags[flag];
}
