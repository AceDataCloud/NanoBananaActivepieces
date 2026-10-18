const assert = require('node:assert/strict');
const test = require('node:test');
const { prepareRequest, normalizeResult } = require('../dist/src/lib/client.js');
test('creation rejects missing prompt and invalid public parameters', () => {
  assert.throws(() => prepareRequest('nano_banana_generate_image', {}), /description|model|Invalid/);
  assert.throws(() => prepareRequest('nano_banana_generate_image', {prompt:'Test', model:'unapproved-model'}), /model|Invalid/);
  assert.throws(() => prepareRequest('nano_banana_generate_image', {prompt:'Test', count:5}), /Invalid/);
});
test('pending preview cannot be exposed as final output', () => {
  const result=normalizeResult({finished_at:null,response:{state:'succeeded',data:[{image_url:'https://example.com/preview.png'}]}},'same-id',{retrieved:true});
  assert.equal(result.status,'pending');assert.deepEqual(result.media_urls,[]);
});
test('terminal failure preserves failed state and hides media', () => {
  const result=normalizeResult({finished_at:'2026-10-18',response:{state:'failed',error:'private',image_url:'https://example.com/preview.png'}},'same-id',{retrieved:true});
  assert.equal(result.status,'failed');assert.deepEqual(result.media_urls,[]);assert.equal(JSON.stringify(result).includes('private'),false);
});
