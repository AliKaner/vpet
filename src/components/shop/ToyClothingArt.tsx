// Hand-drawn vector icons for toys/clothing, in the same warm flat-shape style as
// the inline SVG fallbacks in room/FurnitureArt.tsx (used there for decor items not
// yet covered by the generated room atlas). No image-generation tool is available
// here, so this is the "real art instead of an emoji" treatment for this catalog
// section - simple, consistent, hand-authored shapes rather than a system glyph.
import type { ReactNode } from "react";

const OUTLINE = "#8e735e";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 120 116" aria-hidden="true" className="furniture-art">
      {children}
    </svg>
  );
}

const TOY_CLOTHING_ART: Record<string, ReactNode> = {
  toy_ball: (
    <Icon>
      <circle cx="60" cy="58" r="30" fill="#f2905f" stroke={OUTLINE} strokeWidth="5" />
      <path d="M34 46q26 14 52 0M34 70q26-14 52 0" fill="none" stroke="#fff1d4" strokeWidth="4" />
    </Icon>
  ),
  toy_puzzle: (
    <Icon>
      <rect x="30" y="30" width="60" height="56" rx="14" fill="#9ec29a" stroke={OUTLINE} strokeWidth="5" />
      <circle cx="48" cy="50" r="6" fill="#fff1d4" />
      <circle cx="72" cy="50" r="6" fill="#fff1d4" />
      <circle cx="60" cy="70" r="6" fill="#fff1d4" />
    </Icon>
  ),
  toy_scratcher: (
    <Icon>
      <ellipse cx="60" cy="92" rx="26" ry="8" fill="#d9a86c" stroke={OUTLINE} strokeWidth="4" />
      <rect x="46" y="20" width="28" height="66" rx="10" fill="#d9a86c" stroke={OUTLINE} strokeWidth="5" />
      <path d="M48 30l24 12M48 46l24 12M48 62l24 12" stroke="#a97b4f" strokeWidth="3" />
    </Icon>
  ),
  cloth_bow: (
    <Icon>
      <path d="M60 58 20 32v52Z" fill="#d4a2b4" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M60 58 100 32v52Z" fill="#d4a2b4" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="60" cy="58" r="11" fill="#f2905f" stroke={OUTLINE} strokeWidth="4" />
    </Icon>
  ),
  cloth_cap: (
    <Icon>
      <path d="M24 66a36 30 0 0 1 72 0Z" fill="#bce0e5" stroke={OUTLINE} strokeWidth="5" />
      <path d="M22 66h76" stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="34" r="6" fill="#fff1d4" stroke={OUTLINE} strokeWidth="3" />
    </Icon>
  ),
  cloth_scarf: (
    <Icon>
      <path d="M26 30q34 20 68 0l-10 56q-24 14-48 0Z" fill="#f2905f" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M40 78v14M50 84v14M60 86v14M70 84v14" stroke="#fff1d4" strokeWidth="4" strokeLinecap="round" />
    </Icon>
  ),
  cloth_hoodie: (
    <Icon>
      <path d="M60 20c-14 0-22 10-22 22l-16 10 8 12 8-6v34h44V58l8 6 8-12-16-10c0-12-8-22-22-22Z" fill="#9ec29a" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="52" cy="52" r="3" fill="#fff1d4" />
      <circle cx="68" cy="52" r="3" fill="#fff1d4" />
    </Icon>
  ),
  cloth_raincoat: (
    <Icon>
      <path d="M60 22c-16 0-26 10-26 24v40h52V46c0-14-10-24-26-24Z" fill="#bce0e5" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M44 30 34 44M60 26v10M76 30l10 14" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M46 78v8M60 82v8M74 78v8" stroke="#fff1d4" strokeWidth="4" strokeLinecap="round" />
    </Icon>
  ),
  cloth_crown: (
    <Icon>
      <path d="M26 78 20 42l20 16 20-26 20 26 20-16-6 36Z" fill="#f2bb4e" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="60" cy="60" r="6" fill="#d4a2b4" />
      <circle cx="40" cy="66" r="4" fill="#d4a2b4" />
      <circle cx="80" cy="66" r="4" fill="#d4a2b4" />
    </Icon>
  ),
  cloth_pajamas: (
    <Icon>
      <path d="M44 22 28 34l8 14 10-6v46h28V42l10 6 8-14-16-12-10 8-12-8Z" fill="#d4a2b4" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="52" cy="60" r="3" fill="#fff1d4" />
      <path d="M66 56a5 5 0 1 0 6 6 6 6 0 0 1-6-6Z" fill="#fff1d4" />
    </Icon>
  ),
  cloth_overalls: (
    <Icon>
      <path d="M38 30h44v56H38Z" fill="#bce0e5" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M44 30 40 14M76 30l4-16" stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <rect x="50" y="52" width="20" height="16" rx="3" fill="#fff1d4" stroke={OUTLINE} strokeWidth="3" />
    </Icon>
  ),
  cloth_sweater: (
    <Icon>
      <path d="M60 24c-14 0-22 8-22 18l-14 10 8 12 8-6v40h40V58l8 6 8-12-14-10c0-10-8-18-22-18Z" fill="#d4a2b4" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M46 42h28" stroke="#fff1d4" strokeWidth="4" strokeLinecap="round" />
    </Icon>
  ),
  cloth_vest: (
    <Icon>
      <path d="M46 24 60 36 74 24l10 8-10 62H46L36 32Z" fill="#9ec29a" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="60" cy="56" r="3" fill="#fff1d4" />
      <circle cx="60" cy="70" r="3" fill="#fff1d4" />
    </Icon>
  ),
};

export function ToyClothingArt({ id }: { id: string }) {
  return TOY_CLOTHING_ART[id] ?? <Icon><circle cx="60" cy="58" r="30" fill="#fff1d4" stroke={OUTLINE} strokeWidth="5" /></Icon>;
}
