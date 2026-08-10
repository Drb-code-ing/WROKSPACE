# WebGPU 端侧推理与单例模式：从 Transformers.js 把大模型装进浏览器，到 Worker 线程的流式对话

上一节我们把性能优化做到了 `memo` / `useCallback` 这一层，React 的地基越来越牢。但真正"重"的东西还没登场——**大模型推理**。而这一天的主题，恰恰是把最重的活搬进最轻的容器：**让一个 1.5B 参数的大模型，跑在浏览器里**。

不是联网调 API，而是模型文件就下载到你的浏览器本地、推理就在你自己的设备上完成，甚至**断网都能用**。背后是四个词串起来的一条路：HuggingFace、Transformers.js、WebGPU、Web Worker。

这一天笔记有两条主线：

- 一条是"端"：**WebGPU 端侧推理**，把大模型从服务器搬进浏览器；
- 一条是"设计"：**单例模式**，让最贵的资源（模型）全局只加载一次。

一天之内从模型社区一路写到设计模式，跨度很大，但串起来其实是同一件事：**让"数据不出浏览器"这件事，变得既跑得动、又管得住。**

---

## 一、模型从哪来：HuggingFace 与 Transformers.js

笔记开头记下了两个关键词：HuggingFace 和 ModelScope（魔搭）。

- **HuggingFace**：AI 圈最火的开源模型社区，各个厂商把 AI 模型发布到这里；
- **Transformers.js**：JS 版的 transformers 库，通过模型 id 远程下载，访问并执行 NLP 任务。

于是"浏览器里跑大模型"的第一步，就是去社区挑一个合适、又足够小的模型。这一天用的是：

```
deepseek-r1-distill-qwen 1.5B
```

一个 1.5B 参数的推理模型，经过蒸馏（distill），体积被压到能在浏览器端跑的程度。模型文件有几 GB 级别，但配合量化后，浏览器就能扛得住。

---

## 二、浏览器跑大模型：一条链路看懂

笔记里画了一条清晰的流水线：

```text
deepseek-r1-distill-qwen 1.5B 文件(GB)
  → 发布到 huggingface
  → transformers.js load
  → web 下载到浏览器本地(慢)
  → 浏览器缓存
  → webgpu(新特性，兼容性)
  → 执行 nlp 任务
```

关键在最后两跳：

- **下载**：模型文件几百 MB 到 GB 级，第一次加载确实慢。但下载到浏览器缓存之后，第二次就快了——模型文件已经存在本地，甚至**离线可用**；
- **执行**：模型跑在 `webgpu` 上。WebGPU 是浏览器新一代的图形/计算 API，把 GPU 的并行计算能力开放给 JS。而大模型推理本质是海量矩阵运算，GPU 天生擅长。

这一天的项目 `deepseek-r1-webgpu`，就是这条链路的一个完整落地：React + TypeScript + Vite，加载 DeepSeek-R1 的蒸馏版，在浏览器里本地对话。

---

## 三、两个依赖搞定一切

`package.json` 里，运行时依赖只有两个：

```json
"dependencies": {
  "@huggingface/transformers": "3.7.1",
  "marked": "^15.0.5"
}
```

- `@huggingface/transformers`：JS 版 transformers，**加载模型、执行推理**全靠它；
- `marked`：LLM 返回的是 Markdown 格式，页面上要显示成带格式的文本（代码、加粗、引用），得先转成 HTML——`marked` 干的就是这个。

比日常 React 项目还少——因为真正的大头（模型推理）不在依赖里，而在浏览器 + GPU 里。

---

## 四、Web Worker：把大模型的重活挪出主线程

模型推理很重，绝不能卡住 UI。所以模型加载、推理都放进 **Web Worker**。主线程这边，App.tsx 用 `useRef` 存 Worker 实例、用 `useEffect` 创建：

```tsx
useEffect(() => {
  // Create the worker if it does not yet exist.
  if (!worker.current) {
    worker.current = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    worker.current.postMessage({ type: "check" }); // 先做能力检测
  }
  // ...
}, []);
```

主线程只做两件事：**发消息给 Worker、收消息更新界面**。重活（下载模型、编译 shader、跑推理）全在后台线程，用户能边等边操作，还能看到实时进度条。

---

## 五、navigator.gpu 与 TypeScript 的"不认识"

要支持 WebGPU，第一步是检测 `navigator.gpu`。但直接写会报错，笔记里记的写法是：

```tsx
!!(navigator as any).gpu
```

**为什么报错？** 因为 `navigator.gpu` 是实验阶段的新特性，TS 自带的类型声明里没有这个属性，`navigator` 类型"不认识"它。笔记里接着想：用别的方式？

这里其实是 **TS 类型检测底层机制**的一次实践：

