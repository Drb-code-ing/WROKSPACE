// 开箱即用的harness deepagents
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url"
import { ChatOpenAI } from "@langchain/openai";
// 文件系统中间件
import { 
  createFilesystemMiddleware, // 中间件
  FilesystemBackend  // 落实文件操作的支持
} from "deepagents";
import {
  createAgent,
  HumanMessage
} from 'langchain'

// 开箱即用的harness deepagents
// 当前文件路径 file:// url 
// console.log(path.dirname(fileURLToPath(import.meta.url)))
const workspaceDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)), // 当前文件目录
  "workspace"
);
// console.log(workspaceDir);

// 文件系统权限
const permissions = [
  { operations: ["read"], paths: ["/secret.txt"], mode: "deny" },
  { operations: ["write"], paths: ["/todo.md"], mode: "allow" },
  { operations: ["write"], paths: ["/**"], mode: "deny" }
];

fs.rmSync(workspaceDir, { recursive: true, force: true }); // 先删除旧的工作区
fs.mkdirSync(workspaceDir); // 创建新的工作区
fs.writeFileSync(path.join(workspaceDir, "secret.txt"), "机密：不得读取", 
"utf8");

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0,
})

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: `
  工作区根路径为/ 。用ls、read_file、write_file、edit_file 操作文件, 
  路径以/ 开头。 中文回答。
  `,
  middleware: [
    // 业务层 拿来就用 
    // `createFilesystemMiddleware` 是`deepagents` 提供的 文件系统中间件工厂 
    // 一行给 agent 装上完整的文件操作能力：
    createFilesystemMiddleware({
      // FilesystemBackend 让工具真正读写文件
      backend: new FilesystemBackend({
        rootDir: workspaceDir, // 工作区根路径
        permissions, // 文件系统权限
        virtualMode : true, // 开启虚拟模式，Agent操作虚拟路径，映射到工作区路径
      })
    })
  ]
});

console.log("工作区：", workspaceDir);
console.log("权限：", JSON.stringify(permissions, null, 2));

async function run(label, prompt) {
  console.log(prompt);
  const { messages } = await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { recursionLimit: 20} // 递归调用限制，防止无限循环
  )
}

await run(
  "允许的操作",
  "write_file 创建 /todo.md（三条待办）"
);