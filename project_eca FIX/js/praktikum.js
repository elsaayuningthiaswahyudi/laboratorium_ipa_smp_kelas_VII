// Virtual Laboratory Simulation Engine for SMP Kelas VII

class VirtualLab {
  constructor() {
    this.currentLab = 'mikroskop';

    // State Praktikum 1: Mikroskop
    this.microScopeState = {
      specimen: 'bawang',
      magnification: 10, // 4, 10, 40
      coarseFocus: 50, // 0 - 100
      fineFocus: 50, // 0 - 100
      light: 80, // 0 - 100
      perfectCoarse: 60,
      perfectFine: 50,
      isFocused: false
    };

    // State Praktikum 2: Uji Asam Basa
    this.chemState = {
      selectedSolution: 'jeruk',
      selectedIndicator: 'lakmus-merah',
      wells: [
        { id: 1, sample: null, indicator: null, color: '#f5f6fa', result: '-' },
        { id: 2, sample: null, indicator: null, color: '#f5f6fa', result: '-' },
        { id: 3, sample: null, indicator: null, color: '#f5f6fa', result: '-' },
        { id: 4, sample: null, indicator: null, color: '#f5f6fa', result: '-' }
      ]
    };
  }

  init() {
    this.renderMicroscopeLab();
    this.renderChemLab();
  }

  // ================= 1. SIMULASI MIKROSKOP VIRTUAL =================
  renderMicroscopeLab() {
    this.updateMicroscopeView();
  }

  setSpecimen(specimenId) {
    if (window.labAudio) window.labAudio.playClick();
    this.microScopeState.specimen = specimenId;

    // Highlight active specimen button in UI
    document.querySelectorAll('.specimen-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.specimen === specimenId);
    });

