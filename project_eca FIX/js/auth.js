// Authentication & User Session Management (Student & Teacher)

class LabAuth {
  constructor() {
    this.STORAGE_KEY = 'ipa_lab_auth_session';
    this.currentUser = null;
    this.teacherCredentials = {
      username: 'guru',
      password: 'guru123'
    };
    this.init();
  }

  init() {
    this.loadSession();
    this.updateUI();
  }

  loadSession() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading auth session:", e);
      this.currentUser = null;
    }
  }

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  loginStudent(name, studentClass) {
    if (!name || !name.trim()) {
      alert("⚠️ Silakan masukkan nama lengkap siswa!");
      return false;
    }
    if (!studentClass || !studentClass.trim()) {
      alert("⚠️ Silakan pilih atau masukkan kelas!");
      return false;
    }

    this.currentUser = {
      role: 'student',
      name: name.trim(),
      class: studentClass.trim(),
      loginTime: new Date().toISOString()
    };

    this.saveSession();
    this.updateUI();
    this.closeLoginModal();

    if (window.labAudio) window.labAudio.playFanfare();
    this.showToast(`Selamat datang, ${this.currentUser.name} (${this.currentUser.class})!`);

    // Sync with evaluation & LKPD form inputs if present
    this.syncStudentForms();
    return true;
  }

  loginTeacher(username, password) {
    if (!username || !password) {
      alert("⚠️ Masukkan username dan password guru!");
      return false;
    }

    if (
      username.trim().toLowerCase() === this.teacherCredentials.username.toLowerCase() &&
      password.trim() === this.teacherCredentials.password
    ) {
      this.currentUser = {
        role: 'teacher',
        name: 'Guru IPA (Pengajar)',
        username: username.trim(),
        loginTime: new Date().toISOString()
      };

      this.saveSession();
      this.updateUI();
      this.closeLoginModal();

      if (window.labAudio) window.labAudio.playFanfare();
      this.showToast("Login Guru Berhasil! Menu Dashboard Guru telah diaktifkan.");

      // Direct navigate to dashboard
      if (window.navigateToPage) {
        window.navigateToPage('dashboard-guru');
      }
      return true;
    } else {
      if (window.labAudio) window.labAudio.playWrong();
      alert("❌ Username atau password guru salah! Silakan coba lagi.");
      return false;
    }
  }

  logout() {
    if (confirm("Apakah Anda yakin ingin keluar dari sesi ini?")) {
      const wasTeacher = this.isTeacher();
      this.currentUser = null;
      this.saveSession();
      this.updateUI();
      if (window.labAudio) window.labAudio.playClick();
      this.showToast("Anda telah keluar dari sesi.");

      if (wasTeacher && window.navigateToPage) {
        window.navigateToPage('beranda');
      }
    }
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  isTeacher() {
    return this.currentUser && this.currentUser.role === 'teacher';
  }

  isStudent() {
    return this.currentUser && this.currentUser.role === 'student';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  updateUI() {
    const loginBtn = document.getElementById('btn-nav-login');
    const userBadge = document.getElementById('user-info-badge');
    const teacherMenuLink = document.getElementById('nav-link-dashboard-guru');
    const studentNameDisp = document.getElementById('display-student-name');
    const studentClassDisp = document.getElementById('display-student-class');

    if (this.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userBadge) {
        userBadge.style.display = 'inline-flex';
        if (this.currentUser.role === 'teacher') {
          userBadge.className = 'badge-teacher';
          userBadge.innerHTML = `
            <i class="fa-solid fa-chalkboard-user"></i> <span>Guru IPA</span>
            <button class="badge-logout-btn" onclick="window.labAuth.logout()" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></button>
          `;
        } else {
          userBadge.className = 'badge-accent';
          userBadge.innerHTML = `
            <i class="fa-solid fa-user-graduate"></i> <span>${this.currentUser.name} (${this.currentUser.class})</span>
            <button class="badge-logout-btn" onclick="window.labAuth.logout()" title="Ganti Pengguna"><i class="fa-solid fa-right-from-bracket"></i></button>
          `;
        }
      }

      if (teacherMenuLink) {
        teacherMenuLink.style.display = this.isTeacher() ? 'block' : 'none';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (userBadge) userBadge.style.display = 'none';
      if (teacherMenuLink) teacherMenuLink.style.display = 'none';
    }

    this.syncStudentForms();
  }

  syncStudentForms() {
    if (this.isStudent()) {
      const evalName = document.getElementById('eval-student-name');
      const evalClass = document.getElementById('eval-student-class');
      const lkpdName = document.getElementById('lkpd-nama-siswa');
      const lkpdClass = document.getElementById('lkpd-kelas-siswa');

      if (evalName) evalName.value = this.currentUser.name;
      if (evalClass) evalClass.value = this.currentUser.class;
      if (lkpdName) lkpdName.value = this.currentUser.name;
      if (lkpdClass) lkpdClass.value = this.currentUser.class;
    }
  }

  openLoginModal(defaultTab = 'student') {
    if (window.labAudio) window.labAudio.playClick();
    const modal = document.getElementById('auth-login-modal');
    if (!modal) return;

    this.switchLoginTab(defaultTab);
    modal.classList.add('active');
  }

  closeLoginModal() {
    const modal = document.getElementById('auth-login-modal');
    if (modal) modal.classList.remove('active');
  }

  switchLoginTab(tab) {
    if (window.labAudio) window.labAudio.playClick();
    const studentTabBtn = document.getElementById('tab-btn-login-student');
    const teacherTabBtn = document.getElementById('tab-btn-login-teacher');
    const studentForm = document.getElementById('form-login-student');
    const teacherForm = document.getElementById('form-login-teacher');

    if (tab === 'student') {
      if (studentTabBtn) studentTabBtn.classList.add('active');
      if (teacherTabBtn) teacherTabBtn.classList.remove('active');
      if (studentForm) studentForm.style.display = 'block';
      if (teacherForm) teacherForm.style.display = 'none';
    } else {
      if (studentTabBtn) studentTabBtn.classList.remove('active');
      if (teacherTabBtn) teacherTabBtn.classList.add('active');
      if (studentForm) studentForm.style.display = 'none';
      if (teacherForm) teacherForm.style.display = 'block';
    }
  }

  showToast(message) {
    let toast = document.getElementById('app-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast-notification';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
}

window.labAuth = new LabAuth();
