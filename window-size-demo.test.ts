import assert from 'node:assert/strict';
import test from 'node:test';
import { getWindowSizeArg, normalizeWindowSize } from './window-size-demo.ts';

test('reads all supported window-size spellings', () => {
  assert.equal(getWindowSizeArg(['--window_size', '800,600']), '800,600');
  assert.equal(getWindowSizeArg(['--window_size=800,600']), '800,600');
  assert.equal(getWindowSizeArg(['--window-size', '800,600']), '800,600');
  assert.equal(getWindowSizeArg(['--window', 'size', '800,600']), '800,600');
  assert.throws(() => getWindowSizeArg(['--window_size']), /Missing value/);
  assert.throws(() => getWindowSizeArg(['--window', 'size']), /Missing value/);
});

test('normalizes and validates a window size', () => {
  assert.equal(normalizeWindowSize(' 800, 600 '), '800,600');
  assert.throws(() => normalizeWindowSize('800x600'), /Use WIDTH,HEIGHT/);
  assert.throws(() => normalizeWindowSize('0,600'), /greater than zero/);
});
