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

### 2.5 编排入口(main.py)
- 按顺序调用：采集 -> 聚合 -> 生成 -> 推送
- 处理全局异常，记录执行状态
- 支持 `--check` 模式（健康检测）和 `--dry-run` 模式（不实际推送）

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
### 3.2 生成层输出/输入
```py
# 生成日报(生成层输入)
MemberReport:
  name: str        # 成员姓名
  github_username: str  # GitHub 用户名
  commits: list[CommitRecord]  # 代码提交记录
  tasks: list[TaskRecord]  # 任务变更记录
  messages: list[MessageRecord]  # 消息记录

# 日报(生成层输出)
DailyReport:
  date: datetime  # 报告日期
  team_name: str  # 团队名称
  members: list[MemberReport]  # 各成员数据
  markdown: str   # Markdown 格式日报
  html: str       # HTML 格式日报
```
### 3.3 身份映射
成员在不同系统中的账号通过config.yaml 中的映射表进行关联

```yaml
members:
  - name: "张三"
    github: "zhangsan"
    lark: "zhangsan@company.com"
  - name: "李四"
    github: "lisi"
    lark: "lisi@company.com"
```

## 4. 接口约束
### 4.1 采集层接口
```py
# github.py
def collect(repos: list[str], since: datetime, until: datetime) -> list[CommitRecord]:

# lark_task.py
def collect(project_id: str, since: datetime, until: datetime) -> list[TaskRecord]:

# lark_msg.py
def collect(chat_id: str, keywords: list[str], since: datetime, until: datetime) -> list[MessageRecord]:
```
### 4.2 生成层接口
```py
# formatter.py
def generate(members: list[MemberReport], date: datetime, team_name: str) -> DailyReport:
```
### 4.3 推送层接口
```py
# email.py
def send_email(report: DailyReport, recipients: list[str]) -> bool:

# lark_bot.py
def send_lark(report: DailyReport, chat_id: str) -> bool:
```

## 5. 技术选型(ADR)

### ADR - 001: 使用httpx 作为 HTTP 客户端
**状态** 已采纳
**背景** 需要调用多个外部API (GitHub、飞书)
**选项** requests (社区广泛，不支持异步) | httpx (同步 + 异步，API 兼容 requests) | aiohttp(仅异步)
**决策** httpx
**理由** 性能要求 < 60s 需要并发采集能力；API 兼容 requests 降低迁移成本；同步模式可用，为了可平滑切换异步

### ADR - 002: 使用SQLite 存储日报历史
**状态** 已采纳
**背景** 需要存储日报历史记录
**选项** SQLite (轻量级、零配置，Python 内置) | PostgreSQL (功能完整，需运维) | JSON 文件(最简单，无查询能力)
**决策** SQLite
**理由** 每天执行一次，并无并发写入；5-15人团队一年几千条记录；零运维；Python 标准库支持

## 6. 非功能性约束

### 6.1 错误处理
**原则** 优雅降级，不中断整体流程
| 场景 | 处理策略 |
| ------ | ------ |
| API 超时 | 重试3次（间隔5秒），任失败标记“数据获取失败”|
| 飞书token 过期 | 自动刷新后重试1次 |
| 单个数据源不可用 | 跳过并在日报中标注，其他数据源正常采集 |
| 所有数据源不可以 | 记录错误日志 + 告警，不生成空日报 |
| 推送失败 | 重试两次，任失败记录日志 + 备用渠道告警 |

### 6.2 安全
- 所有API 密钥通过环境变量注入，禁止硬编码
- .env 文件加入.gitignore，避免泄露
- 飞书消息中敏感关键词过滤（薪资、绩效、裁员等）
- 日报中不包含代码diff 具体内容，只含统计数据
- 只采集配置中明确列出的仓库/组群

### 6.3 可运维性
- 日志格式：JSON lines，级别 INFO + ERROR
- 健康检查： `main.py --check` 验证所有链接和权限
- 配置热更新：修改config.yaml 后，无需重启服务即可生效
