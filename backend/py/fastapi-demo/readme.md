# FastAPI + Vue3 + LangChain 实战

## FastAPI
是pythom 高性能的web接口空间，上手简单快速，性能堪比Go\Node
自动生成交互接口文档(前后端api 约定，swagger，自动生成)
写少量代码，自带类型提示
专门用于后端API，写接口不用折腾繁琐配置，开发效率很高
特别适合结合langchain/langgraph 开发后端服务
对异步(node) 异步无阻塞 高并发

FastAPI = Pydantic(zod 类型检测 用户输出 params, 类) +
Starlette(负责Web 底层，接受http服务，路由匹配，返回响应，处理网络，自带异步能力，是高性能的Web 基座)
路由参数
/user/123 pydantic 约束一定是整数

async
 - 数据库查询
 - 文件读写

## 环境安装
日常开发的全套工具
pip install "fastapi[standard]"
uvicorn 是异步web服务器，用来运行FastAPI 应用
pip install "uvicorn[standard]"
pip show fastapi uvicorn 查看安装信息

# Annotated
丰富类型注解 Annotated[类型, ...]
Annotated[int, Path(ge=2)]
自动做类型转换