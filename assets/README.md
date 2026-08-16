# assets 资源目录

把要展示的照片、作品放进这里对应的子文件夹，然后在项目根目录的 `content.js` 里登记路径即可。
部署后，所有打开这个链接的人都能看到这些内容（不再依赖浏览器本地存储）。

```
assets/
├── avatar.jpg          # 头像（可选，路径填到 content.js 的 avatar）
├── ai-video/           # AI 视频作品
├── ai-poster/          # AI 海报设计
├── ai-kaogong/         # 考公打卡小程序截图
└── photo-wall/         # 个人生活照墙
```

## 使用步骤
1. 把文件放进对应子文件夹（建议用短文件名，如 `1.jpg`、`demo.mp4`）。
2. 打开根目录的 `content.js`，在对应槽位的数组里写上路径，例如：
   ```js
   "ai-poster": [ "assets/ai-poster/1.jpg", "assets/ai-poster/2.jpg" ],
   "photo-wall": [ { "src": "assets/photo-wall/me1.jpg", "title": "旅行", "desc": "2025 青海" } ],
   ```
3. `git add` 并 `commit`，部署后生效。

支持的图片格式：jpg / png / webp / gif；视频：mp4 / webm。
