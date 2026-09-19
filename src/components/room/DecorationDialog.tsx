import { useEffect,useRef,type ReactNode } from "react";
export function DecorationDialog({open,onClose,children}:{open:boolean;onClose:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=ref.current;
    if(!dialog) return;
    if(open && !dialog.open) dialog.showModal();
    if(!open && dialog.open) dialog.close();
    if(!open) return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[open]);
  return <dialog ref={ref} className="decoration-dialog" aria-labelledby="decoration-title" onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
    <div className="decoration-sheet"><header><div><h2 id="decoration-title">Decorate your home</h2><p>Choose something you own, then drag it into place.</p></div><button type="button" onClick={onClose} aria-label="Close decoration picker">✕</button></header>{children}</div>
  </dialog>;
}
