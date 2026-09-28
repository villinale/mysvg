# SVG Maker

本仓库将 SVG 文件和 Archify 图表发布到 GitHub Pages，供浏览器查看和 Notion 嵌入。

## 本地构建

需要 Node.js 18 或更新版本。在仓库根目录运行 node scripts/build-pages.mjs。

构建结果位于 dist/。构建过程会复制 public/、重新生成 dist/svg/manifest.json，并把 public/archify/sources/ 中的 JSON 渲染为 dist/archify/artifacts/ 中的 HTML。dist/ 是临时输出，无需提交。

新增 Archify 图表时，将源文件保存为 public/archify/sources/<名称>.<类型>.json。类型可以是 architecture、workflow、sequence、dataflow 或 lifecycle。JSON 中的 diagram_type 必须与文件名称一致。提交同一路径的新版本后，构建过程会覆盖对应的发布成品，网页地址保持不变。

## GitHub Pages

将本仓库推送到 GitHub 后，在仓库的 Settings → Pages → Build and deployment → Source 中选择 GitHub Actions。main 分支每次推送都会运行 .github/workflows/pages.yml；也可以在 Actions 页面手动运行。首次发布前需要把仓库文件提交并推送。当前本地仓库尚未配置 GitHub 远端。

假设仓库地址为 https://github.com/<用户>/<仓库>，页面地址为：

- 首页：https://<用户>.github.io/<仓库>/
- SVG 展示：https://<用户>.github.io/<仓库>/viewer.html?file=example.svg&embed=1
- Archify 示例：https://<用户>.github.io/<仓库>/archify/artifacts/web-app.architecture.html?embed=1

首页可以复制 Archify 图表的嵌入地址。把公开的 HTTPS 嵌入地址粘贴到 Notion 的 /embed 中。Notion 内的实际显示与更新速度仍需在首次部署后验证。

JSON 源文件位于 archify/sources/，生成的图表位于 archify/artifacts/。GitHub Pages 只托管静态文件；修改图表需要编辑 JSON 并提交到 GitHub。
