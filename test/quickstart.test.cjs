const assert = require('node:assert/strict');
const test = require('node:test');
const flow = require('../examples/quickstart.json');
const { piece } = require('../dist/src/index.js');
const { prepareRequest, invoke } = require('../dist/src/lib/client.js');
const { httpClient } = require('../dist/src/lib/secure-http.js');

test('quickstart prepares a valid generation and queries its same task without paid retries', async () => {
  const create = flow.flows[0].trigger.nextAction;
  const lookup = create.nextAction;
  assert.equal(create.settings.actionName, 'nano_banana_generate_image');
  assert.ok(piece.getAction(create.settings.actionName));
  assert.ok(piece.getAction(lookup.settings.actionName));
  assert.equal(create.settings.input.auth, '');
  assert.equal(lookup.settings.input.auth, '');
  assert.equal(lookup.settings.input.task_id, "{{step_1['output']['task_id']}}");
  assert.equal(create.settings.errorHandlingOptions.retryOnFailure.value, false);
  const prepared = prepareRequest(create.settings.actionName, create.settings.input);
  assert.equal(prepared.body.async, true);
  assert.equal(prepared.body.layer_decomposition, undefined);
  assert.equal(prepared.body.background, undefined);


  const original = httpClient.sendRequest;
  const requests = [];
  httpClient.sendRequest = async (request) => {
    requests.push(request);
    return request.url.endsWith('/nano-banana/images')
      ? { body: { task_id: 'quickstart-task' } }
      : { body: { finished_at: '2026-10-17T00:00:00Z', response: {
        state: 'succeeded', data: [{ image_url: 'https://example.com/final.png' }],
      } } };
  };
  try {
    const created = await invoke(create.settings.actionName, create.settings.input, 'offline-test');
    const result = await invoke(lookup.settings.actionName,
      { ...lookup.settings.input, task_id: created.task_id }, 'offline-test');
    assert.equal(result.status, 'succeeded');
    assert.deepEqual(result.media_urls, ['https://example.com/final.png']);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].retries, 0);
    assert.deepEqual(requests[1].body, { action: 'retrieve', id: 'quickstart-task' });
  } finally {
    httpClient.sendRequest = original;
  }
});
