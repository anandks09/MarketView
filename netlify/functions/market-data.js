export async function handler(event) {
  const { symbol } = event.queryStringParameters || {};
  if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'symbol required' }) };

  const API_KEY = process.env.TWELVEDATA_API_KEY;
  if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const sym = symbol.toUpperCase();

  const CRYPTO = ['BTC','ETH','SOL','BNB','XRP','ADA'];
  const FOREX  = ['EURUSD','GBPUSD','USDJPY','USDCAD','AUDUSD','USDCHF'];

  let tdSymbol;
  if (CRYPTO.includes(sym)) {
    tdSymbol = sym + '/USD';       // e.g. BTC/USD — forces crypto pair, not ETF
  } else if (FOREX.includes(sym)) {
    tdSymbol = sym.slice(0,3) + '/' + sym.slice(3);  // e.g. EUR/USD
  } else {
    tdSymbol = sym;                // stocks as-is e.g. AAPL
  }

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'error') {
      return { statusCode: 200, body: JSON.stringify({ symbol: sym, error: data.message }) };
    }

    const normalized = {
      symbol: sym,
      name: data.name || sym,
      price: parseFloat(parseFloat(data.close || data.price || 0).toFixed(4)),
      open: parseFloat(data.open || 0),
      high: parseFloat(data.high || 0),
      low: parseFloat(data.low || 0),
      change: parseFloat(data.change || 0),
      change_percent: parseFloat(parseFloat(data.percent_change || 0).toFixed(2)),
      volume: parseInt(data.volume || 0),
      exchange: data.exchange || '',
      updated: data.datetime || new Date().toISOString(),
    };

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
    return { statusCode: 500, body: JSON.stringify({ error: 'Fetch failed', detail: err.message }) };
  }
}
