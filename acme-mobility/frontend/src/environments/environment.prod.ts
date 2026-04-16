// wsBase is computed at runtime so window is always available in the browser
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const environment = {
  production: true,
  apiBase: '/api',
  wsBase: `${wsProtocol}//${window.location.host}/ws/vehicles`,
  appVersion: '1.0.0',
  envTag: 'PROD',
};
