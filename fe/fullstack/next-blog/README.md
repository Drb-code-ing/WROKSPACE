# Next.js Blog
## 技术背景
- npx
  npx 是 npm 自带工具，可直接运行node 包，无需全局安装依赖
  尝试试用，测试电脑能跑项目
  npx = npm i -g create-next-app + create-next-app
  便捷
- create-next-app
  React 全栈开发脚手架
  SSR(服务器端渲染) SEO(搜索引擎优化) RSC(React Server Components)
  use client  hydration 水合
 
## 项目需求
笔记系统，crud 笔记，支持markdown 格式
存在数据库的是markdown 格式，页面显示的是html marked

1. 界面分为两列，左侧为笔记列表，右侧是笔记内容
/  page.js
2. 点击new 增加一个Note，增加后，左侧笔记列表也会同时更新
App Router 文件既路由  rustful
/add  POST
/note
  [id] 动态路由
  page.js note 详情
/edit
  [id]
  page.js 修改
  page 新增一条
3. 编辑功能，可以删除一个笔记，左侧同时更新
4. 可以编辑当前Note，支持markdown 格式
5. 搜索功能
   next.js 数据业务开发

## 技术分析
### 路由
### 组件
规范驱动编程
规划需要哪些组件
 组件是工作单元，AI 生成的工作单元
 开发之前不要急的写代码
 分析需求，技术方案(next.js) 任务细节 路由 + 组件
 - Sidebar
   SidebarSearchField EditButton(复用)
   SidebarList
   NoteItem
 - Note
   NoteEditor 编辑
   NotePreview 负责笔记的预览界面

### 目录结构
- app
  页面主目录
  page.js
  layout.js
  [id]
- components 组件
- lib
  数据库操作
  常用的函数
- public 静态资源

/app/notes/[id]/page.js
引入 lib/redis.js
相对路径 ../../../lib/redis.js
优化：端连接 @/lib/redis.js
baseUrl .
path
  @/components/*
  @/lib/*

  @直接来到根目录

- 原子类 tailwindcss
- BEM  维护
  Block 块
  Element 元素
  Modifier 修改器
- layout
  - html
    head
      title
      meta
    body
      page.js
  - nav 侧边栏，导航栏
  - children page.js