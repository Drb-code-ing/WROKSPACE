# Model Scope
  魔搭 前辈是Hugging Face(抱抱脸)
  Hugging Face 是全球最大的开源 AI 社区，拥有数十万预训练模型、海量数据集和 Spaces 应用平台，
  支持 PyTorch、TensorFlow、JAX 等框架，让开发者轻松分享、协作和部署机器学习模型。
  - model
    开源大模型平台，训练及发布自己的大模型
  - scope
    社区

# 它提供:
## 1.数据服务

## 2.Note Book
  如果我们有NLP 实验，算法，python
  note book 随时编写，随时运行

  python 优点 简洁 适合数学计算，NLP，AI，爬虫
  - JS 不太适合数学计算
    Web 前端脚本，交互(幻灯片，滚动加载更多)，用户体验
    JS 数据类型比较单一
  人生苦短，我用python

  for i in range(n):
    r.append(L[i])
  ":" 冒号告诉 Python "接下来是一个代码块"，配合缩进来确定代码块的范围。

## LLM api 调用
  - 安装 openai sdk
  - 实例化 client
      api_key = "sk-"
      base_url
      都遵守 openai api 规范
  - client.chat.completions.create(
      model="",
      messages=[
        {"role": "user", "content": " "}
      ]
    )

    AIGC 文本生成接口

## Prompt 高级设计模式
  - 详细且准确的指令
  - 一步步去引导llm 工作
  - 对返回结果的格式做约束
      json 格式
      html 格式
    清晰正确 适合接下来继续运行