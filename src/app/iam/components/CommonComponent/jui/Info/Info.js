
import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'yqcloud-ui'
import WithLanguage from '../language/WithLanguage'
import './index.scss'

const _none = {}

class Info extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { info, style, infoStyle, iconColor } = this.props
    return <div className='jinfo jflex-start-center shrink0' style={style ? style : _none}>
      <Icon className='jinfo-icon' type="info" style={{ color: iconColor || '' }} />
      <span className="jinfo-text fw3 label-color" style={infoStyle ? infoStyle : _none}>{info}</span>
    </div>
  }
}

// Info.propTypes = {
//   style: PropTypes.style,
//   infoStyle: PropTypes.style,
//   iconColor: PropTypes.string,
//   info: PropTypes.string,
// }
export default WithLanguage(Info)