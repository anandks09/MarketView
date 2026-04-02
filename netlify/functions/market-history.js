export async function handler(event) {
  const { symbol, range } = event.queryStringParameters || {};
  if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'symbol required' }) };

  const API_KEY = process.env.TWELVEDATA_API_KEY;
  if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const sym = symbol.toUpperCase();
  const FOREX = ['EURUSD','GBPUSD','USDJPY','USDCAD','AUDUSD','USDCHF'];
  const isForex = FOREX.includes(sym);
  const tdSymbol = isForex ? sym.slice(0,3) + '/' + sym.slice(3) : sym;

  // Map range to Twelve Data interval + outputsize
  const rangeMap = {
    '1D': { interval: '5min',  outputsize: 78  },
    '1W': { interval: '1h',    outputsize: 42  },
    '1M': { interval: '1day',  outputsize: 30  },
    '3M': { interval: '1day',  outputsize: 90  },
  };
  const { interval, outputsize } = rangeMap[range] || rangeMap['3M'];

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${tdSymbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'error') {
      return { statusCode: 200, body: JSON.stringify({ symbol: sym, error: data.message, candles: [] }) };
    }

    // Twelve Data returns newest first — reverse to oldest first for chart
    const candles = (data.values || []).reverse().map(v => ({
      t: v.datetime,
      o: parseFloat(v.open),
      h: parseFloat(v.high),
      l: parseFloat(v.low),
      c: parseFloat(v.close),
      v: parseInt(v.volume || 0),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
      body: JSON.stringify({ symbol: sym, interval, candles }),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Fetch failed', detail: err.message }) };
  }
}
