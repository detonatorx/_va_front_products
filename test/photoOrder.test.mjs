import { test } from 'node:test';
import assert from 'node:assert/strict';
import { movePhoto, orderPhotos } from '../src/utils/photoOrder.mjs';

test('moves photos both ways and moves a selected main photo to the first position', () => {
  assert.deepEqual(movePhoto(['a', 'b', 'c', 'd'], 'a', 'c'), ['b', 'c', 'a', 'd']);
  assert.deepEqual(movePhoto(['a', 'b', 'c', 'd'], 'd', 'b'), ['a', 'd', 'b', 'c']);
  assert.deepEqual(movePhoto(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b']);
  assert.deepEqual(movePhoto(['a', 'b'], 'missing', 'a'), ['a', 'b']);
});

test('keeps saved and pending photos in one order across server updates and deletion', () => {
  const saved = { id: 'saved', is_primary: true };
  const pending = { id: 'pending', blob: {} };
  const other = { id: 'other' };
  assert.deepEqual(orderPhotos([saved, other, pending], ['pending', 'other', 'saved']), [
    pending,
    other,
    saved
  ]);
  assert.deepEqual(orderPhotos([saved, other], ['pending', 'other', 'saved']), [other, saved]);
  assert.deepEqual(orderPhotos([saved, pending, other], ['saved']), [saved, pending, other]);
});
