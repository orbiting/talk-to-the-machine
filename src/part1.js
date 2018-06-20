import 'babel-runtime/regenerator'

import React from 'react'
import { Center } from '@project-r/styleguide'

import Sort from './components/Sort'

export default (props) => {
  if (props.answer) {
    return <Sort {...props} />
  }
  if (props.compare) {
    return <Center>TK: Compare</Center>
  }
  return null
}
