export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  const injected = html.replace(
    '%%SUPABASE_ANON_KEY%%',
    supabaseKey
  );

  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(injected, {
    status: response.status,
    headers,
  });
};

export const config = { path: '/' };
