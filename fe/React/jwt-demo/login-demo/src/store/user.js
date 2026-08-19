// 全局负责 提供用户身份状态
import { create } from 'zustand'
// hooks 编程，自定义hooks
export const useAuthStore = create(set => ({
  // set 修改状态的方法
  token:'111',
  user: null,
  // actions 操作state
  setAuth: ({token,user}) => {
    set({token,user})
  },
  logout: () => {
    set({token:'',user:null})
  }
}))