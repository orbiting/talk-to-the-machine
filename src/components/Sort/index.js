import React, { Component } from 'react'
import { css } from 'glamor'
import {
  Button, Field, Checkbox,
  Label, Interaction,
  fontFamilies, Center
} from '@project-r/styleguide'
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
      run: makeFn(DEFAULT_CODE),
      autoRun: true
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
  runCode () {
    this.state.run(this.state.data, () => {
      return this.update([].concat(this.state.data))
    }).then(returnValue => {
      this.update(returnValue || this.state.data).then(() => {
        this.setState({data: returnValue || this.state.data})
      })
    })
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
    const { phase } = this.props
    return <div>
      <Center>
        <Interaction.H3>{t(`sort/phase/${phase}/title`)}</Interaction.H3>
        <Interaction.P>{t(`sort/phase/${phase}/description`)}</Interaction.P>
        <div ref={this.setRef} />
        <Label>{t(`sort/phase/${phase}/code`)}</Label>
        <br />
        <br />
      </Center>
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
            this.setState({
              autoRun: true
            })
            this.vis.reset()
          }}>{t('sort/controls/reset')}</a>
          <br />
          <br />
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
                this.setState(nextState, () => {
                  if (this.state.autoRun) {
                    this.runCode()
                  }
                })
              }} />
            <CodeLabel>{'}'}</CodeLabel>
            <br />
            <CodeLabel>
              {t('sort/101/title')}<br /><br />
              {t('sort/101/swap')}<br />
              <Ref>
                {'let tmp = input[0]'}<br />
                {'input[0] = input[1]'}<br />
                {'input[1] = tmp'}
              </Ref><br />
              {t('sort/101/if')}<br />
              <Ref>{'if (input[0] < input[1]) {'}</Ref>
              {` /* ${t('sort/101/if/true')} */ `}
              <Ref>{'} '}<br />{'else {'}</Ref>
              {` /* ${t('sort/101/if/false')} */ `}
              <Ref>{'}'}</Ref><br />
              {t('sort/101/for')}<br />
              <Ref>
                {'for (let i = 0; i < input.length; i++) {'}<br />
                &nbsp;&nbsp;{'if (input[i] < input[i + 1]) {'}</Ref>
                {` /* ${t('sort/101/for/inside')} */ `}
                <Ref>{'}'}<br />
                {'}'}
              </Ref>
            </CodeLabel>
            <br />
          </label>
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
