// postgres 的 BIGINT 太大，会超出 js 安全数字范围，直接读会精度丢失。
// 转换器查出来自动转成字符串，入库再转回 bigint 类型，保持雪花ID 不变
import { ValueTransformer } from 'typeorm';

export const bigintTransformer: ValueTransformer = {
  to: (v) => v, // 入库时保持 bigint 类型

  from: (v) => (v == null ? v : String(v)),
};
