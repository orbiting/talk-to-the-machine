import React, { Component } from 'react'
import { css } from 'glamor'
import { Button, Field, Label, Interaction, fontFamilies } from '@project-r/styleguide'
import AutosizeInput from 'react-textarea-autosize'

import setupVis from './setupVis'
import randomWrong from '../../lib/randomWrong'
import { transformCode } from '../../lib/babel'

import { t } from '../../lib/translate'

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

const DEFAULT_CODE = `function swap(position1, position2) {
  let tmp = input[position1]
  input[position1] = input[position2]
  input[position2] = tmp
}

let position = 0
while (position < input.length) {
  if (position == 0 || input[position] >= input[position - 1]) {
    position = position + 1
  } else {
    swap(position, position - 1)
    position = position - 1
  }
}`

class Sort extends Component {
  constructor (props, ...args) {
    super(props, ...args)

    this.state = {
      data: randomWrong(props.answer),
      code: DEFAULT_CODE,
      run: makeFn(DEFAULT_CODE)
    }
    this.setRef = ref => {
      this.ref = ref
    }

    let lastData = [].concat(this.state.data)
    this.update = async (d) => {
      if (d.some((item, index, all) => all.indexOf(item) !== index)) {
        // intermediate state with duplicates
        return
      }
      if (JSON.stringify(d) === JSON.stringify(lastData)) {
        // same
        return 
      }
      lastData = d

      return new Promise((resolve) => {
        this.vis.update(d, () => {
          resolve()
        })
      })
    }
  }
  componentDidMount () {
    this.vis = setupVis({
      answer: this.props.answer,
      duration: 400,
      element: this.ref,
      width: 280,
      onChange: data => {
        this.setState({data})
      }
    })
    this.vis.render(this.state.data)
  }
  componentDidUpdate () {
    this.vis.render(this.state.data)
  }
  render () {
    return <div>
      <Interaction.H3>{t('sort/phase1/title')}</Interaction.H3>
      <Interaction.P>{t('sort/phase1/description')}</Interaction.P>
      <div ref={this.setRef} />
      <div {...styles.codeArea}>
        <label>
          <CodeLabel>{'function sort(input) {'}</CodeLabel>
          <AutosizeInput {...styles.autoSize}
            value={this.state.code}
            onChange={e => {
              const code = e.target.value

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
              this.setState(nextState)
            }} />
          <CodeLabel>{'}'}</CodeLabel>
          <br />
          <CodeLabel>
            Programmieren 101<br /><br />
            Erste Zahl mit Zweiter tauschen<br />
            <Ref>
              {'let tmp = input[0]'}<br />
              {'input[0] = input[1]'}<br />
              {'input[1] = tmp'}
            </Ref><br />
            Ist die Erste kleiner ist als die Zweite?<br />
            <Ref>{'if (input[0] < input[1]) {'}</Ref>
            {' /* tun Sie was hier! */ '}
            <Ref>{'} '}<br />{'else {'}</Ref>
            {' /* falls nicht */ '}
            <Ref>{'}'}</Ref><br />
            In einer Schlaufe?<br />
            <Ref>
              {'for (let i = 0; i < input.length; i++) {'}<br />
              &nbsp;&nbsp;{'if (input[i] < input[i + 1]) {'}</Ref>
              {' /* Code hier! */ '}
              <Ref>{'}'}<br />
              {'}'}
            </Ref>
          </CodeLabel>
          <br />
        </label>
        <Button white onClick={async e => {
          e.preventDefault()
          const returnValue = await this.state.run(this.state.data, () => {
            return this.update([].concat(this.state.data))
          })
          this.update(returnValue || this.state.data).then(() => {
            this.setState({data: returnValue || this.state.data})
          })
        }}>Run</Button>
        {' '}
        <Button white onClick={e => {
          e.preventDefault()
          this.vis.reset()
        }}>zurücksetzen</Button>
      </div>
    </div>
  }
}

Sort.defaultProps = {
  answer: [0, 1, 2, 3, 4]
}

export default Sort
