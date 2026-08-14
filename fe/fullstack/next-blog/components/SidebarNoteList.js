import SidebarNoteItem from './SidebarNoteItem'
// SidebarNoteList(RSC SEO) -> 拆出来 SidebarNoteItem 组件(交互 CSR)

export default async function SidebarNoteList({ notes }) {
  const arr = Object.entries(notes);
  if (arr.length == 0) {
    return <div className="notes-empty">
    No Notes created yet!
    </div>
  }

  return (
    <ul className="notes-list">
    {
      arr.map(([noteId, note]) => {
        return (
          <li key={noteId}>
            <SidebarNoteItem noteId={noteId} note={JSON.parse(note)} />
          </li>
        )
      })
    }
    </ul>
  )
}