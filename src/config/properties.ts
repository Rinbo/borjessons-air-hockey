export default function properties() {
  const restBaseUrl = import.meta.env.VITE_REST_API_URL;
  const wsBaseUrl = import.meta.env.VITE_WS_API_URL;
  const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!restBaseUrl || !wsBaseUrl) throw new Error('unable to load runtime properties');

  return { restBaseUrl, wsBaseUrl, gatewayUrl, googleClientId };
}
