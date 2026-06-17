import clint from "./clint.mjs";

// 申明有哪些tools 
// 告诉llm, 推理的时候，交给某个工具就可以
// 准确
// 要办的手续， 如何让llm 准确的使用工具
const tools = [
    {
        type: "function", // tool 专门格式 就是函数

        function: {
            name: "get_closing_price",
            // llm 理解tool功能的， 详细具体
            // 能不能准确使用tool 的核心
            description: "获取指定股票的收盘价",
            parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    // nlp 
                    description: "股票名称"
                  }  
                },
                required: ["name"]
            }
        }
    }
];
// 具体tool 函数
function get_closing_price(name) {
    if (name === '青岛啤酒') return "67.92";
    if (name === '贵州茅台') return "1488.21";
    return "未找到股票";
}

const send_message = async (messages) => {
    return await clint.chat.completions.create({
        model: 'deepseek-v4-flash',
        messages,
        tools,
        tool_choice: 'auto'
    })
}

const main = async () => {
    let messages = [
        { role: 'user', content: "青岛啤酒的收盘价是多少？"}
    ];

    const response = await send_message(messages);
    const message = response.choices[0].message;
    console.log(message);
}
main();