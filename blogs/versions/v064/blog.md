# WebGPU 端侧推理推进：??= 空值赋值、异步下载进度与思考/回答流式状态机

浏览器里跑一个大模型，难点从来不在"能跑"，而在**好用**：几个 GB 的模型文件怎么一点点下下来、下载到一半界面要不要告诉用户、生成出来的"思考过程"和"最终答案"怎么在界面上区分开、多轮对话能不能快一点。第五十五天的笔记把这些工程细节逐一拆开——`??=` 空值赋值、异步下载进度回调、KV Cache、思考/回答状态机，再加上几处看似不起眼的 React 打磨。

核心思路一句话：**端侧推理不是"推理"问题，是"体验"问题。** 模型能力是 HuggingFace 给的，而把加载、进度、流式、多轮对话变成体面的交互，全靠代码里的工程细节。

---

## 一、??= 空值合并赋值：只在"没有值"时才动手

`??=` 是本项目里最值得单独拎出来讲的一个运算符。笔记里记得很清楚：

> 空值合并运算符 `??=`，用于在变量未定义或为 `null` 或 `undefined` 时，赋值。如果为 `false` 或其他值，不赋值。避免重复赋值，保持变量原始值。

也就是说，`a ??= b` 只有在 `a` 是 `null`/`undefined` 时才把 `b` 赋给 `a`。注意区分两件事：

- `??=` 只管"**空值**"（`null` / `undefined`）；
- `false`、`0`、`""`、`NaN` 这些 **falsy 值**，`??=` 一概不动。

为什么强调这一点？因为常见的 `||=`（逻辑或赋值）会在所有 falsy 值面前都赋一遍：`a ||= b` 只要 `a` 是 falsy 就会触发。而加载模型这种场景，恰恰需要一个"只在第一次才初始化、之后原样保留"的语义——用 `??=` 才是对的。

---

## 二、异步下载：大文件 chunk 慢慢到达

端模型的第一道坎是**加载**。模型文件动辄 GB 级，不可能一瞬间进浏览器，它是异步的：`from_pretrained` 返回一个 Promise，文件以 chunk 的形式慢慢到达。

```js
// worker.js
this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
  // 下载进度回调函数
  progress_callback,
});

this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
  dtype: "q4f16",       // 4 比特量化 + fp16，减小模型体积
  device: "webgpu",     // 使用 WebGPU 加速推理
  progress_callback,
});
```

三件事叠在一起：

1. **`??=` 做单例懒加载**：`AutoTokenizer.from_pretrained` 开销很大（下载几百 MB + 加载配置），所以只在第一次调用时执行，之后复用同一个 Promise；
2. **异步下载**：两个 `from_pretrained` 都返回 Promise，文件在后台分块下载，不阻塞主线程；
3. **`progress_callback` 上报进度**：下载到哪了、总共多大，通过这个回调实时透出来。

最后用 `Promise.all` 等两个最贵的资源一起就绪：

```js
// worker.js
return Promise.all([this.tokenizer, this.model]);
```

`tokenizer` 和 `model` 是两个独立的 Promise，`Promise.all` 让它们并行下载、同时等待——总耗时取慢的那个，而不是串行叠加。

---

## 三、进度回调的接力：Worker → 主线程 → 进度条

进度回调拿到下载数据后，还要跨线程送出去。Worker 里的做法是把回调内容**原样转发**给主线程：

```js
// worker.js
async function load() {
  // 加载管道（tokenizer + model），并保存供后续使用
  const [tokenizer, model] = await TextGenerationPipeline.getInstance((x) => {
    // 进度回调：把模型下载进度转发给主线程显示
    self.postMessage(x);
  });

  self.postMessage({
    status: "loading",
    data: "Compiling shaders and warming up model...", // 编译 shader 并预热模型
  });
  // ...
}
```

主线程收到后，按 `status` 分发。App.tsx 里维护一个 `progressItems` 列表，每个文件一条进度：

```tsx
case "initiate":  // 某个文件开始下载：把该文件加入进度列表
  setProgressItems((prev) => [...prev, e.data]);
  break;

case "progress":  // 下载进度更新：更新列表中对应文件的进度
  setProgressItems((prev) =>
    prev.map((item) =>
      item.file === e.data.file ? { ...item, ...e.data } : item,
    ),
  );
  break;

case "done":      // 文件加载完成：从进度列表中移除
  setProgressItems((prev) =>
    prev.filter((item) => item.file !== e.data.file),
  );
  break;
```

