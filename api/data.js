export default function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || 'isaiah-botter.vercel.app'}`);
  const launchedAt = Number(url.searchParams.get('at'));
  const isFresh = Number.isFinite(launchedAt) && Date.now() - launchedAt < 3000;

  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.setHeader('Refresh', '3');

  if (!isFresh) {
    response.status(200).send('');
    return;
  }

  const code = url.searchParams.get('code') || '';
  const amount = url.searchParams.get('amount') || '';
  const name = url.searchParams.get('name') || '';
  response.status(200).send(`${code}\n${amount}\n${name}`);
}
