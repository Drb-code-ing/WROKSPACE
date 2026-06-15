- canvas api
  - canvas 有大量的js 绘制api
  - 受限获取canvas 标签
  - getContext('2d/3d') 获取2d/3d 上下文
    ai 游戏爆发 three.js
    物理大模型
  - 绘制矩形
    rect 方形
    circle 圆形
    line 线形
    clearRect() 清除矩形
  - 元素
    fillStyle 填充颜色
    strokeStyle 边框颜色
    
- 怎么做游戏?
  按帧动画
  - clear 擦掉上一帧
  - 绘制当前帧
  - 显卡刷 1s 60次

## requestAnimationFrame()
  浏览器提供的适配屏幕刷新率的高效动画帧调度函数
  - 不能用setInterval()
    时间可能和电脑刷新率不一致
  - 参数 递归的方式 绘制函数
  - clear 方法
    帧动画不停的画，就有了动画

## 飞机游戏
  - 工程初始化
    vite, git
    帮我们安装必要的依赖
    .env
      环境变量配置文件
  - 可以和cc 头脑风暴
    - 游戏功能列表，选择其中的一些，做第一个阶段开发
      MVP 最小可行性方案
      技术路线
      技术方案
  - llm 生成

## 数据可视化
  echart 报表
  