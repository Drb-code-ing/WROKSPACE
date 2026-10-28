# 智能日报生成器 - 架构设计

## 1. 系统架构

采用 **管道式架构** (Pipeline Architecture) : 数据从外数据源流入，经过采集、生成、推送三个阶段，最终到达目标用户

选择管道式架构的原因：
- 数据流向单一、明确（输入 -> 处理 -> 输出）
- 各阶段职责独立，便于单独测试和替换
- 系统规模小（5 - 15人团队），不需要**微服务**的复杂性
- 运行方式为定时任务，不需要事件驱动的实时性

### 1.2 架构图

```
外部数据源                  系统内部                        输出目标
─────────                ──────────                    ────────

GitHub API ─┐
            │
飞书任务 API ┼→ [采集层] → 原始数据(JSON) → [生成层] → DailyReport
            │  Collector                    Generator     │
飞书消息 API ┘                                            │
                                                          ↓
                                                    [推送层] Notifier
                                                      │        │
                                                      ↓        ↓
                                                    邮件    飞书消息

                    [共享基础层]
                    配置管理 │ 日志 │ 错误处理 │ 数据存储(SQLite)
```

## 2. 模块职责

### 2.1 采集层 (Collector/)

| 文件 | 职责 | 不负责 |
| ------ | ------ | ------ |
| github.py | 从GitHub API 获取 commit 记录 | 数据格式化、去重判断 |
| lark_task.py | 从飞书开发平台获取任务状态变更 | 推送通知 |
| lark_msg.py | 从飞书群获取消息记录并按关键词过滤 | 语义理解/AI 摘要 |

### 2.2 生成层 (Generator/)
| 文件 | 职责 | 不负责 |
| ------ | ------ | ------ |
| formatter.py | 将原始数据整理为 MemberReport | 数据采集 |
| template.py | 管理日报模版(HTML/Markdown)，支持自定义 | 推送通知 |

### 2.3 推送层 (Notifier/)
| 文件 | 职责 | 不负责 |
| ------ | ------ | ------ |
| email.py | 通过 SMTP 发送HTML 格式日报邮件 | 数据采集、日报生成 |
| lark_bot.py | 通过飞书机器人 webhook 发送日报消息 | 数据采集、日报生成 |

### 2.4 共享基础层 (Shared/)
| 文件 | 职责 |
| ------ | ------ |
| config.py | 读取config.yaml 效验配置完整性、提供全局配置访问 |
| logger.py | 统一日志格式(JSON lines) |
| error.py | 自定义异常类型，错误处理策略实现 |
| storage.py | SQLite 操作封装，日报历史查询和存储 |


## 3. 数据模型

### 3.1 采集层输出
```py
# 代码提交记录
CommitRecord:
  author: str      # GitHub 用户名
  message: str     # 提交信息
  timestamp: datetime  # 提交时间戳
  repo: str        # 仓库名称
  branch: str      # 分支名称
  additions: int   # 新增行数
  deletions: int   # 删除行数
  files_changed: int  # 变更文件数

# 任务变更记录
TaskRecord:
  assignee: str    # 飞书用户名
  title: str       # 任务标题
  status_from: str  # 原状态
  status_to: str    # 新状态
  updated_at: datetime  # 变更时间

# 消息记录
MessageRecord:
  sender: str      # 飞书用户名
  content: str     # 消息内容
  timestamp: datetime  # 消息时间戳
  chat_name: str   # 群名称
```

## 4. 接口约束

## 5. 技术选型(ADR)

## 6. 非功能性约束