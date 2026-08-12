# WebGPU 端侧模型推理生成：聊天模板、think 标记 token 化与可中断的流式对话

模型下载到浏览器只是开始，真正决定"对话好不好用"的是**推理生成这一段**：你发出去的一句消息，怎么一步步变成模型吐出来的那段回答？中间要过几道关卡？第五十六天的笔记把这个过程在 worker.js 里逐行抠了一遍——聊天模板把消息数组排成模型认识的文本、think 标记怎么一次编码拿齐两个 token id、生成为什么天然分"思考/回答"两段、用户点「停止」时模型为什么能在下一个 token 处优雅收住。

一句话概括这一天：**把"发送消息"到"收到回答"之间的黑盒，拆成一条看得见、停得住的管线。**

---

## 一、聊天模板：messages 数组如何变成模型输入

界面上我们维护的是 `messages` 数组——`[{ role: "user", content: "..." }, { role: "assistant", content: "..." }]` 这样的对象列表。但模型不认对象，它只认**字符串和数字**。中间这层翻译就靠 `apply_chat_template`：

```js
// worker.js
const inputs = tokenizer.apply_chat_template(messages, {
  add_generation_prompt: true,  // 加上助手角色的开头标记 <|im_start|>assistant\n
  return_dict: true,            // 返回字典格式（含 input_ids 和 attention_mask）
});
```

`messages` 数组怎么变成一段文本？靠的是**训练模板**。DeepSeek / Qwen 这类模型在训练时用的是一种叫 ChatML 的排版方式，大致长这样：

```text
<|im_start|>user
你叫什么名字？<|im_end|>
<|im_start|>assistant
我是端侧的小模型。<|im_end|>
```

`<|im_start|>user` 表示"用户开始说话"，`<|im_end|>` 表示"这段话结束"。模型见过的训练数据全是这种格式，所以推理时输入也必须排版成同款——这就是笔记里那句"llm 的模版，deepseek/qwen 训练时使用的模版"的含义：**模板是模型训练时定死的，改不得。** 你临时换个排版，模型就"不认识"了。

`apply_chat_template` 把 `messages` 数组拼成上面这种文本，而两个选项各管一件事：

- **`add_generation_prompt: true`**——在末尾追加 `<|im_start|>assistant\n`。这相当于对模型说"轮到你开口了"。没有这一行，模型不知道自己在回答，行为会失控；
- **`return_dict: true`**——返回字典而不是字符串，方便直接展开传给 `model.generate`。

---

## 二、输入张量：input_ids 与 attention_mask

`return_dict: true` 拿到的是什么？笔记里把结构写得很明白：

```js
// {
//   input_ids: tensor([151649, 151650, ...]),  <- token id 序列
//   attention_mask: tensor([1, 1, 1, ...]),  <- 注意力掩码，用于忽略 padding token
// }
```

- **`input_ids`**：模板字符串被 tokenizer 切碎后，每个 token 对应的数字 id。模型内部只做数值计算，文本最终都要落到这一串 id 上；
- **`attention_mask`**：和 `input_ids` 等长的 0/1 序列。为什么需要它？因为一批文本长度不一，要把它们 padding 到同一长度才能组成 batch，而 padding 出来的占位符是"假 token"，不该参与注意力计算。mask 里 1 表示"这是真实 token"，0 表示"这是填充位，别理它"。

`return_dict` 的便利在于：这两个张量可以直接展开成 `model.generate` 的入参——

```js
await model.generate({
  ...inputs,            // input_ids、attention_mask 平铺进来
  do_sample: false,     // 贪心解码
  max_new_tokens: 2048,
  streamer,
  stopping_criteria,
  return_dict_in_generate: true,
});
```

到这里，"用户消息"已经变成了"模型能吃的数值输入"。

---

## 三、think 标记的 token 化：一次编码，拿齐两个标记

这一天最实在的一处改动在这里。DeepSeek-R1 用 `<think>…</think>` 包裹思考过程，程序要在流式输出时识别"思考结束了没"，就得先把这两个标记转成 token id。原来的写法是：

```js
// 修改前
const thinkEnd = String.fromCharCode(0x3C, 0x2F, 0x74, 0x68, 0x69, 0x6E, 0x6B, 0x3E);
const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
  thinkEnd,
  { add_special_tokens: false },
);
```

`String.fromCharCode` 那串十六进制是 ASCII 码：`0x3C` 是 `<`、`0x2F` 是 `/`、`0x74`~`0x6B` 是 `think`、`0x3E` 是 `>`，拼出来就是 `"</think>"`。问题出在下一行：`tokenizer.encode(...)` 返回的是 **token id 数组**，然后用解构 `[START, END]` 去取前两个元素——第一个当思考开始标记，第二个当思考结束标记。

可你只编码了 `</think>` 一个标记。它编码出来的数组里，只有"结束"对应的 id，数组长度甚至都不一定是 2。于是 `START_THINKING_TOKEN_ID` 拿到的是 `undefined` 或者一个张冠李戴的 id——状态切换的逻辑从一开始就悬空了。

修复很简单，把两个标记一起喂进去：

