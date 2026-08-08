import { useRef } from 'react'


function CommentBox() {
  const textareaRef = useRef(null)

  const handleSubmit = () => {
    const comment = textareaRef.current.value
    if(!comment) return
    console.log(comment)
  }

  return (
    <>
      <div>
        <textarea 
         ref={textareaRef}
         placeholder="请输入评论"
         />
        <textarea />
        <button onClick={handleSubmit}>提交评论</button>
      </div>
    </>
  )
}

export default CommentBox