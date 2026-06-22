// ============================================================
// CV Maker AI — Preview Page
// ============================================================

let currentUser = null;
let cvId = null;
let cvData = null;
let currentTemplate = 'modern';

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  await updateNavbar();
  initNavbarScroll();

  const params = new URLSearchParams(window.location.search);
  cvId = params.get('id');

  if (!cvId) {
    showToast('ID CV tidak ditemukan', 'error');
    window.location.href = 'dashboard.html';
    return;
  }

  const loading = showLoading('Memuat CV...');
  cvData = await supabaseDB.getCVById(cvId);
  hideLoading(loading);

  if (!cvData) {
    showToast('CV tidak ditemukan', 'error');
    window.location.href = 'dashboard.html';
    return;
  }

  currentTemplate = cvData.template || 'modern';
  renderCV();
  setupTemplateButtons();
  setupEditLink();

  if (window.lucide) lucide.createIcons();
});

// ── Render CV ──
function renderCV() {
  const container = document.getElementById('cvDocument');
  if (!container || !cvData) return;

  // Use the renderCVTemplate from editor.js if available, otherwise inline
  if (typeof renderCVTemplate === 'function') {
    container.innerHTML = renderCVTemplate(cvData, currentTemplate);
  } else {
    container.innerHTML = renderPreviewTemplate(cvData, currentTemplate);
  }
  adjustPreviewScale();
}

