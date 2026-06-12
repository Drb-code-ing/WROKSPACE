const apiKey = import.meta.env.VITE_QWEN_API_KEY;
const root = document.querySelector('#app');

const generateImage = async () => {
  const res = await fetch(
    '/api/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        "model": "qwen-image-2.0-pro",
        "input": {
          "messages": [
            { "role": "user", "content": [
              {
                "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/thtclx/input1.png"
              },
              {
                "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/iclsnx/input2.png"
              },
              {
                "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/gborgw/input3.png"
              },
              {
                "text": "图1的女生穿着图2中的黑色裙子按图3的姿势坐下"
              }
            ]}
          ]
        },
        "parameters": {
          "n": 1,
          "size": "1024*1536"
        }
      })
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error('请求失败:', res.status, errText)
    throw new Error(`HTTP ${res.status}: ${errText}`)
  }

  const data = await res.json()
  console.log('响应:', data)
  return data.output?.choices?.[0]?.message?.content?.[0]?.image
}

const renderImage = (imageUrl) => {
  root.innerHTML = `<img src="${imageUrl}" />`
}

const main = async () => {
  const imageUrl = await generateImage()
  renderImage(imageUrl)
}
main()
