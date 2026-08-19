import jwt from 'jsonwebtoken';
const secret = 'secret819!$'
export default [
  {
    // 401
    url: '/api/repo',
    method: 'get',
    response: req => {
      // 未登录时请求头里没有 authorization，不能直接调用 split
      const authorization = req.headers?.authorization;
      if (!authorization?.startsWith('Bearer ')) {
        return {
          code: 401,
          msg: 'Missing authorization token',
        };
      }

      // Bearer XXXX：取出 Bearer 后面的 JWT 字符串
      const token = authorization.split(' ')[1];
      console.log(token);
      try {
        const decoded = jwt.verify(token, secret);
        console.log(decoded);
        return {
          code: 0,
          data: decoded.user
        }
      } catch {
        return {
          code: 401,
          msg: 'Invalid token'
        }
      }
    }
  },
  {
    url: '/api/login',
    method: 'post', 
    timeout: 2000,
    response: req => {
      const body = req.body;
      console.log(body);
      if (body.username !== 'admin' || body.password !== '123456') {
        return {
          code: -1,
          message: 'username or password 错误'
        }
      }
      // 服务器端 给用户颁发token 
      // user json 放入   J
      // Web  StateLess  W
      // Token 加密算法 颁发的令牌 加盐 秘密的key
      const token = jwt.sign(
        { 
          user: body.username,
          role: 'admin'
        },
        secret,
        {
          expiresIn: 86400
        }
      )
      return {
        code: 0,  // 未有错误
        user: {
          username: body.username
        },
        token: token
      }
    }
  }
]