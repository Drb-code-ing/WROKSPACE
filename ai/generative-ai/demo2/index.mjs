import dotenv from 'dotenv'
dotenv.config()

async function generateImage() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  // 没有用openai
  // 本质上就是一次http请求
  // fetch 发送请求
  const res = await fetch(
    // 文本生成
    // api地址 多模态的api 服务 生成图片
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      // 请求体
      body: JSON.stringify({
        // 模型
        "model": 'qwen-image-2.0-pro',
        "input": {
          "message": [
            {
              "role": "user",
              "content": [
                {"image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/thtclx/input1.png"},
                { "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/iclsnx/input2.png" },
                { "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/gborgw/input3.png" },
                { "text": "图1中的女生穿着图2中的黑色裙子按图3的姿势坐下"}
              ]
            }
          ]
        }
      })
    }
  )
}