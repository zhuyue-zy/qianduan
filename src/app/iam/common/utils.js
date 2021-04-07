/* eslint-disable no-unused-vars */
import { DeltaOperation } from 'react-quill';

/* 数据深拷贝 */
export function deepClone(obj) {
  const copy = JSON.stringify(obj);
  const objClone = JSON.parse(copy);
  return objClone;
}
