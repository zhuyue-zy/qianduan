
import React from 'react'
import PropTypes from 'prop-types'
import WithLanguage from '../language/WithLanguage'
import './index.scss'

const _none = {}

class TitleBar extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { title, style, titleStyle } = this.props
    return <div className='jtitle-bar jdivider jflex-start-center shrink0' style={style ? style : _none}>
      <span className="jtitle-bar-text fw4 ell" style={titleStyle ? titleStyle : _none}>{title}</span>
      {this.props.subNode || null}
    </div>
  }
}

// TitleBar.propTypes = {
//   style: PropTypes.style,
//   titleStyle: PropTypes.style,
//   title: PropTypes.string,
//   children: PropTypes.Component
// }
export default WithLanguage(TitleBar)