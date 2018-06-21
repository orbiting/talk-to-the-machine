import React, { Component } from 'react'

import { Interaction, RawHtml, Label, Center, Breakout, A } from '@project-r/styleguide'

import { t } from '../../lib/translate'

import createVis from './createVis'
import { createInput, createResult } from './io'

import { loadPretrained } from './model'

import readTopology from './readTopology'

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
      <Center>
        <Interaction.H3>{t('nn/title')}</Interaction.H3>
        <Interaction.P>{t('nn/description')}</Interaction.P>
        <br />

        <Label>{t('nn/draw')}</Label>
        <div ref={this.setInputRef} />
        <Label><A href='#' onClick={(e) => {
          e.preventDefault()
          this.input.clear()
        }}>{t('nn/draw/clear')}</A></Label>
        <br /><br />

        <Label>{t('nn/network')}</Label>
        <Breakout size='breakout'>
          <div style={{
            overflow: 'auto'
          }} ref={this.setRef}>
            <canvas />
          </div>
        </Breakout>
        <Label>{t('nn/legend')}</Label>
        <br /><br />
        <RawHtml
          type={Label}
          dangerouslySetInnerHTML={{
            __html: t('nn/credits')
          }} />
      </Center>
    )
  }
}

export default NeuralNetwork
