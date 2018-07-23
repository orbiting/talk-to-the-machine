import {
  ascending
} from 'd3'

import { t } from '../../lib/translate'

const PLACEHOLDER_YOUR_CODE = `/* ${t('sort/code/placeholder')} */`
export const DEFAULT_CODE = `  ${PLACEHOLDER_YOUR_CODE}\n  `

const swapFnName = t('sort/code/swap')
const swapFnCode = `  /* ${t('sort/code/function')} */
  function ${swapFnName}(position1, position2) {
    let tmp = input[position1]
    input[position1] = input[position2]
    input[position2] = tmp
  }`

const bubbleSort = `  /* ${t('sort/code/bubble/for1')} */
  for (let element = 0; element < input.length; element++) {
    /* ${t('sort/code/bubble/for2')} */
    for (let position = 0; position < input.length; position++) {
      /* ${t('sort/code/bubble/if')} */
      if (input[position] > input[position + 1]) {
        /* ${t('sort/code/bubble/then')} */
        ${swapFnName}(position, position + 1)
      }
    }
  }`

const genSwapCode = (swap) => [
  `  /* ${t('sort/code/swap/if', {
    position1: swap[0],
    position2: swap[1]
  })} */`,
  `  if(input[${swap[0]}] > input[${swap[1]}]) {`,
  `    /* ${t('sort/code/swap/then')} */`,
  `    ${swapFnName}(${swap[0]}, ${swap[1]})`,
  `  }`
].join('\n')

export const generateCode = (swap, phase) => ({ code: currentCode, genSolution, genSwaps = [], complied }) => {
  const upSwap = swap.sort(ascending)
  if (genSwaps.find(swap => swap.join() === upSwap.join())) {
    return
  }
  if (genSolution) {
    return
  }

  let addSwapFn = true
  if (complied && complied.ast) {
    if (complied.ast.tokens.find(t => t.value === swapFnName)) {
      addSwapFn = false
    }
  }
  if (currentCode.indexOf(swapFnCode) !== -1) {
    addSwapFn = false
  }

  const isDefaultCode = currentCode === DEFAULT_CODE
  let code = isDefaultCode
    ? ''
    : currentCode
  if (addSwapFn) {
    code = [
      swapFnCode,
      isDefaultCode ? `\n  ${PLACEHOLDER_YOUR_CODE}\n` : '',
      code
    ].join('\n')
  }

  // in the last example we'll add a bubble sort after 5 uniq swaps
  if (genSwaps.length >= 5 && phase === '3') {
    code = `${code}\n${bubbleSort}`

    genSwaps.forEach(swap => {
      code = code.replace(genSwapCode(swap), '')
    })
    code = code.replace(PLACEHOLDER_YOUR_CODE, '')
    // clear empty lines
    code = code.replace(/(\s+\n){3,}/g, '\n\n\n')

    return {
      genSolution: true,
      code
    }
  }
  // otherwise add swap code
  code = `${code}\n${genSwapCode(upSwap)}`

  return {
    genSwaps: [...genSwaps, upSwap],
    code
  }
}