function renderPreviewTemplate(data, template) {
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
        ${pi.religion ? `<div>Agama: ${esc(pi.religion)}</div>` : ''}
        ${pi.height ? `<div>Tinggi: ${esc(pi.height)} cm</div>` : ''}
        ${pi.weight ? `<div>Berat: ${esc(pi.weight)} kg</div>` : ''}
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
            <span class="cv-skill-bar-name">${esc(s.name)}</span>
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
            ${pi.email ? `<div class="cv-contact-item"><span class="contact-icon">✉</span> ${esc(pi.email)}</div>` : ''}
            ${pi.phone ? `<div class="cv-contact-item"><span class="contact-icon">📞</span> ${esc(pi.phone)}</div>` : ''}
            ${pi.address ? `<div class="cv-contact-item"><span class="contact-icon">📍</span> ${esc(pi.address)}</div>` : ''}
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
              ${sm.linkedin ? `<div class="cv-social-item">🔗 ${esc(sm.linkedin)}</div>` : ''}
              ${sm.github ? `<div class="cv-social-item">💻 ${esc(sm.github)}</div>` : ''}
              ${sm.instagram ? `<div class="cv-social-item">📷 ${esc(sm.instagram)}</div>` : ''}
              ${sm.twitter ? `<div class="cv-social-item">🐦 ${esc(sm.twitter)}</div>` : ''}
              ${sm.facebook ? `<div class="cv-social-item">📘 ${esc(sm.facebook)}</div>` : ''}
            </div>
          ` : ''}
          ${data.hobbies?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Hobi</div>
              ${data.hobbies.map(h => `<div class="cv-hobby-item">• ${esc(typeof h === 'string' ? h : h.name || '')}</div>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="cv-main">
          <div class="cv-name">${esc(pi.name || 'Nama Anda')}</div>
          ${data.ai_summary ? `<div class="cv-summary">${esc(data.ai_summary)}</div>` : ''}
          ${data.education?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Pendidikan</div>
              ${data.education.map(e => `
                <div class="cv-item">
                  <div class="cv-item-title">${esc(e.institution)}</div>
                  <div class="cv-item-subtitle">${esc(e.degree)}</div>
                  <div class="cv-item-date">${esc(e.year)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${data.experience?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Pengalaman Kerja</div>
              ${data.experience.map(e => `
                <div class="cv-item">
                  <div class="cv-item-title">${esc(e.company)}</div>
                  <div class="cv-item-subtitle">${esc(e.position)}</div>
                  <div class="cv-item-date">${esc(e.period)}</div>
                  ${e.description ? `<div class="cv-item-desc">${esc(e.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${data.organizations?.length ? `
            <div class="cv-section">
              <div class="cv-section-title">Organisasi</div>
              ${data.organizations.map(o => `
                <div class="cv-item">
                  <div class="cv-item-title">${esc(o.name)}</div>
                  <div class="cv-item-subtitle">${esc(o.position)}</div>
                  <div class="cv-item-date">${esc(o.period)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  if (template === 'classic') {
    return `
      <div class="template-classic">
        <div class="cv-header-classic">
          ${photoHtml}
          <div class="cv-name">${esc(pi.name || 'Nama Anda')}</div>
          <div class="cv-contact-line">
            ${pi.email ? `<span>${esc(pi.email)}</span>` : ''}
            ${pi.email && pi.phone ? '<span class="sep">|</span>' : ''}
            ${pi.phone ? `<span>${esc(pi.phone)}</span>` : ''}
            ${pi.phone && pi.address ? '<span class="sep">|</span>' : ''}
            ${pi.address ? `<span>${esc(pi.address)}</span>` : ''}
          </div>
          ${renderMetaHtml(false)}
          ${data.ai_summary ? `<div class="cv-summary">${esc(data.ai_summary)}</div>` : ''}
        </div>
        ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title">Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${esc(e.institution)}</span><span class="cv-item-date">${esc(e.year)}</span></div><div class="cv-item-subtitle">${esc(e.degree)}</div></div>`).join('')}</div>` : ''}
        ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title">Pengalaman Kerja</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${esc(e.company)} - ${esc(e.position)}</span><span class="cv-item-date">${esc(e.period)}</span></div>${e.description ? `<div class="cv-item-desc">${esc(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
        ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-classic">${renderSkillBars(data.skills)}</div></div>` : ''}
        ${data.organizations?.length ? `<div class="cv-section"><div class="cv-section-title">Organisasi</div>${data.organizations.map(o => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${esc(o.name)} - ${esc(o.position)}</span><span class="cv-item-date">${esc(o.period)}</span></div></div>`).join('')}</div>` : ''}
        ${data.hobbies?.length ? `<div class="cv-section"><div class="cv-section-title">Hobi</div><div class="cv-hobbies-classic">${data.hobbies.join(', ')}</div></div>` : ''}
      </div>
    `;
  }

  if (template === 'minimal') {
    return `
      <div class="template-minimal">
        <div class="cv-header-minimal">
          <div class="cv-name">${esc(pi.name || 'Nama Anda')}</div>
          <div class="cv-contact-minimal">
            ${pi.email ? `<span>✉ ${esc(pi.email)}</span>` : ''}
            ${pi.phone ? `<span>📞 ${esc(pi.phone)}</span>` : ''}
            ${pi.address ? `<span>📍 ${esc(pi.address)}</span>` : ''}
          </div>
          ${renderMetaHtml(false)}
        </div>
        ${data.ai_summary ? `<div class="cv-summary">${esc(data.ai_summary)}</div>` : ''}
        ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title">Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-title">${esc(e.institution)}</div><div class="cv-item-meta">${esc(e.degree)} • ${esc(e.year)}</div></div>`).join('')}</div>` : ''}
        ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title">Pengalaman Kerja</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-title">${esc(e.company)}</div><div class="cv-item-meta">${esc(e.position)} • ${esc(e.period)}</div>${e.description ? `<div class="cv-item-desc">${esc(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
        ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-minimal">${renderSkillBars(data.skills)}</div></div>` : ''}
        ${data.organizations?.length ? `<div class="cv-section"><div class="cv-section-title">Organisasi</div>${data.organizations.map(o => `<div class="cv-item"><div class="cv-item-title">${esc(o.name)}</div><div class="cv-item-meta">${esc(o.position)} • ${esc(o.period)}</div></div>`).join('')}</div>` : ''}
      </div>
    `;
  }

  if (template === 'elegant') {
    return `
      <div class="template-elegant">
        <div class="cv-elegant-main">
          <div class="cv-header-elegant">
            <div class="cv-name">${esc(pi.name || 'Nama Anda')}</div>
            <div class="cv-contact-line">
              ${pi.email ? `<span>${esc(pi.email)}</span>` : ''}
              ${pi.phone ? `<span>•</span><span>${esc(pi.phone)}</span>` : ''}
              ${pi.address ? `<span>•</span><span>${esc(pi.address)}</span>` : ''}
            </div>
            ${renderMetaHtml(false)}
          </div>
          ${data.ai_summary ? `<div class="cv-summary">${esc(data.ai_summary)}</div>` : ''}
          ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title">Pengalaman Profesional</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${esc(e.position)}</span><span class="cv-item-date">${esc(e.period)}</span></div><div class="cv-item-subtitle">${esc(e.company)}</div>${e.description ? `<div class="cv-item-desc">${esc(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
          ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title">Riwayat Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">${esc(e.degree)}</span><span class="cv-item-date">${esc(e.year)}</span></div><div class="cv-item-subtitle">${esc(e.institution)}</div></div>`).join('')}</div>` : ''}
        </div>
        <div class="cv-elegant-sidebar">
          ${photoHtml}
          ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title">Keahlian</div><div class="cv-skills-list">${renderSkillBars(data.skills)}</div></div>` : ''}
          ${data.organizations?.length ? `<div class="cv-section"><div class="cv-section-title">Organisasi</div>${data.organizations.map(o => `<div class="cv-item"><div class="cv-item-title">${esc(o.position)}</div><div class="cv-item-subtitle">${esc(o.name)}</div><div class="cv-item-date">${esc(o.period)}</div></div>`).join('')}</div>` : ''}
        </div>
      </div>
    `;
  }

  if (template === 'professional') {
    const socialLinks = [];
    if (data.social_media) {
      if (data.social_media.linkedin) socialLinks.push(`<div>LinkedIn: ${esc(data.social_media.linkedin)}</div>`);
      if (data.social_media.github) socialLinks.push(`<div>Github: ${esc(data.social_media.github)}</div>`);
      if (data.social_media.instagram) socialLinks.push(`<div>Instagram: ${esc(data.social_media.instagram)}</div>`);
      if (data.social_media.twitter) socialLinks.push(`<div>Twitter: ${esc(data.social_media.twitter)}</div>`);
      if (data.social_media.facebook) socialLinks.push(`<div>Facebook: ${esc(data.social_media.facebook)}</div>`);
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
              ${pi.phone ? `<div>📞 ${esc(pi.phone)}</div>` : ''}
              ${pi.email ? `<div>✉ ${esc(pi.email)}</div>` : ''}
              ${pi.address ? `<div>📍 ${esc(pi.address)}</div>` : ''}
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
            <h1 class="cv-prof-name">${esc(pi.name || 'Nama Anda')}</h1>
          </div>
          ${data.ai_summary ? `
          <div class="cv-prof-main-section">
            <div class="cv-prof-main-title">Profil</div>
            <div class="cv-prof-desc">${esc(data.ai_summary)}</div>
          </div>
          ` : ''}
          ${data.education?.length ? `
          <div class="cv-prof-main-section">
            <div class="cv-prof-main-title">Riwayat Pendidikan</div>
            ${data.education.map(e => `
              <div class="cv-prof-item">
                <div class="cv-prof-item-left">
                  <div class="cv-prof-degree">${esc(e.degree)}</div>
                  <div class="cv-prof-year">${esc(e.year)}</div>
                </div>
                <div class="cv-prof-item-right">
                  <div class="cv-prof-inst">${esc(e.institution)}</div>
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
                  <div class="cv-prof-inst">${esc(e.position)} | ${esc(e.company)}</div>
                  <div class="cv-prof-year">${esc(e.period)}</div>
                  ${e.description ? `<div class="cv-prof-desc">${esc(e.description)}</div>` : ''}
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
                  <div class="cv-prof-inst">${esc(o.position)} | ${esc(o.name)}</div>
                  <div class="cv-prof-year">${esc(o.period)}</div>
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
            <div class="aes-skill-name">${esc(s.name)}</div>
          </div>
        `;
      }).join('');
    };

    return `
      <div class="template-aesthetic">
        <div class="aes-header">
          <div class="aes-header-left">
            <h1 class="aes-name">${esc(pi.name || 'Nama Anda')}</h1>
            ${data.education?.length ? `<div class="aes-subtitle">${esc(data.education[0].degree)}<br>${esc(data.education[0].institution)}</div>` : ''}
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
                ${pi.phone ? `<div>📞 ${esc(pi.phone)}</div>` : ''}
                ${pi.email ? `<div>✉ ${esc(pi.email)}</div>` : ''}
                ${pi.address ? `<div>📍 ${esc(pi.address)}</div>` : ''}
                ${renderMetaHtml(false)}
              </div>
            </div>
            
            ${data.organizations?.length ? `
            <div class="aes-section">
              <div class="aes-pill-title">ORGANISASI</div>
              <ul class="aes-org-list">
                ${data.organizations.map(o => `<li><strong>${esc(o.name)}</strong><br>${esc(o.position)}</li>`).join('')}
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
              <div class="aes-text-body">${esc(data.ai_summary)}</div>
            </div>
            ` : ''}
            
            ${data.education?.length ? `
            <div class="aes-section">
              <div class="aes-pill-title">PENDIDIKAN</div>
              <div class="aes-timeline">
                ${data.education.map(e => `
                  <div class="aes-timeline-item">
                    <div class="aes-timeline-title">${esc(e.institution)} (${esc(e.year)})</div>
                    <div class="aes-timeline-subtitle">${esc(e.degree)}</div>
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
                    <div class="aes-timeline-title">${esc(e.company)} (${esc(e.period)})</div>
                    <div class="aes-timeline-subtitle">${esc(e.position)}</div>
                    ${e.description ? `<div class="aes-text-body" style="margin-top:4px">${esc(e.description)}</div>` : ''}
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
            <div class="cv-name">${esc(pi.name || 'Nama Anda')}</div>
            <div class="cv-contact-pill">
              ${pi.email ? `<span>✉ ${esc(pi.email)}</span>` : ''}
              ${pi.phone ? `<span>📞 ${esc(pi.phone)}</span>` : ''}
              ${pi.address ? `<span>📍 ${esc(pi.address)}</span>` : ''}
            </div>
            ${renderMetaHtml(true)}
          </div>
        </div>
      </div>
      <div class="cv-body-creative">
        ${data.ai_summary ? `<div class="cv-summary-card">${esc(data.ai_summary)}</div>` : ''}
        <div class="cv-creative-grid">
          <div class="cv-creative-col">
            ${data.experience?.length ? `<div class="cv-section"><div class="cv-section-title"><span class="icon">💼</span> Pengalaman</div>${data.experience.map(e => `<div class="cv-item"><div class="cv-item-header"><div class="cv-item-title">${esc(e.company)}</div><div class="cv-item-date">${esc(e.period)}</div></div><div class="cv-item-subtitle">${esc(e.position)}</div>${e.description ? `<div class="cv-item-desc">${esc(e.description)}</div>` : ''}</div>`).join('')}</div>` : ''}
          </div>
          <div class="cv-creative-col">
            ${data.education?.length ? `<div class="cv-section"><div class="cv-section-title"><span class="icon">🎓</span> Pendidikan</div>${data.education.map(e => `<div class="cv-item"><div class="cv-item-header"><div class="cv-item-title">${esc(e.institution)}</div><div class="cv-item-date">${esc(e.year)}</div></div><div class="cv-item-subtitle">${esc(e.degree)}</div></div>`).join('')}</div>` : ''}
            ${data.skills?.length ? `<div class="cv-section"><div class="cv-section-title"><span class="icon">⚡</span> Keahlian</div><div class="cv-skills-bar-container" style="padding-top:10px">${renderSkillBars(data.skills)}</div></div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── Template Switcher ──
function setupTemplateButtons() {
  const selectMobile = document.getElementById('templateSelectMobile');
  if (selectMobile) {
    selectMobile.value = currentTemplate;
    selectMobile.addEventListener('change', (e) => {
      currentTemplate = e.target.value;
      document.querySelectorAll('.tpl-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.template === currentTemplate);
      });
      supabaseDB.updateCV(cvId, { template: currentTemplate });
      renderCV();
    });
  }

  document.querySelectorAll('.tpl-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.template === currentTemplate);
    btn.addEventListener('click', () => {
      currentTemplate = btn.dataset.template;
      document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (selectMobile) selectMobile.value = currentTemplate;

      // Save template preference
      supabaseDB.updateCV(cvId, { template: currentTemplate });
      renderCV();
    });
  });
}

// ── Edit Link ──
function setupEditLink() {
  const editLink = document.getElementById('editLink');
  if (editLink) editLink.href = `editor.html?id=${cvId}`;
}

// ── AI Review ──
async function aiReviewCV() {
  const btn = document.getElementById('aiReviewBtn');
  if (btn) setButtonLoading(btn, 'Mereview...');

  try {
    const review = await deepseekAI.reviewCV(cvData);
    const panel = document.getElementById('aiReviewPanel');
    const scoreEl = document.getElementById('reviewScore');
    const strengthsEl = document.getElementById('reviewStrengths');
    const improvementsEl = document.getElementById('reviewImprovements');

    if (scoreEl) {
      const cls = review.score >= 80 ? 'score-high' : review.score >= 50 ? 'score-mid' : 'score-low';
      scoreEl.className = `review-score-circle ${cls}`;
      scoreEl.textContent = review.score;
    }

    if (strengthsEl) {
      strengthsEl.innerHTML = review.strengths.map(s => `<li>✅ ${esc(s)}</li>`).join('');
    }

    if (improvementsEl) {
      const items = [...(review.improvements || []), ...(review.suggestions || [])];
      improvementsEl.innerHTML = items.map(s => `<li>💡 ${esc(s)}</li>`).join('');
    }

    if (panel) panel.classList.add('open');
    showToast('Review AI selesai!', 'success');
  } catch (err) {
    showToast('Gagal mereview: ' + err.message, 'error');
  }

  if (btn) resetButton(btn);
}

function closeReviewPanel() {
  const panel = document.getElementById('aiReviewPanel');
  if (panel) panel.classList.remove('open');
}

// ── Export Functions ──
async function saveAsImage() {
  const cvDoc = document.getElementById('cvDocument');
  if (!cvDoc) return;

  const loading = showLoading('Membuat gambar...');

  try {
    const canvas = await html2canvas(cvDoc, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024
    });

    const link = document.createElement('a');
    const name = cvData?.personal_info?.name || 'CV';
    link.download = `${name}_CV.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('CV berhasil disimpan sebagai gambar!', 'success');
  } catch (err) {
    console.error('Save as image error:', err);
    showToast('Gagal menyimpan gambar: ' + err.message, 'error');
  }

  hideLoading(loading);
}

async function saveAsPDF() {
  const cvDoc = document.getElementById('cvDocument');
  if (!cvDoc) return;

  const loading = showLoading('Membuat PDF...');

  try {
    const canvas = await html2canvas(cvDoc, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const name = cvData?.personal_info?.name || 'CV';
    pdf.save(`${name}_CV.pdf`);

    showToast('CV berhasil disimpan sebagai PDF!', 'success');
  } catch (err) {
    console.error('Save as PDF error:', err);
    showToast('Gagal menyimpan PDF: ' + err.message, 'error');
  }

  hideLoading(loading);
}

function adjustPreviewScale() {
  const container = document.querySelector('.preview-container');
  const doc = document.getElementById('cvDocument');
  if (!container || !doc) return;

  // Reset styles to measure original dimensions
  doc.style.transform = 'none';
  doc.style.width = '800px';
  doc.style.minWidth = '800px';
  doc.style.maxWidth = '800px';
  container.style.height = 'auto';

  const containerWidth = container.clientWidth;
  if (containerWidth < 800) {
    const scale = containerWidth / 800;
    doc.style.transform = `scale(${scale})`;
    doc.style.transformOrigin = 'top center';
    
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
window.addEventListener('load', adjustPreviewScale);
document.fonts.ready.then(adjustPreviewScale);
