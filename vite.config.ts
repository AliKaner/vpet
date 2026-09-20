import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig,loadEnv } from 'vite'
import { readFileSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  const deployment=new URL(env.VITE_CONVEX_URL||'https://local.invalid').hostname.split('.')[0];
  const manifests=JSON.parse(readFileSync('src/lib/storageAssetUrls.json','utf8')) as Record<string,Record<string,string>>;
  return {plugins:[react(),tailwindcss(),{name:'storage-asset-preloads',transformIndexHtml(html,ctx){
    if(ctx.path.endsWith('-preview.html'))return html;
    return html.replace(/href="(\/assets\/[^"]+)"/g,(original,path:string)=>manifests[deployment]?.[path]?`href="${manifests[deployment][path]}"`:original);
  }}]};
})
