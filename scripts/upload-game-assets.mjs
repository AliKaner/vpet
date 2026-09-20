import { readdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
// Explicit deployment name is required; no implicit production selection.
const deployment=process.argv[2];
if(!['cool-guanaco-364','adorable-puma-797'].includes(deployment)) throw Error('Pass an explicitly verified deployment name.');
function run(name,args) {
  const result=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args),'--deployment',deployment,'--codegen','disable'],{encoding:'utf8',maxBuffer:4*1024*1024});
  if(result.status!==0) throw Error(result.stderr||'Convex command failed');
  return JSON.parse(result.stdout);
}
const files=[];
async function walk(dir) {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) await walk(file);
    else if(/\.(png|webp|svg)$/.test(file)) {const bytes=await readFile(file);files.push({path:'/'+file.replaceAll('\\','/').replace(/^public\//,''),sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length,bytes});}
  }
}
await walk('public/assets');
const prepared=run('assets:prepare',{files:files.map(({bytes:_bytes,...metadata})=>metadata)}),uploaded=[];
for(let i=0;i<prepared.length;i+=4) {
  await Promise.all(prepared.slice(i,i+4).map(async item=>{
    if(!item.uploadUrl)return;
    const file=files.find(f=>f.path===item.path),extension=path.extname(item.path);
    const response=await fetch(item.uploadUrl,{method:'POST',headers:{'Content-Type':extension==='.svg'?'image/svg+xml':extension==='.webp'?'image/webp':'image/png'},body:file.bytes});
    if(!response.ok) throw Error(`Upload failed: ${item.path} (${response.status})`);
    const {storageId}=await response.json();const {bytes:_bytes,...metadata}=file;uploaded.push({...metadata,storageId});
  }));
}
if(uploaded.length) run('assets:register',{files:uploaded});
const urls=run('assets:manifest',{});
// Verify byte-for-byte delivery before generating the client manifest.
for(let i=0;i<files.length;i+=4) await Promise.all(files.slice(i,i+4).map(async file=>{
  const response=await fetch(urls[file.path]);if(!response.ok)throw Error(`Missing asset: ${file.path}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error(`Asset checksum mismatch: ${file.path}`);
}));
const manifestPath='src/lib/storageAssetUrls.json';let manifests={};
try {manifests=JSON.parse(await readFile(manifestPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
manifests[deployment]=urls;
await writeFile(manifestPath,JSON.stringify(manifests,null,2)+'\n');
console.log(`${deployment}: ${uploaded.length} uploaded, ${files.length} verified (${Math.round(files.reduce((sum,f)=>sum+f.size,0)/1024/1024)} MB). Client manifest updated.`);
