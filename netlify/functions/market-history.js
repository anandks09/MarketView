export async function handler(event) {
  const { symbol, from, to } = event.queryStringParameters || {};
  if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'symbol required' }) };

  const API_KEY = process.env.FINAGE_API_KEY;
  if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const sym = symbol.toUpperCase();
  const startDate = from || new Date(Date.now() - 90*86400000).toISOString().split('T')[0];
  const endDate   = to   || new Date().toISOString().split('T')[0];

  try {
    let url;
    if (['AAPL','MSFT','TSLA','NVDA','GOOGL','AMZN'].includes(sym)) {
      url = `https://api.finage.co.uk/history/stock/candle/${sym}?startDate=${startDate}&endDate=${endDate}&limit=90&apikey=${API_KEY}`;
    } else if (['BTC','ETH','SOL','BNB','XRP','ADA'].includes(sym)) {
      url = `https://api.finage.co.uk/history/crypto/candle/${sym}USD?startDate=${startDate}&endDate=${endDate}&limit=90&apikey=${API_KEY}`;
    } else {
      url = `https://api.finage.co.uk/history/forex/candle/${sym}?startDate=${startDate}&endDate=${endDate}&limit=90&apikey=${API_KEY}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Fetch failed', detail: err.message }) };
  }
}