```js
// 修改后
// 生成是两部分
// 思考推理部分 + 模型生成部分
const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
  "<think></think>",
  { add_special_tokens: false },
);
```

这里藏着 tokenizer 的两条基本规则：

1. **编码结果是 token id 数组，顺序与文本出现顺序一致。** 文本里先出现 `<think>` 后出现 `</think>`，编码出的数组就是 `[思考开始 id, 思考结束 id]`。想要两个标记，就把两个标记都喂进去，不能只喂一个靠"猜"；
2. **`add_special_tokens: false` 是必要的。** 默认编码会在序列首尾追加 BOS/EOS 这类特殊 token，把位置挤乱；think 标记是普通 token，不需要这些前缀。

一个小改动，把"思考/回答"状态机的判定地基打牢了。

---

## 四、生成的两个阶段：先思考，后回答

推理模型的输出天然是两段：先是一段思考过程，再是最终答案。worker 里用一个 `state` 变量跟踪当前处于哪一段：

```js
let state = "thinking"; // 当前状态：thinking(思考中) 或 answering(回答中)
```

每生成一个 token 的回调里，检测到思考结束标记就切换：

```js
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

这段代码一天做了三件事：

- **计时**：`startTime ??= performance.now()`——第一次进回调才记开始时间，之后复用；
- **算 TPS**：`numTokens / 耗时 * 1000`，每秒生成的 token 数；
- **切状态**：生成到 `END_THINKING_TOKEN_ID` 时，把 `state` 从 `thinking` 切到 `answering`。

`state` 随每段输出一起发回主线程，UI 才能在"思考过程"和"最终答案"之间画出分界线。**状态机不是生成完才有的，它跟着流式输出实时在走。**

---

## 五、可中断的生成：InterruptableStoppingCriteria 的粒度

用户等得不耐烦，点了一下「停止」——模型不是被"杀死"，而是在**下一个 token 边界优雅停住**。靠的是导入时那个 `InterruptableStoppingCriteria`：

```js
// 可中断的停止条件：模型每生成一个 token 前检查中断标记，用户点「停止」时触发中断
const stopping_criteria = new InterruptableStoppingCriteria();
```

停止条件（stopping criteria）是生成循环里的一个钩子：**每生成一个 token 前，模型都会问它一句"要不要停？"** 平时它回答"继续"，一旦被触发，它回答"停"，生成循环立刻收尾。

触发它的是主线程的消息：

```js
case "interrupt":
  // 中断生成
  // interrupted 设置为true，llm 实例的属性 每次生成token 检测
  stopping_criteria.interrupt();
  break;
```

`interrupt()` 把内部的 `interrupted` 标志置位。模型生成完当前 token、检查停止条件时发现标志已置位，于是停止——**已生成的文本全部保留**，被流式输出的那部分已经到界面上了。

两个配套细节值得注意：

- 每次发起新生成前要 `reset()`：`case "generate": stopping_criteria.reset();` 清掉上一轮的标志，否则下一次生成一开始就会被"历史中断"拦下；
- 这是**协作式中断**，不是粗暴杀线程。它保证生成状态一致、不会卡在算到一半的张量上——这正是"可中断"三个字的工程价值。

---

## 六、KV Cache：多轮对话的算力账本

多轮对话为什么慢？因为**每一轮的注意力计算都要重算**。笔记里这句点得很透：

```js
// KV Cache：缓存上一轮的 key/value，加速多轮对话
// 每次对话，都会KV 计算 大量算力消耗
// messages 数组 添加上一条，缓存之前的计算，跳过了
let past_key_values_cache = null;
```

Transformer 生成时，每个 token 都要做注意力计算，其中 key/value 是逐 token 产生的。第二轮对话的输入 = 第一轮全部内容 + 一句新的话，如果从第一行重新算起，前面所有轮次的 KV 都被白白重算——**这是实打实的大量算力消耗**。

缓存的思路就一句话：`messages` 数组虽然在变长，但"前缀"部分对应的 KV 是不变的。把上一轮算好的 KV 存进 `past_key_values_cache`，下一轮把它传回 `model.generate`，模型就跳过已算的部分、只算新增的 token。

项目里这行仍是 `// TODO: 修复后启用 KV Cache 复用`——**明白道理，但先不开。** 因为 KV Cache 复用的前提是"本轮输入前缀"与"缓存的 KV"严格对应，差一位输出就错乱。先保证正确，再谈加速，这是工程上的取舍。

---

## 七、流式输出：边生成边出字

最后是输出通道。模型要"边生成边显示"，靠 `TextStreamer`：

```js
const streamer = new TextStreamer(tokenizer, {
  skip_prompt: true,              // 不重复输出输入的 prompt
  skip_special_tokens: true,      // 跳过特殊 token（如 think 标签）
  callback_function,              // 每段文本回调
  token_callback_function,        // 每 token 回调（统计与状态切换）
});
```

两个开关各解决一个问题：

- **`skip_prompt: true`**——模型生成时会"看到"整个输入上下文，但输出只需显示新生成的部分，不能把用户刚说的话再打印一遍；
- **`skip_special_tokens: true`**——think 标签这类特殊标记只用来切状态，不该出现在回答里。

