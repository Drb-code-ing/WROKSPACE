package main

import "fmt"

func main() {
	// 变量声明、赋值、类型推导、端变量申明符
	// i := 0
	// i = "abc"
	// channel 简称
	// 创建无缓冲通道
	// string  通道可以交换的数据类型
	ch := make(chan string)
	fmt.Println("主协程：准备等待子协程发送消息")
	// 并发 创建子协程
	go func() {
		fmt.Println("子协程：发送消息到通道")
		ch <- "hello"
		fmt.Println("子协程：发送完成")
	}()
	fmt.Println("-----------------")
	msg := <-ch // 主协程阻塞等待接收子协程发送的消息
	fmt.Println("主协程：接收消息", msg)
}
