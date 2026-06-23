const arr = [1, [2, [3, 4, 5]]]
// 扁平化[1, 2, 3, 4, 5]
function flatten(arr) {
  let res = []
  for(let i = 0; i < arr.length; i++) {
    if(Array.isArray(arr[i])) {
      res = res.concat(flatten(arr[i]))
    } else {
      res.push(arr[i])
    }
  }
  return res
}
console.log(flatten(arr))