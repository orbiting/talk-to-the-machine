import React from 'react'
import { Center, Interaction, A, colors } from '@project-r/styleguide'

import { ChartTitle, ChartLead } from '../ChartTypo'
import { t } from '../../lib/translate'

export default (WrappedComponent) => {
  if (typeof WeakSet === 'function' && typeof fetch === 'function') {
    return WrappedComponent
  }
  return () => (
    <Center>
      <ChartTitle>{t('nn/title')}</ChartTitle>
      <ChartLead>{t('nn/description')}</ChartLead>
      <Interaction.P style={{color: colors.error, margin: '20px 0'}}>
        {t('nn/unsupported')}
      </Interaction.P>
      <Interaction.P>
        <A href='https://www.mozilla.org/de/firefox/new/'>
          {t('nn/unsupported/firefox')}
        </A>
      </Interaction.P>
    </Center>
  )
}