生成结束，`model.generate` 返回 `{ past_key_values, sequences }`——`sequences` 是完整的 token 序列，再整体 `batch_decode` 一次，作为 `complete` 消息把最终结果发给主线程：

```js
const decoded = tokenizer.batch_decode(sequences, {
  skip_special_tokens: true,
});
```

流式负责"过程可见"，`batch_decode` 负责"结果完整"，两条路各司其职。

---

## 八、面试问答

**问：`messages` 数组是怎么变成模型输入的？**

> 靠 `tokenizer.apply_chat_template(messages, { add_generation_prompt, return_dict })`。它把 `[{role, content}]` 数组按模型训练时用的 ChatML 模板排版成文本（`<|im_start|>user\n…<|im_end|>`），`return_dict: true` 时返回包含 `input_ids` 和 `attention_mask` 的字典，可直接展开传给 `model.generate`。模板是训练时定死的，不能乱改。

**问：`add_generation_prompt: true` 有什么用？**

> 它在模板末尾追加 `<|im_start|>assistant\n`，相当于告诉模型"轮到助手回答了"。没有它，模型不知道自己的角色是回答者，输出会不可控。

**问：`input_ids` 和 `attention_mask` 分别是什么？**

> `input_ids` 是模板文本被 tokenizer 切碎后每个 token 的数字 id 序列，是模型真正吃的数值；`attention_mask` 是与它等长的 0/1 序列，1 表示真实 token，0 表示 padding 填充位。一批文本长度不一要 padding 对齐，mask 就是用来告诉注意力机制"别理会填充位"的。

**问：为什么要把 `<think></think>` 两个标记一起编码，而不是只编码结束标记？**

> `tokenizer.encode` 返回的是 token id 数组，顺序与文本一致。只编码 `</think>` 时数组里只有结束标记对应的 id，解构 `[START, END]` 拿不到正确的开始 id。把 `<think></think>` 一起编码，数组就是 `[开始 id, 结束 id]`，一次拿齐。另外要传 `add_special_tokens: false`，否则 tokenizer 会追加 BOS/EOS 等特殊 token 挤乱位置。

**问：端侧模型的中断生成是怎么实现的？**

> 通过 `InterruptableStoppingCriteria`。停止条件是生成循环里的钩子，模型每生成一个 token 前都会检查它。主线程发 `interrupt` 消息后，worker 调用 `stopping_criteria.interrupt()` 把内部标志置位，生成到下一个 token 边界就停止，已生成的文本保留。这是协作式中断而非杀线程，且每次新生成前要 `reset()` 清标志。

**问：KV Cache 为什么能加速多轮对话？为什么项目里暂未启用？**

> 生成每个 token 都要做注意力计算，KV 是逐 token 产生的；多轮对话里新输入 = 旧内容 + 新句子，若从头重算，前面所有轮的 KV 都是浪费。缓存上一轮的 `past_key_values`，下一轮跳过已算部分即可。但复用的前提是输入前缀与缓存严格对应，差一位输出就错乱，所以项目标了 TODO 先保正确再谈性能。

**问：TextStreamer 的 `skip_prompt` 和 `skip_special_tokens` 各解决什么问题？**

> `skip_prompt: true` 让输出只包含新生成的内容，不把输入的 prompt 再打印一遍；`skip_special_tokens: true` 让 think 标签这类特殊标记不出现在显示文本里（它们只用于状态切换）。

---

## 结语：一条消息到一段输出的完整管线

这一天把"发消息 → 收回答"之间的黑盒打开了：

```text
输入     messages 数组
        ↓  apply_chat_template 排版成 ChatML 文本
模板     add_generation_prompt 追加 <|im_start|>assistant\n
张量     input_ids + attention_mask
标记     encode("<think></think>") 一次拿齐开始/结束 token id
生成     思考/回答两段，token 回调里切状态、算 TPS
中断     InterruptableStoppingCriteria 在每个 token 边界检查停止
输出     TextStreamer 流式出字 + batch_decode 出最终结果
```

动手前，拿这份清单自检：

- [ ] 用 `apply_chat_template` 时，是否记得 `add_generation_prompt` 决定模型"开不开口"？
- [ ] 是否理解 `input_ids` 是模型吃的数值、`attention_mask` 是用来忽略 padding 的？
- [ ] 需要识别多个标记时，是否把标记一起编码、再按序解构，而不是靠猜单个标记？
- [ ] 编码标记时是否传了 `add_special_tokens: false`，避免特殊 token 挤乱位置？
- [ ] 做"停止"功能时，是否用协作式停止条件（token 边界优雅收尾），而不是杀线程？
- [ ] 每次重新生成前，是否 `reset()` 清掉了上一次的停止标志？
- [ ] 开启 KV Cache 复用前，是否验证了输入前缀与缓存严格对应？

模型被装进浏览器，只是把"能聊"的门槛过了；让每一次生成都可理解、可中断、可流式、可复用，才是一天天抠出来的工程价值。
