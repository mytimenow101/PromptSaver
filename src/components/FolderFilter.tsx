import {Folder} from "../types/prompt";
export const FolderFilter=({folders,value,onChange}:{folders:Folder[];value:string;onChange:(v:string)=>void})=><select className="p-2 rounded border" value={value} onChange={e=>onChange(e.target.value)}><option value="">All folders</option>{folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>;
