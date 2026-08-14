import dayjs from 'dayjs'

export default async function SidebarNoteList({ notes }) {
  const arr = Object.entries(notes); // hash 转成二维数组 方便map 组件
  if (arr.length == 0) {
    return <div className="notes-empty">
    No Notes created yet!
    </div>
  } 

  return (
    <ul className="notes-list">
    {
      arr.map(([noteId, note]) => {
        const { title, updateTime } = JSON.parse(note);
        return (
          <li key={noteId}>
            <header className="sidebar-note-header">
              <strong>{title}</strong>
              <small>{dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss')}</small>
            </header>
          </li>
        )
      })
    }
    </ul>
  )
}