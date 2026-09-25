// Augmented Reality (AR) Camera & 3D Interactive Lab Tool Simulation

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

  setTool(toolId) {
    this.currentTool = toolId;
    const toolData = window.LAB_DATA.alatLab.find(a => a.id === toolId) || window.LAB_DATA.alatLab[0];

    // Highlight corresponding active chip in UI
    document.querySelectorAll('.tool-chip').forEach(chip => {
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
  }

  captureSnapshot() {
    if (window.labAudio) window.labAudio.playCorrect();
    const notification = document.createElement('div');
    notification.className = 'toast-notification success';
    notification.innerHTML = '<i class="fa-solid fa-camera"></i> Foto AR Berhasil Ditangkap!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

window.labAR = new LabARModule();
