/**
 * Created by kanghua.pang on 2018/10/18.
 * 注：默认树的key按照parentKey-id格式存储数据,parentId为0的节点按0-id（因为跟节点不存在，所以用0代替root节点ID）存储。
 * 便于查询树节点时，快速找到对应节点(单向流)
 *
 * 默认树结构为 { id: num1, parentId: num2, ..., childList: Array }
 */


/**
 * 根据指定key查找节点
 * @param tree
 * @param key
 * @param childPropertyName
 * @returns {*}
 */
export function getNodeByKey(tree, key, childPropertyName) {
  if (key && tree && tree.length) {
    let temp = tree;
    let depth = 0;
    const childName = childPropertyName || 'children';
    for (let index = 0; index < key.length; index += 1) {
      if (index === key.length - 1) { // key在temp数组中
        temp = key.length > 1 ? temp.filter(obj => obj.key === key)[0] : null;
        break;
      }
      if (key.charAt(index) === '-') {
        depth += 1;
        if (depth >= 2) {
          const prekey = key.substr(0, index);
          temp = temp.filter(obj => obj.key === prekey);
          temp = temp[0][childName];
        }
      }
    }
    return temp;
  }
  return null;
}

/**
 * 宽度遍历获取指定节点
 * @param tree
 * @param id
 * @param childPropertyName
 * @returns {*}
 */
export function getNodeById(tree, id, childPropertyName) {
  const childName = childPropertyName || 'children';
  if (tree && tree.length && typeof id === 'number') {
    const queue = [...tree];
    while (queue.length) {
      const currentNode = queue.shift();
      if (currentNode.id === id) {
        return currentNode;
      } else if (currentNode[childName] && currentNode[childName].length) {
        queue.push(...currentNode[childName]);
      }
    }
  }
  return null;
}

/**
 * 获取指定节点集合下所有孩子指定属性的集合(null和undefined会过滤掉)
 * @param classifies
 * @param propertyName
 * @param childPropertyName
 * @param filterFunc
 * @returns {Array}
 */
export function getChildPropertys(classifies, propertyName, childPropertyName, filterFunc) {
  const keys = [];
  const childName = childPropertyName || 'children';
  const getChildKeys = (nodes) => {
    if (nodes) {
      nodes.forEach((item) => {
        if (item[`${propertyName}`] !== null && item[`${propertyName}`] !== undefined) {
          if (!filterFunc || filterFunc(item)) {
            keys.push(item[`${propertyName}`]);
          }
        }
        getChildKeys(item[childName]);
      });
    }
  };
  getChildKeys(classifies);
  return keys;
}

/**
 * 删除无效分类
 * @param nodes
 * @param childPropertyName
 */
export function dropNotActive(nodes, childPropertyName) {
  const childName = childPropertyName || 'children';
  if (nodes) {
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].active) {
        dropNotActive(nodes[i][childName]);
      } else {
        nodes.splice(i, 1);
        i -= 1;
      }
    }
  }
}

/**
 * 添加key属性
 * @param nodes
 * @param prekey
 * @param childPropertyName
 */
export function addKey(nodes, prekey, childPropertyName) {
  const childName = childPropertyName || 'children';
  if (nodes && nodes.length) {
    nodes.forEach((item) => {
      const temp = item;
      temp.key = `${prekey}-${item.id}`;
      addKey(item[childName], temp.key);
    });
  }
}

/**
 * 根据分类sort值排序
 * @param nodes
 * @param childPropertyName
 */
export function sortNodes(nodes, childPropertyName) {
  const childName = childPropertyName || 'children';
  if (Array.isArray(nodes)) {
    if (nodes && nodes.length) {
      nodes.sort((a, b) => a.sort - b.sort);
      nodes.forEach(node => sortNodes(node[childName]));
    }
  }
}

/**
 * 线性结构转树形结构，线性表中parentId为null或者undefined，该函数会自动过滤掉
 * @param list
 * @param childPropertyName
 * @returns {{id: number, parentId: null, children: Array}}
 */
export function listConvertTree(list, childPropertyName) {
  let root = null;
  if (list && list.length) {
    const childName = childPropertyName || 'children';
    root = { id: 0, parentId: null, [childName]: [] };
    const group = {};
    for (let index = 0; index < list.length; index += 1) {
      if (list[index].parentId !== null && list[index].parentId !== undefined) {
        if (!group[list[index].parentId]) {
          group[list[index].parentId] = [];
        }
        group[list[index].parentId].push(list[index]);
      }
    }
    const queue = [];
    queue.push(root);
    while (queue.length) {
      const node = queue.shift();
      node[childName] = group[node.id] && group[node.id].length ? group[node.id] : null;
      if (node[childName]) {
        queue.push(...node[childName]);
      }
    }
  }
  return root;
}

/**
 * 树形结构转线性结构，默认树结构为 { id: num1, parentId: num2, ..., children: Array }，
 * 节点parentId为null或者undefined，该函数会自动过滤掉
 * @param root
 * @param childPropertyName
 * @returns {Array}
 */
export function treeConvertList(root, childPropertyName) {
  const list = [];
  if (root) {
    const Root = JSON.parse(JSON.stringify(root));
    const queue = [];
    queue.push(Root);
    const childName = childPropertyName || 'children';
    while (queue.length) {
      const node = queue.shift();
      if (node[childName] && node[childName].length) {
        queue.push(...node[childName]);
      }
      delete node[childName];
      if (node.parentId !== null && node.parentId !== undefined) {
        list.push(node);
      }
    }
  }
  return list;
}
