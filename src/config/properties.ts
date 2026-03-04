export default function properties() {
  const restBaseUrl = import.meta.env.VITE_REST_API_URL;
  const wsBaseUrl = import.meta.env.VITE_WS_API_URL;
  const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const devMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!restBaseUrl || !wsBaseUrl) throw new Error('unable to load runtime properties');

  return { restBaseUrl, wsBaseUrl, gatewayUrl, googleClientId, devMode };
}
