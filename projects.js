// ============================================================
//  项目详情钻取层（projects.js）
//  与 manifest.js 平行，不碰 base64 黑盒。
//  作用：点击项目卡片 → 弹出全屏详情层，展示
//  描述 / 详述 / 我是怎么做的 / 能力维度分析(雷达图) / 作品集(媒体画廊)。
//  所有文案来自 content.js 的 window.__MANIFEST__.projects；
//  媒体来自 window.__MANIFEST__.slots；关闭时彻底停掉视频音频。
// ============================================================
(function () {
  "use strict";

  // ---------- 注入样式（一次）----------
  var style = document.createElement("style");
  style.textContent = [
    ".proj-view-btn{display:inline-block;margin-top:12px;padding:8px 16px;border:1px solid rgba(0,113,227,.45);",
    "border-radius:980px;background:rgba(0,113,227,.08);color:#0071e3;font-size:.85rem;font-weight:500;",
    "cursor:pointer;font-family:inherit;transition:background .2s}",
    ".proj-view-btn:hover{background:rgba(0,113,227,.16)}",
    ".proj-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;",
    "padding:40px 16px;overflow:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}",
    ".proj-overlay .proj-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px)}",
    ".proj-panel{position:relative;z-index:1;width:100%;max-width:940px;max-height:90vh;overflow:auto;",
    "background:#ffffff;color:#1d1d1f;border-radius:22px;padding:36px 36px 32px;box-shadow:0 30px 80px rgba(0,0,0,.4)}",
    ".proj-close{position:absolute;top:16px;right:16px;width:38px;height:38px;border:none;border-radius:50%;",
    "background:rgba(120,120,120,.15);color:#1d1d1f;font-size:22px;line-height:1;cursor:pointer;z-index:2}",
    ".proj-close:hover{background:rgba(120,120,120,.28)}",
    ".proj-head{margin:0 44px 6px 0}",
    ".proj-num{display:inline-block;font-size:.8rem;font-weight:700;color:#0071e3;letter-spacing:.1em}",
    ".proj-head h2{margin:6px 0 8px;font-size:1.7rem;font-weight:700;color:#1d1d1f;line-height:1.25}",
    ".proj-meta{display:flex;flex-wrap:wrap;gap:6px 16px;margin:4px 0 2px}",
    ".proj-role{font-size:.9rem;font-weight:600;color:#1d1d1f}",
    ".proj-time{font-size:.9rem;color:#86868b}",
    ".proj-body{padding-right:4px}",
    ".proj-desc{margin:10px 0 2px;color:#1d1d1f;font-size:1rem;line-height:1.75}",
    ".proj-section{margin-top:24px}",
    ".proj-section h4{margin:0 0 12px;font-size:.8rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#86868b}",
    ".proj-detail{margin:0;color:#424245;font-size:.96rem;line-height:1.78}",
    ".proj-story{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:16px}",
    ".proj-story li{display:flex;gap:14px;align-items:flex-start}",
    ".proj-step{flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:rgba(0,113,227,.1);",
    "color:#0071e3;font-size:.8rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}",
    ".proj-story strong{display:block;color:#1d1d1f;font-size:.96rem;margin-bottom:4px}",
    ".proj-story p{margin:0;color:#424245;font-size:.92rem;line-height:1.68}",
    ".proj-chart-sec{display:flex;flex-direction:column;align-items:center;text-align:center}",
    ".proj-chart-wrap{width:100%;display:flex;justify-content:center;padding:6px 0 2px}",
    ".proj-radar{max-width:320px;width:100%;height:auto}",
    ".proj-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}",
    ".proj-thumb{position:relative;aspect-ratio:4/3;border-radius:14px;overflow:hidden;cursor:zoom-in;background:#eee}",
    ".proj-thumb img,.proj-thumb video{width:100%;height:100%;object-fit:cover;display:block}",
    ".proj-thumb .play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",
    "font-size:34px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);pointer-events:none}",
    ".proj-cap{position:absolute;left:0;right:0;bottom:0;padding:8px 10px;font-size:.8rem;color:#fff;",
    "background:linear-gradient(transparent,rgba(0,0,0,.6))}",
    ".proj-empty{color:#6e6e73;font-size:.95rem;padding:24px 0}",
    ".proj-lb{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.9)}",
    ".proj-lb img,.proj-lb video{max-width:90vw;max-height:85vh;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)}",
    ".proj-lb .lb-close{position:absolute;top:20px;right:24px;color:#fff;font-size:32px;background:none;border:none;cursor:pointer}",
    "@media (max-width:560px){.proj-panel{padding:26px 18px 22px}.proj-head h2{font-size:1.4rem}}",
    ".card-work-thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:0}",
    "[data-project] .project-num,[data-project] .project-thumb-label{position:relative;z-index:1;text-shadow:0 1px 3px rgba(0,0,0,.45)}"
  ].join("");
  document.head.appendChild(style);

  function isVideo(src) { return /\.(mp4|webm|ogg|mov)$/i.test(src || ""); }
  function normalize(item) {
    if (typeof item === "string") item = { src: item };
    return {
      src: item.src || "",
      title: item.title || "",
      desc: item.desc || "",
      type: item.type || (isVideo(item.src) ? "video" : "image")
    };
  }
  function parseExternal(url){
    url = (url || "").trim();
    if(!url) return null;
    if(/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return { kind:"video", src:url };
    var bili = url.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i) || url.match(/[?&]bvid=(BV[0-9A-Za-z]+)/i);
    if(bili) return { kind:"iframe", src:"https://player.bilibili.com/player.html?bvid="+bili[1]+"&high_quality=1&autoplay=0&danmaku=0" };
    var yt = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i) || url.match(/youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/i);
    if(yt) return { kind:"iframe", src:"https://www.youtube.com/embed/"+yt[1] };
    return { kind:"link", src:url };
  }

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 去文件后缀：仅当整段文本是「文件名.扩展名」形态时剥离（不影响正常句子，如 "etc." 不会被误伤）
  function stripExtText(el) {
    // 弹层内的富 HTML 绝不能碰（否则会被拍平成纯文本），直接跳过
    if (el.closest && el.closest('.proj-overlay')) return;
    var t = (el.textContent || "").trim();
    var m = t.match(/^(\S+)\.([A-Za-z0-9]{2,5})$/);
    if (m) el.textContent = m[1];
  }
  function observeExtStrip() {
    var sel = '[class*="caption"],[class*="label"],[class*="tip"]';
    function walk(root) {
      if (!root || !root.querySelectorAll) return;
      // 弹层子树整体跳过，避免把作品集画廊拍平成文本
      if (root.closest && root.closest('.proj-overlay')) return;
      var nodes = root.querySelectorAll(sel);
      Array.prototype.forEach.call(nodes, function (n) { stripExtText(n); });
    }
    walk(document);
    if ("MutationObserver" in window) {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          // 弹层内的变动一律忽略
          if (m.target && m.target.closest && m.target.closest('.proj-overlay')) return;
          if (m.target && m.target.nodeType === 1) stripExtText(m.target);
          if (m.addedNodes) Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType === 1) walk(n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  var overlay, lb;

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "proj-overlay";
    overlay.innerHTML =
      '<div class="proj-backdrop"></div>' +
      '<div class="proj-panel"><button class="proj-close" aria-label="关闭">×</button>' +
      '<div class="proj-head"></div><div class="proj-body"></div>' +
      '<p class="proj-empty" style="display:none">该项目暂未上传作品。打开上传页 → 选「项目素材」→ 选对应项目即可添加。</p></div>';
    document.body.appendChild(overlay);

    lb = document.createElement("div");
    lb.className = "proj-lb";
    lb.innerHTML = '<button class="lb-close" aria-label="关闭">×</button><div class="lb-content"></div>';
    document.body.appendChild(lb);

    overlay.querySelector(".proj-close").addEventListener("click", closeOverlay);
    overlay.querySelector(".proj-backdrop").addEventListener("click", closeOverlay);
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeOverlay(); closeLb(); }
    });
  }

  // 停掉容器内所有 video 并释放 src（关掉弹层后音频不再残留）
  function stopVideosIn(root) {
    if (!root) return;
    root.querySelectorAll("video").forEach(function (v) {
      try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {}
    });
  }
  function closeLb() {
    if (!lb) return;
    stopVideosIn(lb);
    var c = lb.querySelector(".lb-content");
    if (c) c.innerHTML = ""; // 清空，下次打开重新创建，避免旧视频后台续播
    lb.style.display = "none";
  }
  function closeOverlay() {
    if (!overlay) return;
    stopVideosIn(overlay);
    overlay.style.display = "none";
    closeLb(); // 关主层时一并关灯箱，彻底停掉音频
  }

  // 手绘雷达图（零依赖，静态站最稳）
  function drawRadar(canvas, data, labels) {
    if (!canvas || !data || !data.length) return;
    var dpr = window.devicePixelRatio || 1;
    var size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    var cx = size / 2, cy = size / 2 + 4;
    var radius = 96;
    var n = data.length;
    var rings = 4;
    var i, ang, x, y, v;

    // 网格环
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (var r = 1; r <= rings; r++) {
      var rr = radius * r / rings;
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        ang = -Math.PI / 2 + i * 2 * Math.PI / n;
        x = cx + rr * Math.cos(ang);
        y = cy + rr * Math.sin(ang);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    // 轴线 + 标签
    ctx.fillStyle = "#6e6e73";
    ctx.font = "12px -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (i = 0; i < n; i++) {
      ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      x = cx + radius * Math.cos(ang);
      y = cy + radius * Math.sin(ang);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.stroke();
      var lx = cx + (radius + 20) * Math.cos(ang);
      var ly = cy + (radius + 16) * Math.sin(ang);
      ctx.fillText(labels[i], lx, ly);
    }
    // 数据多边形
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      v = Math.max(0, Math.min(100, data[i])) / 100;
      x = cx + radius * v * Math.cos(ang);
      y = cy + radius * v * Math.sin(ang);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(0,113,227,0.18)";
    ctx.fill();
    ctx.strokeStyle = "#0071e3";
    ctx.lineWidth = 2;
    ctx.stroke();
    // 顶点
    for (i = 0; i < n; i++) {
      ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      v = Math.max(0, Math.min(100, data[i])) / 100;
      x = cx + radius * v * Math.cos(ang);
      y = cy + radius * v * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#0071e3";
      ctx.fill();
    }
  }

  function thumbHtml(it) {
    if (it.type === "external") {
      var ex = parseExternal(it.src);
      var ic = (ex && ex.kind === "link") ? "🔗" : "▶";
      return '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0071e3,#42a5f5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:34px">' + ic + '</div>' +
        (it.title ? '<div class="proj-cap">' + escapeHtml(it.title) + "</div>" : "");
    } else if (it.type === "video") {
      return '<video muted preload="metadata" style="width:100%;height:100%;object-fit:cover">' +
        '<source src="' + it.src + '" type="video/mp4"></video>' +
        '<div class="play">▶</div>' +
        (it.title ? '<div class="proj-cap">' + escapeHtml(it.title) + "</div>" : "");
    }
    return '<img src="' + it.src + '" alt="' + escapeHtml(it.title) + '" style="width:100%;height:100%;object-fit:cover">' +
      (it.title ? '<div class="proj-cap">' + escapeHtml(it.title) + "</div>" : "");
  }

  function openProject(id) {
    if (!overlay) buildOverlay();
    closeLb(); // 打开新项目前，确保残留的灯箱视频已停

    var M = window.__MANIFEST__;
    var pj = (M && M.projects && M.projects[id]) || null;
    var card = document.querySelector('article.project-card[data-project="' + id + '"]');
    var h3 = card && card.querySelector(".project-body h3");
    var numEl = card && card.querySelector(".project-num");
    var title = h3 ? h3.textContent.trim() : ("项目" + id);
    var num = numEl ? numEl.textContent.trim() : ("0" + (+id + 1));

    // 头部
    var head = '<span class="proj-num">' + escapeHtml(num) + "</span>" +
      "<h2>" + escapeHtml(title) + "</h2>";
    if (pj && (pj.role || pj.time)) {
      head += '<div class="proj-meta">' +
        (pj.role ? '<span class="proj-role">' + escapeHtml(pj.role) + "</span>" : "") +
        (pj.time ? '<span class="proj-time">' + escapeHtml(pj.time) + "</span>" : "") +
        "</div>";
    }

    // 正文区块
    var body = "";
    if (pj && pj.desc) body += '<p class="proj-desc">' + escapeHtml(pj.desc) + "</p>";
    if (pj && pj.detail) body += '<div class="proj-section"><h4>项目详述</h4><p class="proj-detail">' + escapeHtml(pj.detail) + "</p></div>";
    if (pj && pj.story && pj.story.length) {
      body += '<div class="proj-section"><h4>我是怎么做的</h4><ul class="proj-story">';
      pj.story.forEach(function (s) {
        body += '<li><span class="proj-step">' + escapeHtml(s.step) + "</span><div><strong>" + escapeHtml(s.title) + "</strong><p>" + escapeHtml(s.desc) + "</p></div></li>";
      });
      body += "</ul></div>";
    }
    if (pj && pj.chartData && pj.chartData.length) {
      body += '<div class="proj-section proj-chart-sec"><h4>能力维度分析</h4><div class="proj-chart-wrap"><canvas class="proj-radar"></canvas></div></div>';
    }

    // 作品集（媒体画廊）
    var raw = (M && M.slots && M.slots["project-" + id]) || [];
    var items = raw.map(normalize);
    if (items.length) {
      body += '<div class="proj-section"><h4>作品集</h4><div class="proj-gallery">';
      items.forEach(function (it) {
        body += '<div class="proj-thumb">' + thumbHtml(it) + "</div>";
      });
      body += "</div></div>";
    }

    overlay.querySelector(".proj-head").innerHTML = head;
    overlay.querySelector(".proj-body").innerHTML = body;
    overlay.querySelector(".proj-empty").style.display = "none";

    // 绑定画廊点击放大
    var gal = overlay.querySelector(".proj-gallery");
    if (gal) {
      Array.prototype.forEach.call(gal.children, function (t, idx) {
        t.addEventListener("click", function () { openLb(items[idx]); });
      });
    }
    // 绘制雷达图（等 DOM 布局完成）
    var canvas = overlay.querySelector(".proj-radar");
    if (canvas && pj && pj.chartData) {
      setTimeout(function () { drawRadar(canvas, pj.chartData, pj.chartLabels || []); }, 60);
    }

    // 安全网：400ms 后若作品集被其他代码覆盖/丢失，用 createElement 重新注入
    if (items.length) {
      (function (itemsSnap) {
        setTimeout(function () {
          try {
            var gal = overlay.querySelector(".proj-gallery");
            var body = overlay.querySelector(".proj-body");
            if (gal && gal.querySelectorAll(".proj-thumb").length > 0) return;
            var sec = document.createElement("div");
            sec.className = "proj-section";
            var h = document.createElement("h4"); h.textContent = "作品集"; sec.appendChild(h);
            var g = document.createElement("div"); g.className = "proj-gallery";
            itemsSnap.forEach(function (it) {
              var t = document.createElement("div"); t.className = "proj-thumb";
              t.innerHTML = thumbHtml(it);
              t.addEventListener("click", function () { openLb(it); });
              g.appendChild(t);
            });
            sec.appendChild(g);
            if (body) body.appendChild(sec);
          } catch (e) { /* 安全网自身失败也吞掉，不影响主流程 */ }
        }, 400);
      })(items);
    }

    overlay.style.display = "flex";
  }

  // 灯箱图片缩放：Ctrl + 滚轮 放大/缩小，单击复位
  function enableZoom(img) {
    var scale = 1;
    img.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) return; // 仅 Ctrl+滚轮 触发缩放
      e.preventDefault();
      var delta = e.deltaY < 0 ? 0.12 : -0.12;
      scale = Math.min(5, Math.max(0.5, scale + delta));
      img.style.transform = "scale(" + scale + ")";
      img.style.cursor = scale > 1 ? "zoom-out" : "zoom-in";
    }, { passive: false });
    img.addEventListener("click", function () {
      if (scale > 1) { scale = 1; img.style.transform = "scale(1)"; img.style.cursor = "zoom-in"; }
    });
  }

  function openLb(it) {
    var c = lb.querySelector(".lb-content");
    c.innerHTML = "";
    if (it.type === "external") {
      var ex = parseExternal(it.src);
      if (!ex) { c.innerHTML = '<div style="color:#fff">链接无法识别</div>'; }
      else if (ex.kind === "video") { var v = document.createElement("video"); v.controls = true; v.autoplay = true; v.src = ex.src; v.style.cssText = "max-width:90vw;max-height:85vh;border-radius:14px"; c.appendChild(v); }
      else if (ex.kind === "iframe") { var f = document.createElement("iframe"); f.src = ex.src; f.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media"; f.allowFullscreen = true; f.style.cssText = "width:90vw;max-width:960px;height:56.25vw;max-height:85vh;border:0;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5);background:#000"; c.appendChild(f); }
      else { var a = document.createElement("a"); a.href = ex.src; a.target = "_blank"; a.rel = "noopener"; a.textContent = "▶ 在新窗口播放 / 打开链接"; a.style.cssText = "display:inline-block;padding:16px 24px;background:#0071e3;color:#fff;border-radius:12px;text-decoration:none;font-weight:500"; c.appendChild(a); }
    } else if (it.type === "video") {
      var v2 = document.createElement("video"); v2.controls = true; v2.autoplay = true; v2.src = it.src; v2.style.cssText = "max-width:90vw;max-height:85vh;border-radius:14px"; c.appendChild(v2);
    } else {
      var im = document.createElement("img"); im.src = it.src; im.alt = it.title || "";
      im.style.cssText = "max-width:90vw;max-height:85vh;border-radius:14px;transform-origin:center center;transition:transform .08s ease-out;cursor:zoom-in";
      c.appendChild(im);
      enableZoom(im);
    }
    lb.style.display = "flex";
  }

  function injectButtons() {
    var cards = document.querySelectorAll("article.project-card[data-project]");
    Array.prototype.forEach.call(cards, function (card) {
      if (card.querySelector(".proj-view-btn")) return;
      var id = card.getAttribute("data-project");
      var links = card.querySelector(".project-links") || card.querySelector(".project-body");
      if (!links) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "proj-view-btn";
      btn.textContent = "查看完整项目 →";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        openProject(id);
      });
      links.appendChild(btn);
    });
  }

  function paintCardThumbs() {
    var M = window.__MANIFEST__;
    if (!M || !M.slots) return;
    var cards = document.querySelectorAll('article.project-card[data-project]');
    Array.prototype.forEach.call(cards, function (card) {
      var id = card.getAttribute('data-project');
      var items = (M.slots && M.slots["project-" + id]) || [];
      var first = null;
      for (var i = 0; i < items.length; i++) {
        var s = (items[i].src || "").toLowerCase();
        if (items[i].type === "video" || /\.(mp4|webm|ogg|mov)(\?|$)/.test(s)) continue;
        first = items[i]; break;
      }
      if (!first || !first.src) return;
      var thumb = card.querySelector(".project-thumb");
      if (!thumb || thumb.querySelector("img.card-work-thumb")) return;
      var img = document.createElement("img");
      img.className = "card-work-thumb";
      img.src = first.src;
      img.alt = first.title || "";
      img.loading = "eager";
      thumb.appendChild(img);
    });
  }

  function init() {
    observeExtStrip();
    injectButtons();
    paintCardThumbs();
    var grid = document.getElementById("projectsGrid");
    var proj = document.getElementById("page-projects");

    // 点击项目卡：直接打开钻取层（document 级 capture，抢在黑盒之前）
    // 边界用 document.body 而非 #projectsGrid：黑盒可能把卡片移出 grid 容器，
    // 用 grid 作边界会"找不卡片"而放行黑盒旧弹层（数据优化/VI设计曾因此中招）。
    function onCardClick(e) {
      var el = e.target;
      var card = null;
      while (el && el !== document.body) {
        if (el.classList && el.classList.contains("project-card")) { card = el; break; }
        el = el.parentNode;
      }
      if (!card) return;
      var id = card.getAttribute("data-project");
      if (id == null) return;
      e.stopPropagation();
      e.preventDefault();
      openProject(id);
    }
    document.addEventListener("click", onCardClick, true); // capture，全文档拦截项目卡

    // 黑盒可能重渲染卡片（childList）或切换显隐（class）→ 重新注入按钮
    if (proj && "MutationObserver" in window) {
      new MutationObserver(function () { injectButtons(); }).observe(proj, {
        childList: true, subtree: true, attributes: true, attributeFilter: ["class"]
      });
    }
    // 多重兜底，压过黑盒的初次 / 延迟渲染
    [120, 400, 900, 1600].forEach(function (t) { setTimeout(injectButtons, t); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
