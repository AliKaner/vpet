import manifests from "./storageAssetUrls.json";
const maps=manifests as Record<string,Record<string,string>>;
// Standalone art preview pages intentionally compare the checked-in source artwork.
const deployment=typeof location!=="undefined"&&location.pathname.endsWith('-preview.html')?"":new URL(import.meta.env.VITE_CONVEX_URL||"https://local.invalid").hostname.split('.')[0];
export const gameAssetUrl=(path:string)=>maps[deployment]?.[path]??path;
