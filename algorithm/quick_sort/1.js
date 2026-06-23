// 治
function partition(nums, left, right) {
  let i = left, j = right
  // 检查一遍数组
  while(i < j) {
    // 第一项作为基准值
    // 不开销新的空间，原地排序
    while(i < j && nums[j] >= nums[left]) {
      j--
    }
    while(i < j && nums[i] <= nums[left]) {
      i++
    }
    // 交换位置
    [nums[i], nums[j]] = [nums[j], nums[i]]
    return i
  }
}

function quickSort(nums, left, right) {
  if(left >= right) {
    return
  }
  let pivot = partition(nums, left, right)
  quickSort(nums, left, pivot - 1)
  quickSort(nums, pivot + 1, right)
}

const arr = [2, 4, 1, 0, 3, 5]
quickSort(arr, 0, arr.length - 1)
console.log(arr)
