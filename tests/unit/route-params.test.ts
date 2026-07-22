import { describe, expect, it } from 'vitest';
import { extractRouteParams } from '../../functions/api/x402/_lib/route-params';

describe('extractRouteParams', () => {
  it('extracts a single dynamic segment', () => {
    expect(extractRouteParams('GET /api/x402/license/:trackId', '/api/x402/license/42')).toEqual({
      trackId: '42',
    });
  });

  it('extracts params without a method prefix', () => {
    expect(extractRouteParams('/api/x402/sponsor/:artistId', '/api/x402/sponsor/7')).toEqual({
      artistId: '7',
    });
  });

  it('decodes URI-encoded path segments', () => {
    expect(extractRouteParams('GET /api/x402/license/:trackId', '/api/x402/license/abc%2Fdef')).toEqual({
      trackId: 'abc/def',
    });
  });

  it('returns empty object on static segment mismatch', () => {
    expect(extractRouteParams('GET /api/x402/license/:trackId', '/api/x402/sponsor/42')).toEqual({});
  });

  it('returns empty object on segment count mismatch', () => {
    expect(extractRouteParams('GET /api/x402/license/:trackId', '/api/x402/license/42/extra')).toEqual({});
  });

  it('returns empty object when routePattern or path is missing', () => {
    expect(extractRouteParams(undefined, '/api/x402/license/42')).toEqual({});
    expect(extractRouteParams('GET /api/x402/license/:trackId', undefined)).toEqual({});
  });

  it('handles static-only routes with no params', () => {
    expect(extractRouteParams('GET /api/x402/health', '/api/x402/health')).toEqual({});
  });
});
