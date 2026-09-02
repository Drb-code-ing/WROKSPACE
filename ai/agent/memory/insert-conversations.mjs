// verctor store  小龙虾， workbuddy   Memory 模块
// milvus 本地安装
import 'dotenv/config';
import {
  MilvusClient,
  DataType,
  MetricType,
  IndexType
} from '@zilliz/milvus2-sdk-node';
import { OpenAIEmbeddings } from '@langchain/openai';
// SQL 关系型 ， NO SQL 非关系型数据库
const COLLECTION_NAME = 'conversations'; // 集合
const VECTOR_DIM = 1024;// 维度

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.API_KEY,
  model: 'text-embedding-v3',
  configuration: {
    baseURL: process.env.API_BASE_URL // .env 里是 API_BASE_URL，不是 BASE_URL
  },
  dimension: VECTOR_DIM
});

async function getEmbedding(text) {
  const result = await embeddings.embedQuery(text);
  return result;
}

const client = new MilvusClient({
  address: 'localhost:19530'
});

async function main() {
  try {
    console.log('连接到Milvus...');
    await client.connectPromise;
    console.log('已连接');

    console.log('创建集合...');
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        // uuid 唯一的id , 更安全
        { name: "id", data_type: DataType.VarChar, max_length: 50, 
          is_primary_key: true },
        { name: 'vector', data_type: DataType.FloatVector, dim: VECTOR_DIM },
        { name: 'content', data_type: DataType.VarChar, max_length: 5000 },
        { name: 'round', data_type: DataType.Int64 },
        // 没有Date / DateTime 
        { name: 'timestamp', data_type: DataType.VarChar, max_length: 100 }
      ]
    });
    
    await client.createIndex({
      collection_name: COLLECTION_NAME,
      field_name: 'vector', // 最频繁
      index_type: IndexType.IVF_FLAT,
      metric_type: MetricType.COSINE
    });
    console.log('索引已创建');

    await  client.loadCollection({collection_name: COLLECTION_NAME});

    const conversations = [
    {
      id: 'conv_001',
      content: '用户：我叫赵六，是一名数据科学家\n助手：很高兴认识你，赵六！数据科学是一个很有趣的领域。',
      round: 1,
      timestamp: new Date().toISOString()
    },
    {
      id: 'conv_002',
      content: '用户：我最近在研究机器学习算法\n助手：机器学习确实很有意思，你在研究哪些算法呢？',
      round: 2,
      timestamp: new Date().toISOString()
    },
    {
      id: 'conv_003',
      content: '用户：我喜欢打篮球和看电影\n助手：运动和文化娱乐都是很好的爱好！',
      round: 3,
      timestamp: new Date().toISOString()
    },
    {
      id: 'conv_004',
      content: '用户：我周末经常去电影院\n助手：看电影是很好的放松方式。',
      round: 4,
      timestamp: new Date().toISOString()
    },
    {
      id: 'conv_005',
      content: '用户：我的职业是软件工程师\n助手：软件工程师是个很有前景的职业！',
      round: 5,
      timestamp: new Date().toISOString()
    }
    ];
    const conversationData = await Promise.all(
      conversations.map(async (conv) => ({
        ...conv,
        vector: await getEmbedding(conv.content)
      }))
    );
    const insertResult = await client.insert({
      collection_name: COLLECTION_NAME,
      data: conversationData
    });
    console.log(`插入完成：${insertResult.insert_cnt ?? conversationData.length} 条`, insertResult.success ? '' : insertResult);
    
  } catch(err) {
    console.error('出错了：', err) // 不要静默吞掉错误
  }
}

main()
  .catch(console.error);