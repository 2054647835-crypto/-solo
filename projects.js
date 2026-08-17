// ============================================================
//  项目详情钻取层（projects.js）
//  与 manifest.js 平行，不碰 base64 黑盒。
//  作用：在每个项目卡片注入「查看项目作品 →」按钮，点击后弹出
//  全屏详情层，只展示该项目的视频/截图（从 content.js 读取）。
//  主页保持极简，点进去才展开——渐进式披露。
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
    ".proj-panel{position:relative;z-index:1;width:100%;max-width:920px;max-height:88vh;overflow:auto;",
    "background:#ffffff;color:#1d1d1f;border-radius:20px;padding:32px;box-shadow:0 30px 80px rgba(0,0,0,.4)}",
    ".proj-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;border-radius:50%;",
    "background:rgba(120,120,120,.15);color:#1d1d1f;font-size:20px;line-height:1;cursor:pointer}",
    ".proj-head{margin:0 40px 20px 0}",
    ".proj-num{display:inline-block;font-size:.8rem;font-weight:700;color:#0071e3;letter-spacing:.1em}",
    ".proj-head h2{margin:6px 0 8px;font-size:1.6rem;font-weight:700;color:#1d1d1f}",
    ".proj-head p{margin:0;color:#6e6e73;font-size:.95rem;line-height:1.6;max-width:60ch}",
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
    ".proj-lb .lb-close{position:absolute;top:20px;right:24px;color:#fff;font-size:32px;background:none;border:none;cursor:pointer}"
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

  var overlay, lb;

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "proj-overlay";
    overlay.innerHTML =
      '<div class="proj-backdrop"></div>' +
      '<div class="proj-panel"><button class="proj-close" aria-label="关闭">×</button>' +
      '<div class="proj-head"></div><div class="proj-gallery"></div>' +
      '<p class="proj-empty" style="display:none">该项目暂未上传作品。打开上传页 → 选「项目素材」→ 选对应项目即可添加。</p></div>';
    document.body.appendChild(overlay);

    lb = document.createElement("div");
    lb.className = "proj-lb";
    lb.innerHTML = '<button class="lb-close" aria-label="关闭">×</button><div class="lb-content"></div>';
    document.body.appendChild(lb);

    overlay.querySelector(".proj-close").addEventListener("click", closeOverlay);
    overlay.querySelector(".proj-backdrop").addEventListener("click", closeOverlay);
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.style.display = "none"; });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.style.display = "none"; });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeOverlay(); lb.style.display = "none"; }
    });
  }

  function closeOverlay() { if (overlay) overlay.style.display = "none"; }

  function openProject(id, title, num, desc) {
    if (!overlay) buildOverlay();
    overlay.querySelector(".proj-head").innerHTML =
      '<span class="proj-num">' + escapeHtml(num) + "</span>" +
      "<h2>" + escapeHtml(title) + "</h2>" +
      "<p>" + escapeHtml(desc) + "</p>";

    var gal = overlay.querySelector(".proj-gallery");
    var empty = overlay.querySelector(".proj-empty");
    var M = window.__MANIFEST__;
    var raw = (M && M.slots && M.slots["project-" + id]) || [];
    var items = raw.map(normalize);

    gal.innerHTML = "";
    if (!items.length) {
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      items.forEach(function (it) {
        var t = document.createElement("div");
        t.className = "proj-thumb";
        if (it.type === "external") {
          var ex = parseExternal(it.src);
          var ic = (ex && ex.kind === "link") ? "🔗" : "▶";
          t.innerHTML = '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0071e3,#42a5f5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:34px">' + ic + '</div>' +
            (it.title ? '<div class="proj-cap">' + escapeHtml(it.title) + "</div>" : "");
        } else if (it.type === "video") {
          t.innerHTML = '<video muted preload="metadata" style="width:100%;height:100%;object-fit:cover">' +
            '<source src="' + it.src + '" type="video/mp4"></video>' +
            '<div class="play">▶</div>' +
            (it.title ? '<div class="proj-cap">' + escapeHtml(it.title) + "</div>" : "");
        } else {
          t.innerHTML = '<img src="' + it.src + '" alt="' + escapeHtml(it.title) + '" style="width:100%;height:100%;object-fit:cover">' +
            (it.title ? '<div class="proj-cap">' + escapeHtml(it.title) + "</div>" : "");
        }
        t.addEventListener("click", function () { openLb(it); });
        gal.appendChild(t);
      });
    }
    overlay.style.display = "flex";
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
      var im = document.createElement("img"); im.src = it.src; im.alt = it.title || ""; im.style.cssText = "max-width:90vw;max-height:85vh;border-radius:14px"; c.appendChild(im);
    }
    lb.style.display = "flex";
  }

  function injectButtons() {
    var cards = document.querySelectorAll("article.project-card[data-project]");
    Array.prototype.forEach.call(cards, function (card) {
      if (card.querySelector(".proj-view-btn")) return;
      var id = card.getAttribute("data-project");
      var h3 = card.querySelector(".project-body h3");
      var p = card.querySelector(".project-body p");
      var numEl = card.querySelector(".project-num");
      var title = h3 ? h3.textContent.trim() : ("项目" + id);
      var desc = p ? p.textContent.trim() : "";
      var num = numEl ? numEl.textContent.trim() : ("0" + (+id + 1));
      var links = card.querySelector(".project-links") || card.querySelector(".project-body");
      if (!links) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "proj-view-btn";
      btn.textContent = "查看项目作品 →";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        openProject(id, title, num, desc);
      });
      links.appendChild(btn);
    });
  }

  function init() {
    injectButtons();
    // 项目区经 SPA class 切换显隐，黑盒可能重渲染卡片 → 重新注入按钮
    var proj = document.getElementById("page-projects");
    if (proj && "MutationObserver" in window) {
      new MutationObserver(function () { injectButtons(); }).observe(proj, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }
    setTimeout(injectButtons, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
