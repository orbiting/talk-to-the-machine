import React, { Component, Fragment } from 'react'
import { css } from 'glamor'
import {
  Button, Field, Checkbox,
  Label, Interaction,
  fontFamilies, Center,
  colors, mediaQueries
} from '@project-r/styleguide'

import CodemirrorCSS from './CodemirrorCSS'
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/javascript/javascript'

import {
  scaleLinear, scaleSequential,
  scalePoint,
  interpolateCubehelix, interpolateRainbow,
  hsl
} from 'd3'

import setupCircles, { CIRCLE_PADDING } from './setupCircles'
import setupCanvas from './setupCanvas'
import randomWrong from '../../lib/randomWrong'
import { transformCode, CHECK_FN_NAME } from '../../lib/babel'

import { t } from '../../lib/translate'

import { ChartTitle, ChartLead } from '../ChartTypo'
import CodeError from './CodeError'
import History from './History'
import { generateCode, DEFAULT_CODE } from './generateCode'

const HISTORY_BAND = 90

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
    textDecoration: 'none',
    color: '#fff',
    cursor: 'pointer',
    ':hover': {
      color: '#fff'
    }
  }),
  smallNote: css({
    [mediaQueries.mUp]: {
      display: 'none'
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
      .padding(1)

    const start = randomWrong(props.answer)
    this.state = {
      one0one: props.phase === '1',
      data: start,
      code: DEFAULT_CODE,
      autoRun: true,
      history: [start.slice()],
      svgHeight: 0
    }
    this.setRef = ref => {
      this.ref = ref
    }
    this.setSvg = svg => {
      this.svg = svg
    }
    this.measure = () => {
      if (this.ref) {
        const { width } = this.ref.getBoundingClientRect()
        if (width !== this.state.width) {
          this.x.range([0, width]).round(true)

          const size = Math.max(this.x.step(), 10)
          const radius = Math.min(30, Math.max(size / 2 - 1, 2))
          const svgHeight = CIRCLE_PADDING * 2 + radius * 2
          // console.log({
          //   step: this.x.step(),
          //   size,
          //   radius,
          //   n: this.props.answer.length
          // })

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
      const newHistory = [...history, nextData.slice()]
      this.setState({
        history: newHistory
      })
      return newHistory
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
      const { answer } = this.props
      const data = normalizeData(d, answer)
      if (this.record(data)) {
        return new Promise((resolve) => {
          const duration = answer.length > 9
            ? answer.length > 19
              ? 50 : 200
            : 400
          this.circles({
            data,
            radius: this.state.radius,
            duration,
            onEnd: () => {
              resolve()
            }
          })
        })
      }
    }
  }
  compileCode (code, dirty = true) {
    const nextState = {
      dirty,
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

    const { x, colorScale } = this
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
        const hadGenSolution = this.state.genSolution
        this.setState(generateCode(swap, this.props.phase), () => {
          if (this.state.genSolution && !hadGenSolution) {
            this.compileCode(this.state.code, false)
          }
        })
      }
    }
    this.circles = setupCircles({
      node: this.svg,
      x,
      domain: answer,
      colorScale,
      onChange
    })
  }
  componentDidUpdate (prevProps, prevState) {
    if (prevState.data !== this.state.data || prevState.width !== this.state.width) {
      this.circles({
        data: this.state.data,
        radius: this.state.radius
      })
    }
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.measure)
  }
  renderLongHistory () {
    const { answer } = this.props
    const { history, width } = this.state
    if (!history.length || !width) {
      return null
    }

    const padding = 2
    const strokeWidth = Math.min(3, (HISTORY_BAND - answer.length * padding) / answer.length)
    const rowHeight = Math.min(
      20,
      width / history.length
    )

    const x = scalePoint()
      .domain(answer.map((d, i) => i))
      .padding(0.5)
      .range([0, HISTORY_BAND])
      // .round(true)

    return <History
      history={history}
      answer={answer}
      colorScale={this.colorScale}
      x={x}
      strokeWidth={strokeWidth}
      rowHeight={rowHeight}
      orientation='horizontal'
      width={HISTORY_BAND}
      time={history.length - 1} />
  }
  render () {
    const { phase, answer } = this.props
    const { width, svgHeight, data, showWrong, one0one } = this.state

    const isSolved = deepEqual(
      data, answer
    )
    const time = this.state.time || 0

    const maxRecent = 12
    const recentHistory = this.state.history.slice(-maxRecent)

    const smallNote = t(`sort/phase/${phase}/smallNote`, {}, '')

    return <div>
      <Center>
        <ChartTitle>{t(`sort/phase/${phase}/title`)}</ChartTitle>
        <ChartLead>{t(`sort/phase/${phase}/description`)}</ChartLead>
        <div ref={this.setRef} style={{
          position: 'relative',
          paddingTop: 170,
          overflow: 'hidden',
          marginBottom: -CIRCLE_PADDING + 20
        }}>
          <div style={{
            position: 'absolute',
            top: -4,
            left: 0,
            right: 0,
            zIndex: 1,
            height: 1,
            backgroundColor: '#fff',
            boxShadow: '0 4px 2px 2px #fff'
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
            height: HISTORY_BAND,
            backgroundColor: '#fff',
            boxShadow: '0 4px 2px 2px #fff'
          }}>
            {this.renderLongHistory()}
          </div>
          <div style={{
            position: 'absolute',
            left: 0,
            bottom: svgHeight - CIRCLE_PADDING
          }}>
            {!!width && <History
              history={recentHistory}
              answer={answer}
              colorScale={this.colorScale}
              x={this.x}
              width={width}
              time={time}
              onNext={() => {
                if (recentHistory.length < maxRecent) {
                  this.setState({time: time + 1})
                }
              }} />}
          </div>
          <svg ref={this.setSvg} width={width} height={svgHeight}
            style={{position: 'relative'}} />
        </div>
        <Label>{t(`sort/phase/${phase}/code`)}</Label>
        <br />
        <br />
        {!!smallNote && <div {...styles.smallNote}>
          <Label>{smallNote}</Label>
          <br />
          <br />
        </div>}
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
              time: 0,
              history: [start.slice()],
              genSwaps: undefined,
              genSolution: undefined,
              autoRun: true,
              ...(this.state.dirty ? {} : {
                code: DEFAULT_CODE,
                complied: undefined
              })
            })
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
              this.compileCode(code)
            }} />
            <CodeExample value={`}`} options={{
              firstLineNumber: this.state.code.split('\n').length + 2,
              lineNumbers: true
            }} />
          </label>
          <CodeError message={this.state.codeError} />
          <br />
          <CodeLabel>
            <a href='#' {...styles.action} onClick={e => {
              e.preventDefault()
              this.setState({one0one: !one0one})
            }}>
              {t(`sort/101/title/${one0one ? 'open' : 'closed'}`)}
            </a><br />
            {!!one0one && <Fragment>
              {t('sort/101/swap')}<br />
              <CodeExample value={`let tmp = input[0] /* ${t('sort/101/swap/tmp')} */\ninput[0] = input[1]\ninput[1] = tmp`} />
              {t('sort/101/if')}<br />
              <CodeExample value={`if (input[0] < input[1]) { /* ${t('sort/101/if/true')} */ }\nelse { /* ${t('sort/101/if/false')} */ }`} />
              {t('sort/101/for')}<br />
              <CodeExample value={`for (let position = 0; position < input.length; position++) {\n  if (input[position] < input[position + 1]) { /* ${t('sort/101/for/inside')} */ }\n}`} />
              {t('sort/101/for/nested')}<br />
              <CodeExample value={[
                `for (let element = 0; element < input.length; element++) {`,
                `  for (let position = 1; position < input.length; position++) {`,
                `    if (input[position - 1] > input[position]) { /* ${t('sort/101/for/nested/inside')} */ }`,
                `  }`,
                `}`
              ].join('\n')} />
            </Fragment>}
          </CodeLabel>
          <br />
          <CodeLabel>{t.elements(`sort/phase/${phase}/protip`, {
            input: <Ref key='input'>input</Ref>,
            zero: <Ref key='zero'>0</Ref>
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
