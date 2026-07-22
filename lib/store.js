// lib/store.js — Cliente Supabase + CRUD de respuestas + auth
// Carga supabase-js (UMD) y expone window.Store

(function () {
  if (!window.supabase) {
    console.error('[Store] Supabase JS no está cargado');
    return;
  }
  if (!window.SUPABASE_CONFIG) {
    console.error('[Store] SUPABASE_CONFIG no está definido');
    return;
  }

  const client = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.chrome?.storage?.local
          ? {
              getItem: (k) => new Promise((resolve) => {
                window.chrome.storage.local.get(k, (v) => resolve(v?.[k] ?? null));
              }),
              setItem: (k, v) => new Promise((resolve) => {
                window.chrome.storage.local.set({ [k]: v }, () => resolve());
              }),
              removeItem: (k) => new Promise((resolve) => {
                window.chrome.storage.local.remove(k, () => resolve());
              })
            }
          : window.localStorage
      }
    }
  );

  // Respuestas semilla — estilo COQUETO para responder a comentarios en reels
// Reset desde cero — MAYORÍA PREGUNTAS, el resto reacciones/redirecciones.
// Reglas: masculino o neutro, sin comercial, sin externos, sin meta-preguntas.
  const SEED_RESPONSES = [
    // ============ PREGUNTAS — al cliente sobre ÉL (cortas, 1-3 palabras) ============
    { text: 'Y tú?', emoji: '👀', category: 'pregunta' },
    { text: '¿De veras?', emoji: '🥺', category: 'pregunta' },
    { text: 'En serio?', emoji: '🥺', category: 'pregunta' },
    { text: 'Muéstrame', emoji: '👀', category: 'pregunta' },
    { text: 'Dime más?', emoji: '💕', category: 'pregunta' },
    { text: 'Más?', emoji: '🥺', category: 'pregunta' },
    { text: 'Y si no?', emoji: '🤔', category: 'pregunta' },
    { text: 'Qué me dices?', emoji: '👀', category: 'pregunta' },
    { text: 'Muéstrame más?', emoji: '👀', category: 'pregunta' },
    { text: 'Te gustó?', emoji: '🥺', category: 'pregunta' },
    { text: 'Quieres más?', emoji: '😏', category: 'pregunta' },
    { text: 'Algo más?', emoji: '😏', category: 'pregunta' },
    { text: 'Vas a volver?', emoji: '🥺', category: 'pregunta' },
    { text: 'Hola mor qué haces?', emoji: '👋', category: 'pregunta' },
    { text: 'Y tú me enseñas?', emoji: '🥺', category: 'pregunta' },
    { text: 'Ayy serio mor?', emoji: '🥺', category: 'pregunta' },
    { text: 'Cuéntame más?', emoji: '🥺💕', category: 'pregunta' },
    { text: 'Y tú qué harías?', emoji: '😏', category: 'pregunta' },
    { text: 'Y tú?', emoji: '👀', category: 'pregunta' },
    { text: '¿De veras?', emoji: '🥺', category: 'pregunta' },
    { text: 'En serio?', emoji: '🥺', category: 'pregunta' },
    { text: 'Muéstrame', emoji: '👀', category: 'pregunta' },
    { text: 'Dime más?', emoji: '💕', category: 'pregunta' },
    { text: 'Más?', emoji: '🥺', category: 'pregunta' },
    { text: 'Y si no?', emoji: '🤔', category: 'pregunta' },
    { text: 'Qué me dices?', emoji: '👀', category: 'pregunta' },
    { text: 'Muéstrame más?', emoji: '👀', category: 'pregunta' },
    { text: 'Te gustó?', emoji: '🥺', category: 'pregunta' },
    { text: 'Quieres más?', emoji: '😏', category: 'pregunta' },
    { text: 'Algo más?', emoji: '😏', category: 'pregunta' },
    { text: 'Vas a volver?', emoji: '🥺', category: 'pregunta' },
    { text: 'Hola mor qué haces?', emoji: '👋', category: 'pregunta' },
    { text: 'Y tú me enseñas?', emoji: '🥺', category: 'pregunta' },
    { text: 'Ayy serio mor?', emoji: '🥺', category: 'pregunta' },
    { text: 'Cuéntame más?', emoji: '🥺💕', category: 'pregunta' },
    { text: 'Y tú qué harías?', emoji: '😏', category: 'pregunta' },

    // ============ REDIRECCIONES — comandos (sin ?, con conectores) ============
    { text: 'Pasa por mi bio amor', emoji: '💕', category: 'redirección' },
    { text: 'Mira mi bio cariño', emoji: '👀', category: 'redirección' },
    { text: 'Mi bio mor', emoji: '🔗', category: 'redirección' },
    { text: 'En mi bio amor', emoji: '😘', category: 'redirección' },
    { text: 'Link en bio', emoji: '🔥', category: 'redirección' },
    { text: 'Te espero en bio', emoji: '❤️', category: 'redirección' },
    { text: 'Pasa bio papi', emoji: '💕', category: 'redirección' },
    { text: 'Bio actualizada mor', emoji: '👀', category: 'redirección' },
    { text: 'Pasa por mis destacadas amor', emoji: '✨', category: 'redirección' },
    { text: 'Mira las destacadas', emoji: '👀', category: 'redirección' },
    { text: 'Pasa por destacadas cariño', emoji: '✨', category: 'redirección' },
    { text: 'Mis destacadas mor', emoji: '⭐', category: 'redirección' },
    { text: 'Bio + destacadas mor', emoji: '🔥', category: 'redirección' },
    { text: 'Destacadas papi', emoji: '💕', category: 'redirección' },
    { text: 'Pasa por bio y destacadas', emoji: '🔥', category: 'redirección' },

    // ============ PREGUNTAS — reacción (sorpresa, coqueto) ============
    { text: '¿Tú también piensas eso?', emoji: '👀', category: 'pregunta' },
    { text: '¿De verdad piensas eso?', emoji: '👀', category: 'pregunta' },
    { text: 'En serio me dices eso?', emoji: '🥺', category: 'pregunta' },
    { text: 'Cuidado que me enamoro?', emoji: '😩', category: 'pregunta' },
    { text: 'Papi tú si sabes?', emoji: '😈', category: 'pregunta' },

    // ============ COQUETO — reacciones sin ? (variedad) ============
    { text: 'Mmm mor', emoji: '😈', category: 'coqueto' },
    { text: 'Ayy cariño', emoji: '🥰💕', category: 'coqueto' },
    { text: 'Ayy amor', emoji: '🥰💕', category: 'coqueto' },
    { text: 'Ayy mor', emoji: '🥰💕', category: 'coqueto' },
    { text: 'Ayy nene', emoji: '🥰', category: 'coqueto' },
    { text: 'Ayy rey', emoji: '😍', category: 'coqueto' },
    { text: 'Hola bb', emoji: '👋', category: 'coqueto' },
    { text: 'Hola mor', emoji: '👋', category: 'coqueto' },
    { text: 'Hola papi', emoji: '👋', category: 'coqueto' },
    { text: 'Hola guapo', emoji: '👋', category: 'coqueto' },
    { text: 'Hola cielo', emoji: '👋', category: 'coqueto' },
    { text: 'Cariño', emoji: '🥰', category: 'coqueto' },
    { text: 'Bebe', emoji: '😏', category: 'coqueto' },
    { text: 'Mi amor', emoji: '🥰', category: 'coqueto' },
    { text: 'Corazón', emoji: '😍', category: 'coqueto' },
    { text: 'Aquí estoy', emoji: '😏', category: 'coqueto' },
    { text: 'Yo te espero', emoji: '💕', category: 'coqueto' },
    { text: 'Me encantas', emoji: '😍', category: 'coqueto' },
    { text: 'Ay porfa', emoji: '🙈', category: 'coqueto' },
    { text: 'Nene para', emoji: '🥰', category: 'coqueto' },
    { text: 'Cuidado que me enamoro', emoji: '😩', category: 'coqueto' },
    { text: 'Mmm mor me tientas', emoji: '😏', category: 'coqueto' },
    { text: 'Me dices cosas mor', emoji: '🥰', category: 'coqueto' },
    { text: 'Ayy nene así me conquistas', emoji: '🥰', category: 'coqueto' },

    // ============ EMOJI-ONLY ============
    { text: '❤️', emoji: null, category: 'coqueto' },
    { text: '🔥', emoji: null, category: 'coqueto' },
    { text: '🥰💕', emoji: null, category: 'coqueto' },
    { text: '😍', emoji: null, category: 'coqueto' },
    { text: '🥺', emoji: null, category: 'coqueto' }
  ];

  // Banco de palabras — SOLO masculino o neutro
  const SEED_WORDS = [
    // Términos (masculinos / neutros)
    { word: 'amor', kind: 'noun' },
    { word: 'mor', kind: 'noun' },
    { word: 'cariño', kind: 'noun' },
    { word: 'bebe', kind: 'noun' },
    { word: 'nene', kind: 'noun' },
    { word: 'papi', kind: 'noun' },
    { word: 'rey', kind: 'noun' },
    { word: 'guapo', kind: 'noun' },
    { word: 'hermoso', kind: 'noun' },
    { word: 'lindo', kind: 'noun' },
    { word: 'corazón', kind: 'noun' },
    { word: 'bb', kind: 'noun' },
    { word: 'cielo', kind: 'noun' },
    // Frases cortas para verb (masculino implícito)
    { word: 'en serio', kind: 'verb' },
    { word: 'de veras', kind: 'verb' },
    { word: 'me halagas', kind: 'verb' },
    { word: 'me tientas', kind: 'verb' },
    { word: 'me quieres', kind: 'verb' },
    { word: 'me amas', kind: 'verb' },
    { word: 'así me conquistas', kind: 'verb' }
  ];

  async function ensureSeed() {
    const { data: existing, error: e1 } = await client
      .from('responses')
      .select('id', { count: 'exact', head: true });
    if (e1) {
      console.error('[Store] ensureSeed responses check failed', e1);
      return;
    }
    if (!existing || (Array.isArray(existing) && existing.length === 0)) {
      // También verificar count real
      const { count, error: e2 } = await client
        .from('responses')
        .select('*', { count: 'exact', head: true });
      if (e2) return;
      if (count && count > 0) return;

      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const rows = SEED_RESPONSES.map((r) => ({ ...r, user_id: user.id }));
      const { error } = await client.from('responses').insert(rows);
      if (error) console.error('[Store] seed responses insert failed', error);
    }

    const { count: wordCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });
    if (wordCount === 0) {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;
      const rows = SEED_WORDS.map((w) => ({ ...w, user_id: user.id }));
      const { error } = await client.from('words').insert(rows);
      if (error) console.error('[Store] seed words insert failed', error);
    }
  }

  // ============= AUTH =============

  async function signUp({ email, password, displayName }) {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] }
      }
    });
    if (error) throw error;
    // Asegurar seed (algunos casos el trigger corre antes que getUser devuelva)
    await ensureSeed();
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Chequear suspensión antes de seguir
    const profile = await getProfile();
    if (profile?.status === 'suspended') {
      await client.auth.signOut();
      throw new Error('Tu cuenta está suspendida. Contactá al administrador.');
    }
    await ensureSeed();
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProfile() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) return null;
    return data;
  }

  async function updateProfile(patch) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { data, error } = await client
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function isAdmin() {
    const profile = await getProfile();
    return profile?.role === 'admin';
  }

  // Solo admin. Borra las respuestas seed y todas las palabras,
  // y re-inserta el banco desde las constantes. NO toca respuestas manuales/IA.
  async function refreshSeed() {
    const profile = await getProfile();
    if (profile?.role !== 'admin') {
      throw new Error('Solo administradores pueden refrescar el banco');
    }
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // 1) Borrar seed viejo
    const { error: e1 } = await client
      .from('responses')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'seed');
    if (e1) throw e1;

    // 2) Limpiar respuestas generadas/dice con términos prohibidos
    // (femenino, precios, plataformas externas, meta-preguntas)
    const forbidden = '\\y(mami|linda|nena|reina|guapa)\\y|\\y(telegram|whatsapp|videollamada)\\y|cu[aá]nto cobras|tienes pack|suscripci[oó]n|haces videos|subes contenido|tienes fotos|haces lives|atiendes|muestras|respondes aqu|';
    const { error: e2, count: cleaned } = await client
      .from('responses')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .or(`text.ilike.%mami%,text.ilike.%linda%,text.ilike.%nena%,text.ilike.%reina%,text.ilike.%guapa%,text.ilike.%telegram%,text.ilike.%whatsapp%,text.ilike.%videollamada%,text.ilike.%cripto%,text.ilike.%transferencia%,text.ilike.%trato%,text.ilike.%pack%,text.ilike.%promo%,text.ilike.%cobras%,text.ilike.%suscripci%,text.ilike.%haces videos%,text.ilike.%subes contenido%,text.ilike.%tienes fotos%,text.ilike.%haces lives%,text.ilike.%atiendes%,text.ilike.%muestras%,text.ilike.%respondes aquí%`);
    if (e2) console.warn('Cleanup warn:', e2);

    // 3) Borrar words
    const { error: e3 } = await client
      .from('words')
      .delete()
      .eq('user_id', user.id);
    if (e3) throw e3;

    // 4) Re-insertar seed limpio
    const responseRows = SEED_RESPONSES.map((r) => ({ ...r, user_id: user.id }));
    const { error: e4 } = await client.from('responses').insert(responseRows);
    if (e4) throw e4;

    const wordRows = SEED_WORDS.map((w) => ({ ...w, user_id: user.id }));
    const { error: e5 } = await client.from('words').insert(wordRows);
    if (e5) throw e5;

    return { responses: responseRows.length, words: wordRows.length, cleaned: cleaned || 0 };
  }

  // ============= RESPONSES =============

  async function listResponses({ limit = 500 } = {}) {
    const { data, error } = await client
      .from('responses')
      .select('*')
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function addResponse({ text, emoji, category, source = 'manual' }) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No autenticado');
    await ensureCapacity();
    const { data, error } = await client
      .from('responses')
      .insert({
        user_id: user.id,
        text: text.trim(),
        emoji: emoji?.trim() || null,
        category: category || null,
        source,
        type: 'full'
      })
      .select()
      .single();
    if (error) throw error;

    // Auto-fav: cuando el user crea manual, queda en sus favoritos
    const { error: favErr } = await client
      .from('favorites')
      .insert({ user_id: user.id, response_id: data.id });
    if (favErr && favErr.code !== '23505') {
      console.warn('[Store] auto-fav failed', favErr);
    }

    return data;
  }

  // Inserta varias respuestas de una. Útil para el dado (genera 9-12 de golpe).
  async function addResponsesBatch(items) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No autenticado');
    if (!items || items.length === 0) return [];
    await ensureCapacity();
    const rows = items
      .map((item) => ({
        user_id: user.id,
        text: String(item.text || '').trim(),
        emoji: item.emoji || null,
        source: 'ai',
        type: 'full'
      }))
      .filter((r) => r.text.length > 0);
    if (rows.length === 0) return [];
    const { data, error } = await client
      .from('responses')
      .insert(rows)
      .select();
    if (error) throw error;
    return data || [];
  }

  // Llama al RPC de Supabase para mantener el límite (15 días / 50k)
  async function ensureCapacity() {
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;
      await client.rpc('cleanup_user_responses', { target_user_id: user.id });
    } catch (e) {
      console.warn('[Store] ensureCapacity failed', e);
    }
  }

  async function deleteResponse(id) {
    const { error } = await client.from('responses').delete().eq('id', id);
    if (error) throw error;
  }

  async function incrementUseCount(id) {
    const { error } = await client.rpc('increment_use_count', { response_id: id });
    if (error) {
      // Fallback: si no existe la RPC, hacer update manual
      const { data: cur } = await client
        .from('responses')
        .select('use_count')
        .eq('id', id)
        .single();
      if (cur) {
        await client
          .from('responses')
          .update({ use_count: (cur.use_count || 0) + 1 })
          .eq('id', id);
      }
    }
  }

  // ============= WORDS =============

  async function listWords() {
    const { data, error } = await client.from('words').select('*');
    if (error) throw error;
    return data || [];
  }

  // ============= ADMIN: USER MANAGEMENT =============

  async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) throw new Error('Solo administradores');
    return true;
  }

  async function listAllUsers() {
    await requireAdmin();
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, email, role, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function setUserRole(targetUserId, newRole) {
    await requireAdmin();
    if (!['admin', 'user'].includes(newRole)) throw new Error('Rol inválido');
    const { data, error } = await client
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function setUserStatus(targetUserId, newStatus) {
    await requireAdmin();
    if (!['active', 'suspended'].includes(newStatus)) throw new Error('Estado inválido');
    const { data, error } = await client
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', targetUserId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ============= FAVORITES =============

  async function listFavoriteIds() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return [];
    const { data, error } = await client
      .from('favorites')
      .select('response_id')
      .eq('user_id', user.id);
    if (error) throw error;
    return (data || []).map((r) => r.response_id);
  }

  async function addFavorite(responseId) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { error } = await client
      .from('favorites')
      .insert({ user_id: user.id, response_id: responseId });
    // 23505 = unique violation (ya era fav), ignorar
    if (error && error.code !== '23505') throw error;
  }

  async function removeFavorite(responseId) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { error } = await client
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('response_id', responseId);
    if (error) throw error;
  }

  // Admin: ver favoritos de cualquier usuario
  async function listUserFavorites(targetUserId) {
    const { data, error } = await client
      .from('favorites')
      .select('response_id, responses(id, text, emoji, created_at)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || [])
      .map((f) => f.responses)
      .filter(Boolean);
  }

  // ============= EXPORT =============
  window.Store = {
    client,
    signUp,
    signIn,
    signOut,
    getSession,
    getProfile,
    updateProfile,
    isAdmin,
    refreshSeed,
    listResponses,
    addResponse,
    addResponsesBatch,
    ensureCapacity,
    deleteResponse,
    incrementUseCount,
    listWords,
    ensureSeed,
    listAllUsers,
    setUserRole,
    setUserStatus,
    requireAdmin,
    listFavoriteIds,
    addFavorite,
    removeFavorite,
    listUserFavorites
  };
})();