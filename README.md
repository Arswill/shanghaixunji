# 山海寻迹（ShanHaiXunji）

基于地理位置的《山海经》神兽探索与收集 Web 应用，参赛作品。

## 核心体验

- **山海地图**：34 个省级行政区点击探索，按卷册设色，节气限时神兽出没。
- **神兽图鉴**：104 只神兽、原文/译文/考证/关系网络，随进化阶段逐步解锁。
- **AI 对话**：每只神兽拥有独立人格与羁绊记忆，支持古风中文对话。
- **羁绊养成**：交谈、赠礼、相遇提升羁绊等级，解锁专属内容与分享图。
- **家乡守护神**：基于浏览器定位匹配省份，抽取并持久化专属守护神。
- **山海见闻录**：自动生成古卷式探险手记与分享卡片。

## 技术栈

- React 19 + TypeScript + Vite 7 + Tailwind CSS 3.4
- Zustand（状态管理，localStorage 持久化）
- D3.js Canvas（34 省交互地图）
- Three.js + R3F（3D 神兽模型展示）
- GSAP（动画引擎）
- Zod（数据验证）
- AI 大语言模型（多供应商自动降级，Vercel Serverless Function 代理）
- AI 语音合成（34 省方言全覆盖）
- Vitest + React Testing Library

## 本地运行

```bash
cd apps/web
cp ../../.env.example .env.local
# 填入 AI API Key（详见 .env.example）
npm install
npm run dev
```

应用默认运行在 http://localhost:5173。

## 环境变量

| 变量 | 说明 |
|------|------|
| `LLM_API_KEY` | AI 大语言模型 API Key |
| `TTS_API_KEY` | AI 语音合成 API Key（方言 TTS） |
| `IMAGE_API_TOKEN` | AI 图像生成 Token |

详见 `.env.example`。

## 资源管线

项目包含 Python 资源管线（`pipelines/`），负责神兽数据提取、AI 生图、方言 TTS 与 manifest 构建。

### AI 生图管线（`pipelines/image/generate_creature_art.py`）

生图管线基于 AI 图像生成模型 + 自定义 LoRA 以生成统一的山海经暗黑奇幻画风。

> 该 LoRA 权重文件不随仓库分发，需自行准备并上传后才能运行生图管线。

1. **训练/获取 LoRA**：基于 FLUX-1.1-dev 微调，建议 800–2000 步，数据集为山海经神兽暗黑奇幻风格插图。
2. **上传至 Replicate**：访问 https://replicate.com/create 创建私有模型，或通过 Replicate 的 LoRA 挂载机制加载已托管权重。
3. **更新引用**：将 `generate_creature_art.py` 中 `generate_one` 的 `input["lora"]` 字段替换为 `"你的用户名/模型名:版本号"` 格式的访问标识，或指向已上传的 safetensors 权重 URI。
4. **无 LoRA 降级**：若暂无 LoRA，可移除 `input` 中的 `"lora"` 字段，管线将退回 FLUX 原生画风。

生图输出格式为 `.jpg`，与实际图片资产（`assets/images/*.jpg`）保持一致。

### 方言 TTS 管线（`pipelines/tts/generate_tts.py`）

基于 AI 语音合成 API 进行方言语音合成。方言差异由 `dialect_map.json` 中的指令前缀驱动，覆盖全部 34 个省级行政区。

## 测试

```bash
cd apps/web
npm run test        # Vitest 前端测试
npx tsc --noEmit    # TypeScript 类型检查
npm run build       # 生产构建
```

```bash
# 各管线独立安装依赖（根目录无统一 requirements.txt）
pip install -r pipelines/extract/requirements.txt    # 数据提取
pip install -r pipelines/image/requirements.txt       # AI 生图
pip install -r pipelines/tts/requirements.txt         # 方言 TTS
pip install -r pipelines/manifest/requirements.txt    # manifest 构建
pytest pipelines/  # Python 管线测试
```

## 部署

项目配置为 Vercel 部署。根目录 `vercel.json` 指定 `apps/web` 为构建入口，`api/` 为 Serverless Function 目录。

```bash
vercel --prod
```

## 许可证

MIT
