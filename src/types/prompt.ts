export type Prompt = {
  id: string;
  title: string;
  body: string;
  folderId: string;
  tags: string[];
  favorite: boolean;
  notes?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

export type AppSettings = {
  theme: "light" | "dark" | "system";
  defaultFolderId: string;
};

export type SortOption = "newest" | "oldest" | "mostUsed" | "title";

export type ExportBundle = {
  prompts: Prompt[];
  folders: Folder[];
  settings: AppSettings;
  exportedAt: string;
};
