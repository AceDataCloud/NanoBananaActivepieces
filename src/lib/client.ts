import Ajv2020 from 'ajv/dist/2020';
import { HttpMethod } from '@activepieces/pieces-common';
import { httpClient } from './secure-http';

import { endpoints, serviceName, taskPath, type EndpointSpec } from './contracts';

type Values = Record<string, unknown>;
type JsonSchema = Record<string, unknown>;
type PreparedRequest = {
  method: HttpMethod;
  path: string;
  body: Values;
  query: Values;
  headers: Record<string, string>;
  readOnly: boolean;
  asynchronous: boolean;
  operation: string;
};

export type ActionResult = {
  status: 'pending' | 'succeeded' | 'failed' | 'partial';
  success: boolean;
  task_id: string;
  trace_id: string;
  media_urls: string[];
  data: unknown;
  result: unknown;
};

const ajv = new Ajv2020({ strict: false, allErrors: false });
const completed = new Set(['complete', 'completed', 'succeeded', 'succeed', 'success', 'finished']);
const failed = new Set(['failed', 'error', 'cancelled', 'canceled', 'rejected']);
const pending = new Set(['pending', 'queued', 'running', 'processing', 'submitted', 'in_progress']);
const mediaKeys = new Set(['image_url', 'audio_url', 'video_url', 'file_url', 'raw_image_url', 'url']);
const sensitiveKeys = new Set([
  'request', 'request_body', 'user_id', 'actor_user_id', 'credential_id', 'authorization_id',
  'application_id', 'api_key', 'access_token', 'refresh_token', 'authorization', 'headers',
  'supplier', 'supplier_id', 'provider_route', 'upstream', 'upstream_model', 'actual_model', 'secret',
]);
const sensitivePattern = /(^internal(?:_|$)|supplier|upstream|(?:^|_)secret(?:_|$))/i;

function object(value: unknown): Values {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Values
    : {};
}

