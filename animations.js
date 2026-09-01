/* animations.js — 还原原版动效与成长时间轴图表驱动
 * 仅恢复：卡片 3D 倾斜、按钮光晕、Hero 逐字浮现、时间轴 in-view/进度线/小折线图、作品双图表。
 * 不碰项目弹层（openProject/projects.js），不重新生成卡片。
 */
(function () {
  "use strict";
  var isMobile = window.matchMedia("(max-width: 768px)").matches;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---- 5.5 时间轴节点点击展开 + 小折线图 ---- */
  var timelineMiniData = [
    { labels: ["9月", "10月", "11月", "12月"], data: [5, 12, 20, 30], label: "学习产出作品数" },
    { labels: ["9月", "10月", "11月", "12月"], data: [3, 8, 15, 22], label: "参与赛事与作品数" },
    { labels: ["3月", "6月", "9月", "12月"], data: [5, 18, 30, 45], label: "作品产出与奖项数" },
    { labels: ["8月", "10月", "12月"], data: [10, 60, 120], label: "累计内容产出（篇/条）" },
    { labels: ["1月", "4月", "7月", "10月"], data: [10, 25, 60, 100], label: "累计作品数（含10W+爆款）" },
    { labels: ["1月", "4月", "7月"], data: [10, 20, 30], label: "2026年作品与项目数（持续增长中）" }
  ];
  var timelineMiniInstances = {};

  document.querySelectorAll(".timeline-item").forEach(function (item) {
    item.addEventListener("click", function (e) {
      if (e.target.closest(".timeline-expand-inner")) return;
      var wasExpanded = item.classList.contains("expanded");
      document.querySelectorAll(".timeline-item.expanded").forEach(function (other) {
        if (other !== item) other.classList.remove("expanded");
      });
      if (!wasExpanded) {
        item.classList.add("expanded");
        var idx = parseInt(item.getAttribute("data-timeline"));
        var canvas = item.querySelector(".timeline-mini-chart canvas");
        if (canvas && timelineMiniData[idx] && typeof Chart !== "undefined" && !timelineMiniInstances[idx]) {
          drawTimelineMiniChart(canvas, timelineMiniData[idx]);
          timelineMiniInstances[idx] = true;
        }
      } else {
        item.classList.remove("expanded");
      }
    });
  });

  /* ---- 时间线层次感动效：IntersectionObserver + 滚动进度线 ---- */
  var timelineProgress = document.getElementById("timelineProgress");
  var timelineEl = document.getElementById("timeline");
  var timelineItems = document.querySelectorAll(".timeline-item");

  if ("IntersectionObserver" in window) {
    var tlObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -60px 0px" });
    timelineItems.forEach(function (item) { tlObserver.observe(item); });
  } else {
    timelineItems.forEach(function (item) { item.classList.add("in-view"); });
  }

  function updateTimelineProgress() {
    if (!timelineEl || !timelineProgress) return;
    var rect = timelineEl.getBoundingClientRect();
    var winH = window.innerHeight;
    var timelineTop = rect.top;
    var timelineHeight = rect.height;
    var viewportMid = winH * 0.5;
    var scrolled = viewportMid - timelineTop;
    var progress = Math.max(0, Math.min(1, scrolled / timelineHeight));
    timelineProgress.style.height = (progress * 100) + "%";
  }

  window.addEventListener("scroll", updateTimelineProgress, { passive: true });
  var tlPageEl = document.getElementById("page-timeline");
  if (tlPageEl) {
    var tlPageObserver = new MutationObserver(function () {
      if (tlPageEl.classList.contains("page--visible")) {
        setTimeout(function () {
          updateTimelineProgress();
          var winH = window.innerHeight;
          timelineItems.forEach(function (item) {
            var rect = item.getBoundingClientRect();
            if (rect.top < winH * 0.8 && rect.bottom > 0) item.classList.add("in-view");
          });
        }, 100);
      }
    });
    tlPageObserver.observe(tlPageEl, { attributes: true, attributeFilter: ["class"] });
  }

  function drawTimelineMiniChart(canvas, dataSet) {
    var isDark = root.getAttribute("data-theme") === "dark";
    var gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    var textColor = isDark ? "#86868b" : "#86868b";
    var primary = isDark ? "#2997ff" : "#0071e3";
    var gradientBg = isDark ? "rgba(41, 151, 255, 0.15)" : "rgba(0, 113, 227, 0.12)";
    var ctx = canvas.getContext("2d");
    var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, gradientBg);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    new Chart(canvas, {
      type: "line",
      data: {
        labels: dataSet.labels,
        datasets: [{
          label: dataSet.label,
          data: dataSet.data,
          borderColor: primary,
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: primary,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, usePointStyle: true, font: { size: 10 }, padding: 10 } },
          tooltip: { backgroundColor: "rgba(0,0,0,0.8)", titleFont: { size: 11 }, bodyFont: { size: 11 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } }, beginAtZero: true }
        },
        animation: { duration: 900, easing: "easeOutQuart" }
      }
    });
  }

  /* ---- 6. 作品对比图表（时间轴页面）- 双图表联动：柱状图 + 雷达图 + 趋势图 ---- */
  var worksChartInstance = null, worksRadarInstance = null, worksTrendInstance = null;

  function drawWorksChart() {
    var container = document.querySelector("#page-timeline .chart-container");
    if (!container || typeof Chart === "undefined") return;
    if (worksChartInstance) worksChartInstance.destroy();
    if (worksRadarInstance) worksRadarInstance.destroy();
    if (worksTrendInstance) worksTrendInstance.destroy();

    var isDark = root.getAttribute("data-theme") === "dark";
    var gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
    var textColor = isDark ? "#86868b" : "#86868b";
    var primary = isDark ? "#2997ff" : "#0071e3";
    var purple = isDark ? "#bf5af2" : "#af52de";
    var teal = isDark ? "#64d2ff" : "#00c7be";
    var orange = isDark ? "#ff9f0a" : "#ff9500";

    container.innerHTML =
      '<div class="dual-charts">' +
        '<div class="dual-chart dual-chart--bar"><h5>播放量与数据表现</h5><canvas id="worksBarChart"></canvas></div>' +
        '<div class="dual-chart dual-chart--radar"><h5>综合能力维度</h5><canvas id="worksRadarChart"></canvas></div>' +
      '</div>' +
      '<div class="dual-chart dual-chart--trend" style="margin-top:24px">' +
        '<h5>月度产出趋势</h5><canvas id="worksTrendChart"></canvas>' +
      '</div>';

    var barLabels = ["B端老板IP", "罗威纳犬账号", "台球脚本", "内容优化", "私域运营"];

    worksChartInstance = new Chart(document.getElementById("worksBarChart"), {
      type: "bar",
      data: {
        labels: barLabels,
        datasets: [
          { label: "最高播放量（万）", data: [40, 10, 40, 1, 1], backgroundColor: primary + "cc", borderRadius: 8, borderSkipped: false, yAxisID: "y" },
          { label: "单条爆款数", data: [3, 5, 1, 0, 0], backgroundColor: purple + "cc", borderRadius: 8, borderSkipped: false, yAxisID: "y1" }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { labels: { color: textColor, usePointStyle: true, padding: 12, font: { size: 11 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 }, maxRotation: 45, minRotation: 0 } },
          y: { type: "linear", display: true, position: "left", grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } }, beginAtZero: true, title: { display: true, text: "播放量(万)", color: textColor, font: { size: 10 } } },
          y1: { type: "linear", display: true, position: "right", grid: { drawOnChartArea: false }, ticks: { color: textColor, font: { size: 10 } }, beginAtZero: true, title: { display: true, text: "爆款数", color: textColor, font: { size: 10 } } }
        },
        animation: { duration: 1200, easing: "easeOutQuart", delay: function (ctx) { return ctx.dataIndex * 80 + ctx.datasetIndex * 200; } }
      }
    });

    worksRadarInstance = new Chart(document.getElementById("worksRadarChart"), {
      type: "radar",
      data: {
        labels: ["0-1起号能力", "爆款产出能力", "数据分析能力", "跨品类迁移", "AI工具提效", "团队协作效率"],
        datasets: [
          { label: "B端老板IP", data: [95, 80, 85, 65, 85, 75], backgroundColor: primary + "26", borderColor: primary, borderWidth: 2, pointBackgroundColor: primary, pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 4 },
          { label: "罗威纳犬账号", data: [90, 95, 75, 80, 70, 85], backgroundColor: purple + "26", borderColor: purple, borderWidth: 2, pointBackgroundColor: purple, pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, usePointStyle: true, padding: 12, font: { size: 11 } } } },
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25, display: false, backdropColor: "transparent" }, grid: { color: gridColor }, angleLines: { color: gridColor }, pointLabels: { color: textColor, font: { size: 10 } } } },
        animation: { duration: 1400, easing: "easeOutQuart", delay: 400 }
      }
    });

    var trendLabels = ["2025.05","2025.06","2025.07","2025.08","2025.09","2025.10","2025.11","2025.12","2026.01","2026.02","2026.03","2026.04","2026.05","2026.06","2026.07","2026.08"];
    var bEndData = [8,14,18,20,22,24,26,24,22,20,18,16,14,12,10,6];
    var petData =   [0,0,0,12,14,15,15,14,13,12,10,0,0,0,0,0];
    var crossData = [0,0,0,4,5,6,5,4,3,3,2,0,0,0,0,0];
    var trendCanvas = document.getElementById("worksTrendChart");
    if (trendCanvas) {
      worksTrendInstance = new Chart(trendCanvas, {
        type: "line",
        data: {
          labels: trendLabels,
          datasets: [
            { label: "B端老板IP", data: bEndData, borderColor: primary, backgroundColor: primary + "1a", borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: primary, pointBorderColor: "#fff", pointBorderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6 },
            { label: "宠物IP", data: petData, borderColor: purple, backgroundColor: purple + "1a", borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: purple, pointBorderColor: "#fff", pointBorderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6 },
            { label: "跨品类脚本", data: crossData, borderColor: orange, backgroundColor: orange + "1a", borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: orange, pointBorderColor: "#fff", pointBorderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: textColor, usePointStyle: true, padding: 14, font: { size: 11 } } },
            tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + "：" + ctx.parsed.y + " 条"; } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } }, title: { display: true, text: "产出条数", color: textColor, font: { size: 10 } } }
          },
          animation: { duration: 1600, easing: "easeOutQuart" }
        }
      });
    }
  }

  var timelineObserver = new MutationObserver(function () {
    var tp = document.getElementById("page-timeline");
    if (tp && tp.classList.contains("page--visible") && typeof Chart !== "undefined") drawWorksChart();
  });
  if (tlPageEl) timelineObserver.observe(tlPageEl, { attributes: true, attributeFilter: ["class"] });

  /* ---- 7. 卡片 3D 倾斜 ---- */
  if (!isMobile && !prefersReducedMotion) {
    document.querySelectorAll(".tilt-card").forEach(function (card) {
      card.addEventListener("mouseenter", function () { card.classList.add("tilting"); });
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        var centerX = rect.width / 2, centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -6;
        var rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = "perspective(1000px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.classList.remove("tilting");
        card.style.transform = "";
      });
    });
  }

  /* ---- 8. 按钮光晕 ---- */
  if (!isMobile && !prefersReducedMotion) {
    document.querySelectorAll(".btn-primary").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty("--mx", x + "%");
        btn.style.setProperty("--my", y + "%");
      });
    });
  }

  /* ---- 9. Hero 文字逐字浮现 ---- */
  if (!prefersReducedMotion) {
    var heroName = document.querySelector(".hero-name");
    if (heroName) {
      var text = heroName.textContent;
      heroName.innerHTML = text
        .split("")
        .map(function (char) {
          return '<span style="display:inline-block;opacity:0;transform:translateY(20px);transition:opacity 0.5s ease,transform 0.5s ease;">' +
            (char === " " ? "&nbsp;" : char) + "</span>";
        })
        .join("");
      heroName.querySelectorAll("span").forEach(function (span, i) {
        setTimeout(function () { span.style.opacity = "1"; span.style.transform = "translateY(0)"; }, 100 + i * 50);
      });
    }
  }

  /* ---- 10. 页脚年份 ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- 11. 手机端汉堡菜单展开/收起（还原原版 seg2.js 逻辑）---- */
  var menuToggle = document.getElementById("menuToggle");
  var navLinks = document.getElementById("navLinks");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("open");
      menuToggle.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    navLinks.querySelectorAll("a.nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

})();
