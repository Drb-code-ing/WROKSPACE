import axios from './config'

export const getRepo = async () => {
  const res = await axios.get('/repo')
  console.log(res)
  return res.data
}
