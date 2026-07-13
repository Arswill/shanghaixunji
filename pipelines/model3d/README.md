# 混元3D 批量生成神兽模型

使用腾讯混元生3D专业版 API，将 7 只核心神兽的 FLUX 图片批量转换为 LowPoly GLB 模型。

## 原理

调用腾讯云混元生3D API（`SubmitHunyuanTo3DProJob`），采用图生3D + LowPoly 拓扑 + PBR 材质模式，自动返回 GLB 格式并下载到 `apps/web/public/assets/models/`。

脚本零 SDK 依赖，直接用 `requests` + TC3-HMAC-SHA256 签名调用云 API，无需安装腾讯云 SDK。

```
源图片 (JPG) → base64 编码 → 提交生3D任务 → 轮询状态 → 下载 GLB
```

## 前置条件

### 1. 开通服务

1. 登录 [腾讯混元生3D 控制台](https://console.cloud.tencent.com/ai3d)
2. 阅读服务协议，点击「开通」

> 你在 3d.hunyuan.tencent.com 的注册账号与腾讯云账号通用，登录后开通即可。

### 2. 获取 API 密钥

1. 访问 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 创建密钥，记录 `SecretId` 和 `SecretKey`
3. 如果是子账号，需主账号授权策略 `QcloudAI3DFullAccess`

### 3. 安装依赖

```bash
pip install -r pipelines/model3d/requirements.txt
# 仅需 requests，大多数环境已预装

## 使用方法

### 步骤 1：检查环境

```powershell
python pipelines/model3d/generate_models.py --check
```

确认 7 张源图片就绪、密钥已配置。

### 步骤 2：配置密钥

```powershell
# PowerShell
$env:TENCENTCLOUD_SECRET_ID='你的SecretId'
$env:TENCENTCLOUD_SECRET_KEY='你的SecretKey'
```

### 步骤 3：批量生成

```powershell
python pipelines/model3d/generate_models.py
```

脚本会：
- 并发提交 3 个任务（API 默认 3 并发）
- 每个任务自动轮询直到完成
- 下载 GLB 到 `apps/web/public/assets/models/{creature-id}.glb`
- 输出汇总报告 + JSON 报告

### 可选：只生成部分神兽

```powershell
python pipelines/model3d/generate_models.py --only jiu-wei-hu,ying-long
```

### 断点续传

已生成的 GLB 文件会自动跳过，直接重新运行即可续传失败的神兽。

## 生成参数

| 参数 | 值 | 说明 |
|------|-----|------|
| Model | 3.0 | 支持 LowPoly 模式 |
| GenerateType | LowPoly | 智能拓扑，面数自动精简 |
| PolygonType | triangle | 三角面网格 |
| EnablePBR | true | PBR 材质 |
| 并发数 | 3 | API 默认上限 |

## 7 只核心神兽

| 优先级 | ID | 名称 | 源图片 |
|--------|-----|------|--------|
| 1 | jiu-wei-hu | 九尾狐 | images/jiu-wei-hu.jpg |
| 2 | ying-long | 应龙 | images/ying-long.jpg |
| 3 | qi-lin | 麒麟 | images/qi-lin.jpg |
| 4 | zhu-que | 朱雀 | images/zhu-que.jpg |
| 5 | bi-fang | 毕方 | images/bi-fang.jpg |
| 6 | kun-peng | 鲲鹏 | images/kun-peng.jpg |
| 7 | tao-tie | 饕餮 | images/tao-tie.jpg |

## 完成标准

- 7 只 GLB 文件全部生成
- 文件大小平均 < 5MB（超过 10MB 会警告，可用 Blender 简化）
- 在 R3F 中 test-load 通过

## Tripo3D 补充

如果某只神兽效果不理想，可在 [Tripo3D](https://www.tripo3d.ai) 用多视角图片重新生成，手动放入 models 目录覆盖即可。

## 模型精修（可选）

用 Blender 打开 GLB：
- 简化网格（Decimate Modifier）
- 调整 PBR 材质参数
- 检查 UV 贴图
- 导出时选择 glTF 2.0 (.glb) 格式
