(function () {
  "use strict";

  /* Тот же файл, что у <img class="result-card__logo"> на экране «Готово» */
  var FULL_LOGO_SRC = "assets/logo-newgold-brand.png?v=11";

  var JEWELRY_GOAL = 8;
  var SPAWN_MS = 900;
  var JEWEL_LIFETIME_MS = 2200;

  function jewelFace(emoji) {
    return (
      '<span class="jewel-item__face" aria-hidden="true">' + emoji + "</span>"
    );
  }

  var JEWELRY_TYPES = [
    { label: "Кольцо", cls: "jewel-item--ring", html: jewelFace("\u{1F48D}") },
    { label: "Серьги", cls: "jewel-item--earrings", html: jewelFace("\u{1F48E}") },
    { label: "Браслет", cls: "jewel-item--bracelet", html: jewelFace("\u{1F517}") },
    { label: "Колье", cls: "jewel-item--necklace", html: jewelFace("\u{1F4FF}") },
    { label: "Брошь", cls: "jewel-item--brooch", html: jewelFace("\u{1F4A0}") },
    { label: "Подвеска", cls: "jewel-item--pendant", html: jewelFace("\u{1F9FF}") },
    { label: "Цепь", cls: "jewel-item--chain", html: jewelFace("\u{26D3}\u{FE0F}") },
    { label: "Диадема", cls: "jewel-item--watch", html: jewelFace("\u{1F451}") },
  ];

  var shine = "warm";
  var jewelryCaught = 0;
  var spawnTimer = null;

  var els = {
    screens: {
      start: document.getElementById("screen-start"),
      step1: document.getElementById("screen-step1"),
      step2: document.getElementById("screen-step2"),
      step3: document.getElementById("screen-step3"),
      end: document.getElementById("screen-end"),
      error: document.getElementById("screen-error"),
    },
    jewelField: document.getElementById("jewel-field"),
    jewelProgress: document.getElementById("jewel-progress"),
    btnStep1Next: document.getElementById("btn-step1-next"),
    assembleRange: document.getElementById("assemble-range"),
    assembleViewport: document.getElementById("assemble-viewport"),
    btnStep2Next: document.getElementById("btn-step2-next"),
    btnStep3Done: document.getElementById("btn-step3-done"),
    resultInner: document.getElementById("result-inner"),
    btnSave: document.getElementById("btn-save"),
    btnShare: document.getElementById("btn-share"),
    btnReplay: document.getElementById("btn-replay"),
    btnReload: document.getElementById("btn-reload"),
    leadForm: document.getElementById("lead-form"),
    linkShowroom: document.getElementById("link-showroom"),
    exportCanvas: document.getElementById("export-canvas"),
  };

  var assembleMark = null;

  function showScreen(screenId) {
    Object.keys(els.screens).forEach(function (key) {
      var s = els.screens[key];
      if (!s) return;
      var isMatch = s.id === screenId;
      s.hidden = !isMatch;
      s.classList.toggle("screen--active", isMatch);
      s.setAttribute("aria-hidden", isMatch ? "false" : "true");
    });
  }

  function initAssembleViewport() {
    els.assembleViewport.innerHTML = "";
    assembleMark = document.createElement("div");
    assembleMark.className = "assemble__mark";
    assembleMark.setAttribute("aria-hidden", "true");
    assembleMark.textContent = "\u{1F60A}";
    els.assembleViewport.appendChild(assembleMark);
    updateAssemble(Number(els.assembleRange.value));
  }

  function updateAssemble(value) {
    if (!assembleMark) return;
    var t = value / 100;
    var blur = (1 - t) * 14;
    var scale = 0.78 + t * 0.22;
    var opacity = 0.35 + t * 0.65;
    assembleMark.style.filter = "blur(" + blur + "px)";
    assembleMark.style.transform = "scale(" + scale + ")";
    assembleMark.style.opacity = String(opacity);
    els.btnStep2Next.disabled = value < 100;
  }

  function resetStep1() {
    jewelryCaught = 0;
    els.jewelField.innerHTML = "";
    els.jewelProgress.textContent = "Собрано: 0 / " + JEWELRY_GOAL;
    els.btnStep1Next.hidden = true;
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = null;
  }

  function startStep1Spawning() {
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(function () {
      if (jewelryCaught >= JEWELRY_GOAL) {
        clearInterval(spawnTimer);
        spawnTimer = null;
        return;
      }
      spawnJewel();
    }, SPAWN_MS);
    spawnJewel();
  }

  var activeJewels = 0;

  function pickJewelryType() {
    return JEWELRY_TYPES[Math.floor(Math.random() * JEWELRY_TYPES.length)];
  }

  function spawnJewel() {
    if (jewelryCaught >= JEWELRY_GOAL) return;
    if (activeJewels >= 5) return;

    var piece = pickJewelryType();
    var field = els.jewelField;
    var rect = field.getBoundingClientRect();
    var pad = 40;
    var x = pad + Math.random() * Math.max(8, rect.width - pad * 2);
    var y = pad + Math.random() * Math.max(8, rect.height - pad * 2);

    var sp = document.createElement("button");
    sp.type = "button";
    sp.className = "jewel-item " + piece.cls;
    sp.style.left = x + "px";
    sp.style.top = y + "px";
    sp.setAttribute("aria-label", "Собрать: " + piece.label);
    sp.innerHTML = piece.html;

    var dead = false;
    function removeJewel() {
      if (dead) return;
      dead = true;
      activeJewels = Math.max(0, activeJewels - 1);
      if (sp.parentNode) sp.parentNode.removeChild(sp);
    }

    var life = setTimeout(function () {
      sp.classList.add("jewel-item--fade");
      setTimeout(removeJewel, 380);
    }, JEWEL_LIFETIME_MS);

    sp.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(life);
      jewelryCaught += 1;
      els.jewelProgress.textContent = "Собрано: " + jewelryCaught + " / " + JEWELRY_GOAL;
      sp.classList.add("jewel-item--fade");
      setTimeout(removeJewel, 200);
      if (jewelryCaught >= JEWELRY_GOAL) {
        if (spawnTimer) {
          clearInterval(spawnTimer);
          spawnTimer = null;
        }
        els.btnStep1Next.hidden = false;
      }
    });

    field.appendChild(sp);
    activeJewels += 1;
  }

  function applyShineToResult() {
    els.resultInner.classList.remove(
      "result-card__inner--warm",
      "result-card__inner--cool",
      "result-card__inner--teal"
    );
    els.resultInner.classList.add("result-card__inner--" + shine);
  }

  function selectShineCard(btn) {
    document.querySelectorAll(".shine-card").forEach(function (c) {
      c.classList.remove("shine-card--selected");
      c.setAttribute("aria-checked", "false");
    });
    btn.classList.add("shine-card--selected");
    btn.setAttribute("aria-checked", "true");
    shine = btn.getAttribute("data-shine") || "warm";
  }

  function getShineGradient(ctx, h) {
    if (shine === "cool") {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#fbfdff");
      g.addColorStop(1, "#e8eef8");
      return g;
    }
    if (shine === "teal") {
      var g2 = ctx.createLinearGradient(0, 0, 0, h);
      g2.addColorStop(0, "#f5fbfb");
      g2.addColorStop(1, "#dceeee");
      return g2;
    }
    var g3 = ctx.createLinearGradient(0, 0, 0, h);
    g3.addColorStop(0, "#fffefb");
    g3.addColorStop(1, "#fff0e0");
    return g3;
  }

  function paintResultCanvas() {
    return new Promise(function (resolve, reject) {
      var canvas = els.exportCanvas;
      var ctx = canvas.getContext("2d");
      var w = canvas.width;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getShineGradient(ctx, h);
      ctx.fillRect(0, 0, w, h);

      var logo = new Image();
      logo.onload = function () {
        var lw = 340;
        var lh = (logo.height / logo.width) * lw;
        var lx = (w - lw) / 2;
        var ly = h * 0.2;
        ctx.save();
        if (shine === "warm") {
          ctx.shadowColor = "rgba(212, 165, 80, 0.55)";
          ctx.shadowBlur = 36;
        } else if (shine === "cool") {
          ctx.shadowColor = "rgba(160, 190, 230, 0.5)";
          ctx.shadowBlur = 32;
        } else {
          ctx.shadowColor = "rgba(120, 180, 180, 0.5)";
          ctx.shadowBlur = 34;
        }
        ctx.drawImage(logo, lx, ly, lw, lh);
        ctx.restore();

        ctx.fillStyle = "#5c5c5c";
        ctx.textAlign = "center";
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0";
        ctx.font = '400 22px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText("Сияние NEWGOLD", w / 2, ly + lh + 44);
        resolve();
      };
      logo.onerror = function () {
        reject(new Error("logo"));
      };
      logo.src = FULL_LOGO_SRC;
    });
  }

  function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "newgold-siyanie.png";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function exportImage() {
    paintResultCanvas()
      .then(function () {
        els.exportCanvas.toBlob(function (blob) {
          if (!blob) {
            alert("Не удалось сохранить файл.");
            return;
          }
          downloadBlob(blob);
        }, "image/png");
      })
      .catch(function () {
        alert("Не удалось собрать картинку. Обновите страницу и попробуйте снова.");
      });
  }

  function shareResult() {
    paintResultCanvas()
      .then(function () {
        els.exportCanvas.toBlob(function (blob) {
          if (!blob) {
            alert("Не удалось подготовить картинку.");
            return;
          }
          if (!navigator.share) {
            alert("В этом браузере нет «Поделиться». Сохраните картинку кнопкой ниже.");
            return;
          }
          var file = new File([blob], "newgold-siyanie.png", { type: "image/png" });
          var payload = { title: "Сияние NEWGOLD", text: "Символ NEWGOLD сияет.", files: [file] };
          if (navigator.canShare && !navigator.canShare(payload)) {
            navigator
              .share({ title: payload.title, text: payload.text })
              .catch(function () {});
            return;
          }
          navigator.share(payload).catch(function () {});
        }, "image/png");
      })
      .catch(function () {
        alert("Не удалось собрать картинку. Обновите страницу и попробуйте снова.");
      });
  }

  document.getElementById("btn-start").addEventListener("click", function () {
    activeJewels = 0;
    resetStep1();
    showScreen("screen-step1");
    startStep1Spawning();
  });

  els.btnStep1Next.addEventListener("click", function () {
    els.assembleRange.value = "0";
    initAssembleViewport();
    showScreen("screen-step2");
  });

  els.assembleRange.addEventListener("input", function () {
    updateAssemble(Number(els.assembleRange.value));
  });

  els.btnStep2Next.addEventListener("click", function () {
    showScreen("screen-step3");
  });

  els.btnStep3Done.addEventListener("click", function () {
    applyShineToResult();
    showScreen("screen-end");
  });

  document.querySelectorAll(".shine-card").forEach(function (card) {
    card.addEventListener("click", function () {
      selectShineCard(card);
    });
  });

  els.btnSave.addEventListener("click", exportImage);
  els.btnShare.addEventListener("click", shareResult);

  els.btnReplay.addEventListener("click", function () {
    var warm = document.querySelector('.shine-card[data-shine="warm"]');
    if (warm) selectShineCard(warm);
    els.assembleRange.value = "0";
    initAssembleViewport();
    activeJewels = 0;
    resetStep1();
    showScreen("screen-start");
  });

  els.btnReload.addEventListener("click", function () {
    location.reload();
  });

  els.leadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = els.leadForm.querySelector('input[name="email"]');
    var v = input && input.value.trim();
    if (!v) {
      alert("Введите почту или пропустите этот шаг.");
      return;
    }
    alert("Спасибо! Подключите отправку формы на сервере сайта NEWGOLD — сейчас это демонстрация.");
    input.value = "";
  });

  els.linkShowroom.addEventListener("click", function (e) {
    if (els.linkShowroom.getAttribute("href") === "#") {
      e.preventDefault();
      alert("Замените ссылку в коде на страницу записи в шоурум на сайте NEWGOLD.");
    }
  });

  initAssembleViewport();
  showScreen("screen-start");
})();
