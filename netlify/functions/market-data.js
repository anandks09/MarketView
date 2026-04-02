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
    tdSymbol = sym + '/USD';
  } else if (FOREX.includes(sym)) {
    tdSymbol = sym.slice(0,3) + '/' + sym.slice(3);
  } else {
    tdSymbol = sym;
  }

  try {
    // Fetch both real-time price AND quote for change %
    const [priceRes, quoteRes] = await Promise.all([
      fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(tdSymbol)}&apikey=${API_KEY}`),
      fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${API_KEY}`)
    ]);

    const priceData = await priceRes.json();
    const quoteData = await quoteRes.json();

    if (quoteData.status === 'error') {
      return { statusCode: 200, body: JSON.stringify({ symbol: sym, error: quoteData.message }) };
    }

    // Use real-time /price endpoint for the actual current price
    const livePrice = priceData.price ? parseFloat(parseFloat(priceData.price).toFixed(4)) : parseFloat(parseFloat(quoteData.close || 0).toFixed(4));

    const normalized = {
      symbol: sym,
      name: quoteData.name || sym,
      price: livePrice,
      open: parseFloat(quoteData.open || 0),
      high: parseFloat(quoteData.high || 0),
      low: parseFloat(quoteData.low || 0),
      change: parseFloat(quoteData.change || 0),
      change_percent: parseFloat(parseFloat(quoteData.percent_change || 0).toFixed(2)),
      volume: parseInt(quoteData.volume || 0),
      exchange: quoteData.exchange || '',
      updated: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(normalized),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Fetch failed', detail: err.message }) };
  }
}
