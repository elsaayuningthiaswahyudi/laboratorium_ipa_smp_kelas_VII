// Evaluation & Assessment Engine with Certificate Generator

class LabEvaluation {
  constructor() {
    this.studentName = "";
    this.studentClass = "";
    this.currentIndex = 0;
    this.userAnswers = {}; // { questionId: 'A' }
    this.timeLeft = 20 * 60; // 20 minutes in seconds
    this.timerInterval = null;
    this.isSubmitted = false;
    this.score = 0;
  }

  startQuiz() {
    const nameInput = document.getElementById('eval-student-name');
    const classInput = document.getElementById('eval-student-class');

    const currentUser = window.labAuth ? window.labAuth.getCurrentUser() : null;
    const typedName = nameInput ? nameInput.value.trim() : '';
    const selectedClass = classInput ? classInput.value.trim() : '';

    if (typedName) {
      this.studentName = typedName;
      this.studentClass = selectedClass || (currentUser?.class || "VII-A");
    } else if (currentUser && currentUser.role === 'student' && currentUser.name) {
      this.studentName = currentUser.name;
      this.studentClass = currentUser.class || "VII-A";
    } else {
      alert("⚠️ Harap isi Nama Lengkap Siswa terlebih dahulu sebelum mulai mengerjakan evaluasi!");
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Sync input fields for consistency
    if (nameInput) nameInput.value = this.studentName;
    if (classInput) classInput.value = this.studentClass;

    if (window.labAudio) window.labAudio.playClick();

    document.getElementById('eval-start-screen').style.display = 'none';
    document.getElementById('eval-quiz-screen').style.display = 'block';
    document.getElementById('eval-result-screen').style.display = 'none';

    this.currentIndex = 0;
    this.userAnswers = {};
    this.isSubmitted = false;
    this.score = 0;
    this.timeLeft = 20 * 60;

    this.renderQuestion();
    this.renderNavigator();
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        alert("⏱️ Waktu evaluasi telah habis! Jawabanmu akan dikirim secara otomatis.");
        this.submitQuiz();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const display = document.getElementById('quiz-timer-display');
    if (!display) return;

    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  renderQuestion() {
    const questions = window.LAB_DATA.soalEvaluasi;
    const q = questions[this.currentIndex];
    const container = document.getElementById('eval-question-container');
    if (!container || !q) return;

    const selectedOpt = this.userAnswers[q.id];

    container.innerHTML = `
      <div class="eval-q-card">
        <div class="eval-q-header">
          <span class="badge-accent">Soal Nomor ${this.currentIndex + 1} dari ${questions.length}</span>
          <span class="q-type-tag"><i class="fa-solid fa-brain"></i> HOTS / Pemahaman Sains</span>
        </div>
        <div class="eval-q-text">${q.soal}</div>
        ${q.gambar ? `
          <div class="eval-q-media">
            <img src="${q.gambar}" alt="Simbol Soal ${q.id}" class="eval-q-img" />
          </div>
        ` : ''}
        <div class="eval-options-list">
          ${q.pilihan.map(opt => `
            <div class="eval-option-item ${selectedOpt === opt.id ? 'selected' : ''}" onclick="window.labEvaluation.selectOption(${q.id}, '${opt.id}')">
              <div class="opt-letter">${opt.id}</div>
              <div class="opt-text">${opt.teks}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Update Navigation Buttons
    const prevBtn = document.getElementById('eval-btn-prev');
    const nextBtn = document.getElementById('eval-btn-next');
    const submitBtn = document.getElementById('eval-btn-submit');

    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) nextBtn.style.display = (this.currentIndex === questions.length - 1) ? 'none' : 'inline-flex';
    if (submitBtn) submitBtn.style.display = (this.currentIndex === questions.length - 1) ? 'inline-flex' : 'none';

    this.renderNavigator();
  }

  selectOption(qId, optId) {
    if (window.labAudio) window.labAudio.playClick();
    this.userAnswers[qId] = optId;
    this.renderQuestion();
  }

  goToQuestion(idx) {
    if (window.labAudio) window.labAudio.playClick();
    this.currentIndex = idx;
    this.renderQuestion();
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      if (window.labAudio) window.labAudio.playClick();
      this.currentIndex--;
      this.renderQuestion();
    }
  }

