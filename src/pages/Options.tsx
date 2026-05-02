import { ChangeEvent, useEffect, useState } from "react";
import { parseImportData, exportData, mergePrompts } from "../lib/exportImport";
import { clearAllData, getFolders, getPrompts, getSettings, saveAllFolders, saveAllPrompts, updateSettings } from "../lib/storage";
import { AppSettings, Folder } from "../types/prompt";

export default function Options() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: "system", defaultFolderId: "" });

  const load = async () => {
    const [storedFolders, storedSettings] = await Promise.all([getFolders(), getSettings()]);
    setFolders(storedFolders);
    setSettings(storedSettings);
  };

  useEffect(() => { load(); }, []);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const { prompts, folders: importedFolders, settings: importedSettings } = parseImportData(raw);

    const currentPrompts = await getPrompts();
    const mergedPrompts = mergePrompts(currentPrompts, prompts);
    await saveAllPrompts(mergedPrompts);

    if (importedFolders.length) {
      const existing = await getFolders();
      const deduped = [...existing, ...importedFolders.filter((f) => !existing.some((e) => e.id === f.id || e.name === f.name))];
      await saveAllFolders(deduped);
    }

    await updateSettings(importedSettings);
    await load();
    alert("Import complete.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-slate-800">PromptVault Settings</h1>
      <div className="rounded bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Theme</h2>
        <select
          className="rounded border p-2"
          value={settings.theme}
          onChange={async (e) => {
            const nextTheme = e.target.value as AppSettings["theme"];
            setSettings((prev) => ({ ...prev, theme: nextTheme }));
            await updateSettings({ theme: nextTheme });
          }}
        >
          <option value="light">light</option>
          <option value="dark">dark</option>
          <option value="system">system</option>
        </select>
      </div>

      <div className="rounded bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Default folder</h2>
        <select
          className="rounded border p-2"
          value={settings.defaultFolderId}
          onChange={async (e) => {
            await updateSettings({ defaultFolderId: e.target.value });
            await load();
          }}
        >
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded bg-white p-4 shadow space-y-3">
        <h2 className="font-semibold">Backup & restore</h2>
        <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={async () => {
          const json = exportData(await getPrompts(), await getFolders(), await getSettings());
          const blob = new Blob([json], { type: "application/json" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "promptvault-export.json";
          link.click();
        }}>Export JSON</button>
        <input type="file" accept="application/json" onChange={onImport} />
        <button className="rounded bg-red-600 px-3 py-2 text-white" onClick={async () => {
          if (!window.confirm("Clear all PromptVault data?")) return;
          await clearAllData();
          await load();
        }}>Clear all data</button>
      </div>
    </div>
  );
}
