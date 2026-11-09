// schema 包，专门放数据结构体、模型定义，约定数据长啥样
package schema

// type 类型别名
type Role string

// 定义常量 () 一次一批
const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

// Go 没有类，用结构体 struct 承载数据，配合方法实现类似类的能力
// Message 上下文中的单条消息
type Message struct {
	// 字段名  类型
	Role    Role   `json:"role"`
	Content string `json:"content"`
	// 如果模型决定调用工具，这个字段就会有值
	// omitempty 表示如果这个字段为空，就不要序列化到 JSON 中
	ToolCalls []ToolCall `json:"tool_calls,omitempty"`
}

type ToolCall struct {
	ID   string `json:"id"`   // 工具调用的唯一标识符
	Name string `json:"name"` // 工具的名称
	// Arguments 工具的参数，是一个 JSON 字符串。使用RawMessage类型，避免 JSON 序列化问题
	Arguments string `json:"arguments"` // 工具的参数
}

// 工具执行完毕后返回的物理结果
type ToolResult struct {
	ToolCallID string `json:"tool_call_id"`
	Result     string `json:"output"`
	IsError    bool   `json:"is_error"`
}

type ToolDefinition struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	// interface{} 表示任意类型的 JSON 数据，用于描述工具的输入参数和返回结果
	InputSchema interface{} `json:"input_schema"`
}