- `as` 类型断言：`navigator as any` —— 把类型"断言"成 `any`，绕过检查。但 `any` 是 TS 的原生任意类型，**不要乱用，会泛滥**；
- 更正规的解法：**类型声明文件**。TS 有专门的类型声明机制，WebGPU 缺的就是一份 `@webgpu/types`：

```bash
npm install -D @webgpu/types
```

装完在 `tsconfig.app.json` 里配置：

```json
{
  "compilerOptions": {
    "types": ["@webgpu/types"]
  }
}
```

TS 就认得 `navigator.gpu` 了。**实验性 API 靠类型声明文件补全类型，而不是到处 `as any`**——`tsconfig` 里的 `types` 配置，就是告诉编译器"这些安装的类型文件要用上"。

---

## 六、设计模式：面向设计，而不是实现

笔记里记下了一个里程碑概念：**设计模式**。

- OOP 面向对象编程，总结出了 **23 种解决特定问题的模式**；
- 数据结构，是 ADT（抽象数据类型）；
- 设计模式是"面向设计，而不是实现"——Design Pattern。

这一天重点解锁第一个：**单例模式（Singleton）**——类只实例化一次，全局只有一个实例，用于解决**全局变量问题**和**全局状态问题**。

笔记先写了个 HTML demo（`singieton/index.html`），用一个"打开窗口"的 `Popup` 类理解单例：

```html
<script>
  class Popup {
    static ins  // 静态属性：存唯一实例，不用先 new 就能访问

    static getInstance() {
      // 判空：第一次调用时创建，后续直接复用
      if (!Popup.ins) {
        Popup.ins = new Popup()
      }
      return Popup.ins
    }

    win = null  // 实例属性：缓存已打开的窗口引用

    open(url) {
      // 窗口没开过，或者被用户手动关了 → 开新窗口
      if (!this.win || this.win.closed) {
        this.win = window.open(url, "_blank")
      } else {
        // 已开过：复用同一个窗口，在原窗口跳转并切到前台
        this.win.location.href = url
        this.win.focus()
      }
    }
  }

  // 单例方式获取实例（代替 new），a 和 b 是同一个对象
  const a = Popup.getInstance()
  const b = Popup.getInstance()
  console.log(a === b)  // true
</script>
```

- `static ins`：**静态属性**，不用 `new` 就能访问，用来存那个唯一实例；
- `getInstance()`：**判空**——第一次调用才 `new Popup()`，之后直接复用；
- 于是点多少次按钮，都只在一个窗口里跳转，**不会开一堆标签页**。a 和 b 是同一个对象，`a === b` 为 `true`。

---

## 七、单例模式实战：TextGenerationPipeline

模型加载是全项目最贵的操作：几百 MB 下载 + 编译 shader。如果每次对话都重新加载，那体验就崩了。所以 `work.js` 里的核心类直接上了单例：

```js
class TextGenerationPipeline {
  static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";

  static async getInstance(progress_callback = null) {
    // ??= 空值赋值：首次调用时初始化，后续复用
    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });

    this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
      dtype: "q4f16",       // 4 比特量化 + fp16，减小模型体积
      device: "webgpu",     // 使用 WebGPU 加速推理
      progress_callback,
    });

    return Promise.all([this.tokenizer, this.model]);
  }
}
```

两个细节很有味道：

- `tokenizer ??= ...` 和 `model ??= ...`：**空值赋值运算符**，只有当前值是 `null`/`undefined` 才执行右边。第一次调用时初始化，之后的调用直接复用——这不就是单例的"只实例化一次"？
- 两个 `from_pretrained` 都传了 `dtype: "q4f16"`（4 比特量化 + fp16）和 `device: "webgpu"`——**量化减小模型体积，WebGPU 提供算力**。

调用方永远只写一行：

```js
const [tokenizer, model] = await TextGenerationPipeline.getInstance();
```

全局只有一份 tokenizer 和 model，内存、时间都省下来了——**最贵的资源，只创建一次。**

---

## 八、WebGPU 加载与流式生成：从进度条到 TPS

加载模型时，要把下载进度实时报给主线程：

```js
async function load() {
  self.postMessage({
    status: "loading",
    data: "Loading model...",
  });

  // 加载管道（tokenizer + model），并保存供后续使用
  const [tokenizer, model] = await TextGenerationPipeline.getInstance((x) => {
    // 进度回调：把模型下载进度转发给主线程显示
    self.postMessage(x);
  });

  self.postMessage({
    status: "loading",
    data: "Compiling shaders and warming up model...", // 编译 shader 并预热模型
  });

  // 用假输入跑一次模型，提前编译 shader（预热，避免首次推理卡顿）
  const inputs = tokenizer("a");
  await model.generate({ ...inputs, max_new_tokens: 1 });
  self.postMessage({ status: "ready" });
}
```

