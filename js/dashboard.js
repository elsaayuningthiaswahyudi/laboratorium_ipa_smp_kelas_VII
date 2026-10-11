// Teacher Dashboard Controller & Real-Time Data Engine

class LabDashboard {
  constructor() {
    this.EVAL_STORAGE_KEY = 'ipa_lab_evaluations';
    this.LKPD_STORAGE_KEY = 'ipa_lab_lkpd_submissions';
    this.GAMES_STORAGE_KEY = 'ipa_lab_games_submissions';

    this.evaluations = [];
    this.lkpdSubmissions = [];
    this.gameSubmissions = [];

    this.currentClassFilter = 'all';
    this.currentGameFilter = 'all';
    this.searchKeyword = '';
    this.isSyncing = false;
    this.pollInterval = null;

    this.init();
  }

  getDefaultEvaluations() {
    return [
      { id: 101, timestamp: "20/09/2026 14:10", studentName: "Ahmad Fauzi", studentClass: "VII-A", score: 93, correctCount: 14, totalQuestions: 15, isPassed: true },
      { id: 102, timestamp: "20/09/2026 14:15", studentName: "Siti Rahmawati", studentClass: "VII-A", score: 87, correctCount: 13, totalQuestions: 15, isPassed: true },
      { id: 103, timestamp: "20/09/2026 14:22", studentName: "Budi Pratama", studentClass: "VII-B", score: 60, correctCount: 9, totalQuestions: 15, isPassed: false },
      { id: 104, timestamp: "20/09/2026 14:28", studentName: "Dewi Lestari", studentClass: "VII-A", score: 100, correctCount: 15, totalQuestions: 15, isPassed: true },
      { id: 105, timestamp: "20/09/2026 14:35", studentName: "Rian Hidayat", studentClass: "VII-C", score: 80, correctCount: 12, totalQuestions: 15, isPassed: true },
      { id: 106, timestamp: "20/09/2026 14:40", studentName: "Annisa Putri", studentClass: "VII-B", score: 73, correctCount: 11, totalQuestions: 15, isPassed: false }
    ];
  }

  getDefaultLKPD() {
    return [
      {
        id: 201,
        timestamp: "20/09/2026 14:12",
        studentName: "Ahmad Fauzi",
        studentClass: "VII-A",
        jawaban1: "Makrometer digunakan untuk menaikkan/menurunkan meja preparat secara cepat, sedangkan mikrometer digunakan untuk mempertajam fokus objek.",
        jawaban2: "Air jeruk dan cuka bersifat asam (merah), air garam netral, sedangkan air sabun dan kapur sirih bersifat basa (biru).",
        wells: [
          { id: 1, sample: "Air Jeruk", indicator: "Lakmus Merah", color: "#ff7675", result: "Asam (Tetap Merah)" },
          { id: 2, sample: "Air Sabun", indicator: "Lakmus Merah", color: "#74b9ff", result: "Basa (Berubah Biru)" }
        ]
      },
      {
        id: 202,
        timestamp: "20/09/2026 14:20",
        studentName: "Dewi Lestari",
        studentClass: "VII-A",
        jawaban1: "Perbesaran diatur dengan memutar revolver lensa objektif mulai dari 4x, 10x, hingga 40x.",
        jawaban2: "Lakmus merah tetap merah pada asam, dan berubah biru pada basa.",
        wells: [
          { id: 1, sample: "Asam Cuka", indicator: "Lakmus Biru", color: "#ff7675", result: "Asam (Berubah Merah)" }
        ]
      }
    ];
  }

  getDefaultGames() {
    return [
      {
        id: "game_demo_1",
        timestamp: "20/09/2026 14:05",
        studentName: "Ahmad Fauzi",
        studentClass: "VII-A",
        gameId: "froggy",
        gameTitle: "Game 4: Froggy Jumps IPA",
        score: 12000,
        maxScore: 15000,
        details: "12/15 Soal (Lolos Menyeberang)",
        stars: 3,
        badge: "Penjelajah Teratai"
      },
      {
        id: "game_demo_2",
        timestamp: "20/09/2026 14:18",
        studentName: "Dewi Lestari",
        studentClass: "VII-A",
        gameId: "match",
        gameTitle: "Game 1: Cocokkan Alat & Fungsi",
        score: 100,
        maxScore: 100,
        details: "6/6 Alat Terpasang Tepat",
        stars: 3,
        badge: "Ahli Alat Lab"
      },
      {
        id: "game_demo_3",
        timestamp: "20/09/2026 14:25",
        studentName: "Siti Rahmawati",
        studentClass: "VII-A",
        gameId: "symbols",
        gameTitle: "Game 2: Kuis Kilat Simbol K3",
        score: 850,
        maxScore: 1000,
        details: "8/8 Simbol Tuntas Cepat",
        stars: 3,
        badge: "Pakar K3 Lab"
      },
      {
        id: "game_demo_4",
        timestamp: "20/09/2026 14:32",
        studentName: "Budi Pratama",
        studentClass: "VII-B",
        gameId: "memory",
        gameTitle: "Game 3: Memory Lab Cards",
        score: 80,
        maxScore: 100,
        details: "Selesai dalam 12 Langkah",
        stars: 2,
        badge: "Memori Tajam"
      },
      {
        id: "game_demo_5",
        timestamp: "20/09/2026 14:45",
        studentName: "Rian Hidayat",
        studentClass: "VII-C",
        gameId: "froggy",
        gameTitle: "Game 4: Froggy Jumps IPA",
        score: 9000,
        maxScore: 15000,
        details: "9 Soal Berhasil (Sisa Nyawa: 2)",
        stars: 2,
        badge: "Penjelajah Teratai"
      }
    ];
  }

  init() {
    this.loadData();
    this.setupBroadcastChannel();
    this.setupStorageListener();
    this.renderDashboard();
    this.fetchServerData();
    this.startAutoSync();
  }

