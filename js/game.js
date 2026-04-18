(function () {
  "use strict";

  var FULL_LOGO_SRC = "assets/logo-newgold-brand.png?v=17";
  var ASSET_VER = "17";
  var JEWEL_IMG_RING = "assets/jewel-ring-rose-heart.png";
  var JEWEL_IMG_NECKLACE = "assets/jewel-necklace-ruby.png";

  var TOTAL_STEPS = 10;

  var SPAWN_MS = 1300;
  var JEWEL_LIFETIME_MS = 3000;
  var LIVES_MAX = 3;
  var SPARK_TARGET = 10;

  function jewelFace(emoji) {
    return (
      '<span class="jewel-item__face" aria-hidden="true">' + emoji + "</span>"
    );
  }

  function jewelContent(piece) {
    if (piece.img) {
      return (
        '<img class="jewel-item__photo" src="' +
        piece.img +
        "?v=" +
        ASSET_VER +
        '" alt="" loading="lazy" draggable="false" />'
      );
    }
    return piece.html;
  }

  var JEWELRY_TYPES = [
    { label: "Кольцо", cls: "jewel-item--ring", img: JEWEL_IMG_RING },
    { label: "Серьги", cls: "jewel-item--earrings", html: jewelFace("\u{1F48E}") },
    { label: "Браслет", cls: "jewel-item--bracelet", html: jewelFace("\u{1F517}") },
    { label: "Колье", cls: "jewel-item--necklace", img: JEWEL_IMG_NECKLACE },
    { label: "Брошь", cls: "jewel-item--brooch", html: jewelFace("\u{1F4A0}") },
    { label: "Подвеска", cls: "jewel-item--pendant", img: JEWEL_IMG_NECKLACE },
    { label: "Цепь", cls: "jewel-item--chain", html: jewelFace("\u{26D3}\u{FE0F}") },
    { label: "Диадема", cls: "jewel-item--watch", html: jewelFace("\u{1F451}") },
  ];

  var QUEST_NEED = {};
  JEWELRY_TYPES.forEach(function (t) {
    QUEST_NEED[t.cls] = 1;
  });

  var caughtByCls = {};
  var lives = LIVES_MAX;
  var firstMissFree = true;
  var step1FeedbackTimer = null;
  var shine = "warm";
  var spawnTimer = null;
  var sparkClicks = 0;
  var polishMark = null;

  var els = {
    screens: {
      start: document.getElementById("screen-start"),
      step1: document.getElementById("screen-step1"),
      step2: document.getElementById("screen-step2"),
      step3: document.getElementById("screen-step3"),
      step4: document.getElementById("screen-step4"),
      step5: document.getElementById("screen-step5"),
      step6: document.getElementById("screen-step6"),
      step7: document.getElementById("screen-step7"),
      step8: document.getElementById("screen-step8"),
      step9: document.getElementById("screen-step9"),
      end: document.getElementById("screen-end"),
      gameover: document.getElementById("screen-gameover"),
      error: document.getElementById("screen-error"),
    },
    jewelField: document.getElementById("jewel-field"),
    jewelProgress: document.getElementById("jewel-progress"),
    jewelLives: document.getElementById("jewel-lives"),
    step1Feedback: document.getElementById("step1-feedback"),
    questBridge: document.getElementById("quest-bridge"),
    btnStep1Next: document.getElementById("btn-step1-next"),
    btnStep2Next: document.getElementById("btn-step2-next"),
    btnStep3Next: document.getElementById("btn-step3-next"),
    btnStep4Next: document.getElementById("btn-step4-next"),
    btnStep5Next: document.getElementById("btn-step5-next"),
    sparkBtn: document.getElementById("spark-btn"),
    sparkCount: document.getElementById("spark-count"),
    assembleRange: document.getElementById("assemble-range"),
    assembleViewport: document.getElementById("assemble-viewport"),
    btnStep6Next: document.getElementById("btn-step6-next"),
    polishRange: document.getElementById("polish-range"),
    polishViewport: document.getElementById("polish-viewport"),
    btnStep7Next: document.getElementById("btn-step7-next"),
    btnStep8Next: document.getElementById("btn-step8-next"),
    btnStep9Done: document.getElementById("btn-step9-done"),
    resultInner: document.getElementById("result-inner"),
    btnSave: document.getElementById("btn-save"),
    btnShare: document.getElementById("btn-share"),
    btnReplay: document.getElementById("btn-replay"),
    btnReload: document.getElementById("btn-reload"),
    leadForm: document.getElementById("lead-form"),
    linkShowroom: document.getElementById("link-showroom"),
    exportCanvas: document.getElementById("export-canvas"),
    gameProgress: document.getElementById("game-progress"),
    gameProgressText: document.getElementById("game-progress-text"),
    gameProgressFill: document.getElementById("game-progress-fill"),
    gameProgressBar: document.getElementById("game-progress-bar"),
  };

  var assembleMark = null;

  function resetQuestState() {
    caughtByCls = {};
    JEWELRY_TYPES.forEach(function (t) {
      caughtByCls[t.cls] = 0;
    });
    lives = LIVES_MAX;
    firstMissFree = true;
  }

  function clearStep1Feedback() {
    if (step1FeedbackTimer) {
      clearTimeout(step1FeedbackTimer);
      step1FeedbackTimer = null;
    }
    if (els.step1Feedback) {
      els.step1Feedback.textContent = "";
      els.step1Feedback.hidden = true;
    }
  }

  function showStep1Feedback(text) {
    if (!els.step1Feedback) return;
    clearStep1Feedback();
    els.step1Feedback.hidden = false;
    els.step1Feedback.textContent = text;
    step1FeedbackTimer = setTimeout(function () {
      step1FeedbackTimer = null;
      if (els.step1Feedback) {
        els.step1Feedback.textContent = "";
        els.step1Feedback.hidden = true;
      }
    }, 4500);
  }

  function questTotal() {
    var s = 0;
    JEWELRY_TYPES.forEach(function (t) {
      s += QUEST_NEED[t.cls];
    });
    return s;
  }

  function questProgressCount() {
    var n = 0;
    JEWELRY_TYPES.forEach(function (t) {
      n += Math.min(caughtByCls[t.cls], QUEST_NEED[t.cls]);
    });
    return n;
  }

  function isQuestComplete() {
    return questProgressCount() >= questTotal();
  }

  function updateProgressUI() {
    els.jewelProgress.textContent =
      "Собрано: " + questProgressCount() + " / " + questTotal() + " · по одному каждого вида";
    if (els.jewelLives) {
      els.jewelLives.textContent =
        "Жизни: " + "\u2665".repeat(lives) + "\u2661".repeat(LIVES_MAX - lives);
    }
  }

  function endStep1GameOver() {
    clearStep1Feedback();
    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }
    els.jewelField.innerHTML = "";
    activeJewels = 0;
    showScreen("screen-gameover");
  }

  function stepForScreen(screenId) {
    var map = {
      "screen-step1": 1,
      "screen-step2": 2,
      "screen-step3": 3,
      "screen-step4": 4,
      "screen-step5": 5,
      "screen-step6": 6,
      "screen-step7": 7,
      "screen-step8": 8,
      "screen-step9": 9,
      "screen-end": 10,
    };
    return map[screenId] || 0;
  }

  function updateGameProgress(screenId) {
    if (!els.gameProgress || !els.gameProgressText || !els.gameProgressFill) return;
    var step = stepForScreen(screenId);
    if (step < 1) {
      els.gameProgress.hidden = true;
      els.gameProgress.setAttribute("aria-hidden", "true");
      return;
    }
    els.gameProgress.hidden = false;
    els.gameProgress.setAttribute("aria-hidden", "false");
    els.gameProgressText.textContent = "Шаг " + step + " из " + TOTAL_STEPS;
    els.gameProgressFill.style.width = (step / TOTAL_STEPS) * 100 + "%";
    if (els.gameProgressBar) {
      els.gameProgressBar.setAttribute("aria-valuenow", String(step));
      els.gameProgressBar.setAttribute("aria-valuemax", String(TOTAL_STEPS));
    }
  }

  function showScreen(screenId) {
    Object.keys(els.screens).forEach(function (key) {
      var s = els.screens[key];
      if (!s) return;
      var isMatch = s.id === screenId;
      s.hidden = !isMatch;
      s.classList.toggle("screen--active", isMatch);
      s.setAttribute("aria-hidden", isMatch ? "false" : "true");
    });
    updateGameProgress(screenId);
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
    els.btnStep6Next.disabled = value < 100;
  }

  function initPolishViewport() {
    if (!els.polishViewport) return;
    els.polishViewport.innerHTML = "";
    polishMark = document.createElement("div");
    polishMark.className = "assemble__mark polish__mark";
    polishMark.setAttribute("aria-hidden", "true");
    polishMark.textContent = "\u{1F48E}";
    els.polishViewport.appendChild(polishMark);
    updatePolish(Number(els.polishRange.value));
  }

  function updatePolish(value) {
    if (!polishMark) return;
    var t = value / 100;
    var blur = (1 - t) * 12;
    var brightness = 0.82 + t * 0.18;
    polishMark.style.filter = "blur(" + blur + "px) brightness(" + brightness + ")";
    polishMark.style.transform = "scale(" + (0.88 + t * 0.12) + ")";
    els.btnStep7Next.disabled = value < 100;
  }

  function updateSparkUI() {
    if (els.sparkCount) els.sparkCount.textContent = sparkClicks + " / " + SPARK_TARGET;
    if (els.btnStep5Next) els.btnStep5Next.disabled = sparkClicks < SPARK_TARGET;
  }

  function resetSteps2to9() {
    sparkClicks = 0;
    updateSparkUI();
    document.querySelectorAll(".choice-chip[data-alloy]").forEach(function (c) {
      c.classList.remove("choice-chip--selected");
    });
    document.querySelectorAll(".choice-chip[data-mood]").forEach(function (c) {
      c.classList.remove("choice-chip--selected");
    });
    if (els.btnStep3Next) els.btnStep3Next.disabled = true;
    if (els.btnStep4Next) els.btnStep4Next.disabled = true;
    if (els.assembleRange) els.assembleRange.value = "0";
    if (els.polishRange) els.polishRange.value = "0";
    initAssembleViewport();
    initPolishViewport();
  }

  function resetStep1() {
    resetQuestState();
    clearStep1Feedback();
    if (els.questBridge) els.questBridge.hidden = true;
    els.jewelField.innerHTML = "";
    updateProgressUI();
    els.btnStep1Next.hidden = true;
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = null;
  }

  function startStep1Spawning() {
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(function () {
      if (isQuestComplete() || lives <= 0) {
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
    var needed = JEWELRY_TYPES.filter(function (t) {
      return caughtByCls[t.cls] < QUEST_NEED[t.cls];
    });
    if (needed.length === 0) {
      return JEWELRY_TYPES[0];
    }
    return needed[Math.floor(Math.random() * needed.length)];
  }

  function spawnJewel() {
    if (isQuestComplete() || lives <= 0) return;
    if (activeJewels >= 5) return;

    var piece = pickJewelryType();
    var field = els.jewelField;
    var rect = field.getBoundingClientRect();
    var pad = 40;
    var x = pad + Math.random() * Math.max(8, rect.width - pad * 2);
    var y = pad + Math.random() * Math.max(8, rect.height - pad * 2);

    var sp = document.createElement("button");
    sp.type = "button";
    sp.className =
      "jewel-item " + piece.cls + (piece.img ? " jewel-item--photo" : "");
    sp.style.left = x + "px";
    sp.style.top = y + "px";
    sp.setAttribute("aria-label", "Собрать: " + piece.label);
    sp.innerHTML = jewelContent(piece);

    var dead = false;
    function removeJewel() {
      if (dead) return;
      dead = true;
      activeJewels = Math.max(0, activeJewels - 1);
      if (sp.parentNode) sp.parentNode.removeChild(sp);
    }

    var life = setTimeout(function () {
      if (dead) return;
      if (firstMissFree) {
        firstMissFree = false;
        showStep1Feedback(
          "Первый пропуск не штрафуется. Дальше за каждое исчезновение до клика — минус жизнь."
        );
        sp.classList.add("jewel-item--fade");
        setTimeout(removeJewel, 380);
        return;
      }
      lives -= 1;
      updateProgressUI();
      if (lives <= 0) {
        sp.classList.add("jewel-item--fade");
        setTimeout(function () {
          removeJewel();
          endStep1GameOver();
        }, 380);
        return;
      }
      sp.classList.add("jewel-item--fade");
      setTimeout(removeJewel, 380);
    }, JEWEL_LIFETIME_MS);

    sp.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(life);
      var need = QUEST_NEED[piece.cls];
      var cur = caughtByCls[piece.cls];
      if (cur < need) {
        caughtByCls[piece.cls] = cur + 1;
      }
      updateProgressUI();
      sp.classList.add("jewel-item--fade");
      setTimeout(removeJewel, 200);
      if (isQuestComplete()) {
        if (spawnTimer) {
          clearInterval(spawnTimer);
          spawnTimer = null;
        }
        if (els.questBridge) els.questBridge.hidden = false;
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
    resetSteps2to9();
    var warm = document.querySelector('.shine-card[data-shine="warm"]');
    if (warm) selectShineCard(warm);
    showScreen("screen-step1");
    startStep1Spawning();
  });

  els.btnStep1Next.addEventListener("click", function () {
    showScreen("screen-step2");
  });

  els.btnStep2Next.addEventListener("click", function () {
    showScreen("screen-step3");
  });

  els.btnStep3Next.addEventListener("click", function () {
    showScreen("screen-step4");
  });

  els.btnStep4Next.addEventListener("click", function () {
    showScreen("screen-step5");
  });

  els.btnStep5Next.addEventListener("click", function () {
    els.assembleRange.value = "0";
    initAssembleViewport();
    showScreen("screen-step6");
  });

  els.btnStep6Next.addEventListener("click", function () {
    if (els.polishRange) els.polishRange.value = "0";
    initPolishViewport();
    showScreen("screen-step7");
  });

  els.btnStep7Next.addEventListener("click", function () {
    showScreen("screen-step8");
  });

  els.btnStep8Next.addEventListener("click", function () {
    showScreen("screen-step9");
  });

  els.btnStep9Done.addEventListener("click", function () {
    applyShineToResult();
    showScreen("screen-end");
  });

  document.querySelectorAll(".choice-chip[data-alloy]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".choice-chip[data-alloy]").forEach(function (c) {
        c.classList.remove("choice-chip--selected");
      });
      chip.classList.add("choice-chip--selected");
      els.btnStep3Next.disabled = false;
    });
  });

  document.querySelectorAll(".choice-chip[data-mood]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".choice-chip[data-mood]").forEach(function (c) {
        c.classList.remove("choice-chip--selected");
      });
      chip.classList.add("choice-chip--selected");
      els.btnStep4Next.disabled = false;
    });
  });

  if (els.sparkBtn) {
    els.sparkBtn.addEventListener("click", function () {
      if (sparkClicks >= SPARK_TARGET) return;
      sparkClicks += 1;
      updateSparkUI();
    });
  }

  els.assembleRange.addEventListener("input", function () {
    updateAssemble(Number(els.assembleRange.value));
  });

  if (els.polishRange) {
    els.polishRange.addEventListener("input", function () {
      updatePolish(Number(els.polishRange.value));
    });
  }

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
    activeJewels = 0;
    resetStep1();
    resetSteps2to9();
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

  var btnRetryStep1 = document.getElementById("btn-retry-step1");
  if (btnRetryStep1) {
    btnRetryStep1.addEventListener("click", function () {
      activeJewels = 0;
      resetStep1();
      showScreen("screen-step1");
      startStep1Spawning();
    });
  }

  initAssembleViewport();
  initPolishViewport();
  updateSparkUI();
  showScreen("screen-start");
})();
