import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'yqcloud-ui'
import WithLanguage from '../language/WithLanguage'
import './index.scss'

const _none = {}

class AddBtn extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { label, style, iconStyle, onClick } = this.props
    return <div
      className='jadd-btn pointer'
      style={style ? style : _none}
      onClick={(e) => { onClick ? onClick(e) : function () { } }}>
      <Icon className='jadd-btn-icon' style={iconStyle || _none} type="shu-xinjian" />
      <span className='jadd-btn-label'>{label}</span>
    </div>
  }
}

// AddBtn.propTypes = {
//   label: PropTypes.string,
//   style: PropTypes.style,
//   iconStyle: PropTypes.style,
//   onClick: PropTypes.func
// }
export default WithLanguage(AddBtn)