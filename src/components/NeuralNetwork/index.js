import React, { Component, Fragment } from 'react'
import { css } from 'glamor'

import { Interaction, RawHtml, Label, Center, Breakout, A, colors, mediaQueries } from '@project-r/styleguide'

import { t } from '../../lib/translate'

import createVis from './createVis'
import { createInput, createResult } from './io'

import { loadPretrained } from './model'

import readTopology from './readTopology'

import { ChartTitle, ChartLead } from '../ChartTypo'

const styles = {
  input: css({
    '& canvas': {
      marginTop: 3,
      border: `1px solid ${colors.divider}`
    }
  }),
  chart: css({
    overflow: 'auto', 
    maxWidth: 975,
    [mediaQueries.mUp]: {
      marginLeft: `calc(50% - ${725 / 2}px)`
    }
  })
}

class NeuralNetwork extends Component {
  constructor (props, ...args) {
    super(props, ...args)

    this.state = {
      // model
    }

    this.setRef = ref => {
      this.ref = ref
    }
    this.setInputRef = ref => {
      this.inputRef = ref
    }

    this.measure = () => {
      if (this.ref) {
        const { width } = this.ref.getBoundingClientRect()
        if (width !== this.state.width) {
          this.setState({width})
        }
      }
      return this.state
    }
    this.readResults = (canvas, prev) => {
      if (prev) {
        prev.forEach(result => {
          result.dispose()
        })
        // rm to not re-dispose
        prev.splice(0)
      }
      if (!canvas) {
        return null
      }
      return this.result.read(canvas)
    }
  }
  async componentDidMount () {
    window.addEventListener('resize', this.measure)
    this.measure()
    this.model = await loadPretrained()
    this.result = createResult({
      model: this.model
    })
    this.input = createInput({
      onDraw: (canvas) => {
        this.setState({
          results: this.readResults(canvas, this.state.results)
        })
      },
      onClear: () => {
        this.setState({
          results: this.readResults(null, this.state.results)
        })
      }
    })
    this.inputRef.appendChild(this.input.canvas)

    this.setState({
      topology: readTopology({model: this.model})
    })
  }
  componentDidUpdate (prevProps, prevState) {
    let shouldDraw = false
    if (prevState.width !== this.state.width) {
      this.vis = createVis({
        canvas: this.ref.firstChild,
        width: this.state.width
      })
      shouldDraw = true
    }
    if (prevState.topology !== this.state.topology || prevState.results !== this.state.results) {
      shouldDraw = true
    }

    if (shouldDraw) {
      this.vis.draw(this.state.topology, this.state.results)
    }
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.measure)
  }
  render () {
    return (
      <Fragment>
        <Center>
          <ChartTitle>{t('nn/title')}</ChartTitle>
          <ChartLead>{t('nn/description')}</ChartLead>
          <br />

          <Label>{t('nn/draw')}</Label>
          <div {...styles.input} ref={this.setInputRef} />
          <Label><A href='#' onClick={(e) => {
            e.preventDefault()
            this.input.clear()
          }}>{t('nn/draw/clear')}</A></Label>
          <br /><br />

          <Label>{t('nn/network')}</Label>
        </Center>
        <div {...styles.chart} ref={this.setRef}>
          <canvas />
        </div>
        <Center>
          <Label>{t('nn/legend')}</Label>
          <br /><br />
          <RawHtml
            type={Label}
            dangerouslySetInnerHTML={{
              __html: t('nn/credits')
            }} />
        </Center>
      </Fragment>
    )
  }
}

export default NeuralNetwork