    // Set slightly different focus sweet spot for each specimen
    if (specimenId === 'bawang') {
      this.microScopeState.perfectCoarse = 60;
      this.microScopeState.perfectFine = 50;
    } else if (specimenId === 'stomata') {
      this.microScopeState.perfectCoarse = 45;
      this.microScopeState.perfectFine = 65;
    } else if (specimenId === 'pipi') {
      this.microScopeState.perfectCoarse = 70;
      this.microScopeState.perfectFine = 40;
    }
    this.updateMicroscopeView();
  }

  setMagnification(mag) {
    if (window.labAudio) window.labAudio.playClick();
    this.microScopeState.magnification = parseInt(mag);
    document.querySelectorAll('.mag-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mag) === this.microScopeState.magnification);
    });
    this.updateMicroscopeView();
  }

  updateCoarse(val) {
    this.microScopeState.coarseFocus = parseInt(val);
    this.updateMicroscopeView();
  }

  updateFine(val) {
    this.microScopeState.fineFocus = parseInt(val);
    this.updateMicroscopeView();
  }

  updateLight(val) {
    this.microScopeState.light = parseInt(val);
    this.updateMicroscopeView();
  }

  updateMicroscopeView() {
    const lensView = document.getElementById('microscope-lens-viewport');
    const imageLayer = document.getElementById('specimen-image-layer');
    const organelleLabels = document.getElementById('organelle-labels');
    const focusStatus = document.getElementById('focus-status-indicator');
    const lightValDisplay = document.getElementById('light-val-display');

    if (!imageLayer) return;

    const specimen = this.microScopeState.specimen || 'bawang';
    const mag = this.microScopeState.magnification || 10;

    // Calculate Focus Blur
    const coarseDiff = Math.abs(this.microScopeState.coarseFocus - this.microScopeState.perfectCoarse);
    const fineDiff = Math.abs(this.microScopeState.fineFocus - this.microScopeState.perfectFine);
    const totalDiff = coarseDiff * 0.7 + fineDiff * 0.3;

    // Blur from 0px to 25px
    const blurAmount = (totalDiff / 50) * 20;
    const isSharp = totalDiff < 7;
    this.microScopeState.isFocused = isSharp;

    // Lighting Brightness
    const brightness = (this.microScopeState.light / 100) * 1.3;

    // Load actual vector SVG tissue image for this specimen and magnification
    const imagePath = `img/preparat/${specimen}-${mag}x.svg`;
    imageLayer.style.backgroundImage = `url('${imagePath}')`;
    imageLayer.style.backgroundSize = 'cover';
    imageLayer.style.backgroundPosition = 'center';
    imageLayer.style.filter = `blur(${blurAmount.toFixed(1)}px) brightness(${brightness})`;
    imageLayer.style.transform = 'scale(1.0)';

    if (lightValDisplay) lightValDisplay.innerText = `${this.microScopeState.light}%`;

    // Organelle Labels visibility & content
    if (organelleLabels) {
      organelleLabels.style.opacity = isSharp ? '1' : '0';
      organelleLabels.style.pointerEvents = isSharp ? 'auto' : 'none';

      let labelHtml = '';
      if (specimen === 'bawang') {
        if (mag === 40) {
          labelHtml = `
            <span class="organelle-tag" style="top: 14%; left: 16%;"><i class="fa-solid fa-tag"></i> Dinding Selulosa Ganda</span>
            <span class="organelle-tag" style="top: 34%; left: 34%;"><i class="fa-solid fa-circle-dot"></i> Inti Sel (Nukleus & Nukleolus)</span>
            <span class="organelle-tag" style="top: 55%; left: 45%;"><i class="fa-solid fa-circle"></i> Vakuola Sentral Besar</span>
            <span class="organelle-tag" style="top: 75%; left: 20%;"><i class="fa-solid fa-water"></i> Sitoplasma</span>
          `;
        } else {
          labelHtml = `
            <span class="organelle-tag" style="top: 25%; left: 18%;"><i class="fa-solid fa-tag"></i> Dinding Sel</span>
            <span class="organelle-tag" style="top: 45%; left: 32%;"><i class="fa-solid fa-circle-dot"></i> Nukleus (Inti Sel)</span>
            <span class="organelle-tag" style="top: 65%; left: 55%;"><i class="fa-solid fa-water"></i> Sitoplasma</span>
          `;
        }
      } else if (specimen === 'stomata') {
        if (mag === 40) {
          labelHtml = `
            <span class="organelle-tag" style="top: 18%; left: 55%;"><i class="fa-solid fa-leaf"></i> Sel Penjaga (Guard Cell)</span>
            <span class="organelle-tag" style="top: 48%; left: 42%;"><i class="fa-solid fa-circle-notch"></i> Pori Stoma (Terbuka)</span>
            <span class="organelle-tag" style="top: 28%; left: 16%;"><i class="fa-solid fa-sun"></i> Kloroplas Berbutir</span>
            <span class="organelle-tag" style="top: 72%; left: 68%;"><i class="fa-solid fa-puzzle-piece"></i> Sel Tetangga</span>
          `;
        } else {
          labelHtml = `
            <span class="organelle-tag" style="top: 35%; left: 24%;"><i class="fa-solid fa-leaf"></i> Sel Penjaga</span>
            <span class="organelle-tag" style="top: 52%; left: 45%;"><i class="fa-solid fa-circle-notch"></i> Celah Stoma</span>
            <span class="organelle-tag" style="top: 68%; left: 60%;"><i class="fa-solid fa-puzzle-piece"></i> Sel Tetangga</span>
          `;
        }
      } else if (specimen === 'pipi') {
        if (mag === 40) {
          labelHtml = `
            <span class="organelle-tag" style="top: 16%; left: 20%;"><i class="fa-solid fa-circle-nodes"></i> Membran Sel Berlipat</span>
            <span class="organelle-tag" style="top: 48%; left: 44%;"><i class="fa-solid fa-circle-dot"></i> Inti Sel (Nukleus)</span>
            <span class="organelle-tag" style="top: 72%; left: 28%;"><i class="fa-solid fa-water"></i> Sitoplasma Granular</span>
            <span class="organelle-tag" style="top: 30%; left: 62%;"><i class="fa-solid fa-bacterium"></i> Bakteri Flora Alami</span>
          `;
        } else {
          labelHtml = `
            <span class="organelle-tag" style="top: 25%; left: 24%;"><i class="fa-solid fa-circle-nodes"></i> Membran Sel</span>
            <span class="organelle-tag" style="top: 50%; left: 45%;"><i class="fa-solid fa-circle-dot"></i> Nukleus (Inti Sel)</span>
            <span class="organelle-tag" style="top: 72%; left: 50%;"><i class="fa-solid fa-water"></i> Sitoplasma</span>
          `;
        }
      }
      organelleLabels.innerHTML = labelHtml;
    }

    // Status Indicator
    if (focusStatus) {
      if (isSharp) {
        focusStatus.className = 'focus-status-badge sharp';
        focusStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> FOKUS SEMPURNA (${mag}x - Objek Terlihat Sangat Jelas)`;
      } else if (totalDiff < 18) {
        focusStatus.className = 'focus-status-badge near';
        focusStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> HAMPIR FOKUS (Atur Mikrometer Halus)';
      } else {
        focusStatus.className = 'focus-status-badge blur';
        focusStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> BURAM (Atur Makrometer & Mikrometer)';
      }
    }
  }

  // ================= 2. SIMULASI UJI ASAM BASA & LARUTAN =================
  renderChemLab() {
    this.updatePlateDisplay();
  }

  selectSolution(solKey) {
    if (window.labAudio) window.labAudio.playClick();
    this.chemState.selectedSolution = solKey;
    document.querySelectorAll('.sol-item').forEach(el => {
      el.classList.toggle('active', el.dataset.sol === solKey);
    });
  }

  selectIndicator(indKey) {
    if (window.labAudio) window.labAudio.playClick();
    this.chemState.selectedIndicator = indKey;
    document.querySelectorAll('.ind-item').forEach(el => {
      el.classList.toggle('active', el.dataset.ind === indKey);
    });
  }

  dropOnWell(wellIndex) {
    if (window.labAudio) window.labAudio.playDrop();

    const sol = this.chemState.selectedSolution;
    const ind = this.chemState.selectedIndicator;

    // Reaction calculations
    // Solutions: jeruk (asam pH 3), cuka (asam pH 2.5), garam (netral pH 7), sabun (basa pH 10), kapur (basa pH 11.5)
    let finalColor = '#ffffff';
    let resultDesc = '';

    const isAcid = (sol === 'jeruk' || sol === 'cuka');
    const isBase = (sol === 'sabun' || sol === 'kapur');
    const isNeutral = (sol === 'garam');

    if (ind === 'lakmus-merah') {
      if (isAcid || isNeutral) {
        finalColor = '#ff7675'; // Tetap Merah
        resultDesc = isAcid ? 'Tetap Merah (Sifat: Asam)' : 'Tetap Merah (Sifat: Netral)';
      } else if (isBase) {
        finalColor = '#74b9ff'; // Berubah Biru
        resultDesc = 'Berubah Biru (Sifat: Basa)';
      }
    } else if (ind === 'lakmus-biru') {
      if (isAcid) {
        finalColor = '#ff7675'; // Berubah Merah
        resultDesc = 'Berubah Merah (Sifat: Asam)';
      } else if (isBase || isNeutral) {
        finalColor = '#74b9ff'; // Tetap Biru
        resultDesc = isBase ? 'Tetap Biru (Sifat: Basa)' : 'Tetap Biru (Sifat: Netral)';
      }
    } else if (ind === 'kunyit') {
      if (isAcid || isNeutral) {
        finalColor = '#ffeaa7'; // Tetap Kuning Cerah
        resultDesc = 'Tetap Kuning Cerah (Sifat: Asam/Netral)';
      } else if (isBase) {
        finalColor = '#d63031'; // Merah Kecokelatan / Jingga Gelap
        resultDesc = 'Berubah Merah Kecokelatan (Sifat: Basa)';
      }
    }

    const solNames = {
      jeruk: 'Air Perasan Jeruk Nipis',
      cuka: 'Asam Cuka Dapur',
      garam: 'Larutan Garam Dapur',
      sabun: 'Air Sabun Mandi',
      kapur: 'Air Kapur Sirih'
    };

    const indNames = {
      'lakmus-merah': 'Kertas Lakmus Merah',
      'lakmus-biru': 'Kertas Lakmus Biru',
      'kunyit': 'Ekstrak Kunyit Alami'
    };

    this.chemState.wells[wellIndex] = {
      id: wellIndex + 1,
      sample: solNames[sol],
      indicator: indNames[ind],
      color: finalColor,
      result: resultDesc
    };

    this.updatePlateDisplay();
  }

  resetPlate() {
    if (window.labAudio) window.labAudio.playClick();
    this.chemState.wells = [
      { id: 1, sample: null, indicator: null, color: '#f5f6fa', result: '-' },
      { id: 2, sample: null, indicator: null, color: '#f5f6fa', result: '-' },
      { id: 3, sample: null, indicator: null, color: '#f5f6fa', result: '-' },
      { id: 4, sample: null, indicator: null, color: '#f5f6fa', result: '-' }
    ];
    this.updatePlateDisplay();
  }

  updatePlateDisplay() {
    const plateGrid = document.getElementById('well-plate-grid');
    if (!plateGrid) return;

    plateGrid.innerHTML = this.chemState.wells.map((well, idx) => `
      <div class="well-cell ${well.sample ? 'filled' : ''}" onclick="window.virtualLab.dropOnWell(${idx})">
        <div class="well-circle" style="background-color: ${well.color};">
          <span class="well-num">${idx + 1}</span>
          ${well.sample ? '<i class="fa-solid fa-flask-vial reaction-spark"></i>' : '<span class="well-drop-hint"><i class="fa-solid fa-droplet"></i> Teteskan</span>'}
        </div>
        <div class="well-data">
          <strong>${well.sample || 'Kosong'}</strong>
          <small>${well.indicator || 'Pilih Indikator'}</small>
          <div class="well-result">${well.result}</div>
        </div>
      </div>
    `).join('');
  }

  // ================= 3. DIGITAL LKPD / REPORT EXPORT =================
  submitLKPD() {
    const namaInput = document.getElementById('lkpd-nama-siswa');
    const kelasInput = document.getElementById('lkpd-kelas-siswa');
    const jwb1 = document.getElementById('lkpd-jawaban-1');
    const jwb2 = document.getElementById('lkpd-jawaban-2');

    const currentUser = window.labAuth ? window.labAuth.getCurrentUser() : null;
    let namaSiswa = namaInput?.value.trim() || "";
    let kelasSiswa = kelasInput?.value.trim() || "VII-A";

    if (currentUser && currentUser.role === 'student') {
      namaSiswa = namaSiswa || currentUser.name;
      kelasSiswa = kelasSiswa || currentUser.class;
    }

    if (!namaSiswa) {
      alert("⚠️ Harap isi Nama Peserta Didik pada formulir LKPD terlebih dahulu!");
      if (namaInput) {
        namaInput.focus();
        namaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const jawaban1 = jwb1?.value.trim() || 'Prinsip mikroskop telah dipelajari.';
    const jawaban2 = jwb2?.value.trim() || 'Hasil uji asam-basa telah diamati.';

    if (window.labAudio) window.labAudio.playFanfare();

    // Record submission to Teacher Dashboard
    if (window.labDashboard) {
      window.labDashboard.recordLKPD({
        name: namaSiswa,
        studentClass: kelasSiswa,
        jawaban1: jawaban1,
        jawaban2: jawaban2,
        wells: this.chemState.wells || []
      });
    }

    if (window.labAuth && window.labAuth.showToast) {
      window.labAuth.showToast(`✅ LKPD atas nama ${namaSiswa} (${kelasSiswa}) berhasil dikumpulkan ke Dashboard Guru!`);
    } else {
      alert(`✅ LKPD atas nama ${namaSiswa} (${kelasSiswa}) berhasil tersimpan dan masuk ke Dashboard Guru!`);
    }
  }

  printLKPD() {
    if (window.labAudio) window.labAudio.playFanfare();
    
    let namaInput = document.getElementById('lkpd-nama-siswa');
    let kelasInput = document.getElementById('lkpd-kelas-siswa');
    let namaSiswa = namaInput?.value.trim() || 'Siswa Peserta Didik';
    let kelasSiswa = kelasInput?.value.trim() || 'VII-A';

    const currentUser = window.labAuth ? window.labAuth.getCurrentUser() : null;
    if (currentUser && currentUser.role === 'student') {
      namaSiswa = namaInput?.value.trim() || currentUser.name;
      kelasSiswa = kelasInput?.value.trim() || currentUser.class;
    }

    const tanggal = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const jawaban1 = document.getElementById('lkpd-jawaban-1')?.value || '-';
    const jawaban2 = document.getElementById('lkpd-jawaban-2')?.value || '-';

    // Record submission to Teacher Dashboard
    if (window.labDashboard) {
      window.labDashboard.recordLKPD({
        name: namaSiswa,
        studentClass: kelasSiswa,
        jawaban1: jawaban1,
        jawaban2: jawaban2,
        wells: this.chemState.wells || []
      });
    }

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LKPD Praktikum Laboratorium IPA - ${namaSiswa}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #2d3436; }
          .header { border-bottom: 2px solid #0984e3; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: bold; color: #0984e3; }
          .meta { display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #b2bec3; padding: 10px; text-align: left; font-size: 13px; }
          th { background: #dfe6e9; }
          .section-title { font-weight: bold; margin-top: 25px; font-size: 16px; color: #2d3436; }
          .box { border: 1px solid #74b9ff; background: #f0f8ff; padding: 15px; border-radius: 6px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">LEMBAR KERJA PESERTA DIDIK (LKPD) VIRTUAL LAB IPA</div>
          <div>Materi: Pengenalan Alat Laboratorium & Praktikum Asam Basa Fase D SMP</div>
          <div class="meta">
            <div><strong>Nama:</strong> ${namaSiswa}</div>
            <div><strong>Kelas:</strong> ${kelasSiswa}</div>
            <div><strong>Tanggal:</strong> ${tanggal}</div>
          </div>
        </div>

        <div class="section-title">A. Data Hasil Uji Larutan & Indikator (Plat Tetes)</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Sampel Larutan</th>
              <th>Indikator Digunakan</th>
              <th>Perubahan Warna & Hasil Analisis Sifat</th>
            </tr>
          </thead>
          <tbody>
            ${this.chemState.wells.map(w => `
              <tr>
                <td>${w.id}</td>
                <td>${w.sample || '-'}</td>
                <td>${w.indicator || '-'}</td>
                <td>${w.result}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">B. Analisis Pertanyaan Praktikum</div>
        <div class="box">
          <p><strong>1. Bagaimana prinsip kerja mengatur perbesaran dan fokus pada mikroskop cahaya?</strong></p>
          <p>${jawaban1}</p>
        </div>
        <div class="box">
          <p><strong>2. Kesimpulan sifat asam-basa larutan yang diuji:</strong></p>
          <p>${jawaban2}</p>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 13px;">
          <div>Paraf Orang Tua<br><br><br>_____________________</div>
          <div>Guru Pembimbing IPA<br><br><br>_____________________</div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  }
}

window.virtualLab = new VirtualLab();
