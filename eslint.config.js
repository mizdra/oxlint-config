import mizdra from '@mizdra/eslint-config-mizdra';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['**/dist']),
  ...mizdra.baseConfigs,
  ...mizdra.typescriptConfigs,
  ...mizdra.nodeConfigs,
  ...mizdra.reactConfigs,
  {
    rules: {
      // Write your favorite rules
    },
  },
  mizdra.prettierConfig,
]);
