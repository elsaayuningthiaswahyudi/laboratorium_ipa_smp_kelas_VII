// Augmented Reality (AR) Camera & 3D Interactive Lab Tool Simulation
// High-Fidelity Interactive Mini-Labs & Apparatus Observation Activities

class LabARModule {
  constructor() {
    this.videoElem = null;
    this.stream = null;
    this.isCameraActive = false;
    this.currentTool = 'mikroskop';
    this.scale = 1.0;
    this.rotation = 0;
    this.posX = 0;
    this.posY = 0;

    // Mini-Lab Active State Store
    this.miniLabState = {
      // Mikroskop
      microSpecimen: 'bawang',
      microObjective: 10,
      microCoarse: 70,
      microFine: 50,
      microLight: 90,
      microActivePin: null,

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

      // Bunsen
      bunsenAirValve: 100, // 100% blue flame
      bunsenWaterTemp: 27,
      bunsenIsHeating: false,
      bunsenTimer: 0,
      bunsenInterval: null,

      // Pipet & Gelas Kimia
      dropCount: 0,
      beakerVol: 50,

      // Erlenmeyer Titrasi
      titrationAdded: 0,
      isSwirled: false,

      // Tabung Reaksi
      reactionType: 'agcl',

      // Cawan Petri
      petriCounted: new Set(),

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
        this.setTool(this.currentTool || 'mikroskop');
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
      { id: 'mikroskop', name: '🔬 Mikroskop' },
      { id: 'gelas-ukur', name: '📏 Gelas Ukur' },
      { id: 'jangka-sorong', name: '📐 Jangka Sorong' },
      { id: 'neraca-ohaus', name: '⚖️ Neraca Ohaus' },
      { id: 'termometer-lab', name: '🌡️ Termometer' },
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
      case 'mikroskop':
        if (titleElem) titleElem.innerHTML = `Kegiatan Pengamatan: <span class="text-cyan">Fokus Preparat Sel Mikroskop</span>`;
        if (descElem) descElem.textContent = 'Ganti lensa objektif (4x, 10x, 40x), atur makrometer (fokus kasar) dan mikrometer (fokus halus) untuk mendapatkan bayangan preparat yang kristal jernih, serta pelajari anatomi selnya.';
        this.renderMicroscopeLab(bodyContainer);
        break;

      case 'gelas-ukur':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Membaca Meniskus Gelas Ukur Presisi</span>`;
        if (descElem) descElem.textContent = 'Pelajari perbedaan meniskus cekung (air/larutan) vs cembung (raksa), amati pembesaran skala dengan kaca pembesar meniskus, dan hindari kesalahan paralaks sudut pandang.';
        this.renderGraduatedCylinderLab(bodyContainer);
        break;

      case 'jangka-sorong':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Pengukuran Presisi Jangka Sorong (Vernier Caliper)</span>`;
        if (descElem) descElem.textContent = 'Geser rahang ukur menjepit benda, perhatikan garis skala utama dan garis nonius yang berimpit tegak lurus pada lensa pembesar, serta hitung hasil ukur hingga ketelitian 0.01 cm (0.1 mm).';
        this.renderVernierCaliperLab(bodyContainer);
        break;

      case 'neraca-ohaus':
      case 'neraca':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Menimbang dengan Neraca Ohaus 3 Lengan</span>`;
        if (descElem) descElem.textContent = 'Geser anting pemberat pada lengan ratusan, puluhan, dan satuan hingga jarum penunjuk tepat seimbang di garis kalibrasi nol.';
        this.renderOhausBalanceLab(bodyContainer);
        break;

      case 'termometer-lab':
      case 'termometer':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Membaca Skala Suhu & Titik Termal</span>`;
        if (descElem) descElem.textContent = 'Amati pemuaian cairan merah pada pipa kapiler kaca, perhatikan perubahan lingkungan air (es/mendidih), dan konversikan nilai suhu ke 4 skala internasional.';
        this.renderThermometerLab(bodyContainer);
        break;

      case 'bunsen-spiritus':
      case 'bunsen':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Pengaturan Nyala Api Pembakar Spiritus / Bunsen</span>`;
        if (descElem) descElem.textContent = 'Atur katup udara untuk membandingkan nyala api kuning berjelaga (reduksi) vs nyala api biru (oksidasi) dan jalankan uji waktu pemanasan air hingga mendidih.';
        this.renderBunsenLab(bodyContainer);
        break;

      case 'gelas-kimia':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Presisi Pipet Tetes & Penakaran Beaker</span>`;
        if (descElem) descElem.textContent = 'Latih teknik memegang pipet tegak lurus (90°), keluarkan larutan tetes demi tetes, dan hitung kalibrasi tetesan zat cair (20 tetes ≈ 1 mL).';
        this.renderBeakerPipetteLab(bodyContainer);
        break;

      case 'labu-erlenmeyer':
      case 'erlenmeyer':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Simulasi Titrasi & Homogenisasi Larutan</span>`;
        if (descElem) descElem.textContent = 'Teteskan larutan basa dari buret sambil menggoyang labu erlenmeyer hingga mencapai titik akhir titrasi (perubahan warna indikator PP menjadi merah muda seulas).';
        this.renderErlenmeyerLab(bodyContainer);
        break;

      case 'tabung-reaksi':
        if (titleElem) titleElem.innerHTML = `Kegiatan Praktikum: <span class="text-cyan">Uji Reaksi Pengendapan Kimia</span>`;
        if (descElem) descElem.textContent = 'Campurkan larutan kimia skala mikro dalam tabung reaksi untuk mengamati pembentukan endapan dan pelepasan gas.';
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
        this.renderMicroscopeLab(bodyContainer);
    }
  }

  // =========================================================================
  // 1. MIKROSKOP - FOKUS PREPARAT & ANATOMI SEL
  // =========================================================================
  renderMicroscopeLab(container) {
    const spec = this.miniLabState.microSpecimen;
    const obj = this.miniLabState.microObjective;
    const coarse = this.miniLabState.microCoarse;
    const fine = this.miniLabState.microFine;
    const light = this.miniLabState.microLight;
    const activePin = this.miniLabState.microActivePin;

    // Optical focus calculations (Optimum at coarse=70, fine=50)
    const coarseDiff = Math.abs(70 - coarse) * 0.18;
    const fineDiff = Math.abs(50 - fine) * 0.08;
    const totalBlur = Math.max(0, coarseDiff + fineDiff);
    const isSharp = totalBlur <= 1.0;
    const sharpnessPct = Math.max(10, Math.min(100, Math.round(100 - totalBlur * 7)));

    // Scale calculation based on Objective (4x -> 0.8, 10x -> 1.3, 40x -> 2.2)
    const scaleFactor = obj === 4 ? 0.85 : (obj === 10 ? 1.25 : 2.1);

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <!-- Visual Viewport: Realistic Circular Eyepiece -->
        <div class="mini-lab-viewport-box">
          <div class="ocular-eyepiece-frame">
            <!-- Glass Shimmer Overlay -->
            <div class="ocular-glass-shine"></div>
            <!-- Crosshair Reticle -->
            <div class="ocular-crosshair-reticle"></div>

            <!-- Specimen Graphic Layer with live optical zoom, blur, and lighting -->
            <div class="specimen-canvas-layer" style="filter: blur(${totalBlur.toFixed(1)}px) brightness(${(light / 80).toFixed(2)}) contrast(1.15); transform: scale(${scaleFactor}); transform-origin: center center;">
              ${this.getSpecimenSVG(spec, obj)}
            </div>

            <!-- Interactive Organelle Pins (Visible only when sharp) -->
            ${isSharp ? this.getOrganellePins(spec) : ''}
          </div>

          <!-- Bottom Viewport HUD Info -->
          <div style="display: flex; justify-content: space-between; width: 100%; max-width: 320px; margin-top: 1rem; font-size: 0.82rem;">
            <span style="color: var(--accent-cyan); font-weight: 700;">
              <i class="fa-solid fa-magnifying-glass"></i> Perbesaran: ${obj * 10}x
            </span>
            <span style="color: ${isSharp ? 'var(--accent-green)' : '#f59e0b'}; font-weight: 700;">
              <i class="fa-solid ${isSharp ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> Fokus: ${sharpnessPct}%
            </span>
            <span style="color: var(--text-muted);">Skala: ~${obj === 40 ? '20' : (obj === 10 ? '50' : '150')} µm</span>
          </div>
        </div>

        <!-- Controls & Practice Panel -->
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-microscope"></i> Pengaturan Optik Mikroskop
          </div>

          <!-- Pilihan Preparat -->
          <div class="mini-lab-control-group">
            <label>Pilih Preparat Spesimen Biologi:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${spec === 'bawang' ? 'active' : ''}" onclick="window.labAR.setMicroSpecimen('bawang')">
                🧅 Sel Bawang Merah
              </button>
              <button class="mini-lab-opt-btn ${spec === 'rhoeo' ? 'active' : ''}" onclick="window.labAR.setMicroSpecimen('rhoeo')">
                🍃 Stomata Daun Rhoeo
              </button>
              <button class="mini-lab-opt-btn ${spec === 'pipi' ? 'active' : ''}" onclick="window.labAR.setMicroSpecimen('pipi')">
                👄 Sel Epitel Pipi
              </button>
            </div>
          </div>

          <!-- Lensa Objektif (Revolver) -->
          <div class="mini-lab-control-group">
            <label>Lensa Objektif (Putar Revolver):</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${obj === 4 ? 'active' : ''}" onclick="window.labAR.setMicroObjective(4)">
                4x (Total 40x - Luas)
              </button>
              <button class="mini-lab-opt-btn ${obj === 10 ? 'active' : ''}" onclick="window.labAR.setMicroObjective(10)">
                10x (Total 100x - Sedang)
              </button>
              <button class="mini-lab-opt-btn ${obj === 40 ? 'active' : ''}" onclick="window.labAR.setMicroObjective(40)">
                40x (Total 400x - Detail)
              </button>
            </div>
          </div>

          <!-- Slider Makrometer (Fokus Kasar) -->
          <div class="mini-lab-control-group">
            <label>
              <span>1. Makrometer (Fokus Kasar):</span>
              <span class="val-badge">${coarse}</span>
            </label>
            <input type="range" class="mini-lab-slider" min="10" max="130" step="2" value="${coarse}" 
              oninput="window.labAR.setMicroCoarse(this.value)" />
          </div>

          <!-- Slider Mikrometer (Fokus Halus) -->
          <div class="mini-lab-control-group">
            <label>
              <span>2. Mikrometer (Fokus Halus Presisi):</span>
              <span class="val-badge">${fine}</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0" max="100" step="1" value="${fine}" 
              oninput="window.labAR.setMicroFine(this.value)" />
          </div>

          <!-- Status & Organelle Details Card -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-atom"></i> Analisis Hasil Pengamatan:</h5>
            <div class="mini-lab-result-row">
              <span>Kejelasan Bayangan:</span>
              <span class="num-val" style="color: ${isSharp ? 'var(--accent-green)' : '#f59e0b'};">
                ${isSharp ? '🌟 100% Kristal Jernih & Terfokus' : `Kabur (${sharpnessPct}%) - Atur Makro & Mikrometer`}
              </span>
            </div>
            
            ${isSharp ? `
              <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dashed rgba(0,240,255,0.2); font-size: 0.8rem; line-height: 1.5;">
                <span style="color: var(--accent-cyan); font-weight: bold;"><i class="fa-solid fa-circle-nodes"></i> Titik Organel Terdeteksi:</span>
                <p style="color: var(--text-muted); margin-top: 0.2rem;">
                  ${spec === 'bawang' ? '✓ Dinding Sel berstruktur kokoh berlapis lamela tengah, Inti Sel (Nukleus) bulat menyerap pewarna iodin, Sitoplasma, dan Vakuola besar.' : 
                    (spec === 'rhoeo' ? '✓ Sel Penutup (Guard Cells) berbentuk ginjal membuka pori stomata, Kloroplas hijau untuk fotosintesis, dan Sel Epidermis berpigmen antosianin ungu.' : 
                    '✓ Membran Sel fleksibel berbentuk poligonal tak beraturan, Inti Sel (Nukleus) gelap di tengah, dan Sitoplasma bergranula halus.')}
                </p>
                <span style="font-size: 0.75rem; color: var(--accent-orange);">💡 Klik pin angka di viewport untuk mengidentifikasi detail bagian!</span>
              </div>
            ` : ''}

            ${activePin ? `
              <div style="margin-top: 0.6rem; padding: 0.6rem; background: rgba(0,240,255,0.12); border-radius: 6px; border: 1px solid var(--accent-cyan); font-size: 0.82rem;">
                <strong style="color: var(--accent-cyan);">${activePin.title}:</strong> ${activePin.desc}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  getSpecimenSVG(spec, obj) {
    if (spec === 'bawang') {
      // High-detail Onion Epidermis
      return `
        <svg viewBox="0 0 340 340" width="100%" height="100%">
          <defs>
            <radialGradient id="onionNucleus" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#78350f" />
              <stop offset="60%" stop-color="#b45309" />
              <stop offset="100%" stop-color="#d97706" />
            </radialGradient>
            <pattern id="cellGranules" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="0.8" fill="#d97706" opacity="0.35" />
              <circle cx="8" cy="9" r="0.6" fill="#b45309" opacity="0.25" />
            </pattern>
          </defs>

          <!-- Background Cytoplasm -->
          <rect width="340" height="340" fill="#fef3c7" />
          <rect width="340" height="340" fill="url(#cellGranules)" />

          <!-- Cell Walls: Realistic Botanical Layout -->
          <!-- Horizontal Wall Layers -->
          <path d="M 0,45 L 340,45 M 0,115 L 340,115 M 0,185 L 340,185 M 0,255 L 340,255 M 0,325 L 340,325" 
            stroke="#92400e" stroke-width="4" stroke-linecap="round" />
          <path d="M 0,45 L 340,45 M 0,115 L 340,115 M 0,185 L 340,185 M 0,255 L 340,255 M 0,325 L 340,325" 
            stroke="#fef08a" stroke-width="1.5" />

          <!-- Vertical Cross Walls -->
          <path d="M 90,0 L 90,45 M 230,0 L 230,45 
                   M 150,45 L 150,115 M 290,45 L 290,115 
                   M 70,115 L 70,185 M 220,115 L 220,185 
                   M 130,185 L 130,255 M 280,185 L 280,255 
                   M 80,255 L 80,325 M 210,255 L 210,325" 
            stroke="#92400e" stroke-width="4" stroke-linecap="round" />
          <path d="M 90,0 L 90,45 M 230,0 L 230,45 
                   M 150,45 L 150,115 M 290,45 L 290,115 
                   M 70,115 L 70,185 M 220,115 L 220,185 
                   M 130,185 L 130,255 M 280,185 L 280,255 
                   M 80,255 L 80,325 M 210,255 L 210,325" 
            stroke="#fef08a" stroke-width="1.5" />

          <!-- Nuclei with Nucleoli & Chromatin -->
          <g>
            <!-- Cell 1 Nucleus -->
            <ellipse cx="65" cy="80" rx="14" ry="11" fill="url(#onionNucleus)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
            <circle cx="68" cy="79" r="3.5" fill="#451a03" />
            
            <!-- Cell 2 Nucleus -->
            <ellipse cx="215" cy="82" rx="15" ry="12" fill="url(#onionNucleus)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
            <circle cx="218" cy="80" r="3.8" fill="#451a03" />

            <!-- Cell 3 Nucleus -->
            <ellipse cx="145" cy="150" rx="16" ry="13" fill="url(#onionNucleus)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
            <circle cx="147" cy="148" r="4" fill="#451a03" />

            <!-- Cell 4 Nucleus -->
            <ellipse cx="40" cy="220" rx="14" ry="11" fill="url(#onionNucleus)" />
            <circle cx="42" cy="219" r="3.5" fill="#451a03" />

            <!-- Cell 5 Nucleus -->
            <ellipse cx="205" cy="220" rx="15" ry="12" fill="url(#onionNucleus)" />
            <circle cx="207" cy="218" r="3.8" fill="#451a03" />
          </g>

          <!-- Vacuole Boundary Faint Lines -->
          <path d="M 10,60 Q 60,55 130,65 Q 140,95 125,105 Q 40,105 10,90 Z" fill="rgba(254, 240, 138, 0.4)" stroke="#ca8a04" stroke-width="1" stroke-dasharray="3,3" />
        </svg>
      `;
    } else if (spec === 'rhoeo') {
      // High-detail Rhoeo Discolor with purple anthocyanin cells & kidney-shaped guard cells
      return `
        <svg viewBox="0 0 340 340" width="100%" height="100%">
          <defs>
            <radialGradient id="purpleAnthocyanin" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#c084fc" />
              <stop offset="60%" stop-color="#9333ea" />
              <stop offset="100%" stop-color="#6b21a8" />
            </radialGradient>
            <radialGradient id="guardCellGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#86efac" />
              <stop offset="70%" stop-color="#16a34a" />
              <stop offset="100%" stop-color="#14532d" />
            </radialGradient>
          </defs>

          <!-- Background Greenish Base -->
          <rect width="340" height="340" fill="#ecfdf5" />

          <!-- Purple Polygonal Epidermal Cells -->
          <!-- Cell 1 -->
          <polygon points="20,20 120,10 140,80 60,110 10,70" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 2 -->
          <polygon points="120,10 240,15 270,90 140,80" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 3 -->
          <polygon points="240,15 330,30 335,120 270,90" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 4 -->
          <polygon points="10,70 60,110 80,220 15,200" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 5 -->
          <polygon points="270,90 335,120 330,230 260,210" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 6 -->
          <polygon points="15,200 80,220 120,320 20,330" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 7 -->
          <polygon points="260,210 330,230 320,330 240,320" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />
          <!-- Cell 8 -->
          <polygon points="80,220 260,210 240,320 120,320" fill="url(#purpleAnthocyanin)" opacity="0.85" stroke="#4c1d95" stroke-width="3" />

          <!-- Center Stomata Complex (Subsidiary + Guard Cells + Pore) -->
          <g transform="translate(170, 145)">
            <!-- Subsidiary Cell Clear Zone -->
            <ellipse cx="0" cy="0" rx="65" ry="50" fill="#f0fdf4" stroke="#15803d" stroke-width="2.5" />

            <!-- Left Guard Cell (Bean Shaped) -->
            <path d="M -8,-32 C -32,-25 -32,25 -8,32 C -20,20 -20,-20 -8,-32 Z" fill="url(#guardCellGrad)" stroke="#064e3b" stroke-width="2" />
            
            <!-- Right Guard Cell (Bean Shaped) -->
            <path d="M 8,-32 C 32,-25 32,25 8,32 C 20,20 20,-20 8,-32 Z" fill="url(#guardCellGrad)" stroke="#064e3b" stroke-width="2" />

            <!-- Stoma Pore Slit (Ostium) -->
            <ellipse cx="0" cy="0" rx="5" ry="18" fill="#022c22" stroke="#064e3b" stroke-width="1" />

            <!-- Chloroplast Granules in Guard Cells -->
            <circle cx="-18" cy="-14" r="3" fill="#22c55e" stroke="#14532d" />
            <circle cx="-22" cy="0" r="3.2" fill="#22c55e" stroke="#14532d" />
            <circle cx="-16" cy="14" r="3" fill="#22c55e" stroke="#14532d" />

            <circle cx="18" cy="-14" r="3" fill="#22c55e" stroke="#14532d" />
            <circle cx="22" cy="0" r="3.2" fill="#22c55e" stroke="#14532d" />
            <circle cx="16" cy="14" r="3" fill="#22c55e" stroke="#14532d" />

            <!-- Guard Cell Nuclei -->
            <circle cx="-16" cy="-2" r="4" fill="#065f46" />
            <circle cx="16" cy="-2" r="4" fill="#065f46" />
          </g>
        </svg>
      `;
    } else {
      // High-detail Human Cheek Epithelial Cells
      return `
        <svg viewBox="0 0 340 340" width="100%" height="100%">
          <defs>
            <radialGradient id="cheekNucleus" cx="45%" cy="45%" r="55%">
              <stop offset="0%" stop-color="#1e3a8a" />
              <stop offset="70%" stop-color="#1e40af" />
              <stop offset="100%" stop-color="#172554" />
            </radialGradient>
            <radialGradient id="cheekCyto" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#e0f2fe" />
              <stop offset="80%" stop-color="#bae6fd" />
              <stop offset="100%" stop-color="#7dd3fc" />
            </radialGradient>
          </defs>

          <!-- Background Mount Slide -->
          <rect width="340" height="340" fill="#f8fafc" />

          <!-- Main Center Cheek Cell (Irregular Polygonal) -->
          <path d="M 90,60 C 180,40 260,70 280,140 C 295,200 240,270 170,280 C 100,285 50,230 60,160 C 65,110 80,70 90,60 Z" 
            fill="url(#cheekCyto)" stroke="#0284c7" stroke-width="2.5" opacity="0.9" filter="drop-shadow(0 4px 10px rgba(2, 132, 199, 0.2))" />

          <!-- Membrane Folds & Wrinkles -->
          <path d="M 95,85 Q 140,110 180,95 M 240,170 Q 210,210 230,240 M 80,190 Q 110,210 120,250" 
            stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6" />

          <!-- Cytoplasmic Granules -->
          ${(() => {
            let gr = '';
            for (let i = 0; i < 35; i++) {
              const gx = 100 + (Math.sin(i * 3.7) * 65 + 65);
              const gy = 90 + (Math.cos(i * 4.9) * 65 + 65);
              gr += `<circle cx="${gx}" cy="${gy}" r="${0.8 + (i % 3) * 0.4}" fill="#0284c7" opacity="0.35" />`;
            }
            return gr;
          })()}

          <!-- Large Central Nucleus with Chromatin Granules -->
          <g transform="translate(165, 160)">
            <ellipse cx="0" cy="0" rx="18" ry="15" fill="url(#cheekNucleus)" stroke="#0c4a6e" stroke-width="2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" />
            <!-- Nucleolus & Chromatin clusters -->
            <circle cx="3" cy="-2" r="4.5" fill="#082f49" />
            <circle cx="-6" cy="4" r="2" fill="#082f49" opacity="0.7" />
            <circle cx="7" cy="5" r="2.2" fill="#082f49" opacity="0.7" />
          </g>

          <!-- Second Overlapping Smaller Cheek Cell -->
          <path d="M 10,220 C 40,200 80,210 90,260 C 95,300 60,330 20,335 Z" 
            fill="url(#cheekCyto)" stroke="#0284c7" stroke-width="2" opacity="0.6" />
          <ellipse cx="50" cy="270" rx="10" ry="8" fill="url(#cheekNucleus)" opacity="0.7" />
        </svg>
      `;
    }
  }

  getOrganellePins(spec) {
    if (spec === 'bawang') {
      return `
        <div class="micro-hotspot-pin" style="top: 38%; left: 24%;" title="Dinding Sel" onclick="window.labAR.showMicroPinInfo('Dinding Sel (Cell Wall)', 'Lapisan terluar kaku tersusun atas selulosa dan pektin yang memberi bentuk tetap serta perlindungan mekanis pada sel tumbuhan.')">1</div>
        <div class="micro-hotspot-pin" style="top: 48%; left: 45%;" title="Inti Sel (Nukleus)" onclick="window.labAR.showMicroPinInfo('Inti Sel (Nukleus)', 'Organel pengendali seluruh aktivitas sel dan tempat penyimpanan materi genetik (DNA/Kromosom). Tampak bulat menyerap pewarna iodin.')">2</div>
        <div class="micro-hotspot-pin" style="top: 60%; left: 65%;" title="Sitoplasma" onclick="window.labAR.showMicroPinInfo('Sitoplasma & Vakuola', 'Cairan protoplasma tempat berlangsungnya reaksi metabolisme sel, serta vakuola sentral penyimpan cadangan makanan.')">3</div>
      `;
    } else if (spec === 'rhoeo') {
      return `
        <div class="micro-hotspot-pin" style="top: 50%; left: 50%;" title="Porus Stomata" onclick="window.labAR.showMicroPinInfo('Pori Stomata (Ostium)', 'Celah mikroskopis tempat pertukaran gas O2 & CO2 saat fotosintesis serta jalur transpirasi penguapan air daun.')">1</div>
        <div class="micro-hotspot-pin" style="top: 40%; left: 38%;" title="Sel Penutup (Guard Cells)" onclick="window.labAR.showMicroPinInfo('Sel Penutup (Guard Cells)', 'Sepasang sel berbentuk ginjal kaya kloroplas yang mengatur membuka dan menutupnya celah stomata sesuai turgiditas sel.')">2</div>
        <div class="micro-hotspot-pin" style="top: 25%; left: 70%;" title="Pigmen Antosianin" onclick="window.labAR.showMicroPinInfo('Pigmen Antosianin', 'Pigmen flavonoid ungu alami dalam vakuola sel epidermis bawah daun Rhoeo discolor yang melindungi jaringan dari radiasi sinar UV.')">3</div>
      `;
    } else {
      return `
        <div class="micro-hotspot-pin" style="top: 48%; left: 49%;" title="Inti Sel" onclick="window.labAR.showMicroPinInfo('Nukleus Sel Hewan', 'Pusat komando sel yang memiliki membran ganda dan anak inti (nukleolus) di bagian tengah sitoplasma.')">1</div>
        <div class="micro-hotspot-pin" style="top: 30%; left: 65%;" title="Membran Sel" onclick="window.labAR.showMicroPinInfo('Membran Sel (Plasmalema)', 'Lapisan tipis fosfolipid bilayer fleksibel yang bersifat semipermeabel untuk mengatur keluar masuknya zat pada sel hewan.')">2</div>
      `;
    }
  }

  showMicroPinInfo(title, desc) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.microActivePin = { title, desc };
    this.renderMiniLab('mikroskop');
  }

  setMicroSpecimen(s) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.microSpecimen = s;
    this.miniLabState.microActivePin = null;
    this.renderMiniLab('mikroskop');
  }

