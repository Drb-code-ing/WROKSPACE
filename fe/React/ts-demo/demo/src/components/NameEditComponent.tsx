import * as React from 'react'

interface Props {
  initialName:string
  editingName:string
  onEditingNameUpdated:(newEditingName:string)=>void
  onNameUpdated:()=>void
  disabled:boolean
}

const NameEditComponent:React.FC<Props> = (props) => {
    const {
      editingName,
      onEditingNameUpdated,
      onNameUpdated,
      disabled
    } = props

    const onChange = (event:React.ChangeEvent<HTMLInputElement>) => {
      onEditingNameUpdated(event.target.value)
    }

    const onNameSubmit = () => {
      onNameUpdated()
    }

    return (
        <>
          <label>Update Name:</label>
          <input
          value={editingName}
          onChange={onChange}
          ></input>
          <button disabled={disabled} onClick={onNameSubmit}>Change</button>
        </>
    )
}

export default NameEditComponent
