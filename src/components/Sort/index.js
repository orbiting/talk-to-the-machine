import React, { Component } from 'react'
import { css } from 'glamor'
import {
  Button, Field, Checkbox,
  Label, Interaction,
  fontFamilies, Center
} from '@project-r/styleguide'

import CodemirrorCSS from './CodemirrorCSS'
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/javascript/javascript'

import {
  scaleLinear, scaleSequential,
  scalePoint,
  interpolateCubehelix, interpolateRainbow,
  hsl,
  ascending
} from 'd3'

import setupCircles, { CIRCLE_PADDING } from './setupCircles'
import setupCanvas from './setupCanvas'
import randomWrong from '../../lib/randomWrong'
import { transformCode, CHECK_FN_NAME } from '../../lib/babel'

import { t } from '../../lib/translate'

import { ChartTitle, ChartLead } from '../ChartTypo'
import CodeError from './CodeError'

const monoFontStyle = {
  fontFamily: fontFamilies.monospaceRegular,
  fontSize: '14px',
  lineHeight: '1.3'
}

const styles = {
  autoSize: css({
    display: 'block',
    border: 'none',
    outline: 'none',
    width: '100%',
    maxWidth: '100%',
    minWidth: '100%',
    color: '#fff',
    background: 'transparent',
    padding: '2px 0 2px 16px',
    ...monoFontStyle
  }),
  codeArea: css({
    padding: 15,
    backgroundColor: '#000',
    color: '#fff',
    ...monoFontStyle
  }),
  label: css({
    color: '#ccc'
  }),
  ref: css({
    color: '#fff'
  }),
  action: css({
    color: '#fff',
    cursor: 'pointer',
    ':hover': {
      color: '#fff'
    }
  })
}

const CodeLabel = ({ children }) => <div {...styles.label}>
  {children}
</div>
const Ref = ({ children }) => <span {...styles.ref}>
  {children}
</span>

const compileCode = code => {
  const transformed = transformCode(code)
  return {
    ...transformed,
    run: new Function(
      'input',
      CHECK_FN_NAME,
      `${transformed.code}; return sort(input, ${CHECK_FN_NAME});`
    )
  }
}

const DEFAULT_CODE = '  /* Stärn-Släsch-Kommentar: Jetzt sind Sie dran, ihre Funktion: */\n  '

const swapFnName = `tauschen`
const swapFnCode = `  function ${swapFnName}(position1, position2) {
    let tmp = input[position1]
    input[position1] = input[position2]
    input[position2] = tmp
  }`

