import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const targets = await (await fetch('http://127.0.0.1:9234/json')).json();
const target = targets.find(target => target.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.id) { const item = pending.get(message.id); pending.delete(message.id); if (message.error) item.reject(message.error); else item.resolve(message.result); }
});
function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1100, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:5178/animation-preview.html' });
await evaluate(`new Promise(resolve => { const interval = setInterval(() => { if (document.querySelector('.pet-sprite')) { clearInterval(interval); resolve(true); } }, 100); })`);
const idleCells = await evaluate(`new Promise(resolve => { const cells = new Set(); const start = performance.now(); const timer = setInterval(() => { cells.add(document.querySelector('.pet-sprite').dataset.cell); if (performance.now() - start > 2200) { clearInterval(timer); resolve([...cells]); } }, 40); })`);
assert.ok(idleCells.length >= 3, `idle had only ${idleCells}`);
console.log('PASS: actual idle drawing changes', idleCells);
for (const species of ['cat','dog','bird','snake','mouse','horse']) {
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === '${species}').click()`);
  for (const pose of ['feed','pet','clean']) {
    const playback = await evaluate(`new Promise(resolve => { const cells = []; const button = [...document.querySelectorAll('button')].find(button => button.textContent === '${pose}'); button.click(); const start = performance.now(); const timer = setInterval(() => { const sprite = document.querySelector('.pet-sprite'); if (sprite.dataset.pose === '${pose}') cells.push(Number(sprite.dataset.cell)); if ((cells.length && document.querySelector('[data-testid="playback-status"]').textContent === 'Idle loop') || performance.now() - start > 8000) { clearInterval(timer); resolve({ cells, status: document.querySelector('[data-testid="playback-status"]').textContent }); } }, 30); })`);
    assert.equal(playback.status, 'Idle loop', `${species} ${pose} did not finish`);
    assert.ok(new Set(playback.cells).size >= 5, `${species} ${pose} did not animate`);
    assert.equal(playback.cells.at(-1), 0, `${species} ${pose} did not end neutral`);
    console.log(`PASS: ${species} ${pose} → neutral → idle`);
  }
}
for (const [species,label,filename] of [['cat','Silver tabby','cat-silver'],['dog','Chocolate puppy','dog-chocolate'],['bird','Sunshine yellow','bird-sunny']]) {
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === '${species}').click()`);
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === '${label}').click()`);
  const source = await evaluate(`document.querySelector('.pet-sprite').style.backgroundImage`);
  assert.ok(source.includes(filename), source);
  console.log(`PASS: ${species} appearance switches atlas`);
}
for (const emotion of ['hungry','dirty','lonely','scared','happy']) {
  const result = await evaluate(`new Promise(resolve => { const select = document.querySelector('select'); const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; setter.call(select,'${emotion}'); select.dispatchEvent(new Event('change',{bubbles:true})); const cells = new Set(); const start = performance.now(); const timer = setInterval(() => { const sprite = document.querySelector('.pet-sprite'); cells.add(Number(sprite.dataset.cell)); if (performance.now()-start>2400) { clearInterval(timer); resolve({ source: sprite.style.backgroundImage, cells: [...cells] }); } },50); })`);
  assert.ok(result.source.includes('moods-variants'), result.source);
  assert.ok(result.cells.length >= 2, `${emotion} does not animate`);
  console.log(`PASS: ${emotion} uses animated matching variant`);
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
await writeFile('node_modules/.tmp/pet-animation-desktop.png', Buffer.from(shot.data, 'base64'));
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evaluate(`new Promise(resolve => setTimeout(resolve, 250))`);
assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'mobile overflows');
const mobile = await send('Page.captureScreenshot', { format: 'png' });
await writeFile('node_modules/.tmp/pet-animation-mobile.png', Buffer.from(mobile.data, 'base64'));
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
const reduced = await evaluate(`new Promise(resolve => { const cells = new Set(); const start = performance.now(); const timer=setInterval(()=>{cells.add(document.querySelector('.pet-sprite').dataset.cell);if(performance.now()-start>2300){clearInterval(timer);resolve([...cells]);}},100);})`);
assert.equal(reduced.length, 1, 'reduced motion continues animating');
assert.deepEqual(errors, []);
console.log('PASS: mobile layout, reduced motion, zero browser exceptions');
ws.close();
