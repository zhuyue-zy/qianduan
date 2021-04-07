import React from 'react';
import * as dagreD3 from 'dagre-d3';
import * as d3 from 'd3';

const rdom = require('react-dom');

class DagreD3 extends React.Component {
  static defaultProps = {
    width: '100%',
    height: '100%',
    nodes: {},
    edges: [],
    graph: {},
    interactive: false,
    onNodeClick: () => {},
  }

  componentDidMount() {
    this.renderDag();
  }

  shouldComponentUpdate(nextProps) {
    return !(this.props.nodes === nextProps.nodes)
      || !(this.props.edges === nextProps.edges);
  }

  componentDidUpdate() {
    this.renderDag();
  }

  setNodeTree = (nodeTree) => {
    this.nodeTree = nodeTree;
  }

  setNodeTreeInner = (nodeTreeInner) => {
    this.nodeTreeInner = nodeTreeInner;
  }

  renderDag() {
    const { nodes, edges, interactive, fit, onNodeClick, graph } = this.props;
    const g = new dagreD3.graphlib.Graph()
      .setGraph({ ...graph }) // Set an object for the graph label
      .setDefaultNodeLabel(() => ({}))
      .setDefaultEdgeLabel(() => ({})); // Default to assigning a new object as a label for each new edge.

    // 生成节点块(仅适用于工作流流程图展示)
    Object.keys(nodes).forEach((ids) => {
      const el = nodes[ids];
      if (el.currentNote) {
        g.setNode(ids, {
          id: el.id,
          label: el.name,
          style: 'stroke: Orange; fill: Orange;  stroke-width:2;',
        });
      } else if (el.status === 'N') {
        g.setNode(ids, {
          id: el.id,
          label: el.name,
          style: 'stroke: #2196F3; fill: none; stroke-width:2;',
        });
      } else if (el.status === 'Y') {
        g.setNode(ids, {
          id: el.id,
          label: el.name,
          style: 'stroke: #77FF00; fill: none; stroke-width:2;',
        });
      } else if (el.status === 'JUMP') {
        g.setNode(ids, {
          id: el.id,
          label: el.name,
          style: 'stroke: #818999; fill: none; stroke-width:2;',
        });
      } else {
        g.setNode(ids, {
          id: el.id,
          label: el.name,
          style: 'stroke: #818999; fill: none; stroke-width:2;',
        });
      }
    });

    // 节点块基础样式(仅适用于工作流流程图展示)
    g.nodes().forEach((v) => {
      const node = g.node(v);
      node.rx = 5;
      node.ry = 5;
      node.height = 32;
    });

    // 生成连接节点线(仅适用于工作流流程图展示)
    if (nodes[0].lines !== null) {
      Object.keys(nodes[0].lines).forEach((i) => {
        const el = nodes[0].lines[i];
        g.setEdge(el.start, el.end, {
          style: 'stroke: #818999; fill: none;',
          arrowheadStyle: 'fill: #818999;stroke: #818999; stroke-width:2;',
          arrowhead: 'vee',
        });
      });
    }


    const svg = d3.select(this.nodeTree);
    const inner = d3.select(this.nodeTreeInner);
    if (interactive) { // 自适应缩放
      const zoom = d3.zoom().on('zoom', () => {
        inner.attr('transform', d3.event.transform);
      });


      svg.call(zoom);
    }


    const render = new dagreD3.render(); // eslint-disable-line
    render(inner, g);
    // 自适应宽高
    if (onNodeClick) { // 点击事件
      svg.selectAll('g.node').on('click',
        id => onNodeClick(id));
    }
  }

  render() {
    const { width, height } = this.props;
    return (
      <svg width={width} height={550} fontSize="14" ref={this.setNodeTree}>
        <g ref={this.setNodeTreeInner} transform="translate(300,80)" />
      </svg>
    );
  }
}

export { d3 };
export default DagreD3;
