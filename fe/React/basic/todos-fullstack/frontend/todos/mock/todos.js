export default [
  {
    url: '/api/todos',
    method: 'GET',
    timeout: 1000,
    response: () => {
      return {
        code: 0,// 成功
        todos: [
          {
            id: 1,
            title: '学习前端接口工程',
            completed: true,
          },
          {
            id: 2,
            title: '看龙餐馆',
            completed: false,
          }
        ]
      }
    }
  }
]