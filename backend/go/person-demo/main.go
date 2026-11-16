// go 没有类  struct 结构体 定义属性 方法
package main

import "fmt"

// struct + method 模拟class
type Person struct {
	Name string
	Age  int
}

// 构造函数
func NewPerson(name string, age int) *Person {
	// 取址符
	return &Person{
		Name: name,
		Age:  age,
	}
}

// Person 实例方法
func (p *Person) SayHello() {
	fmt.Println("我是", p.Name, "我今年", p.Age, "岁")
}

func main() {
	p1 := NewPerson("张三", 18)
	p1.SayHello()

	p2 := &Person{
		Name: "李四",
		Age:  20,
	}
	p2.SayHello()
}
