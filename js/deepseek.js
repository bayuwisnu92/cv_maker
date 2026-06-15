// ============================================================
// CV Maker AI — DeepSeek AI Integration
// ============================================================

const deepseekAI = {
  /**
   * Call the DeepSeek API (OpenAI-compatible format)
   * @param {string} prompt - User prompt
   * @param {string} systemInstruction - System instruction
   * @returns {Promise<string>} Response text
   */
  async callDeepSeek(prompt, systemInstruction = '') {
    const url = `${APP_CONFIG.DEEPSEEK_API_URL}/chat/completions`;

    const messages = [];

    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    messages.push({ role: 'user', content: prompt });

    const body = {
      model: APP_CONFIG.DEEPSEEK_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APP_CONFIG.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Tidak ada respons dari AI');
      return text;
    } catch (err) {
      console.error('DeepSeek API error:', err);
      throw err;
    }
  },

  /**
   * Generate a professional summary for a CV
   * @param {Object} cvData - Full CV data object
   * @returns {Promise<string>} Generated summary
   */
  async generateSummary(cvData) {
    const pi = cvData.personal_info || {};
    const education = (cvData.education || []).map(e => `${e.institution} - ${e.degree}`).join(', ');
    const experience = (cvData.experience || []).map(e => `${e.position} di ${e.company}`).join(', ');
    const skills = (cvData.skills || []).map(s => s.name).join(', ');

    const prompt = `Buatkan ringkasan profesional (professional summary) untuk CV dengan data berikut:

Nama: ${pi.name || 'Tidak disebutkan'}
Pendidikan: ${education || 'Tidak disebutkan'}
Pengalaman Kerja: ${experience || 'Belum ada'}
Keahlian: ${skills || 'Tidak disebutkan'}

Buatkan dalam 2-3 kalimat yang profesional dan menarik dalam Bahasa Indonesia. Jangan gunakan markdown formatting. Langsung tulis ringkasannya saja.`;

    const systemInstruction = 'Kamu adalah asisten AI untuk pembuatan CV profesional dalam Bahasa Indonesia. Berikan jawaban yang singkat, padat, dan profesional. Jangan gunakan format markdown.';

    return await this.callDeepSeek(prompt, systemInstruction);
  },

  /**
   * Improve a text to be more professional
   * @param {string} text - Original text
   * @param {string} context - Context (e.g., 'pengalaman kerja', 'pendidikan')
   * @returns {Promise<string>} Improved text
   */
  async improveText(text, context = '') {
    const prompt = `Perbaiki teks berikut agar lebih profesional dan menarik untuk CV (bagian ${context}):

"${text}"

Berikan versi yang lebih baik dalam Bahasa Indonesia. Jangan gunakan markdown. Langsung tulis hasilnya saja.`;

    const systemInstruction = 'Kamu adalah editor CV profesional. Perbaiki teks agar lebih formal, ringkas, dan impresif. Hanya berikan teks yang sudah diperbaiki tanpa penjelasan tambahan.';

    return await this.callDeepSeek(prompt, systemInstruction);
  },

  /**
   * Suggest skills based on job title
   * @param {string} jobTitle - Job title or field
   * @param {string[]} existingSkills - Array of current skills
   * @returns {Promise<string[]>} Array of suggested skills
   */
  async suggestSkills(jobTitle, existingSkills = []) {
    const existing = existingSkills.length > 0 ? existingSkills.join(', ') : 'belum ada';

    const prompt = `Sarankan 8 skill yang relevan untuk posisi/bidang "${jobTitle}".

Skill yang sudah dimiliki: ${existing}

Berikan hanya daftar skill baru (yang belum dimiliki) dalam format satu skill per baris, tanpa numbering atau bullet. Hanya nama skill saja.`;

    const systemInstruction = 'Berikan saran skill yang relevan dan up-to-date. Jawab hanya dengan daftar nama skill, satu per baris, tanpa penjelasan.';

    const result = await this.callDeepSeek(prompt, systemInstruction);
    return result
      .split('\n')
      .map(s => s.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(s => s.length > 0 && s.length < 50);
  },

  /**
   * Review the entire CV and provide feedback
   * @param {Object} cvData - Full CV data
   * @returns {Promise<Object>} Review result { score, strengths[], improvements[], suggestions[] }
   */
  async reviewCV(cvData) {
    const prompt = `Review CV berikut dan berikan penilaian:

${JSON.stringify(cvData, null, 2)}

Berikan respons dalam format JSON seperti ini (HANYA JSON, tanpa markdown code block):
{
  "score": <angka 0-100>,
  "strengths": ["kelebihan 1", "kelebihan 2", "kelebihan 3"],
  "improvements": ["perbaikan 1", "perbaikan 2", "perbaikan 3"],
  "suggestions": ["saran 1", "saran 2", "saran 3"]
}`;

    const systemInstruction = 'Kamu adalah reviewer CV profesional. Berikan penilaian objektif dalam Bahasa Indonesia. HANYA berikan output JSON valid tanpa markdown formatting atau code block. Pastikan JSON valid.';

    const result = await this.callDeepSeek(prompt, systemInstruction);

    try {
      // Try to extract JSON from the response
      let jsonStr = result.trim();
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse review JSON:', e, result);
      return {
        score: 70,
        strengths: ['CV sudah memiliki struktur dasar yang baik'],
        improvements: ['Tambahkan lebih banyak detail pada pengalaman kerja'],
        suggestions: ['Pertimbangkan untuk menambahkan ringkasan profesional'],
      };
    }
  },

  /**
   * Chat with AI about CV writing
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous messages [{role, parts}]
   * @returns {Promise<string>} AI response
   */
  async chat(message, conversationHistory = []) {
    const url = `${APP_CONFIG.DEEPSEEK_API_URL}/chat/completions`;

    // Convert conversation history from Gemini format to OpenAI format
    const messages = [
      {
        role: 'system',
        content: 'Kamu adalah asisten AI untuk pembuatan CV profesional bernama "CV Maker AI Assistant". Bantu pengguna menulis CV yang baik dalam Bahasa Indonesia. Berikan saran yang praktis dan spesifik. Jawab dengan singkat dan jelas tanpa format markdown yang rumit.',
      },
    ];

    // Convert history: Gemini format {role, parts[{text}]} → OpenAI format {role, content}
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts?.[0]?.text || msg.content || '',
      });
    }

    messages.push({ role: 'user', content: message });

    const body = {
      model: APP_CONFIG.DEEPSEEK_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1024,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APP_CONFIG.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa menjawab saat ini.';
    } catch (err) {
      console.error('DeepSeek chat error:', err);
      throw err;
    }
  },
};
