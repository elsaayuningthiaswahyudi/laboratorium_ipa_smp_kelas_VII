// Educational Mini-Games Module for Science Laboratory

class LabGames {
  constructor() {
    this.activeGame = 'match'; // 'match', 'symbols', 'memory'
    this.scores = {
      match: 0,
      symbols: 0,
      memory: 0
    };

    // Game 2: Symbols state
    this.symbolQuizIndex = 0;
    this.symbolTimer = null;
    this.symbolTimeLeft = 10;
    this.symbolScore = 0;

    // Game 3: Memory cards state
    this.memoryCards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.memoryMoves = 0;

    // Game 4: Froggy Jump state
    this.froggyQuestions = [];
    this.froggyIndex = 0;
    this.froggyLives = 4;
    this.froggyScore = 0;
    this.froggyTimer = null;
    this.froggyTimeLeft = 15;
  }

  switchGame(gameId) {
    if (window.labAudio) window.labAudio.playClick();
    this.activeGame = gameId;

    document.querySelectorAll('.game-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.game === gameId);
    });

    document.querySelectorAll('.game-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `game-panel-${gameId}`);
    });

    if (gameId === 'match') this.initMatchGame();
    if (gameId === 'symbols') this.initSymbolsGame();
    if (gameId === 'memory') this.initMemoryGame();
    if (gameId === 'froggy') this.initFroggyGame();
  }

  // ================= 1. GAME: DRAG & DROP COCOKKAN ALAT =================
  initMatchGame() {
    const toolsCol = document.getElementById('match-tools-col');
    const targetsCol = document.getElementById('match-targets-col');
    const scoreDisplay = document.getElementById('match-game-score');
    if (!toolsCol || !targetsCol) return;

    this.scores.match = 0;
    if (scoreDisplay) scoreDisplay.innerText = `Skor: 0 / 6`;

    const data = [...window.LAB_DATA.gameMatch];
    const shuffledTargets = [...data].sort(() => Math.random() - 0.5);

    toolsCol.innerHTML = data.map(item => `
      <div class="drag-tool-card" draggable="true" id="drag-tool-${item.id}" data-id="${item.id}" ondragstart="window.labGames.onDragStart(event)">
        <div class="drag-tool-thumb">
          <img src="${item.gambar}" alt="${item.alat}" />
        </div>
        <span>${item.alat}</span>
      </div>
    `).join('');

    targetsCol.innerHTML = shuffledTargets.map(item => `
      <div class="drop-target-box" id="drop-target-${item.id}" data-id="${item.id}" ondragover="window.labGames.onDragOver(event)" ondragleave="window.labGames.onDragLeave(event)" ondrop="window.labGames.onDrop(event)">
        <div class="target-placeholder">
          <i class="fa-regular fa-circle-dot"></i> Pasangkan di sini
        </div>
        <p class="target-desc">${item.fungsi}</p>
      </div>
    `).join('');
  }

  onDragStart(e) {
    if (window.labAudio) window.labAudio.playClick();
    const card = e.target.closest('.drag-tool-card');
    if (card) {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      card.classList.add('dragging');
    }
  }

  onDragOver(e) {
    e.preventDefault();
    const box = e.target.closest('.drop-target-box');
    if (box && !box.classList.contains('matched')) {
      box.classList.add('drag-hover');
    }
  }

  onDragLeave(e) {
    const box = e.target.closest('.drop-target-box');
    if (box) box.classList.remove('drag-hover');
  }

  onDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const dropBox = e.target.closest('.drop-target-box');
    if (!dropBox || dropBox.classList.contains('matched')) return;

    dropBox.classList.remove('drag-hover');
    const targetId = dropBox.dataset.id;

    const dragCard = document.getElementById(`drag-tool-${draggedId}`);

    if (draggedId === targetId) {
      // Benar!
      if (window.labAudio) window.labAudio.playCorrect();
      dropBox.classList.add('matched');
      if (dragCard) {
        dragCard.classList.add('used');
        dropBox.prepend(dragCard);
      }
      this.scores.match += 1;

      const scoreDisplay = document.getElementById('match-game-score');
      if (scoreDisplay) scoreDisplay.innerText = `Skor: ${this.scores.match} / 6`;

      if (this.scores.match === 6) {
        if (window.labAudio) window.labAudio.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        alert("🎉 Luar Biasa! Kamu berhasil mencocokkan semua alat laboratorium dengan tepat!");
      }
    } else {
      // Salah
      if (window.labAudio) window.labAudio.playWrong();
      dropBox.classList.add('shake-wrong');
      setTimeout(() => dropBox.classList.remove('shake-wrong'), 500);
      if (dragCard) dragCard.classList.remove('dragging');
    }
  }

  // ================= 2. GAME: KUIS KILAT TEBAK SIMBOL K3 =================
  initSymbolsGame() {
    this.symbolQuizIndex = 0;
    this.symbolScore = 0;
    this.renderSymbolQuestion();
  }

  renderSymbolQuestion() {
    clearInterval(this.symbolTimer);
    const container = document.getElementById('symbol-quiz-container');
    if (!container) return;

    const items = window.LAB_DATA.gameSymbols;
    if (this.symbolQuizIndex >= items.length) {
      // Selesai
      if (window.labAudio) window.labAudio.playFanfare();
      container.innerHTML = `
        <div class="game-result-box">
          <div class="result-icon"><i class="fa-solid fa-trophy"></i></div>
          <h3>Kuis Kilat Selesai!</h3>
          <p>Total Skor Keselamatan K3 Kamu:</p>
          <div class="big-score">${this.symbolScore} Poin</div>
          <button class="btn btn-primary" onclick="window.labGames.initSymbolsGame()">
            <i class="fa-solid fa-rotate"></i> Main Lagi
          </button>
        </div>
      `;
      return;
    }

    const currentItem = items[this.symbolQuizIndex];
    this.symbolTimeLeft = 10;

    // Generate 4 options
    const otherItems = items.filter(it => it.id !== currentItem.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [currentItem, ...otherItems].sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <div class="symbol-quiz-header">
        <div class="quiz-round-badge">Simbol #${this.symbolQuizIndex + 1} dari ${items.length}</div>
        <div class="quiz-timer-bar">
          <i class="fa-regular fa-clock"></i> Sisa Waktu: <strong id="symbol-timer-num">${this.symbolTimeLeft}s</strong>
        </div>
        <div class="quiz-score-badge">Skor: ${this.symbolScore}</div>
      </div>

      <div class="symbol-quiz-card">
        <div class="symbol-large-img-wrap">
          <img src="${currentItem.gambar}" alt="${currentItem.nama}" class="symbol-quiz-img" />
        </div>
        <div class="symbol-clue">
          <span class="clue-badge"><i class="fa-solid fa-triangle-exclamation"></i> Petunjuk Kasus / Sifat Bahaya:</span>
          <p>"${currentItem.clue}"</p>
        </div>
      </div>

      <div class="symbol-options-grid">
        ${options.map(opt => `
          <button class="symbol-opt-btn" onclick="window.labGames.answerSymbol(${opt.id}, ${currentItem.id})">
            ${opt.nama}
          </button>
        `).join('')}
      </div>
    `;

    // Timer countdown
    this.symbolTimer = setInterval(() => {
      this.symbolTimeLeft--;
      const timerDisplay = document.getElementById('symbol-timer-num');
      if (timerDisplay) timerDisplay.innerText = `${this.symbolTimeLeft}s`;

      if (this.symbolTimeLeft <= 0) {
        clearInterval(this.symbolTimer);
        if (window.labAudio) window.labAudio.playWrong();
        this.symbolQuizIndex++;
        this.renderSymbolQuestion();
      }
    }, 1000);
  }

  answerSymbol(chosenId, correctId) {
    clearInterval(this.symbolTimer);
    if (chosenId === correctId) {
      if (window.labAudio) window.labAudio.playCorrect();
      this.symbolScore += (this.symbolTimeLeft * 10) + 50;
    } else {
      if (window.labAudio) window.labAudio.playWrong();
    }
    this.symbolQuizIndex++;
    setTimeout(() => this.renderSymbolQuestion(), 600);
  }

  // ================= 3. GAME: MEMORY LAB MATCHING CARDS =================
  initMemoryGame() {
    const grid = document.getElementById('memory-cards-grid');
    const moveDisplay = document.getElementById('memory-moves-count');
    if (!grid) return;

    this.flippedCards = [];
    this.matchedPairs = 0;
    this.memoryMoves = 0;
    if (moveDisplay) moveDisplay.innerText = '0';

    const sourceData = window.LAB_DATA.gameMatch.slice(0, 6); // 6 pairs = 12 cards
    const deck = [];

    // Create 2 identical visual cards per tool
    sourceData.forEach(item => {
      deck.push({ id: item.id, gambar: item.gambar, label: item.alat, key: item.id });
      deck.push({ id: item.id, gambar: item.gambar, label: item.alat, key: item.id });
    });

    this.memoryCards = deck.sort(() => Math.random() - 0.5);

    grid.innerHTML = this.memoryCards.map((card, idx) => `
      <div class="memory-card" id="mem-card-${idx}" data-idx="${idx}" onclick="window.labGames.flipCard(${idx})">
        <div class="card-inner">
          <div class="card-front">
            <i class="fa-solid fa-atom"></i>
            <span>IPA LAB</span>
          </div>
          <div class="card-back">
            <div class="mem-card-img-wrap">
              <img src="${card.gambar}" alt="${card.label}" class="memory-card-img" />
            </div>
            <strong class="mem-card-label">${card.label}</strong>
          </div>
        </div>
      </div>
    `).join('');
  }

  flipCard(idx) {
    const cardElem = document.getElementById(`mem-card-${idx}`);
    if (!cardElem || cardElem.classList.contains('flipped') || cardElem.classList.contains('matched')) return;
    if (this.flippedCards.length >= 2) return;

    if (window.labAudio) window.labAudio.playFlip();
    cardElem.classList.add('flipped');
    this.flippedCards.push({ idx, card: this.memoryCards[idx], elem: cardElem });

    if (this.flippedCards.length === 2) {
      this.memoryMoves++;
      const moveDisplay = document.getElementById('memory-moves-count');
      if (moveDisplay) moveDisplay.innerText = this.memoryMoves;

      const [first, second] = this.flippedCards;
      if (first.card.key === second.card.key && first.idx !== second.idx) {
        // Matched!
        setTimeout(() => {
          if (window.labAudio) window.labAudio.playCorrect();
          first.elem.classList.add('matched');
          second.elem.classList.add('matched');
          this.matchedPairs++;
          this.flippedCards = [];

          if (this.matchedPairs === 6) {
            if (window.labAudio) window.labAudio.playFanfare();
            if (window.confetti) window.confetti({ particleCount: 120, spread: 80 });
            alert(`🎉 Selamat! Kamu menyelesaikan Memory Card Lab dalam ${this.memoryMoves} langkah!`);
          }
        }, 500);
      } else {
        // Not matched
        setTimeout(() => {
          if (window.labAudio) window.labAudio.playWrong();
          first.elem.classList.remove('flipped');
          second.elem.classList.remove('flipped');
          this.flippedCards = [];
        }, 1000);
      }
    }
  }

  // ================= 4. GAME: FROGGY JUMP (CONTINUOUS RIVER PROGRESSION) =================
  initFroggyGame() {
    const overlay = document.getElementById('froggy-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // Bank 15 Soal Kurikulum IPA Laboratorium SMP Kelas VII (Sesuai Kuis Froggy Jumps Educaplay)
    this.froggyQuestions = [
      {
        question: "pH meter berfungsi untuk?",
        image: "img/tools/ph-meter.svg",
        options: [
          { text: "Mengukur pH / derajat keasaman larutan", isCorrect: true },
          { text: "Mengukur massa benda padat", isCorrect: false },
          { text: "Memanaskan cairan kimia", isCorrect: false }
        ]
      },
      {
        question: "Gelas ukur pada gambar berfungsi untuk ....",
        image: "img/tools/gelas-ukur.svg",
        options: [
          { text: "Mengukur volume zat cair secara presisi", isCorrect: true },
          { text: "Menampung cairan sangat panas", isCorrect: false },
          { text: "Menghaluskan serbuk kimia padat", isCorrect: false }
        ]
      },
      {
        question: "Tabung reaksi pada gambar digunakan untuk ....",
        image: "img/tools/tabung-reaksi.svg",
        options: [
          { text: "Mereaksikan zat dalam jumlah sedikit", isCorrect: true },
          { text: "Mengukur volume zat cair", isCorrect: false },
          { text: "Mengamati objek mikroskopis", isCorrect: false }
        ]
      },
      {
        question: "Alat laboratorium pada gambar di samping berfungsi untuk ....",
        image: "img/tools/mikroskop.svg",
        options: [
          { text: "Mengamati objek renik / mikroskopis", isCorrect: true },
          { text: "Menimbang massa benda kecil", isCorrect: false },
          { text: "Mengukur ketebalan tabung kaca", isCorrect: false }
        ]
      },
      {
        question: "Neraca Ohaus pada gambar berfungsi untuk ....",
        image: "img/tools/neraca-ohaus.svg",
        options: [
          { text: "Mengukur massa benda atau zat", isCorrect: true },
          { text: "Mengukur volume zat cair", isCorrect: false },
          { text: "Mengukur diameter tabung reaksi", isCorrect: false }
        ]
      },
      {
        question: "Jangka sorong pada gambar digunakan untuk ....",
        image: "img/tools/jangka-sorong.svg",
        options: [
          { text: "Mengukur diameter luar, dalam, & kedalaman", isCorrect: true },
          { text: "Mengukur massa sampel padat", isCorrect: false },
          { text: "Mengukur suhu larutan asam", isCorrect: false }
        ]
      },
      {
        question: "Kaki tiga dan kawat kasa berfungsi untuk ....",
        image: "img/tools/bunsen-spiritus.svg",
        options: [
          { text: "Menopang wadah saat proses pemanasan", isCorrect: true },
          { text: "Memadamkan api pembakar spiritus", isCorrect: false },
          { text: "Menyaring endapan larutan kimia", isCorrect: false }
        ]
      },
      {
        question: "Labu Erlenmeyer pada gambar berguna untuk ....",
        image: "img/tools/labu-erlenmeyer.svg",
        options: [
          { text: "Mencampur, menampung, & titrasi larutan", isCorrect: true },
          { text: "Mengukur massa zat serbuk", isCorrect: false },
          { text: "Memotong kaca preparat objek", isCorrect: false }
        ]
      },
      {
        question: "Pipet tetes berfungsi untuk ....",
        image: "img/tools/pipet-tetes.svg",
        options: [
          { text: "Memindahkan cairan dalam volume kecil / tetesan", isCorrect: true },
          { text: "Mengukur volume zat cair dalam jumlah besar", isCorrect: false },
          { text: "Mengaduk larutan panas", isCorrect: false }
        ]
      },
      {
        question: "Gelas kimia (Beaker Glass) pada laboratorium berfungsi untuk ....",
        image: "img/tools/gelas-kimia.svg",
        options: [
          { text: "Menampung, mencampur, & memanaskan larutan", isCorrect: true },
          { text: "Mengukur volume dengan ketelitian sangat tinggi", isCorrect: false },
          { text: "Mengamati sel bakteri di bawah cahaya", isCorrect: false }
        ]
      },
      {
        question: "Perhatikan gambar di samping! Arti simbol bahan kimia tersebut adalah ....",
        image: "img/k3/flammable.svg",
        options: [
          { text: "Bahan Mudah Terbakar (Flammable)", isCorrect: true },
          { text: "Bahaya Radiasi Atom", isCorrect: false },
          { text: "Bahan Beracun (Toxic)", isCorrect: false }
        ]
      },
      {
        question: "Perhatikan gambar di samping! Simbol ini menandakan zat kimia bersifat ....",
        image: "img/k3/toxic.svg",
        options: [
          { text: "Bahan Beracun (Toksik)", isCorrect: true },
          { text: "Mudah Meledak", isCorrect: false },
          { text: "Korosif Logam", isCorrect: false }
        ]
      },
      {
        question: "Simbol keselamatan kerja pada gambar menunjukkan bahan yang bersifat ....",
        image: "img/k3/corrosive.svg",
        options: [
          { text: "Bahan Korosif (Dapat merusak jaringan & logam)", isCorrect: true },
          { text: "Pengoksidasi Kuat", isCorrect: false },
          { text: "Iritasi Kulit Ringan", isCorrect: false }
        ]
      },
      {
        question: "Arti simbol bahaya laboratorium pada gambar di samping adalah ....",
        image: "img/k3/explosive.svg",
        options: [
          { text: "Mudah Meledak (Explosive)", isCorrect: true },
          { text: "Bahan Radioaktif", isCorrect: false },
          { text: "Mudah Menguap", isCorrect: false }
        ]
      },
      {
        question: "Cabang ilmu sains yang mempelajari kehidupan makhluk hidup adalah ....",
        image: "img/tools/mikroskop.svg",
        options: [
          { text: "Biologi", isCorrect: true },
          { text: "Kimia", isCorrect: false },
          { text: "Fisika", isCorrect: false }
        ]
      }
    ].sort(() => Math.random() - 0.5);

    // Randomize options for each question
    this.froggyQuestions.forEach(q => {
      q.options = [...q.options].sort(() => Math.random() - 0.5);
    });

    this.froggyIndex = 0;
    this.froggyLives = 5; // Standard Educaplay 5 lives
    this.froggyScore = 0;
    this.isJumping = false;
    
    this.updateFroggyUI();
    this.renderFroggyQuestion();
  }

  updateFroggyUI() {
    const livesCount = document.getElementById('froggy-lives-count');
    const scoreCount = document.getElementById('froggy-score-count');
    if (livesCount) livesCount.innerText = this.froggyLives;
    if (scoreCount) {
      scoreCount.innerText = this.froggyScore > 0 ? this.froggyScore.toLocaleString('id-ID') : '0';
    }
  }

  renderFroggyQuestion() {
    clearInterval(this.froggyTimer);
    this.isJumping = false;
    
    if (this.froggyLives <= 0 || this.froggyIndex >= this.froggyQuestions.length) {
      this.endFroggyGame();
      return;
    }

    const currentQ = this.froggyQuestions[this.froggyIndex];
    const qBox = document.getElementById('froggy-question-text');
    const qNum = document.getElementById('froggy-q-number');
    const qBadgeBottom = document.getElementById('froggy-q-badge-bottom');
    const lilypadsContainer = document.getElementById('lilypads-container');
    const frog = document.getElementById('frog-character');
    const bottomPad = document.querySelector('.lilypad-bottom');
    const frogContainer = document.querySelector('.frog-character-container');

    // Reset bottom base pad smoothly
    if (bottomPad) {
      bottomPad.style.transition = 'none';
      bottomPad.style.transform = 'translate(0, 0)';
      bottomPad.style.opacity = '1';
    }
    if (frogContainer) {
      frogContainer.style.transition = 'none';
      frogContainer.style.transform = 'translateX(-50%)';
    }
    
    // Reset Frog position seamlessly on the base lily pad with breathing idle animation
    if (frog) {
      frog.className = 'frog-character idling';
      frog.style.transition = 'none';
      frog.style.transform = 'translate(0, 0) scale(1)';
      frog.style.opacity = '1';
    }

    // Render Question & Image with smooth crossfade
    if (qBox) {
      qBox.style.opacity = '0';
      setTimeout(() => {
        if (currentQ.image) {
          qBox.innerHTML = `
            <div class="froggy-q-img-wrap">
              <img src="${currentQ.image}" alt="Soal" />
              <span class="zoom-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
            </div>
            <div class="froggy-q-text-body">${currentQ.question}</div>
          `;
        } else {
          qBox.innerHTML = `<div class="froggy-q-text-body">${currentQ.question}</div>`;
        }
        qBox.style.transition = 'opacity 0.3s ease';
        qBox.style.opacity = '1';
      }, 120);
    }

    if (qNum) qNum.innerText = `${this.froggyIndex + 1} / ${this.froggyQuestions.length}`;
    if (qBadgeBottom) qBadgeBottom.innerText = `${this.froggyIndex + 1}`;
    
    // Render the 3 Lilypads (A, B, C) matching Educaplay layout
    if (lilypadsContainer) {
      const labels = ['A', 'B', 'C'];
      lilypadsContainer.innerHTML = currentQ.options.map((opt, i) => `
        <div class="lilypad-wrapper entering" id="lilypad-wrap-${i}" style="animation-delay: ${i * 0.08}s">
          <div class="lilypad-badge">${labels[i]}</div>
          <div class="lilypad" id="lilypad-btn-${i}" onclick="window.labGames.answerFroggy(${opt.isCorrect}, ${i})">
            <svg class="lilypad-veins" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.2"/>
              <circle cx="80" cy="80" r="48" fill="none" stroke="rgba(255,255,255,0.11)" stroke-width="1.2"/>
              <path d="M80 10 L80 150 M10 80 L150 80 M30 30 L130 130 M30 130 L130 30" stroke="rgba(255,255,255,0.08)" stroke-width="1.2"/>
            </svg>
            <span class="lilypad-text">${opt.text}</span>
          </div>
        </div>
      `).join('');
    }

    this.froggyTimeLeft = 45;
    this.updateFroggyTimerUI();
    this.froggyTimer = setInterval(() => {
      this.froggyTimeLeft--;
      this.updateFroggyTimerUI();
      if (this.froggyTimeLeft <= 0) {
        clearInterval(this.froggyTimer);
        this.answerFroggy(false, -1, true);
      }
    }, 1000);
  }

  updateFroggyTimerUI() {
    const textSpan = document.getElementById('froggy-timer-text');
    if (textSpan) textSpan.innerText = `00:${this.froggyTimeLeft.toString().padStart(2, '0')}`;
  }

  answerFroggy(isCorrect, padIndex = 0, isTimeout = false) {
    if (this.isJumping) return;
    this.isJumping = true;
    clearInterval(this.froggyTimer);

    const frog = document.getElementById('frog-character');
    const chosenPadWrap = document.getElementById(`lilypad-wrap-${padIndex}`);
    const chosenPadBtn = document.getElementById(`lilypad-btn-${padIndex}`);
    const frogContainer = document.querySelector('.frog-character-container');
    const bottomPad = document.querySelector('.lilypad-bottom');

    if (frog) frog.classList.remove('idling');

    // Calculate dynamic coordinates of the target lilypad
    let targetX = 0;
    let targetY = -150;

    if (chosenPadWrap && frogContainer) {
      const padRect = chosenPadWrap.getBoundingClientRect();
      const frogRect = frogContainer.getBoundingClientRect();
      targetX = (padRect.left + padRect.width / 2) - (frogRect.left + frogRect.width / 2);
      targetY = (padRect.top + padRect.height / 2) - (frogRect.top + frogRect.height / 2) - 8;
    } else {
      const fallbackOffsets = [-160, 0, 160];
      const fallbackY = [-120, -190, -120];
      targetX = (padIndex >= 0 && padIndex < 3) ? fallbackOffsets[padIndex] : 0;
      targetY = (padIndex >= 0 && padIndex < 3) ? fallbackY[padIndex] : -140;
    }

    if (isCorrect) {
      // Play Jump Sound
      if (window.labAudio) window.labAudio.playJump();
      this.froggyScore += 1000;
      this.updateFroggyUI();
      
      // Step 1: Crouch anticipation (0 - 80ms)
      if (frog) {
        frog.style.transition = 'transform 0.08s ease-in';
        frog.style.transform = 'scale(1.18, 0.74)';
      }

      // Step 2: High arc leap through the air (80ms - 500ms)
      setTimeout(() => {
        if (frog) {
          frog.style.transition = 'transform 0.42s cubic-bezier(0.2, 0.85, 0.35, 1.2)';
          frog.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.92, 1.28)`;
        }
      }, 80);

      // Step 3: Landing squash on target lilypad (500ms - 620ms)
      setTimeout(() => {
        if (window.labAudio) window.labAudio.playCorrect();
        if (chosenPadBtn) chosenPadBtn.classList.add('correct-flash');
        if (frog) {
          frog.style.transition = 'transform 0.14s ease-out';
          frog.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.18, 0.84)`;
        }
      }, 500);

      // Step 4: Continuous River Progression System (680ms - 1300ms)
      // The frog and chosen pad advance forward down the river to become the new baseline pad!
      setTimeout(() => {
        // Accelerate water flow
        const waterLayer = document.querySelector('.water-bg-layer');
        if (waterLayer) {
          waterLayer.classList.remove('water-advancing');
          void waterLayer.offsetWidth; // Force reflow
          waterLayer.classList.add('water-advancing');
          setTimeout(() => waterLayer.classList.remove('water-advancing'), 850);
        }

        // Fade out unchosen lilypads
        document.querySelectorAll('.lilypad-wrapper').forEach((wrap, i) => {
          if (i !== padIndex) wrap.classList.add('fade-out');
        });

        // The chosen pad glides smoothly downward to the base anchor position
        if (chosenPadWrap) {
          chosenPadWrap.style.transition = 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.65s ease';
          chosenPadWrap.style.transform = `translate(${-targetX}px, ${Math.abs(targetY)}px)`;
        }

        // Frog glides continuously with the pad back to bottom center
        if (frog) {
          frog.style.transition = 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)';
          frog.style.transform = 'translate(0px, 0px) scale(1)';
        }

        // Old bottom base lilypad drifts away off the bottom screen
        if (bottomPad) {
          bottomPad.style.transition = 'all 0.6s ease-in';
          bottomPad.style.transform = 'translateY(180px) scale(0.8)';
          bottomPad.style.opacity = '0';
        }
      }, 680);
      
      // Step 5: Advance to Next Question and reveal fresh lilypads floating in
      setTimeout(() => {
        this.froggyIndex++;
        this.updateFroggyUI();
        this.renderFroggyQuestion();
      }, 1350);
      
    } else {
      // Wrong Answer Flow
      if (window.labAudio) window.labAudio.playJump();
      this.froggyLives--;
      this.updateFroggyUI();

      if (chosenPadBtn) chosenPadBtn.classList.add('wrong-flash');
      
      // Crouch
      if (frog) {
        frog.style.transition = 'transform 0.08s ease-in';
        frog.style.transform = 'scale(1.18, 0.74)';
      }

      // Leap towards pad but fall short into water
      setTimeout(() => {
        if (frog) {
          frog.style.transition = 'transform 0.42s ease-out';
          frog.style.transform = `translate(${targetX * 0.65}px, ${targetY * 0.6}px) scale(0.9)`;
        }
      }, 80);

      // Splash & sink into water
      setTimeout(() => {
        if (window.labAudio) {
          window.labAudio.playSplash();
          window.labAudio.playWrong();
        }
        if (frog) {
          frog.classList.add('frog-sink');
        }
      }, 480);
      
      // Re-emerge or End Game
      setTimeout(() => {
        if (this.froggyLives > 0) {
          if (frog) {
            frog.className = 'frog-character';
            frog.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            frog.style.transform = 'translate(0, 0) scale(1)';
            frog.style.opacity = '1';
            setTimeout(() => {
              frog.classList.add('idling');
              this.isJumping = false;
            }, 350);
          }
        } else {
          this.endFroggyGame();
        }
      }, 1250);
    }
  }

  endFroggyGame() {
    clearInterval(this.froggyTimer);
    this.isJumping = false;
    const overlay = document.getElementById('froggy-overlay');
    const title = document.getElementById('froggy-overlay-title');
    const desc = document.getElementById('froggy-overlay-desc');
    const finalScore = document.getElementById('froggy-final-score');
    const icon = document.getElementById('froggy-overlay-icon');

    if (overlay) {
      overlay.style.display = 'flex';
      if (finalScore) {
        finalScore.style.display = 'block';
        finalScore.innerText = `Skor Akhir: ${this.froggyScore.toLocaleString('id-ID')} Poin (${this.froggyIndex} Soal Berhasil)`;
      }
      
      if (this.froggyLives > 0) {
        if (window.labAudio) window.labAudio.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        if (icon) icon.innerHTML = '<i class="fa-solid fa-trophy" style="font-size: 3.5rem; color: #eab308;"></i>';
        if (title) title.innerText = 'Luar Biasa! Katak Berhasil Menyeberangi Kolam!';
        if (desc) desc.innerText = 'Selamat! Kamu telah menguasai seluruh materi Pengenalan Alat Laboratorium IPA dan Simbol K3 dengan sempurna!';
      } else {
        if (icon) icon.innerHTML = '<i class="fa-solid fa-water" style="font-size: 3.5rem; color: #38bdf8;"></i>';
        if (title) title.innerText = 'Game Over! Katak Kehabisan Nyawa';
        if (desc) desc.innerText = 'Jangan berkecil hati! Pelajari kembali fungsi alat laboratorium dan simbol K3, lalu coba lagi!';
      }
    }
  }

  toggleFroggyFullscreen() {
    const gameWrapper = document.getElementById('froggy-game-wrapper');
    if (!gameWrapper) return;

    if (!document.fullscreenElement) {
      if (gameWrapper.requestFullscreen) {
        gameWrapper.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}

window.labGames = new LabGames();

