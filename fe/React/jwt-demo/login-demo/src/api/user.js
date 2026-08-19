import axios from './config'

export const login = async (data) => {
  const res = await axios.post('/login',data)
  return res.data
}