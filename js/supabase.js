// ============================================================
// CV Maker AI — Supabase Client & Helpers
// ============================================================


// Initialize Supabase client
const supaclient = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);



// ── Auth Helpers ──
const supabaseAuth = {
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supaclient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('SignUp error:', err);
      return { data: null, error: err };
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supaclient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('SignIn error:', err);
      return { data: null, error: err };
    }
  },

  async signOut() {
    try {
      const { error } = await supaclient.auth.signOut();
      if (error) throw error;
      window.location.href = 'index.html';
    } catch (err) {
      console.error('SignOut error:', err);
      showToast('Gagal logout: ' + err.message, 'error');
    }
  },

  async getUser() {
    try {
      const { data: { user }, error } = await supaclient.auth.getUser();
      if (error) throw error;
      return user;
    } catch (err) {
      return null;
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supaclient.auth.getSession();
      if (error) throw error;
      return session;
    } catch (err) {
      return null;
    }
  },

  onAuthStateChange(callback) {
    return supaclient.auth.onAuthStateChange(callback);
  },

  async resetPassword(email) {
    try {
      const { error } = await supaclient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login.html',
      });
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },
};

// ── Database Helpers ──
const supabaseDB = {
  async createCV(userId, data = {}) {
    try {
      const payload = {
        user_id: userId,
        title: data.title || 'CV Saya',
        template: data.template || 'modern',
        personal_info: data.personal_info || {},
        education: data.education || [],
        experience: data.experience || [],
        skills: data.skills || [],
        organizations: data.organizations || [],
        hobbies: data.hobbies || [],
        social_media: data.social_media || {},
        ai_summary: data.ai_summary || '',
        custom_sections: data.custom_sections || [],
        profile_pic_url: data.profile_pic_url || '',
      };

      const { data: result, error } = await supaclient
        .from('cv_data')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      console.error('Create CV error:', err);
      showToast('Gagal membuat CV: ' + err.message, 'error');
      return null;
    }
  },

  async getUserCVs(userId) {
    try {
      const { data, error } = await supaclient
        .from('cv_data')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Get CVs error:', err);
      showToast('Gagal memuat CV: ' + err.message, 'error');
      return [];
    }
  },

  async getCVById(cvId) {
    try {
      const { data, error } = await supaclient
        .from('cv_data')
        .select('*')
        .eq('id', cvId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Get CV error:', err);
      showToast('Gagal memuat CV: ' + err.message, 'error');
      return null;
    }
  },

  async updateCV(cvId, data) {
    try {
      const { data: result, error } = await supaclient
        .from('cv_data')
        .update(data)
        .eq('id', cvId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      console.error('Update CV error:', err);
      showToast('Gagal menyimpan CV: ' + err.message, 'error');
      return null;
    }
  },

  async deleteCV(cvId) {
    try {
      const { error } = await supaclient
        .from('cv_data')
        .delete()
        .eq('id', cvId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Delete CV error:', err);
      showToast('Gagal menghapus CV: ' + err.message, 'error');
      return false;
    }
  },

  async getProfile(userId) {
    try {
      const { data, error } = await supaclient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Get profile error:', err);
      return null;
    }
  },

  async updateProfile(userId, data) {
    try {
      const { data: result, error } = await supaclient
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (err) {
      console.error('Update profile error:', err);
      showToast('Gagal mengupdate profil: ' + err.message, 'error');
      return null;
    }
  },
};

// ── Storage Helpers ──
const supabaseStorage = {
  async uploadProfilePic(userId, file) {
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { data, error } = await supaclient.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supaclient.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Gagal upload gambar: ' + err.message, 'error');
      return null;
    }
  },

  getProfilePicUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supaclient.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },
};

// ── Route Protection ──
async function requireAuth() {
  const user = await supabaseAuth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ── Navbar Updater ──
async function updateNavbar() {
  const user = await supabaseAuth.getUser();
  const guestActions = document.getElementById('guestActions');
  const authActions = document.getElementById('authActions');
  const navDashboard = document.getElementById('navDashboard');
  const navEditor = document.getElementById('navEditor');
  const navUsername = document.getElementById('navUsername');

  if (user) {
    if (guestActions) guestActions.classList.add('hidden');
    if (authActions) authActions.classList.remove('hidden');
    if (navDashboard) navDashboard.classList.remove('hidden');
    if (navEditor) navEditor.classList.remove('hidden');
    if (navUsername) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      navUsername.textContent = name;
    }
  } else {
    if (guestActions) guestActions.classList.remove('hidden');
    if (authActions) authActions.classList.add('hidden');
    if (navDashboard) navDashboard.classList.add('hidden');
    if (navEditor) navEditor.classList.add('hidden');
  }
}

// ── Navbar Scroll Effect ──
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ── Mobile Menu Toggle ──
function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  const navActions = document.getElementById('navActions');
  if (navLinks) navLinks.classList.toggle('open');
  if (navActions) navActions.classList.toggle('open');
}

// ── Logout Handler ──
async function handleLogout() {
  await supabaseAuth.signOut();
}

// Init navbar scroll on all pages
document.addEventListener('DOMContentLoaded', initNavbarScroll);
