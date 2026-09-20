import { v,ConvexError } from "convex/values";
import { internalMutation,query } from "./_generated/server";
const entry=v.object({path:v.string(),sha256:v.string(),size:v.number()});
function validate(path:string,size:number) {
  if(!/^\/assets\/[a-zA-Z0-9_./-]+\.(png|webp|svg)$/.test(path)||path.includes("..")||size<=0||size>15_000_000) throw new ConvexError("Invalid game asset.");
}
// Internal functions are callable only through administrator tooling, never by players.
export const prepare=internalMutation({args:{files:v.array(entry)},returns:v.array(v.object({path:v.string(),uploadUrl:v.union(v.string(),v.null())})),handler:async(ctx,{files})=>{
  if(files.length>100) throw new ConvexError("Too many assets.");
  return await Promise.all(files.map(async file=>{
    validate(file.path,file.size);
    const row=await ctx.db.query("gameAssets").withIndex("by_path",q=>q.eq("path",file.path)).unique();
    const exists=row&&row.sha256===file.sha256&&await ctx.storage.getUrl(row.storageId);
    return {path:file.path,uploadUrl:exists?null:await ctx.storage.generateUploadUrl()};
  }));
}});
export const register=internalMutation({args:{files:v.array(v.object({...entry.fields,storageId:v.id("_storage")}))},returns:v.number(),handler:async(ctx,{files})=>{
  if(files.length>100) throw new ConvexError("Too many assets.");
  for(const file of files) {
    validate(file.path,file.size);
    const metadata=await ctx.db.system.get(file.storageId);
    if(!metadata||metadata.size!==file.size) throw new ConvexError("Uploaded file size does not match.");
    const row=await ctx.db.query("gameAssets").withIndex("by_path",q=>q.eq("path",file.path)).unique();
    if(row) await ctx.db.patch(row._id,file);else await ctx.db.insert("gameAssets",file);
  }
  return files.length;
}});
export const manifest=query({args:{},returns:v.record(v.string(),v.string()),handler:async ctx=>{
  const files=await ctx.db.query("gameAssets").withIndex("by_path").take(100);
  const entries=await Promise.all(files.map(async file=>[file.path,await ctx.storage.getUrl(file.storageId)] as const));
  return Object.fromEntries(entries.filter((entry):entry is readonly[string,string]=>entry[1]!==null));
}});