const generateCode = (swap, phase) => ({ code: currentCode, genSwaps = [], complied }) => {
  const upSwap = swap.sort(ascending)
  if (genSwaps.find(swap => swap.join() === upSwap.join())) {
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

  let code = currentCode === DEFAULT_CODE
    ? ''
    : currentCode
  if (addSwapFn) {
    code = `${swapFnCode}\n\n${code}`
  }

  code = `${code}\n  if(input[${upSwap[0]}] > input[${upSwap[1]}]) {
    ${swapFnName}(${upSwap[0]}, ${upSwap[1]})
  }`

  return {
    genSwaps: [...genSwaps, upSwap],
    code
  }
}

const normalizeData = (data, answer) => {
  const normalData = data
    .map(d => +d)
    .filter(d => answer.indexOf(d) !== -1)

  return normalData.concat(
    answer.filter(d => normalData.indexOf(d) === -1)
  )
}

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const CodeExample = ({ opacity = 0.8, options, value }) => (
  <div style={{opacity}}>
    <CodeMirror options={{
      mode: 'javascript',
      lineWrapping: true,
      theme: 'pastel-on-dark',
      viewportMargin: Infinity,
      readOnly: 'nocursor',
      ...options
    }} value={value} />
  </div>
)

class Sort extends Component {
  constructor (props, ...args) {
    super(props, ...args)

    const { answer } = props

    const maxIndex = answer.length - 1
    this.colorScale = maxIndex < 9
      ? scaleLinear()
        .interpolate(interpolateCubehelix)
        .domain([0, maxIndex / 2, maxIndex])
        .range([hsl('rgb(24,100,170)'), hsl('#FFB3E8'), hsl('rgb(187,21,26)')])
      : scaleSequential(interpolateRainbow).domain([0, maxIndex * 1.16])

    this.x = scalePoint()
      .domain(answer.map((d, i) => i))
      .padding(2)

    const start = randomWrong(props.answer)
    this.state = {
      data: start,
      code: DEFAULT_CODE,
      autoRun: true,
      history: [start.slice()],
      svgHeight: 0,
      prestine: true
    }
    this.setRef = ref => {
      this.ref = ref
    }

    this.measure = () => {
      if (this.ref) {
        const { width } = this.ref.getBoundingClientRect()
        if (width !== this.state.width) {
          this.x.range([0, width]).round(true)

          const size = Math.max(this.x.step(), 4)
          const radius = Math.min(30, Math.max(size / 2 - 5, 2))
          const svgHeight = CIRCLE_PADDING * 2 + radius * 2

          this.setState({width, radius, svgHeight})
        }
      }
      return this.state
    }

    this.record = (nextData) => {
      const { history } = this.state
      const previous = history[history.length - 1]
      if (deepEqual(previous, nextData)) {
        return
      }
      history.push(nextData.slice())
      return true
    }
    this.update = async (d) => {
      if (
        !d ||
        d.some((item, index, all) => all.indexOf(item) !== index) ||
        d.some(item => item === undefined)
      ) {
        // intermediate state with duplicates
        return
      }
      const data = normalizeData(d, this.props.answer)
      if (this.record(data)) {
        return new Promise((resolve) => {
          this.circles({
            data,
            radius: this.state.radius,
            onEnd: () => {
              resolve()
            }
          })
          this.canvas({
            width: this.state.width,
            history: this.state.history
          })
        })
      }
    }

  }
  runCode () {
    if (!this.state.complied) {
      return
    }
    const { answer } = this.props
    this.state.complied.run(this.state.data, () => {
      return this.update(this.state.data)
    }).then(returnValue => {
      const result = returnValue || this.state.data
      this.update(result).then(() => {
        this.setState({
          data: normalizeData(result, answer)
        })
      })
    })
    .catch((e) => {
      this.setState({codeError: e.toString()})
    })
  }
  componentDidMount () {
    window.addEventListener('resize', this.measure)
    this.measure()

    const duration = 400
    const { x, colorScale } = this
    const { width } = this.state
    const { answer } = this.props
    const onChange = (data, subject) => {
      // console.log('onChange', data.join(' '), 'subject', subject)
      const hasChanged = this.record(data)
      this.setState({data})
      if (hasChanged) {
        const isSolved = deepEqual(
          data, this.props.answer
        )
        if (isSolved) {
          return
        }

        const { history } = this.state
        const prev = history[history.length - 2]
        // all swaps are to unorganic
        // const swaps = data
        //   .map((d, i) => [i, prev.indexOf(d)])
        //   .filter(([i0, i1]) => i0 !== i1)

        const swap = [
          data.indexOf(subject),
          prev.indexOf(subject)
        ]
        if (this.state.prestine) {
          this.setState(generateCode(swap, this.props.phase))
        }
      }
    }
    this.canvas = setupCanvas({
      node: this.ref.firstChild,
      x, domain: answer, colorScale, duration
    })
    this.circles = setupCircles({
      node: this.ref.childNodes[1],
      x,
      domain: answer,
      colorScale,
      duration,
      onChange
    })
  }
  componentDidUpdate (prevProps, prevState) {
    if (prevState.data !== this.state.data || prevState.width !== this.state.width) {
      this.circles({
        data: this.state.data,
        radius: this.state.radius
      })
      this.canvas({
        width: this.state.width,
        history: this.state.history
      })
    }
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.measure)
  }
  render () {
    const { phase, answer } = this.props
    const { width, svgHeight, data, showWrong } = this.state

    const isSolved = deepEqual(
      data, answer
    )

    return <div>
      <Center>
        <ChartTitle>{t(`sort/phase/${phase}/title`)}</ChartTitle>
        <ChartLead>{t(`sort/phase/${phase}/description`)}</ChartLead>
        <div ref={this.setRef} style={{
          position: 'relative',
          paddingTop: 200,
          overflow: 'hidden'
        }}>
          <canvas style={{
            position: 'absolute',
            left: 0,
            bottom: svgHeight - CIRCLE_PADDING
          }} />
          <svg width={width} height={svgHeight}
            style={{position: 'relative'}} />
        </div>
        <Label>{t(`sort/phase/${phase}/code`)}</Label>
        <br />
        <br />
      </Center>
      <div onClick={!isSolved ? (() => {
        this.setState({showWrong: !showWrong})
      }) : undefined} style={{
        backgroundColor: isSolved ? '#64966E' : '#E9A733',
        color: 'black',
        cursor: 'pointer'
      }}>
        <Center style={{
          padding: !isSolved && !showWrong
            ? 3 : undefined
        }}>
          <Interaction.P>
            {isSolved
              ? t('sort/result/correct/generic')
              : !!showWrong && t('sort/result/wrong', {
                answer: answer.join(', '),
                current: data.join(', ')
              })}
          </Interaction.P>
        </Center>
      </div>
      <div {...styles.codeArea}>
        <Center>
          <span {...styles.label}>{t('sort/controls/label')}{' '}</span>
          <label {...styles.action}>
            <input
              type='checkbox'
              checked={this.state.autoRun}
              onChange={(e) => {
                const autoRun = !!e.target.checked
                if (autoRun) {
                  this.runCode()
                }
                this.setState({autoRun})
              }} />
            {' '}
            {t('sort/controls/autoRun')}
          </label>
          <span {...styles.label}>{', '}</span>
          <a {...styles.action} onClick={e => {
            e.preventDefault()
            const start = randomWrong(this.props.answer)
            this.setState({
              start,
              data: start,
              history: [start.slice()],
              genSwaps: undefined,
              autoRun: true,
              ...(this.state.dirty ? {} : {
                code: DEFAULT_CODE,
                complied: undefined
              })
            })
            this.canvas.reset()
          }}>{t('sort/controls/reset')}</a>
          <br />
          <br />
          <label>
            <CodemirrorCSS />
            <CodeExample value={`function sort(input) {`} options={{lineNumbers: true
            }} />
            <CodeMirror options={{
              mode: 'javascript',
              lineWrapping: true,
              lineNumbers: true,
              firstLineNumber: 2,
              theme: 'pastel-on-dark',
              viewportMargin: Infinity
            }} value={this.state.code} onBeforeChange={(editor, data, code) => {
              const nextState = {
                dirty: true,
                code,
                codeError: null
              }

              let complied
              try {
                complied = compileCode(code)
              } catch (e) {
                nextState.codeError = e.toString()
                  .replace(
                    `, ${CHECK_FN_NAME}`,
                    ''
                  )
                  .replace('\n  1 | async ', '\n  1 | ')
              }
              nextState.complied = complied
              this.setState(nextState, () => {
                if (this.state.autoRun) {
                  this.runCode()
                }
              })
            }} />
            <CodeExample value={`}`} options={{
              firstLineNumber: this.state.code.split('\n').length + 2,
              lineNumbers: true
            }} />
          </label>
          <CodeError message={this.state.codeError} />
          <br />
          <CodeLabel>
            {t('sort/101/title')}<br /><br />
            {t('sort/101/swap')}<br />
            <CodeExample value={`let tmp = input[0] /* Ein Zwischenspeicher */\ninput[0] = input[1]\ninput[1] = tmp`} />
            {t('sort/101/if')}<br />
            <CodeExample value={`if (input[0] < input[1]) { /* ${t('sort/101/if/true')} */ }\nelse { /* ${t('sort/101/if/false')} */ }`} />
            {t('sort/101/for')}<br />
            <CodeExample value={`for (let i = 0; i < input.length; i++) {\n  if (input[i] < input[i + 1]) { /* ${t('sort/101/for/inside')} */ }\n}`} />
          </CodeLabel>
          <br />
          <CodeLabel>{t.elements(`sort/phase/${phase}/protip`, {
            input: <Ref key='input'>{'input'}</Ref>
          })}</CodeLabel>
        </Center>
      </div>
    </div>
  }
}

Sort.defaultProps = {
  answer: [0, 1, 2, 3, 4],
  phase: '1'
}

export default Sort
