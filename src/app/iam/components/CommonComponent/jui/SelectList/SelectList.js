
import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'yqcloud-ui'
import WithLanguage from '../language/WithLanguage'
import './index.less'

const _none = {}

class SelectList extends React.Component {
  constructor(props) {
    super(props)
  }

  onSelectClick(record) {
    let portalProjectList = PortalManagementStore.portalProjectList
    let portalIndex = portalProjectList.findIndex(item => item.projectId === record.projectId)
    if (portalIndex > -1) {
      portalProjectList[portalIndex].visible = !portalProjectList[portalIndex].visible
      PortalManagementStore.setPortalList(portalProjectList)
    }
  }

  render() {
    const { keyField, valueField, visible, data, renderFilter } = this.props
    return <div className='jselector'>
      <div className='jselector-text-box' onClick={() => {
        this.onSelectClick(record)
      }}>
        <input type='text' value={project.projectCode} />
        <i className='jselector-arrow'></i>
      </div>
      {visible
        ?
        <div className='jselector-value-box'>
          <div className='jselector-scroll-hide-wrap'>
            {data.map(item => {
              var style = ''
              if (item[keyField] === record.projectId) {
                style = 'jselector-option-item-checked'
              }
              return <div
                key={record.rankNumber + 'optionRow_' + item.projectId}
                className={`jselector-option-item ${style}`}
                onClick={() => this.onOptionClick(item, record)}>
                <span style={{ width: '120px', paddingRight: 40 }}> {item.projectCode}</span>
                <span style={{ width: '170px' }}> {item.projectName}</span>
              </div>
            })}
          </div>
        </div>
        : null
      }
    </div>
  }
}

// SelectList.propTypes = {
//   style: PropTypes.style,
//   infoStyle: PropTypes.style,
//   iconColor: PropTypes.string,
//   info: PropTypes.string,
// }
export default WithLanguage(SelectList)
