import { createFormatter } from '@project-r/styleguide'
import translations from './translations.$locale.json'

export const t = createFormatter(translations.data)
