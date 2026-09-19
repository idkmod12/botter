let latestPayload = null;

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || 'isaiah-botter.vercel.app'}`);

  if (request.method === 'POST') {
    try {
      latestPayload = { ...await readJson(request), launchedAt: Date.now() };
      response.status(204).end();
    } catch {
      response.status(400).json({ error: 'Invalid payload' });
    }
    return;
  }

  const queryLaunchedAt = Number(url.searchParams.get('at'));
  const launchedAt = latestPayload?.launchedAt || queryLaunchedAt;
  const isFresh = Number.isFinite(launchedAt) && Date.now() - launchedAt < 3000;

  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.setHeader('Refresh', '3');

  if (!isFresh) {
    response.status(200).send('');
    return;
  }

  const code = latestPayload?.code || url.searchParams.get('code') || '';
  const amount = latestPayload?.amount || url.searchParams.get('amount') || '';
  const name = latestPayload?.name || url.searchParams.get('name') || '';
  response.status(200).send(`${code}\n${amount}\n${name}`);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}
