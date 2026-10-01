# SVG Maker

本仓库把 SVG 文件和 Archify 图表发布到 GitHub Pages，供浏览器查看和 Notion 嵌入。

## 本地构建

需要 Node.js 18 或更新版本，以及 `curl`。Windows 使用系统自带的 `tar` 解压；Linux 和 macOS 需要 `unzip`。在仓库根目录运行 `node scripts/build-pages.mjs`。

构建过程会下载 [Archify 官方发布包](https://github.com/tt-a1i/archify/releases)，验证 SHA-256 校验值，并将其保存在 `.cache/archify/`。当前固定使用 2.16.0，因为示例图表使用的 `meta.views` 功能在 Archify 3.0 中已移除。Archify 源代码无需复制进本仓库。

构建结果位于 `dist/`。构建过程会复制 `public/`、重新生成 `dist/svg/manifest.json`，并把 `public/archify/sources/` 中的 JSON 渲染为 `dist/archify/artifacts/` 中的 HTML。`dist/` 和 `.cache/` 均无需提交。

新增 Archify 图表时，将源文件保存为 `public/archify/sources/<名称>.<类型>.json`。类型可以是 `architecture`、`workflow`、`sequence`、`dataflow` 或 `lifecycle`。JSON 中的 `diagram_type` 必须与文件名称一致。提交同一路径的新版本后，构建过程会覆盖对应的发布成品，网页地址保持不变。

更新 Archify 版本时，修改 `config/archify-release.json` 中的版本号和官方发布包的 SHA-256 校验值，然后运行本地构建，检查现有图表的展示效果，再提交修改。版本号固定后，上游仓库的日常修改不会改变本仓库的构建结果。

## GitHub Pages

在仓库的 Settings → Pages → Build and deployment → Source 中选择 GitHub Actions。推送到 `main` 分支后，`.github/workflows/pages.yml` 会自动构建并发布；也可以在 Actions 页面手动运行。

本仓库的页面地址：

- 首页：<https://villinale.github.io/mysvg/>
- SVG 展示：<https://villinale.github.io/mysvg/viewer.html?file=example.svg&embed=1>
- Archify 示例：<https://villinale.github.io/mysvg/archify/artifacts/web-app.architecture.html?embed=1>

首页可以复制 Archify 图表的嵌入地址。将公开的 HTTPS 嵌入地址粘贴到 Notion 的 `/embed` 中。Notion 内的实际显示与更新速度仍需在部署后验证。

JSON 源文件位于 `public/archify/sources/`，生成的图表位于 `dist/archify/artifacts/`。修改图表时，编辑 JSON 并提交到 GitHub。