function string(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseResponse(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function coerce(value: unknown, name: string, schema: JsonSchema): unknown {
  const type = schema.type;
  const alternatives = [...(Array.isArray(schema.oneOf) ? schema.oneOf : []),
    ...(Array.isArray(schema.anyOf) ? schema.anyOf : [])].map(object);
  const possible = new Set(alternatives.map((item) => item.type));
  if (Array.isArray(type)) type.forEach((item) => possible.add(item));
  if (typeof type === 'string') possible.add(type);
  if (typeof value === 'string' && (possible.has('array') || possible.has('object'))) {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try { return JSON.parse(trimmed); } catch { throw new Error(`${name} must be valid JSON.`); }
    }
    if (possible.has('array') && object(schema.items).type === 'string') {
      return trimmed.split('\n').map((part) => part.trim()).filter(Boolean);
    }
    if (possible.has('object')) throw new Error(`${name} must be a JSON object.`);
  }
  if (typeof value === 'string' && (possible.has('number') || possible.has('integer'))) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${name} must be a number.`);
    return number;
  }
  if (typeof value === 'string' && possible.has('boolean') && ['true', 'false'].includes(value.toLowerCase())) {
    return value.toLowerCase() === 'true';
  }
  return value;
}

function checkSchema(value: unknown, schema: JsonSchema, context: string): void {
  const validate = ajv.compile(schema);
  if (!validate(value)) {
    const error = validate.errors?.[0];
    const location = error?.instancePath ? `${context}${error.instancePath}` : context;
    throw new Error(`Invalid ${location}: does not meet the API ${error?.keyword ?? 'schema'} constraint.`);
  }
}

function allowsProperty(schema: JsonSchema, name: string, values: Values): boolean {
  if (name in object(schema.properties)) return true;
  for (const group of ['oneOf', 'anyOf', 'allOf']) {
    for (const entry of Array.isArray(schema[group]) ? schema[group] as unknown[] : []) {
      const branch = object(entry);
      const props = object(branch.properties);
      const matches = ['action', 'mode'].every((key) => {
        const property = object(props[key]);
        if (!(key in values) || (!('enum' in property) && !('const' in property))) return true;
        return Array.isArray(property.enum) ? property.enum.includes(values[key]) : property.const === values[key];
      });
      if (matches && allowsProperty(branch, name, values)) return true;
    }
  }
  return false;
}

function adapt(_service: string, params: Values, _endpoint: EndpointSpec): Values {
  return { ...params };
}

function finalize(_service: string, body: Values, endpoint: EndpointSpec): void {
  if (endpoint.operation !== 'generate') return;
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) throw new Error('A description is required.');
  if (body.image_urls) throw new Error('This action supports text-to-image only.');
}

export function prepareRequest(tool: string, props: Values): PreparedRequest {
  let endpoint = endpoints[tool];
  if (!endpoint) throw new Error('Unsupported action.');
  const input = Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined && value !== null));
  if (endpoint.selector) {
    const choice = string(input.action) || endpoint.selector_default || '';
    const selected = endpoint.selector[choice];
    if (!selected || !endpoints[selected]) throw new Error('Unsupported operation.');
    endpoint = endpoints[selected];
  }
  const params = adapt(serviceName, input, endpoint);
  const values: Values = { ...(endpoint.defaults ?? {}), ...params, ...(endpoint.fixed ?? {}) };
  const body: Values = {};
  for (const [name, schema] of Object.entries(endpoint.properties)) {
    if (name in values && values[name] !== '') body[name] = coerce(values[name], name, schema);
    else if (name in values && (endpoint.allow_empty ?? []).includes(name)) body[name] = values[name];
  }
  const queryAction = (endpoint.query_actions ?? []).includes(string(values.action));
  if (!queryAction && 'async' in endpoint.properties && allowsProperty(endpoint.schema, 'async', values)) body.async = true;
  if ('stream' in endpoint.properties && allowsProperty(endpoint.schema, 'stream', values)) body.stream = false;
  if ('response_format' in endpoint.properties && endpoint.media_response) body.response_format = 'url';
  let path = endpoint.path;
  const query: Values = {};
  const headers: Record<string, string> = {};
  for (const parameter of endpoint.parameters ?? []) {
    const inputName = parameter.name.toLowerCase() === 'idempotency-key' ? 'idempotency_key' : parameter.name;
    const value = values[inputName];
    if (value === undefined || value === null || value === '') {
      if (parameter.required) throw new Error(`${inputName} is required.`);
      continue;
    }
    const coerced = coerce(value, inputName, parameter.schema ?? {});
    checkSchema(coerced, parameter.schema ?? {}, inputName);
    if (parameter.in === 'path') path = path.replace(`{${parameter.name}}`, encodeURIComponent(String(coerced)));
    else if (parameter.in === 'query') query[parameter.name] = coerced;
    else if (parameter.in === 'header') headers[parameter.name] = String(coerced);
  }
  finalize(serviceName, body, endpoint);
  checkSchema(body, endpoint.schema, 'parameters');
  if (endpoint.destructive || ['delete', 'archive'].includes(string(body.action))) {
    if (params.confirm !== true) throw new Error('Set Confirm to true for deletion or archive.');
  }
  return {
    method: endpoint.method as HttpMethod,
    path,
    body,
    query,
    headers,
    readOnly: endpoint.method === 'GET' || endpoint.read_only === true || queryAction,
    asynchronous: endpoint.asynchronous === true || body.async === true,
    operation: endpoint.operation,
  };
}

async function request(token: string, prepared: PreparedRequest): Promise<unknown> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(prepared.query)) query.set(key, String(value));
  const suffix = query.size ? `?${query.toString()}` : '';
  try {
    const response = await httpClient.sendRequest<unknown>({
      method: prepared.method,
      url: `https://api.acedata.cloud${prepared.path}${suffix}`,
      headers: {
        Authorization: `Bearer ${token.trim().replace(/^Bearer\s+/i, '')}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...prepared.headers,
      },
      body: prepared.method === HttpMethod.GET || prepared.method === HttpMethod.DELETE ? undefined : prepared.body,
      retries: prepared.readOnly ? 2 : 0,
    });
    return response.body;
  } catch (error) {
    const status = object(object(error).response).status;
    const detail = typeof status === 'number' ? `HTTP ${status}` : 'network error';
    throw new Error(`Ace Data Cloud ${detail}. Check service access and request history before resubmitting.`);
  }
}

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(object(value))
    .filter(([key]) => !sensitiveKeys.has(key.toLowerCase()) && !sensitivePattern.test(key))
    .map(([key, child]) => [key, key === 'error' && child ? 'Operation failed; inspect its task or trace ID.' : clean(child)]));
}

function urls(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.flatMap(urls))];
  if (value === null || typeof value !== 'object') return [];
  return [...new Set(Object.entries(object(value)).flatMap(([key, child]) =>
    mediaKeys.has(key) && typeof child === 'string' && /^https?:\/\//.test(child) ? [child] : urls(child)))];
}

function states(value: unknown): { states: string[]; errors: boolean } {
  if (Array.isArray(value)) {
    const parts = value.map(states);
    return { states: parts.flatMap((part) => part.states), errors: parts.some((part) => part.errors) };
  }
  if (value === null || typeof value !== 'object') return { states: [], errors: false };
  const item = object(value);
  const own = ['state', 'status'].map((key) => string(item[key]).toLowerCase()).filter(Boolean);
  const children = ['data', 'content', 'task'].map((key) => states(item[key]));
  return {
    states: [...own, ...children.flatMap((part) => part.states)],
    errors: Boolean(item.error) || (item.success === false && !own.some((state) => pending.has(state))) || children.some((part) => part.errors),
  };
}

export function normalizeResult(body: unknown, taskId: string, options: { retrieved?: boolean; synchronous?: boolean; partialAllowed?: boolean } = {}): ActionResult {
  const envelope = object(body);
  const unfinished = options.retrieved === true && 'finished_at' in envelope && envelope.finished_at === null;
  const result = parseResponse(options.retrieved && 'response' in envelope ? envelope.response : body);
  const value = object(result);
  const outerState = string(envelope.status || envelope.state).toLowerCase();
  const inspected = states(result);
  const media = urls(clean(result));
  const failure = inspected.errors || inspected.states.some((state) => failed.has(state));
  const explicitPending = unfinished || pending.has(outerState);
  const terminalStates = inspected.states.length > 0 && inspected.states.every((state) => completed.has(state) || (options.partialAllowed && failed.has(state)));
  const synchronous = options.synchronous === true && !taskId;
  const done = !explicitPending && (synchronous || terminalStates || (media.length > 0 && inspected.states.length === 0) || (options.retrieved === true && Boolean(envelope.finished_at) && Boolean(result)));
  let status: ActionResult['status'] = 'pending';
  if (failure && !explicitPending && !(options.partialAllowed && media.length > 0 && done)) status = 'failed';
  else if (done && failure) status = 'partial';
  else if (done && (!taskId || media.length > 0 || options.retrieved)) status = 'succeeded';
  const data = 'data' in value ? value.data : 'content' in value ? value.content : result;
  return {
    status,
    success: status === 'succeeded',
    task_id: taskId,
    trace_id: string(value.trace_id || envelope.trace_id),
    media_urls: status === 'succeeded' || status === 'partial' ? media : [],
    data: clean(data),
    result: clean(result),
  };
}

function taskId(body: unknown): string {
  const value = object(body);
  return string(value.task_id) || string(object(value.task).id);
}

export async function invoke(tool: string, props: Values, token: string): Promise<ActionResult> {
  if (!token.trim()) throw new Error('An Ace Data Cloud API key is required.');
  const endpoint = endpoints[tool];
  if (!endpoint) throw new Error('Unsupported action.');
  const partialAllowed = false;
  if (endpoint.operation === 'task') {
    const id = string(props.task_id || props.id).trim();
    const trace = string(props.trace_id).trim();
    if (!id && !trace) throw new Error('A task ID or supported trace ID is required.');
    const lookup: Values = { action: 'retrieve' };
    if (id) lookup.id = id;
    if (trace && 'trace_id' in endpoint.properties) lookup.trace_id = trace;
    const wait = Number(props.wait_seconds ?? 0);
    if (!Number.isInteger(wait) || wait < 0 || wait > 240) throw new Error('Wait seconds must be between 0 and 240.');
    const deadline = Date.now() + wait * 1000;
    while (true) {
      const response = await request(token, { method: HttpMethod.POST, path: taskPath, body: lookup, query: {}, headers: {}, readOnly: true, asynchronous: false, operation: 'task' });
      const result = normalizeResult(response, id || string(object(response).id), { retrieved: true, partialAllowed });
      if (result.status !== 'pending' || Date.now() >= deadline) return result;
      await new Promise((resolve) => setTimeout(resolve, Math.min(5000, Math.max(0, deadline - Date.now()))));
    }
  }
  const prepared = prepareRequest(tool, props);
  const response = await request(token, prepared);
  if (prepared.operation === 'batch') {
    const value = object(response);
    const items = Array.isArray(response) ? response : Array.isArray(value.items) ? value.items : Array.isArray(value.tasks) ? value.tasks : Array.isArray(value.data) ? value.data : [];
    const results = items.map((item: unknown) => normalizeResult(item, taskId(item) || string(object(item).id), { retrieved: true, partialAllowed }));
    const status: ActionResult['status'] = results.some((item: ActionResult) => item.status === 'pending') ? 'pending' : results.some((item: ActionResult) => item.status === 'failed') ? 'failed' : results.some((item: ActionResult) => item.status === 'partial') ? 'partial' : 'succeeded';
    return { status, success: status === 'succeeded', task_id: '', trace_id: '', media_urls: results.flatMap((item: ActionResult) => item.media_urls), data: results, result: { items: results } };
  }
  const id = taskId(response);
  if (prepared.asynchronous && !id && urls(response).length === 0) throw new Error('No task ID or completed result was returned. Inspect request history before submitting again.');
  return normalizeResult(response, id, { synchronous: !prepared.asynchronous, partialAllowed });
}
