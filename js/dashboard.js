// ============================================================
// CV Maker AI — Dashboard
// ============================================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  await updateNavbar();
  initNavbarScroll();
  await loadDashboard();

  if (window.lucide) lucide.createIcons();
});

async function loadDashboard() {
  // Set greeting
  const nameEl = document.getElementById('userName');
  if (nameEl) {
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
    nameEl.textContent = name;
  }

  // Load CVs
  const cvs = await supabaseDB.getUserCVs(currentUser.id);
  updateStats(cvs);
  renderCVCards(cvs);
}

function updateStats(cvs) {
  const totalEl = document.getElementById('totalCVs');
  const lastEl = document.getElementById('lastEdited');

  if (totalEl) totalEl.textContent = cvs.length;
  if (lastEl) {
    lastEl.textContent = cvs.length > 0 ? timeAgo(cvs[0].updated_at) : '-';
  }
}

function renderCVCards(cvs) {
  const grid = document.getElementById('cvGrid');
  if (!grid) return;

  grid.innerHTML = '';

  if (cvs.length === 0) {
    grid.innerHTML = `
      <div class="cv-card-new" onclick="openNewCVModal()" style="grid-column: 1/-1; max-width: 400px; margin: 0 auto;">
        <div class="new-icon">✨</div>
        <span style="font-size: 1.1rem;">Buat CV Pertama Anda</span>
        <span class="text-muted" style="font-size: 0.85rem;">Mulai buat CV profesional dengan bantuan AI</span>
      </div>
    `;
    return;
  }

  cvs.forEach((cv, index) => {
    const card = document.createElement('div');
    card.className = 'cv-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const templateLabels = { modern: 'Modern', classic: 'Klasik', minimal: 'Minimal' };
    const templateLabel = templateLabels[cv.template] || 'Modern';
    const name = cv.personal_info?.name || 'Belum diisi';

    card.innerHTML = `
      <div class="cv-card-header">
        <h3>${escapeHtml(cv.title)}</h3>
      </div>
      <div class="cv-card-template">
        <span class="badge badge-primary">${templateLabel}</span>
      </div>
      <div class="cv-card-body">
        <div class="cv-preview-mini">📄</div>
      </div>
      <div class="cv-card-footer">
        <span class="cv-card-date">${timeAgo(cv.updated_at)}</span>
        <div class="cv-card-actions">
          <a href="editor.html?id=${cv.id}" class="btn-icon" title="Edit">
            <i data-lucide="pencil" width="16" height="16"></i>
          </a>
          <button class="btn-icon" onclick="duplicateCV('${cv.id}')" title="Duplikasi">
            <i data-lucide="copy" width="16" height="16"></i>
          </button>
          <button class="btn-icon" onclick="deleteCV('${cv.id}', this)" title="Hapus" style="color: var(--error);">
            <i data-lucide="trash-2" width="16" height="16"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Add "New CV" card at end
  const newCard = document.createElement('div');
  newCard.className = 'cv-card-new';
  newCard.onclick = () => openNewCVModal();
  newCard.innerHTML = `
    <div class="new-icon">+</div>
    <span>Buat CV Baru</span>
  `;
  grid.appendChild(newCard);

  if (window.lucide) lucide.createIcons();
}

// ── New CV Modal ──
function openNewCVModal() {
  const modal = document.getElementById('newCvModal');
  if (modal) {
    modal.classList.add('active');
    const input = document.getElementById('newCvTitle');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function closeNewCVModal() {
  const modal = document.getElementById('newCvModal');
  if (modal) modal.classList.remove('active');
}

async function createNewCV() {
  const titleInput = document.getElementById('newCvTitle');
  const title = titleInput ? titleInput.value.trim() : '';

  if (!title) {
    showToast('Harap isi judul CV', 'warning');
    return;
  }

  const btn = document.getElementById('createCvBtn');
  if (btn) setButtonLoading(btn, 'Membuat...');

  const cv = await supabaseDB.createCV(currentUser.id, { title });

  if (btn) resetButton(btn);

  if (cv) {
    closeNewCVModal();
    window.location.href = `editor.html?id=${cv.id}`;
  }
}

// ── Duplicate CV ──
async function duplicateCV(cvId) {
  const loading = showLoading('Menduplikasi CV...');

  const original = await supabaseDB.getCVById(cvId);
  if (!original) {
    hideLoading(loading);
    return;
  }

  const newData = { ...original };
  delete newData.id;
  delete newData.created_at;
  delete newData.updated_at;
  newData.title = original.title + ' (Salinan)';

  const result = await supabaseDB.createCV(currentUser.id, newData);
  hideLoading(loading);

  if (result) {
    showToast('CV berhasil diduplikasi!', 'success');
    await loadDashboard();
    if (window.lucide) lucide.createIcons();
  }
}

// ── Delete CV ──
async function deleteCV(cvId, btnEl) {
  if (!confirm('Yakin ingin menghapus CV ini? Tindakan ini tidak bisa dibatalkan.')) return;

  const card = btnEl.closest('.cv-card');
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
  }

  const success = await supabaseDB.deleteCV(cvId);

  if (success) {
    setTimeout(() => {
      if (card) card.remove();
      showToast('CV berhasil dihapus', 'success');
      // Reload stats
      supabaseDB.getUserCVs(currentUser.id).then(cvs => updateStats(cvs));
    }, 300);
  } else {
    if (card) {
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    }
  }
}