加载完成后没有直接开工，而是用 `tokenizer("a")` 喂一个假输入跑一次，把 shader 编译提前完成——**预热**，避免用户第一次对话卡顿。

生成时用 `TextStreamer` 边生成边输出：

```js
// 文本流式输出器：边生成边输出，不用等全部完成
const streamer = new TextStreamer(tokenizer, {
  skip_prompt: true,              // 不重复输出输入的 prompt
  skip_special_tokens: true,      // 跳过特殊 token（如 think 标签）
  callback_function,              // 每段文本 → 实时推给主线程
  token_callback_function,        // 每个 token → 统计 TPS
});

const { sequences } = await model.generate({
  ...inputs,
  do_sample: false,           // 贪心解码：每步选概率最高的 token
  max_new_tokens: 2048,       // 最多生成 2048 个新 token
  streamer,
  stopping_criteria,
});
```

- `callback_function` 用 `self.postMessage({ status: "update", ... })` 把每一段输出实时推给主线程，实现"打字机"效果；
- `token_callback_function` 统计 token 数和 TPS（每秒生成 token 数）——页面上那个 `tokens/second` 就来自这里。

Worker 侧的消息入口，是一段经典的 `switch`：

```js
self.addEventListener("message", async (e) => {
  const { type, data } = e.data;
  switch (type) {
    case "check":     check(); break;                    // 检测 WebGPU 支持
    case "load":      load(); break;                     // 加载模型
    case "generate":  stopping_criteria.reset(); generate(data); break;  // 生成文本
    case "interrupt": stopping_criteria.interrupt(); break;              // 中断生成
    case "reset":     past_key_values_cache = null; stopping_criteria.reset(); break;
  }
});
```

`check / load / generate / interrupt / reset`，五个命令把"加载—生成—打断—重置"串成完整状态机。

---

## 九、App.tsx：Worker 消息驱动的前端状态机

主线程这边，App.tsx 用 `useEffect` 挂上消息监听，用 `switch` 处理 Worker 推来的每一种消息：

```tsx
useEffect(() => {
  if (!worker.current) {
    worker.current = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    worker.current.postMessage({ type: "check" });
  }

  const onMessageReceived = (e) => {
    switch (e.data.status) {
      case "loading":  setStatus("loading"); setLoadingMessage(e.data.data); break;
      case "initiate": setProgressItems((prev) => [...prev, e.data]); break;          // 开始下载一个文件
      case "progress":
        setProgressItems((prev) =>
          prev.map((item) => item.file === e.data.file ? { ...item, ...e.data } : item),
        );
        break;                                                                        // 更新某个文件进度
      case "done":
        setProgressItems((prev) => prev.filter((item) => item.file !== e.data.file));
        break;                                                                        // 文件加载完成，移除进度条
      case "ready":  setStatus("ready"); break;
      case "start":
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        break;
      case "update": {
        const { output, tps, numTokens } = e.data;
        setTps(tps); setNumTokens(numTokens);
        setMessages((prev) => {
          const cloned = [...prev];
          const last = cloned.at(-1);
          cloned[cloned.length - 1] = { ...last, content: last.content + output };
          return cloned;                                                              // 追加输出片段
        });
        break;
      }
      case "complete": setIsRunning(false); break;
      case "error":    setError(e.data.data); break;
    }
  };

  worker.current.addEventListener("message", onMessageReceived);
  return () => {
    worker.current.removeEventListener("message", onMessageReceived);
  };
}, []);
```

界面状态围绕一个 `status` 变量展开，是典型的三态切换：

- `status === null`：还没加载，显示欢迎页 + "Load model" 按钮；
- `status === "loading"`：显示进度条列表（`progressItems`，每个模型文件一条）；
- `status === "ready"`：显示聊天界面，可以发消息。

用户发消息后，把消息列表发给 Worker 触发生成：

```tsx
useEffect(() => {
  if (messages.filter((x) => x.role === "user").length === 0) return; // 还没有用户消息
  if (messages.at(-1).role === "assistant") return;                   // 最后一条是助手，等待中
  setTps(null);
  worker.current.postMessage({ type: "generate", data: messages });
}, [messages, isRunning]);
```

而整件事能不能跑，取决于浏览器是否支持 WebGPU，一行代码兜底：

```tsx
const IS_WEBGPU_AVAILABLE = !!navigator.gpu;
```

不支持就渲染一整屏 "WebGPU is not supported"。**从"有没有 GPU"到"模型加载到哪一步"再到"生成到第几个 token"，每一层都有人盯着。**

---

## 十、面试问答

