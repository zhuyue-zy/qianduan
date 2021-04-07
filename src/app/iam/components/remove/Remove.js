/*eslint-disable*/
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Modal, Icon, Col, Row, Button } from 'yqcloud-ui';
import PropTypes from 'prop-types';

class Remove extends React.Component {
  render() {
    const { open, handleCancel, handleConfirm, modalContent } = this.props;
    return (
      <Modal
        visible={open || false}
        width={400}
        onCancel={handleCancel}
        maskClosable={false}
        wrapClassName="vertical-center-modal remove"
        footer={<div><Button
          onClick={handleCancel}
        ><FormattedMessage id="cancel" /></Button><Button
          type="primary"
          onClick={handleConfirm}
        ><FormattedMessage id="delete" /></Button>
        </div>}
      >
        <Row>
          <Col span={24}>
            <Col span={2}>
              <a style={{ fontSize: 20, color: '#ffc07b' }}>
                <Icon style={{ fontSize: 20, lineHeight: '21px' }} type="help_outline" />
              </a>
            </Col>
            <Col span={22}>
              <h2><FormattedMessage id="confirm.delete" /></h2>
            </Col>
          </Col>
        </Row>
        <Row>
          <Col offset={2}>
            <div style={{ marginTop: 10 }}>
              <span>{modalContent}</span>
            </div>
          </Col>
        </Row>
      </Modal>
    );
  }
}
Remove.propTypes = {
  open: PropTypes.bool,
};
export default Remove;
