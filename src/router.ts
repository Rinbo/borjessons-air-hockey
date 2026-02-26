/* ===================================================
   Lightweight Hash Router
   =================================================== */

export interface Route {
  pattern: string;
  mount: (container: HTMLElement, params: Record<string, string>) => void;
  unmount: () => void;
}

interface MatchResult {
  route: Route;
  params: Record<string, string>;
}

let routes: Route[] = [];
let currentRoute: Route | null = null;
let container: HTMLElement | null = null;

/**
 * Register a route with a pattern like '/' or '/games/:id'.
 */
export function addRoute(
  pattern: string,
  mount: (container: HTMLElement, params: Record<string, string>) => void,
  unmount: () => void
): void {
  routes.push({ pattern, mount, unmount });
}

/**
 * Navigate to a path programmatically.
 */
export function navigate(path: string): void {
  window.location.hash = '#' + path;
}

/**
 * Start the router. Call once from main.ts.
 */
export function startRouter(rootEl: HTMLElement): void {
  container = rootEl;

  window.addEventListener('hashchange', () => handleRoute());
  handleRoute();
}

function handleRoute(): void {
  const hash = window.location.hash.slice(1) || '/';
  const match = matchRoute(hash);

  if (currentRoute) {
    currentRoute.unmount();
    if (container) container.innerHTML = '';
  }

  if (match && container) {
    currentRoute = match.route;
    match.route.mount(container, match.params);
  } else if (container) {
    currentRoute = null;
    container.innerHTML = `
      <div class="error-page page-enter">
        <h1>404</h1>
        <p>Page not found</p>
        <button class="btn btn-outline" onclick="window.location.hash='#/'">Go Home</button>
      </div>
    `;
  }
}

function matchRoute(path: string): MatchResult | null {
  for (const route of routes) {
    const params = extractParams(route.pattern, path);
    if (params !== null) {
      return { route, params };
    }
  }
  return null;
}

function extractParams(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = pathParts[i];
    } else if (pp !== pathParts[i]) {
      return null;
    }
  }

  return params;
}
