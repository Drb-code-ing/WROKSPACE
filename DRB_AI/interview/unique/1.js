/**
 * @func 数组去重
 * @param {Array} arr - 输入数组
 * @returns {Array} - 去重后的数组  
 * @author DRB_AI
 * @date 2026-05-27
 */
function unique(arr) {
  // 参数效验 不是数组就返回
  if (!Array.isArray(arr)) {
    throw new Error('参数必须是数组')
  }

  // 俩重循环去重
  /*for(let i = 0; i < arr.length; i++) {
    for(let j = i + 1; j < arr.length; j++) {
      if(arr[i] === arr[j]) {
        arr.splice(j, 1)
        j--
      }
    }
  }
  return arr*/

  // indexOf 方法去重
  const res = []
  /*for(let i = 0; i < arr.length; i++) {
    // if(res.indexOf(arr[i]) === -1) {
      // res.push(arr[i])
    // }
    if(arr.indexOf(arr[i]) === i) {
      res.push(arr[i])
    }
  }
  return res*/

  // 先排序，相邻项比较
  /*arr.sort((a, b) => a - b)
  for(let i = 0; i < arr.length; i++) {
    if(arr[i] !== arr[i + 1]) {
      res.push(arr[i])
    }
  }
  return res*/

  // hash table | 对象的字面量属性去重
  /*let obj = {}
  for(let i = 0; i < arr.length; i++) {
    if(!obj[arr[i]]) {
      res.push(arr[i])
      obj[arr[i]] = 1
    } else {
      obj[arr[i]]++//附带功能
    }
  }
  return res*/

  // hash Map
  /*let map = new Map()
  for(let i = 0; i < arr.length; i++) {
    if(!map.has(arr[i])) {
      map.set(arr[i], 1)
      res.push(arr[i])
    } else {
      map.set(arr[i], map.get(arr[i]) + 1)
    }
  }
  return res*/

  // hash Set 去重
  return [...new Set(arr)]
}

console.log(unique([1,2,3,2,3]))
