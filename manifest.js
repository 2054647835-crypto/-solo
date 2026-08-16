// ============================================================
//  已发布内容渲染器（manifest.js）
//  读取 content.js 里的 window.__MANIFEST__，把"已发布"的
//  头像 / 作品 / 外链 渲染到页面上。部署后所有人可见。
//  设计要点：
//   - 本脚本在 base64 主脚本之后加载，监听器也后注册，
//     因此 media-updated 重渲染后本脚本会再次覆盖，已发布内容稳赢。
//   - 自带查看用灯箱，不影响原站的上传/裁剪/删除功能。
//   - content.js 中留空的槽位，仍由原有的浏览器本地上传（IndexedDB）负责。
// ============================================================
(function () {
  "use strict";

  function isVideo(src) {
    return /\.(mp4|webm|ogg|mov)$/i.test(src || "");
  }

  function normalize(item) {
    if (typeof item === "string") item = { src: item };
    return {
      src: item.src || "",
      title: item.title || "",
      desc: item.desc || "",
      type: item.type || (isVideo(item.src) ? "video" : "image")
    };
  }

  function cardHTML(it, i) {
    var label =
      '<div class="teaching-work-label">' +
      "<strong>" + (it.title || "") + "</strong>" +
      (it.desc ? "<span>" + it.desc + "</span>" : "") +
      "<em>" + (it.type === "video" ? "点击播放" : "点击查看大图") + "</em>" +
      "</div>";
    if (it.type === "video") {
      return '<div class="teaching-work manifest-card" data-i="' + i + '">' +
        '<video muted preload="metadata" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;position:absolute;inset:0"><source src="' + it.src + '" type="video/mp4"></video>' +
        label +
        '<div class="video-play-icon">▶</div></div>';
    }
    return '<div class="teaching-work manifest-card" data-i="' + i + '" style="background-image:url(' + it.src + ');background-size:cover;background-position:center">' +
      label + "</div>";
  }

  function applyManifest() {
    var M = window.__MANIFEST__;
    if (!M) return;

    // ---- 头像 ----
    var avatarEl = document.getElementById("aboutAvatar");
    if (avatarEl && M.avatar) {
      avatarEl.innerHTML =
        '<img src="' + M.avatar + '" alt="头像" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">';
      avatarEl.style.background = "none";
      avatarEl.style.border = "none";
      avatarEl.style.cursor = "zoom-in";
      avatarEl.title = "头像";
    }

    // ---- 作品槽 ----
    var containers = document.querySelectorAll("[data-upload-slot]");
    Array.prototype.forEach.call(containers, function (container) {
      var slot = container.getAttribute("data-upload-slot");
      var raw = (M.slots && M.slots[slot]) || [];
      if (!raw.length) return; // 未发布 → 保留原本地上传行为

      var items = raw.map(normalize);
      container.classList.add("manifest-filled");
      container.removeAttribute("style"); // 去掉原本的渐变占位背景
      container.innerHTML = items.map(cardHTML).join("");

      var cards = container.querySelectorAll(".manifest-card");
      Array.prototype.forEach.call(cards, function (card) {
        card.style.cursor = "zoom-in";
        card.addEventListener("click", function (e) {
          e.stopPropagation();
          openManifestLightbox(items, parseInt(card.getAttribute("data-i"), 10) || 0);
        });
      });
    });

    // ---- 外链作品 ----
    if (M.links && M.links.length) {
      var linkCards = document.querySelectorAll(".link-card");
      Array.prototype.forEach.call(linkCards, function (a) {
        var nameEl = a.querySelector("strong");
        if (!nameEl) return;
        for (var i = 0; i < M.links.length; i++) {
          if (M.links[i].name === nameEl.textContent && M.links[i].url) {
            a.setAttribute("href", M.links[i].url);
            break;
          }
        }
      });
    }
  }

  // ---------- 自带查看灯箱（仅查看，不碰原站上传逻辑）----------
  var lbItems = [], lbIndex = 0, lbEl = null;

  function openManifestLightbox(items, idx) {
    lbItems = items;
    lbIndex = idx || 0;
    if (!lbEl) buildLightbox();
    renderLightbox();
    lbEl.style.display = "flex";
  }

  function buildLightbox() {
    lbEl = document.createElement("div");
    lbEl.className = "manifest-lightbox";
    lbEl.innerHTML =
      '<div class="ml-backdrop"></div>' +
      '<div class="ml-stage">' +
      '<button class="ml-close" aria-label="关闭">×</button>' +
      '<button class="ml-prev" aria-label="上一张">‹</button>' +
      '<button class="ml-next" aria-label="下一张">›</button>' +
      '<div class="ml-content"></div>' +
      '<div class="ml-caption"></div>' +
      "</div>";
    document.body.appendChild(lbEl);
    lbEl.querySelector(".ml-backdrop").addEventListener("click", closeLightbox);
    lbEl.querySelector(".ml-close").addEventListener("click", closeLightbox);
    lbEl.querySelector(".ml-prev").addEventListener("click", function (e) {
      e.stopPropagation(); stepLightbox(-1);
    });
    lbEl.querySelector(".ml-next").addEventListener("click", function (e) {
      e.stopPropagation(); stepLightbox(1);
    });
    document.addEventListener("keydown", function (e) {
      if (!lbEl || lbEl.style.display === "none") return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  function renderLightbox() {
    var it = lbItems[lbIndex];
    if (!it) return;
    var stage = lbEl.querySelector(".ml-content");
    if (it.type === "video") {
      stage.innerHTML =
        '<video controls autoplay style="max-width:90vw;max-height:82vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)"><source src="' + it.src + '" type="video/mp4"></video>';
    } else {
      stage.innerHTML =
        '<img src="' + it.src + '" alt="' + (it.title || "") + '" style="max-width:90vw;max-height:82vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)">';
    }
    lbEl.querySelector(".ml-caption").textContent = it.title || "";
  }

  function stepLightbox(d) {
    lbIndex = (lbIndex + d + lbItems.length) % lbItems.length;
    renderLightbox();
  }

  function closeLightbox() {
    if (lbEl) lbEl.style.display = "none";
  }

  // ---------- 触发时机 ----------
  function init() {
    applyManifest();
    // base64 在 media-updated 时重渲染 slot，本监听器后注册 → 随后再次覆盖，已发布内容稳赢
    document.addEventListener("media-updated", function () { applyManifest(); });
    // 关于页通过 class 切换显隐（SPA），切换时重新应用
    var about = document.getElementById("page-about");
    if (about && "MutationObserver" in window) {
      new MutationObserver(function () { applyManifest(); }).observe(about, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }
    // 兜底：延迟再应用一次，压过 base64 的初次渲染
    setTimeout(applyManifest, 80);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
