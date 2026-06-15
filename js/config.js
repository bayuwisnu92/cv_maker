// ============================================================
// CV Maker — Configuration
// ============================================================
// PENTING: Isi dengan credentials Anda sendiri!
// Supabase: https://supabase.com/dashboard
// DeepSeek: https://platform.deepseek.com/api_keys
// ============================================================

const APP_CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://isyaszjtcwumddjrmpfd.supabase.co',       // contoh: https://xxxxx.supabase.co
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeWFzemp0Y3d1bWRkanJtcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTAzNjcsImV4cCI6MjA5Njc2NjM2N30.9hAMeOnrMJddS2WwRF1JWou0-7oPGfkqgINa7ydzmkM',   // contoh: eyJhbGciOi...

  // DeepSeek AI
  DEEPSEEK_API_KEY: 'sk-7098fd06835f43218188d353245dc2ca',
  DEEPSEEK_MODEL: 'deepseek-chat',
  DEEPSEEK_API_URL: 'https://api.deepseek.com',

  // App Settings
  APP_NAME: 'CV Maker AI',
  AUTO_SAVE_INTERVAL: 30000,  // 30 detik
  MAX_PROFILE_PIC_SIZE: 2 * 1024 * 1024,  // 2MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Template names
  TEMPLATES: ['modern', 'classic', 'minimal', 'elegant', 'creative', 'professional', 'aesthetic'],
};

// Freeze config so it can't be modified at runtime
Object.freeze(APP_CONFIG);
