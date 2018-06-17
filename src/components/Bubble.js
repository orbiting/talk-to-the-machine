import React from 'react'
import { css } from 'glamor'
import { colors, fontStyles, fontFamilies, mediaQueries } from '@project-r/styleguide'

const styles = {
  quote: css({
    margin: 0,
    marginBottom: 10,
    maxWidth: '80%',
    clear: 'both'
  }),
  quoteAligns: {
    right: css({
      float: 'right',
      textAlign: 'right'
    })
  },
  bubble: css({
    margin: 0,
    marginBottom: 5,
    padding: '5px 10px',
    maxWidth: 400,
    ...fontStyles.sansSerifRegular16,
    [mediaQueries.mUp]: {
      ...fontStyles.sansSerifRegular18
    }
  }),
  bubbleAligns: {
    left: css({
      backgroundColor: '#eee',
      color: '#000',
      borderRadius: '10px 10px 10px 3px'
    }),
    right: css({
      backgroundColor: '#2090ea',
      color: '#fff',
      borderRadius: '10px 10px 3px 10px',
      textAlign: 'left'
    })
  },
  cite: css({
    ...fontStyles.sansSerifRegular14,
    color: colors.lightText,
    fontFamily: fontFamilies.sansSerifItalic,
    fontStyle: 'normal'
  })
}

export default ({ children, name, align = 'left' }) => (
  <blockquote {...styles.quote} {...styles.quoteAligns[align]}>
    <p {...styles.bubble} {...styles.bubbleAligns[align]}>
      {children}
    </p>
    <cite {...styles.cite}>{name}</cite>
  </blockquote>
)
