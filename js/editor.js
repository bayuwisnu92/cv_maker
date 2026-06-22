// ============================================================
// CV Maker AI — Editor
// ============================================================

let currentUser = null;
let cvId = null;
let cvData = null;
let currentStep = 1;
let isDirty = false;
let autoSaveTimer = null;
let aiChatHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  await updateNavbar();
  initNavbarScroll();

  // Get CV ID from URL
  const params = new URLSearchParams(window.location.search);
  cvId = params.get('id');

  if (cvId) {
    const loading = showLoading('Memuat CV...');
    cvData = await supabaseDB.getCVById(cvId);
    hideLoading(loading);

    if (!cvData) {
      showToast('CV tidak ditemukan', 'error');
      window.location.href = 'dashboard.html';
      return;
    }
    populateForm(cvData);
  } else {
    // Create new CV
    cvData = await supabaseDB.createCV(currentUser.id, { title: 'CV Baru' });
    if (cvData) {
      cvId = cvData.id;
      history.replaceState(null, '', `editor.html?id=${cvId}`);
    } else {
      showToast('Gagal membuat CV baru', 'error');
      window.location.href = 'dashboard.html';
      return;
    }
  }

  setupEventListeners();
  goToStep(1);
  updateLivePreview();
  startAutoSave();

  if (window.lucide) lucide.createIcons();
});

// ── Populate Form ──
function populateForm(data) {
  const pi = data.personal_info || {};
  const sm = data.social_media || {};

  // Title
  const titleInput = document.getElementById('cvTitle');
  if (titleInput) titleInput.value = data.title || 'CV Saya';

  // Personal info
  setVal('inputName', pi.name);
  setVal('inputEmail', pi.email);
  setVal('inputPhone', pi.phone);
  setVal('inputAddress', pi.address);
  setVal('inputReligion', pi.religion);
  setVal('inputHeight', pi.height);
  setVal('inputWeight', pi.weight);

  // Profile pic
  if (data.profile_pic_url) {
    const img = document.getElementById('profilePicPreview');
    if (img) {
      img.src = data.profile_pic_url;
      img.style.display = 'block';
    }
  }

  // Social media
  setVal('inputFacebook', sm.facebook);
  setVal('inputTwitter', sm.twitter);
  setVal('inputInstagram', sm.instagram);
  setVal('inputGithub', sm.github);
  setVal('inputLinkedin', sm.linkedin);

  // Education
  const eduList = document.getElementById('educationList');
  if (eduList && data.education?.length) {
    eduList.innerHTML = '';
    data.education.forEach(e => addEducation(e));
  }

  // Experience
  const expList = document.getElementById('experienceList');
  if (expList && data.experience?.length) {
    expList.innerHTML = '';
    data.experience.forEach(e => addExperience(e));
  }

  // Skills
  const skillList = document.getElementById('skillsList');
  if (skillList && data.skills?.length) {
    skillList.innerHTML = '';
    data.skills.forEach(s => addSkill(s));
  }

  // Organizations
  const orgList = document.getElementById('organizationList');
  if (orgList && data.organizations?.length) {
    orgList.innerHTML = '';
    data.organizations.forEach(o => addOrganization(o));
  }

  // Hobbies
  const hobbyList = document.getElementById('hobbyList');
  if (hobbyList && data.hobbies?.length) {
    hobbyList.innerHTML = '';
    data.hobbies.forEach(h => addHobby(h));
  }

  // AI Summary
  setVal('aiSummary', data.ai_summary);

  // Template
  const tplBtns = document.querySelectorAll('.template-option');
  tplBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.template === data.template);
  });
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

