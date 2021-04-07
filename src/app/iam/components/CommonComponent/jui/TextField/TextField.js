import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'yqcloud-ui'
import WithLanguage from '../language/WithLanguage'
import './index.scss'

const _none = {}

class TextField extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { style, fieldStyle, onClick, message } = this.props
    const error = message ? 'jtext-field-error' : ''
    return <div className={`jtext-field ${error}`} style={style || _none}>
      <Input {...this.props} style={fieldStyle || _none} />
      <p className='jtext-field-message'>{message}</p>
    </div>
  }
}

// TextField.propTypes = {
//   label: PropTypes.string,
//   style: PropTypes.style,
//   iconStyle: PropTypes.style,
//   onClick: PropTypes.func
// }
export default WithLanguage(TextField)