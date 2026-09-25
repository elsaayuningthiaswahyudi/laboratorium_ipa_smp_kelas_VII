// Teacher Dashboard Controller & Real-Time Data Engine

class LabDashboard {
  constructor() {
    this.EVAL_STORAGE_KEY = 'ipa_lab_evaluations';
    this.LKPD_STORAGE_KEY = 'ipa_lab_lkpd_submissions';

    this.evaluations = [];
    this.lkpdSubmissions = [];

    this.currentClassFilter = 'all';
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
          if (event.data && (event.data.type === 'SYNC' || event.data.type === 'NEW_EVAL' || event.data.type === 'NEW_LKPD')) {
            this.loadData();
            this.renderDashboard();
            if (event.data.studentName && window.labAuth && window.labAuth.isTeacher()) {
              window.labAuth.showToast(`📥 Data Masuk: ${event.data.studentName} (${event.data.studentClass || 'Siswa'})`);
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
      if (e.key === this.EVAL_STORAGE_KEY || e.key === this.LKPD_STORAGE_KEY) {
        this.loadData();
        this.renderDashboard();
      }
    });
  }

  startAutoSync() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      const isTeacherActive = window.labAuth && window.labAuth.isTeacher();
      const dashboardPage = document.getElementById('page-dashboard-guru');
      const isDashboardVisible = dashboardPage && dashboardPage.classList.contains('active-section');

