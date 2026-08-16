# 张涵 · 个人简历网页

苹果风格的单页个人简历（内容创作 / AI 数据分析方向），纯静态、零后端依赖。

## 本地预览
```bash
cd 本目录
python -m http.server 8145
# 浏览器打开 http://127.0.0.1:8145/index.html
```
也可以直接双击 `index.html` 用浏览器打开（本地上传功能依赖浏览器，已发布内容靠 content.js）。

## 目录结构
```
index.html      # 页面主体
content.js      # 「已发布内容」清单（头像 / 作品 / 外链），部署后所有人可见
manifest.js     # 读取 content.js 并渲染到页面（自带查看灯箱）
assets/         # 照片、作品文件存放处（见 assets/README.md）
```

## 怎么添加「要给别人看」的作品
1. 把图片/视频放进 `assets/` 下对应子文件夹（头像放 `assets/avatar.jpg`）。
2. 编辑 `content.js`：把路径填进对应槽位数组，外链填进 `links` 的 `url`。
3. `git add` + `commit`，部署后别人打开链接即可看到。

> 留空的槽位仍保留「点击上传」的本地草稿功能（仅自己这台浏览器可见，存浏览器本地）。

## 内容来源说明
- **已发布内容**（content.js + assets）：跟随仓库走，部署后所有人可见。
- **本地草稿**（浏览器 IndexedDB）：仅当前设备当前浏览器可见，适合自己先试传、满意后再落到 assets 发布。

## 部署（拿到可分享的公网链接）
可选方案：GitHub Pages、CloudStudio 静态托管、Vercel / Netlify 等。
部署时只需把本仓库（含 index.html / content.js / manifest.js / assets/）整体发布即可。
