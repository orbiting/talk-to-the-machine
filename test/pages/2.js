import React from 'react'

import { renderMdast } from 'mdast-react-render'
import { parse } from '@orbiting/remark-preset'
import createSchema from '@project-r/styleguide/lib/templates/Article'

import md from '../../../../Articles/article-talk-to-the-machine-2/article.md'

const schema = createSchema()

export default () => renderMdast(parse(md), schema)
