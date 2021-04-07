import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Checkbox, Modal, Input, Icon } from 'yqcloud-ui';
import { List } from "react-virtualized";
import './PersonSearch.scss';
import AnnouncementStore from '../../../../stores/organization/announcement/index';

const intlPrefix = 'organization.setting.announcement';
const { Search } = Input;

@inject('AppState')
@observer
export default class PositionSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkValues: new Set(),
      dataList: [],
      current: 2,
      queryStatus: false
    };
  }

  componentWillMount() {
    this.setState({
      dataList: this.props.data,
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({
        dataList: nextProps.data.length > 0 ?  nextProps.data.slice(0, 20) : [],
      });
    }
  }

  componentDidMount() {
    this.onScroll();
  }

  onScroll() {
    if (document.getElementById('left-main')) {
      document.getElementById('left-main').onscroll = this.scrollSession = () => {
        const ele = document.getElementById('left-main');
        if (ele && ele.scrollHeight === ele.clientHeight + ele.scrollTop) {
          console.log('123123');
          this.onScrollBottom();
        }
      };
    }
  }

  onScrollBottom = () => {
    const { dataList, queryStatus } = this.state;
    const { data } = this.props;
    const dataLengh = dataList.length;

    if (dataLengh >= data.length) {

      this.setState({
        sessionLoading: false,
      });
      return;
    }
    if (!queryStatus){
      let num = this.state.current * 20;
      this.setState({
        sessionLoading: true,
        current: this.state.current + 1,
        dataList: this.props.data.slice(0, num)
      });
    }

  }

  onChange = (value) => {
    const { data } = this.props;
    const newData = data.filter(v => (`${v.organizationName || ''}${v.organizationCode || ''}${v.organizationCode || ''}`).indexOf(value) !== -1);
    this.setState({ data: newData, searchValue: value });
  }


  renderLeft = () => (
    <div style={{ height: '100%' }}>
      <div>
        <Search
          placeholder={AnnouncementStore.languages[`${intlPrefix}.searchDep`]}
          enterButton
          value={this.state.searchValue}
          onSearch={(value) => {
            this.setState({
              queryStatus: true,
              dataList: []
            })
            if (value) {
              const { data } = this.props;
              const newData = data.filter(v => (`${v.organizationName || ''}${v.organizationCode || ''}${v.parentName || ''}`).indexOf(value) !== -1);
              this.setState({ dataList: newData, queryStatus:  true});
            } else {true
              this.setState({
                dataList: this.props.data.slice(0, 20),
                queryStatus: false
              })
            }
          }}
          onChange={(e) => {
            this.setState({
              searchValue: e.target.value,
            });
          }}
        />
      </div>
      <div className="left-main" id='left-main' onScroll={this.onScroll.bind(this)}>
        {this.state.dataList.map(element => (
          <div className="left-item" key={element.organizationId}>
            <div className="item-left">
              <p>
                <span>{element.organizationName}</span>
                <span>{element.organizationCode}</span>
              </p>
              <p>
                {element.parentName}
              </p>
            </div>
            <div className="item-right">
              <Checkbox
                checked={!!Array.from(this.state.checkValues)
                  .find((v => v.organizationId === element.organizationId))}
                onChange={(e) => {
                  const { checkValues } = this.state;
                  if (e.target.checked) {
                    checkValues.add(element);
                  } else {
                    checkValues.delete(element);
                  }
                  this.setState({ checkValues });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  renderRight = () => {
    const { checkValues } = this.state;
    return (
      <div>
        <div className="right-top">
          <span>{AnnouncementStore.languages[`${intlPrefix}.selectedDep`]}</span>
          <span>{AnnouncementStore.languages[`${intlPrefix}.chosen`]}{checkValues.size}{AnnouncementStore.languages[`${intlPrefix}.piece`]}</span>
        </div>
        <div className="left-main">
          {Array.from(checkValues)
            .map(element => (
              <div className="left-item" key={element.organizationId}>
                <div className="item-left">
                  <p>
                    <span>{element.organizationName}</span>
                    <span>{element.organizationCode}</span>
                  </p>
                  <p>
                    {element.parentName}
                  </p>
                </div>
                <div className="item-right">
                  <Icon
                    type="yizhongzhi"
                    style={{
                      fontSize: 16,
                      right: 10,
                      color: '#B8BECC',
                    }}
                    onClick={() => {
                      const { checkValues: inCheckValues } = this.state;
                      inCheckValues.delete(element);
                      this.setState({ checkValues: inCheckValues });
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  clearBuffer = () => {
    this.setState({
      checkValues: new Set(),
      dataList: [],
      searchValue: '',
      current: 2
    });
  };

  render() {
    const { visible, onHide, onSave } = this.props;

    return (
      <Modal
        className="announcement-search-component"
        title={AnnouncementStore.languages[`${intlPrefix}.orgMoadl`]}
        visible={visible}
        okText={AnnouncementStore.languages.save}
        cancelText={AnnouncementStore.languages.cancel}
        onCancel={() => {
          this.clearBuffer();
          onHide();
        }}
        footer={[
          <Button
            key="submit"
            funcType="raised"
            type="primary"
            style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
            onClick={(e) => {
              if (this.state.checkValues.size > 0) {
                onSave(Array.from(this.state.checkValues));
                this.clearBuffer();
                onHide();
              } else {
                AnnouncementStore.getCode('organization.setting.announcement.submitFiledOrg');
              }
            }}
          >
            {AnnouncementStore.languages.save}
          </Button>,
          <Button
            key="back"
            funcType="raised"
            style={{ marginRight: '20px' }}
            onClick={() => {
              this.clearBuffer();
              onHide();
            }}
          >
            {AnnouncementStore.languages.cancel}
          </Button>,
        ]}
      >
        <div className="search">
          <div className="search-left">
            {this.renderLeft()}
          </div>
          <div className="search-right">
            {this.renderRight()}
          </div>
        </div>
      </Modal>
    );
  }
}
