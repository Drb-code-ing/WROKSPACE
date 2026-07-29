import * as React from 'react'

// interface Props{
    // username:string
    // onChange:(event:React.ChangeEvent<HTMLInputElement>) => void
// }

interface Props {
  // 接口不是json, ; 隔开
  initialUsername: string
  onNameUpdated: (newName: string) => void
}

// const NameEditComponent:React.FC<Props>=(props) => {
    // return (
        // <div>
            {/* <label>Update name:</label> */}
            {/* <input type="text" value={props.username} onChange={props.onChange} /> */}
        {/* </div> */}
    // )
// }

const NameEditComponent:React.FC<Props> = (props) => {
  // 表单事件 自己打理
  const [editingName, setEditingName] = React.useState(props.initialUsername)
  const onChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value)
  }

  const onNameSubmit = () => {
    props.onNameUpdated(editingName)
  }

  return (
    <>
      <label>Update name:</label>
      <input value={editingName} onChange={onChange}></input>
      <button onClick={onNameSubmit}>Change</button>
    </>
  )
}

export default NameEditComponent