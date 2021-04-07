import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Dropdown, Menu, Button, Icon } from 'yqcloud-ui';

const { Item, Divider } = Menu;
class Operate extends Component {
  refresh = () => {
    this.props.refreshModule();
  };

  edit = () => {
    this.props.editModule();
  };

  delete = () => {
    this.props.deleteModule();
  }

  render() {
    const menu = (
      <Menu>
        <Item key="1">
          <a onClick={this.refresh}><FormattedMessage id="refresh" /></a>
        </Item>
        <Divider />
        <Item key="2">
          <a onClick={this.edit}><FormattedMessage id="edit" /></a>
        </Item>
        <Divider />
        <Item key="3">
          <a onClick={this.delete}><FormattedMessage id="delete" /></a>
        </Item>
      </Menu>
    );

    return (
      <div>
        <Dropdown
          overlay={menu}
          placement="bottomRight"
          trigger="click"
          getPopupContainer={() => document.getElementsByClassName('workBenchMain')[0].parentNode}
        >
          <Button shape="circle" icon="more_horiz" />
        </Dropdown>
      </div>
    );
  }
}

Operate.propTypes = {
  refreshModule: PropTypes.func,
  editModule: PropTypes.func,
  deleteModule: PropTypes.func,
};

export default Operate;
