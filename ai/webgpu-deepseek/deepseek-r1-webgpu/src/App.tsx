import { useEffect, useState, useRef } from "react";

import Chat from "./components/Chat";
import ArrowRightIcon from "./components/icons/ArrowRightIcon";
import StopIcon from "./components/icons/StopIcon";
import Progress from "./components/Progress";

const IS_WEBGPU_AVAILABLE = !!navigator.gpu;
const STICKY_SCROLL_THRESHOLD = 120;
const EXAMPLES = [
  "Solve the equation x^2 - 3x + 2 = 0",
  "Lily is three times older than her son. In 15 years, she will be twice as old as him. How old is she now?",
  "Write python code to compute the nth fibonacci number.",
];

function App() {
  // Web Worker 引用：负责在后台线程加载模型和生成文本，避免阻塞 UI
  const worker = useRef<Worker | null>(null);

  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 模型加载状态与进度相关
  const [status, setStatus] = useState(null);          // 当前状态：null/loading/ready
  const [error, setError] = useState(null);            // 错误信息
  const [loadingMessage, setLoadingMessage] = useState("");  // 加载阶段的提示文案
  const [progressItems, setProgressItems] = useState([]);    // 各文件的下载进度列表
  const [isRunning, setIsRunning] = useState(false);   // 是否正在生成文本

  // 输入输出相关
  const [input, setInput] = useState("");               // 用户输入框内容
  const [messages, setMessages] = useState([]);         // 聊天消息列表（user/assistant）
  const [tps, setTps] = useState(null);                 // tokens/second 生成速度
  const [numTokens, setNumTokens] = useState(null);     // 已生成 token 数

  function onEnter(message) {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setTps(null);
    setIsRunning(true);
    setInput("");
  }

  function onInterrupt() {
    // 注意：这里不主动把 isRunning 置为 false
    // 因为 worker 中断完成后会发回 'complete' 消息，由那里统一处理状态切换
    worker.current.postMessage({ type: "interrupt" });
  }

  // 输入框高度自适应：内容多时自动变高，最高 200px
  useEffect(() => {
    if (!textareaRef.current) return;
    const target = textareaRef.current;
    target.style.height = "auto";  // 先重置，才能正确读取 scrollHeight
    const newHeight = Math.min(Math.max(target.scrollHeight, 24), 200);
    target.style.height = `${newHeight}px`;
  }, [input]);

  // 用 useEffect 在 App 组件挂载时立即初始化 worker
  useEffect(() => {
    // 如果 worker 还不存在，就创建一个（懒加载，只创建一次）
    if (!worker.current) {
      worker.current = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
      worker.current.postMessage({ type: "check" }); // 发送检测指令，检查 WebGPU 是否可用
    }

    // 处理 worker 发回来的消息
    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case "loading":
          // 模型开始加载：更新状态和提示文案
          setStatus("loading");
          setLoadingMessage(e.data.data);
          break;

        case "initiate":
          // 某个文件开始下载：把该文件加入进度列表
          // 给函数为了获取最新状态
          // 多个文件并发下载时进度回调频繁触发
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // 某个文件下载进度更新：更新列表中对应文件的进度
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, ...e.data };
              }
              return item;
            }),
          );
          break;

        case "done":
          // 某个文件下载完成：从进度列表中移除
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file),
          );
          break;

        case "ready":
          // 管道就绪：worker 可以接收 generate 消息了
          setStatus("ready");
          break;

        case "start":
          {
            // 开始生成：在消息列表末尾追加一条空的 assistant 消息
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "" },
            ]);
          }
          break;

        case "update":
          {
            // 生成中：把新输出的文本追加到 assistant 消息
            const { output, tps, numTokens, state } = e.data;
            setTps(tps);
            setNumTokens(numTokens);
            setMessages((prev) => {
              const cloned = [...prev];
              const last = cloned.at(-1);
              const data = {
                ...last,
                content: last.content + output,
              };
              if (data.answerIndex === undefined && state === "answering") {
                // 状态从 thinking 切换到 answering 时，记录答案在文本中的起始位置
                // 用于在 UI 上区分「思考过程」和「最终回答」
                data.answerIndex = last.content.length;
              }
              cloned[cloned.length - 1] = data;
              return cloned;
            });
          }
          break;

        case "complete":
          // 生成完成：恢复按钮可点击状态
          setIsRunning(false);
          break;

        case "error":
          setError(e.data.data);
          break;
      }
    };

    const onErrorReceived = (e) => {
      console.error("Worker error:", e);
    };

    // 绑定消息和错误监听器
    worker.current.addEventListener("message", onMessageReceived);
    worker.current.addEventListener("error", onErrorReceived);

    // 组件卸载时移除监听器，避免内存泄漏
    return () => {
      worker.current.removeEventListener("message", onMessageReceived);
      worker.current.removeEventListener("error", onErrorReceived);
    };
  }, []);

  // 当 messages 变化时，把消息列表发送给 worker 触发生成
  useEffect(() => {
    if (messages.filter((x) => x.role === "user").length === 0) {
      // 还没有用户消息：什么都不做
      return;
    }
    if (messages.at(-1).role === "assistant") {
      // 最后一条是 assistant：说明正在生成中，不再触发新的生成
      return;
    }
// setTps(null) 已在 onEnter 中调用，此处重复调用会导致 effect 内同步 setState 引发级联渲染，故移除
    worker.current.postMessage({ type: "generate", data: messages });
  }, [messages, isRunning]);

  useEffect(() => {
    if (!chatContainerRef.current || !isRunning) return;
    const element = chatContainerRef.current;
    if (
      element.scrollHeight - element.scrollTop - element.clientHeight <
      STICKY_SCROLL_THRESHOLD
    ) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, isRunning]);

  return IS_WEBGPU_AVAILABLE ? (
    <div className="flex flex-col h-screen mx-auto items justify-end text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
      {status === null && messages.length === 0 && (
        <div className="h-full overflow-auto scrollbar-thin flex justify-center items-center flex-col relative">
          <div className="flex flex-col items-center mb-1 max-w-[400px] text-center">
            <img
              src="logo.png"
              width="80%"
              height="auto"
              className="block drop-shadow-lg bg-transparent"
            ></img>
            <h1 className="text-4xl font-bold mb-1">DeepSeek-R1 WebGPU</h1>
            <h2 className="font-semibold">
              A next-generation reasoning model that runs locally in your
              browser with WebGPU acceleration.
            </h2>
          </div>

          <div className="flex flex-col items-center px-4">
            <p className="max-w-[510px] mb-4">
              <br />
              You are about to load{" "}
              <a
                href="https://huggingface.co/onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                DeepSeek-R1-Distill-Qwen-1.5B
              </a>
              , a 1.5B parameter reasoning LLM optimized for in-browser
              inference. Everything runs entirely in your browser with{" "}
              <a
                href="https://huggingface.co/docs/transformers.js"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                🤗&nbsp;Transformers.js
              </a>{" "}
              and ONNX Runtime Web, meaning no data is sent to a server. Once
              loaded, it can even be used offline. The source code for the demo
              is available on{" "}
              <a
                href="https://github.com/huggingface/transformers.js-examples/tree/main/deepseek-r1-webgpu"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                GitHub
              </a>
              .
            </p>

            {error && (
              <div className="text-red-500 text-center mb-2">
                <p className="mb-1">
                  Unable to load model due to the following error:
                </p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              className="border px-4 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 disabled:bg-blue-100 cursor-pointer disabled:cursor-not-allowed select-none"
              onClick={() => {
                worker.current.postMessage({ type: "load" });
                setStatus("loading");
              }}
              disabled={status !== null || error !== null}
            >
              Load model
            </button>
          </div>
        </div>
      )}
      {status === "loading" && (
        <>
          <div className="w-full max-w-[500px] text-left mx-auto p-4 bottom-0 mt-auto">
            <p className="text-center mb-1">{loadingMessage}</p>
            {progressItems.map(({ file, progress, total }, i) => (
              <Progress
                key={i}
                text={file}
                percentage={progress}
                total={total}
              />
            ))}
          </div>
        </>
      )}

      {status === "ready" && (
        <div
          ref={chatContainerRef}
          className="overflow-y-auto scrollbar-thin w-full flex flex-col items-center h-full"
        >
          <Chat messages={messages} />
          {messages.length === 0 && (
            <div>
              {EXAMPLES.map((msg, i) => (
                <div
                  key={i}
                  className="m-1 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-100 dark:bg-gray-700 cursor-pointer"
                  onClick={() => onEnter(msg)}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
          <p className="text-center text-sm min-h-6 text-gray-500 dark:text-gray-300">
            {tps && messages.length > 0 && (
              <>
                {!isRunning && (
                  <span>
                    Generated {numTokens} tokens in{" "}
                    {(numTokens / tps).toFixed(2)} seconds&nbsp;&#40;
                  </span>
                )}
                {
                  <>
                    <span className="font-medium text-center mr-1 text-black dark:text-white">
                      {tps.toFixed(2)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-300">
                      tokens/second
                    </span>
                  </>
                }
                {!isRunning && (
                  <>
                    <span className="mr-1">&#41;.</span>
                    <span
                      className="underline cursor-pointer"
                      onClick={() => {
                        worker.current.postMessage({ type: "reset" });
                        setMessages([]);
                      }}
                    >
                      Reset
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      )}

      <div className="mt-2 border border-gray-300 dark:bg-gray-700 rounded-lg w-[600px] max-w-[80%] max-h-[200px] mx-auto relative mb-3 flex">
        <textarea
          ref={textareaRef}
          className="scrollbar-thin w-[550px] dark:bg-gray-700 px-3 py-4 rounded-lg bg-transparent border-none outline-hidden text-gray-800 disabled:text-gray-400 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 disabled:placeholder-gray-200 resize-none disabled:cursor-not-allowed"
          placeholder="Type your message..."
          rows={1}
          value={input}
          disabled={status !== "ready"}
          title={status === "ready" ? "Model is ready" : "Model not loaded yet"}
          onKeyDown={(e) => {
            if (
              input.length > 0 &&
              !isRunning &&
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault(); // 阻止回车键的默认行为（换行），改为发送消息
              onEnter(input);
            }
          }}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
        {isRunning ? (
          <div className="cursor-pointer" onClick={onInterrupt}>
            <StopIcon className="h-8 w-8 p-1 rounded-md text-gray-800 dark:text-gray-100 absolute right-3 bottom-3" />
          </div>
        ) : input.length > 0 ? (
          <div className="cursor-pointer" onClick={() => onEnter(input)}>
            <ArrowRightIcon
              className={`h-8 w-8 p-1 bg-gray-800 dark:bg-gray-100 text-white dark:text-black rounded-md absolute right-3 bottom-3`}
            />
          </div>
        ) : (
          <div>
            <ArrowRightIcon
              className={`h-8 w-8 p-1 bg-gray-200 dark:bg-gray-600 text-gray-50 dark:text-gray-800 rounded-md absolute right-3 bottom-3`}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mb-3">
        Disclaimer: Generated content may be inaccurate or false.
      </p>
    </div>
  ) : (
    <div className="fixed w-screen h-screen bg-black z-10 bg-opacity-[92%] text-white text-2xl font-semibold flex justify-center items-center text-center">
      WebGPU is not supported
      <br />
      by this browser :&#40;
    </div>
  );
}

export default App;