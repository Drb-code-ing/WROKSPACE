import { useState } from "react";
import "./index.css"

const LoginForm = () => {
  const [form,setForm] = useState({
    username:"",
    password:""
  })
  const [error,setError] = useState({})
  const validate=(name,value)=>{
    let msg = "";
    if(name==="username"){
      if(!value) {
        msg = "用户名为空"
      }else if(value.length<3){
        msg = "用户名长度不能小于3"
      }
    }
    if(name==="password"){ 
      if(!value) {
        msg = "密码为空"
      }else if(value.length<8){
        msg = "密码长度不能小于8"
      }
     }
     setError(prev=>({
      ...prev,
      [name]:msg
     }))
    
    }

  const handleChange=e =>{
      const {name,value} = e.target
      setForm({
        ...form,
        [name]:value
      })
      setError({
        ...error,
        [name]:validate(name,value)
      })
      validate(name,value)
     }

  const isVaild= form.username && form.password && 
  !error.username && !error.password
  const handleSubmit = e=>{
    e.preventDefault();
    if(!isVaild)  return
    console.log(form,"-----------------")
  }


  return (
    <div className="login-wrapper">
      <form>
        <h2>登录</h2>
        <div className="form-item">
          <label>
            用户名
          </label>
          <input type="text" name="username" 
          value={form.username}
          placeholder="请输入用户名"
          onChange={handleChange}
          />{error.username && <span className="error">{error.username}</span>}
        </div>
        <div className="form-item">
          <label>
            密码
          </label>
          <input type="text" name="password" 
          value={form.password}
          placeholder="请输入密码"
          onChange={handleChange}
          />{error.password && <span className="error">{error.password}</span>}
        </div>
        <button type="submit" onClick={handleSubmit} disabled={!isVaild}>提交</button>
      </form>
    </div>

  )
}

export default LoginForm;