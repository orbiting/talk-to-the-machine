import React, { Component } from 'react'
import { css } from 'glamor'
import { Button, Field } from '@project-r/styleguide'
import AutosizeInput from 'react-textarea-autosize'

import setupVis from './setupVis'
import randomWrong from '../../lib/randomWrong'
import { transformCode } from '../../lib/babel'

const styles = {
  autoSize: css({
    minHeight: 40,
    paddingTop: '7px !important',
    paddingBottom: '6px !important',
    background: 'transparent'
  })
}

const renderAutoSizeInput = ({ref, ...inputProps}) => (
  <AutosizeInput {...styles.autoSize}
    {...inputProps}
    inputRef={ref} />
)

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
      <div ref={this.setRef} />
      <Field label='Code' value={this.state.code} renderInput={renderAutoSizeInput} black onChange={(_, code) => {
        this.setState({
          code
        })
        this.setState({
          run: makeFn(code)
        })
      }} />
      <Button black onClick={async e => {
        e.preventDefault()
        const returnValue = await this.state.run(this.state.data, () => {
          return this.update([].concat(this.state.data))
        })
        this.update(returnValue || this.state.data).then(() => {
          this.setState({data: returnValue || this.state.data})
        })
      }}>Run</Button>
      {' '}
      <Button black onClick={e => {
        e.preventDefault()
        this.vis.reset()
      }}>Reset</Button>
    </div>
  }
}

Sort.defaultProps = {
  answer: [0, 1, 2, 3, 4]
}

export default Sort
