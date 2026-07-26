import { defineMock } from '@typeserve/core';

/**
 * TypeServe config mirroring Filary’s FormProfile debug routes.
 *
 * Primary fill contract is dynamic (not stock TypeServe):
 *   POST /api/generate  { fields: [{ name, type, options? }] }
 *   → { values: Record<string, string | boolean | number> }
 *
 * Default: bun run server  (src/filary-server.ts)
 * Stock TypeServe: bun run --cwd server start:typeserve
 */
export default defineMock({
  port: 7002,
  basePath: '/api',
  routes: [
    {
      path: '/profile',
      method: 'GET',
      type: 'FormProfile',
      file: './src/types/form-profile.ts',
    },
    {
      path: '/profiles',
      method: 'GET',
      type: 'FormProfile[]',
      file: './src/types/form-profile.ts',
      count: 3,
    },
  ],
});
