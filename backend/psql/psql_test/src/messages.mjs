import "dotenv/config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { query } from "./db.mjs";

const VALID_ROLES = ["user", "assistant", "system"];
let embeddings; // 推迟

function getEmbeddings() {
  if (!embeddings) {
    embeddings = new OpenAIEmbeddings({
      model: process.env.EMBEDDING_MODEL || "text-embedding-v3",
      apiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_BASE_URL
      }
    })
  }
  return embeddings;
}

async function createMessage(conversationId, role, content, withEmbedding=false) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`role 必须是${VALID_ROLES.join("、")}之一`)
  }
  if (withEmbedding) {
    const vector = await getEmbeddings().embedQuery(content);
    const { rows } = await query(
      `
        INSERT INTO messages (conversation_id, role, content, embedding)
        VALUES ($1, $2, $3, $4::vector)
        RETURNING id, conversation_id, role, content, created_at
      `,
      [conversationId, role, content, JSON.stringify(vector)]
    );
    return rows[0]
  }

  const { rows } = await query (
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING *
    `,
    [conversationId, role, content]
  )
  return rows[0]
}

// 根据 id 查询消息
async function getMessageById(id) {
  const { rows } = await query(
    "SELECT id, conversation_id, role, content, created_at FROM messages WHERE id = $1",
    [id]
  )
  return rows[0] ?? null
}

async function searchSimilaryMessage(conversationId, searchText, limit=5) {
  const vector = await getEmbeddings().embedQuery(searchText)
  const { rows } = await query (
    `SELECT id, conversation_id, role, content, created_at,
     1- (embedding <=> $1::vector) AS similarity
     FROM messages
     WHERE conversation_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3
    `,
    [JSON.stringify(vector), conversationId, limit]
  )
  return rows
}

export { createMessage, getMessageById, searchSimilaryMessage }
