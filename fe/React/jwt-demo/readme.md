# jwt 登录鉴权
用的都是JWT  JSON Web Token 
- HTTP 是无状态 Stateless , 用户身份？ 你是谁？
- Header Authorization 
  Bear  Token   一串鉴权码 凭证 加密 
- /login admin 123456 
  {
    id:1,
    username: 'admin',
    role:'admin'
  }
  JSON 身份对象   =》 JWT（单向操作） => token 颁发给登陆者 
  每次带上token => authorization => decode => JSON 对象 

## zusatand 
轻量级的状态管理框架 react 全家桶 react + react-router-dom+zustand
- 父子传递 组件通信 状态共享
- createContext + useContext 跨层级共享 
- 登录与否，用户信息 全局状态 、
  全局共享， 跨路由 
  zustand 统一管理  store 状态仓库
  React App = UI Component + Store 

## mockjs 大前端 鉴权
- axios baseURL 
- vite mockjs 插件 
  /api/ 