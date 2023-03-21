export default function properties() {
  const restBaseUrl = import.meta.env.VITE_REST_API_URL;
  const wsBaseUrl = import.meta.env.VITE_WS_API_URL;

  if (!restBaseUrl || !wsBaseUrl) throw new Error('unable to load runtime properties');

  return { restBaseUrl, wsBaseUrl };
}
