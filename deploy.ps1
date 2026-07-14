# 山海寻迹 - Cloudflare Pages 一键部署脚本
# 使用方法：在 PowerShell 中运行此脚本
#
# 前置条件：
#   1. 已安装 Node.js 18+
#   2. 已安装 wrangler：npm install -g wrangler
#   3. 已有 Cloudflare 账号
#
# 首次运行会打开浏览器进行授权登录

param(
    [string]$ProjectName = "shanghaixunji",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "===== 山海寻迹 Cloudflare Pages 部署 =====" -ForegroundColor Cyan
Write-Host ""

# Step 1: 检查 wrangler
Write-Host "[1/5] 检查 wrangler..." -ForegroundColor Yellow
$wranglerVersion = npx wrangler --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  安装 wrangler..." -ForegroundColor Yellow
    npm install -g wrangler
}
Write-Host "  wrangler 版本: $wranglerVersion" -ForegroundColor Green

# Step 2: 登录 Cloudflare（首次需要）
Write-Host ""
Write-Host "[2/5] 检查 Cloudflare 认证..." -ForegroundColor Yellow
$env:CF_API_TOKEN = $env:CLOUDFLARE_API_TOKEN
if (-not $env:CF_API_TOKEN) {
    Write-Host "  未检测到 API Token，启动交互式登录..." -ForegroundColor Yellow
    Write-Host "  浏览器将打开授权页面，请完成授权..." -ForegroundColor Yellow
    npx wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  登录失败，请重试或手动设置 CLOUDFLARE_API_TOKEN 环境变量" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  认证成功" -ForegroundColor Green

# Step 3: 构建前端
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[3/5] 构建前端..." -ForegroundColor Yellow
    Push-Location "apps\web"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  构建失败" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "  构建成功" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[3/5] 跳过构建（使用已有 dist 目录）" -ForegroundColor Yellow
}

# Step 4: 配置环境变量
Write-Host ""
Write-Host "[4/5] 配置环境变量..." -ForegroundColor Yellow
Write-Host "  需要设置以下密钥（首次部署后通过 Dashboard 设置）：" -ForegroundColor Yellow
Write-Host "  - MIMO_API_KEY: 小米 MiMo API 密钥" -ForegroundColor White
Write-Host "  - DEEPSEEK_API_KEY: DeepSeek API 密钥（可选）" -ForegroundColor White
Write-Host "  - DASHSCOPE_API_KEY: 通义千问 API 密钥（可选）" -ForegroundColor White
Write-Host ""
Write-Host "  设置方式：" -ForegroundColor Yellow
Write-Host "  npx wrangler pages secret put MIMO_API_KEY --project-name=$ProjectName" -ForegroundColor White
Write-Host ""

# Step 5: 部署
Write-Host "[5/5] 部署到 Cloudflare Pages..." -ForegroundColor Yellow
Push-Location "apps\web"
npx wrangler pages deploy dist --project-name=$ProjectName
$deployExitCode = $LASTEXITCODE
Pop-Location

if ($deployExitCode -eq 0) {
    Write-Host ""
    Write-Host "===== 部署成功 =====" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "  1. 设置 API 密钥：npx wrangler pages secret put MIMO_API_KEY --project-name=$ProjectName" -ForegroundColor White
    Write-Host "  2. 访问部署地址验证功能" -ForegroundColor White
    Write-Host "  3. （可选）绑定自定义域名以获得更好的国内访问体验" -ForegroundColor White
    Write-Host ""
    Write-Host "部署指南详见：docs/cloudflare-deploy.md" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "===== 部署失败 =====" -ForegroundColor Red
    Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
    exit 1
}