**问：什么是 WebGPU？为什么用它来在浏览器跑大模型？**

> WebGPU 是浏览器新一代的图形/计算 API，能把 GPU 的并行计算能力开放给 JS。大模型推理本质是大规模矩阵运算，GPU 天生擅长。用 `device: "webgpu"` 把模型跑在 GPU 上，1.5B 的小模型在浏览器端就能本地推理，数据不出浏览器、甚至离线可用。

**问：浏览器里加载一个大模型的全过程是怎样的？**

> 模型发布到 HuggingFace 等模型社区；Transformers.js 按模型 id 用 `from_pretrained` 下载到浏览器本地（首次慢，之后有缓存、离线可用）；加载时 `dtype: "q4f16"` 4 比特量化减小体积、`device: "webgpu"` 指定 GPU 推理；下载过程通过 `progress_callback` 上报进度；加载完先用假输入跑一次预热（编译 shader），再进入 `ready` 状态。

**问：为什么要把模型加载和推理放在 Web Worker 里？**

> 模型加载和推理都很重，放主线程会卡死 UI。Web Worker 是后台线程，加载、生成都在里面跑，主线程只负责发消息、收消息、更新界面。用户能边等边操作，还能看到实时进度，而不是页面白屏。

**问：写 `navigator.gpu` 为什么报错？怎么解决？**

> 因为 WebGPU 是实验性新特性，TS 自带的类型声明里没有 `navigator.gpu` 这个属性，`navigator` 类型不认。粗暴的办法是 `(navigator as any).gpu` 用 `as` 断言跳过检查，但 `any` 用多了会泛滥。正规做法是装缺失的类型声明文件 `@webgpu/types`，再在 `tsconfig.app.json` 的 `types` 里配置，TS 就认识 `navigator.gpu` 了。

**问：什么是单例模式？在这个项目里解决了什么问题？**

> 单例模式保证一个类全局只有一个实例，用来管理全局状态、避免重复创建。本项目里 `TextGenerationPipeline` 就是单例：tokenizer 和 model 用 `??=` 懒加载，第一次 `getInstance` 才创建，之后所有对话复用同一份——避免每次对话都重新下载/加载几百 MB 的模型。

**问：`??=` 是什么运算符？为什么适合单例？**

> 空值赋值运算符（logical nullish assignment）。`a ??= b` 等价于 `a = a ?? b`，只有 `a` 是 `null`/`undefined` 时才把 `b` 赋给它。在单例里它天然适合做"首次初始化、之后复用"——第一次调用时创建实例，之后直接返回同一个。

**问：为什么生成要流式输出，而不是等全部完成再显示？**

> 大模型生成几百上千个 token 是耗时的，等全部生成完再一次性显示，用户会干等好几秒。用 `TextStreamer` 边生成边通过 `callback_function` 推给主线程，实现打字机效果；同时用 `token_callback_function` 实时统计 TPS，让用户看到"每秒生成多少 token"的速度。

---

## 结语：端侧 AI 的地基，还是设计

这一天看起来跨度很大——从模型社区、浏览器推理、TS 类型，一路写到设计模式。但串起来其实是一条线：

```text
端侧推理   HuggingFace + Transformers.js + WebGPU  →  把大模型装进浏览器
线程模型   Web Worker                                →  重活不卡 UI，主线程只收消息
类型严谨   @webgpu/types                             →  实验性 API 也要有类型，而不是到处 as any
设计模式   单例 TextGenerationPipeline               →  最贵的资源只加载一次
```

前端不再是"只能调别人 API"的角色。WebGPU 端侧推理让"数据不出浏览器"成为可能：模型本地下载、本地推理、离线可用。而支撑这一切的，除了新特性本身，还有最朴素的设计功底——Worker 隔离线程、类型声明补齐类型、单例模式管住资源。

动手前，可以拿这份清单自检：

- [ ] 大模型推理这类重活，是否放进了 Web Worker，而不是让主线程卡死？
- [ ] 使用实验性 API（如 `navigator.gpu`）时，是否装了 `@webgpu/types` 补全类型，而不是到处 `as any`？
- [ ] 加载模型这类昂贵操作，是否用单例（`??=` 懒加载）保证全局只加载一次？
- [ ] 模型下载进度是否通过 `progress_callback` 上报给界面，让用户不是干等？
- [ ] 生成结果是否用 `TextStreamer` 流式输出，而不是等全部完成再显示？
- [ ] 是否用假输入预热（先跑一次编译 shader），避免第一次对话卡顿？

浏览器是最大的运行时，GPU 是免费的超算。当模型、线程、类型、设计各就各位，"在浏览器里跑一个大模型"就从噱头变成了地基之上又一次扎实的实践。
