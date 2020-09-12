import typescript from '@rollup/plugin-typescript';
// import { uglify } from "rollup-plugin-uglify";
import { terser } from "rollup-plugin-terser";

module.exports = {
  input: 'src/index.ts',
  output: {
    dir: 'min',
    format: 'cjs'
  },
  plugins: [typescript(),terser()]
}