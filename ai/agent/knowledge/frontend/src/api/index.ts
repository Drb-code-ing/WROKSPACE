// 登录模块api
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export const authApi = {
  async login(username: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => null)
      throw new Error(error?.message ?? '登录失败')
    }
    return res.json()
  },
}