`Progress.tsx` 把一条进度渲染成进度条。它有两个值得抠的细节——**`??=` 兜底**和**字节格式化**：

```tsx
// Progress.tsx
function formatBytes(size) {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    +(size / Math.pow(1024, i)).toFixed(2) * 1 +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}

export default function Progress({ text, percentage, total }) {
  percentage ??= 0;   // 没有进度值时兜底为 0
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 text-left rounded-lg overflow-hidden mb-0.5">
      <div
        className="bg-blue-400 whitespace-nowrap px-1 text-sm"
        style={{ width: `${percentage}%` }}
      >
        {text} ({percentage.toFixed(2)}%
        {isNaN(total) ? "" : ` of ${formatBytes(total)}`})
      </div>
    </div>
  );
}
```

- `percentage ??= 0`：父组件没传 `percentage` 时是 `undefined`，`??=` 兜底成 `0`，避免 `undefined.toFixed` 崩掉——这是 `??=` 在"给默认值但保留真实 0"场景的用法；
- `isNaN(total) ? "" : ...`：有的进度事件不带 `total`，那就只显示百分比、不拼字节数，避免显示 "of NaN"；
- `formatBytes`：用对数算出 1024 的幂，把字节数格式化成 `kB`/`MB`/`GB`。

---

## 四、KV Cache：多轮对话的加速缓存

加载聊完了，看推理。多轮对话有个天然痛点：**上一轮的 token 每次都要重新算一遍**。Transformer 里每个 token 都要经过注意力计算，生成第 N 轮时，前 N-1 轮的 key/value 其实早就算过了，扔了可惜。

于是项目里留了一个 KV Cache：

```js
// worker.js
// KV Cache：缓存上一轮的 key/value，加速多轮对话
let past_key_values_cache = null;

async function generate(messages) {
  // ...
  const { past_key_values, sequences } = await model.generate({
    ...inputs,
    // TODO: 修复后启用 KV Cache 复用
    // past_key_values: past_key_values_cache,

    do_sample: false,           // 贪心解码：每步选概率最高的 token
    max_new_tokens: 2048,       // 最多生成 2048 个新 token
    streamer,
    stopping_criteria,
    return_dict_in_generate: true,
  });
  past_key_values_cache = past_key_values;   // 本轮算完，缓存下来
  // ...
}
```

思路很清楚：生成完把 `past_key_values` 存到模块级变量，下一轮传回给 `model.generate`，跳过重复计算。笔记里标了 `TODO: 修复后启用`——**道理明白、但先不启用**。这本身就是一种工程态度：KV Cache 虽能加速，但一旦首轮上下文和缓存的 key/value 对不上，输出会错乱。宁可先保证正确，再谈性能。

---

## 五、思考/回答状态机：R1 的推理过程可视化

DeepSeek-R1 这类推理模型有个特征：输出先是一段 `<think>…</think>` 包裹的**思考过程**，然后才是**最终答案**。要在界面上把这两段分开，就得在流式生成时识别状态切换。

worker.js 先把思考结束标记编码成 token id：

```js
// 思考开始/结束标记的 token id（DeepSeek-R1 用 think 标签包裹思考过程）
// 151648 是思考开始 token，151649 是思考结束 token
const thinkEnd = String.fromCharCode(0x3C, 0x2F, 0x74, 0x68, 0x69, 0x6E, 0x6B, 0x3E);
const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
  thinkEnd,
  { add_special_tokens: false },
);
```

然后每生成一个 token，回调里做三件事：**计时、算 TPS、检测状态切换**：

```js
// 每生成一个 token 的回调：统计 token 数和 TPS（每秒生成 token 数）
const token_callback_function = (tokens) => {
  startTime ??= performance.now();

  if (numTokens++ > 0) {
    tps = (numTokens / (performance.now() - startTime)) * 1000;
  }
  // 遇到思考结束标记，从思考阶段切换到回答阶段
  if (tokens[0] == END_THINKING_TOKEN_ID) {
    state = "answering";
  }
};
```

- `startTime ??= performance.now()`：第一次进入回调才记开始时间，之后复用——`??=` 又一次用在"只初始化一次"；
- `tps = (numTokens / 耗时) * 1000`：已经生成的 token 数除以毫秒耗时，再乘 1000 得到每秒 token 数；
- 检测到 `END_THINKING_TOKEN_ID`，把 `state` 从 `"thinking"` 切到 `"answering"`。

