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

  // ================= 4. GAME: FROGGY JUMP =================
  initFroggyGame() {
    const overlay = document.getElementById('froggy-overlay');
    if (overlay) overlay.style.display = 'none';
    
    // Bank 15 Soal Materi Laboratorium IPA & Hakikat Sains SMP Kelas VII
    this.froggyQuestions = [
      {
        question: "Ilmu yang mempelajari tentang serangga disebut ....",
        options: [
          { text: "entomologi", isCorrect: true },
          { text: "mikrobiologi", isCorrect: false },
          { text: "zoologi", isCorrect: false }
        ]
      },
      {
        question: "Alat laboratorium yang digunakan untuk mengukur massa benda dengan ketelitian tinggi adalah ....",
        options: [
          { text: "Neraca Ohaus", isCorrect: true },
          { text: "Gelas Ukur", isCorrect: false },
          { text: "Jangka Sorong", isCorrect: false }
        ]
      },
      {
        question: "Alat untuk mengukur volume zat cair secara presisi dan kuantitatif adalah ....",
        options: [
          { text: "Gelas Ukur", isCorrect: true },
          { text: "Labu Erlenmeyer", isCorrect: false },
          { text: "Gelas Kimia", isCorrect: false }
        ]
      },
      {
        question: "Alat yang digunakan untuk mengambil dan meneteskan cairan dalam volume kecil adalah ....",
        options: [
          { text: "Pipet Tetes", isCorrect: true },
          { text: "Corong Kaca", isCorrect: false },
          { text: "Batang Pengaduk", isCorrect: false }
        ]
      },
      {
        question: "Wadah berbentuk kerucut leher sempit untuk mencampur dan mengocok larutan tanpa tumpah adalah ....",
        options: [
          { text: "Labu Erlenmeyer", isCorrect: true },
          { text: "Gelas Beaker", isCorrect: false },
          { text: "Cawan Penguap", isCorrect: false }
        ]
      },
      {
        question: "Alat yang berfungsi untuk menjepit tabung reaksi dengan aman saat pemanasan adalah ....",
        options: [
          { text: "Penjepit Kayu", isCorrect: true },
          { text: "Pinset Besi", isCorrect: false },
          { text: "Klem Statif", isCorrect: false }
        ]
      },
      {
        question: "Alat ukur derajat panas atau suhu larutan di laboratorium disebut ....",
        options: [
          { text: "Termometer", isCorrect: true },
          { text: "Barometer", isCorrect: false },
          { text: "Higrometer", isCorrect: false }
        ]
      },
      {
        question: "Simbol bahaya berupa gambar tengkorak dan tulang bersilang menunjukkan sifat bahan ....",
        options: [
          { text: "Beracun (Toksik)", isCorrect: true },
          { text: "Mudah Terbakar", isCorrect: false },
          { text: "Mudah Meledak", isCorrect: false }
        ]
      },
      {
        question: "Kawat kasa yang dilapisi keramik di atas kaki tiga berfungsi untuk ....",
        options: [
          { text: "Meratakan Panas Api", isCorrect: true },
          { text: "Mendinginkan Tabung", isCorrect: false },
          { text: "Menyaring Larutan", isCorrect: false }
        ]
      },
      {
        question: "Alat laboratorium untuk menghaluskan zat padat kimia menjadi serbuk halus adalah ....",
        options: [
          { text: "Mortal & Alu", isCorrect: true },
          { text: "Kaca Arloji", isCorrect: false },
          { text: "Cawan Petri", isCorrect: false }
        ]
      },
      {
        question: "Alat optik yang digunakan untuk mengamati sel dan jaringan mikroorganisme renik adalah ....",
        options: [
          { text: "Mikroskop Cahaya", isCorrect: true },
          { text: "Kaca Pembesar (Lup)", isCorrect: false },
          { text: "Teleskop Optik", isCorrect: false }
        ]
      },
      {
        question: "Alat pelindung diri (APD) utama untuk melindungi mata dari percikan bahan kimia berbahaya adalah ....",
        options: [
          { text: "Kacamata Goggles", isCorrect: true },
          { text: "Masker Medis", isCorrect: false },
          { text: "Jas Laboratorium", isCorrect: false }
        ]
      },
      {
        question: "Cabang ilmu sains yang mempelajari tentang zat, materi, dan perubahannya adalah ....",
        options: [
          { text: "Ilmu Kimia", isCorrect: true },
          { text: "Ilmu Fisika", isCorrect: false },
          { text: "Ilmu Geologi", isCorrect: false }
        ]
      },
      {
        question: "Saat mata terkena percikan bahan kimia korosif, tindakan pertama yang wajib dilakukan adalah ....",
        options: [
          { text: "Bilas Air Mengalir Segera", isCorrect: true },
          { text: "Mengucek dengan Tisu", isCorrect: false },
          { text: "Menutup Mata Rapat", isCorrect: false }
        ]
      },
      {
        question: "Langkah pertama dalam metode ilmiah sebelum merumuskan hipotesis adalah ....",
        options: [
          { text: "Merumuskan Masalah", isCorrect: true },
          { text: "Melakukan Eksperimen", isCorrect: false },
          { text: "Menarik Kesimpulan", isCorrect: false }
        ]
      }
    ].sort(() => Math.random() - 0.5);

    // Randomize options for each question
    this.froggyQuestions.forEach(q => {
      q.options = [...q.options].sort(() => Math.random() - 0.5);
    });

    this.froggyIndex = 0;
    this.froggyLives = 3;
    this.froggyScore = 0;
    
    this.updateFroggyUI();
    this.renderFroggyQuestion();
  }

  updateFroggyUI() {
    const livesCount = document.getElementById('froggy-lives-count');
    const scoreCount = document.getElementById('froggy-score-count');
    if (livesCount) livesCount.innerText = this.froggyLives;
    if (scoreCount) scoreCount.innerText = this.froggyScore;
  }

  renderFroggyQuestion() {
    clearInterval(this.froggyTimer);
    
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
    
    if (frog) {
      frog.className = 'frog-character';
      frog.style.transform = 'translate(0, 0)';
    }

    if (qBox) qBox.innerText = currentQ.question;
    if (qNum) qNum.innerText = `${this.froggyIndex + 1} / ${this.froggyQuestions.length}`;
    if (qBadgeBottom) qBadgeBottom.innerText = `${this.froggyIndex + 1}`;
    
    if (lilypadsContainer) {
      const labels = ['A', 'B', 'C'];
      lilypadsContainer.innerHTML = currentQ.options.map((opt, i) => `
        <div class="lilypad-wrapper" id="lilypad-wrap-${i}">
          <div class="lilypad-badge">${labels[i]}</div>
          <div class="lilypad" id="lilypad-btn-${i}" onclick="window.labGames.answerFroggy(${opt.isCorrect}, ${i})">
            ${opt.text}
          </div>
        </div>
      `).join('');
    }

    this.froggyTimeLeft = 20;
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
    clearInterval(this.froggyTimer);
    const frog = document.getElementById('frog-character');
    const chosenPad = document.getElementById(`lilypad-btn-${padIndex}`);

    // Jump direction coordinates
    const jumpOffsets = [-150, 0, 150];
    const targetX = (padIndex >= 0 && padIndex < 3) ? jumpOffsets[padIndex] : 0;

    if (isCorrect) {
      if (window.labAudio) window.labAudio.playCorrect();
      this.froggyScore += 100;
      
      if (chosenPad) chosenPad.classList.add('correct-flash');

      if (frog) {
        frog.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        frog.style.transform = `translate(${targetX}px, -140px) scale(1.1)`;
      }
      
      setTimeout(() => {
        this.froggyIndex++;
        this.updateFroggyUI();
        this.renderFroggyQuestion();
      }, 700);
      
    } else {
      if (window.labAudio) window.labAudio.playWrong();
      this.froggyLives--;
      this.updateFroggyUI();

      if (chosenPad) chosenPad.classList.add('wrong-flash');
      
      if (frog) {
        frog.style.transition = 'transform 0.4s ease-out';
        frog.style.transform = `translate(${targetX}px, -90px) scale(0.9)`;
        setTimeout(() => {
          frog.classList.add('frog-sink');
        }, 400);
      }
      
      setTimeout(() => {
        if (this.froggyLives > 0) {
          this.renderFroggyQuestion();
        } else {
          this.endFroggyGame();
        }
      }, 1200);
    }
  }

  endFroggyGame() {
    clearInterval(this.froggyTimer);
    const overlay = document.getElementById('froggy-overlay');
    const title = document.getElementById('froggy-overlay-title');
    const desc = document.getElementById('froggy-overlay-desc');
    const finalScore = document.getElementById('froggy-final-score');
    const icon = document.getElementById('froggy-overlay-icon');

    if (overlay) {
      overlay.style.display = 'flex';
      if (finalScore) {
        finalScore.style.display = 'block';
        finalScore.innerText = `Skor Akhir: ${this.froggyScore} Poin (${this.froggyIndex} Soal Terjawab)`;
      }
      
      if (this.froggyLives > 0) {
        if (window.labAudio) window.labAudio.playFanfare();
        if (window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        if (icon) icon.innerHTML = '<i class="fa-solid fa-trophy" style="font-size: 3.5rem; color: #eab308;"></i>';
        if (title) title.innerText = 'Luar Biasa! Katak Berhasil Menyeberang!';
        if (desc) desc.innerText = 'Kamu berhasil menguasai materi laboratorium IPA dan sains dengan sangat baik!';
      } else {
        if (icon) icon.innerHTML = '<i class="fa-solid fa-water" style="font-size: 3.5rem; color: #38bdf8;"></i>';
        if (title) title.innerText = 'Game Over! Katak Kehabisan Nyawa';
        if (desc) desc.innerText = 'Jangan berkecil hati, ayo pelajari kembali materi alat lab & K3 lalu coba lagi!';
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

