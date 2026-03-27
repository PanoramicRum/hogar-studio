import { prisma } from "./prisma";
import { encrypt, decrypt } from "./crypto";

export interface UserAIKeys {
  replicate?: string;
  openai?: string;
  anthropic?: string;
  gemini?: string;
  localEndpoint?: string;
  localModel?: string;
  localApiKey?: string;
}

interface KeyStatus {
  configured: boolean;
  masked: string | null;
  source: "env" | "user" | null;
}

export interface ProviderKeyStatus {
  replicate: KeyStatus;
  openai: KeyStatus;
  anthropic: KeyStatus;
  gemini: KeyStatus;
  local: KeyStatus;
}

/** Mask a key showing only prefix and last 4 chars */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function tryDecrypt(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try { return decrypt(value); } catch { return value; } // fallback for unencrypted legacy values
}

/** Get merged AI keys for a user (user DB keys override env vars) */
export async function getUserKeys(userId: string): Promise<UserAIKeys> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  return {
    replicate: tryDecrypt(settings?.replicateKey) || process.env.REPLICATE_API_TOKEN || undefined,
    openai: tryDecrypt(settings?.openaiKey) || process.env.OPENAI_API_KEY || undefined,
    anthropic: tryDecrypt(settings?.anthropicKey) || process.env.ANTHROPIC_API_KEY || undefined,
    gemini: tryDecrypt(settings?.geminiKey) || process.env.GEMINI_API_KEY || undefined,
    localEndpoint: settings?.localEndpoint || process.env.LOCAL_AI_ENDPOINT || undefined,
    localModel: settings?.localModel || process.env.LOCAL_AI_MODEL || undefined,
    localApiKey: tryDecrypt(settings?.localApiKey) || process.env.LOCAL_AI_API_KEY || undefined,
  };
}

/** Get key status for all providers (masked keys + source) */
export async function getProviderKeyStatus(userId: string | null): Promise<ProviderKeyStatus> {
  const settings = userId
    ? await prisma.userSettings.findUnique({ where: { userId } })
    : null;

  function status(userKey: string | null | undefined, envKey: string | undefined): KeyStatus {
    if (userKey) {
      const decrypted = tryDecrypt(userKey) || userKey;
      return { configured: true, masked: maskKey(decrypted), source: "user" };
    }
    if (envKey) return { configured: true, masked: maskKey(envKey), source: "env" };
    return { configured: false, masked: null, source: null };
  }

  return {
    replicate: status(settings?.replicateKey, process.env.REPLICATE_API_TOKEN),
    openai: status(settings?.openaiKey, process.env.OPENAI_API_KEY),
    anthropic: status(settings?.anthropicKey, process.env.ANTHROPIC_API_KEY),
    gemini: status(settings?.geminiKey, process.env.GEMINI_API_KEY),
    local: status(
      settings?.localEndpoint,
      process.env.LOCAL_AI_ENDPOINT
    ),
  };
}

/** Save a single provider key for a user */
export async function saveUserKey(userId: string, provider: string, key: string) {
  const fieldMap: Record<string, string> = {
    replicate: "replicateKey",
    openai: "openaiKey",
    anthropic: "anthropicKey",
    gemini: "geminiKey",
    localEndpoint: "localEndpoint",
    localModel: "localModel",
    localApiKey: "localApiKey",
  };

  const field = fieldMap[provider];
  if (!field) throw new Error(`Unknown provider: ${provider}`);

  // Encrypt API keys before storing (skip encryption for non-secret fields)
  const shouldEncrypt = !["localEndpoint", "localModel"].includes(field);
  const value = shouldEncrypt ? encrypt(key) : key;

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, [field]: value },
    update: { [field]: value },
  });
}

/** Remove a single provider key for a user */
export async function removeUserKey(userId: string, provider: string) {
  const fieldMap: Record<string, string> = {
    replicate: "replicateKey",
    openai: "openaiKey",
    anthropic: "anthropicKey",
    gemini: "geminiKey",
    localEndpoint: "localEndpoint",
    localModel: "localModel",
    localApiKey: "localApiKey",
  };

  const field = fieldMap[provider];
  if (!field) throw new Error(`Unknown provider: ${provider}`);

  const existing = await prisma.userSettings.findUnique({ where: { userId } });
  if (existing) {
    await prisma.userSettings.update({
      where: { userId },
      data: { [field]: null },
    });
  }
}
