import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import Bubble from './components/Bubble'

const Wrapper = ({ messages, alignments = {} }) => {
  if (messages) {
    return <Fragment>
      {messages.map((message, i) => {
        const nextMessage = messages[i + 1] || {}
        return (
          <Bubble key={i}
            name={nextMessage.author === message.author
              ? undefined
              : message.author}
            align={alignments[message.author]}>
            {message.text}
          </Bubble>
        )
      })}
      <br style={{clear: 'both'}} />
    </Fragment>
  }
  return null
}

Wrapper.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    author: PropTypes.string,
    text: PropTypes.string
  }))
}

export default Wrapper
