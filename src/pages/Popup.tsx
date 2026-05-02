import { useEffect, useMemo, useState } from "react";
import { FolderFilter } from "../components/FolderFilter";
import { PromptCard } from "../components/PromptCard";
import { PromptEditor } from "../components/PromptEditor";
import { PromptSearch } from "../components/PromptSearch";
import { Toast } from "../components/Toast";
import { VariableModal } from "../components/VariableModal";
import { FREE_LIMITS, PRO_FEATURES, STORAGE_KEYS } from "../lib/constants";
import { filterAndSortPrompts } from "../lib/promptUtils";
import { createFolder, deleteFolder, deletePrompt, getFolders, getPrompts, savePrompt, updateFolder, updatePrompt } from "../lib/storage";
import { extractVariables, fillVariables } from "../lib/variableParser";
import { Folder, Prompt, SortOption } from "../types/prompt";
import { ProBadge } from "../components/ProBadge";

type VariableState = { prompt: Prompt; vars: string[]; values: Record<string, string> };

export default function Popup() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [draft, setDraft] = useState<Partial<Prompt> | null>(null);
  const [search, setSearch] = useState("");
  const [folderId, setFolderId] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [toast, setToast] = useState("");
  const [varState, setVarState] = useState<VariableState | null>(null);

  const [newFolderName, setNewFolderName] = useState("");

  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName("");
    await load();
  };

  const renameFolder = async (id: string, current: string) => {
    const next = window.prompt("Rename folder", current);
    if (!next || next === current) return;
    await updateFolder(id, next.trim());
    await load();
  };

  const removeFolder = async (id: string) => {
    if (!window.confirm("Delete this folder? Prompts are not auto-moved.")) return;
    await deleteFolder(id);
    await load();
  };

  const load = async () => {
    const [nextPrompts, nextFolders] = await Promise.all([getPrompts(), getFolders()]);
    setPrompts(nextPrompts);
    setFolders(nextFolders);

    const selected = (await chrome.storage.local.get(STORAGE_KEYS.draftSelection))[STORAGE_KEYS.draftSelection] as string | undefined;
    if (selected) {
      setDraft({ title: "", body: selected, tags: [], favorite: false, folderId: nextFolders[0]?.id });
      await chrome.storage.local.remove(STORAGE_KEYS.draftSelection);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPrompts = useMemo(
    () => filterAndSortPrompts(prompts, folders, search, folderId, favoritesOnly, sortBy),
    [prompts, folders, search, folderId, favoritesOnly, sortBy]
  );

  const saveDraft = async () => {
    if (!draft?.title?.trim() || !draft.body?.trim()) return;
    if (draft.id) await updatePrompt(draft.id, draft as Prompt);
    else {
      await savePrompt({
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        body: draft.body.trim(),
        folderId: draft.folderId || folders[0]?.id || "",
        tags: draft.tags || [],
        notes: draft.notes,
        favorite: !!draft.favorite,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setDraft(null);
    await load();
  };

  const copyPrompt = async (prompt: Prompt) => {
    const vars = extractVariables(prompt.body);
    if (vars.length) {
      setVarState({ prompt, vars, values: {} });
      return;
    }
    await navigator.clipboard.writeText(prompt.body);
    await updatePrompt(prompt.id, { usageCount: prompt.usageCount + 1 });
    setToast("Copied!");
    setTimeout(() => setToast(""), 1200);
    await load();
  };

  return (
    <div className="w-[420px] min-h-[560px] p-3 text-slate-800 dark:text-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <div><h1 className="text-lg font-bold">PromptVault</h1><p className="text-xs text-slate-500">{prompts.length}/{FREE_LIMITS.maxPrompts} free prompts</p></div>
        <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => setDraft({ tags: [], favorite: false, folderId: folders[0]?.id })}>New Prompt</button>
      </div>
      {draft ? (
        <div>
          <PromptEditor folders={folders} prompt={draft} onSave={setDraft} onCancel={() => setDraft(null)} />
          <div className="mt-2 flex justify-end"><button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={saveDraft}>Save Prompt</button></div>
        </div>
      ) : (
        <>
          <PromptSearch value={search} onChange={setSearch} />
          <div className="my-2 flex flex-wrap items-center gap-2 text-xs">
            {PRO_FEATURES.unlimitedPrompts ? <ProBadge label="Unlimited prompts" /> : null}
            {!PRO_FEATURES.cloudSync ? <ProBadge label="Cloud sync" /> : null}
            {!PRO_FEATURES.teamLibrary ? <ProBadge label="Team libraries" /> : null}
          </div>
          <div className="mb-2 rounded border bg-white/70 p-2">
            <div className="mb-2 flex gap-2">
              <input className="w-full rounded border p-1 text-sm" placeholder="New folder" value={newFolderName} onChange={(e)=>setNewFolderName(e.target.value)} />
              <button className="rounded bg-slate-800 px-2 py-1 text-xs text-white" onClick={addFolder}>Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {folders.map((folder)=> <span key={folder.id} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs">{folder.name}<button onClick={()=>renameFolder(folder.id, folder.name)}>✎</button><button onClick={()=>removeFolder(folder.id)} className="text-red-600">✕</button></span>)}
            </div>
          </div>
          <div className="my-2 flex gap-2">
            <FolderFilter folders={folders} value={folderId} onChange={setFolderId} />
            <select className="rounded border p-2" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="mostUsed">Most used</option><option value="title">Title A-Z</option>
            </select>
            <label className="text-sm"><input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} /> Favorites</label>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[450px]">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                folder={folders.find((f) => f.id === prompt.folderId)?.name}
                onCopy={() => copyPrompt(prompt)}
                onEdit={() => setDraft(prompt)}
                onDelete={async () => { await deletePrompt(prompt.id); await load(); }}
                onDuplicate={async () => { await savePrompt({ ...prompt, id: crypto.randomUUID(), title: `${prompt.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); await load(); }}
                onFavorite={async () => { await updatePrompt(prompt.id, { favorite: !prompt.favorite }); await load(); }}
              />
            ))}
            {!filteredPrompts.length ? <p className="py-10 text-center text-sm text-slate-500">No prompts yet.</p> : null}
          </div>
        </>
      )}

      <Toast message={toast} />
      {varState ? (
        <VariableModal
          vars={varState.vars}
          values={varState.values}
          setValues={(values) => setVarState({ ...varState, values })}
          onClose={() => setVarState(null)}
          onSubmit={async () => {
            await navigator.clipboard.writeText(fillVariables(varState.prompt.body, varState.values));
            await updatePrompt(varState.prompt.id, { usageCount: varState.prompt.usageCount + 1 });
            setVarState(null);
            setToast("Copied!");
            setTimeout(() => setToast(""), 1200);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
