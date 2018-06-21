import React from 'react'

import { renderMdast } from 'mdast-react-render'
import { parse } from '@orbiting/remark-preset'
import createSchema from '@project-r/styleguide/lib/templates/Article'
import visit from 'unist-util-visit'

import md from '../../../../Articles/article-talk-to-the-machine-1/article.md'

import jsUrl from 'file-loader!../../build/part1.js'

const schema = createSchema()

const mdast = parse(md)

visit(mdast, 'zone', node => {
  if (node.identifier === 'DYNAMIC_COMPONENT' && node.data.src.match(/part1\.js/)) {
    node.data.src = '/build/part1.js' +
      '?u=' + encodeURIComponent(jsUrl)
  }
})

export default () => <div key={jsUrl}>
  {renderMdast(mdast, schema)}
</div>
