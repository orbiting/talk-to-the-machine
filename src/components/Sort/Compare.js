import React, { Component } from 'react'

import { Center, Interaction, RawHtml, Label } from '@project-r/styleguide'

import { t } from '../../lib/translate'

export default () => (
  <Center>
    <Interaction.H3>{t('sort/compare/title')}</Interaction.H3>
    <Interaction.P>{t('sort/compare/description')}</Interaction.P>
    <br />
    <Interaction.P>TK</Interaction.P>
    {/*t('sort/compare/your')*/}
    <br />
    <RawHtml
      type={Label}
      dangerouslySetInnerHTML={{
        __html: t('sort/compare/credits')
      }} />
  </Center>
)
