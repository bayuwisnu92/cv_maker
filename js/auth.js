// ============================================================
// CV Maker AI — Authentication (Login & Register)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // If already logged in, redirect to dashboard
  const user = await supabaseAuth.getUser();
  if (user) {
    window.location.href = 'dashboard.html';
    return;
  }

  updateNavbar();
  initNavbarScroll();

  // Detect which page we're on
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) initLogin(loginForm);
  if (registerForm) initRegister(registerForm);

  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();
});

// ── Login ──
function initLogin(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validation
    if (!email || !password) {
      showToast('Harap isi email dan password', 'warning');
      return;
    }

    if (!isValidEmail(email)) {
      showToast('Format email tidak valid', 'warning');
      return;
    }

    setButtonLoading(submitBtn, 'Masuk...');

    const { data, error } = await supabaseAuth.signIn(email, password);

    if (error) {
      resetButton(submitBtn);
      if (error.message.includes('Invalid login')) {
        showToast('Email atau password salah', 'error');
      } else if (error.message.includes('Email not confirmed')) {
        showToast('Email belum dikonfirmasi. Cek inbox Anda.', 'warning');
      } else {
        showToast('Gagal masuk: ' + error.message, 'error');
      }
      return;
    }

    showToast('Berhasil masuk! Mengalihkan...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 800);
  });

  // Password toggle
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('loginPassword');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      toggleBtn.innerHTML = type === 'password'
        ? '<i data-lucide="eye" width="18" height="18"></i>'
        : '<i data-lucide="eye-off" width="18" height="18"></i>';
      if (window.lucide) lucide.createIcons();
    });
  }
}

// ── Register ──
function initRegister(form) {
  const passwordInput = document.getElementById('registerPassword');
  const meterEl = document.getElementById('passwordMeter');
  const feedbackEl = document.getElementById('passwordFeedback');

  // Password strength meter
  if (passwordInput && meterEl) {
    passwordInput.addEventListener('input', () => {
      const result = validatePassword(passwordInput.value);
      meterEl.setAttribute('data-score', result.score);
      if (feedbackEl) {
        feedbackEl.textContent = result.valid ? '✓ Password kuat' : result.feedback;
        feedbackEl.style.color = result.valid ? 'var(--success)' : 'var(--text-muted)';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validation
    if (!name) {
      showToast('Harap isi nama lengkap', 'warning');
      return;
    }

    if (!email || !isValidEmail(email)) {
      showToast('Harap isi email yang valid', 'warning');
      return;
    }

    const passResult = validatePassword(password);
    if (!passResult.valid) {
      showToast('Password kurang kuat: ' + passResult.feedback, 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'warning');
      return;
    }

    setButtonLoading(submitBtn, 'Mendaftar...');

    const { data, error } = await supabaseAuth.signUp(email, password, name);

    resetButton(submitBtn);

    if (error) {
      if (error.message.includes('already registered')) {
        showToast('Email sudah terdaftar. Silakan login.', 'warning');
      } else {
        showToast('Gagal mendaftar: ' + error.message, 'error');
      }
      return;
    }

    // Check if email confirmation is needed
    if (data.user && !data.session) {
      showToast('Pendaftaran berhasil! Cek email Anda untuk konfirmasi.', 'success', 5000);
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      showToast('Pendaftaran berhasil!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    }
  });

  // Password toggle for register
  const toggleBtn = document.getElementById('toggleRegPassword');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      toggleBtn.innerHTML = type === 'password'
        ? '<i data-lucide="eye" width="18" height="18"></i>'
        : '<i data-lucide="eye-off" width="18" height="18"></i>';
      if (window.lucide) lucide.createIcons();
    });
  }
}
