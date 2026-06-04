// url + method + http 版本号 请求行
const endpoint = 'https://api.deepseek.com/chat/completions'
// headers 请求头
const headers = {
  'Content-Type': 'application/json',
  // api key通过Authorization头传递
  'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY,
}
// body 请求体
const payload = {
  model: 'deepseek-v4-flash',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant'
    },
    {
      role: 'user',
      content: '你好',
    },
  ],
}

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),// 因为只能传递字符串，所以需要转换为字符串(反序列化)
  })
  const data = await response.json()
  document.querySelector('#result').innerHTML = data.choices[0].message.content
  console.log(data)
} catch (error) {
  console.log(error)
}