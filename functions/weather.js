export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city') || '';

  const target = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${env.OWM_KEY}&lang=ru`;

  const r = await fetch(target);
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': 'application/json' },
  });
}