// ── Step Navigation ──
function goToStep(step) {
  currentStep = step;

  document.querySelectorAll('.step-content').forEach(el => {
    el.classList.remove('active');
  });

  const target = document.getElementById(`step${step}`);
  if (target) target.classList.add('active');

  // Update step indicators
  document.querySelectorAll('.step-item').forEach((item, idx) => {
    item.classList.remove('active', 'completed');
    if (idx + 1 === step) item.classList.add('active');
    else if (idx + 1 < step) item.classList.add('completed');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  if (currentStep < 4) {
    isDirty = true;
    goToStep(currentStep + 1);
    updateLivePreview();
  }
}

function prevStep() {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
}

// ── Add Items ──
function addEducation(data = {}) {
  const list = document.getElementById('educationList');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'section-item';
  item.innerHTML = `
    <button class="remove-item" onclick="this.closest('.section-item').remove(); isDirty=true; updateLivePreview();">×</button>
    <div class="item-row">
      <div><label>Institusi</label><input class="input-modern edu-institution" value="${escapeHtml(data.institution || '')}" placeholder="Nama Sekolah/Universitas"></div>
      <div><label>Gelar/Jurusan</label><input class="input-modern edu-degree" value="${escapeHtml(data.degree || '')}" placeholder="S1 Teknik Informatika"></div>
    </div>
    <div class="item-row single">
      <div><label>Tahun</label><input class="input-modern edu-year" value="${escapeHtml(data.year || '')}" placeholder="2018 - 2022"></div>
    </div>
  `;
  list.appendChild(item);
  isDirty = true;
}

function addExperience(data = {}) {
  const list = document.getElementById('experienceList');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'section-item';
  item.innerHTML = `
    <button class="remove-item" onclick="this.closest('.section-item').remove(); isDirty=true; updateLivePreview();">×</button>
    <div class="item-row">
      <div><label>Perusahaan</label><input class="input-modern exp-company" value="${escapeHtml(data.company || '')}" placeholder="Nama Perusahaan"></div>
      <div><label>Posisi</label><input class="input-modern exp-position" value="${escapeHtml(data.position || '')}" placeholder="Frontend Developer"></div>
    </div>
    <div class="item-row">
      <div><label>Periode</label><input class="input-modern exp-period" value="${escapeHtml(data.period || '')}" placeholder="Jan 2022 - Sekarang"></div>
      <div><label>Deskripsi</label><input class="input-modern exp-description" value="${escapeHtml(data.description || '')}" placeholder="Deskripsi pekerjaan"></div>
    </div>
  `;
  list.appendChild(item);
  isDirty = true;
}

function addSkill(data = {}) {
  const list = document.getElementById('skillsList');
  if (!list) return;

  const name = typeof data === 'string' ? data : (data.name || '');
  let level = typeof data === 'string' ? '8' : (data.level || '8');

  // Map old text levels for backward compatibility
  if (level === 'Pemula') level = '3';
  else if (level === 'Menengah') level = '6';
  else if (level === 'Mahir') level = '8';
  else if (level === 'Ahli') level = '10';

  const item = document.createElement('div');
  item.className = 'section-item';
  item.innerHTML = `
    <button class="remove-item" onclick="this.closest('.section-item').remove(); isDirty=true; updateLivePreview();">×</button>
    <div class="item-row">
      <div><label>Nama Skill</label><input class="input-modern skill-name" value="${escapeHtml(name)}" placeholder="JavaScript" oninput="isDirty=true; updateLivePreview();"></div>
      <div><label>Level (1-10)</label>
        <input type="number" min="1" max="10" class="input-modern skill-level" value="${escapeHtml(level)}" placeholder="8" oninput="isDirty=true; updateLivePreview();">
      </div>
    </div>
  `;
  list.appendChild(item);
  isDirty = true;
}

function addOrganization(data = {}) {
  const list = document.getElementById('organizationList');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'section-item';
  item.innerHTML = `
    <button class="remove-item" onclick="this.closest('.section-item').remove(); isDirty=true; updateLivePreview();">×</button>
    <div class="item-row">
      <div><label>Organisasi</label><input class="input-modern org-name" value="${escapeHtml(data.name || '')}" placeholder="Nama Organisasi"></div>
      <div><label>Jabatan</label><input class="input-modern org-position" value="${escapeHtml(data.position || '')}" placeholder="Ketua"></div>
    </div>
    <div class="item-row single">
      <div><label>Periode</label><input class="input-modern org-period" value="${escapeHtml(data.period || '')}" placeholder="2020 - 2021"></div>
    </div>
  `;
  list.appendChild(item);
  isDirty = true;
}

function addHobby(data = '') {
  const list = document.getElementById('hobbyList');
  if (!list) return;

  const name = typeof data === 'string' ? data : (data.name || '');

  const item = document.createElement('div');
  item.className = 'section-item';
  item.innerHTML = `
    <button class="remove-item" onclick="this.closest('.section-item').remove(); isDirty=true; updateLivePreview();">×</button>
    <div class="item-row single">
      <div><label>Hobi</label><input class="input-modern hobby-name" value="${escapeHtml(name)}" placeholder="Membaca buku"></div>
    </div>
  `;
  list.appendChild(item);
  isDirty = true;
}

// ── Collect Form Data ──
function collectFormData() {
  const data = {
    title: document.getElementById('cvTitle')?.value || 'CV Saya',
    template: document.querySelector('.template-option.active')?.dataset.template || 'modern',
    personal_info: {
      name: document.getElementById('inputName')?.value || '',
      email: document.getElementById('inputEmail')?.value || '',
      phone: document.getElementById('inputPhone')?.value || '',
      address: document.getElementById('inputAddress')?.value || '',
      religion: document.getElementById('inputReligion')?.value || '',
      height: document.getElementById('inputHeight')?.value || '',
      weight: document.getElementById('inputWeight')?.value || '',
    },
    social_media: {
      facebook: document.getElementById('inputFacebook')?.value || '',
      twitter: document.getElementById('inputTwitter')?.value || '',
      instagram: document.getElementById('inputInstagram')?.value || '',
      github: document.getElementById('inputGithub')?.value || '',
      linkedin: document.getElementById('inputLinkedin')?.value || '',
    },
    education: [],
    experience: [],
    skills: [],
    organizations: [],
    hobbies: [],
    ai_summary: document.getElementById('aiSummary')?.value || '',
    profile_pic_url: document.getElementById('profilePicPreview')?.src || '',
  };

  // Education
  document.querySelectorAll('#educationList .section-item').forEach(item => {
    data.education.push({
      institution: item.querySelector('.edu-institution')?.value || '',
      degree: item.querySelector('.edu-degree')?.value || '',
      year: item.querySelector('.edu-year')?.value || '',
    });
  });

  // Experience
  document.querySelectorAll('#experienceList .section-item').forEach(item => {
    data.experience.push({
      company: item.querySelector('.exp-company')?.value || '',
      position: item.querySelector('.exp-position')?.value || '',
      period: item.querySelector('.exp-period')?.value || '',
      description: item.querySelector('.exp-description')?.value || '',
    });
  });

  // Skills
  document.querySelectorAll('#skillsList .section-item').forEach(item => {
    data.skills.push({
      name: item.querySelector('.skill-name')?.value || '',
      level: item.querySelector('.skill-level')?.value || 'Menengah',
    });
  });

  // Organizations
  document.querySelectorAll('#organizationList .section-item').forEach(item => {
    data.organizations.push({
      name: item.querySelector('.org-name')?.value || '',
      position: item.querySelector('.org-position')?.value || '',
      period: item.querySelector('.org-period')?.value || '',
    });
  });

  // Hobbies
  document.querySelectorAll('#hobbyList .section-item').forEach(item => {
    const val = item.querySelector('.hobby-name')?.value;
    if (val) data.hobbies.push(val);
  });

  return data;
}

// ── Save CV ──
async function saveCV(showNotification = true) {
  const data = collectFormData();
  const indicator = document.getElementById('saveIndicator');

  if (indicator) {
    indicator.textContent = '💾 Menyimpan...';
    indicator.classList.remove('saved');
  }

  const result = await supabaseDB.updateCV(cvId, data);

  if (result) {
    isDirty = false;
    if (indicator) {
      indicator.textContent = '✓ Tersimpan';
      indicator.classList.add('saved');
    }
    if (showNotification) showToast('CV berhasil disimpan!', 'success');
  }
}

// ── Auto Save ──
function startAutoSave() {
  autoSaveTimer = setInterval(() => {
    if (isDirty) {
      saveCV(false);
    }
  }, APP_CONFIG.AUTO_SAVE_INTERVAL);
}

// ── Profile Pic Upload ──
async function handleProfilePicUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    showToast('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.', 'warning');
    return;
  }

  if (file.size > APP_CONFIG.MAX_PROFILE_PIC_SIZE) {
    showToast('Ukuran file terlalu besar. Maksimal 2MB.', 'warning');
    return;
  }

  // Show preview immediately
  const reader = new FileReader();
  reader.onload = function () {
    const img = document.getElementById('profilePicPreview');
    if (img) {
      img.src = reader.result;
      img.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);

  // Upload to Supabase
  showToast('Mengupload gambar...', 'info');
  const url = await supabaseStorage.uploadProfilePic(currentUser.id, file);
  if (url) {
    await supabaseDB.updateCV(cvId, { profile_pic_url: url });
    const img = document.getElementById('profilePicPreview');
    if (img) img.src = url;
    showToast('Gambar profil berhasil diupload!', 'success');
    updateLivePreview();
  }
}

// ── Template Selection ──
function selectTemplate(template) {
  document.querySelectorAll('.template-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.template === template);
  });
  isDirty = true;
  updateLivePreview();
}

