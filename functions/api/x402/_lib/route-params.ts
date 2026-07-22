// Pure route-param extraction.
//
// @x402/core's dynamic payTo/price functions only receive a generic
// HTTPRequestContext = { path, method, routePattern, paymentHeader } — there
// is no framework-specific parsed-params object available there (confirmed
// by inspecting node_modules/@x402/core/dist/*/x402Client-*.d.ts). We
// register routes keyed by a pattern like "GET /api/x402/license/:trackId"
// and get the matching `routePattern` + literal `path` back in every hook
// (payTo, price, onAfterSettle), so params are recovered by diffing the two
// segment-by-segment.
export function extractRouteParams(
  routePattern: string | undefined,
  path: string | undefined,
): Record<string, string> {
  if (!routePattern || !path) return {};

  // routePattern may be prefixed with "METHOD ", e.g. "GET /api/x402/license/:trackId".
  const patternPath = routePattern.includes(' ') ? routePattern.split(' ').slice(1).join(' ') : routePattern;

  const patternSegments = patternPath.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) return {};

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSegment = patternSegments[i];
    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegments[i]);
    } else if (patternSegment !== pathSegments[i]) {
      return {}; // static segment mismatch — not this route
    }
  }
  return params;
}
