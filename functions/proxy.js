const API_BASE = 'https://api.magnific.com';

const IMAGE_MODEL = {
  create: '/v1/ai/text-to-image/nano-banana-pro-flash',
  status: (taskId) => `/v1/ai/text-to-image/nano-banana-pro-flash/${encodeURIComponent(taskId)}`,
  list: '/v1/ai/text-to-image/nano-banana-pro-flash',
};

function json(code, body) {
  return {
    statusCode: code,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type,x-proxy-api-key,x-magnific-api-key',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

async function callMagnific(method, path, apiKey, payload) {
  const headers = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-magnific-api-key': apiKey,
    'user-agent': 'Mozilla/5.0 MagnificNanoProxy/1.0',
  };
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: payload == null ? undefined : JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text || '{}'); }
  catch (_) { data = { raw: text.slice(0, 2000) }; }
  return json(res.status, data);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  const apiKey = (event.headers['x-proxy-api-key'] || event.headers['X-Proxy-Api-Key'] || event.headers['x-magnific-api-key'] || '').trim();
  if (!apiKey) return json(401, { error: 'missing x-proxy-api-key' });

  const rawPath = event.path || '';
  const marker = '/.netlify/functions/proxy';
  let path = rawPath.includes(marker) ? rawPath.split(marker)[1] : rawPath;
  path = path || '/';

  try {
    // Health / docs
    if (event.httpMethod === 'GET' && (path === '/' || path === '')) {
      return json(200, {
        ok: true,
        endpoints: [
          'POST /generate-image',
          'GET /status-image/:taskId',
          'GET /tasks-image',
          'GET /validate'
        ],
        model: 'nano-banana-pro-flash',
      });
    }

    // Validate key against task list endpoint
    if (event.httpMethod === 'GET' && path === '/validate') {
      return await callMagnific('GET', IMAGE_MODEL.list, apiKey);
    }

    // Create Nano Banana image task
    if (event.httpMethod === 'POST' && path === '/generate-image') {
      const body = event.body ? JSON.parse(event.body) : {};
      const payload = {
        prompt: String(body.prompt || '').trim(),
        aspect_ratio: body.aspect_ratio || '1:1',
        resolution: body.resolution || '1K',
        use_google_search_tool: true,
      };
      if (!payload.prompt) return json(400, { error: 'prompt required' });
      if (Array.isArray(body.reference_images) && body.reference_images.length) {
        payload.reference_images = body.reference_images;
      }
      return await callMagnific('POST', IMAGE_MODEL.create, apiKey, payload);
    }

    // Get task status by ID
    if (event.httpMethod === 'GET' && path.startsWith('/status-image/')) {
      const taskId = decodeURIComponent(path.split('/status-image/')[1] || '').trim();
      if (!taskId) return json(400, { error: 'task_id required' });
      return await callMagnific('GET', IMAGE_MODEL.status(taskId), apiKey);
    }

    // List tasks
    if (event.httpMethod === 'GET' && path === '/tasks-image') {
      return await callMagnific('GET', IMAGE_MODEL.list, apiKey);
    }

    return json(404, { error: 'not found', path });
  } catch (e) {
    return json(500, { error: e.message || String(e) });
  }
};
