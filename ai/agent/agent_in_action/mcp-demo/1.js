const obj = {
  'bytedance': ['AI全栈开发', 'Agent 工程师'],
  'tecent': ['后端开发', 'Agent 工程师'],
  '163': ['前端开发']
}

for(let key in obj) {
  console.log(key, obj[key])
}
// Object.entries(obj) 会把对象转换为一个二维数组，每个元素是一个数组，数组的第一个元素是key，第二个元素是value的数组
for(let [key, value] of Object.entries(obj)) {
  console.log(key, value)
}