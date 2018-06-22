import PropTypes from 'prop-types'
import React, { Component } from 'react'

class CodeError extends Component {
  constructor(props, ...args) {
    super(props, ...args)
    this.state = {
      visible: false
    }
    this.clear = () => {
      if (this.timeout !== undefined) {
        clearTimeout(this.timeout)
      }
    }
    this.check = (props) => {
      this.clear()
      if (props.message) {
        this.timeout = setTimeout(
          () => this.setState({ visible: true }),
          this.props.delay
        )
      } else if (this.state.visible) {
        this.setState({ visible: false })
      }
    }
  }
  componentDidMount() {
    this.check(this.props)
  }
  componentDidUpdate() {
    this.check(this.props)
  }
  componentWillUnmount() {
    this.clear()
  }
  render() {
    const { visible } = this.state
    const { message } = this.props

    if (visible && message) {
      return <pre>{message}</pre>
    }
    return null
  }
}

CodeError.propTypes = {
  message: PropTypes.string,
  delay: PropTypes.number.isRequired
}

CodeError.defaultProps = {
  delay: 500
}

export default CodeError
