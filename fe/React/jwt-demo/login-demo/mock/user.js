import { sign } from 'jsonwebtoken'


export default [
  {
    url: '/api/login',
    method: 'POST',
    timeout: 1000,
    response: (req, res) => {
      const body = req.body
      console.log(body)
      if(body.username !== 'admin' || body.password !== '123456') {
        return {
          code: 1, // 出现错误
          msg: '用户名或密码错误'
        }
      }
      // 服务器端 给用户颁发token
      // user json 放入   J
      // Web Stateless   W
      // Token 加密算法 颁发的令牌 加盐 秘密的key   T
      const token = sign(
        {
          user: body.username,
          role: 'admin',
        },
        'secret819!$',
        {
          expiresIn: '1h',// 过期时间
        }
      )

      return {
        code: 0, // 未出现错误
        user: {
          username: '牛牛'
        },
        token: '111'
      }
    }
  }
]