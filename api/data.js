let latestPayload = null;

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || 'isaiah-botter.vercel.app'}`);

  if (request.method === 'POST') {
    try {
      const payload = await readJson(request);
      if (payload.stop === true) {
        const stopMode = String(payload.mode || 'K').toUpperCase();
        latestPayload = { stop: true, mode: ['K', 'W', 'DN'].includes(stopMode) ? stopMode : 'K', launchedAt: Date.now() };
        response.status(204).end();
        return;
      }
      const amount = Number(payload.amount);
      if (!Number.isInteger(amount) || amount < 1 || amount > 50) {
        response.status(400).json({ error: 'Amount must be between 1 and 50' });
        return;
      }
      const name = String(payload.name || '');
      if (name.length > 13) {
        response.status(400).json({ error: 'Name must be 13 characters or fewer' });
        return;
      }
      const mode = String(payload.mode || 'K').toUpperCase();
      if (!['K', 'W', 'DN'].includes(mode)) {
        response.status(400).json({ error: 'Mode must be K, W, or DN' });
        return;
      }
      latestPayload = { ...payload, amount, name, mode, launchedAt: Date.now() };
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

  if (latestPayload?.stop === true) {
    response.status(200).send(`stop\n${latestPayload.mode || 'K'}`);
    return;
  }

  const code = latestPayload?.code || url.searchParams.get('code') || '';
  const amount = latestPayload?.amount || url.searchParams.get('amount') || '';
  const name = latestPayload?.name || url.searchParams.get('name') || '';
  const mode = latestPayload?.mode || url.searchParams.get('mode') || 'K';
  response.status(200).send(`${code}\n${amount}\n${name}\n${mode}`);
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
