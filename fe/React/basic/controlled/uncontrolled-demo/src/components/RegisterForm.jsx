import { useState } from 'react'


function RegisterForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(form)
  }


  return (
    <>
      <div>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="请输入用户名"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="请输入密码"
        />
        <button type="submit" onClick={handleSubmit}>提交</button>
      </div>
    </>
  )
}

export default RegisterForm