export async function handler(event) {
  const { symbol } = event.queryStringParameters || {};
  if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'symbol required' }) };

  const API_KEY = process.env.FINAGE_API_KEY;
  if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  try {
    let url;
    const sym = symbol.toUpperCase();

    if (['AAPL','MSFT','TSLA','NVDA','GOOGL','AMZN'].includes(sym)) {
      url = `https://api.finage.co.uk/last/stock/${sym}?apikey=${API_KEY}`;
    } else if (['BTC','ETH','SOL','BNB','XRP','ADA'].includes(sym)) {
      url = `https://api.finage.co.uk/last/crypto/${sym}USD?apikey=${API_KEY}`;
    } else {
      url = `https://api.finage.co.uk/last/forex/${sym}?apikey=${API_KEY}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=15',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Fetch failed', detail: err.message }) };
  }
}
