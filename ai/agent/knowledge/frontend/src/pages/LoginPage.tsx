import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
} from 'antd'
import BrandLogo from '../components/BrandLogo'

function LoginPage() {
  const [loading, setLoading] = useState(false)

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
         onFinish={async () => {
          setLoading(true)
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