// ── Live Preview ──
const updateLivePreview = debounce(function () {
  const container = document.getElementById('livePreviewContainer');
  if (!container) return;

  const data = collectFormData();
  const template = data.template || 'modern';

  container.innerHTML = `<div class="cv-document" id="cvDocument" style="width: 800px; min-height: 1131px; transform-origin: top center; margin: 0 auto;">${renderCVTemplate(data, template)}</div>`;
  adjustPreviewScale();
}, 300);

function renderCVTemplate(data, template) {
  const pi = data.personal_info || {};
  const sm = data.social_media || {};
  const photoSrc = data.profile_pic_url || '';
  const photoHtml = photoSrc && !photoSrc.endsWith('undefined')
    ? `<img class="cv-photo" src="${photoSrc}" alt="Foto">`
    : '';

  const renderMetaHtml = (isDark = false) => {
    if (!pi.religion && !pi.height && !pi.weight) return '';
    const borderStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const textStyle = isDark ? 'color:rgba(255,255,255,0.85);' : 'color:#555;';
    return `
      <div class="cv-meta-section" style="border-top:1px solid ${borderStyle}; padding-top:8px; margin-top:8px; font-size:0.8rem; line-height:1.5; ${textStyle}">
        ${pi.religion ? `<div>Agama: ${escapeHtml(pi.religion)}</div>` : ''}
        ${pi.height ? `<div>Tinggi: ${escapeHtml(pi.height)} cm</div>` : ''}
        ${pi.weight ? `<div>Berat: ${escapeHtml(pi.weight)} kg</div>` : ''}
      </div>
    `;
  };

  const renderSkillBars = (skills) => {
    if (!skills || !skills.length) return '';
    return skills.map(s => {
      let lvl = parseInt(s.level);
      if (isNaN(lvl)) lvl = 8;
      if (lvl < 1) lvl = 1;
      if (lvl > 10) lvl = 10;
      const pct = lvl * 10;
      return `
        <div class="cv-skill-bar-wrapper">
          <div class="cv-skill-bar-header">
            <span class="cv-skill-bar-name">${escapeHtml(s.name)}</span>
            <span class="cv-skill-bar-val">${lvl}/10</span>
          </div>
          <div class="cv-skill-bar-track">
            <div class="cv-skill-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  };

  if (template === 'modern') {
    return `
      <div class="template-modern">
        <div class="cv-sidebar">
          ${photoHtml}
          <div class="cv-section">
            <div class="cv-section-title">Kontak</div>
            ${pi.email ? `<div class="cv-contact-item"><span class="contact-icon">✉</span> ${escapeHtml(pi.email)}</div>` : ''}
            ${pi.phone ? `<div class="cv-contact-item"><span class="contact-icon">📞</span> ${escapeHtml(pi.phone)}</div>` : ''}
            ${pi.address ? `<div class="cv-contact-item"><span class="contact-icon">📍</span> ${escapeHtml(pi.address)}</div>` : ''}
            ${renderMetaHtml(true)}
          </div>
          ${data.skills?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Keahlian</div>
              ${renderSkillBars(data.skills)}
            </div>
          ` : ''}
          ${sm.facebook || sm.twitter || sm.instagram || sm.github || sm.linkedin ? `
            <div class="cv-section">
              <div class="cv-section-title">Sosial Media</div>
              ${sm.linkedin ? `<div class="cv-social-item">🔗 ${escapeHtml(sm.linkedin)}</div>` : ''}
              ${sm.github ? `<div class="cv-social-item">💻 ${escapeHtml(sm.github)}</div>` : ''}
              ${sm.instagram ? `<div class="cv-social-item">📷 ${escapeHtml(sm.instagram)}</div>` : ''}
              ${sm.twitter ? `<div class="cv-social-item">🐦 ${escapeHtml(sm.twitter)}</div>` : ''}
              ${sm.facebook ? `<div class="cv-social-item">📘 ${escapeHtml(sm.facebook)}</div>` : ''}
            </div>
          ` : ''}
          ${data.hobbies?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Hobi</div>
              ${data.hobbies.map(h => `<div class="cv-hobby-item">• ${escapeHtml(h)}</div>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="cv-main">
          <div class="cv-name">${escapeHtml(pi.name || 'Nama Anda')}</div>
          ${data.ai_summary ? `<div class="cv-summary">${escapeHtml(data.ai_summary)}</div>` : ''}
          ${data.education?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Pendidikan</div>
              ${data.education.map(e => `
                <div class="cv-item">
                  <div class="cv-item-title">${escapeHtml(e.institution)}</div>
                  <div class="cv-item-subtitle">${escapeHtml(e.degree)}</div>
                  <div class="cv-item-date">${escapeHtml(e.year)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${data.experience?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Pengalaman Kerja</div>
              ${data.experience.map(e => `
                <div class="cv-item">
                  <div class="cv-item-title">${escapeHtml(e.company)}</div>
                  <div class="cv-item-subtitle">${escapeHtml(e.position)}</div>
                  <div class="cv-item-date">${escapeHtml(e.period)}</div>
                  ${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${data.organizations?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Organisasi</div>
              ${data.organizations.map(o => `
                <div class="cv-item">
                  <div class="cv-item-title">${escapeHtml(o.name)}</div>
                  <div class="cv-item-subtitle">${escapeHtml(o.position)}</div>
                  <div class="cv-item-date">${escapeHtml(o.period)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Classic & Minimal templates use simplified rendering
  if (template === 'classic') {
    return `
      <div class="template-classic">
        <div class="cv-header-classic">
          ${photoHtml}
          <div class="cv-name">${escapeHtml(pi.name || 'Nama Anda')}</div>
          <div class="cv-contact-line">
            ${pi.email ? `<span>${escapeHtml(pi.email)}</span>` : ''}
            ${pi.email && pi.phone ? '<span class="sep">|</span>' : ''}
            ${pi.phone ? `<span>${escapeHtml(pi.phone)}</span>` : ''}
            ${pi.phone && pi.address ? '<span class="sep">|</span>' : ''}
            ${pi.address ? `<span>${escapeHtml(pi.address)}</span>` : ''}
          </div>
          ${renderMetaHtml(false)}
          ${data.ai_summary ? `<div class="cv-summary">${escapeHtml(data.ai_summary)}</div>` : ''}
        </div>
        ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title">Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${escapeHtml(e.institution)}</span><span class="cv-item-date">${escapeHtml(e.year)}</span></div><div class="cv-item-subtitle">${escapeHtml(e.degree)}</div></div>`).join('')}</div>` : ''}
        ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title">Pengalaman Kerja</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${escapeHtml(e.company)} - ${escapeHtml(e.position)}</span><span class="cv-item-date">${escapeHtml(e.period)}</span></div>${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
        ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-classic">${renderSkillBars(data.skills)}</div></div>` : ''}
        ${data.organizations?.length ? `<div class="cv-section"><div class="cv-section-title">Organisasi</div>${data.organizations.map(o => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${escapeHtml(o.name)} - ${escapeHtml(o.position)}</span><span class="cv-item-date">${escapeHtml(o.period)}</span></div></div>`).join('')}</div>` : ''}
        ${data.hobbies?.length ? `<div class="cv-section"><div class="cv-section-title">Hobi</div><div class="cv-hobbies-classic">${data.hobbies.join(', ')}</div></div>` : ''}
      </div>
    `;
  }

  if (template === 'minimal') {
    return `
      <div class="template-minimal">
        <div class="cv-header-minimal">
          <div class="cv-name">${escapeHtml(pi.name || 'Nama Anda')}</div>
          <div class="cv-contact-minimal">
            ${pi.email ? `<span>✉ ${escapeHtml(pi.email)}</span>` : ''}
            ${pi.phone ? `<span>📞 ${escapeHtml(pi.phone)}</span>` : ''}
            ${pi.address ? `<span>📍 ${escapeHtml(pi.address)}</span>` : ''}
          </div>
          ${renderMetaHtml(false)}
        </div>
        ${data.ai_summary ? `<div class="cv-summary">${escapeHtml(data.ai_summary)}</div>` : ''}
        ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title">Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-title">${escapeHtml(e.institution)}</div><div class="cv-item-meta">${escapeHtml(e.degree)} • ${escapeHtml(e.year)}</div></div>`).join('')}</div>` : ''}
        ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title">Pengalaman Kerja</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-title">${escapeHtml(e.company)}</div><div class="cv-item-meta">${escapeHtml(e.position)} • ${escapeHtml(e.period)}</div>${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
        ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-minimal">${renderSkillBars(data.skills)}</div></div>` : ''}
        ${data.organizations?.length ? `<div class="cv-section"><div class="cv-section-title">Organisasi</div>${data.organizations.map(o => `<div class="cv-item"><div class="cv-item-title">${escapeHtml(o.name)}</div><div class="cv-item-meta">${escapeHtml(o.position)} • ${escapeHtml(o.period)}</div></div>`).join('')}</div>` : ''}
      </div>
    `;
  }

  if (template === 'elegant') {
    return `
      <div class="template-elegant">
        <div class="cv-elegant-main">
          <div class="cv-header-elegant">
            <div class="cv-name">${escapeHtml(pi.name || 'Nama Anda')}</div>
            <div class="cv-contact-line">
              ${pi.email ? `<span>${escapeHtml(pi.email)}</span>` : ''}
              ${pi.phone ? `<span>•</span><span>${escapeHtml(pi.phone)}</span>` : ''}
              ${pi.address ? `<span>•</span><span>${escapeHtml(pi.address)}</span>` : ''}
            </div>
            ${renderMetaHtml(false)}
          </div>
          ${data.ai_summary ? `<div class="cv-summary">${escapeHtml(data.ai_summary)}</div>` : ''}
          ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title">Pengalaman Profesional</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${escapeHtml(e.position)}</span><span class="cv-item-date">${escapeHtml(e.period)}</span></div><div class="cv-item-subtitle">${escapeHtml(e.company)}</div>${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
          ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title">Riwayat Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${escapeHtml(e.degree)}</span><span class="cv-item-date">${escapeHtml(e.year)}</span></div><div class="cv-item-subtitle">${escapeHtml(e.institution)}</div></div>`).join('')}</div>` : ''}
        </div>
        <div class="cv-elegant-sidebar">
          ${photoHtml}
          ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-list">${renderSkillBars(data.skills)}</div></div>` : ''}
          ${data.organizations?.length ? `<div class="cv-section"><div class="cv-section-title">Organisasi</div>${data.organizations.map(o => `<div class="cv-item"><div class="cv-item-title">${escapeHtml(o.position)}</div><div class="cv-item-subtitle">${escapeHtml(o.name)}</div><div class="cv-item-date">${escapeHtml(o.period)}</div></div>`).join('')}</div>` : ''}
        </div>
      </div>
    `;
  }
  if (template === 'professional') {
    const socialLinks = [];
    if (data.social_media) {
      if (data.social_media.linkedin) socialLinks.push(`<div>LinkedIn: ${escapeHtml(data.social_media.linkedin)}</div>`);
      if (data.social_media.github) socialLinks.push(`<div>Github: ${escapeHtml(data.social_media.github)}</div>`);
      if (data.social_media.instagram) socialLinks.push(`<div>Instagram: ${escapeHtml(data.social_media.instagram)}</div>`);
      if (data.social_media.twitter) socialLinks.push(`<div>Twitter: ${escapeHtml(data.social_media.twitter)}</div>`);
      if (data.social_media.facebook) socialLinks.push(`<div>Facebook: ${escapeHtml(data.social_media.facebook)}</div>`);
    }

    return `
      <div class="template-professional">
        <div class="cv-prof-sidebar">
          <div class="cv-prof-photo">
            ${photoHtml}
          </div>
          <div class="cv-prof-section">
            <div class="cv-prof-title">Contact</div>
            <div class="cv-prof-contact">
              ${pi.phone ? `<div>📞 ${escapeHtml(pi.phone)}</div>` : ''}
              ${pi.email ? `<div>✉ ${escapeHtml(pi.email)}</div>` : ''}
              ${pi.address ? `<div>📍 ${escapeHtml(pi.address)}</div>` : ''}
              ${renderMetaHtml(true)}
            </div>
          </div>
          ${data.skills?.length ? `
          <div class="cv-prof-section">
            <div class="cv-prof-title">Skill</div>
            <div class="cv-prof-skills">
              ${renderSkillBars(data.skills)}
            </div>
          </div>
          ` : ''}
          ${socialLinks.length ? `
          <div class="cv-prof-section">
            <div class="cv-prof-title">Sosial Media</div>
            <div class="cv-prof-social">
              ${socialLinks.join('')}
            </div>
          </div>
          ` : ''}
        </div>
        <div class="cv-prof-main">
          <div class="cv-prof-header">
            <h1 class="cv-prof-name">${escapeHtml(pi.name || 'Nama Anda')}</h1>
          </div>
          ${data.ai_summary ? `
          <div class="cv-prof-main-section">
            <div class="cv-prof-main-title">Profil</div>
            <div class="cv-prof-desc">${escapeHtml(data.ai_summary)}</div>
          </div>
          ` : ''}
          ${data.education?.length ? `
          <div class="cv-prof-main-section">
            <div class="cv-prof-main-title">Riwayat Pendidikan</div>
            ${data.education.map(e => `
              <div class="cv-prof-item">
                <div class="cv-prof-item-left">
                  <div class="cv-prof-degree">${escapeHtml(e.degree)}</div>
                  <div class="cv-prof-year">${escapeHtml(e.year)}</div>
                </div>
                <div class="cv-prof-item-right">
                  <div class="cv-prof-inst">${escapeHtml(e.institution)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          ${data.experience?.length ? `
          <div class="cv-prof-main-section">
            <div class="cv-prof-main-title">Riwayat Pekerjaan</div>
            ${data.experience.map(e => `
              <div class="cv-prof-item">
                <div class="cv-prof-item-right" style="width: 100%">
                  <div class="cv-prof-inst">${escapeHtml(e.position)} | ${escapeHtml(e.company)}</div>
                  <div class="cv-prof-year">${escapeHtml(e.period)}</div>
                  ${e.description ? `<div class="cv-prof-desc">${escapeHtml(e.description)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          ${data.organizations?.length ? `
          <div class="cv-prof-main-section">
            <div class="cv-prof-main-title">Organisasi</div>
            ${data.organizations.map(o => `
              <div class="cv-prof-item">
                <div class="cv-prof-item-right" style="width: 100%">
                  <div class="cv-prof-inst">${escapeHtml(o.position)} | ${escapeHtml(o.name)}</div>
                  <div class="cv-prof-year">${escapeHtml(o.period)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  if (template === 'aesthetic') {
    // Render donut circular bars dynamically for aesthetic template
    const renderAestheticCircles = (skills) => {
      if (!skills || !skills.length) return '';
      return skills.map(s => {
        let lvl = parseInt(s.level);
        if (isNaN(lvl)) lvl = 8;
        if (lvl < 1) lvl = 1;
        if (lvl > 10) lvl = 10;
        const deg = lvl * 10 * 3.6; // convert to degrees
        return `
          <div class="aes-skill-circle-item">
            <div class="aes-donut" style="background: conic-gradient(#b87a7a ${deg}deg, #e8d0d0 0)">
              <div class="aes-donut-inner"></div>
            </div>
            <div class="aes-skill-name">${escapeHtml(s.name)}</div>
          </div>
        `;
      }).join('');
    };

    return `
      <div class="template-aesthetic">
        <div class="aes-header">
          <div class="aes-header-left">
            <h1 class="aes-name">${escapeHtml(pi.name || 'Nama Anda')}</h1>
            ${data.education?.length ? `<div class="aes-subtitle">${escapeHtml(data.education[0].degree)}<br>${escapeHtml(data.education[0].institution)}</div>` : ''}
          </div>
          <div class="aes-header-right">
            <div class="aes-photo-wrapper">
              ${photoHtml}
            </div>
          </div>
        </div>
        
        <div class="aes-body">
          <div class="aes-col-left">
            <div class="aes-section">
              <div class="aes-pill-title">KONTAK</div>
              <div class="aes-contact-list">
                ${pi.phone ? `<div>📞 ${escapeHtml(pi.phone)}</div>` : ''}
                ${pi.email ? `<div>✉ ${escapeHtml(pi.email)}</div>` : ''}
                ${pi.address ? `<div>📍 ${escapeHtml(pi.address)}</div>` : ''}
                ${renderMetaHtml(false)}
              </div>
            </div>
            
            ${data.organizations?.length ? `
            <div class="aes-section">
              <div class="aes-pill-title">ORGANISASI</div>
              <ul class="aes-org-list">
                ${data.organizations.map(o => `<li><strong>${escapeHtml(o.name)}</strong><br>${escapeHtml(o.position)}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${data.skills?.length ? `
            <div class="aes-section">
              <div class="aes-pill-title">SKILLS</div>
              <div class="aes-skills-grid">
                ${renderAestheticCircles(data.skills)}
              </div>
            </div>
            ` : ''}
          </div>
          
          <div class="aes-col-right">
            ${data.ai_summary ? `
            <div class="aes-section">
              <div class="aes-pill-title">TENTANG SAYA</div>
              <div class="aes-text-body">${escapeHtml(data.ai_summary)}</div>
            </div>
            ` : ''}
            
            ${data.education?.length ? `
            <div class="aes-section">
              <div class="aes-pill-title">PENDIDIKAN</div>
              <div class="aes-timeline">
                ${data.education.map(e => `
                  <div class="aes-timeline-item">
                    <div class="aes-timeline-title">${escapeHtml(e.institution)} (${escapeHtml(e.year)})</div>
                    <div class="aes-timeline-subtitle">${escapeHtml(e.degree)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            ${data.experience?.length ? `
            <div class="aes-section">
              <div class="aes-pill-title">PENGALAMAN</div>
              <div class="aes-timeline">
                ${data.experience.map(e => `
                  <div class="aes-timeline-item">
                    <div class="aes-timeline-title">${escapeHtml(e.company)} (${escapeHtml(e.period)})</div>
                    <div class="aes-timeline-subtitle">${escapeHtml(e.position)}</div>
                    ${e.description ? `<div class="aes-text-body" style="margin-top:4px">${escapeHtml(e.description)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Creative template
  return `
    <div class="template-creative">
      <div class="cv-header-creative">
        <div class="header-content">
          ${photoHtml}
          <div class="header-text">
            <div class="cv-name">${escapeHtml(pi.name || 'Nama Anda')}</div>
            <div class="cv-contact-pill">
              ${pi.email ? `<span>✉ ${escapeHtml(pi.email)}</span>` : ''}
              ${pi.phone ? `<span>📞 ${escapeHtml(pi.phone)}</span>` : ''}
              ${pi.address ? `<span>📍 ${escapeHtml(pi.address)}</span>` : ''}
            </div>
            ${renderMetaHtml(true)}
          </div>
        </div>
      </div>
      <div class="cv-body-creative">
        ${data.ai_summary ? `<div class="cv-summary-card">${escapeHtml(data.ai_summary)}</div>` : ''}
        <div class="cv-creative-grid">
          <div class="cv-creative-col">
            ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title"><span class="icon">💼</span> Pengalaman</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-header"><div class="cv-item-title">${escapeHtml(e.company)}</div><div class="cv-item-date">${escapeHtml(e.period)}</div></div><div class="cv-item-subtitle">${escapeHtml(e.position)}</div>${e.description ? `<div class="cv-item-desc">${escapeHtml(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
          </div>
          <div class="cv-creative-col">
            ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title"><span class="icon">🎓</span> Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-header"><div class="cv-item-title">${escapeHtml(e.institution)}</div><div class="cv-item-date">${escapeHtml(e.year)}</div></div><div class="cv-item-subtitle">${escapeHtml(e.degree)}</div></div>`).join('')}</div>` : ''}
            ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title"><span class="icon">⚡</span> Keahlian</div><div class="cv-skills-bar-container" style="padding-top:10px">${renderSkillBars(data.skills)}</div></div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── AI Features ──
async function generateAISummary() {
  const btn = document.getElementById('generateSummaryBtn');
  if (btn) setButtonLoading(btn, 'Generating...');

  try {
    const data = collectFormData();
    const summary = await deepseekAI.generateSummary(data);
    const textarea = document.getElementById('aiSummary');
    if (textarea) textarea.value = summary;
    isDirty = true;
    updateLivePreview();
    showToast('Ringkasan AI berhasil dibuat!', 'success');
  } catch (err) {
    showToast('Gagal generate ringkasan: ' + err.message, 'error');
  }

  if (btn) resetButton(btn);
}

async function suggestSkills() {
  const btn = document.getElementById('suggestSkillsBtn');
  if (btn) setButtonLoading(btn, 'Mencari...');

  try {
    const data = collectFormData();
    const jobTitle = data.experience?.[0]?.position || data.personal_info?.name || 'umum';
    const existing = data.skills.map(s => s.name);
    const suggestions = await deepseekAI.suggestSkills(jobTitle, existing);

    const container = document.getElementById('skillSuggestions');
    if (container && suggestions.length) {
      container.innerHTML = '<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:8px;">Klik untuk menambahkan:</p>' +
        suggestions.map(s => `<span class="skill-chip" onclick="addSkill({name:'${escapeHtml(s)}',level:'Menengah'}); this.remove(); updateLivePreview();">${escapeHtml(s)}</span>`).join('');
      container.classList.remove('hidden');
    }
    showToast(`${suggestions.length} skill disarankan!`, 'success');
  } catch (err) {
    showToast('Gagal mendapat saran skill: ' + err.message, 'error');
  }

  if (btn) resetButton(btn);
}

async function reviewCV() {
  const btn = document.getElementById('reviewCVBtn');
  if (btn) setButtonLoading(btn, 'Mereview...');

  try {
    const data = collectFormData();
    const review = await deepseekAI.reviewCV(data);

    const container = document.getElementById('reviewResults');
    if (container) {
      const scoreClass = review.score >= 80 ? 'score-high' : review.score >= 50 ? 'score-mid' : 'score-low';
      container.innerHTML = `
        <div class="review-results">
          <div class="review-score-circle ${scoreClass}">${review.score}</div>
          <div class="review-section">
            <h4>💪 Kelebihan</h4>
            <ul>${review.strengths.map(s => `<li>✅ ${escapeHtml(s)}</li>`).join('')}</ul>
          </div>
          <div class="review-section">
            <h4>🔧 Perlu Diperbaiki</h4>
            <ul>${review.improvements.map(s => `<li>⚠️ ${escapeHtml(s)}</li>`).join('')}</ul>
          </div>
          <div class="review-section">
            <h4>💡 Saran</h4>
            <ul>${review.suggestions.map(s => `<li>💡 ${escapeHtml(s)}</li>`).join('')}</ul>
          </div>
        </div>
      `;
    }
    showToast('Review CV selesai!', 'success');
  } catch (err) {
    showToast('Gagal mereview CV: ' + err.message, 'error');
  }

  if (btn) resetButton(btn);
}

// ── AI Chat Panel ──
function toggleAIPanel() {
  const panel = document.getElementById('aiPanel');
  if (panel) panel.classList.toggle('open');
}

async function sendAIChat() {
  const input = document.getElementById('aiChatInput');
  const messagesContainer = document.getElementById('aiChatMessages');
  if (!input || !messagesContainer) return;

  const message = input.value.trim();
  if (!message) return;

  // Add user message
  messagesContainer.innerHTML += `<div class="ai-message user">${escapeHtml(message)}</div>`;
  input.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Add typing indicator
  messagesContainer.innerHTML += `<div class="ai-message assistant typing" id="typingIndicator">AI sedang mengetik...</div>`;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Add CV context to first message
    if (aiChatHistory.length === 0) {
      const cvContext = JSON.stringify(collectFormData());
      aiChatHistory.push({
        role: 'user',
        parts: [{ text: `Konteks CV saya saat ini: ${cvContext}\n\nPertanyaan: ${message}` }],
      });
    } else {
      aiChatHistory.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const response = await deepseekAI.chat(message, aiChatHistory);

    // Remove typing indicator
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();

    // Add AI response
    messagesContainer.innerHTML += `<div class="ai-message assistant">${escapeHtml(response)}</div>`;

    aiChatHistory.push({
      role: 'model',
      parts: [{ text: response }],
    });
  } catch (err) {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
    messagesContainer.innerHTML += `<div class="ai-message assistant" style="color:var(--error);">Maaf, terjadi kesalahan. Coba lagi nanti.</div>`;
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── Event Listeners ──
function setupEventListeners() {
  // Profile pic upload
  const picInput = document.getElementById('profilePicInput');
  if (picInput) picInput.addEventListener('change', handleProfilePicUpload);

  // Template selection
  document.querySelectorAll('.template-option').forEach(btn => {
    btn.addEventListener('click', () => selectTemplate(btn.dataset.template));
  });

  // Mark dirty on any input change
  document.addEventListener('input', (e) => {
    if (e.target.closest('.editor-sidebar') || e.target.id === 'cvTitle') {
      isDirty = true;
      updateLivePreview();
    }
  });

  // Auto-capitalize on blur (Title Case)
  document.addEventListener('focusout', (e) => {
    if (e.target && e.target.classList.contains('input-modern')) {
      // Skip email, passwords, chat, summary, and long descriptions
      const skipIds = ['inputEmail', 'aiChatInput', 'aiSummary', 'inputLinkedin', 'inputGithub', 'inputInstagram', 'inputFacebook', 'inputTwitter'];
      if (e.target.type !== 'email' && e.target.type !== 'password' && !skipIds.includes(e.target.id) && !e.target.classList.contains('exp-description')) {
        const val = e.target.value;
        if (val) {
          const capitalized = capitalizeWords(val);
          if (val !== capitalized) {
            e.target.value = capitalized;
            isDirty = true;
            updateLivePreview();
          }
        }
      }
    }
  });

  // AI Chat enter key
  const chatInput = document.getElementById('aiChatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendAIChat();
    });
  }

  // Save on Ctrl+S
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCV();
    }
  });
}

// Make renderCVTemplate globally available for preview page
window.renderCVTemplate = renderCVTemplate;

function adjustPreviewScale() {
  const container = document.getElementById('livePreviewContainer');
  const doc = document.getElementById('cvDocument');
  if (!container || !doc) return;

  // Reset styles to measure original dimensions
  doc.style.transform = 'none';
  container.style.height = 'auto';

  const containerWidth = container.clientWidth;
  if (containerWidth < 800) {
    const scale = containerWidth / 800;
    doc.style.transform = `scale(${scale})`;
    
    // Set height of the parent container to match the visually scaled element height
    const scaledHeight = doc.scrollHeight * scale;
    container.style.height = `${scaledHeight}px`;
    container.style.overflow = 'hidden';
  } else {
    container.style.height = 'auto';
    container.style.overflow = 'visible';
  }
}

window.addEventListener('resize', adjustPreviewScale);
// Also trigger scale adjustment once DOM and fonts are fully loaded
window.addEventListener('load', adjustPreviewScale);
document.fonts.ready.then(adjustPreviewScale);
