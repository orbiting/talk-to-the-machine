import React from 'react'

import { Interaction, RawHtml, Label } from '@project-r/styleguide'

export default () => <div>
  <Interaction.H3>{t('nn/title')}</Interaction.H3>
  <Interaction.P>{t('nn/description')}</Interaction.P>
  <br />

  <RawHtml
    type={Label}
    dangerouslySetInnerHTML={{
      __html: t('nn/credits')
    }} />
</div>
