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
  hsl
} from 'd3'

import setupCircles, { CIRCLE_PADDING } from './setupCircles'
import setupCanvas from './setupCanvas'
import randomWrong from '../../lib/randomWrong'
import { transformCode } from '../../lib/babel'

import { t } from '../../lib/translate'

import { ChartTitle, ChartLead } from '../ChartTypo'

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

const makeFn = code => new Function(
  'input',
  'test',
  `${transformCode(code)}; return sort(input, test);`
)

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const DEFAULT_CODE = `
function quicksort(left, right) {
  if (left < right) {
    let pivot = input[left + Math.floor((right - left) / 2)],
        leftNew = left,
        rightNew = right;

    do {
      while (input[leftNew] < pivot) {
        leftNew++;
      }
      while (pivot < input[rightNew]) {
        rightNew--;
      }
      if (leftNew <= rightNew) {
        let temp = input[leftNew];
        input[leftNew] = input[rightNew];
        input[rightNew] = temp;
        leftNew++;
        rightNew--;
      }
    } while (leftNew <= rightNew);
    quicksort(left, rightNew);
    quicksort(leftNew, right);
  }
}

quicksort(0, input.length - 1)`

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
      code: '/* Kommentar: Jetzt Sie, ihre Funktion: */\n',
      // code: DEFAULT_CODE,
      // run: makeFn(DEFAULT_CODE),
      autoRun: true,
      history: [start.slice()],
      svgHeight: 0
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
      if (!d || d.some((item, index, all) => all.indexOf(item) !== index)) {
        // intermediate state with duplicates
        return
      }
      if (this.record(d)) {
        return new Promise((resolve) => {
          this.circles({
            data: this.state.data,
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
    if (!this.state.run) {
      return
    }
    this.state.run(this.state.data, () => {
      return this.update(this.state.data)
    }).then(returnValue => {
      this.update(returnValue || this.state.data).then(() => {
        this.setState({data: returnValue || this.state.data})
      })
    })
  }
  componentDidMount () {
    window.addEventListener('resize', this.measure)
    this.measure()

    const duration = 400
    const { x, colorScale } = this
    const { width } = this.state
    const { answer } = this.props
    const onChange = data => {
      this.record(data)
      this.setState({data})
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
              autoRun: true
            })
            this.canvas.reset()
          }}>{t('sort/controls/reset')}</a>
          <br />
          <br />
          <label>
            <CodeLabel>{'function sort(input) {'}</CodeLabel>
            <CodemirrorCSS />
            <CodeMirror options={{
              mode: 'javascript',
              lineNumbers: true,
              theme: 'pastel-on-dark',
              viewportMargin: Infinity
              // readOnly: true
            }} value={this.state.code} onBeforeChange={(editor, data, code) => {
              const nextState = {
                code
              }
              let run
              try {
                run = makeFn(code)
              } catch (e) {
                nextState.codeError = e.toString()
              }
              nextState.run = run
              this.setState(nextState, () => {
                if (this.state.autoRun) {
                  this.runCode()
                }
              })
            }} />
            <CodeLabel>{'}'}</CodeLabel>
          </label>
          <br />
          <CodeLabel>
            {t('sort/101/title')}<br /><br />
            {t('sort/101/swap')}<br />
            <CodeMirror options={{
              mode: 'javascript',
              theme: 'pastel-on-dark',
              viewportMargin: Infinity,
              readOnly: true
            }} value={`let tmp = input[0] /* Ein Zwischenspeicher */\ninput[0] = input[1]\ninput[1] = tmp`} />
            {t('sort/101/if')}<br />
            <CodeMirror options={{
              mode: 'javascript',
              theme: 'pastel-on-dark',
              viewportMargin: Infinity,
              readOnly: true
            }} value={`if (input[0] < input[1]) { /* ${t('sort/101/if/true')} */ }\nelse { /* ${t('sort/101/if/false')} */ }`} />
            {t('sort/101/for')}<br />
            <CodeMirror options={{
              mode: 'javascript',
              theme: 'pastel-on-dark',
              viewportMargin: Infinity,
              readOnly: true
            }} value={`for (let i = 0; i < input.length; i++) {\n  if (input[i] < input[i + 1]) { /* ${t('sort/101/for/inside')} */ }\n}`} />
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
