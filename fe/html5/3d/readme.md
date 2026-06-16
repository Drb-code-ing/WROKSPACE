# 3D
 - canvas
   html5 新增标签 js api 绘制2d/3d 图形

## css 3d
 - css 属性去触发3d 绘制，不止3d 还会带来GPU加速
   那怕是2d 页面，我们有时也会手动3d化
### 布局 layout
 - 外层盒子布局
 - 内层 展示

### 水平垂直居中
 - 父容器
   body 100% 100vh(css3新单位)
   100份 等比例
   移动端适配
   viewport-height
   vw viewport-width
 - 子元素

## 行内/块级
 - html元素有俩类 行内 块级
   div ul等块级
   span 等行内
   - 块级 block 盒子
     - 可以设置宽度高度
     - 独占一行
   - 行内 inline 盒子
     - 不能设置宽度高度
     - 不会把兄弟挤下去
 - display 属性
   flex 开启弹性格式上下文
   inline-block 行内块
     - 可以设置宽度高度
     - 不会把兄弟挤下去
   浏览器默认块级/行内 -> display 手动切换 inline/block -> 格式化上下文(flex/inline-block/grid)
   inline-block 默认有个天坑
   默认有个空格符会占据一定大小 \n\r

## 定位
 - position relative 相对定位
 - position absolute 绝对定位
 - position fixed 固定定位
 - position sticky 粘性定位