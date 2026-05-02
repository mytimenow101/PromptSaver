import { AppSettings } from "../types/prompt";

export const STORAGE_KEYS = {
  prompts: "prompts",
  folders: "folders",
  settings: "settings",
  draftSelection: "draftSelection"
} as const;

export const DEFAULT_FOLDERS = [
  "Writing",
  "Marketing",
  "Coding",
  "Image Prompts",
  "Business",
  "Personal"
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  defaultFolderId: ""
};

export const FREE_LIMITS = { maxPrompts: 50, maxFolders: 5 };
export const PRO_FEATURES = {
  unlimitedPrompts: true,
  cloudSync: false,
  teamLibrary: false,
  promptVariables: true,
  importExport: true
};
