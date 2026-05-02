export function Toast({message}:{message:string}){if(!message)return null;return <div className="fixed bottom-3 right-3 rounded bg-slate-900 px-3 py-2 text-sm text-white">{message}</div>}
