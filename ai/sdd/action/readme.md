# md-wx-chrome-extensions

浏览器插件 核心功能，在浏览英文网页时，
一键提取文章核心内容， 调用AI 模型翻译， 
并将翻译结果以Markdown 格式呈现出来，
一键复制。

## SDD 之文档先行
- proposal.md  需求
调研，分析 
一键提取文章核心内容 难点
和claude code ， 相应的skill 聊一聊
得到解决方案 
AI 模型可配置  deepseek qwen。。。
npm marked(通用)， 
用户 大网红， 公众号， md-wx 
界面 按钮 layout 流式

## 项目准备
1. 创建项目和git 仓库
版本控制的重要性
ai 生成的可验收代码， 即时版本控制
vibe coding 可追述，可回退
出现幻觉， 
- 没到暂存区 
  直接丢弃这次修改 
  git restore . 
- 到了暂存区 没提交
  先移出暂存区
  git restore --staged .
  git restore .  
  再丢弃
- 提交了 
  git reset --hard HEAD^

## 管理AI会话
开启新的会话， 新的上下文。 

## 需求分析
- 第一步： 清晰的定义我们要做什么。 
- 第二部： 分析和调研
  skill, 或和claude code 多聊几次
- 花时间编写及验证需求

是什么， MVP (最小可行性单元)
产品经理，非程序员vibe coding (MVP)
详细的举例
返回格式
只生成文档， 其他的不要做。
不做什么
不是新的项目， 我们得阅读
文档好处是可记录，可共享， vibe coding
一关窗口可能就没了。
不能走过场， 程序开发的必备，关键流程
## 技术架构设计
直接关系到项目的成败，尤其是技术选项。 
一个正确的选项，能让后续的开发事半功倍，
反之，陷入泥潭。

架构师的认知， skill 
技术难点 网页主要内容? 上网搜
1. 强调openAI 兼容方式，切换qwen 等
2. 格式weixin markdown