      if (isTeacherActive || isDashboardVisible) {
        this.fetchServerData(false);
      }
    }, 3000);
  }

  deduplicateList(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];
    list.forEach(item => {
      if (!item || !item.studentName) return;
      const key = `${item.studentName.toLowerCase().trim()}_${(item.studentClass || '').trim()}_${(item.timestamp || '').trim()}`;
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
    } catch (e) {
      console.error("Error loading dashboard data:", e);
      if (!this.evaluations || this.evaluations.length === 0) {
        this.evaluations = this.getDefaultEvaluations();
      }
      if (!this.lkpdSubmissions || this.lkpdSubmissions.length === 0) {
        this.lkpdSubmissions = this.getDefaultLKPD();
      }
    }
  }

  saveData() {
    try {
      this.evaluations = this.deduplicateList(this.evaluations);
      localStorage.setItem(this.EVAL_STORAGE_KEY, JSON.stringify(this.evaluations));
      localStorage.setItem(this.LKPD_STORAGE_KEY, JSON.stringify(this.lkpdSubmissions));
    } catch (e) {
      console.error("Error saving local dashboard data:", e);
    }
  }

  mergeEvaluations(serverEvals) {
    if (!Array.isArray(serverEvals) || serverEvals.length === 0) return;
    const map = new Map();
    // Local evaluations first
    this.evaluations.forEach(item => {
      if (item && item.studentName) {
        const key = `${item.studentName.toLowerCase().trim()}_${(item.studentClass || '').trim()}_${(item.timestamp || '').trim()}`;
        map.set(key, item);
      }
    });
    // Server data updates / merges
    serverEvals.forEach(item => {
      if (item && item.studentName) {
        const key = `${item.studentName.toLowerCase().trim()}_${(item.studentClass || '').trim()}_${(item.timestamp || '').trim()}`;
        map.set(key, item);
      }
    });
    this.evaluations = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
    this.saveData();
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
    this.lkpdSubmissions = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
    this.saveData();
  }

  async fetchServerData(notify = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBtrp23zHaJ3lF53T134rCqNP1uwz94IPdGD_pEuJiDphqdSOYuvQDnKtvjMvoo0Ar/exec";

    try {
      // 1. Fetch from Google Sheets API
      try {
        const sheetRes = await fetch(GOOGLE_SCRIPT_URL, { cache: 'no-store' });
        if (sheetRes.ok) {
          const sheetJson = await sheetRes.json();
          if (sheetJson.status === 'success' && Array.isArray(sheetJson.data) && sheetJson.data.length > 0) {
            const mapped = sheetJson.data.map((item, idx) => ({
              id: item.id || `gs_${(item.nama || 'siswa')}_${(item.kelas || '')}_${(item.timestamp || idx)}`.replace(/[^a-zA-Z0-9]/g, '_'),
              timestamp: item.timestamp || new Date().toLocaleString('id-ID'),
              studentName: item.nama || 'Siswa',
              studentClass: item.kelas || 'VII-A',
              score: Number(item.nilai) || 0,
              correctCount: Number(item.benar) || 0,
              totalQuestions: Number(item.totalSoal) || 15,
              isPassed: (Number(item.nilai) || 0) >= 75
            }));
            this.mergeEvaluations(mapped);
          }
        }
      } catch (sheetErr) {
        // Fallback for CORS or offline
      }

      // 2. Local backend fallback
      try {
        const evalRes = await fetch('/api/evaluations', { cache: 'no-store' });
        if (evalRes.ok) {
          const data = await evalRes.json();
          if (Array.isArray(data) && data.length > 0) {
            this.mergeEvaluations(data);
          }
        }

        const lkpdRes = await fetch('/api/lkpd', { cache: 'no-store' });
        if (lkpdRes.ok) {
          const data = await lkpdRes.json();
          if (Array.isArray(data) && data.length > 0) {
            this.mergeLKPDs(data);
          }
        }
      } catch (localErr) {}

      this.renderDashboard();
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
      } catch (e) {}
    }

    // Send to Google Sheets Cloud Database
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBtrp23zHaJ3lF53T134rCqNP1uwz94IPdGD_pEuJiDphqdSOYuvQDnKtvjMvoo0Ar/exec";
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
      }).catch(err => console.warn("Google Sheets Error:", err));
    } catch (e) {}

    // POST to local API if available
    try {
      await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) {}
  }

  // Record a new LKPD submission
  async recordLKPD(lkpdData) {
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
      studentName: lkpdData.name || 'Siswa Peserta Didik',
      studentClass: lkpdData.studentClass || 'VII-A',
      jawaban1: lkpdData.jawaban1 || '-',
      jawaban2: lkpdData.jawaban2 || '-',
      wells: lkpdData.wells || []
    };

    this.lkpdSubmissions = this.lkpdSubmissions.filter(l => l.id !== record.id);
    this.lkpdSubmissions.unshift(record);
    this.saveData();
    this.renderDashboard();

    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'NEW_LKPD',
          studentName: record.studentName,
          studentClass: record.studentClass,
          data: record
        });
      } catch (e) {}
    }

    try {
      await fetch('/api/lkpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) {}
  }

  renderDashboard() {
    this.loadData();
    this.renderMetrics();
    this.renderEvaluationTable();
    this.renderLKPDTable();
  }

  renderMetrics() {
    const totalStudentsElem = document.getElementById('dash-total-students');
    const avgScoreElem = document.getElementById('dash-avg-score');
    const passedCountElem = document.getElementById('dash-passed-count');
    const remedialCountElem = document.getElementById('dash-remedial-count');
    const totalLkpdElem = document.getElementById('dash-total-lkpd');

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
          <button class="dash-action-btn delete" onclick="window.labDashboard.deleteEvaluation(${e.id})" title="Hapus Data">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderLKPDTable() {
    const tbody = document.getElementById('dash-lkpd-tbody');
    if (!tbody) return;

    if (this.lkpdSubmissions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-file-circle-xmark" style="font-size: 2rem; margin-bottom: 0.6rem; display: block; opacity: 0.6;"></i>
            Belum ada LKPD yang dikumpulkan oleh siswa.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.lkpdSubmissions.map((lkpd, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td><i class="fa-regular fa-clock text-muted"></i> ${lkpd.timestamp}</td>
        <td><strong>${lkpd.studentName}</strong></td>
        <td><span class="badge-class">${lkpd.studentClass}</span></td>
        <td>
          <span class="status-pill status-pass"><i class="fa-solid fa-circle-check"></i> Lengkap Terisi</span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-sm" onclick="window.labDashboard.viewLKPDDetail(${lkpd.id})" title="Lihat LKPD">
            <i class="fa-solid fa-eye"></i> Tinjau
          </button>
          <button class="dash-action-btn delete" onclick="window.labDashboard.deleteLKPD(${lkpd.id})" title="Hapus LKPD">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  filterClass(className) {
    if (window.labAudio) window.labAudio.playClick();
    this.currentClassFilter = className;

    document.querySelectorAll('.dash-class-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.class === className);
    });

    this.renderEvaluationTable();
  }

  search(keyword) {
    this.searchKeyword = keyword.trim();
    this.renderEvaluationTable();
  }

  async deleteEvaluation(id) {
    if (confirm("Apakah Anda yakin ingin menghapus catatan nilai evaluasi ini?")) {
      this.evaluations = this.evaluations.filter(e => e.id !== id);
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/delete-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id })
        });
      } catch (e) {}

      if (window.labAuth) window.labAuth.showToast("Data evaluasi berhasil dihapus.");
    }
  }

  async deleteLKPD(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data LKPD ini?")) {
      this.lkpdSubmissions = this.lkpdSubmissions.filter(l => l.id !== id);
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/delete-lkpd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id })
        });
      } catch (e) {}

      if (window.labAuth) window.labAuth.showToast("Data LKPD berhasil dihapus.");
    }
  }

  async clearAllData() {
    if (confirm("⚠️ PERINGATAN: Apakah Anda yakin ingin mengosongkan SEMUA data nilai evaluasi dan LKPD siswa?")) {
      this.evaluations = [];
      this.lkpdSubmissions = [];
      this.saveData();
      this.renderDashboard();

      try {
        await fetch('/api/clear-all', { method: 'POST' });
      } catch (e) {}

      if (this.channel) {
        try { this.channel.postMessage({ type: 'SYNC' }); } catch (e) {}
      }

      if (window.labAuth) window.labAuth.showToast("Seluruh data nilai dan LKPD berhasil dikosongkan.");
    }
  }

  async injectDemoData(notify = true) {
    const demoEvals = this.getDefaultEvaluations();
    const demoLkpd = this.getDefaultLKPD();

    this.evaluations = demoEvals;
    this.lkpdSubmissions = demoLkpd;
    this.saveData();
    this.renderDashboard();

    try {
      await fetch('/api/inject-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: demoEvals, lkpd: demoLkpd })
      });
    } catch (e) {}

    if (notify && window.labAuth) {
      window.labAuth.showToast("Data demo siswa berhasil dimuat!");
    }
  }

  exportCSV() {
    if (this.evaluations.length === 0) {
      alert("⚠️ Belum ada data nilai untuk diekspor!");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Waktu Pengerjaan,Nama Siswa,Kelas,Nilai,Jumlah Benar,Total Soal,Status Kelulusan\n";

    this.evaluations.forEach((e, idx) => {
      csvContent += `${idx + 1},"${e.timestamp}","${e.studentName}","${e.studentClass}",${e.score},${e.correctCount},${e.totalQuestions},"${e.isPassed ? 'TUNTAS' : 'REMEDIAL'}"\n`;
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

  viewLKPDDetail(id) {
    const lkpd = this.lkpdSubmissions.find(l => l.id === id);
    if (!lkpd) return;

    alert(`📋 [LKPD ${lkpd.studentName} - ${lkpd.studentClass}]\n\n1. Prinsip Mikroskop:\n"${lkpd.jawaban1}"\n\n2. Sifat Asam Basa:\n"${lkpd.jawaban2}"`);
  }
}

window.labDashboard = new LabDashboard();
