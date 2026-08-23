

import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { prisma } from "@/lib/prisma";


async function readRecord(key: string): Promise<unknown> {
  try {
    const row = await prisma.whatsAppAuth.findUnique({ where: { key } });
    if (!row?.value) return null;
    return JSON.parse(row.value, BufferJSON.reviver);
  } catch {
    return null;
  }
}

async function writeRecord(key: string, data: unknown): Promise<void> {
  const value = JSON.stringify(data, BufferJSON.replacer);
  await prisma.whatsAppAuth.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

async function deleteRecord(key: string): Promise<void> {
  try {
    await prisma.whatsAppAuth.delete({ where: { key } });
  } catch {

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
        const result: { [id: string]: SignalDataTypeMap[T] } = {};
        await Promise.all(
          ids.map(async (id) => {
            let value = (await readRecord(`${type}-${id}`)) as SignalDataTypeMap[T] | null;

            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(
                value as { [k: string]: unknown }
              ) as unknown as SignalDataTypeMap[T];
            }
            if (value !== null && value !== undefined) {
              result[id] = value;
            }
          })
        );
        return result;
      },

      set: async (data: { [category: string]: { [id: string]: unknown } }) => {
        const tasks: Promise<void>[] = [];
        for (const category in data) {
          for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            tasks.push(value ? writeRecord(key, value) : deleteRecord(key));
          }
        }
        await Promise.all(tasks);
      },
    },
  };

  const saveCreds = async () => {
    await writeRecord("creds", state.creds);
  };

  return { state, saveCreds };
}

export async function clearDbAuthState(): Promise<void> {
  await prisma.whatsAppAuth.deleteMany({});
}
