const encoder = new TextEncoder();
// 字符串转Uint8Array二进制
const bytes = encoder.encode("你好");
console.log(bytes);
// 0-255 编码 你好 <-> 编码 128 129 <-> 二进制
const decoder = new TextDecoder();
console.log(decoder.decode(bytes));
// 你好