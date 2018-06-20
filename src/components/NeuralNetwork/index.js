import React from 'react'

import { Interaction, RawHtml, Label } from '@project-r/styleguide'

export default () => <div>
  

  <RawHtml
    type={Label}
    dangerouslySetInnerHTML={{
      __html: t('nn/credits')
    }} />
</div>
