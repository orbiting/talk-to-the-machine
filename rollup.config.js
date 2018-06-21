import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import replace from 'rollup-plugin-replace'
import alias from 'rollup-plugin-alias'

import { join } from 'path'

const BABEL_STANDALONE_URL = 'https://cdn.republik.space/s3/republik-assets/dynamic-components/talk-to-the-machine/sort/babel.min.js'
const TF_URL = 'https://cdn.republik.space/s3/republik-assets/dynamic-components/talk-to-the-machine/neural-network/tf.min.js'

export default ['part1.js', 'part2.js', 'part3.js'].map(entryFile => ({
  input: join('src', entryFile),
  output: {
    file: join('build', entryFile),
    format: 'amd'
  },
  external: [
    // default
    'react', 'prop-types', 'glamor', '@project-r/styleguide',
    // extra
    BABEL_STANDALONE_URL,
    TF_URL
  ],
  plugins: [
    alias({
      'babel-standalone': BABEL_STANDALONE_URL,
      '@tensorflow/tfjs': TF_URL
    }),
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
