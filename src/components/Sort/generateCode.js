import {
  ascending
} from 'd3'

export const DEFAULT_CODE = '  /* Stärn-Släsch-Kommentar: Jetzt sind Sie dran, Ihre Funktion: */\n  '

const swapFnName = `tauschen`
const swapFnCode = `  function ${swapFnName}(position1, position2) {
    let tmp = input[position1]
    input[position1] = input[position2]
    input[position2] = tmp
  }`

const bubbleSort = `  for (let aussen = 0; aussen < input.length; aussen++) {
    for (let innen = 1; innen < input.length; innen++) {
      if (input[innen - 1] > input[innen]) {
        ${swapFnName}(innen, innen - 1)
      }
    }
  }`

const genSwapCode = (swap) => [
  `  if(input[${swap[0]}] > input[${swap[1]}]) {`,
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
  } else {
    if (currentCode.indexOf(swapFnCode) !== -1) {
      addSwapFn = false
    }
  }

  const isDefaultCode = currentCode === DEFAULT_CODE
  let code = isDefaultCode
    ? ''
    : currentCode
  if (addSwapFn) {
    code = [
      swapFnCode,
      isDefaultCode ? '\n  /* Coden Sie hier: */\n' : '',
      code
    ].join('\n')
  }

  // in the last example we'll add a bubble sort after 5 uniq swaps
  if (genSwaps.length >= 5 && phase === '3') {
    code = `${code}\n${bubbleSort}`

    genSwaps.forEach(swap => {
      code = code.replace(genSwapCode(swap), '')
    })
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