  setMicroObjective(o) {
    if (window.labAudio) window.labAudio.playClick();
    this.miniLabState.microObjective = o;
    this.renderMiniLab('mikroskop');
  }

  setMicroCoarse(c) {
    this.miniLabState.microCoarse = parseInt(c);
    this.renderMiniLab('mikroskop');
  }

  setMicroFine(f) {
    this.miniLabState.microFine = parseInt(f);
    this.renderMiniLab('mikroskop');
  }

  // =========================================================================
  // 2. GELAS UKUR - MEMBACA MENISKUS DENGAN KACA PEMBESAR LOUPE
  // =========================================================================
  renderGraduatedCylinderLab(container) {
    const vol = this.miniLabState.meniscusVol;
    const liquid = this.miniLabState.meniscusLiquid;
    const angle = this.miniLabState.eyeAngle;

    let observedVol = vol;
    if (angle === 'top') observedVol = vol + 4.5;
    if (angle === 'bottom') observedVol = vol - 4.5;

    let liqColor1 = '#00d2ff', liqColor2 = '#0072ff', liqName = 'Air Aquades (Meniskus Cekung)';
    if (liquid === 'kmno4') { liqColor1 = '#c084fc'; liqColor2 = '#7e22ce'; liqName = 'Larutan KMnO4 (Meniskus Cekung)'; }
    if (liquid === 'oil') { liqColor1 = '#fde047'; liqColor2 = '#ca8a04'; liqName = 'Minyak Nabati (Meniskus Cekung)'; }
    if (liquid === 'raksa') { liqColor1 = '#e2e8f0'; liqColor2 = '#64748b'; liqName = 'Air Raksa (Meniskus Cembung)'; }

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <!-- Visual Viewport with Main Cylinder & Loupe Inset -->
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 380 400" class="svg-sim-canvas" id="meniscus-svg">
            <defs>
              <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
                <stop offset="25%" stop-color="rgba(255,255,255,0.08)" />
                <stop offset="75%" stop-color="rgba(255,255,255,0.08)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.45)" />
              </linearGradient>
              <linearGradient id="activeLiqGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${liqColor1}" />
                <stop offset="100%" stop-color="${liqColor2}" />
              </linearGradient>
            </defs>

            <!-- Heavy Hexagonal Foot Support -->
            <polygon points="90,380 210,380 195,355 105,355" fill="#1e293b" stroke="#00f0ff" stroke-width="2" />
            <polygon points="105,355 195,355 185,345 115,345" fill="#334155" />

            <!-- Glass Cylinder Body -->
            <rect x="115" y="40" width="70" height="305" rx="5" fill="url(#glassBodyGrad)" stroke="#38bdf8" stroke-width="2.5" />
            <!-- Pouring Spout -->
            <polygon points="115,40 98,30 115,50" fill="#38bdf8" opacity="0.8" />

            <!-- Liquid Column with Real Meniscus Curve -->
            ${(() => {
              const liqY = 345 - (vol * 2.85);
              const liqH = vol * 2.85;
              if (liquid !== 'raksa') {
                // Concave Meniscus (Meniskus Cekung)
                return `
                  <rect x="116" y="${liqY}" width="68" height="${liqH}" fill="url(#activeLiqGrad)" opacity="0.85" />
                  <!-- Concave Meniscus Dip -->
                  <path d="M 116,${liqY - 7} Q 150,${liqY + 4} 184,${liqY - 7} L 184,${liqY} L 116,${liqY} Z" fill="url(#activeLiqGrad)" opacity="0.95" />
                  <path d="M 116,${liqY - 7} Q 150,${liqY + 4} 184,${liqY - 7}" fill="none" stroke="#ffffff" stroke-width="2.5" />
                  <!-- Bottom Tangent Laser Indicator -->
                  <line x1="80" y1="${liqY + 4}" x2="220" y2="${liqY + 4}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" />
                `;
              } else {
                // Convex Meniscus (Meniskus Cembung Raksa)
                return `
                  <rect x="116" y="${liqY}" width="68" height="${liqH}" fill="url(#activeLiqGrad)" opacity="0.9" />
                  <!-- Convex Meniscus Dome -->
                  <path d="M 116,${liqY + 7} Q 150,${liqY - 4} 184,${liqY + 7} L 184,${liqY} L 116,${liqY} Z" fill="url(#activeLiqGrad)" opacity="0.95" />
                  <path d="M 116,${liqY + 7} Q 150,${liqY - 4} 184,${liqY + 7}" fill="none" stroke="#ffffff" stroke-width="2.5" />
                  <!-- Top Tangent Laser Indicator -->
                  <line x1="80" y1="${liqY - 4}" x2="220" y2="${liqY - 4}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" />
                `;
              }
            })()}

            <!-- Scale Ticks (10 mL to 100 mL) -->
            ${(() => {
              let ticks = '';
              for (let i = 10; i <= 100; i += 10) {
                const yPos = 345 - (i * 2.85);
                ticks += `
                  <line x1="115" y1="${yPos}" x2="135" y2="${yPos}" stroke="#ffffff" stroke-width="2" />
                  <text x="140" y="${yPos + 4}" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold">${i}</text>
                `;
                for (let j = 2; j <= 8; j += 2) {
                  const minorY = yPos + (j * 2.85);
                  if (minorY < 345) {
                    ticks += `<line x1="115" y1="${minorY}" x2="125" y2="${minorY}" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />`;
                  }
                }
              }
              return ticks;
            })()}

            <!-- Observer Eye & Parallax Angle Beam -->
            ${(() => {
              const baseLiqY = 345 - (vol * 2.85) + (liquid === 'raksa' ? -4 : 4);
              let eyeY = baseLiqY;
              let beamColor = '#10b981';

              if (angle === 'top') { eyeY = baseLiqY - 55; beamColor = '#ef4444'; }
              if (angle === 'bottom') { eyeY = baseLiqY + 55; beamColor = '#ef4444'; }

              return `
                <g>
                  <!-- Eye Icon -->
                  <circle cx="45" cy="${eyeY}" r="15" fill="#080e21" stroke="${beamColor}" stroke-width="2.5" />
                  <circle cx="45" cy="${eyeY}" r="6" fill="${beamColor}" />
                  <text x="18" y="${eyeY - 20}" fill="${beamColor}" font-size="10" font-weight="bold">Mata</text>

                  <!-- Parallax Sightline -->
                  <line x1="62" y1="${eyeY}" x2="150" y2="${baseLiqY}" stroke="${beamColor}" stroke-width="2.5" stroke-dasharray="4,4" />
                  <circle cx="150" cy="${baseLiqY}" r="4.5" fill="${beamColor}" />
                </g>
              `;
            })()}

            <!-- Zoom Loupe Inset (Kaca Pembesar Meniskus) -->
            <g transform="translate(230, 80)">
              <!-- Loupe Frame -->
              <circle cx="65" cy="65" r="62" fill="#030712" stroke="#00f0ff" stroke-width="3" filter="drop-shadow(0 4px 15px rgba(0,240,255,0.4))" />
              <clipPath id="loupeClip"><circle cx="65" cy="65" r="60" /></clipPath>
              
              <!-- Magnified Content inside Loupe -->
              <g clip-path="url(#loupeClip)">
                <rect x="0" y="0" width="130" height="130" fill="#0f172a" />
                <!-- Magnified Fluid Column -->
                ${liquid !== 'raksa' ? `
                  <path d="M 10,40 Q 65,85 120,40 L 120,130 L 10,130 Z" fill="url(#activeLiqGrad)" opacity="0.9" />
                  <path d="M 10,40 Q 65,85 120,40" fill="none" stroke="#ffffff" stroke-width="4" />
                  <!-- Target reading horizontal line -->
                  <line x1="0" y1="85" x2="130" y2="85" stroke="#10b981" stroke-width="2.5" />
                  <text x="65" y="115" fill="#10b981" font-size="11" font-weight="bold" text-anchor="middle">Dasar Cekungan</text>
                ` : `
                  <path d="M 10,90 Q 65,45 120,90 L 120,130 L 10,130 Z" fill="url(#activeLiqGrad)" opacity="0.9" />
                  <path d="M 10,90 Q 65,45 120,90" fill="none" stroke="#ffffff" stroke-width="4" />
                  <line x1="0" y1="45" x2="130" y2="45" stroke="#10b981" stroke-width="2.5" />
                  <text x="65" y="115" fill="#10b981" font-size="11" font-weight="bold" text-anchor="middle">Puncak Cembungan</text>
                `}
              </g>

              <!-- Loupe Title Badge -->
              <rect x="5" y="-12" width="120" height="22" rx="4" fill="#080e21" stroke="#00f0ff" stroke-width="1.2" />
              <text x="65" y="3" fill="#00f0ff" font-size="10" font-weight="bold" text-anchor="middle">🔍 Pembesar Meniskus</text>
            </g>
          </svg>
        </div>

        <!-- Controls & Practice Panel -->
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-ruler-vertical"></i> Panel Pembacaan Skala Meniskus
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

          <!-- Pilihan Jenis Cairan -->
          <div class="mini-lab-control-group">
            <label>Pilih Jenis Cairan & Sifat Meniskus:</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${liquid === 'air' ? 'active' : ''}" onclick="window.labAR.setMeniscusLiquid('air')">
                💧 Air (Cekung)
              </button>
              <button class="mini-lab-opt-btn ${liquid === 'kmno4' ? 'active' : ''}" onclick="window.labAR.setMeniscusLiquid('kmno4')">
                🟣 KMnO4 (Cekung)
              </button>
              <button class="mini-lab-opt-btn ${liquid === 'oil' ? 'active' : ''}" onclick="window.labAR.setMeniscusLiquid('oil')">
                🟡 Minyak (Cekung)
              </button>
              <button class="mini-lab-opt-btn ${liquid === 'raksa' ? 'active' : ''}" onclick="window.labAR.setMeniscusLiquid('raksa')">
                ⚪ Raksa (Cembung)
              </button>
            </div>
          </div>

          <!-- Posisi Mata Pengamat -->
          <div class="mini-lab-control-group">
            <label>Posisi Sudut Mata (Uji Kesalahan Paralaks):</label>
            <div class="mini-lab-options-row">
              <button class="mini-lab-opt-btn ${angle === 'top' ? 'active' : ''}" onclick="window.labAR.setEyeAngle('top')">
                👁️ Terlalu Tinggi (+Paralaks)
              </button>
              <button class="mini-lab-opt-btn ${angle === 'normal' ? 'active' : ''}" onclick="window.labAR.setEyeAngle('normal')">
                👁️ Sejajar 90° (Akurat ✓)
              </button>
              <button class="mini-lab-opt-btn ${angle === 'bottom' ? 'active' : ''}" onclick="window.labAR.setEyeAngle('bottom')">
                👁️ Terlalu Rendah (-Paralaks)
              </button>
            </div>
          </div>

          <!-- Hasil & Penjelasan -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-check-double"></i> Hasil Pembacaan Skala:</h5>
            <div class="mini-lab-result-row">
              <span>Volume Nyata (True Value):</span>
              <span class="num-val">${vol.toFixed(1)} mL</span>
            </div>
            <div class="mini-lab-result-row">
              <span>Hasil Pengamatan Mata:</span>
              <span class="num-val" style="color: ${angle === 'normal' ? 'var(--accent-green)' : '#ef4444'};">
                ${observedVol.toFixed(1)} mL (${angle === 'normal' ? 'Akurat' : 'Terjadi Kesalahan Paralaks!'})
              </span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem; line-height: 1.4;">
              ${liquid !== 'raksa' 
                ? '📌 <strong>Meniskus Cekung</strong> terjadi karena gaya adhesi (cairan-kaca) > gaya kohesi (antar partikel cairan). Nilai dibaca tepat pada <strong>titik terbawah lengkungan</strong>.' 
                : '📌 <strong>Meniskus Cembung</strong> terjadi karena gaya kohesi > gaya adhesi. Nilai dibaca tepat pada <strong>puncak teratas kubah cembung</strong>.'}
            </p>
          </div>

          <!-- Quiz Tantangan -->
          <div class="mini-lab-quiz-box">
            <h5><i class="fa-solid fa-circle-question"></i> Tantangan Meniskus:</h5>
            <p style="font-size: 0.8rem; color: var(--text-main);">
              Berapakah volume cairan di atas yang terbaca pada posisi mata sejajar?
            </p>
            <div class="mini-lab-quiz-input-row">
              <input type="number" id="quiz-meniscus-input" class="mini-lab-quiz-input" placeholder="Contoh: 45.0" step="0.1" />
              <button class="btn btn-accent" onclick="window.labAR.checkMeniscusQuiz()">Periksa</button>
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
      feedback.innerHTML = `🎉 <strong>Luar Biasa, Benar!</strong> Volume tepat adalah <strong>${target.toFixed(1)} mL</strong> pada dasar meniskus.`;
    } else {
      if (window.labAudio) window.labAudio.playError();
      feedback.className = 'mini-lab-quiz-feedback wrong';
      feedback.innerHTML = `❌ <strong>Kurang tepat.</strong> Jawaban kamu: ${userVal.toFixed(1)} mL. Volume yang benar adalah <strong>${target.toFixed(1)} mL</strong>.`;
    }
  }

  // =========================================================================
  // 3. JANGKA SORONG - MEMBACA SKALA UTAMA & NONIUS DENGAN LOUPE
  // =========================================================================
  renderVernierCaliperLab(container) {
    const val = this.miniLabState.caliperVal;
    const objType = this.miniLabState.caliperObject;

    const skalaUtama = Math.floor(val * 10) / 10;
    const noniusIndex = Math.round((val - skalaUtama) * 100);
    const skalaNonius = noniusIndex * 0.01;

    const startX = 60;
    const slideOffset = val * 38;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 460 300" class="svg-sim-canvas" id="caliper-svg">
            <defs>
              <linearGradient id="metalCaliper" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f8fafc" />
                <stop offset="40%" stop-color="#cbd5e1" />
                <stop offset="100%" stop-color="#64748b" />
              </linearGradient>
              <linearGradient id="vernierSliderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="100%" stop-color="#94a3b8" />
              </linearGradient>
            </defs>

            <!-- Main Steel Beam -->
            <rect x="20" y="80" width="420" height="45" rx="3" fill="url(#metalCaliper)" stroke="#334155" stroke-width="2" />

            <!-- Fixed Lower & Upper Jaws -->
            <polygon points="20,80 60,80 60,240 45,240 20,130" fill="url(#metalCaliper)" stroke="#334155" stroke-width="2" />
            <polygon points="20,80 60,80 60,10 45,10 20,40" fill="url(#metalCaliper)" stroke="#334155" stroke-width="2" />

            <!-- Clamped Object between Jaws -->
            ${val > 0.1 ? `
              <rect x="60" y="140" width="${slideOffset}" height="70" rx="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2" opacity="0.9" />
              <text x="${60 + slideOffset / 2}" y="180" fill="#080e21" font-size="12" font-weight="bold" text-anchor="middle">
                ${val.toFixed(2)} cm
              </text>
            ` : ''}

            <!-- Main Scale Engravings (0 to 10 cm) -->
            ${(() => {
              let ticks = '';
              for (let cm = 0; cm <= 9; cm++) {
                const xPos = startX + (cm * 38);
                ticks += `
                  <line x1="${xPos}" y1="80" x2="${xPos}" y2="106" stroke="#080e21" stroke-width="2" />
                  <text x="${xPos}" y="120" fill="#080e21" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">${cm}</text>
                `;
                for (let mm = 1; mm < 10; mm++) {
                  const mmX = xPos + (mm * 3.8);
                  if (mmX <= 430) {
                    const tickH = (mm === 5) ? 98 : 92;
                    ticks += `<line x1="${mmX}" y1="80" x2="${mmX}" y2="${tickH}" stroke="#080e21" stroke-width="1.2" />`;
                  }
                }
              }
              return ticks;
            })()}

            <!-- Sliding Vernier Jaws Block -->
            <g transform="translate(${slideOffset}, 0)">
              <rect x="60" y="65" width="105" height="75" rx="3" fill="url(#vernierSliderGrad)" stroke="#00f0ff" stroke-width="2" />
              <polygon points="60,80 95,80 95,240 80,240 60,130" fill="url(#vernierSliderGrad)" stroke="#00f0ff" stroke-width="2" />
              <polygon points="60,80 95,80 95,10 80,10 60,40" fill="url(#vernierSliderGrad)" stroke="#00f0ff" stroke-width="2" />

              <!-- Vernier Scale Ticks (0 - 10) -->
              ${(() => {
                let vTicks = '';
                for (let n = 0; n <= 10; n++) {
                  const vnX = 60 + (n * 3.42); // 10 nonius divisions in 9 mm
                  const isCoincident = (n === noniusIndex);
                  vTicks += `
                    <line x1="${vnX}" y1="65" x2="${vnX}" y2="${n % 5 === 0 ? 84 : 78}" 
                      stroke="${isCoincident ? '#ef4444' : '#080e21'}" stroke-width="${isCoincident ? '2.8' : '1.3'}" />
                    ${n % 2 === 0 ? `<text x="${vnX}" y="60" fill="${isCoincident ? '#ef4444' : '#080e21'}" font-size="9" font-weight="bold" text-anchor="middle">${n}</text>` : ''}
                  `;
                }
                return vTicks;
              })()}

              <!-- Lock Screw & Thumb Rest -->
              <rect x="145" y="52" width="16" height="13" rx="2" fill="#d97706" stroke="#ffffff" stroke-width="1" />
              <circle cx="155" cy="115" r="7" fill="#64748b" />
            </g>
          </svg>
        </div>

        <!-- Controls Panel -->
        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title">
            <i class="fa-solid fa-ruler-combined"></i> Panel Pengukuran Jangka Sorong
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
            <label>Pilih Objek untuk Diukur:</label>
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
              <button class="mini-lab-opt-btn ${objType === 'pipa' ? 'active' : ''}" onclick="window.labAR.setCaliperPreset('pipa', 3.24)">
                🚰 Pipa PVC (3.24 cm)
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
            <div class="mini-lab-result-row" style="border-top: 1px dashed var(--border-color); padding-top: 0.5rem; font-weight: bold;">
              <span>Hasil Pengukuran Total:</span>
              <span class="num-val" style="color: var(--accent-cyan); font-size: 1.05rem;">
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
              <button class="btn btn-accent" onclick="window.labAR.checkCaliperQuiz()">Periksa</button>
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
      feedback.innerHTML = `❌ <strong>Belum Tepat.</strong> Hasil yang benar adalah <strong>${target.toFixed(2)} cm</strong>.`;
    }
  }

  // =========================================================================
  // 4. NERACA OHAUS TIGA LENGAN
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
    const pointerAngle = Math.max(-25, Math.min(25, diff * 3.5));

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 440 290" class="svg-sim-canvas" id="ohaus-svg">
            <defs>
              <linearGradient id="ohausBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#475569" />
                <stop offset="100%" stop-color="#0f172a" />
              </linearGradient>
            </defs>

            <!-- Base & Stand -->
            <polygon points="60,260 380,260 360,225 80,225" fill="#1e293b" stroke="#00f0ff" stroke-width="2" />
            <rect x="195" y="110" width="30" height="115" fill="#334155" />
            <!-- Fulcrum Agate Bearing -->
            <polygon points="210,95 195,120 225,120" fill="#00f0ff" />

            <!-- Weighing Pan (Left) -->
            <line x1="85" y1="100" x2="85" y2="165" stroke="#94a3b8" stroke-width="2.5" />
            <ellipse cx="85" cy="165" rx="48" ry="14" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
            
            <!-- Sample Object on Pan -->
            <rect x="65" y="125" width="40" height="35" rx="6" fill="#eab308" stroke="#ffffff" stroke-width="2" />
            <text x="85" y="148" fill="#080e21" font-size="10" font-weight="bold" text-anchor="middle">
              ${objName.split(' ')[0]}
            </text>

            <!-- 3 Beams Assembly -->
            <g transform="rotate(${isBalanced ? 0 : pointerAngle * 0.15}, 210, 100)">
              <rect x="95" y="92" width="290" height="16" rx="2" fill="url(#ohausBeamGrad)" stroke="#64748b" stroke-width="1.2" />
              <rect x="95" y="72" width="290" height="14" rx="2" fill="url(#ohausBeamGrad)" stroke="#64748b" stroke-width="1.2" />
              <rect x="95" y="52" width="290" height="14" rx="2" fill="url(#ohausBeamGrad)" stroke="#64748b" stroke-width="1.2" />

              <!-- Rider 100g -->
              <polygon points="${105 + (l100 / 500) * 250},44 ${115 + (l100 / 500) * 250},64 ${95 + (l100 / 500) * 250},64" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />

              <!-- Rider 10g -->
              <polygon points="${105 + (l10 / 100) * 250},64 ${115 + (l10 / 100) * 250},84 ${95 + (l10 / 100) * 250},84" fill="#06b6d4" stroke="#ffffff" stroke-width="1.5" />

              <!-- Rider 1g -->
              <polygon points="${105 + (l1 / 10) * 250},84 ${115 + (l1 / 10) * 250},106 ${95 + (l1 / 10) * 250},106" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />

              <!-- Balance Pointer Needle (Right End) -->
              <line x1="385" y1="100" x2="425" y2="100" stroke="${isBalanced ? '#10b981' : '#ef4444'}" stroke-width="3.5" />
            </g>

            <!-- Zero Scale Target Gauge -->
            <rect x="415" y="75" width="18" height="50" fill="#080e21" stroke="#00f0ff" stroke-width="1.5" />
            <line x1="415" y1="100" x2="433" y2="100" stroke="#10b981" stroke-width="3" />
            <text x="402" y="104" fill="#10b981" font-size="12" font-weight="bold">0</text>
          </svg>
        </div>

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

          <!-- Result -->
          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-equals"></i> Total Massa Anting Timbangan:</h5>
            <div class="mini-lab-result-row">
              <span>Perhitungan Massa:</span>
              <span class="num-val">${l100}g + ${l10}g + ${l1.toFixed(1)}g = ${totalSlider.toFixed(1)} gram</span>
            </div>
            <div class="mini-lab-result-row">
              <span>Status Keseimbangan:</span>
              <span class="num-val" style="color: ${isBalanced ? 'var(--accent-green)' : '#f59e0b'};">
                ${isBalanced ? '⚖️ SEIMBANG TEPAT DI TITIK NOL! (Sempurna ✓)' : (diff > 0 ? '⬇️ Anting Terlalu Berat' : '⬆️ Anting Terlalu Ringan')}
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
    if (Math.abs(total - this.miniLabState.ohausObjectWeight) < 0.15 && window.labAudio) {
      window.labAudio.playFanfare();
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
  // 5. TERMOMETER LAB - MEMBACA SKALA SUHU & KONVERSI
  // =========================================================================
  renderThermometerLab(container) {
    const tempC = this.miniLabState.tempVal;
    const tempK = tempC + 273.15;
    const tempF = (tempC * 9 / 5) + 32;
    const tempR = tempC * 4 / 5;

    const colY = 330 - ((tempC + 10) * 2.33);

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 340 390" class="svg-sim-canvas" id="thermo-svg">
            <defs>
              <linearGradient id="mercuryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ef4444" />
                <stop offset="100%" stop-color="#b91c1c" />
              </linearGradient>
            </defs>

            <!-- Beaker with active liquid -->
            <rect x="70" y="200" width="200" height="170" rx="8" fill="rgba(0,240,255,0.12)" stroke="#38bdf8" stroke-width="2.5" />
            
            <!-- Steam or Ice effect based on Temp -->
            ${tempC >= 95 ? `
              <!-- Steam Vapors -->
              <path d="M 100,190 Q 120,150 110,120 M 170,190 Q 150,140 170,110 M 230,190 Q 250,150 240,120" 
                stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4,4" opacity="0.7" />
            ` : (tempC <= 5 ? `
              <!-- Ice Cubes -->
              <rect x="90" y="270" width="30" height="30" rx="4" fill="rgba(255,255,255,0.7)" stroke="#38bdf8" />
              <rect x="210" y="280" width="28" height="28" rx="4" fill="rgba(255,255,255,0.7)" stroke="#38bdf8" />
            ` : '')}

            <!-- Thermometer Stem -->
            <rect x="155" y="40" width="30" height="280" rx="15" fill="rgba(255,255,255,0.15)" stroke="#38bdf8" stroke-width="2" />
            <circle cx="170" cy="335" r="24" fill="url(#mercuryGrad)" stroke="#38bdf8" stroke-width="2" />
            <rect x="166" y="${colY}" width="8" height="${335 - colY}" fill="url(#mercuryGrad)" />

            <!-- Celsius Markings -->
            ${(() => {
              let ticks = '';
              for (let t = -10; t <= 110; t += 10) {
                const yPos = 330 - ((t + 10) * 2.33);
                ticks += `
                  <line x1="185" y1="${yPos}" x2="200" y2="${yPos}" stroke="#ffffff" stroke-width="1.8" />
                  <text x="208" y="${yPos + 4}" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold">${t}°C</text>
                `;
              }
              return ticks;
            })()}

            <!-- Current Temp Badge -->
            <rect x="40" y="${colY - 15}" width="95" height="30" rx="4" fill="#080e21" stroke="#ef4444" stroke-width="1.8" />
            <text x="87" y="${colY + 4}" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">${tempC}°C</text>
            <line x1="135" y1="${colY}" x2="166" y2="${colY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3" />
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
  // 6. BUNSEN - PENGATURAN API SPIRITUS & UJI PEMANASAN
  // =========================================================================
  renderBunsenLab(container) {
    const valve = this.miniLabState.bunsenAirValve;
    const isBlue = valve >= 50;
    const isHeating = this.miniLabState.bunsenIsHeating;
    const waterTemp = this.miniLabState.bunsenWaterTemp;
    const timer = this.miniLabState.bunsenTimer;

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 340 340" class="svg-sim-canvas">
            <!-- Tripod & Wire Gauze Support -->
            <line x1="60" y1="180" x2="280" y2="180" stroke="#94a3b8" stroke-width="4" />
            <rect x="90" y="174" width="160" height="8" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />

            <!-- Beaker with Boiling Water -->
            <rect x="110" y="80" width="120" height="95" rx="4" fill="rgba(0,240,255,0.15)" stroke="#38bdf8" stroke-width="2" />
            <rect x="112" y="110" width="116" height="63" fill="#00f0ff" opacity="0.6" />

            <!-- Boiling Bubbles if Hot -->
            ${waterTemp >= 80 ? `
              <circle cx="140" cy="140" r="4" fill="#ffffff" opacity="0.8" />
              <circle cx="180" cy="130" r="5" fill="#ffffff" opacity="0.8" />
              <circle cx="160" cy="155" r="3" fill="#ffffff" opacity="0.8" />
            ` : ''}

            <!-- Bunsen Burner Body -->
            <polygon points="135,310 205,310 190,230 150,230" fill="#334155" stroke="#38bdf8" stroke-width="2" />
            <rect x="160" y="200" width="20" height="30" fill="#94a3b8" />
            
            <!-- Animated Flame -->
            <g class="anim-flame" transform="translate(0, -10)">
              ${isBlue ? `
                <path d="M 170,110 Q 200,165 185,200 Q 170,210 155,200 Q 140,165 170,110 Z" fill="#00f0ff" opacity="0.95" />
                <path d="M 170,140 Q 185,175 178,200 Q 170,205 162,200 Q 155,175 170,140 Z" fill="#38ef7d" opacity="0.85" />
              ` : `
                <path d="M 170,90 Q 210,155 190,200 Q 170,210 150,200 Q 130,155 170,90 Z" fill="#f59e0b" opacity="0.95" />
                <path d="M 170,120 Q 190,165 180,200 Q 170,205 160,200 Q 150,165 170,120 Z" fill="#ef4444" opacity="0.85" />
              `}
            </g>
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-fire"></i> Pengaturan Kerah Udara Bunsen</div>
          
          <div class="mini-lab-control-group">
            <label>
              <span>Kerah Udara (Air Collar):</span>
              <span class="val-badge">${isBlue ? 'Terbuka (Api Biru Oksidasi)' : 'Tertutup (Api Kuning Reduksi)'}</span>
            </label>
            <input type="range" class="mini-lab-slider" min="0" max="100" step="10" value="${valve}" oninput="window.labAR.setBunsenValve(this.value)" />
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-accent" onclick="window.labAR.toggleBunsenHeating()">
              <i class="fa-solid ${isHeating ? 'fa-pause' : 'fa-play'}"></i> ${isHeating ? 'Hentikan Pemanasan' : 'Mulai Panaskan Air 100 mL'}
            </button>
            <button class="btn btn-secondary" onclick="window.labAR.resetBunsenHeating()">Reset</button>
          </div>

          <div class="mini-lab-result-card">
            <h5><i class="fa-solid fa-stopwatch"></i> Data Percobaan Pemanasan Air:</h5>
            <div class="mini-lab-result-row"><span>Suhu Air Saat Ini:</span><span class="num-val">${waterTemp.toFixed(1)} °C</span></div>
            <div class="mini-lab-result-row"><span>Waktu Pemanasan:</span><span class="num-val">${timer} detik</span></div>
            <div class="mini-lab-result-row"><span>Kecepatan Pemanasan:</span><span class="num-val">${isBlue ? '3x Lebih Cepat (Efisien)' : 'Lambat & Berjelaga'}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  setBunsenValve(val) {
    this.miniLabState.bunsenAirValve = parseInt(val);
    this.renderMiniLab('bunsen-spiritus');
  }

  toggleBunsenHeating() {
    if (this.miniLabState.bunsenIsHeating) {
      clearInterval(this.miniLabState.bunsenInterval);
      this.miniLabState.bunsenIsHeating = false;
    } else {
      this.miniLabState.bunsenIsHeating = true;
      if (window.labAudio) window.labAudio.playClick();
      this.miniLabState.bunsenInterval = setInterval(() => {
        this.miniLabState.bunsenTimer++;
        const isBlue = this.miniLabState.bunsenAirValve >= 50;
        const tempRate = isBlue ? 2.2 : 0.7; // Blue heats 3x faster
        this.miniLabState.bunsenWaterTemp = Math.min(100, this.miniLabState.bunsenWaterTemp + tempRate);

        if (this.miniLabState.bunsenWaterTemp >= 100) {
          clearInterval(this.miniLabState.bunsenInterval);
          this.miniLabState.bunsenIsHeating = false;
          if (window.labAudio) window.labAudio.playFanfare();
        }
        this.renderMiniLab('bunsen-spiritus');
      }, 500);
    }
    this.renderMiniLab('bunsen-spiritus');
  }

  resetBunsenHeating() {
    clearInterval(this.miniLabState.bunsenInterval);
    this.miniLabState.bunsenIsHeating = false;
    this.miniLabState.bunsenTimer = 0;
    this.miniLabState.bunsenWaterTemp = 27;
    this.renderMiniLab('bunsen-spiritus');
  }

  // =========================================================================
  // 7. BEAKER & PIPET TETES
  // =========================================================================
  renderBeakerPipetteLab(container) {
    const drops = this.miniLabState.dropCount;
    const addedVol = (drops * 0.05).toFixed(2);

    container.innerHTML = `
      <div class="mini-lab-dynamic-grid">
        <div class="mini-lab-viewport-box">
          <svg viewBox="0 0 320 320" class="svg-sim-canvas">
            <rect x="90" y="120" width="140" height="160" rx="6" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2.5" />
            <rect x="92" y="${280 - (50 + drops * 2)}" width="136" height="${50 + drops * 2}" fill="#00f0ff" opacity="0.75" />
            <rect x="155" y="20" width="10" height="70" fill="rgba(255,255,255,0.3)" stroke="#ffffff" />
            <polygon points="155,90 165,90 160,105" fill="#ffffff" />
            <circle cx="160" cy="115" r="4.5" fill="#00f0ff" />
          </svg>
        </div>

        <div class="mini-lab-panel-controls">
          <div class="mini-lab-panel-title"><i class="fa-solid fa-droplet"></i> Kalibrasi Pipet Tetes</div>
          <p style="font-size: 0.82rem; color: var(--text-main);">Teteskan larutan indikator menggunakan pipet tetes tegak lurus (90°):</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-accent" onclick="window.labAR.addDrop()"><i class="fa-solid fa-hand-holding-droplet"></i> Teteskan 1 Tetes</button>
            <button class="btn btn-secondary" onclick="window.labAR.resetDrops()">Reset</button>
          </div>
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
            <polygon points="160,100 110,260 210,260" fill="${isEquiv ? '#f472b6' : 'rgba(255,255,255,0.06)'}" stroke="#38bdf8" stroke-width="2.5" />
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
  // 9. TABUNG REAKSI - UJI REAKSI KIMIA
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
            <g transform="rotate(25, 160, 200)">
              <rect x="145" y="60" width="30" height="180" rx="15" fill="rgba(255,255,255,0.06)" stroke="#38bdf8" stroke-width="2.5" />
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
            <circle cx="160" cy="160" r="130" fill="#fef08a" opacity="0.75" stroke="#38bdf8" stroke-width="2.5" />
            <line x1="160" y1="30" x2="160" y2="290" stroke="#080e21" stroke-width="1.5" stroke-dasharray="4,4" />
            <line x1="30" y1="160" x2="290" y2="160" stroke="#080e21" stroke-width="1.5" stroke-dasharray="4,4" />
            
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
            <polygon points="140,280 180,280 160,200" fill="#00f0ff" />
            <line x1="80" y1="180" x2="240" y2="180" stroke="#94a3b8" stroke-width="4" />
            ${mode === 'with-gauze' ? `
              <rect x="110" y="174" width="100" height="8" fill="#f8fafc" stroke="#334155" stroke-width="1" />
              <ellipse cx="160" cy="140" rx="60" ry="12" fill="#ef4444" opacity="0.6" />
            ` : `
              <circle cx="160" cy="160" r="12" fill="#ef4444" />
            `}
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
            <polygon points="100,60 220,60 170,150 150,150" fill="rgba(255,255,255,0.1)" stroke="#38bdf8" stroke-width="2" />
            <polygon points="110,70 210,70 160,140" fill="#fef08a" opacity="0.8" />
            <rect x="156" y="150" width="8" height="60" fill="rgba(255,255,255,0.2)" stroke="#38bdf8" />
            <circle cx="160" cy="230" r="3" fill="#00f0ff" />
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
