import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { authApi } from '../api'

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="kh-login">
      <Card className="kh-login-card">
        <div className="kh-login-title">
          <BrandLogo size={40} />
          <h1>Knowledge Hub</h1>
          <p>登录后使用文档、检索、问答与图谱</p>
        </div>
        <Form
         layout='vertical'
         initialValues={{username:"user", password:"123456"}}
         onFinish={async (values) => {
          setLoading(true)
          try {
            await authApi.login(values.username, values.password)
            navigate('/')
          } catch (error) {
            message.error(error instanceof Error ? error.message : '登录失败')
          } finally {
            setLoading(false)
          }
         }}
        >
          <Form.Item name="username" label="用户名"
          rules={[{ required: true }]}
          >
            <Input size="large" placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码"
          rules={[{ required: true }]}
          >
            <Input.Password size="large" placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage