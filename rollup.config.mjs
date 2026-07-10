import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  input: 'src/fve-flow-card.ts',
  output: {
    file: 'dist/fve-flow-card.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    replace({
      preventAssignment: true,
      __CARD_VERSION__: pkg.version,
    }),
    resolve(),
    typescript(),
    terser({ format: { comments: false } }),
  ],
};
