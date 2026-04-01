export async function handler(event) {
  const { symbol } = event.queryStringParameters || {};
  if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'symbol required' }) };

  const API_KEY = process.env.FINAGE_API_KEY;
  if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const sym = symbol.toUpperCase();

  const CRYPTO = ['BTC','ETH','SOL','BNB','XRP','ADA'];
  const FOREX  = ['EURUSD','GBPUSD','USDJPY','USDCAD','AUDUSD','USDCHF'];
  const STOCKS = ['AAPL','MSFT','TSLA','NVDA','GOOGL','AMZN'];

  try {
    let url;

    if (STOCKS.includes(sym)) {
      url = `https://api.finage.co.uk/detail/stock/${sym}?apikey=${API_KEY}`;
    } else if (CRYPTO.includes(sym)) {
      url = `https://api.finage.co.uk/last/crypto/${sym}USD?apikey=${API_KEY}`;
    } else if (FOREX.includes(sym)) {
      url = `https://api.finage.co.uk/last/forex/${sym}?apikey=${API_KEY}`;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported symbol' }) };
    }

    const res = await fetch(url);
    const data = await res.json();

    // Normalise so frontend always gets { symbol, price, change_percent }
    let normalized = { symbol: sym, raw: data };

    if (data.c) {
      // Stock detail: c = current, pc = previous close
      normalized.price = data.c;
      normalized.change_percent = data.pc
        ? parseFloat((((data.c - data.pc) / data.pc) * 100).toFixed(2))
        : 0;
    } else if (data.p) {
      // Crypto/Forex last: p = price
      normalized.price = data.p;
      normalized.change_percent = data.dp || 0;
    } else if (data.price) {
      normalized.price = data.price;
      normalized.change_percent = data.change_percent || 0;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
      body: JSON.stringify(normalized),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fetch failed', detail: err.message }),
    };
  }
}
