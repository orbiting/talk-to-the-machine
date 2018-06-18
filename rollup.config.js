import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import replace from 'rollup-plugin-replace'

import { join } from 'path'

export default ['part1.js', 'part2.js', 'part3.js'].map(entryFile => ({
  input: join('src', entryFile),
  output: {
    file: join('build', entryFile),
    format: 'amd'
  },
  external: ['react', 'prop-types', 'glamor', '@project-r/styleguide', 'https://cdn.republik.space/s3/republik-assets/dynamic-components/talk-to-the-machine/babel.min.js'],
  plugins: [
    json(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      presets: [
        "@babel/react",
        ["@babel/env", {
          "targets": {
            "browsers": ["last 2 versions", "safari >= 7"]
          },
          "modules": false
        }]
      ]
    }),
    resolve(),
    commonjs(),
    replace({
       'process.env.NODE_ENV': JSON.stringify('production')
       // 'process.env': JSON.stringify('({})')
    })
  ]
}))
