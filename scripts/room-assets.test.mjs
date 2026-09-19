import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
test('room atlases preserve alpha at delivery resolution and stay within download budget',async()=>{
  const manifest=await readFile('src/components/room/roomAssetUrls.ts','utf8');
  const urls=[...manifest.matchAll(/"(\/assets\/room\/[^"]+\.webp)"/g)].map(m=>m[1]);
  const sources=['public/assets/pets/room-isometric-v2.png','public/assets/pets/room-themes-v1.png','public/assets/pets/room-styles-v1.png','public/assets/pets/room-garden-v1.png','public/assets/pets/room-hobbies-v1.png','public/assets/pets/room-living-v1.png'];
  assert.equal(urls.length,6);
  let total=0;
  for(const [i,url] of urls.entries()) {
    const resized=await sharp(sources[i]).resize({width:1024,withoutEnlargement:true,kernel:'nearest'}).png().toBuffer();
    const original=sharp(resized);const bytes=await readFile(`public${url}`);const packed=sharp(bytes);
    if(i<4) total+=bytes.length;
    assert.ok(bytes.length<250000,'each sheet stays below 250 KB');
    const [a,b]=await Promise.all([original.metadata(),packed.metadata()]);
    assert.equal(a.width,b.width);assert.equal(a.height,b.height);assert.equal(b.hasAlpha,true);
    const [alphaA,alphaB]=await Promise.all([original.extractChannel('alpha').raw().toBuffer(),packed.extractChannel('alpha').raw().toBuffer()]);
    assert.equal(alphaA.equals(alphaB),true,'alpha channel changed');
    assert.equal((await readFile('index.html','utf8')).includes(`href="${url}" fetchpriority="high"`),i<4);
  }
  assert.ok(total<600000,`room artwork exceeded 600 KB budget: ${total}`);
});
