# btn 页面
## 先写结构
 - 优秀的套路
## 再写样式
## html5 语义化标签
## BEM 国际命名规范
 - .page 页面
   开启一个区块 block
   - 分上下两部分
     - .page__hd 页面头部
     - .page__bd 页面主体
     hd bd 是block的子元素element
     Block 和 Element 之间用__ 分隔
 - Modifier 修饰符
     不同的状态
     - .weui-btn weui 这个框架中的按钮组件
       weui 项目的标志
       - 主要的、禁用的、加载中的
    
## BEM 优势
 - 国际规范，大家都遵守
 - 结构清晰，方便维护
   - 有一个区块要表达 block
   - 有几个元素要表单 element
 - 简单易读
 - 解决了页面命名难的问题
   最简单的英文单词，结构相关
   .page
    .page__hd
    .page__title
   如果没有规范，要写三个单词

## css 规则
 - css reset 重置样式
   有些元素默认样式不同，要重置掉
   把页面变成一张干净的纸

## AI prompt 规则
 - 语义化标签
 - BEM 国际命名规范
 - css reset 重置样式
   normalize.css
   * 不用，我们列出要匹配的所有元素
  
## 微信的界面细节
 - ui 设计师设计出来
   标注大小
   font-size: 17px
   button 高度 24px
   line-height: 24/17 = 取8位小数 1.41176471