import { AppSettings, ExportBundle, Folder, Prompt } from "../types/prompt";
import { DEFAULT_SETTINGS } from "./constants";

const isPrompt = (value: unknown): value is Prompt => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Prompt;
  return !!candidate.id && !!candidate.title && !!candidate.body && !!candidate.folderId;
};

export const exportData = (prompts: Prompt[], folders: Folder[], settings: AppSettings): string =>
  JSON.stringify({ prompts, folders, settings, exportedAt: new Date().toISOString() } satisfies ExportBundle, null, 2);

export const parseImportData = (raw: string) => {
  const parsed = JSON.parse(raw) as Partial<ExportBundle>;
  if (!Array.isArray(parsed.prompts) || !Array.isArray(parsed.folders)) {
    throw new Error("Invalid import format");
  }

  const prompts = parsed.prompts.filter(isPrompt);
  const folders = parsed.folders.filter((f): f is Folder => !!f && typeof f.id === "string" && typeof f.name === "string");
  const settings = parsed.settings ?? DEFAULT_SETTINGS;

  return { prompts, folders, settings };
};

export const mergePrompts = (current: Prompt[], incoming: Prompt[]) => {
  const unique = incoming.filter(
    (next) => !current.some((existing) => existing.id === next.id || (existing.title === next.title && existing.body === next.body))
  );
  return [...current, ...unique];
};
