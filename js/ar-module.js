// Augmented Reality (AR) Camera & 3D Interactive Lab Tool Simulation
// Enhanced with Interactive Mini-Labs & Apparatus Observation Activities

class LabARModule {
  constructor() {
    this.videoElem = null;
    this.stream = null;
    this.isCameraActive = false;
    this.currentTool = 'gelas-ukur';
    this.scale = 1.0;
    this.rotation = 0;
    this.posX = 0;
    this.posY = 0;

    // Mini-Lab Active State Store
    this.miniLabState = {
      // Gelas Ukur
      meniscusVol: 45.0,
      meniscusLiquid: 'air',
      eyeAngle: 'normal',
      mysteryVolTarget: 38.0,

      // Jangka Sorong
      caliperVal: 2.45,
      caliperObject: 'kelereng',
      mysteryCaliperTarget: 3.65,

      // Neraca Ohaus
      ohaus100: 100,
      ohaus10: 40,
      ohaus1: 5.6,
      ohausObjectWeight: 145.6,
      ohausObjectName: 'Batu Granit',

      // Termometer
      tempVal: 27,

      // Mikroskop
      microSpecimen: 'bawang',
      microObjective: 10,
      microFocus: 70,
      microLight: 85,

      // Bunsen
      bunsenAirValve: 100, // 100% blue flame
      bunsenWaterTemp: 25,
      bunsenIsHeating: false,

      // Pipet & Gelas Kimia
      dropCount: 0,
      beakerVol: 50,

      // Erlenmeyer Titrasi
      titrationAdded: 0,
      isSwirled: false,

      // Tabung Reaksi
      reactionType: 'agcl',
      reactionState: 'initial',

      // Cawan Petri
      petriCounted: new Set(),
      petriTotalCols: 28,

      // Lup
      lupDistance: 6,

      // Kaki Tiga & Kasa
      gauzeMode: 'with-gauze',

      // Corong Filtrasi
      filtrationProgress: 0,

      // Batang Pengaduk
      stirSpeed: 'normal'
    };

    // Auto initialize mini-lab navigation when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      this.initMiniLabNav();
      setTimeout(() => {
        this.setTool(this.currentTool || 'gelas-ukur');
      }, 200);
    });
  }

  async startCamera(videoElementId) {
    this.videoElem = document.getElementById(videoElementId);
    if (!this.videoElem) return false;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        this.videoElem.srcObject = this.stream;
        await this.videoElem.play();
        this.isCameraActive = true;
        this.updateARStatus("Kamera AR Aktif! Arahkan ke meja/permukaan datar.", "success");
        return true;
      } else {
        throw new Error("Browser tidak mendukung MediaDevices");
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable, using simulation mode", err);
      this.isCameraActive = false;
      this.useSimulatedEnvironment();
      this.updateARStatus("Mode Simulasi AR Aktif (Kamera nyata tidak terdeteksi atau izin belum diberikan)", "warning");
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElem) {
      this.videoElem.srcObject = null;
    }
    this.isCameraActive = false;
  }

  useSimulatedEnvironment() {
    const bgContainer = document.getElementById('ar-camera-wrapper');
    if (bgContainer) {
      bgContainer.classList.add('simulated-bg');
    }
  }

  updateARStatus(message, type = "info") {
    const statusBadge = document.getElementById('ar-status-badge');
    if (statusBadge) {
      statusBadge.className = `ar-badge badge-${type}`;
      statusBadge.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-video' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i> ${message}`;
    }
  }

  initMiniLabNav() {
    const navContainer = document.getElementById('mini-lab-quick-nav');
    if (!navContainer || !window.LAB_DATA || !window.LAB_DATA.alatLab) return;

    const quickTools = [
      { id: 'gelas-ukur', name: '📏 Gelas Ukur' },
      { id: 'jangka-sorong', name: '📐 Jangka Sorong' },
      { id: 'neraca-ohaus', name: '⚖️ Neraca Ohaus' },
      { id: 'termometer-lab', name: '🌡️ Termometer' },
      { id: 'mikroskop', name: '🔬 Mikroskop' },
      { id: 'bunsen-spiritus', name: '🔥 Bunsen' },
      { id: 'gelas-kimia', name: '🧪 Pipet & Beaker' },
      { id: 'labu-erlenmeyer', name: '⚗️ Erlenmeyer' }
    ];

    navContainer.innerHTML = quickTools.map(t => `
      <button class="mini-lab-nav-chip ${t.id === this.currentTool ? 'active' : ''}" onclick="window.labAR.setTool('${t.id}')">
        ${t.name}
      </button>
    `).join('');
  }

  setTool(toolId) {
    this.currentTool = toolId;
    const toolData = (window.LAB_DATA && window.LAB_DATA.alatLab) ? (window.LAB_DATA.alatLab.find(a => a.id === toolId) || window.LAB_DATA.alatLab[0]) : null;

    // Highlight active chip in UI
    document.querySelectorAll('.tool-chip').forEach(chip => {
      const onclickAttr = chip.getAttribute('onclick') || '';
      chip.classList.toggle('active', onclickAttr.includes(`'${toolId}'`));
    });

    document.querySelectorAll('.mini-lab-nav-chip').forEach(chip => {
      const onclickAttr = chip.getAttribute('onclick') || '';
      chip.classList.toggle('active', onclickAttr.includes(`'${toolId}'`));
    });

    const cardInfo = document.getElementById('ar-tool-info-card');
    if (cardInfo && toolData) {
      cardInfo.innerHTML = `
        <div class="ar-card-header">
          <div class="badge-accent"><i class="fa-solid fa-cube"></i> Model 3D & AR Aktif</div>
          <h3 style="font-size: 1.2rem; margin: 0.5rem 0;">${toolData.nama}</h3>
        </div>
        <p style="font-size: 0.85rem; margin-bottom: 0.8rem;"><strong>Fungsi:</strong> ${toolData.fungsi}</p>
        <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 8px; flex-wrap: wrap;">
          <span><i class="fa-solid fa-shield-halved text-orange"></i> ${toolData.bahaya}</span>
          <span>|</span>
          <span><i class="fa-solid fa-layer-group text-cyan"></i> ${toolData.material}</span>
        </div>
      `;
    }

    // Load 3D model
    if (window.labViewer3D) {
      const typeMap = {
        'mikroskop': 'mikroskop',
        'gelas-kimia': 'gelas-kimia',
        'gelas-ukur': 'gelas-ukur',
        'labu-erlenmeyer': 'labu-erlenmeyer',
        'erlenmeyer': 'labu-erlenmeyer',
        'bunsen-spiritus': 'bunsen',
        'bunsen': 'bunsen',
        'neraca-ohaus': 'neraca',
        'neraca': 'neraca',
        'termometer-lab': 'termometer-lab',
        'termometer': 'termometer-lab',
        'jangka-sorong': 'jangka-sorong',
        'tabung-reaksi': 'tabung-reaksi',
        'cawan-petri': 'cawan-petri',
        'lup': 'lup',
        'kaki-tiga': 'kaki-tiga',
        'kawat-kasa': 'kawat-kasa',
        'batang-pengaduk': 'batang-pengaduk',
        'corong-kaca': 'corong-kaca',
        'corong': 'corong-kaca'
      };
      const resolvedType = typeMap[toolId] || (toolData ? toolData.modelType : 'mikroskop');
      window.labViewer3D.loadModel(resolvedType);
    }

    // Render corresponding interactive mini-lab activity
    this.renderMiniLab(toolId);
  }

  captureSnapshot() {
    if (window.labAudio) window.labAudio.playCorrect();
    const notification = document.createElement('div');
    notification.className = 'toast-notification success';
    notification.innerHTML = '<i class="fa-solid fa-camera"></i> Foto AR Berhasil Ditangkap!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // =========================================================================
  // MINI-LAB ROUTER & RENDERERS
  // =========================================================================
  renderMiniLab(toolId) {
    const bodyContainer = document.getElementById('mini-lab-card-body');
    const titleElem = document.getElementById('mini-lab-title');
    const descElem = document.getElementById('mini-lab-desc');
    if (!bodyContainer) return;

    switch (toolId) {
      case 'gelas-ukur':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Membaca Meniskus Gelas Ukur</span>`;
        if (descElem) descElem.textContent = 'Pelajari perbedaan meniskus cekung (air) vs cembung (raksa), atur posisi mata pengamat untuk mencegah kesalahan paralaks, dan lakukan uji pembacaan volume.';
        this.renderGraduatedCylinderLab(bodyContainer);
        break;

      case 'jangka-sorong':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Pengukuran Presisi Jangka Sorong</span>`;
        if (descElem) descElem.textContent = 'Geser rahang ukur, identifikasi angka pada skala utama dan garis nonius yang berimpit tegak lurus, serta hitung hasil pengukuran hingga ketelitian 0.01 cm (0.1 mm).';
        this.renderVernierCaliperLab(bodyContainer);
        break;

      case 'neraca-ohaus':
      case 'neraca':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Menimbang dengan Neraca Ohaus 3 Lengan</span>`;
        if (descElem) descElem.textContent = 'Geser anting pemberat pada lengan ratusan, puluhan, dan satuan hingga jarum penunjuk tepat seimbang di angka nol.';
        this.renderOhausBalanceLab(bodyContainer);
        break;

      case 'termometer-lab':
      case 'termometer':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Membaca Skala Suhu & Titik Termal</span>`;
        if (descElem) descElem.textContent = 'Amati pemuaian cairan pengisi pipa kapiler termometer dan konversikan nilai suhu ke skala Kelvin, Fahrenheit, dan Reamur.';
        this.renderThermometerLab(bodyContainer);
        break;

      case 'mikroskop':
        if (titleElem) titleElem.innerHTML = `Kegiatan Pengamatan: <span class="text-cyan">Fokus Preparat Sel Mikroskop</span>`;
        if (descElem) descElem.textContent = 'Ganti lensa objektif (4x, 10x, 40x), atur makrometer dan mikrometer untuk mendapatkan bayangan preparat yang fokus dan jernih.';
        this.renderMicroscopeLab(bodyContainer);
        break;

      case 'bunsen-spiritus':
      case 'bunsen':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Pengaturan Nyala Api Pembakar Spiritus / Bunsen</span>`;
        if (descElem) descElem.textContent = 'Atur kerah udara untuk membandingkan nyala api kuning berjelaga (reduksi) vs nyala api biru (oksidasi) serta uji laju pemanasan air.';
        this.renderBunsenLab(bodyContainer);
        break;

      case 'gelas-kimia':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Presisi Pipet Tetes & Penakaran Beaker</span>`;
        if (descElem) descElem.textContent = 'Latih teknik memegang pipet tegak lurus (90°), teteskan larutan indikator, dan hitung kalibrasi tetesan zat cair (20 tetes ≈ 1 mL).';
        this.renderBeakerPipetteLab(bodyContainer);
        break;

      case 'labu-erlenmeyer':
      case 'erlenmeyer':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Simulasi Titrasi & Homogenisasi Larutan</span>`;
        if (descElem) descElem.textContent = 'Teteskan larutan basa dari buret sambil menggoyang labu erlenmeyer hingga mencapai titik akhir titrasi (perubahan warna indikator PP).';
        this.renderErlenmeyerLab(bodyContainer);
        break;

      case 'tabung-reaksi':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Uji Reaksi Pengendapan Kimia</span>`;
        if (descElem) descElem.textContent = 'Campurkan larutan kimia skala mikro dalam tabung reaksi untuk mengamati pembentukan endapan dan perubahan warna.';
        this.renderTestTubeLab(bodyContainer);
        break;

      case 'cawan-petri':
        if (titleElem) titleElem.innerHTML = `Kegiatan Pengamatan: <span class="text-cyan">Hitung Koloni Bakteri (Colony Counter)</span>`;
        if (descElem) descElem.textContent = 'Gunakan grid kuadran cawan petri untuk menandai dan menghitung jumlah koloni mikroorganisme (CFU - Colony Forming Units).';
        this.renderPetriDishLab(bodyContainer);
        break;

      case 'lup':
        if (titleElem) titleElem.innerHTML = `Kegiatan Pengamatan: <span class="text-cyan">Titik Fokus Lensa Lup Kaca Pembesar</span>`;
        if (descElem) descElem.textContent = 'Ubah jarak lup terhadap spesimen untuk melihat sifat bayangan maya, tegak, dan diperbesar.';
        this.renderMagnifyingGlassLab(bodyContainer);
        break;

      case 'kaki-tiga':
      case 'kawat-kasa':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Uji Distribusi Panas Kawat Kasa Keramik</span>`;
        if (descElem) descElem.textContent = 'Bandingkan persebaran panas nyala api secara langsung versus menggunakan kawat kasa keramik untuk mencegah keretakan kaca.';
        this.renderTripodGauzeLab(bodyContainer);
        break;

      case 'corong-kaca':
      case 'corong':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Pemisahan Campuran (Filtrasi)</span>`;
        if (descElem) descElem.textContent = 'Simulasikan pemisahan suspensi air keruh menggunakan corong kaca dan kertas saring menjadi filtrat jernih dan residu.';
        this.renderFunnelFiltrationLab(bodyContainer);
        break;

      case 'batang-pengaduk':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Laju Kelarutan & Pengadukan</span>`;
        if (descElem) descElem.textContent = 'Uji pengaruh kecepatan pengadukan batang kaca terhadap waktu larut sempurna zat padat dalam air.';
        this.renderStirringRodLab(bodyContainer);
        break;

      default:
        this.renderGraduatedCylinderLab(bodyContainer);
    }
  }

  // =========================================================================
  // 1. GELAS UKUR - MEMBACA MENISKUS & UJI PARALAKS
  // =========================================================================
  renderGraduatedCylinderLab(container) {
    const vol = this.miniLabState.meniscusVol;
    const liquid = this.miniLabState.meniscusLiquid;
    const angle = this.miniLabState.eyeAngle;

    // Perhitungan paralaks
    let observedVol = vol;
    if (angle === 'top') observedVol = vol + 4.0;
    if (angle === 'bottom') observedVol = vol - 4.0;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <!-- Visual Viewport -->
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 360 400" class="svg-sim-canvas" id="meniscus-svg">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
                <stop offset="30%" stop-color="rgba(255,255,255,0.05)" />
                <stop offset="70%" stop-color="rgba(255,255,255,0.05)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.35)" />
              </linearGradient>
              <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${liquid === 'air' ? '#00d2ff' : '#95a5a6'}" />
                <stop offset="100%" stop-color="${liquid === 'air' ? '#0072ff' : '#7f8c8d'}" />
              </linearGradient>
            </defs>

            <!-- Base Platform -->
            <polygon points="120,380 240,380 220,360 140,360" fill="#1e293b" stroke="#00f0ff" stroke-width="1.5" />

            <!-- Glass Cylinder Body -->
            <rect x="140" y="40" width="80" height="320" rx="4" fill="url(#glassGrad)" stroke="#38bdf8" stroke-width="2" />

            <!-- Spout -->
            <polygon points="140,40 125,32 140,48" fill="#38bdf8" opacity="0.7" />

            <!-- Liquid Column -->
            <!-- Volume 100mL = y 60, Volume 0mL = y 360 -> height = 300px for 100mL -> 3px per mL -->
            <g id="liquid-group">
              ${(() => {
                const liqY = 360 - (vol * 3);
                const liqH = vol * 3;
                if (liquid === 'air') {
                  // Meniskus Cekung (Concave) - dasar cekungan di liqY, tepian naik 8px
                  return `
                    <rect x="141" y="${liqY}" width="78" height="${liqH}" fill="url(#liquidGrad)" opacity="0.8" />
                    <!-- Concave Curve -->
                    <path d="M 141,${liqY - 6} Q 180,${liqY + 4} 219,${liqY - 6} L 219,${liqY} L 141,${liqY} Z" fill="url(#liquidGrad)" opacity="0.9" />
                    <path d="M 141,${liqY - 6} Q 180,${liqY + 4} 219,${liqY - 6}" fill="none" stroke="#ffffff" stroke-width="2" />
                  `;
                } else {
                  // Meniskus Cembung (Convex) - puncak cembung di liqY, tepian turun 6px
                  return `
                    <rect x="141" y="${liqY}" width="78" height="${liqH}" fill="url(#liquidGrad)" opacity="0.85" />
                    <!-- Convex Curve -->
                    <path d="M 141,${liqY + 6} Q 180,${liqY - 4} 219,${liqY + 6} L 219,${liqY} L 141,${liqY} Z" fill="url(#liquidGrad)" opacity="0.95" />
                    <path d="M 141,${liqY + 6} Q 180,${liqY - 4} 219,${liqY + 6}" fill="none" stroke="#ffffff" stroke-width="2" />
                  `;
                }
              })()}
            </g>

            <!-- Scale Ticks & Numbers -->
            ${(() => {
              let ticks = '';
              for (let i = 10; i <= 100; i += 10) {
                const yPos = 360 - (i * 3);
                ticks += `
                  <line x1="140" y1="${yPos}" x2="160" y2="${yPos}" stroke="#ffffff" stroke-width="1.8" />
                  <text x="165" y="${yPos + 4}" fill="#ffffff" font-size="11" font-family="monospace" font-weight="bold">${i}</text>
                `;
                // Minor ticks
                for (let j = 2; j <= 8; j += 2) {
                  const minorY = yPos + (j * 3);
                  if (minorY < 360) {
                    ticks += `<line x1="140" y1="${minorY}" x2="150" y2="${minorY}" stroke="rgba(255,255,255,0.6)" stroke-width="1" />`;
                  }
                }
              }
              return ticks;
            })()}

            <!-- Eye Observation Ray -->
            ${(() => {
              const baseLiqY = 360 - (vol * 3);
              let eyeY = baseLiqY;
              let rayColor = '#10b981';
              let label = 'Tepat 90° (Dasar Meniskus)';

              if (angle === 'top') {
                eyeY = baseLiqY - 50;
                rayColor = '#ef4444';
                label = 'Sudut Atas (Paralaks Positif)';
              } else if (angle === 'bottom') {
                eyeY = baseLiqY + 50;
                rayColor = '#ef4444';
                label = 'Sudut Bawah (Paralaks Negatif)';
              }

              return `
                <g>
                  <!-- Eye Icon -->
                  <circle cx="50" cy="${eyeY}" r="16" fill="#080e21" stroke="${rayColor}" stroke-width="2" />
                  <circle cx="50" cy="${eyeY}" r="6" fill="${rayColor}" />
                  <text x="25" y="${eyeY - 22}" fill="${rayColor}" font-size="10" font-weight="bold">Mata Pengamat</text>
                  
                  <!-- Ray Line -->
                  <line x1="68" y1="${eyeY}" x2="180" y2="${baseLiqY}" stroke="${rayColor}" stroke-width="2" stroke-dasharray="4,4" />
                  <circle cx="180" cy="${baseLiqY}" r="4" fill="${rayColor}" />

                  <!-- Indicator Box -->
                  <rect x="235" y="${baseLiqY - 14}" width="115" height="28" rx="4" fill="#080e21" stroke="${rayColor}" stroke-width="1.2" />
                  <text x="242" y="${baseLiqY + 4}" fill="${rayColor}" font-size="11" font-weight="bold">
                    ${observedVol.toFixed(1)} mL ${angle === 'normal' ? '✓' : '⚠️'}
                  </text>
                </g>
              `;
            })()}
          </svg>
        </div>

        <!-- Controls & Practice Panel -->
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-sliders"></i> Panel Pengaturan & Praktikum
          </div>

          <!-- Slider Volume -->
          <div class="mini-lab-control-group">
            <label>
              <span>Atur Volume Cairan:</span>
              <span class="val-badge">${vol.toFixed(1)} mL</span>
            </label>
            <input type="range" class="mini-lab-slider" min="10" max="95" step="0.5" value="${vol}" 
              oninput="window.labAR.setMeniscusVolume(this.value)" />
          </div>

          <!-- Pilihan Jenis Meniskus -->
          <div class="mini-lab-control-group">
            <label>Jenis Zat Cair & Bentuk Meniskus:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${liquid === 'air' ? 'active' : ''}" onclick="window.labAR.setMeniscusLiquid('air')">
                💧 Air / Aquades (Meniskus Cekung)
              </button>
              <button class="mini-lab-opt-btn ${liquid === 'raksa' ? 'active' : ''}" onclick="window.labAR.setMeniscusLiquid('raksa')">
                ⚪ Raksa / Mercury (Meniskus Cembung)
              </button>
            </div>
          </div>

          <!-- Posisi Sudut Mata -->
          <div class="mini-lab-control-group">
            <label>Posisi Mata Pengamat (Uji Efek Paralaks):</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${angle === 'top' ? 'active' : ''}" onclick="window.labAR.setEyeAngle('top')">
                👁️ Terlalu Tinggi (+4 mL)
              </button>
              <button class="mini-lab-opt-btn ${angle === 'normal' ? 'active' : ''}" onclick="window.labAR.setEyeAngle('normal')">
                👁️ Sejajar 90° (Akurat ✓)
              </button>
              <button class="mini-lab-opt-btn ${angle === 'bottom' ? 'active' : ''}" onclick="window.labAR.setEyeAngle('bottom')">
                👁️ Terlalu Rendah (-4 mL)
              </button>
            </div>
          </div>

          <!-- Result & Key Takeaway -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-lightbulb"></i> Kaidah Pembacaan Meniskus:</h5>
            <div class="mini-lab-result-row">
              <span>Volume Nyata (True Volume):</span>
              <span class="num-val">${vol.toFixed(1)} mL</span>
            </div>
            <div class="mini-lab-result-row">
              <span>Hasil Pengamatan Mata:</span>
              <span class="num-val" style="color: ${angle === 'normal' ? 'var(--accent-green)' : '#ef4444'};">
                ${observedVol.toFixed(1)} mL (${angle === 'normal' ? 'Akurat' : 'Paralaks Terjadi'})
              </span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem; line-height: 1.4;">
              ${liquid === 'air' 
                ? '📌 <strong>Meniskus Cekung</strong>: Pembacaan skala yang benar diambil tepat pada <strong>titik terbawah lengkungan cekungan</strong> cairan.' 
                : '📌 <strong>Meniskus Cembung</strong>: Pembacaan skala yang benar diambil tepat pada <strong>titik teratas kubah cembungan</strong> cairan.'}
            </p>
          </div>

          <!-- Mini Quiz / Challenge -->
          <div class="mini-lab-quiz-box">
            <h5><i class="fa-solid fa-circle-question"></i> Tantangan Baca Meniskus:</h5>
            <p style="font-size: 0.8rem; color: var(--text-main);">
              Berapakah volume cairan pada tabung di atas jika dibaca dengan posisi mata sejajar?
            </p>
            <div class="mini-lab-quiz-input-row">
              <input type="number" id="quiz-meniscus-input" class="mini-lab-quiz-input" placeholder="Contoh: 45.0" step="0.1" />
              <button class="btn btn-accent" style="padding: 0.45rem 1rem; font-size: 0.85rem;" onclick="window.labAR.checkMeniscusQuiz()">
                Cek Jawaban
              </button>
            </div>
            <div id="quiz-meniscus-feedback" class="mini-lab-quiz-feedback"></div>
          </div>
        </div>
      </div>
    `;
  }

  setMeniscusVolume(val) {
    this.miniLabState.meniscusVol = parseFloat(val);
    this.renderMiniLab('gelas-ukur');
  }

  setMeniscusLiquid(liquid) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.meniscusLiquid = liquid;
    this.renderMiniLab('gelas-ukur');
  }

  setEyeAngle(angle) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.eyeAngle = angle;
    this.renderMiniLab('gelas-ukur');
  }

  checkMeniscusQuiz() {
    const input = document.getElementById('quiz-meniscus-input');
    const feedback = document.getElementById('quiz-meniscus-feedback');
    if (!input || !feedback) return;

    const userVal = parseFloat(input.value);
    const target = this.miniLabState.meniscusVol;

    if (isNaN(userVal)) {
      feedback.className = 'mini-lab-quiz-feedback wrong';
      feedback.innerHTML = '⚠️ Masukkan angka volume terlebih dahulu!';
      return;
    }

    if (Math.abs(userVal - target) <= 0.5) {
      if (window.labAudio) window.labAudio.playFanfare();
      feedback.className = 'mini-lab-quiz-feedback correct';
      feedback.innerHTML = `🎉 <strong>Benar Sekali!</strong> Volume tepat adalah <strong>${target.toFixed(1)} mL</strong> pada dasar meniskus.`;
    } else {
      if (window.labAudio) window.labAudio.playError();
      feedback.className = 'mini-lab-quiz-feedback wrong';
      feedback.innerHTML = `❌ <strong>Kurang tepat.</strong> Jawaban kamu: ${userVal.toFixed(1)} mL. Volume yang benar adalah <strong>${target.toFixed(1)} mL</strong>. Perhatikan garis dasar lengkungan!`;
    }
  }

  // =========================================================================
  // 2. JANGKA SORONG - MEMBACA SKALA UTAMA & NONIUS
  // =========================================================================
  renderVernierCaliperLab(container) {
    const val = this.miniLabState.caliperVal; // in cm, e.g. 2.45
    const objType = this.miniLabState.caliperObject;

    // Breakdown skala utama dan nonius (ketelitian 0.01 cm / 0.1 mm)
    const skalaUtama = Math.floor(val * 10) / 10; // e.g. 2.4 cm
    const noniusIndex = Math.round((val - skalaUtama) * 100); // e.g. 5
    const skalaNonius = noniusIndex * 0.01;

    // SVG coordinates: 1 cm = 40px, 1 mm = 4px
    const startX = 60;
    const slideOffset = val * 40;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <!-- Visual Viewport -->
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 440 280" class="svg-sim-canvas" id="caliper-svg">
            <defs>
              <linearGradient id="metalBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#cbd5e1" />
                <stop offset="50%" stop-color="#94a3b8" />
                <stop offset="100%" stop-color="#64748b" />
              </linearGradient>
              <linearGradient id="vernierBlockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f1f5f9" />
                <stop offset="100%" stop-color="#cbd5e1" />
              </linearGradient>
            </defs>

            <!-- Fixed Body & Main Beam -->
            <rect x="20" y="80" width="400" height="45" rx="3" fill="url(#metalBeamGrad)" stroke="#475569" stroke-width="1.5" />

            <!-- Fixed Lower Jaw (Rahang Tetap Bawah) -->
            <polygon points="20,80 60,80 60,230 45,230 20,120" fill="url(#metalBeamGrad)" stroke="#475569" stroke-width="1.5" />

            <!-- Fixed Upper Jaw (Rahang Tetap Atas) -->
            <polygon points="20,80 60,80 60,10 45,10 20,40" fill="url(#metalBeamGrad)" stroke="#475569" stroke-width="1.5" />

            <!-- Object being measured (between jaws) -->
            ${val > 0.1 ? `
              <rect x="60" y="140" width="${slideOffset}" height="60" rx="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />
              <text x="${60 + slideOffset / 2}" y="175" fill="#080e21" font-size="11" font-weight="bold" text-anchor="middle">
                ${val.toFixed(2)} cm
              </text>
            ` : ''}

            <!-- Main Scale Ticks (Skala Utama cm & mm) -->
            ${(() => {
              let ticks = '';
              for (let cm = 0; cm <= 8; cm++) {
                const xPos = startX + (cm * 40);
                // Major cm tick
                ticks += `
                  <line x1="${xPos}" y1="80" x2="${xPos}" y2="105" stroke="#080e21" stroke-width="2" />
                  <text x="${xPos}" y="120" fill="#080e21" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">${cm}</text>
                `;
                // Minor mm ticks (9 ticks between each cm)
                for (let mm = 1; mm < 10; mm++) {
                  const mmX = xPos + (mm * 4);
                  if (mmX <= 410) {
                    const tickH = (mm === 5) ? 98 : 92;
                    ticks += `<line x1="${mmX}" y1="80" x2="${mmX}" y2="${tickH}" stroke="#080e21" stroke-width="1" />`;
                  }
                }
              }
              return ticks;
            })()}

            <!-- Sliding Vernier Jaw (Rahang Geser & Skala Nonius) -->
            <g transform="translate(${slideOffset}, 0)">
              <!-- Sliding Vernier Body -->
              <rect x="60" y="65" width="100" height="75" rx="3" fill="url(#vernierBlockGrad)" stroke="#00f0ff" stroke-width="2" />
              
              <!-- Sliding Lower Jaw -->
              <polygon points="60,80 95,80 95,230 80,230 60,120" fill="url(#vernierBlockGrad)" stroke="#00f0ff" stroke-width="1.5" />

              <!-- Sliding Upper Jaw -->
              <polygon points="60,80 95,80 95,10 80,10 60,40" fill="url(#vernierBlockGrad)" stroke="#00f0ff" stroke-width="1.5" />

              <!-- Vernier Scale Ticks (10 divisions spanning 9mm = 3.6px per div) -->
              ${(() => {
                let vTicks = '';
                for (let n = 0; n <= 10; n++) {
                  const vnX = 60 + (n * 3.6);
                  const isCoincident = (n === noniusIndex);
                  vTicks += `
                    <line x1="${vnX}" y1="65" x2="${vnX}" y2="${n % 5 === 0 ? 82 : 77}" stroke="${isCoincident ? '#ef4444' : '#080e21'}" stroke-width="${isCoincident ? '2.5' : '1.2'}" />
                    ${n % 2 === 0 ? `<text x="${vnX}" y="60" fill="${isCoincident ? '#ef4444' : '#080e21'}" font-size="9" font-weight="bold" text-anchor="middle">${n}</text>` : ''}
                  `;
                }
                return vTicks;
              })()}

              <!-- Lock Screw -->
              <rect x="135" y="52" width="16" height="13" rx="2" fill="#d97706" stroke="#ffffff" stroke-width="1" />
            </g>
          </svg>
        </div>

        <!-- Controls & Practice Panel -->
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-ruler-combined"></i> Panel Pembacaan Jangka Sorong
          </div>

          <!-- Slider Geser Rahang -->
          <div class="mini-lab-control-group">
            <label>
              <span>Geser Rahang Ukur:</span>
              <span class="val-badge">${val.toFixed(2)} cm (${(val * 10).toFixed(1)} mm)</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0.00" max="7.50" step="0.01" value="${val}" 
              oninput="window.labAR.setCaliperValue(this.value)" />
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              <button class="mini-lab-opt-btn" onclick="window.labAR.stepCaliper(-0.10)">-0.10 cm</button>
              <button class="mini-lab-opt-btn" onclick="window.labAR.stepCaliper(-0.01)">-0.01 cm</button>
              <button class="mini-lab-opt-btn" onclick="window.labAR.stepCaliper(+0.01)">+0.01 cm</button>
              <button class="mini-lab-opt-btn" onclick="window.labAR.stepCaliper(+0.10)">+0.10 cm</button>
            </div>
          </div>

          <!-- Preset Benda Ukur -->
          <div class="mini-lab-control-group">
            <label>Pilih Benda untuk Diukur:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${objType === 'kelereng' ? 'active' : ''}" onclick="window.labAR.setCaliperPreset('kelereng', 2.45)">
                🟡 Kelereng (2.45 cm)
              </button>
              <button class="mini-lab-opt-btn ${objType === 'kayu' ? 'active' : ''}" onclick="window.labAR.setCaliperPreset('kayu', 1.82)">
                🪵 Balok Kayu (1.82 cm)
              </button>
              <button class="mini-lab-opt-btn ${objType === 'baut' ? 'active' : ''}" onclick="window.labAR.setCaliperPreset('baut', 0.94)">
                ⚙️ Mur Baut (0.94 cm)
              </button>
              <button class="mini-lab-opt-btn ${objType === 'tabung' ? 'active' : ''}" onclick="window.labAR.setCaliperPreset('tabung', 1.63)">
                🧪 Tabung Reaksi (1.63 cm)
              </button>
            </div>
          </div>

          <!-- Perhitungan Matematis Skala -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-calculator"></i> Analisis Perhitungan Skala:</h5>
            <div class="mini-lab-result-row">
              <span>1. Skala Utama (SU):</span>
              <span class="num-val">${skalaUtama.toFixed(1)} cm</span>
            </div>
            <div class="mini-lab-result-row">
              <span>2. Garis Nonius Berimpit (SN):</span>
              <span class="num-val">Garis ke-${noniusIndex} × 0.01 = ${skalaNonius.toFixed(2)} cm</span>
            </div>
            <div class="mini-lab-result-row" style="border-top: 1px dashed var(--border-color); padding-top: 0.4rem; font-weight: bold;">
              <span>Hasil Pengukuran Total:</span>
              <span class="num-val" style="color: var(--accent-cyan); font-size: 1rem;">
                ${skalaUtama.toFixed(1)} + ${skalaNonius.toFixed(2)} = ${val.toFixed(2)} cm
              </span>
            </div>
          </div>

          <!-- Tantangan Kuis -->
          <div class="mini-lab-quiz-box">
            <h5><i class="fa-solid fa-circle-question"></i> Uji Ketelitian:</h5>
            <p style="font-size: 0.8rem; color: var(--text-main);">
              Berapakah hasil pembacaan jangka sorong di atas dalam satuan centimeter (cm)?
            </p>
            <div class="mini-lab-quiz-input-row">
              <input type="number" id="quiz-caliper-input" class="mini-lab-quiz-input" placeholder="Contoh: 2.45" step="0.01" />
              <button class="btn btn-accent" style="padding: 0.45rem 1rem; font-size: 0.85rem;" onclick="window.labAR.checkCaliperQuiz()">
                Cek Jawaban
              </button>
            </div>
            <div id="quiz-caliper-feedback" class="mini-lab-quiz-feedback"></div>
          </div>
        </div>
      </div>
    `;
  }

  setCaliperValue(val) {
    this.miniLabState.caliperVal = parseFloat(val);
    this.renderMiniLab('jangka-sorong');
  }

  stepCaliper(step) {
    if (window.labAudio) window.labAudio.playClick();
    let newVal = Math.max(0, Math.min(7.5, this.miniLabState.caliperVal + step));
    this.miniLabState.caliperVal = parseFloat(newVal.toFixed(2));
    this.renderMiniLab('jangka-sorong');
  }

  setCaliperPreset(type, val) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.caliperObject = type;
    this.miniLabState.caliperVal = val;
    this.renderMiniLab('jangka-sorong');
  }

  checkCaliperQuiz() {
    const input = document.getElementById('quiz-caliper-input');
    const feedback = document.getElementById('quiz-caliper-feedback');
    if (!input || !feedback) return;

    const userVal = parseFloat(input.value);
    const target = this.miniLabState.caliperVal;

    if (isNaN(userVal)) {
      feedback.className = 'mini-lab-quiz-feedback wrong';
      feedback.innerHTML = '⚠️ Masukkan angka hasil pembacaan!';
      return;
    }

    if (Math.abs(userVal - target) <= 0.01) {
      if (window.labAudio) window.labAudio.playFanfare();
      feedback.className = 'mini-lab-quiz-feedback correct';
      feedback.innerHTML = `🎉 <strong>Tepat Sekali!</strong> Hasil ukur adalah <strong>${target.toFixed(2)} cm</strong> (${(target * 10).toFixed(1)} mm).`;
    } else {
      if (window.labAudio) window.labAudio.playError();
      feedback.className = 'mini-lab-quiz-feedback wrong';
      feedback.innerHTML = `❌ <strong>Belum Tepat.</strong> Hasil yang benar adalah <strong>${target.toFixed(2)} cm</strong>. Periksa kembali garis nonius yang berimpit tegak lurus!`;
    }
  }

  // =========================================================================
  // 3. NERACA OHAUS TIGA LENGAN
  // =========================================================================
  renderOhausBalanceLab(container) {
    const l100 = this.miniLabState.ohaus100;
    const l10 = this.miniLabState.ohaus10;
    const l1 = this.miniLabState.ohaus1;
    const totalSlider = l100 + l10 + l1;
    const targetMass = this.miniLabState.ohausObjectWeight;
    const objName = this.miniLabState.ohausObjectName;

    const diff = totalSlider - targetMass;
    const isBalanced = Math.abs(diff) < 0.15;

    // Pointer angle: negative diff = pointer down, positive diff = pointer up
    const pointerAngle = Math.max(-25, Math.min(25, diff * 3.5));

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 420 280" class="svg-sim-canvas" id="ohaus-svg">
            <defs>
              <linearGradient id="ohausBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#475569" />
                <stop offset="100%" stop-color="#1e293b" />
              </linearGradient>
            </defs>

            <!-- Base & Stand -->
            <polygon points="60,250 360,250 340,220 80,220" fill="#1e293b" stroke="#00f0ff" stroke-width="1.5" />
            <rect x="185" y="110" width="30" height="110" fill="#334155" />
            <!-- Fulcrum Pivot Triangle -->
            <polygon points="200,95 185,120 215,120" fill="#00f0ff" />

            <!-- Weighing Pan (Left) -->
            <line x1="80" y1="100" x2="80" y2="160" stroke="#94a3b8" stroke-width="2" />
            <ellipse cx="80" cy="160" rx="45" ry="12" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
            
            <!-- Sample Object on Pan -->
            <rect x="62" y="125" width="36" height="30" rx="4" fill="#eab308" stroke="#ffffff" stroke-width="1.5" />
            <text x="80" y="145" fill="#080e21" font-size="9" font-weight="bold" text-anchor="middle">
              ${objName.split(' ')[0]}
            </text>

            <!-- 3 Beams Assembly -->
            <!-- Beam 1: 100g, Beam 2: 10g, Beam 3: 1g -->
            <g transform="rotate(${isBalanced ? 0 : pointerAngle * 0.15}, 200, 100)">
              <!-- Main Beam Frame -->
              <rect x="90" y="90" width="280" height="16" rx="2" fill="url(#ohausBeamGrad)" stroke="#64748b" stroke-width="1" />
              <rect x="90" y="70" width="280" height="14" rx="2" fill="url(#ohausBeamGrad)" stroke="#64748b" stroke-width="1" />
              <rect x="90" y="50" width="280" height="14" rx="2" fill="url(#ohausBeamGrad)" stroke="#64748b" stroke-width="1" />

              <!-- Rider 100g (Top Beam) -->
              <polygon points="${100 + (l100 / 500) * 240},42 ${110 + (l100 / 500) * 240},62 ${90 + (l100 / 500) * 240},62" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />

              <!-- Rider 10g (Middle Beam) -->
              <polygon points="${100 + (l10 / 100) * 240},62 ${110 + (l10 / 100) * 240},82 ${90 + (l10 / 100) * 240},82" fill="#06b6d4" stroke="#ffffff" stroke-width="1" />

              <!-- Rider 1g (Bottom Beam) -->
              <polygon points="${100 + (l1 / 10) * 240},82 ${110 + (l1 / 10) * 240},104 ${90 + (l1 / 10) * 240},104" fill="#10b981" stroke="#ffffff" stroke-width="1" />

              <!-- Balance Pointer Needle (Right End) -->
              <line x1="370" y1="100" x2="410" y2="100" stroke="${isBalanced ? '#10b981' : '#ef4444'}" stroke-width="3" />
            </g>

            <!-- Zero Scale Target Gauge -->
            <rect x="400" y="75" width="15" height="50" fill="#080e21" stroke="#00f0ff" stroke-width="1" />
            <line x1="400" y1="100" x2="415" y2="100" stroke="#10b981" stroke-width="2.5" />
            <text x="390" y="104" fill="#10b981" font-size="11" font-weight="bold">0</text>
          </svg>
        </div>

        <!-- Controls -->
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-scale-balanced"></i> Pengaturan Lengan Neraca Ohaus
          </div>

          <!-- Pilihan Benda Uji -->
          <div class="mini-lab-control-group">
            <label>Pilih Benda Uji di Piringan:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${objName.includes('Granit') ? 'active' : ''}" onclick="window.labAR.setOhausObject('Batu Granit', 145.6)">
                🪨 Batu Granit
              </button>
              <button class="mini-lab-opt-btn ${objName.includes('Kunci') ? 'active' : ''}" onclick="window.labAR.setOhausObject('Kunci Besi', 68.4)">
                🗝️ Kunci Besi
              </button>
              <button class="mini-lab-opt-btn ${objName.includes('Tembaga') ? 'active' : ''}" onclick="window.labAR.setOhausObject('Beban Tembaga', 235.8)">
                🥉 Tembaga
              </button>
              <button class="mini-lab-opt-btn ${objName.includes('Arloji') ? 'active' : ''}" onclick="window.labAR.setOhausObject('Kaca Arloji', 42.2)">
                🧫 Kaca Arloji
              </button>
            </div>
          </div>

          <!-- Lengan 1: 100g -->
          <div class="mini-lab-control-group">
            <label>
              <span>Lengan Belakang (Ratusan):</span>
              <span class="val-badge">${l100} g</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0" max="500" step="100" value="${l100}" 
              oninput="window.labAR.setOhausBeam('100', this.value)" />
          </div>

          <!-- Lengan 2: 10g -->
          <div class="mini-lab-control-group">
            <label>
              <span>Lengan Tengah (Puluhan):</span>
              <span class="val-badge">${l10} g</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0" max="100" step="10" value="${l10}" 
              oninput="window.labAR.setOhausBeam('10', this.value)" />
          </div>

          <!-- Lengan 3: 1g -->
          <div class="mini-lab-control-group">
            <label>
              <span>Lengan Depan (Satuan & Desimal):</span>
              <span class="val-badge">${l1.toFixed(1)} g</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0" max="10" step="0.1" value="${l1}" 
              oninput="window.labAR.setOhausBeam('1', this.value)" />
          </div>

          <!-- Result & Balance Status -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-equals"></i> Total Massa Anting Timbangan:</h5>
            <div class="mini-lab-result-row">
              <span>Perhitungan Massa:</span>
              <span class="num-val">${l100}g + ${l10}g + ${l1.toFixed(1)}g = ${totalSlider.toFixed(1)} gram</span>
            </div>
            <div class="mini-lab-result-row">
              <span>Status Keseimbangan:</span>
              <span class="num-val" style="color: ${isBalanced ? 'var(--accent-green)' : '#f59e0b'};">
                ${isBalanced ? '⚖️ SEIMBANG TEPAT DI TITIK NOL! (Sempurna ✓)' : (diff > 0 ? '⬇️ Beban Anting Terlalu Berat' : '⬆️ Beban Anting Terlalu Ringan')}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setOhausBeam(beam, val) {
    if (beam === '100') this.miniLabState.ohaus100 = parseInt(val);
    if (beam === '10') this.miniLabState.ohaus10 = parseInt(val);
    if (beam === '1') this.miniLabState.ohaus1 = parseFloat(val);

    const total = this.miniLabState.ohaus100 + this.miniLabState.ohaus10 + this.miniLabState.ohaus1;
    if (Math.abs(total - this.miniLabState.ohausObjectWeight) < 0.15) {
      if (window.labAudio) window.labAudio.playCorrect();
    }
    this.renderMiniLab('neraca-ohaus');
  }

  setOhausObject(name, weight) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.ohausObjectName = name;
    this.miniLabState.ohausObjectWeight = weight;
    this.renderMiniLab('neraca-ohaus');
  }

  // =========================================================================
  // 4. TERMOMETER LAB - MEMBACA SKALA SUHU & KONVERSI
  // =========================================================================
  renderThermometerLab(container) {
    const tempC = this.miniLabState.tempVal;
    const tempK = tempC + 273.15;
    const tempF = (tempC * 9 / 5) + 32;
    const tempR = tempC * 4 / 5;

    // SVG height calculation: -10°C -> y 330, 110°C -> y 50
    // Total 120° span in 280px -> ~2.33px per °C
    const colY = 330 - ((tempC + 10) * 2.33);

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 380" class="svg-sim-canvas" id="thermo-svg">
            <defs>
              <linearGradient id="mercuryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ef4444" />
                <stop offset="100%" stop-color="#b91c1c" />
              </linearGradient>
            </defs>

            <!-- Outer Glass Tube -->
            <rect x="145" y="40" width="30" height="280" rx="15" fill="rgba(255,255,255,0.08)" stroke="#38bdf8" stroke-width="2" />
            
            <!-- Bottom Bulb -->
            <circle cx="160" cy="335" r="24" fill="url(#mercuryGrad)" stroke="#38bdf8" stroke-width="2" />

            <!-- Red Fluid Thread -->
            <rect x="156" y="${colY}" width="8" height="${335 - colY}" fill="url(#mercuryGrad)" />

            <!-- Celsius Ticks & Numbers -->
            ${(() => {
              let ticks = '';
              for (let t = -10; t <= 110; t += 10) {
                const yPos = 330 - ((t + 10) * 2.33);
                ticks += `
                  <line x1="175" y1="${yPos}" x2="190" y2="${yPos}" stroke="#ffffff" stroke-width="1.8" />
                  <text x="198" y="${yPos + 4}" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold">${t}°C</text>
                `;
              }
              return ticks;
            })()}

            <!-- Current Temp Badge -->
            <rect x="30" y="${colY - 15}" width="95" height="30" rx="4" fill="#080e21" stroke="#ef4444" stroke-width="1.5" />
            <text x="77" y="${colY + 4}" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">${tempC}°C</text>
            <line x1="125" y1="${colY}" x2="156" y2="${colY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3" />
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-temperature-half"></i> Pengaturan & Konversi Suhu
          </div>

          <!-- Slider Suhu -->
          <div class="mini-lab-control-group">
            <label>
              <span>Atur Suhu Termometer:</span>
              <span class="val-badge">${tempC} °C</span>
            </label>
            <input type="range" class="mini-lab-slider" min="-10" max="110" step="1" value="${tempC}" 
              oninput="window.labAR.setThermometerTemp(this.value)" />
          </div>

          <!-- Preset Termal -->
          <div class="mini-lab-control-group">
            <label>Titik Acuan Termal Sains:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${tempC === 0 ? 'active' : ''}" onclick="window.labAR.setThermometerTemp(0)">🧊 Es Melebur (0°C)</button>
              <button class="mini-lab-opt-btn ${tempC === 27 ? 'active' : ''}" onclick="window.labAR.setThermometerTemp(27)">🏢 Ruang Lab (27°C)</button>
              <button class="mini-lab-opt-btn ${tempC === 37 ? 'active' : ''}" onclick="window.labAR.setThermometerTemp(37)">🩺 Tubuh Normal (37°C)</button>
              <button class="mini-lab-opt-btn ${tempC === 65 ? 'active' : ''}" onclick="window.labAR.setThermometerTemp(65)">☕ Air Hangat (65°C)</button>
              <button class="mini-lab-opt-btn ${tempC === 100 ? 'active' : ''}" onclick="window.labAR.setThermometerTemp(100)">💨 Air Mendidih (100°C)</button>
            </div>
          </div>

          <!-- Konversi 4 Skala -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-globe"></i> Konversi 4 Skala Suhu:</h5>
            <div class="mini-lab-result-row"><span>Skala Celsius (°C):</span><span class="num-val">${tempC.toFixed(1)} °C</span></div>
            <div class="mini-lab-result-row"><span>Skala Kelvin (K = C + 273):</span><span class="num-val">${tempK.toFixed(1)} K</span></div>
            <div class="mini-lab-result-row"><span>Skala Fahrenheit (°F = 9/5·C + 32):</span><span class="num-val">${tempF.toFixed(1)} °F</span></div>
            <div class="mini-lab-result-row"><span>Skala Reamur (°R = 4/5·C):</span><span class="num-val">${tempR.toFixed(1)} °R</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setThermometerTemp(val) {
    this.miniLabState.tempVal = parseInt(val);
    this.renderMiniLab('termometer-lab');
  }

  // =========================================================================
  // 5. MIKROSKOP - FOKUS PREPARAT & PERBESARAN
  // =========================================================================
  renderMicroscopeLab(container) {
    const spec = this.miniLabState.microSpecimen;
    const obj = this.miniLabState.microObjective;
    const focus = this.miniLabState.microFocus;
    const light = this.miniLabState.microLight;

    // Ideal focus is 100%. Blur calculation
    const blurAmount = Math.abs(100 - focus) * 0.15;
    const isSharp = blurAmount <= 1.2;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <div style="width: 260px; height: 260px; border-radius: 50%; border: 6px solid #1e293b; position: relative; overflow: hidden; background: #000; box-shadow: 0 0 30px rgba(0,240,255,0.2);">
            <!-- Specimen Graphic Layer with live blur -->
            <div style="width: 100%; height: 100%; filter: blur(${blurAmount}px) brightness(${light / 70}); transition: filter 0.05s ease; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center;">
              ${(() => {
                if (spec === 'bawang') {
                  return `
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                      <rect width="200" height="200" fill="#fef3c7" />
                      <!-- Onion cell walls -->
                      <path d="M 10,20 L 190,20 M 10,60 L 190,60 M 10,100 L 190,100 M 10,140 L 190,140 M 10,180 L 190,180" stroke="#d97706" stroke-width="2" />
                      <path d="M 50,20 L 50,60 M 120,20 L 120,60 M 80,60 L 80,100 M 160,60 L 160,100 M 40,100 L 40,140 M 130,100 L 130,140 M 90,140 L 90,180" stroke="#d97706" stroke-width="2" />
                      <!-- Nuclei -->
                      <circle cx="85" cy="40" r="5" fill="#b45309" />
                      <circle cx="120" cy="80" r="5" fill="#b45309" />
                      <circle cx="85" cy="120" r="5" fill="#b45309" />
                      <circle cx="140" cy="160" r="5" fill="#b45309" />
                    </svg>
                  `;
                } else if (spec === 'rhoeo') {
                  return `
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                      <rect width="200" height="200" fill="#dcfce7" />
                      <!-- Purple anthocyanin cells & green stomata -->
                      <circle cx="60" cy="60" r="14" fill="#a855f7" opacity="0.6" />
                      <circle cx="140" cy="60" r="14" fill="#a855f7" opacity="0.6" />
                      <circle cx="100" cy="120" r="16" fill="#16a34a" />
                      <!-- Stoma slit -->
                      <ellipse cx="100" cy="120" rx="4" ry="10" fill="#052e16" />
                    </svg>
                  `;
                } else {
                  return `
                    <svg viewBox="0 0 200 200" width="100%" height="100%">
                      <rect width="200" height="200" fill="#e0f2fe" />
                      <!-- Irregular cheek epithelial cells -->
                      <path d="M 40,60 Q 80,40 100,70 Q 90,100 50,90 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5" />
                      <circle cx="70" cy="70" r="4" fill="#0369a1" />
                      <path d="M 110,110 Q 160,90 170,130 Q 140,160 110,140 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5" />
                      <circle cx="140" cy="130" r="4" fill="#0369a1" />
                    </svg>
                  `;
                }
              })()}
            </div>
            <!-- Crosshair Ring -->
            <div style="position: absolute; top:0; left:0; width:100%; height:100%; border: 1px dashed rgba(255,255,255,0.2); border-radius:50%; pointer-events:none;"></div>
          </div>
          <span style="font-size: 0.8rem; color: var(--accent-cyan); margin-top: 0.6rem; font-weight: bold;">
            Perbesaran Total: ${obj * 10}x (Okuler 10x × Objektif ${obj}x)
          </span>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-microscope"></i> Pengaturan Optik Mikroskop
          </div>

          <!-- Pilihan Preparat -->
          <div class="mini-lab-control-group">
            <label>Pilih Preparat Spesimen:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${spec === 'bawang' ? 'active' : ''}" onclick="window.labAR.setMicroSpecimen('bawang')">🧅 Sel Bawang Merah</button>
              <button class="mini-lab-opt-btn ${spec === 'rhoeo' ? 'active' : ''}" onclick="window.labAR.setMicroSpecimen('rhoeo')">🍃 Stomata Daun Rhoeo</button>
              <button class="mini-lab-opt-btn ${spec === 'pipi' ? 'active' : ''}" onclick="window.labAR.setMicroSpecimen('pipi')">👄 Epitel Mulut</button>
            </div>
          </div>

          <!-- Lensa Objektif -->
          <div class="mini-lab-control-group">
            <label>Lensa Objektif (Revolver):</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${obj === 4 ? 'active' : ''}" onclick="window.labAR.setMicroObjective(4)">4x (Total 40x)</button>
              <button class="mini-lab-opt-btn ${obj === 10 ? 'active' : ''}" onclick="window.labAR.setMicroObjective(10)">10x (Total 100x)</button>
              <button class="mini-lab-opt-btn ${obj === 40 ? 'active' : ''}" onclick="window.labAR.setMicroObjective(40)">40x (Total 400x)</button>
            </div>
          </div>

          <!-- Slider Fokus -->
          <div class="mini-lab-control-group">
            <label>
              <span>Putar Makrometer / Mikrometer:</span>
              <span class="val-badge">${isSharp ? 'Fokus Optimal ✓' : 'Kurang Fokus'}</span>
            </label>
            <input type="range" class="mini-lab-slider" min="30" max="170" step="1" value="${focus}" 
              oninput="window.labAR.setMicroFocus(this.value)" />
          </div>

          <!-- Status Card -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-eye"></i> Kualitas Pengamatan:</h5>
            <div class="mini-lab-result-row">
              <span>Kejelasan Bayangan:</span>
              <span class="num-val" style="color: ${isSharp ? 'var(--accent-green)' : '#f59e0b'};">
                ${isSharp ? '🌟 100% Jernih & Detail Terlihat' : `Kabur (${Math.round((1 - blurAmount / 15) * 100)}%)`}
              </span>
            </div>
            ${isSharp ? `<p style="font-size: 0.78rem; color: var(--accent-green); margin-top: 0.3rem;">✓ Teridentifikasi: Dinding Sel, Inti Sel (Nukleus), dan Sitoplasma terlihat jelas!</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  setMicroSpecimen(s) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.microSpecimen = s;
    this.renderMiniLab('mikroskop');
  }

  setMicroObjective(o) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.microObjective = o;
    this.renderMiniLab('mikroskop');
  }

  setMicroFocus(f) {
    this.miniLabState.microFocus = parseInt(f);
    this.renderMiniLab('mikroskop');
  }

  // =========================================================================
  // 6. BUNSEN - PENGATURAN API SPIRITUS
  // =========================================================================
  renderBunsenLab(container) {
    const valve = this.miniLabState.bunsenAirValve;
    const isBlue = valve >= 50;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <!-- Lamp / Burner Body -->
            <polygon points="120,280 200,280 180,180 140,180" fill="#334155" stroke="#38bdf8" stroke-width="2" />
            <rect x="150" y="150" width="20" height="30" fill="#94a3b8" />
            
            <!-- Flame -->
            ${isBlue ? `
              <!-- Blue Optimal Oxidizing Flame -->
              <path d="M 160,50 Q 190,110 175,150 Q 160,160 145,150 Q 130,110 160,50 Z" fill="#00f0ff" opacity="0.9" />
              <path d="M 160,80 Q 175,120 168,150 Q 160,155 152,150 Q 145,120 160,80 Z" fill="#38ef7d" opacity="0.8" />
            ` : `
              <!-- Yellow Sooty Reducing Flame -->
              <path d="M 160,30 Q 200,100 180,150 Q 160,160 140,150 Q 120,100 160,30 Z" fill="#f59e0b" opacity="0.95" />
              <path d="M 160,60 Q 180,110 170,150 Q 160,155 150,150 Q 140,110 160,60 Z" fill="#ef4444" opacity="0.8" />
            `}
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-fire"></i> Pengaturan Kerah Udara Bunsen</div>
          <div class="mini-lab-control-group">
            <label>
              <span>Kerah Udara (Air Collar):</span>
              <span class="val-badge">${isBlue ? 'Terbuka (Api Biru)' : 'Tertutup (Api Kuning)'}</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0" max="100" step="10" value="${valve}" oninput="window.labAR.setBunsenValve(this.value)" />
          </div>

          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-fire-flame-curved"></i> Karakteristik Nyala Api:</h5>
            <div class="mini-lab-result-row"><span>Tipe Nyala:</span><span class="num-val">${isBlue ? 'Api Biru Oksidasi (Optimal)' : 'Api Kuning Reduksi (Berjelaga)'}</span></div>
            <div class="mini-lab-result-row"><span>Estimasi Suhu:</span><span class="num-val">${isBlue ? '~800 °C (Panas Maksimal)' : '~300 °C (Kurang Panas)'}</span></div>
            <div class="mini-lab-result-row"><span>Kebersihan:</span><span class="num-val">${isBlue ? 'Bersih Bebas Jelaga' : 'Meninggalkan Kerak Hitam'}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setBunsenValve(val) {
    this.miniLabState.bunsenAirValve = parseInt(val);
    this.renderMiniLab('bunsen-spiritus');
  }

  // =========================================================================
  // 7. BEAKER & PIPET TETES
  // =========================================================================
  renderBeakerPipetteLab(container) {
    const drops = this.miniLabState.dropCount;
    const addedVol = (drops * 0.05).toFixed(2); // 20 drops = 1 mL

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <!-- Beaker -->
            <rect x="90" y="120" width="140" height="160" rx="6" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2" />
            <!-- Liquid -->
            <rect x="92" y="${280 - (50 + drops * 2)}" width="136" height="${50 + drops * 2}" fill="#00f0ff" opacity="0.75" />
            <!-- Dropper Pipette -->
            <rect x="155" y="20" width="10" height="70" fill="rgba(255,255,255,0.3)" stroke="#ffffff" />
            <polygon points="155,90 165,90 160,105" fill="#ffffff" />
            <!-- Droplet falling -->
            <circle cx="160" cy="115" r="4" fill="#00f0ff" />
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-droplet"></i> Kalibrasi Pipet Tetes</div>
          <p style="font-size: 0.82rem; color: var(--text-main);">Teteskan larutan indikator menggunakan pipet tetes tegak lurus (90°):</p>
          <button class="btn btn-accent" onclick="window.labAR.addDrop()"><i class="fa-solid fa-hand-holding-droplet"></i> Teteskan 1 Tetes</button>
          <button class="btn btn-secondary" onclick="window.labAR.resetDrops()">Reset</button>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Jumlah Tetesan:</span><span class="num-val">${drops} tetes</span></div>
            <div class="mini-lab-result-row"><span>Volume Tertambah (20 tetes ≈ 1 mL):</span><span class="num-val">${addedVol} mL</span></div>
          </div>
        </div>
      </div>
    `;
  }

  addDrop() {
    if (window.labAudio) window.labAudio.playDrop();
    this.miniLabState.dropCount++;
    this.renderMiniLab('gelas-kimia');
  }

  resetDrops() {
    this.miniLabState.dropCount = 0;
    this.renderMiniLab('gelas-kimia');
  }

  // =========================================================================
  // 8. ERLENMEYER - TITRASI
  // =========================================================================
  renderErlenmeyerLab(container) {
    const volAdded = this.miniLabState.titrationAdded;
    const isEquiv = volAdded >= 25.0;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <!-- Erlenmeyer Conical Flask -->
            <polygon points="160,100 120,260 200,260" fill="${isEquiv ? '#f472b6' : 'rgba(255,255,255,0.06)'}" stroke="#38bdf8" stroke-width="2" />
            <rect x="150" y="50" width="20" height="50" fill="rgba(255,255,255,0.08)" stroke="#38bdf8" stroke-width="2" />
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-flask"></i> Simulasi Titrasi Asam-Basa</div>
          <p style="font-size: 0.82rem; color: var(--text-main);">Teteskan NaOH 0.1M ke Erlenmeyer (25 mL HCl + Indikator PP):</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-accent" onclick="window.labAR.addTitrant(5)">+5 mL NaOH</button>
            <button class="btn btn-secondary" onclick="window.labAR.resetTitration()">Reset</button>
          </div>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Volume NaOH Ditambahkan:</span><span class="num-val">${volAdded.toFixed(1)} mL</span></div>
            <div class="mini-lab-result-row"><span>Status Titrasi:</span><span class="num-val" style="color: ${isEquiv ? '#f472b6' : 'var(--accent-cyan)'};">${isEquiv ? '🌸 Titik Akhir Tercapai (Merah Muda)' : 'Bening (Belum Ekuivalen)'}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  addTitrant(amt) {
    if (window.labAudio) window.labAudio.playDrop();
    this.miniLabState.titrationAdded += amt;
    if (this.miniLabState.titrationAdded >= 25 && window.labAudio) {
      window.labAudio.playFanfare();
    }
    this.renderMiniLab('labu-erlenmeyer');
  }

  resetTitration() {
    this.miniLabState.titrationAdded = 0;
    this.renderMiniLab('labu-erlenmeyer');
  }

  // =========================================================================
  // 9. TABUNG REAKSI - UJI PENGENDAPAN
  // =========================================================================
  renderTestTubeLab(container) {
    const type = this.miniLabState.reactionType;
    let precipitateColor = '#ffffff';
    let label = 'Endapan Putih AgCl';
    if (type === 'cu') { precipitateColor = '#3b82f6'; label = 'Endapan Biru Gelatin Cu(OH)2'; }
    if (type === 'gas') { precipitateColor = '#e2e8f0'; label = 'Gelembung Gas CO2'; }

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <!-- Test Tube tilted 45° -->
            <g transform="rotate(25, 160, 200)">
              <rect x="145" y="60" width="30" height="180" rx="15" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2" />
              <!-- Precipitate -->
              <rect x="147" y="190" width="26" height="45" rx="12" fill="${precipitateColor}" opacity="0.9" />
            </g>
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-vial"></i> Uji Reaksi Kimia Tabung Reaksi</div>
          <div class="mini-lab-control-group">
            <label>Pilih Campuran Reaksi:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${type === 'agcl' ? 'active' : ''}" onclick="window.labAR.setReactionType('agcl')">NaCl + AgNO3 (AgCl ↓)</button>
              <button class="mini-lab-opt-btn ${type === 'cu' ? 'active' : ''}" onclick="window.labAR.setReactionType('cu')">CuSO4 + NaOH (Cu(OH)2 ↓)</button>
              <button class="mini-lab-opt-btn ${type === 'gas' ? 'active' : ''}" onclick="window.labAR.setReactionType('gas')">HCl + CaCO3 (Gas CO2 ↑)</button>
            </div>
          </div>

          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-atom"></i> Hasil Reaksi:</h5>
            <div class="mini-lab-result-row"><span>Fenomena Teramati:</span><span class="num-val">${label}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setReactionType(t) {
    if (window.labAudio) window.labAudio.playCorrect();
    this.miniLabState.reactionType = t;
    this.renderMiniLab('tabung-reaksi');
  }

  // =========================================================================
  // 10. CAWAN PETRI - COLONY COUNTER
  // =========================================================================
  renderPetriDishLab(container) {
    const countedSet = this.miniLabState.petriCounted;
    const totalCounted = countedSet.size;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas" id="petri-grid-svg">
            <circle cx="160" cy="160" r="130" fill="#fef08a" opacity="0.75" stroke="#38bdf8" stroke-width="2" />
            <!-- Quadrant Lines -->
            <line x1="160" y1="30" x2="160" y2="290" stroke="#080e21" stroke-width="1.5" stroke-dasharray="4,4" />
            <line x1="30" y1="160" x2="290" y2="160" stroke="#080e21" stroke-width="1.5" stroke-dasharray="4,4" />
            
            <!-- 20 Colony dots -->
            ${(() => {
              const dots = [
                {id: 1, x: 110, y: 90}, {id: 2, x: 130, y: 120}, {id: 3, x: 90, y: 140}, {id: 4, x: 140, y: 80},
                {id: 5, x: 210, y: 90}, {id: 6, x: 190, y: 120}, {id: 7, x: 230, y: 130}, {id: 8, x: 180, y: 70},
                {id: 9, x: 100, y: 210}, {id: 10, x: 130, y: 230}, {id: 11, x: 80, y: 190}, {id: 12, x: 140, y: 190},
                {id: 13, x: 210, y: 210}, {id: 14, x: 190, y: 240}, {id: 15, x: 240, y: 200}, {id: 16, x: 175, y: 220}
              ];
              return dots.map(d => `
                <circle cx="${d.x}" cy="${d.y}" r="8" fill="${countedSet.has(d.id) ? '#10b981' : '#ea580c'}" 
                  class="colony-point ${countedSet.has(d.id) ? 'counted' : ''}" onclick="window.labAR.toggleColony(${d.id})" />
              `).join('');
            })()}
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-calculator"></i> Penghitung Koloni Mikroba (Colony Counter)</div>
          <p style="font-size: 0.82rem; color: var(--text-main);">Klik titik-titik koloni bakteri pada cawan petri untuk menandai dan menghitungnya:</p>
          <button class="btn btn-secondary" onclick="window.labAR.resetColonies()">Reset Hitungan</button>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Jumlah Koloni Terhitung:</span><span class="num-val">${totalCounted} CFU</span></div>
            <div class="mini-lab-result-row"><span>Kepadatan (Faktor 10^3):</span><span class="num-val">${(totalCounted * 1000).toLocaleString()} CFU/mL</span></div>
          </div>
        </div>
      </div>
    `;
  }

  toggleColony(id) {
    if (this.miniLabState.petriCounted.has(id)) {
      this.miniLabState.petriCounted.delete(id);
    } else {
      if (window.labAudio) window.labAudio.playCorrect();
      this.miniLabState.petriCounted.add(id);
    }
    this.renderMiniLab('cawan-petri');
  }

  resetColonies() {
    this.miniLabState.petriCounted.clear();
    this.renderMiniLab('cawan-petri');
  }

  // =========================================================================
  // 11. LUP, KAKI TIGA, CORONG & BATANG PENGADUK
  // =========================================================================
  renderMagnifyingGlassLab(container) {
    const dist = this.miniLabState.lupDistance;
    const mag = (25 / 10 + 1).toFixed(1);

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <circle cx="160" cy="160" r="90" fill="rgba(255,255,255,0.1)" stroke="#d97706" stroke-width="6" />
            <text x="160" y="170" font-size="${18 + dist * 3}" fill="#10b981" font-weight="bold" text-anchor="middle">🍃 SERAT DAUN</text>
          </svg>
        </div>
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-magnifying-glass"></i> Pembiasan Lensa Lup</div>
          <div class="mini-lab-control-group">
            <label><span>Jarak Lup ke Objek:</span><span class="val-badge">${dist} cm</span></label>
            <input type="range" class="mini-lab-slider" min="2" max="15" step="1" value="${dist}" oninput="window.labAR.setLupDistance(this.value)" />
          </div>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Sifat Bayangan:</span><span class="num-val">Maya, Tegak, Diperbesar</span></div>
            <div class="mini-lab-result-row"><span>Perbesaran Sudut:</span><span class="num-val">${mag}x</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setLupDistance(d) {
    this.miniLabState.lupDistance = parseInt(d);
    this.renderMiniLab('lup');
  }

  renderTripodGauzeLab(container) {
    const mode = this.miniLabState.gauzeMode;
    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <!-- Flame bottom -->
            <polygon points="140,280 180,280 160,200" fill="#00f0ff" />
            <!-- Tripod & Gauze -->
            <line x1="80" y1="180" x2="240" y2="180" stroke="#94a3b8" stroke-width="4" />
            ${mode === 'with-gauze' ? `
              <rect x="110" y="174" width="100" height="8" fill="#f8fafc" stroke="#334155" stroke-width="1" />
              <!-- Heat Spread Rays -->
              <ellipse cx="160" cy="140" rx="60" ry="12" fill="#ef4444" opacity="0.6" />
            ` : `
              <!-- Dangerous Hotspot Ray -->
              <circle cx="160" cy="160" r="12" fill="#ef4444" />
            `}
            <!-- Beaker on top -->
            <rect x="110" y="80" width="100" height="90" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2" />
          </svg>
        </div>
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-border-all"></i> Uji Distribusi Panas Kawat Kasa</div>
          <div class="mini-lab-options-row">
            <button class="mini-lab-opt-btn ${mode === 'with-gauze' ? 'active' : ''}" onclick="window.labAR.setGauzeMode('with-gauze')">Dengan Kawat Kasa (Aman ✓)</button>
            <button class="mini-lab-opt-btn ${mode === 'no-gauze' ? 'active' : ''}" onclick="window.labAR.setGauzeMode('no-gauze')">Tanpa Kawat Kasa (Risiko Retak)</button>
          </div>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Distribusi Panas:</span><span class="num-val">${mode === 'with-gauze' ? 'Menyebar Merata (Piringan Keramik)' : 'Terpusat di 1 Titik (Thermal Shock)'}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setGauzeMode(m) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.gauzeMode = m;
    this.renderMiniLab('kawat-kasa');
  }

  renderFunnelFiltrationLab(container) {
    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <!-- Funnel & Filter Paper -->
            <polygon points="100,60 220,60 170,150 150,150" fill="rgba(255,255,255,0.1)" stroke="#38bdf8" stroke-width="2" />
            <polygon points="110,70 210,70 160,140" fill="#fef08a" opacity="0.8" />
            <!-- Stem -->
            <rect x="156" y="150" width="8" height="60" fill="rgba(255,255,255,0.2)" stroke="#38bdf8" />
            <!-- Drops -->
            <circle cx="160" cy="230" r="3" fill="#00f0ff" />
            <!-- Beaker below -->
            <rect x="110" y="240" width="100" height="60" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2" />
          </svg>
        </div>
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-filter"></i> Pemisahan Campuran: Filtrasi</div>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Filtrat (Cairan Jernih):</span><span class="num-val">Tertampung di wadah bawah</span></div>
            <div class="mini-lab-result-row"><span>Residu (Padatan):</span><span class="num-val">Tertahan di kertas saring</span></div>
          </div>
        </div>
      </div>
    `;
  }

  renderStirringRodLab(container) {
    const speed = this.miniLabState.stirSpeed;
    let time = '120 detik';
    if (speed === 'slow') time = '35 detik';
    if (speed === 'fast') time = '10 detik';

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <rect x="100" y="100" width="120" height="160" rx="4" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2" />
            <!-- Glass Stirring Rod -->
            <line x1="140" y1="40" x2="180" y2="240" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
          </svg>
        </div>
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-wand-magic-sparkles"></i> Uji Laju Pelarutan Zat</div>
          <div class="mini-lab-options-row">
            <button class="mini-lab-opt-btn ${speed === 'none' ? 'active' : ''}" onclick="window.labAR.setStirSpeed('none')">Tanpa Pengadukan</button>
            <button class="mini-lab-opt-btn ${speed === 'slow' ? 'active' : ''}" onclick="window.labAR.setStirSpeed('slow')">Pengadukan Lambat</button>
            <button class="mini-lab-opt-btn ${speed === 'fast' ? 'active' : ''}" onclick="window.labAR.setStirSpeed('fast')">Pengadukan Cepat</button>
          </div>
          <div class="mini-lab-result-card">
            <div class="mini-lab-result-row"><span>Waktu Larut Sempurna:</span><span class="num-val">${time}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setStirSpeed(s) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.stirSpeed = s;
    this.renderMiniLab('batang-pengaduk');
  }
}

window.labAR = new LabARModule();
