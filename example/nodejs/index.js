'use strict';
const http = require('http');

const PORT = process.env.SLS_PORT ? process.env.SLS_PORT : 18888;

http
  .createServer((request, response) => {
    // 发送 HTTP 头部
    // HTTP 状态值: 200 : OK
    // 内容类型: text/plain
    response.writeHead(200, { 'Content-Type': 'text/plain' });

    // 发送响应数据 "Hello World"
    response.end('Hello World From Node.js Example\n');
  })
  .listen(PORT, 'localhost');

// 终端打印如下信息
// eslint-disable-next-line no-console
console.log(`Server running at http://127.0.0.1:${PORT}/`);
