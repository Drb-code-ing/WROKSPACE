import {
  ControlledInput,
  UncontrolledInput,
  CommentBox,
  RegisterForm,
  LoginForm,
} from './components'


function App() {

  return (
    <>
      <ControlledInput /><br />
      <UncontrolledInput /><br />
      <CommentBox /><br />
      <RegisterForm /><br />
      <LoginForm />
    </>
  )
}

export default App