import './style.css';
import Sidebar from '@/components/Sidebar';

export default async function RootLayout({children}) {
  return (
    <html>
      <head>
        <title>戴总的大模型工程师博客</title>
        <meta name="description" 
        content="这是一位未来大模型工程师的笔记，多年心血，深入讨论llm学习心得体会" />
        <meta name="keywords" 
        content="llm,claude,deepseek,rag,langchain" />
      </head>
      <body>
        <div className="container">
          <div className="main">
            <Sidebar />
            <section className="col note-viewer">{children}</section>
          </div>
        </div>
      </body>
    </html>
  )
}