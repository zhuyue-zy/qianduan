import React from 'react'
import PropTypes from 'prop-types'
import WithLanguage from '../language/WithLanguage'
import './index.scss'

const _none = {}

class UploadBtn extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { style, onClick } = this.props
    return <div className='jadd-btn-upload' style={style ? style : _none} onClick={onClick ? onClick : () => { }}></div>
  }
}

// UploadBtn.propTypes = {
// style: PropTypes.style,
//   onClick: PropTypes.func
// }
export default WithLanguage(UploadBtn)