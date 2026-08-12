// 一个模块一个js文件
import axios from './config'

// api 目录的职责 提供数据接口
// 不是直接就去后端，后端没有开发好，和我们分离
export const getTodos = async () => {
  const res = await axios.get('/todos')
  return res.data
}