  nextQuestion() {
    const questions = window.LAB_DATA.soalEvaluasi;
    if (this.currentIndex < questions.length - 1) {
      if (window.labAudio) window.labAudio.playClick();
      this.currentIndex++;
      this.renderQuestion();
    }
  }

  renderNavigator() {
    const navGrid = document.getElementById('eval-number-nav-grid');
    if (!navGrid) return;

    const questions = window.LAB_DATA.soalEvaluasi;
    navGrid.innerHTML = questions.map((q, idx) => {
      const isAnswered = this.userAnswers[q.id] !== undefined;
      const isCurrent = idx === this.currentIndex;
      let statusClass = '';
      if (isCurrent) statusClass += ' current';
      if (isAnswered) statusClass += ' answered';

      return `
        <button class="eval-num-btn ${statusClass}" onclick="window.labEvaluation.goToQuestion(${idx})">
          ${idx + 1}
        </button>
      `;
    }).join('');
  }

  submitQuiz() {
    if (this.isSubmitted) return;
    this.isSubmitted = true;
    clearInterval(this.timerInterval);
    if (window.labAudio) window.labAudio.playFanfare();

    const questions = window.LAB_DATA.soalEvaluasi;
    let correctCount = 0;

    questions.forEach(q => {
      if (this.userAnswers[q.id] === q.kunci) {
        correctCount++;
      }
    });

    this.score = Math.round((correctCount / questions.length) * 100);
    this.isSubmitted = true;

    // Show Result Screen
    document.getElementById('eval-quiz-screen').style.display = 'none';
    document.getElementById('eval-result-screen').style.display = 'block';

    const scoreDisplay = document.getElementById('eval-score-number');
    const resultBadge = document.getElementById('eval-result-badge');
    const correctStats = document.getElementById('eval-correct-stats');
    const studentMeta = document.getElementById('eval-result-student-meta');

    if (scoreDisplay) scoreDisplay.innerText = this.score;
    if (correctStats) correctStats.innerText = `${correctCount} Benar dari ${questions.length} Soal (${questions.length - correctCount} Salah)`;
    if (studentMeta) studentMeta.innerText = `Nama: ${this.studentName} | Kelas: ${this.studentClass}`;

    const isPassed = this.score >= 75;
    if (resultBadge) {
      resultBadge.className = `eval-status-pill ${isPassed ? 'passed' : 'remedial'}`;
      resultBadge.innerHTML = isPassed ? '<i class="fa-solid fa-circle-check"></i> LULUS / TUNTAS KOMPETENSI' : '<i class="fa-solid fa-circle-exclamation"></i> PERLU PENGAYAAN / REMEDIAL';
    }

    if (isPassed && window.confetti) {
      window.confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }

    // Send directly to Google Sheets Cloud Database (GET query parameter works seamlessly without CORS blocks)
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBtrp23zHaJ3lF53T134rCqNP1uwz94IPdGD_pEuJiDphqdSOYuvQDnKtvjMvoo0Ar/exec";
    try {
      const params = new URLSearchParams({
        nama: this.studentName,
        kelas: this.studentClass,
        nilai: this.score,
        benar: correctCount,
        totalSoal: questions.length,
        action: 'save'
      });
      fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store'
      }).catch(() => {});
    } catch (e) {}

    // Automatically record to Teacher Dashboard
    if (window.labDashboard) {
      window.labDashboard.recordEvaluation({
        name: this.studentName,
        studentClass: this.studentClass,
        score: this.score,
        correctCount: correctCount,
        totalQuestions: questions.length
      });
    }

    // Render Review of all questions with explanations
    this.renderReviewList();

    // Generate Certificate Preview
    this.generateCertificateCanvas();
  }

  renderReviewList() {
    const reviewList = document.getElementById('eval-review-container');
    if (!reviewList) return;

    const questions = window.LAB_DATA.soalEvaluasi;
    reviewList.innerHTML = questions.map((q, idx) => {
      const userAns = this.userAnswers[q.id] || "Tidak Dijawab";
      const isCorrect = userAns === q.kunci;

      return `
        <div class="review-item-card ${isCorrect ? 'correct' : 'wrong'}">
          <div class="review-item-header">
            <span class="badge-num">${idx + 1}</span>
            <span class="review-verdict">${isCorrect ? '<i class="fa-solid fa-check"></i> Jawaban Benar' : '<i class="fa-solid fa-xmark"></i> Jawaban Salah'}</span>
          </div>
          <p class="review-q-text">${q.soal}</p>
          ${q.gambar ? `
            <div class="review-q-media">
              <img src="${q.gambar}" alt="Simbol Soal ${q.id}" class="review-q-img" />
            </div>
          ` : ''}
          <div class="review-answers">
            <div><strong>Jawaban Kamu:</strong> <span class="${isCorrect ? 'text-green' : 'text-red'}">${userAns}</span></div>
            <div><strong>Kunci Jawaban:</strong> <span class="text-green font-bold">${q.kunci}</span></div>
          </div>
          <div class="review-explanation">
            <strong><i class="fa-solid fa-lightbulb"></i> Pembahasan:</strong>
            <p>${q.pembahasan}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  generateCertificateCanvas() {
    const canvas = document.getElementById('certificate-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 850;

    // Background Gradient (Cyber Science Dark-Cyan)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 850);
    bgGrad.addColorStop(0, '#0a192f');
    bgGrad.addColorStop(0.5, '#0f3460');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 850);

    // Decorative Borders
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 1140, 790);

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 1110, 760);

    // Gold/Cyan Seal / Header
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERTIFIKAT KELULUSAN KOMPETENSI', 600, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Poppins, sans-serif';
    ctx.fillText('MEDIA PEMBELAJARAN INTERAKTIF LABORATORIUM IPA KELAS VII SMP', 600, 150);

    // Awarded To
    ctx.fillStyle = '#a0aec0';
    ctx.font = '16px Poppins, sans-serif';
    ctx.fillText('Diberikan dengan bangga kepada:', 600, 230);

    // Student Name
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 44px Outfit, sans-serif';
    ctx.fillText(this.studentName.toUpperCase(), 600, 300);

    // Class & Statement
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px Poppins, sans-serif';
    ctx.fillText(`Kelas: ${this.studentClass}`, 600, 345);

    ctx.font = '18px Poppins, sans-serif';
    ctx.fillText('Telah menyelesaikan Pembelajaran dan Evaluasi Pengenalan Alat Laboratorium IPA,', 600, 420);
    ctx.fillText('Keselamatan Kerja (K3), dan Praktikum Virtual Fase D Kurikulum Merdeka.', 600, 455);

    // Score Box
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.roundRect(450, 500, 300, 100, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillText(`NILAI: ${this.score} / 100`, 600, 560);

    // Footer Signatures & Date
    const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = '#a0aec0';
    ctx.font = '15px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Diterbitkan pada: ${today}`, 100, 720);
    ctx.fillText('Kode Sertifikat: LAB-IPA-VII-' + Math.floor(100000 + Math.random() * 900000), 100, 745);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Guru Pengampu IPA / Laboran', 1100, 700);
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillText('( Elsa Ayuningthias Wahyudi, S.Pd. )', 1100, 760);
  }

  downloadCertificate() {
    if (window.labAudio) window.labAudio.playCorrect();
    const canvas = document.getElementById('certificate-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `Sertifikat_Laboratorium_IPA_${this.studentName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

window.labEvaluation = new LabEvaluation();
