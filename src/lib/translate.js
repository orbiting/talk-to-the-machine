import { createFormatter } from '@project-r/styleguide'
import translations from './translations.json'

export const t = createFormatter(translations.data)
