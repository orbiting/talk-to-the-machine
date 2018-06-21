import React, { Component, Fragment } from 'react'
import { css } from 'glamor'

import { Interaction, RawHtml, Label, Center, Breakout, A, colors, mediaQueries } from '@project-r/styleguide'

import { t } from '../../lib/translate'
import { intersperse } from '../../lib/helpers'

import createVis from './createVis'
import { createInput, createResult } from './io'

import { loadPretrained, createModel } from './model'
import { loadData, train } from './data'

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

// Sorry ;)
const AButton = ({ onClick, children }) => (
  <A href='#' onClick={(e) => {
    e.preventDefault()
    onClick()
  }}>{children}</A>
)

class NeuralNetwork extends Component {
  constructor (props, ...args) {
    super(props, ...args)

    this.state = {
      modelType: 'pretrained'
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
    this.readTopology = () => {
      this.setState({
        topology: readTopology({model: this.model}),
        results: this.readResults(this.state.inputCanvas, this.state.results)
      })
    }
    this.loadModel = async (loader) => {
      this.model = await loader()
      this.result = createResult({
        model: this.model
      })
      this.readTopology()
    }
  }
  async componentDidMount () {
    window.addEventListener('resize', this.measure)
    this.measure()
    await this.loadModel(loadPretrained)
    this.input = createInput({
      onDraw: (canvas) => {
        this.setState({
          inputCanvas: canvas,
          results: this.readResults(canvas, this.state.results)
        })
      },
      onClear: () => {
        this.setState({
          inputCanvas: null,
          results: this.readResults(null, this.state.results)
        })
      }
    })
    this.inputRef.appendChild(this.input.canvas)
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
    const { modelType, accuracy, data } = this.state
    const isPretrained = modelType === 'pretrained'

    return (
      <Fragment>
        <Center>
          <ChartTitle>{t('nn/title')}</ChartTitle>
          <ChartLead>{t('nn/description')}</ChartLead>
          <br />

          <Label>{t('nn/draw')}</Label>
          <div {...styles.input} ref={this.setInputRef} />
          <Label>
            <AButton onClick={() => { this.input.clear() }}>
              {t('nn/draw/clear')}
            </AButton>
          </Label>
          <br /><br />

          <Label>{t('nn/network')}</Label>
        </Center>
        <div {...styles.chart} ref={this.setRef}>
          <canvas />
        </div>
        <Center>
          <Label>{t('nn/legend')}</Label>
          <br /><br />
          <ChartLead>
            {isPretrained
              ? t('nn/model/pretrained')
              : t(accuracy ? 'nn/model/trained' : 'nn/model/untrained', { accuracy })}
            {!isPretrained && !this.state.data && ` ${t('nn/model/untrained/data')}`}
          </ChartLead>
          <Label>{t('nn/model/create/label')}</Label>
          <ChartLead>
            {intersperse([
              !isPretrained && !data && <AButton key='load'
                onClick={() => { loadData().then(data => this.setState({data})) }}>
                {t('nn/model/create/load')}
              </AButton>,
              !isPretrained && !!data && <AButton key='train' onClick={() => {
                train(this.model, this.state.data, {
                  onBatchEnd: ({model}) => {
                    if (model !== this.model) {
                      return // e.g. an old model that is still training
                    }
                    this.readTopology()
                  },
                  onFitEnd: ({model, accuracy}) => {
                    if (model !== this.model) {
                      return // e.g. an old model that is still training
                    }
                    this.setState({accuracy: Math.round(accuracy * 1000) / 10})
                  }
                })
              }}>
                {t('nn/model/create/train')}
              </AButton>,
              <AButton key='new' onClick={() => {
                this.loadModel(createModel).then(() => {
                  this.setState({modelType: 'new', accuracy: undefined})
                })
              }}>
                {t('nn/model/create/new')}
              </AButton>,
              !isPretrained && <AButton key='pretrained' onClick={() => {
                this.loadModel(loadPretrained).then(() => {
                  this.setState({modelType: 'pretrained'})
                })
              }}>
                {t('nn/model/create/pretrained')}
              </AButton>
            ].filter(Boolean), (_, i) => <br key={`br${i}`} />)}
          </ChartLead>
          <Label>{t('nn/model/create/warning')}</Label>
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
