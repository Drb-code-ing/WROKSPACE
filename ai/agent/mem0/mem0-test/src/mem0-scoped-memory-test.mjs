import 'dotenv/config'
import { MemoryClient } from 'mem0ai';

const USER_ID = 'mem0_test_user'; // 用户ID
const RUN_ID = 'mem0_test_session'; // 会话ID
const AGENT_ID = 'mem0_test_agent'; // Agent ID
 
function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

async function addUserMemory(client) {
  const messages = [
    {role: "user", content: "我叫小明，住在杭州，平时喜欢骑行和摄影。"},
    {role: "assistant", content: "好的，我会记住你的信息。"},
  ]
  const added = await client.add(messages, { userId: USER_ID });
  log('用户记忆 - add', added);
}

async function addSessionMemory(client) {
  const messages = [
    {role: "user", content: "这次聊天先帮我把季度总结的大纲列出来，重点写Q1 的项目复盘"},
    {role: "assistant", content: "明白，我们先围绕Q1 的项目复盘整理季度总结大纲。"},
  ]

  const added = await client.add(messages, { userId: USER_ID, runId: RUN_ID });
  log('会话记忆 - add', added);
}

async function addAgentMemory(client) {
  const messages = [
    {role: "user", content: "你现在是旅行规划助手，回答时多给建议和备选方案"},
    {role: "assistant", content: "好的，我会以旅行规划助手的身份，提供旅行建议和备选方案。"},
  ]

  const added = await client.add(messages, { agentId: AGENT_ID });
  log('Agent 记忆 - add', added);
}

// 搜索记忆
async function searchAgentMemory(client) {
  const searched = await client.search("这个Agent 的角色和回答方式", {
    filters: { agent_id: AGENT_ID },
    topK: 5,
  })
  log('Agent 记忆 - search', searched.results?.map(m => m.memory) ?? []);
  const listed = await client.getAll({
    filters: { agent_id: AGENT_ID },
    pageSize: 10,
  })
  log('Agent 记忆 - list', listed.results?.map(m => m.memory) ?? []);
}



async function main() {
  const client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
  const action = process.argv[2] ?? "add"

  if(action === "add") {
    // await addUserMemory(client);
    // await addSessionMemory(client);
    // await addAgentMemory(client);
  }

  if (action === "search") {
    await searchAgentMemory(client);
  }
}

main()