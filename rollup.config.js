import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

import { join } from 'path'

export default ['part1.js', 'part2.js', 'part3.js'].map(entryFile => ({
  input: join('src', entryFile),
  output: {
    file: join('build', entryFile),
    format: 'amd'
  },
  external: ['react', 'prop-types', 'glamor', '@project-r/styleguide'],
  plugins: [
    json(),
    babel({
      exclude: 'node_modules/**'
    }),
    resolve(),
    commonjs()
  ]
}))
