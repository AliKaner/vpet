import { useEffect,useRef,useId,type ReactNode } from "react";
export function DecorationDialog({open,onClose,children,title="Decorate your home",description="Choose something you own, then drag it into place."}:{open:boolean;onClose:()=>void;children:ReactNode;title?:string;description?:string}) {
  const titleId=useId();
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
  return <dialog ref={ref} className="decoration-dialog" aria-labelledby={titleId} onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
    <div className="decoration-sheet"><header><div><h2 id={titleId}>{title}</h2><p>{description}</p></div><button type="button" onClick={onClose} aria-label="Close decoration picker">✕</button></header>{children}</div>
  </dialog>;
}
