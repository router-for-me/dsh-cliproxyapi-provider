# CLIProxyAPI Provider for DeepSeek Harness

[English](./README_EN.md) | 简体中文

为 DeepSeek Harness 添加一个基于 OpenAI Responses API 的 `CLIProxyAPI` 模型供应商。

插件会自动从 CLIProxyAPI 获取模型列表，无需手动添加或维护模型。

## 使用方式

安装插件：

```powershell
npx @deepseek-ai/dsh plugin --profile web add github:router-for-me/dsh-cliproxyapi-provider
```

启动或重启 DeepSeek Harness Web：

```powershell
npx @deepseek-ai/dsh web
```

打开 Harness 后：

1. 在侧边栏打开 **插件** 页面，并选择官方插件列表中的 **CLIProxyAPI**。
2. 填写 CLIProxyAPI 的 **Base URL**，例如
   `http://127.0.0.1:8317/v1`。
3. 填写 **API 密钥**；无鉴权服务可以留空。
4. 保存配置，模型列表会自动获取并定期刷新；如果模型目录的 `input_modalities` 声明了 `image`，图片输入能力会自动应用到对应型号。若 CLIProxyAPI 未提供此字段，能力按未知处理，不会臆测为支持图片。

卸载插件：

```powershell
npx @deepseek-ai/dsh plugin --profile web remove @router-for-me/dsh-cliproxyapi-provider
```

卸载后重启 DeepSeek Harness Web 即可。

## 兼容性

此版本面向 DeepSeek Harness `0.2.0-rc.2`。它通过 `plugins.item` 在侧边栏“插件”页面提供官方插件配置项，以 `configForms` 编辑 `llm-pi-ai` 实例配置，并通过 `ctx.remote` 管理凭据与远程模型发现。页面只在 Host 提供 `llm-pi-ai` 配置时显示；模型发现通过 `llm-pi-ai` 命名空间调用该供应商族的发现服务。安装或升级后请重启 Web 进程，使 DSH 载入新的客户端插件包。
