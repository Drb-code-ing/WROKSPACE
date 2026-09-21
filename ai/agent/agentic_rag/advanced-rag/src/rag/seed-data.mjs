import 'dotenv/config'
import { Client } from '@elastic/elasticsearch'
import {
  DataType,
  IndexType,
  MetricType,
  MilvusClient,
} from '@milvus/milvus2-sdk-node'
import { OpenAIEmbeddings } from '@langchain/openai'