主线程这边，App.tsx 收到 `update` 消息时，用 `answerIndex` 记住"答案从第几个字符开始"：

```tsx
case "update": {
  const { output, tps, numTokens, state } = e.data;
  setTps(tps);
  setNumTokens(numTokens);
  setMessages((prev) => {
    const cloned = [...prev];
    const last = cloned.at(-1);
    const data = { ...last, content: last.content + output };
    if (data.answerIndex === undefined && state === "answering") {
      // 状态从 thinking 切换到 answering 时，记录答案在文本中的起始位置
      // 用于在 UI 上区分「思考过程」和「最终回答」
      data.answerIndex = last.content.length;
    }
    cloned[cloned.length - 1] = data;
    return cloned;
  });
  break;
}
```

`answerIndex` 只在第一次从 `thinking` 切到 `answering` 时记录（`data.answerIndex === undefined` 保证不覆盖），之后 UI 就能用这个下标把思考过程和最终回答渲染成不同样式。**状态机不只在 Worker 里，也在消息协议里**——`thinking`/`answering` 通过 `state` 字段随每次 `update` 一起送回来。

---

## 六、工程打磨：StrictMode、类型化 ref 与级联渲染

最后是一组不改变功能、但决定代码健壮性的打磨。

**1. 移除 StrictMode**

main.tsx 里删掉了 `<StrictMode>`：

```tsx
// main.tsx
createRoot(document.getElementById('root')!).render(
    <App />
)
```

为什么？StrictMode 在开发模式下会**故意双调用** effect 来暴露问题——而 worker 初始化正是个副作用：effect 里 `new Worker(...)` 创建后台线程、加载模型。双调用意味着 dev 环境会创建两个 worker、发两次 `check`。对普通组件无伤大雅，但对"new Worker + 加载大模型"这种重型副作用，去掉 StrictMode 是更务实的选择。

**2. 类型化 worker ref**

App.tsx 给 worker ref 补上了类型：

```tsx
// Web Worker 引用：负责在后台线程加载模型和生成文本，避免阻塞 UI
const worker = useRef<Worker | null>(null);
```

`useRef<Worker | null>(null)` 明确告诉 TS：初始是 `null`，挂载后才是 `Worker`。这是 React + TS 里 ref 的标准写法，杜绝裸 `null` 类型崩溃。

**3. 消除级联渲染**

有一段改动很能说明问题。原本 `useEffect` 里在发 `generate` 消息前会 `setTps(null)`，但 `onEnter` 里已经调用过了。笔记的注释点破了原因：

```tsx
// setTps(null) 已在 onEnter 中调用，此处重复调用会导致 effect 内同步 setState 引发级联渲染，故移除
worker.current.postMessage({ type: "generate", data: messages });
```

**在 effect 里同步 `setState`** 会立刻触发重渲染，重渲染又可能再触发依赖它的 effect——形成"级联渲染"。重复设置同一个值虽然值没变，但 setState 调用本身就会排队一次渲染。移除多余的 setState，是 React 性能意识的第一课。

**4. textarea 高度自适应**

输入框跟随内容自动变高：

```tsx
useEffect(() => {
  if (!textareaRef.current) return;
  const target = textareaRef.current;
  target.style.height = "auto";  // 先重置，才能正确读取 scrollHeight
  const newHeight = Math.min(Math.max(target.scrollHeight, 24), 200);
  target.style.height = `${newHeight}px`;
}, [input]);
```

`height: auto` 先重置，才能让 `scrollHeight` 反映真实内容高度；再 `clamp` 到 24~200px 之间。小而完整的 DOM 操作模式。

---

## 七、面试问答

**问：`??=` 和 `||=` 有什么区别？**

> `??=`（空值合并赋值）只在变量为 `null` 或 `undefined` 时赋值；`||=`（逻辑或赋值）在变量为任何 falsy 值（`false`、`0`、`""`、`NaN`）时都会赋值。加载模型这种"只在首次初始化、之后原样保留"的场景，用 `??=` 才正确——否则模型加载到一半某个假值也会被重新触发。

**问：端模型在浏览器里是怎么加载的？下载进度怎么拿到？**