  setupBroadcastChannel() {
    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('ipa_lab_sync_channel');
        this.channel.onmessage = (event) => {
          if (event.data && (event.data.type === 'SYNC' || event.data.type === 'NEW_EVAL' || event.data.type === 'NEW_LKPD' || event.data.type === 'NEW_GAME_SCORE')) {
            this.loadData();
            this.renderDashboard();
            if (event.data.studentName && window.labAuth && window.labAuth.isTeacher()) {
              if (event.data.type === 'NEW_GAME_SCORE') {
                window.labAuth.showToast(`🎮 Skor Game Masuk: ${event.data.studentName} (${event.data.gameTitle || 'Mini Game'} - ${event.data.score} Pts)`);
              } else {
                window.labAuth.showToast(`📥 Data Masuk: ${event.data.studentName} (${event.data.studentClass || 'Siswa'})`);
              }
            }
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported:", e);
    }
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.EVAL_STORAGE_KEY || e.key === this.LKPD_STORAGE_KEY || e.key === this.GAMES_STORAGE_KEY) {
        this.loadData();
        this.renderDashboard();
      }
    });
  }

  parseTimestamp(ts) {
    if (!ts) return 0;
    try {
      if (typeof ts === 'number') return ts;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d.getTime();

      const clean = String(ts).replace(/\./g, ':');
      const parts = clean.split(/[ ,]+/);
      if (parts.length >= 2) {
        const dateParts = parts[0].split('/');
        const timeParts = parts[1].split(':');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const year = parseInt(dateParts[2], 10);
          const hour = parseInt(timeParts[0], 10) || 0;
          const min = parseInt(timeParts[1], 10) || 0;
          const sec = parseInt(timeParts[2], 10) || 0;
          const parsed = new Date(year, month, day, hour, min, sec);
          if (!isNaN(parsed.getTime())) return parsed.getTime();
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  startAutoSync() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.fetchServerData(false);
    }, 4000);
  }

  deduplicateList(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];
    list.forEach(item => {
      if (!item || !item.studentName) return;
      const key = `${item.studentName.toLowerCase().trim()}_${(item.studentClass || '').trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    });
    return result;
  }

  loadData() {
    try {
      const savedEval = localStorage.getItem(this.EVAL_STORAGE_KEY);
      if (savedEval !== null && savedEval !== undefined && savedEval !== "") {
        const parsed = JSON.parse(savedEval);
        this.evaluations = this.deduplicateList(Array.isArray(parsed) && parsed.length > 0 ? parsed : this.getDefaultEvaluations());
      } else {
        this.evaluations = this.getDefaultEvaluations();
        this.saveData();
      }

      const savedLkpd = localStorage.getItem(this.LKPD_STORAGE_KEY);
      if (savedLkpd !== null && savedLkpd !== undefined && savedLkpd !== "") {
        const parsedLkpd = JSON.parse(savedLkpd);
        this.lkpdSubmissions = Array.isArray(parsedLkpd) && parsedLkpd.length > 0 ? parsedLkpd : this.getDefaultLKPD();
      } else {
        this.lkpdSubmissions = this.getDefaultLKPD();
        this.saveData();
      }

      const savedGames = localStorage.getItem(this.GAMES_STORAGE_KEY);
      if (savedGames !== null && savedGames !== undefined && savedGames !== "") {
        const parsedGames = JSON.parse(savedGames);
        this.gameSubmissions = Array.isArray(parsedGames) && parsedGames.length > 0 ? parsedGames : this.getDefaultGames();
      } else {
        this.gameSubmissions = this.getDefaultGames();
        this.saveData();
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
      if (!this.evaluations || this.evaluations.length === 0) this.evaluations = this.getDefaultEvaluations();
      if (!this.lkpdSubmissions || this.lkpdSubmissions.length === 0) this.lkpdSubmissions = this.getDefaultLKPD();
      if (!this.gameSubmissions || this.gameSubmissions.length === 0) this.gameSubmissions = this.getDefaultGames();
    }
  }

  saveData() {
    try {
      this.evaluations = this.deduplicateList(this.evaluations);
      localStorage.setItem(this.EVAL_STORAGE_KEY, JSON.stringify(this.evaluations));
      localStorage.setItem(this.LKPD_STORAGE_KEY, JSON.stringify(this.lkpdSubmissions));
      localStorage.setItem(this.GAMES_STORAGE_KEY, JSON.stringify(this.gameSubmissions));
    } catch (e) {
      console.error("Error saving local dashboard data:", e);
    }
  }

  mergeEvaluations(serverEvals) {
    if (!Array.isArray(serverEvals) || serverEvals.length === 0) return;
    const map = new Map();
    this.evaluations.forEach(item => {
      if (item && item.studentName) {
        const key = `${item.studentName.toLowerCase().trim()}_${(item.studentClass || '').trim()}`;
        map.set(key, item);
      }
    });
    serverEvals.forEach(item => {
      if (item && item.studentName) {
        const key = `${item.studentName.toLowerCase().trim()}_${(item.studentClass || '').trim()}`;
        map.set(key, item);
      }
    });
    this.evaluations = Array.from(map.values()).sort((a, b) => {
      const timeA = this.parseTimestamp(a.timestamp) || (typeof a.id === 'number' ? a.id : 0);
      const timeB = this.parseTimestamp(b.timestamp) || (typeof b.id === 'number' ? b.id : 0);
      return timeB - timeA;
    });

    this.saveData();
    this.renderMetrics();
    this.renderEvaluationTable();
  }

  mergeLKPDs(serverLkpds) {
    if (!Array.isArray(serverLkpds) || serverLkpds.length === 0) return;
    const map = new Map();
    serverLkpds.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    this.lkpdSubmissions.forEach(item => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    this.lkpdSubmissions = Array.from(map.values()).sort((a, b) => {
      const timeA = this.parseTimestamp(a.timestamp) || (typeof a.id === 'number' ? a.id : 0);
      const timeB = this.parseTimestamp(b.timestamp) || (typeof b.id === 'number' ? b.id : 0);
      return timeB - timeA;
    });
    this.saveData();
    this.renderMetrics();
    this.renderLKPDTable();
  }

  mergeGames(serverGames) {
    if (!Array.isArray(serverGames) || serverGames.length === 0) return;
    const map = new Map();
    serverGames.forEach(item => {
      if (item && item.id) map.set(String(item.id), item);
    });
    this.gameSubmissions.forEach(item => {
      if (item && item.id && !map.has(String(item.id))) {
        map.set(String(item.id), item);
      }
    });
    this.gameSubmissions = Array.from(map.values()).sort((a, b) => {
      const timeA = this.parseTimestamp(a.timestamp) || 0;
      const timeB = this.parseTimestamp(b.timestamp) || 0;
      return timeB - timeA;
    });
    this.saveData();
    this.renderMetrics();
    this.renderGameSubmissionsTable();
  }

  async fetchServerData(notify = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBtrp23zHaJ3lF53T134rCqNP1uwz94IPdGD_pEuJiDphqdSOYuvQDnKtvjMvoo0Ar/exec";

    try {
      // 1. Fetch from Google Sheets API
      try {
        const sheetRes = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store'
        });
        if (sheetRes.ok) {
          const sheetJson = await sheetRes.json();
          if (sheetJson.status === 'success' && Array.isArray(sheetJson.data) && sheetJson.data.length > 0) {
            const mapped = sheetJson.data.map((item, idx) => {
              const score = Number(item.nilai) || 0;
              const correct = Number(item.benar) || 0;
              const total = Number(item.totalSoal) || 15;
              return {
                id: `gs_${(item.nama || 'siswa')}_${(item.kelas || '')}_${idx}_${(item.timestamp || '').replace(/[^a-zA-Z0-9]/g, '')}`,
                timestamp: item.timestamp || new Date().toLocaleString('id-ID'),
                studentName: item.nama || 'Siswa',
                studentClass: item.kelas || 'VII-A',
                score: score,
                correctCount: correct,
                totalQuestions: total,
                isPassed: score >= 75
              };
            });
            this.mergeEvaluations(mapped);
          }
        }
      } catch (sheetErr) { }

      // 2. Local backend fallback
      try {
        const evalRes = await fetch('/api/evaluations', { cache: 'no-store' });
        if (evalRes.ok) {
          const data = await evalRes.json();
          if (Array.isArray(data) && data.length > 0) this.mergeEvaluations(data);
        }

        const lkpdRes = await fetch('/api/lkpd', { cache: 'no-store' });
        if (lkpdRes.ok) {
          const data = await lkpdRes.json();
          if (Array.isArray(data) && data.length > 0) this.mergeLKPDs(data);
        }

        const gamesRes = await fetch('/api/games', { cache: 'no-store' });
        if (gamesRes.ok) {
          const data = await gamesRes.json();
          if (Array.isArray(data) && data.length > 0) this.mergeGames(data);
        }
      } catch (localErr) { }

      this.renderMetrics();
      this.renderEvaluationTable();
      this.renderLKPDTable();
      this.renderGameSubmissionsTable();
      if (notify && window.labAuth) {
        window.labAuth.showToast("✅ Data Dashboard berhasil disinkronkan!");
      }
    } catch (e) {
      // Offline mode
    } finally {
      this.isSyncing = false;
    }
  }

  refreshData() {
    if (window.labAudio) window.labAudio.playClick();
    this.loadData();
    this.fetchServerData(true);
    this.renderDashboard();
  }

  // Record a new student evaluation result
  async recordEvaluation(evalData) {
    this.loadData();

    const record = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      studentName: evalData.name || 'Siswa Teladan',
      studentClass: evalData.studentClass || 'VII-A',
      score: typeof evalData.score === 'number' ? evalData.score : 0,
      correctCount: typeof evalData.correctCount === 'number' ? evalData.correctCount : 0,
      totalQuestions: typeof evalData.totalQuestions === 'number' ? evalData.totalQuestions : 15,
      isPassed: (evalData.score || 0) >= 75
    };

    // Prepend to local array
    this.evaluations = this.evaluations.filter(e => e.id !== record.id);
    this.evaluations.unshift(record);
    this.saveData();
    this.renderDashboard();

    // Broadcast across tabs
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'NEW_EVAL',
          studentName: record.studentName,
          studentClass: record.studentClass,
          data: record
        });
      } catch (e) { }
    }

    // Dual submission to Google Sheets
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBtrp23zHaJ3lF53T134rCqNP1uwz94IPdGD_pEuJiDphqdSOYuvQDnKtvjMvoo0Ar/exec";
    try {
      const params = new URLSearchParams({
        nama: record.studentName,
        kelas: record.studentClass,
        nilai: record.score,
        benar: record.correctCount,
        totalSoal: record.totalQuestions,
        action: 'save'
      });
      fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store'
      }).catch(() => { });
    } catch (e) { }

    try {
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          nama: record.studentName,
          kelas: record.studentClass,
          nilai: record.score,
          benar: record.correctCount,
          totalSoal: record.totalQuestions
        })
      }).catch(() => { });
    } catch (e) { }

    try {
      await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) { }
  }

  // Record or update LKPD submission (Auto-Save Real-Time & Manual Submit)
  async recordLKPD(lkpdData) {
    this.loadData();

    const studentName = (lkpdData.name || 'Siswa Peserta Didik').trim();
    const studentClass = (lkpdData.studentClass || 'VII-A').trim();

    // Cari apakah siswa sudah memiliki catatan LKPD (upsert agar tidak terjadi duplikasi)
    const existingIndex = this.lkpdSubmissions.findIndex(l => 
      l.studentName.toLowerCase().trim() === studentName.toLowerCase() &&
      l.studentClass === studentClass
    );

    const nowTimestamp = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const record = {
      id: existingIndex >= 0 ? this.lkpdSubmissions[existingIndex].id : ('lkpd_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      timestamp: nowTimestamp,
      studentName: studentName,
      studentClass: studentClass,
      jawaban1: lkpdData.jawaban1 || 'Prinsip mikroskop telah dipelajari.',
      jawaban2: lkpdData.jawaban2 || 'Hasil uji asam-basa telah diamati.',
      wells: Array.isArray(lkpdData.wells) ? lkpdData.wells : []
    };

    if (existingIndex >= 0) {
      this.lkpdSubmissions[existingIndex] = record;
    } else {
      this.lkpdSubmissions.unshift(record);
    }

    this.saveData();
    this.renderMetrics();
    this.renderLKPDTable();

    // Broadcast across tabs to inform teacher dashboard instantly
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'NEW_LKPD',
          studentName: record.studentName,
          studentClass: record.studentClass,
          data: record
        });
      } catch (e) { }
    }

    // Dual submission to Google Sheets
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBtrp23zHaJ3lF53T134rCqNP1uwz94IPdGD_pEuJiDphqdSOYuvQDnKtvjMvoo0Ar/exec";
    try {
      const params = new URLSearchParams({
        action: 'save_lkpd',
        nama: record.studentName,
        kelas: record.studentClass,
        jawaban1: record.jawaban1,
        jawaban2: record.jawaban2
      });
      fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store'
      }).catch(() => { });
    } catch (e) { }

    // POST to local API
    try {
      await fetch('/api/lkpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) { }

    return record;
  }

  // ================= 🎮 REKAM OUTPUT GAMIFIKASI KE DASHBOARD GURU =================
  async recordGameScore(gameData) {
    this.loadData();

    const user = (window.labAuth && window.labAuth.currentUser) ? window.labAuth.currentUser : null;
    const studentName = gameData.studentName || (user && user.role === 'student' ? user.name : 'Siswa Teladan');
    const studentClass = gameData.studentClass || (user && user.role === 'student' ? user.class : 'VII-A');

    const scoreNum = Number(gameData.score) || 0;
    let stars = 3;
    if (gameData.gameId === 'froggy') {
      stars = scoreNum >= 10000 ? 3 : (scoreNum >= 5000 ? 2 : 1);
    } else if (gameData.gameId === 'symbols') {
      stars = scoreNum >= 600 ? 3 : (scoreNum >= 350 ? 2 : 1);
    } else if (gameData.gameId === 'memory') {
      stars = scoreNum >= 85 ? 3 : (scoreNum >= 70 ? 2 : 1);
    } else {
      stars = scoreNum >= 80 ? 3 : 2;
    }

    const record = {
      id: 'game_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      studentName: studentName,
      studentClass: studentClass,
      gameId: gameData.gameId || 'froggy',
      gameTitle: gameData.gameTitle || 'Mini Game IPA',
      score: scoreNum,
      maxScore: gameData.maxScore || 100,
      details: gameData.details || 'Tuntas',
      stars: stars,
      badge: gameData.badge || 'Sains Explorer'
    };

    this.gameSubmissions.unshift(record);
    this.saveData();
    this.renderDashboard();

    // Broadcast across tabs to inform teacher dashboard instantly
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'NEW_GAME_SCORE',
          studentName: record.studentName,
          studentClass: record.studentClass,
          gameTitle: record.gameTitle,
          score: record.score,
          data: record
        });
      } catch (e) { }
    }

    // POST to local API
    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) { }

    // Show toast
    if (window.labAuth) {
      window.labAuth.showToast(`🎮 Skor Game (${record.gameTitle}) berhasil dikirim ke Dashboard Guru!`);
    }

    return record;
  }

  renderDashboard() {
    this.loadData();
    this.renderMetrics();
    this.renderEvaluationTable();
    this.renderLKPDTable();
    this.renderGameSubmissionsTable();
  }

  renderMetrics() {
    const totalStudentsElem = document.getElementById('dash-total-students');
    const avgScoreElem = document.getElementById('dash-avg-score');
    const passedCountElem = document.getElementById('dash-passed-count');
    const remedialCountElem = document.getElementById('dash-remedial-count');
    const totalLkpdElem = document.getElementById('dash-total-lkpd');
    const totalGamesElem = document.getElementById('dash-total-games');

    const totalEvals = this.evaluations.length;
    let avg = 0;
    let passed = 0;
    let remedial = 0;

    if (totalEvals > 0) {
      const sum = this.evaluations.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
      avg = Math.round(sum / totalEvals);
      passed = this.evaluations.filter(e => e.isPassed).length;
      remedial = totalEvals - passed;
    }

    if (totalStudentsElem) totalStudentsElem.innerText = totalEvals;
    if (avgScoreElem) avgScoreElem.innerText = avg;
    if (passedCountElem) passedCountElem.innerText = passed;
    if (remedialCountElem) remedialCountElem.innerText = remedial;
    if (totalLkpdElem) totalLkpdElem.innerText = this.lkpdSubmissions.length;
    if (totalGamesElem) totalGamesElem.innerText = this.gameSubmissions.length;
  }

  renderEvaluationTable() {
    const tbody = document.getElementById('dash-eval-tbody');
    if (!tbody) return;

    let filtered = this.evaluations;

    // Filter by class
    if (this.currentClassFilter !== 'all') {
      filtered = filtered.filter(e => e.studentClass === this.currentClassFilter);
    }

    // Filter by search
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(e =>
        (e.studentName && e.studentName.toLowerCase().includes(kw)) ||
        (e.studentClass && e.studentClass.toLowerCase().includes(kw))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.6rem; display: block; opacity: 0.6;"></i>
            Belum ada data evaluasi yang sesuai dengan filter '${this.currentClassFilter}'.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((e, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td><i class="fa-regular fa-clock text-muted"></i> ${e.timestamp}</td>
        <td><strong>${e.studentName}</strong></td>
        <td><span class="badge-class">${e.studentClass}</span></td>
        <td>
          <span class="score-badge ${e.isPassed ? 'high' : 'low'}">
            ${e.score} <small>/ 100</small>
          </span>
        </td>
        <td>
          <span class="status-pill ${e.isPassed ? 'status-pass' : 'status-fail'}">
            <i class="fa-solid ${e.isPassed ? 'fa-check' : 'fa-triangle-exclamation'}"></i> ${e.isPassed ? 'TUNTAS' : 'REMEDIAL'}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="dash-action-btn delete" onclick="window.labDashboard.deleteEvaluation('${e.id}')" title="Hapus Data">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderLKPDTable() {
    const tbody = document.getElementById('dash-lkpd-tbody');
    if (!tbody) return;

    let filtered = this.lkpdSubmissions;

    // Filter by class
    if (this.currentClassFilter !== 'all') {
      filtered = filtered.filter(l => l.studentClass === this.currentClassFilter);
    }

    // Filter by search keyword
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(l =>
        (l.studentName && l.studentName.toLowerCase().includes(kw)) ||
        (l.studentClass && l.studentClass.toLowerCase().includes(kw)) ||
        (l.jawaban1 && l.jawaban1.toLowerCase().includes(kw)) ||
        (l.jawaban2 && l.jawaban2.toLowerCase().includes(kw))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-file-circle-xmark" style="font-size: 2rem; margin-bottom: 0.6rem; display: block; opacity: 0.6;"></i>
            Belum ada LKPD yang sesuai dengan filter '${this.currentClassFilter}'.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((lkpd, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td><i class="fa-regular fa-clock text-muted"></i> ${lkpd.timestamp}</td>
        <td><strong>${lkpd.studentName}</strong></td>
        <td><span class="badge-class">${lkpd.studentClass}</span></td>
        <td>
          <span class="status-pill status-pass"><i class="fa-solid fa-circle-check"></i> Lengkap Terisi</span>
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="window.labDashboard.viewLKPDDetail('${lkpd.id}')" title="Tinjau Jawaban Siswa">
            <i class="fa-solid fa-eye"></i> Tinjau
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.labDashboard.downloadSingleLKPD('${lkpd.id}')" title="Unduh / Cetak Dokumen LKPD Ini">
            <i class="fa-solid fa-file-arrow-down"></i> Unduh / Cetak
          </button>
          <button class="dash-action-btn delete" onclick="window.labDashboard.deleteLKPD('${lkpd.id}')" title="Hapus LKPD">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // ================= RENDER TABEL HASIL MINI GAMES & GAMIFIKASI =================
  renderGameSubmissionsTable() {
    const tbody = document.getElementById('dash-games-tbody');
    if (!tbody) return;

    let filtered = this.gameSubmissions;

    // Filter by game type
    if (this.currentGameFilter && this.currentGameFilter !== 'all') {
      filtered = filtered.filter(g => g.gameId === this.currentGameFilter);
    }

    // Filter by class
    if (this.currentClassFilter !== 'all') {
      filtered = filtered.filter(g => g.studentClass === this.currentClassFilter);
    }

    // Filter by search keyword
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(g =>
        (g.studentName && g.studentName.toLowerCase().includes(kw)) ||
        (g.studentClass && g.studentClass.toLowerCase().includes(kw)) ||
        (g.gameTitle && g.gameTitle.toLowerCase().includes(kw)) ||
        (g.badge && g.badge.toLowerCase().includes(kw))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-gamepad" style="font-size: 2rem; margin-bottom: 0.6rem; display: block; opacity: 0.5;"></i>
            Belum ada data capaian mini game yang sesuai dengan filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((g, idx) => {
      // Game badge styling
      let gameClass = 'froggy';
      let icon = 'fa-frog';
      if (g.gameId === 'match') {
        gameClass = 'match';
        icon = 'fa-hand';
      } else if (g.gameId === 'symbols') {
        gameClass = 'symbols';
        icon = 'fa-bolt';
      } else if (g.gameId === 'memory') {
        gameClass = 'memory';
        icon = 'fa-clone';
      }

      // Stars rendering
      const starCount = Math.max(1, Math.min(3, g.stars || 3));
      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        if (s <= starCount) {
          starsHtml += '<i class="fa-solid fa-star"></i>';
        } else {
          starsHtml += '<i class="fa-solid fa-star star-empty"></i>';
        }
      }

      return `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td><i class="fa-regular fa-clock text-muted"></i> ${g.timestamp}</td>
          <td><strong>${g.studentName}</strong></td>
          <td style="text-align: center;"><span class="badge-class">${g.studentClass}</span></td>
          <td>
            <span class="badge-game ${gameClass}">
              <i class="fa-solid ${icon}"></i> ${g.gameTitle}
            </span>
          </td>
          <td style="text-align: center;">
            <span class="score-badge high">
              ${g.score.toLocaleString('id-ID')} <small class="text-muted">Pts</small>
            </span>
          </td>
          <td>
            <div>${g.details || 'Selesai'}</div>
            <div class="badge-lencana-tag"><i class="fa-solid fa-award text-yellow"></i> ${g.badge || 'Sains Explorer'}</div>
          </td>
          <td style="text-align: center;">
            <div class="star-rating" title="${starCount} Bintang">${starsHtml}</div>
          </td>
          <td style="text-align: center;">
            <button class="dash-action-btn delete" onclick="window.labDashboard.deleteGameSubmission('${g.id}')" title="Hapus Hasil Game">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterGameType(gameType) {
    if (window.labAudio) window.labAudio.playClick();
    this.currentGameFilter = gameType;

    document.querySelectorAll('.dash-gametype-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.game === gameType);
    });

    this.renderGameSubmissionsTable();
  }

  filterClass(className) {
    if (window.labAudio) window.labAudio.playClick();
    this.currentClassFilter = className;

    document.querySelectorAll('.dash-class-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.class === className);
    });

    this.renderEvaluationTable();
    this.renderGameSubmissionsTable();
    this.renderLKPDTable();
  }

  search(keyword) {
    this.searchKeyword = keyword.trim();
    this.renderEvaluationTable();
    this.renderGameSubmissionsTable();
    this.renderLKPDTable();
  }

  async deleteEvaluation(id) {
    if (confirm("Apakah Anda yakin ingin menghapus catatan nilai evaluasi ini?")) {
      this.evaluations = this.evaluations.filter(e => String(e.id) !== String(id));
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/delete-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id })
        });
      } catch (e) { }

      if (window.labAuth) window.labAuth.showToast("Data evaluasi berhasil dihapus.");
    }
  }

  async deleteLKPD(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data LKPD ini?")) {
      this.lkpdSubmissions = this.lkpdSubmissions.filter(l => String(l.id) !== String(id));
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/delete-lkpd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id })
        });
      } catch (e) { }

      if (window.labAuth) window.labAuth.showToast("Data LKPD berhasil dihapus.");
    }
  }

  async deleteGameSubmission(id) {
    if (confirm("Apakah Anda yakin ingin menghapus hasil permainan siswa ini?")) {
      this.gameSubmissions = this.gameSubmissions.filter(g => String(g.id) !== String(id));
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/delete-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id })
        });
      } catch (e) { }

      if (window.labAuth) window.labAuth.showToast("Hasil game siswa berhasil dihapus.");
    }
  }

  async clearAllData() {
    if (confirm("⚠️ PERINGATAN: Apakah Anda yakin ingin mengosongkan SEMUA data nilai evaluasi, LKPD, dan hasil mini games siswa?")) {
      this.evaluations = [];
      this.lkpdSubmissions = [];
      this.gameSubmissions = [];
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/clear-all', { method: 'POST' });
      } catch (e) { }

      if (this.channel) {
        try { this.channel.postMessage({ type: 'SYNC' }); } catch (e) { }
      }

      if (window.labAuth) window.labAuth.showToast("Seluruh data nilai, LKPD, dan game berhasil dikosongkan.");
    }
  }

  async injectDemoData(notify = true) {
    const demoEvals = this.getDefaultEvaluations();
    const demoLkpd = this.getDefaultLKPD();
    const demoGames = this.getDefaultGames();

    this.evaluations = demoEvals;
    this.lkpdSubmissions = demoLkpd;
    this.gameSubmissions = demoGames;
    this.saveData();
    this.renderDashboard();

    try {
      await fetch('/api/inject-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: demoEvals, lkpd: demoLkpd })
      });
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoGames[0])
      });
    } catch (e) { }

    if (notify && window.labAuth) {
      window.labAuth.showToast("Data demo siswa & mini games berhasil dimuat!");
    }
  }

  exportCSV() {
    if (this.evaluations.length === 0 && this.gameSubmissions.length === 0) {
      alert("⚠️ Belum ada data nilai atau game untuk diekspor!");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== REKAPITULASI NILAI EVALUASI KUIS IPA ===\n";
    csvContent += "No,Waktu Pengerjaan,Nama Siswa,Kelas,Nilai,Jumlah Benar,Total Soal,Status Kelulusan\n";

    this.evaluations.forEach((e, idx) => {
      csvContent += `${idx + 1},"${e.timestamp}","${e.studentName}","${e.studentClass}",${e.score},${e.correctCount},${e.totalQuestions},"${e.isPassed ? 'TUNTAS' : 'REMEDIAL'}"\n`;
    });

    csvContent += "\n=== REKAPITULASI HASIL MINI GAMES & GAMIFIKASI ===\n";
    csvContent += "No,Waktu Main,Nama Siswa,Kelas,Permainan,Skor/Poin,Detail Capaian,Bintang,Lencana\n";

    this.gameSubmissions.forEach((g, idx) => {
      csvContent += `${idx + 1},"${g.timestamp}","${g.studentName}","${g.studentClass}","${g.gameTitle}",${g.score},"${g.details}",${g.stars},"${g.badge}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_Laboratorium_IPA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.labAuth) window.labAuth.showToast("Rekap nilai berhasil diunduh (Format CSV/Excel)!");
  }

  printReport() {
    if (this.evaluations.length === 0) {
      alert("⚠️ Belum ada data nilai untuk dicetak!");
      return;
    }

    const printWin = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekapitulasi Hasil Evaluasi Laboratorium IPA - SMP</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 35px; color: #1e293b; font-size: 13px; }
          .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; color: #0369a1; text-transform: uppercase; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .meta { margin-bottom: 15px; font-size: 12px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .text-center { text-align: center; }
          .pass { color: #16a34a; font-weight: bold; }
          .fail { color: #dc2626; font-weight: bold; }
          .summary-box { display: flex; gap: 20px; margin-top: 20px; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; }
          .summary-item { flex: 1; text-align: center; }
          .summary-val { font-size: 18px; font-weight: bold; color: #0284c7; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Laporan Rekapitulasi Nilai Evaluasi Pembelajaran IPA</div>
          <div class="subtitle">Media Interaktif Laboratorium Sains & K3 — Kurikulum Merdeka Fase D Kelas VII</div>
        </div>

        <div class="meta">
          <div><strong>Tanggal Cetak:</strong> ${dateStr}</div>
          <div><strong>Pengajar:</strong> Guru IPA SMP</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" width="40">No</th>
              <th>Waktu Mengerjakan</th>
              <th>Nama Siswa</th>
              <th class="text-center">Kelas</th>
              <th class="text-center">Skor Nilai</th>
              <th class="text-center">Jawaban Benar</th>
              <th class="text-center">Status Kelulusan</th>
            </tr>
          </thead>
          <tbody>
            ${this.evaluations.map((e, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${e.timestamp}</td>
                <td><strong>${e.studentName}</strong></td>
                <td class="text-center">${e.studentClass}</td>
                <td class="text-center"><strong>${e.score}</strong></td>
                <td class="text-center">${e.correctCount} / ${e.totalQuestions}</td>
                <td class="text-center ${e.isPassed ? 'pass' : 'fail'}">${e.isPassed ? 'TUNTAS' : 'REMEDIAL'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-item">
            <div>Total Siswa</div>
            <div class="summary-val">${this.evaluations.length}</div>
          </div>
          <div class="summary-item">
            <div>Nilai Rata-rata</div>
            <div class="summary-val">${Math.round(this.evaluations.reduce((a, c) => a + Number(c.score || 0), 0) / (this.evaluations.length || 1))}</div>
          </div>
          <div class="summary-item">
            <div>Siswa Tuntas</div>
            <div class="summary-val">${this.evaluations.filter(e => e.isPassed).length}</div>
          </div>
          <div class="summary-item">
            <div>Perlu Remedial</div>
            <div class="summary-val">${this.evaluations.filter(e => !e.isPassed).length}</div>
          </div>
        </div>

        <div class="signatures">
          <div>
            Mengetahui,<br>Kepala Sekolah<br><br><br><br>
            __________________________
          </div>
          <div>
            Guru Mata Pelajaran IPA<br><br><br><br>
            __________________________
          </div>
        </div>
      </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 600);
  }

  // ================= 📄 DETAIL, TINJAU, CETAK & UNDUH LKPD =================
  viewLKPDDetail(id) {
    if (window.labAudio) window.labAudio.playClick();
    const lkpd = this.lkpdSubmissions.find(l => String(l.id) === String(id));
    if (!lkpd) return;

    const modal = document.getElementById('lkpd-detail-modal');
    if (!modal) {
      this.downloadSingleLKPD(id);
      return;
    }

    // Set Data to Modal
    const nameElem = document.getElementById('lkpd-modal-student-name');
    const classElem = document.getElementById('lkpd-modal-student-class');
    const timeElem = document.getElementById('lkpd-modal-timestamp');
    const jwb1Elem = document.getElementById('lkpd-modal-jawaban1');
    const jwb2Elem = document.getElementById('lkpd-modal-jawaban2');
    const wellsTbody = document.getElementById('lkpd-modal-wells-tbody');
    const dlBtn = document.getElementById('lkpd-modal-download-btn');

    if (nameElem) nameElem.innerText = lkpd.studentName;
    if (classElem) classElem.innerText = lkpd.studentClass;
    if (timeElem) timeElem.innerHTML = `<i class="fa-regular fa-clock"></i> ${lkpd.timestamp}`;
    if (jwb1Elem) jwb1Elem.innerText = lkpd.jawaban1 || 'Belum ada catatan analisis mikroskop.';
    if (jwb2Elem) jwb2Elem.innerText = lkpd.jawaban2 || 'Belum ada catatan kesimpulan asam-basa.';

    if (wellsTbody) {
      const wells = Array.isArray(lkpd.wells) && lkpd.wells.length > 0 ? lkpd.wells : [
        { id: 1, sample: "Air Perasan Jeruk Nipis", indicator: "Kertas Lakmus Merah", color: "#ff7675", result: "Tetap Merah (Sifat: Asam)" },
        { id: 2, sample: "Air Sabun Mandi", indicator: "Kertas Lakmus Merah", color: "#74b9ff", result: "Berubah Biru (Sifat: Basa)" },
        { id: 3, sample: "Asam Cuka Dapur", indicator: "Kertas Lakmus Biru", color: "#ff7675", result: "Berubah Merah (Sifat: Asam)" },
        { id: 4, sample: "Larutan Garam Dapur", indicator: "Kertas Lakmus Merah", color: "#ff7675", result: "Tetap Merah (Sifat: Netral)" }
      ];

      wellsTbody.innerHTML = wells.map(w => `
        <tr>
          <td style="text-align: center; font-weight: 700;">${w.id || '-'}</td>
          <td><strong>${w.sample || '-'}</strong></td>
          <td>${w.indicator || '-'}</td>
          <td>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: ${w.color || '#ddd'}; border: 1px solid rgba(0,0,0,0.2);"></span>
              ${w.color ? (w.color === '#ff7675' ? 'Merah' : (w.color === '#74b9ff' ? 'Biru' : (w.color === '#ffeaa7' ? 'Kuning' : 'Sesuai Reaksi'))) : '-'}
            </span>
          </td>
          <td><span class="status-pill status-pass">${w.result || '-'}</span></td>
        </tr>
      `).join('');
    }

    if (dlBtn) {
      dlBtn.onclick = () => this.downloadSingleLKPD(lkpd.id);
    }

    modal.classList.add('active');
  }

  closeLKPDDetailModal() {
    if (window.labAudio) window.labAudio.playClick();
    const modal = document.getElementById('lkpd-detail-modal');
    if (modal) modal.classList.remove('active');
  }

  // Cetak & Unduh Dokumen Lengkap Lembar Kerja Peserta Didik (LKPD) Siswa
  downloadSingleLKPD(id) {
    if (window.labAudio) window.labAudio.playFanfare();
    const lkpd = this.lkpdSubmissions.find(l => String(l.id) === String(id));
    if (!lkpd) return;

    const printWin = window.open('', '_blank');
    const wells = Array.isArray(lkpd.wells) && lkpd.wells.length > 0 ? lkpd.wells : [
      { id: 1, sample: "Air Perasan Jeruk Nipis", indicator: "Kertas Lakmus Merah", color: "#ff7675", result: "Tetap Merah (Sifat: Asam)" },
      { id: 2, sample: "Air Sabun Mandi", indicator: "Kertas Lakmus Merah", color: "#74b9ff", result: "Berubah Biru (Sifat: Basa)" },
      { id: 3, sample: "Asam Cuka Dapur", indicator: "Kertas Lakmus Biru", color: "#ff7675", result: "Berubah Merah (Sifat: Asam)" },
      { id: 4, sample: "Larutan Garam Dapur", indicator: "Kertas Lakmus Merah", color: "#ff7675", result: "Tetap Merah (Sifat: Netral)" }
    ];

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LKPD_${lkpd.studentName.replace(/\\s+/g, '_')}_${lkpd.studentClass}</title>
        <style>
          @page { size: A4; margin: 18mm 15mm; }
          body { font-family: 'Times New Roman', Times, serif; color: #111; line-height: 1.45; font-size: 11.5pt; margin: 25px; }
          .header-table { width: 100%; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 18px; }
          .kop-logo { font-size: 26pt; font-weight: bold; text-align: center; }
          .kop-title { text-align: center; line-height: 1.25; }
          .kop-instansi { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .kop-sub { font-size: 11pt; font-style: italic; color: #333; }
          .lkpd-title { font-size: 14pt; font-weight: bold; text-align: center; margin: 12px 0 6px 0; text-transform: uppercase; text-decoration: underline; }
          .lkpd-sub { font-size: 10.5pt; text-align: center; margin-bottom: 15px; font-weight: bold; color: #0284c7; }
          
          .meta-box { width: 100%; border: 1px solid #333; border-collapse: collapse; margin-bottom: 15px; }
          .meta-box td { padding: 6px 10px; font-size: 10.5pt; }
          
          .section-heading { font-size: 11.5pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #777; padding-bottom: 2px; }
          .task-desc { font-size: 10.5pt; color: #333; margin-bottom: 6px; font-style: italic; }
          .answer-box { border: 1px solid #555; background: #fdfdfd; padding: 10px 12px; font-size: 11pt; min-height: 55px; border-radius: 4px; margin-bottom: 10px; white-space: pre-wrap; }
          
          .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 14px; font-size: 10.5pt; }
          .data-table th, .data-table td { border: 1px solid #444; padding: 6px 8px; text-align: left; }
          .data-table th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
          
          .eval-grid { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .eval-grid td { border: 1px solid #333; padding: 8px; vertical-align: top; font-size: 10.5pt; }
          .signatures { width: 100%; margin-top: 25px; border-collapse: collapse; }
          .signatures td { width: 50%; text-align: center; vertical-align: top; font-size: 10.5pt; }
          
          .color-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1px solid #000; margin-right: 4px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td width="70" align="center" style="font-size: 32pt;">🔬</td>
            <td class="kop-title">
              <div class="kop-instansi">LEMBAR KERJA PESERTA DIDIK (LKPD) DIGITAL</div>
              <div class="kop-instansi" style="font-size: 11.5pt;">PRAKTIKUM LABORATORIUM IPA & UJI ASAM BASA</div>
              <div class="kop-sub">Kurikulum Merdeka — Fase D Kelas VII — Pengenalan Alat Lab & Sains</div>
            </td>
          </tr>
        </table>

        <table class="meta-box">
          <tr>
            <td width="18%"><strong>Nama Peserta Didik</strong></td>
            <td width="42%">: <strong>${lkpd.studentName}</strong></td>
            <td width="18%"><strong>Hari / Tanggal</strong></td>
            <td width="22%">: ${lkpd.timestamp}</td>
          </tr>
          <tr>
            <td><strong>Kelas / Rombel</strong></td>
            <td>: <strong>${lkpd.studentClass}</strong></td>
            <td><strong>Status Berkas</strong></td>
            <td>: <span style="color: #16a34a; font-weight: bold;">✔ Lengkap Terisi</span></td>
          </tr>
        </table>

        <div class="section-heading">BAGIAN 1: PENGAMATAN MIKROSKOP VIRTUAL (SEL TUMBUHAN VS SEL HEWAN)</div>
        <div class="task-desc">Petunjuk: Analisis perbedaan struktur antara preparat Sel Tumbuhan (Bawang/Stomata) dan Sel Hewan (Mukosa Pipi/Darah/Otot) yang telah diamati melalui perbesaran mikroskop.</div>
        <div class="answer-box">${lkpd.jawaban1 || 'Siswa telah mengamati preparat mikroskop dengan fokus perbesaran objek yang tepat.'}</div>

        <div class="section-heading">BAGIAN 2: KESIMPULAN PENGUJIAN SIFAT LARUTAN ASAM & BASA</div>
        <div class="task-desc">Petunjuk: Tuliskan kesimpulan sifat larutan (asam, basa, atau netral) berdasarkan perubahan warna kertas lakmus / indikator alami kunyit.</div>
        <div class="answer-box">${lkpd.jawaban2 || 'Larutan asam memerahkan lakmus biru, sedangkan larutan basa membirukan lakmus merah.'}</div>

        <div class="section-heading">BAGIAN 3: TABEL DATA HASIL PENGUJIAN PLAT TETES (WELL PLATE)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th width="40">Sumur</th>
              <th>Sampel Larutan Uji</th>
              <th>Indikator yang Ditambahkan</th>
              <th width="120">Perubahan Warna</th>
              <th>Hasil Analisis Sifat Zat</th>
            </tr>
          </thead>
          <tbody>
            ${wells.map(w => `
              <tr>
                <td align="center"><strong>${w.id || '-'}</strong></td>
                <td>${w.sample || '-'}</td>
                <td>${w.indicator || '-'}</td>
                <td>
                  <span class="color-dot" style="background-color: ${w.color || '#ccc'};"></span>
                  ${w.color === '#ff7675' ? 'Merah' : (w.color === '#74b9ff' ? 'Biru' : (w.color === '#ffeaa7' ? 'Kuning' : 'Reaksi'))}
                </td>
                <td><strong>${w.result || '-'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="eval-grid">
          <tr>
            <td width="35%">
              <strong>RUBRIK PENILAIAN GURU:</strong><br>
              1. Ketepatan Analisis Sel: [ &nbsp;&nbsp;&nbsp;&nbsp; / 40 ]<br>
              2. Ketepatan Uji Larutan : [ &nbsp;&nbsp;&nbsp;&nbsp; / 40 ]<br>
              3. Kelengkapan & Kerapian : [ &nbsp;&nbsp;&nbsp;&nbsp; / 20 ]<br>
              <strong>TOTAL NILAI : [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</strong>
            </td>
            <td width="65%">
              <strong>CATATAN / FEEDBACK GURU PEMBIMBING:</strong><br><br>
              __________________________________________________________________________<br>
              __________________________________________________________________________
            </td>
          </tr>
        </table>

        <table class="signatures">
          <tr>
            <td>
              Mengetahui,<br>Orang Tua / Wali Siswa<br><br><br><br>
              ( __________________________ )
            </td>
            <td>
              Guru Mata Pelajaran IPA<br><br><br><br>
              ( __________________________ )
            </td>
          </tr>
        </table>
      </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  }

  // Unduh Seluruh Rekapitulasi Data LKPD Siswa (Format CSV/Excel)
  exportLKPDCSV() {
    if (this.lkpdSubmissions.length === 0) {
      alert("⚠️ Belum ada data LKPD siswa untuk diekspor!");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM agar rapi di Microsoft Excel
    csvContent += "=== REKAPITULASI PENGUMPULAN LEMBAR KERJA PRAKTIKUM (LKPD) LABORATORIUM IPA ===\n";
    csvContent += "No,Waktu Pengiriman,Nama Lengkap Siswa,Kelas,Analisis Mikroskop (Jawaban 1),Kesimpulan Asam Basa (Jawaban 2),Data Reaksi Plat Tetes,Status Kelengkapan\n";

    this.lkpdSubmissions.forEach((l, idx) => {
      const wellsSummary = Array.isArray(l.wells) && l.wells.length > 0 
        ? l.wells.map(w => `[Sumur ${w.id}: ${w.sample || '-'} + ${w.indicator || '-'} -> ${w.result || '-'}]`).join('; ')
        : "Lengkap Teruji";

      const cleanJwb1 = (l.jawaban1 || '-').replace(/"/g, '""').replace(/\\r?\\n/g, ' ');
      const cleanJwb2 = (l.jawaban2 || '-').replace(/"/g, '""').replace(/\\r?\\n/g, ' ');
      const cleanWells = wellsSummary.replace(/"/g, '""');

      csvContent += `${idx + 1},"${l.timestamp}","${l.studentName}","${l.studentClass}","${cleanJwb1}","${cleanJwb2}","${cleanWells}","Lengkap Terisi"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_LKPD_Praktikum_IPA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.labAuth) {
      window.labAuth.showToast("Rekap data LKPD siswa berhasil diunduh (Format CSV / Excel)!");
    }
  }

  // Cetak Rekapitulasi Kolektif Seluruh LKPD Kelas
  printAllLKPDReport() {
    if (this.lkpdSubmissions.length === 0) {
      alert("⚠️ Belum ada data LKPD siswa untuk dicetak!");
      return;
    }

    const printWin = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekapitulasi Pengumpulan LKPD Laboratorium IPA</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 11pt; }
          .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 16pt; font-weight: bold; color: #0369a1; text-transform: uppercase; }
          .subtitle { font-size: 11pt; color: #64748b; margin-top: 4px; }
          .meta { margin-bottom: 15px; font-size: 10.5pt; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 10pt; }
          th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
          .text-center { text-align: center; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Rekapitulasi Pengumpulan Lembar Kerja Praktikum (LKPD) Siswa</div>
          <div class="subtitle">Laboratorium IPA Sains & Virtual Lab — Kurikulum Merdeka Fase D Kelas VII</div>
        </div>

        <div class="meta">
          <div><strong>Tanggal Cetak:</strong> ${dateStr}</div>
          <div><strong>Total Siswa Mengumpulkan:</strong> ${this.lkpdSubmissions.length} Dokumen</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="35">No</th>
              <th width="110">Waktu Kirim</th>
              <th>Nama Siswa</th>
              <th width="70">Kelas</th>
              <th>Analisis Pengamatan Mikroskop</th>
              <th>Kesimpulan Uji Asam-Basa</th>
              <th width="90">Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.lkpdSubmissions.map((l, idx) => `
              <tr>
                <td class="text-center"><strong>${idx + 1}</strong></td>
                <td>${l.timestamp}</td>
                <td><strong>${l.studentName}</strong></td>
                <td class="text-center">${l.studentClass}</td>
                <td style="font-size: 9.5pt;">${l.jawaban1 || '-'}</td>
                <td style="font-size: 9.5pt;">${l.jawaban2 || '-'}</td>
                <td class="text-center" style="color: #16a34a; font-weight: bold;">Lengkap</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div>Mengetahui,<br>Kepala Sekolah<br><br><br><br>__________________________</div>
          <div>Guru Pengampu Mata Pelajaran IPA<br><br><br><br>__________________________</div>
        </div>
      </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 600);
  }
}

window.labDashboard = new LabDashboard();
