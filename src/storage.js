const DATABASE_NAME = 'recordatorios';
const DATABASE_VERSION = 1;
const MIGRATION_KEY = 'localstorage_migrated_v1';

const TABLES = {
  tasks: 'tasks',
  people: 'people',
  notes: 'notes',
  chat: 'chat_messages'
};

const safeParse = (value, fallback) => {
  try { return value == null ? fallback : JSON.parse(value); }
  catch { return fallback; }
};

export function createWebStorage(keys, local = globalThis.localStorage) {
  return {
    kind: 'web',
    async loadAll() {
      return {
        tasks: safeParse(local.getItem(keys.tasks), []),
        people: safeParse(local.getItem(keys.people), []),
        notes: safeParse(local.getItem(keys.notes), []),
        chat: safeParse(local.getItem(keys.chat), []),
        ai: safeParse(local.getItem(keys.ai), {}),
        preferences: safeParse(local.getItem(keys.preferences), { defaultPriority: 'medium', defaultReminderMinutes: 0, customMemory: '' }),
        theme: local.getItem('recordatorios.theme') || 'light'
      };
    },
    async saveCollections(data) {
      for (const name of ['tasks', 'people', 'notes']) local.setItem(keys[name], JSON.stringify(data[name] || []));
    },
    async saveChat(chat) { local.setItem(keys.chat, JSON.stringify(chat || [])); },
    async saveSetting(name, value) {
      const key = name === 'theme' ? 'recordatorios.theme' : keys[name];
      local.setItem(key, typeof value === 'string' && name === 'theme' ? value : JSON.stringify(value));
    },
    async clearAll() {
      Object.values(keys).forEach(key => local.removeItem(key));
      local.removeItem('recordatorios.theme');
    }
  };
}

const statements = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
`;

async function replaceRows(plugin, table, rows) {
  await plugin.run({ database: DATABASE_NAME, statement: `DELETE FROM ${table}`, values: [] });
  for (let position = 0; position < rows.length; position++) {
    const row = rows[position];
    if (table === TABLES.chat) {
      await plugin.run({ database: DATABASE_NAME, statement: `INSERT INTO ${table} (data, position) VALUES (?, ?)`, values: [JSON.stringify(row), position] });
    } else {
      await plugin.run({ database: DATABASE_NAME, statement: `INSERT INTO ${table} (id, data, position) VALUES (?, ?, ?)`, values: [String(row.id), JSON.stringify(row), position] });
    }
  }
}

async function queryRows(plugin, table) {
  const result = await plugin.query({ database: DATABASE_NAME, statement: `SELECT data FROM ${table} ORDER BY position`, values: [] });
  return (result.values || []).map(row => safeParse(row.data, null)).filter(Boolean);
}

async function getSetting(plugin, key, fallback) {
  const result = await plugin.query({ database: DATABASE_NAME, statement: 'SELECT value FROM settings WHERE key = ?', values: [key] });
  return result.values?.length ? safeParse(result.values[0].value, fallback) : fallback;
}

async function putSetting(plugin, key, value) {
  await plugin.run({ database: DATABASE_NAME, statement: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', values: [key, JSON.stringify(value)] });
}

export async function createAppStorage(keys, environment = globalThis) {
  const native = environment.Capacitor?.isNativePlatform?.();
  const plugin = environment.Capacitor?.Plugins?.CapacitorSQLite;
  if (!native || !plugin) return createWebStorage(keys, environment.localStorage);
  const safetyCopy = createWebStorage(keys, environment.localStorage);

  await plugin.createConnection({ database: DATABASE_NAME, encrypted: false, mode: 'no-encryption', version: DATABASE_VERSION, readonly: false });
  await plugin.open({ database: DATABASE_NAME, readonly: false });
  await plugin.execute({ database: DATABASE_NAME, statements });

  const migrated = await plugin.query({ database: DATABASE_NAME, statement: 'SELECT value FROM app_meta WHERE key = ?', values: [MIGRATION_KEY] });
  if (!migrated.values?.length) {
    const old = await createWebStorage(keys, environment.localStorage).loadAll();
    await plugin.execute({ database: DATABASE_NAME, statements: 'BEGIN TRANSACTION;' });
    try {
      await replaceRows(plugin, TABLES.tasks, old.tasks);
      await replaceRows(plugin, TABLES.people, old.people);
      await replaceRows(plugin, TABLES.notes, old.notes);
      await replaceRows(plugin, TABLES.chat, old.chat);
      await putSetting(plugin, 'ai', old.ai);
      await putSetting(plugin, 'preferences', old.preferences);
      await putSetting(plugin, 'theme', old.theme);
      await plugin.run({ database: DATABASE_NAME, statement: 'INSERT INTO app_meta (key, value) VALUES (?, ?)', values: [MIGRATION_KEY, new Date().toISOString()] });
      await plugin.execute({ database: DATABASE_NAME, statements: 'COMMIT;' });
    } catch (error) {
      await plugin.execute({ database: DATABASE_NAME, statements: 'ROLLBACK;' });
      throw error;
    }
  }

  let writeQueue = Promise.resolve();
  const enqueue = operation => {
    const result = writeQueue.then(operation);
    writeQueue = result.catch(() => {});
    return result;
  };

  return {
    kind: 'sqlite',
    async loadAll() {
      return {
        tasks: await queryRows(plugin, TABLES.tasks),
        people: await queryRows(plugin, TABLES.people),
        notes: await queryRows(plugin, TABLES.notes),
        chat: await queryRows(plugin, TABLES.chat),
        ai: await getSetting(plugin, 'ai', {}),
        preferences: await getSetting(plugin, 'preferences', { defaultPriority: 'medium', defaultReminderMinutes: 0, customMemory: '' }),
        theme: await getSetting(plugin, 'theme', 'light')
      };
    },
    async saveCollections(data) { return enqueue(async() => {
      await plugin.execute({ database: DATABASE_NAME, statements: 'BEGIN TRANSACTION;' });
      try {
        await replaceRows(plugin, TABLES.tasks, data.tasks || []);
        await replaceRows(plugin, TABLES.people, data.people || []);
        await replaceRows(plugin, TABLES.notes, data.notes || []);
        await plugin.execute({ database: DATABASE_NAME, statements: 'COMMIT;' });
        await safetyCopy.saveCollections(data);
      } catch (error) {
        await plugin.execute({ database: DATABASE_NAME, statements: 'ROLLBACK;' });
        throw error;
      }
    }); },
    async saveChat(chat) { return enqueue(async() => { await replaceRows(plugin, TABLES.chat, chat || []); await safetyCopy.saveChat(chat); }); },
    async saveSetting(name, value) { return enqueue(async() => { await putSetting(plugin, name, value); await safetyCopy.saveSetting(name, value); }); },
    async clearAll() { return enqueue(async() => { await plugin.execute({ database: DATABASE_NAME, statements: 'DELETE FROM tasks; DELETE FROM people; DELETE FROM notes; DELETE FROM chat_messages; DELETE FROM settings;' }); await safetyCopy.clearAll(); }); }
  };
}
