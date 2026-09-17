import { test } from 'node:test';
import assert from 'node:assert/strict';
import { animationFrames, sampleAnimation } from '../src/lib/petAnimation.ts';
import { petEmotion } from '../src/lib/petEmotion.ts';
for (const pose of ['feed', 'pet', 'clean']) {
  test(`${pose}: starts neutral, plays distinct drawings, returns to identical idle cell, then completes`, () => {
    const frames = animationFrames(pose);
    const total = frames.reduce((sum, frame) => sum + frame.duration, 0);
    assert.equal(frames[0].cell, 0);
    assert.equal(frames.at(-1).cell, 0);
    assert.ok(new Set(frames.map(frame => frame.cell)).size >= 5);
    assert.deepEqual(sampleAnimation(pose, total - 1), { cell: 0, done: false });
    assert.deepEqual(sampleAnimation(pose, total), { cell: 0, done: true });
    assert.deepEqual(sampleAnimation(pose, total + 50000), { cell: 0, done: true });
    const cells = frames.map(frame => frame.cell);
    assert.deepEqual(cells.slice(1, 4), cells.slice(-4, -1).reverse());
  });
}
test('idle loops indefinitely with actual different frames', () => {
  const frames = animationFrames('idle');
  const duration = frames.reduce((sum, frame) => sum + frame.duration, 0);
  assert.equal(new Set(frames.map(frame => frame.cell)).size, 4);
  for (const time of [0, 1100, 1300, 1500]) assert.deepEqual(sampleAnimation('idle', time), sampleAnimation('idle', time + duration * 100));
});
test('needs prioritize critical health, then lowest unmet need, with happy and calm recovery', () => {
  const healthy = { hunger: 90, cleanliness: 90, happiness: 90, health: 90 };
  assert.equal(petEmotion(healthy), 'happy');
  assert.equal(petEmotion({ ...healthy, health: 10, hunger: 0 }), 'scared');
  assert.equal(petEmotion({ ...healthy, hunger: 15, cleanliness: 25 }), 'hungry');
  assert.equal(petEmotion({ ...healthy, cleanliness: 5 }), 'dirty');
  assert.equal(petEmotion({ ...healthy, happiness: 20 }), 'lonely');
  assert.equal(petEmotion({ ...healthy, happiness: 60 }), 'content');
});
