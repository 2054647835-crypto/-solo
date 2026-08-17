// ============================================================
//  简历「已发布内容」清单
//  部署后所有人可见。图片/视频已在 assets/ 下，路径登记如下。
//  注意：留空（"" 或 []）的槽位会保留原来的「点击上传」本地草稿功能。
// ============================================================
window.__MANIFEST__ = {
  // 头像：放一张图到 assets/ 下，把路径写在这里（如 "assets/avatar.jpg"）
  "avatar": "",

  // 作品槽：每个槽是一个数组，数组里每项是一张图/一个视频
  // 简单写法：直接写路径字符串
  // 进阶写法：{ "src": "路径", "title": "标题", "desc": "描述" }
  "slots": {
    "ai-video": [
      { "src": "assets/ai-video/13430901476358959.mp4", "title": "AI生成视频作品", "type": "video" }
    ],
    "ai-poster": [
      { "src": "assets/ai-poster/Untitled_13.png", "title": "AI海报设计 1" },
      { "src": "assets/ai-poster/Untitled_14.png", "title": "AI海报设计 2" },
      { "src": "assets/ai-poster/文字海报片版色5.jpg", "title": "AI海报设计 3" },
      { "src": "assets/ai-poster/文字海报片版色彩1.jpg", "title": "AI海报设计 4" },
      { "src": "assets/ai-poster/文字海报片版色彩3.jpg", "title": "AI海报设计 5" }
    ],
    "ai-kaogong": [
      { "src": "assets/ai-kaogong/微信图片_20260811134722_10_10.jpg", "title": "考公打卡小程序 · AI Agent开发" }
    ],
    "photo-wall": []             // → assets/photo-wall/（暂未上传）
  },

  // 外链作品：把 url 改成你的主页链接（留空 "" 则保持占位）
  "links": [
    { "name": "抖音",   "url": "", "icon": "🎵" },
    { "name": "小红书", "url": "", "icon": "📕" },
    { "name": "B站",    "url": "", "icon": "📺" },
    { "name": "视频号", "url": "", "icon": "💬" }
  ]
};
