import { AppSettings, Folder, Prompt } from "../types/prompt";
import { DEFAULT_FOLDERS, DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants";

const read = async <T>(key: string, fallback: T): Promise<T> => {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
};

const write = async (key: string, value: unknown) => {
  await chrome.storage.local.set({ [key]: value });
};

export const getPrompts = () => read<Prompt[]>(STORAGE_KEYS.prompts, []);
export const getFolders = () => read<Folder[]>(STORAGE_KEYS.folders, []);
export const getSettings = () => read<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

export const saveAllPrompts = async (prompts: Prompt[]) => write(STORAGE_KEYS.prompts, prompts);
export const saveAllFolders = async (folders: Folder[]) => write(STORAGE_KEYS.folders, folders);

export const savePrompt = async (prompt: Prompt) => {
  const prompts = await getPrompts();
  prompts.push(prompt);
  await saveAllPrompts(prompts);
};

export const updatePrompt = async (id: string, updates: Partial<Prompt>) => {
  const prompts = await getPrompts();
  const updated = prompts.map((prompt) =>
    prompt.id === id ? { ...prompt, ...updates, updatedAt: new Date().toISOString() } : prompt
  );
  await saveAllPrompts(updated);
};

export const deletePrompt = async (id: string) => {
  const prompts = await getPrompts();
  await saveAllPrompts(prompts.filter((prompt) => prompt.id !== id));
};

export const createFolder = async (name: string) => {
  const folder: Folder = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
  const folders = await getFolders();
  folders.push(folder);
  await saveAllFolders(folders);
  return folder;
};

export const updateFolder = async (id: string, name: string) => {
  const folders = await getFolders();
  await saveAllFolders(folders.map((f) => (f.id === id ? { ...f, name } : f)));
};

export const deleteFolder = async (id: string) => {
  const folders = await getFolders();
  await saveAllFolders(folders.filter((f) => f.id !== id));
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
  const current = await getSettings();
  await write(STORAGE_KEYS.settings, { ...current, ...settings });
};

export const clearAllData = async () => {
  await chrome.storage.local.set({ prompts: [], folders: [], settings: DEFAULT_SETTINGS });
};

export const ensureSeedData = async () => {
  const folders = await getFolders();
  if (folders.length) return;

  const seeded = DEFAULT_FOLDERS.map((name) => ({
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString()
  }));
  await saveAllFolders(seeded);
  await updateSettings({ defaultFolderId: seeded[0].id });
};