> `from_pretrained` 返回 Promise，模型文件按 chunk 异步分块下载到浏览器。传入 `progress_callback` 回调，就能实时收到下载进度事件（某文件开始、进度百分比、总大小）；Worker 里把回调内容 `self.postMessage` 转发给主线程，主线程按 `initiate`/`progress`/`done` 三种状态维护 `progressItems` 列表渲染进度条。

**问：为什么要用 `Promise.all([tokenizer, model])`？**

> tokenizer 和 model 是两个独立的异步加载任务，都返回 Promise。`Promise.all` 让它们并行下载、同时等待，总耗时取较慢的那个，而不是串行叠加。也保证了后面解构 `const [tokenizer, model] = await ...` 时两者都已就绪。

**问：什么是 KV Cache？它怎么加速多轮对话？**

> Transformer 生成时每个 token 都要做注意力计算，其中 key/value 是逐 token 生成的。多轮对话里，上一轮算过的 key/value 可以缓存下来，下一轮传入 `past_key_values`，跳过已算部分、只算新增 token。项目里用模块级 `past_key_values_cache` 保存，但因为首轮上下文和缓存对不上可能导致输出错乱，标了 `TODO` 暂时未启用——先保证正确，再谈性能。

**问：DeepSeek-R1 的"思考过程"和"最终答案"在界面上是怎么区分的？**

> R1 的输出用 `<think>…</think>` 包裹思考过程。worker 先把思考结束标记编码成 token id（151648/151649），在每生成一个 token 的回调里检测是否出现结束标记，出现就把 `state` 从 `"thinking"` 切到 `"answering"`，随 `update` 消息一起发给主线程。主线程在状态首次变为 `answering` 时用 `answerIndex` 记录答案起始位置，UI 据此分段渲染。

**问：为什么移除 `<StrictMode>`？**

> StrictMode 在开发模式下会双调用 effect 以暴露潜在 bug。本项目 effect 里 `new Worker()` 创建后台线程并加载模型，属于重型副作用，双调用会导致 dev 环境创建两个 worker、发两次消息。对这类副作用，移除 StrictMode 是更务实的选择。

**问：在 effect 里同步调用 `setState` 有什么问题？**

> 会立刻触发一次重渲染；如果这个 effect 依赖的 state 又因此变化，就可能再次触发 effect，形成级联渲染。即使 setState 的值没变，调用本身也会排队一次渲染。所以该移除的 setState 要移除——比如本项目里 `setTps(null)` 已在 `onEnter` 调用过，effect 里就不再重复调。

---

## 结语：端侧模型的差距，藏在工程细节里

浏览器跑大模型，模型本身决定"能不能答对"，而工程细节决定"好不好用"。这一天把加载链路上的每一环都抠了一遍：

```text
加载    ??= 单例懒加载 + 异步下载 + progress_callback 进度上报
等待    Promise.all 并行等待 tokenizer 与 model
展示    Progress 组件：??= 兜底 + formatBytes + isNaN(total) 防御
加速    KV Cache 缓存 key/value（TODO 未启用，先保正确）
流式    思考/回答状态机：think token 检测 + TPS 统计 + answerIndex 分段
打磨    StrictMode 移除 + useRef 类型化 + 消除级联渲染
```

动手前，拿这份清单自检：

- [ ] 用 `??=` 做单例懒加载时，是否清楚它只对 `null`/`undefined` 生效、不会误动 `false`/`0`？
- [ ] 异步下载大文件时，是否通过 `progress_callback` 把进度实时透给界面，而不是让用户干等？
- [ ] 多个独立的异步资源（如 tokenizer + model），是否用 `Promise.all` 并行等待？
- [ ] 给默认值时，是否用了 `??=`（保留真实的 0），而不是 `||=`（会覆盖 0/false）？
- [ ] 多轮对话是否考虑过 KV Cache？启用前是否验证了上下文与缓存的 key/value 一致？
- [ ] 流式输出需要分段展示时，是否在 token 回调里识别状态边界，再在主线程记下标？
- [ ] `new Worker`、加载模型这类重型副作用，是否意识到 StrictMode 双调用的影响？
- [ ] effect 里是否存在多余的同步 `setState`，可能引发级联渲染？

一个 1.5B 的模型，把它"装进"浏览器只是起点；把它"伺候好"——进度可见、流式可感、思考与回答分明、多轮不卡——才是一天一天推进出来的东西。
