import 'babel-runtime/regenerator'

import React from 'react'

import Sort from './components/Sort'
import Compare from './components/Sort/Compare'

export default (props) => {
  if (props.answer) {
    return <Sort {...props} />
  }
  if (props.compare) {
    return <Compare />
  }
  return null
}
