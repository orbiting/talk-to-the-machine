import React from 'react'
import { fontStyles, colors, mediaQueries } from '@project-r/styleguide'
import { css } from 'glamor'

const styles = {
  h: css({
    ...fontStyles.sansSerifMedium19,
    lineHeight: '25px',
    [mediaQueries.mUp]: {
      ...fontStyles.sansSerifMedium22
    },
    color: colors.text,
    margin: 0,
    marginBottom: 15,
    '& + p': {
      marginTop: -15
    }
  }),
  p: css({
    color: colors.text,
    ...fontStyles.sansSerifRegular16,
    [mediaQueries.mUp]: {
      ...fontStyles.sansSerifRegular19
    },
    margin: 0,
    marginBottom: 15
  })
}

export const ChartTitle = ({children, ...props}) => (
  <h3 {...props} {...styles.h}>{children}</h3>
)

export const ChartLead = ({children, ...props}) => (
  <p {...props} {...styles.p}>{children}</p>
)
