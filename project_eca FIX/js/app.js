// Master Application Controller & Navigation

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Navigation
  initNavigation();

  // 2. Initialize Catalog (Materi)
  initCatalog();

  // 3. Initialize Video Playlist & K3
  initVideoAndK3();

  // 4. Initialize Particle Background
  initParticleCanvas();

  // 5. Global Audio click binding
  document.querySelectorAll('button, a.nav-link').forEach(el => {
    el.addEventListener('click', () => {
      if (window.labAudio) window.labAudio.playClick();
    });
  });
});

// ================= SPA ROUTING & NAVIGATION =================
function initNavigation() {
  const navLinks = document.querySelectorAll('[data-page]');
  const pageSections = document.querySelectorAll('.page-section');

  function navigateTo(pageId) {
    pageSections.forEach(sec => {
      sec.classList.toggle('active-section', sec.id === `page-${pageId}`);
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle Page-specific activations
    if (pageId === 'dashboard-guru') {
      if (!window.labAuth || !window.labAuth.isTeacher()) {
        alert("🔒 Akses Terbatas: Menu Dashboard Guru hanya dapat diakses oleh Guru / Pengajar yang terautentikasi.");
        if (window.labAuth) window.labAuth.openLoginModal('teacher');
        navigateTo('beranda');
        return;
      }
      if (window.labDashboard) {
        window.labDashboard.renderDashboard();
      }
    } else if (pageId === 'ar-3d') {
      if (!window.labViewer3D) {
        setTimeout(() => {
          window.labViewer3D = new window.Lab3DViewer('threejs-canvas-container');
          window.labAR.setTool('mikroskop');
        }, 100);
      }
    } else if (pageId === 'praktikum') {
      if (window.virtualLab) {
        window.virtualLab.init();
      }
    } else if (pageId === 'games') {
      if (window.labGames) {
        window.labGames.switchGame(window.labGames.activeGame || 'match');
      }
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.dataset.page;
      navigateTo(targetPage);
      // Close mobile drawer if open
      const navMenu = document.getElementById('navbar-menu');
      if (navMenu) navMenu.classList.remove('open');
    });
  });

  // Mobile Hamburger Toggle
  const hamburger = document.getElementById('hamburger-toggle');
  const navMenu = document.getElementById('navbar-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Remove old audio toggle listener, relying on inline window.toggleAudio
  window.toggleAudio = function() {
    const bgAudio = document.getElementById('bg-audio');
    const audioIcon = document.getElementById('audio-icon');
    if (!bgAudio || !audioIcon) return;

    if (bgAudio.paused) {
      bgAudio.play();
      audioIcon.className = 'fa-solid fa-volume-high';
    } else {
      bgAudio.pause();
      audioIcon.className = 'fa-solid fa-volume-xmark';
    }
  };

  // Global router expose
  window.navigateToPage = navigateTo;
}

// ================= MATERI ALAT LAB (CATALOG) =================
function initCatalog() {
  const grid = document.getElementById('alat-catalog-grid');
  const searchInput = document.getElementById('search-alat-input');
  const categoryFilters = document.querySelectorAll('.filter-btn');

  let currentCategory = 'all';
  let currentSearch = '';

  function renderTools() {
    if (!grid) return;
    const tools = window.LAB_DATA.alatLab;

    const filtered = tools.filter(tool => {
      const matchCat = (currentCategory === 'all' || tool.kategori === currentCategory);
      const matchSearch = tool.nama.toLowerCase().includes(currentSearch) || tool.fungsi.toLowerCase().includes(currentSearch);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h4>Alat tidak ditemukan</h4>
          <p>Coba gunakan kata kunci pencarian lain atau pilih kategori "Semua Alat".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(tool => `
      <div class="tool-card" onclick="openToolModal('${tool.id}')">
        <div class="tool-card-img-wrap">
          <img src="${tool.gambar}" alt="${tool.nama}" loading="lazy" />
          <span class="tool-card-category">${getCategoryLabel(tool.kategori)}</span>
          ${tool.has3D ? '<span class="tool-badge-3d"><i class="fa-solid fa-cube"></i> Ada 3D</span>' : ''}
        </div>
        <div class="tool-card-body">
          <h3 class="tool-card-title">${tool.nama}</h3>
          <p class="tool-card-desc">${tool.fungsi}</p>
          <div class="tool-card-footer">
            <span class="tool-hazard-tag"><i class="fa-solid fa-triangle-exclamation"></i> ${tool.bahaya}</span>
            <button class="btn-detail-link">Pelajari <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function getCategoryLabel(cat) {
    const map = {
      ukur: 'Alat Ukur',
      penampung: 'Alat Penampung & Pencampur',
      pengamatan: 'Alat Pengamatan',
      'pemanas-pendukung': 'Alat Pemanas & Pendukung'
    };
    return map[cat] || cat;
  }

  // Filter click events
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderTools();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderTools();
    });
  }

  renderTools();
}

// Open Detail Modal for Equipment
window.openToolModal = function(toolId) {
  if (window.labAudio) window.labAudio.playClick();
  const tool = window.LAB_DATA.alatLab.find(t => t.id === toolId);
  if (!tool) return;

  const modal = document.getElementById('tool-detail-modal');
  const modalBody = document.getElementById('modal-tool-content');
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div class="tool-modal-grid">
      <div class="tool-modal-image-col">
        <img src="${tool.gambar}" alt="${tool.nama}" />
        <div class="modal-spec-box">
          <div><strong>Bahan / Material:</strong> <span>${tool.material}</span></div>
          <div><strong>Tingkat Bahaya:</strong> <span class="text-orange">${tool.bahaya}</span></div>
          <div><strong>Kategori:</strong> <span>${tool.kategori.toUpperCase()}</span></div>
        </div>
        ${tool.has3D ? `
          <button class="btn btn-accent btn-block" style="margin-top: 15px;" onclick="viewToolIn3D('${tool.id}')">
            <i class="fa-solid fa-cube"></i> Lihat Model 3D / AR
          </button>
        ` : ''}
      </div>

      <div class="tool-modal-info-col">
        <h2 class="modal-tool-title">${tool.nama}</h2>
        <p class="modal-tool-desc">${tool.deskripsi}</p>

        <h4 class="modal-subheading"><i class="fa-solid fa-list-check"></i> Prosedur & Cara Penggunaan yang Benar:</h4>
        <ol class="modal-steps-list">
          ${tool.caraPakai.map(step => `<li>${step}</li>`).join('')}
        </ol>

        <div class="dos-donts-grid">
          <div class="dos-box">
            <h5><i class="fa-solid fa-circle-check text-green"></i> Hal yang HARUS Dilakukan (Do's)</h5>
            <ul>
              ${tool.dos.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
          <div class="donts-box">
            <h5><i class="fa-solid fa-circle-xmark text-red"></i> Hal yang DILARANG (Don'ts)</h5>
            <ul>
              ${tool.donts.map(dn => `<li>${dn}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

window.closeToolModal = function() {
  if (window.labAudio) window.labAudio.playClick();
  const modal = document.getElementById('tool-detail-modal');
  if (modal) modal.classList.remove('active');
};

window.viewToolIn3D = function(toolId) {
  closeToolModal();
  window.navigateToPage('ar-3d');
  setTimeout(() => {
    if (window.labAR) window.labAR.setTool(toolId);
  }, 300);
};

// ================= VIDEO PLAYER & K3 INFOGRAPHICS =================
function initVideoAndK3() {
  const playlistItems = document.querySelectorAll('.video-playlist-item');
  const iframe = document.getElementById('main-video-iframe');
  const videoTitle = document.getElementById('current-video-title');
  const videoDesc = document.getElementById('current-video-desc');

  playlistItems.forEach(item => {
    item.addEventListener('click', () => {
      const vidId = item.dataset.videoId;
      const vidData = window.LAB_DATA.videos.find(v => v.id === vidId);
      if (!vidData) return;

      playlistItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      if (iframe) iframe.src = vidData.embedUrl;
      if (videoTitle) videoTitle.innerText = vidData.judul;
      if (videoDesc) videoDesc.innerText = vidData.ringkasan;
    });
  });

  // Render K3 Hazard Symbols Cards
  const k3Grid = document.getElementById('k3-symbols-grid');
  if (k3Grid) {
    k3Grid.innerHTML = window.LAB_DATA.simbolK3.map(sym => `
      <div class="k3-card" style="border-top-color: ${sym.warna};">
        <div class="k3-img-wrap">
          <img src="${sym.gambar}" alt="${sym.nama}" />
        </div>
        <h4 class="k3-card-title">${sym.nama}</h4>
        <p class="k3-card-meaning"><strong>Arti:</strong> ${sym.arti}</p>
        <div class="k3-card-examples"><strong>Contoh:</strong> ${sym.contoh}</div>
        <div class="k3-card-action"><strong>Penanganan:</strong> ${sym.penanganan}</div>
      </div>
    `).join('');
  }
}

// ================= PARTICLE BACKGROUND CANVAS =================
function initParticleCanvas() {
  const canvas = document.getElementById('hero-particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.parentElement.clientWidth;
  let height = canvas.height = canvas.parentElement.clientHeight;

  const particles = [];
  const particleCount = 45;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1,
      color: Math.random() > 0.5 ? '#00f0ff' : '#0ea5e9'
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw Particles and Connecting Lines
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.2 * (1 - dist / 100)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', () => {
    if (canvas.parentElement) {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    }
  });

  render();
}

// ================= LOGIN SYSTEM =================
window.submitLogin = function() {
  const nameInput = document.getElementById('student-name').value.trim();
  const classInput = document.getElementById('student-class').value.trim();
  
  if (!nameInput || !classInput) {
    alert('Harap isi Nama dan Kelas terlebih dahulu!');
    return;
  }
  
  // Display name and class
  document.getElementById('display-student-name').innerText = nameInput;
  document.getElementById('display-student-class').innerText = classInput;
  
  // Show user badge, hide login modal
  document.getElementById('user-info-badge').style.display = 'inline-flex';
  document.getElementById('login-modal').style.display = 'none';
  
  // Play background audio
  const bgAudio = document.getElementById('bg-audio');
  const audioIcon = document.getElementById('audio-icon');
  if (bgAudio) {
    bgAudio.play().then(() => {
      if (audioIcon) audioIcon.className = 'fa-solid fa-volume-high';
    }).catch(e => console.log('Audio Autoplay prevented by browser: ', e));
  }
};
