/**
 * Baileys authentication state backed by Postgres (WhatsAppAuth table).
 * Uses batched DB operations to prevent connection pool exhaustion.
 */

import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import {
  authGet,
  authGetMany,
  authSet,
  authSetMany,
  authDeleteMany,
  authDeleteAll,
} from "./db";

async function readRecord(key: string): Promise<unknown> {
  try {
    const raw = await authGet(key);
    if (!raw) return null;
    return JSON.parse(raw, BufferJSON.reviver);
  } catch {
    return null;
  }
}

export async function useDbAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const creds: AuthenticationCreds =
    ((await readRecord("creds")) as AuthenticationCreds | null) ?? initAuthCreds();

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async <T extends keyof SignalDataTypeMap>(
        type: T,
        ids: string[]
      ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
        if (ids.length === 0) return {};

        const keyMap: Record<string, string> = {};
        const fullKeys: string[] = [];
        for (const id of ids) {
          const k = `${type}-${id}`;
          keyMap[k] = id;
          fullKeys.push(k);
        }

        const rawRecords = await authGetMany(fullKeys);
        const result: { [id: string]: SignalDataTypeMap[T] } = {};

        for (const fullKey in rawRecords) {
          const id = keyMap[fullKey];
          try {
            let value = JSON.parse(rawRecords[fullKey], BufferJSON.reviver);
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(
                value as { [k: string]: unknown }
              ) as unknown as SignalDataTypeMap[T];
            }
            if (value !== null && value !== undefined) {
              result[id] = value;
            }
          } catch {
            // Ignore malformed key
          }
        }

        return result;
      },

      set: async (data: { [category: string]: { [id: string]: unknown } }) => {
        const toSet: { key: string; value: string }[] = [];
        const toDelete: string[] = [];

        for (const category in data) {
          for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            if (value) {
              toSet.push({ key, value: JSON.stringify(value, BufferJSON.replacer) });
            } else {
              toDelete.push(key);
            }
          }
        }

        await Promise.all([
          authSetMany(toSet),
          authDeleteMany(toDelete),
        ]);
      },
    },
  };

  const saveCreds = async (): Promise<void> => {
    const raw = JSON.stringify(state.creds, BufferJSON.replacer);
    await authSet("creds", raw);
  };

  return { state, saveCreds };
}

export async function clearDbAuthState(): Promise<void> {
  await authDeleteAll();
}

export async function hasSavedSession(): Promise<boolean> {
  const creds = (await readRecord("creds")) as AuthenticationCreds | null;
  return Boolean(creds && (creds.registered || creds.me));
}
