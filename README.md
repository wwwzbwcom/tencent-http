[![Serverless HTTP Tencent Cloud](https://img.serverlesscloud.cn/20191226/1577361724216-http_width.png)](http://serverless.com)

# 腾讯云 HTTP 组件

简体中文 | [English](https://github.com/serverless-components/tencent-http/tree/master/README.en.md)

## 简介

使用腾讯云 HTTP 组件，可在不修改，不侵入用户代码的情况下，快速的在腾讯云创建，配置和管理一个任意一个语言，框架编写的 HTTP 服务。

组件启动后，会执行入口文件，启动 HTTP 服务。并将 API 网关的请求转发到 `APP_PORT` 环境变量的端口（未配置情况下为 `18888` 端口）。该组建用户只需按正常方式编写应用逻辑，并为组件设置应用入口（或在入口文件处启动应用），即可完成应用的 `serverless` 化改造。

## 目录

1. [安装](#1-安装)
2. [创建](#2-创建)
3. [配置](#3-配置)
4. [部署](#4-部署)
5. [移除](#5-移除)

### 1. 安装

通过 npm 全局安装 [serverless cli](https://github.com/serverless/serverless)

```bash
$ npm install -g serverless
```

### 2. 创建

通过如下命令和模板链接，快速创建一个 http 应用：

```bash
$ serverless init http-starter --name example
$ cd example
```

### 3. 部署

在 `serverless.yml` 文件所在的项目根目录，运行以下指令，将会弹出二维码，直接扫码授权进行部署：

```
serverless deploy
```

> **说明**：如果鉴权失败，请参考 [权限配置](https://cloud.tencent.com/document/product/1154/43006) 进行授权。

部署完成后，控制台会打印相关的输出信息，您可以通过 `${output:${stage}:${app}:apigw.url}` 的形式在其他 `serverless` 组件中引用该组件的 API 网关访问链接（或通过类似的形式引用该组建其他输出结果），具体的，可以查看完成的输出文档：

- [点击此处查看输出文档](https://github.com/serverless-components/tencent-http/tree/master/docs/output.md)

### 4. 配置

HTTP 组件支持 0 配置部署，也就是可以直接通过配置文件中的默认值进行部署。但你依然可以修改更多可选配置来进一步开发该 HTTP 项目。

默认情况下，组件的入口文件是 `sls.js`，监听端口是 `18888`。也就是说，服务部署后会启动 `sls.js` 的文件，并将请求转发到 `18888` 端口，用户在入口文件中启动 HTTP 服务器，并监听响应端口，即可处理请求。

以下是 HTTP 组件的 `serverless.yml`配置示例：

```yml
# serverless.yml

org: http-demo
app: http-demo
stage: dev
component: http@dev
name: http-demo

inputs:
  entryFile: index.js # 代码入口文件，可以为 node.js 文件或者为任意二进制文件
  src:
    src: ./
    exclude:
      - .env
  region: ap-guangzhou
  runtime: Nodejs10.15
  apigatewayConf:
    protocols:
      - http
      - https
    environment: release
```

- [点击此处查看配置文档](https://github.com/serverless-components/tencent-http/tree/master/docs/output.md)

### 5. 移除

通过以下命令移除部署的 HTTP 服务。

```
$ serverless remove
```

### 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```bash
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API 密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

### 常见问题与解答

- 除 Node.js 外，Java / Python / PHP 等需要运行时的环境的程序无法直接运行：
  该组件基于 Node.js 运行时，只能直接运行二进制程序或 Node.js 程序，需要其他运行时的程序可以打包为二进制，或在入口中进行环境的安装。

### 还支持哪些组件？

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。

## License

MIT License

Copyright (c) 2020 Tencent Cloud, Inc.
