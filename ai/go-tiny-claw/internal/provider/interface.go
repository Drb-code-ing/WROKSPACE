// Engin 需要知道去哪里调用大模型，去哪里执行工具
package provider

import (
	"context"

	"github.com/Drb-code-ing/go-tiny-claw/internal/schema"
)

// Provider 大模型提供方的统一抽象
// Engine 只依赖这个接口，不关心背后是 OpenAI、DashScope 还是本地模型
type Provider interface {
	// Chat 传入完整上下文，返回模型这一轮的消息（可能带 ToolCalls）
	Chat(ctx context.Context, messages []schema.Message) (*schema.Message, error)
}
