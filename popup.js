// popup.js — Lógica principal del popup

(function () {
  'use strict';

  const { Toast, escapeHtml, pickN, fillTemplate, copyToClipboard, rand, shuffle } = window.UI;
  const Store = window.Store;

  // Cantidad de burbujas que se muestran a la vez
  const INITIAL_COUNT = 18;
  const DICE_COUNT = 18;

  // ============= STATE =============
  const state = {
    responses: [],
    words: [],
    shown: [],
    user: null,
    profile: null,
    selectedEmojis: [],
    tempEmojis: [],
    currentCategoryIdx: 0,
    favoriteIds: new Set(),
    activeTab: 'all',                 // 'all' | 'favorites'
    activeCategory: 'all'             // 'all' | 'bio' | 'destacadas' | 'emoji'
  };

  // Definición de categorías con detección por texto
  const CATEGORIES = [
    { id: 'all',        icon: '⊕',  label: 'Todo',       match: () => true },
    { id: 'preguntas',  icon: '❓', label: '?',          match: (r) => /\?\s*$/.test(r.text || '') },
    { id: 'bio',        icon: '🔗', label: 'Bio',        match: (r) => /\bbio\b/i.test(r.text) },
    { id: 'destacadas', icon: '✨', label: 'Dest',       match: (r) => /destacad|highlight/i.test(r.text) },
    { id: 'emoji',      icon: '😀', label: 'Emoji',      match: (r) => isOnlyEmoji(r.text) }
  ];

  function isOnlyEmoji(text) {
    const stripped = String(text || '').replace(/[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\s]/gu, '');
    return stripped.length === 0 && String(text).trim().length > 0;
  }

  // ============= DOM SHORTCUTS =============
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ============= INIT =============
  async function init() {
    const loading = document.getElementById('br-loading');
    const root = document.getElementById('br-root');
    try {
      const session = await Store.getSession();
      // Mostrar root (que ya tenía br-hidden)
      root.classList.remove('br-hidden');
      // Ocultar loading
      if (loading) loading.style.display = 'none';
      if (session?.user) {
        await loadProfileAndData();
        showView('main');
      } else {
        showView('auth');
      }
    } catch (e) {
      console.error('[Init]', e);
      if (loading) loading.style.display = 'none';
      root.classList.remove('br-hidden');
      showView('auth');
    }
  }

  function showView(name) {
    $('#br-auth').classList.toggle('br-hidden', name !== 'auth');
    $('#br-main').classList.toggle('br-hidden', name !== 'main');
  }

  async function loadProfileAndData() {
    const { data: { user } } = await Store.client.auth.getUser();
    state.user = user;
    state.profile = await Store.getProfile();
    renderAvatar();
    await Promise.all([loadResponses(), loadWords(), loadFavorites()]);
    renderCategoryChips();
    resetAndRender();
    setupTabs();
  }

  function renderAvatar() {
    const name = state.profile?.display_name || state.user?.email || '?';
    $('#br-avatar-letter').textContent = name[0].toUpperCase();
    const isAdmin = state.profile?.role === 'admin';
    $('#br-admin-badge').classList.toggle('br-hidden', !isAdmin);
    // Solo admin puede acceder a Configuración (options page)
    const settingsBtn = $('#br-menu-settings');
    if (settingsBtn) settingsBtn.classList.toggle('br-hidden', !isAdmin);
  }

  // ============= DATA =============
  async function loadResponses() {
    state.responses = await Store.listResponses({ limit: 500 });
  }

  async function loadWords() {
    try {
      state.words = await Store.listWords();
    } catch {
      state.words = [];
    }
  }

  async function loadFavorites() {
    try {
      const ids = await Store.listFavoriteIds();
      state.favoriteIds = new Set(ids);
      updateFavCount();
    } catch (e) {
      console.warn('loadFavorites', e);
      state.favoriteIds = new Set();
    }
  }

  function updateFavCount() {
    $('#br-tab-count-fav').textContent = state.favoriteIds.size;
  }

  // ============= RENDER: BURBUJAS =============

  // Plantillas para el dado (sin "¿", cortas y naturales)
  // 70% tienen max 3 palabras, 30% tienen 4-5
  const TEMPLATES_SHORT = [
    '{noun}?',
    '{noun}',
    'Ay {noun}',
    'Ayy {noun}',
    'Mmm {noun}',
    'Hola {noun}',
    '{verb} {noun}?',
    '{noun} {verb}',
    'Ayy {noun} 💕'
  ];

  const TEMPLATES_LONG = [
    'Cuidado que me enamoro',
    'Tú también piensas eso?',
    'En serio me dices eso?',
    'Papi tú si sabes',
    'Tú me gustas más',
    'Mmm mor me tientas',
    'Ayy nene así me dices todo'
  ];

// La modelo REACCIONA al cliente, REDIRIGE a la bio, o PREGUNTA cosas sobre ÉL.
// NUNCA le pregunta al cliente cosas sobre ella misma.
  const FIXED_COQUETO = [
    'Ayy serio mor?',
    '¿De veras?',
    'Mmm mor',
    'Ayy cariño',
    'Ayy amor',
    'Ayy mor',
    'Ayy nene',
    'Ayy rey',
    'Ayy guapo',
    'Hola bb',
    'Hola mor',
    'Hola papi',
    'Hola guapo',
    'Hola cielo',
    'Cariño',
    'Bebe',
    'Mi amor',
    'Corazón',
    'Nene',
    'Aquí estoy',
    'Aquí mor',
    'Yo te espero',
    'Me encantas',
    'Ay porfa',
    'Ajajaja mor',
    'Nene para',
    'En serio?',
    'Mmm mor me tientas',
    'Cuidado que me enamoro',
    'Papi tú si sabes',
    'Tú me gustas más',
    'Me dices cosas mor',
    'En serio me dices eso?'
  ];

  const FIXED_REDIR = [
    'Pasa por mi bio amor',
    'Mira mi bio cariño',
    'Mi bio mor',
    'En mi bio amor',
    'Link en bio',
    'Te espero en bio',
    'Pasa bio papi',
    'Bio actualizada mor',
    'Pasa por mis destacadas amor',
    'Mira las destacadas',
    'Pasa por destacadas cariño',
    'Mis destacadas mor',
    'Bio + destacadas mor',
    'Destacadas papi',
    'Pasa por bio y destacadas'
  ];

  const FIXED_DUDA = [
    'Y tú?',
    'Muéstrame',
    'Dime más',
    'Cuéntame',
    'Cuéntame más',
    'Sigue',
    'Más?',
    'Y si no?',
    'Y tú qué harías?'
  ];

  function generateBatch(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(generateOne());
    }
    return shuffle(out);
  }

  function generateOne() {
    // 20% solo emojis
    if (Math.random() < 0.20) return generateEmojiOnly();

    const r = Math.random();

    // 40% reacciones coquetas (lo más común — reacciona al piropo)
    if (r < 0.40) {
      const text = FIXED_COQUETO[Math.floor(Math.random() * FIXED_COQUETO.length)];
      return { text, emoji: pickEmojis(1 + Math.floor(Math.random() * 2)) };
    }

    // 30% redirecciones a bio/destacadas
    if (r < 0.70) {
      const text = FIXED_REDIR[Math.floor(Math.random() * FIXED_REDIR.length)];
      return { text, emoji: pickEmojis(1 + Math.floor(Math.random() * 2)) };
    }

    // 15% preguntas al cliente (sobre él)
    if (r < 0.85) {
      const text = FIXED_DUDA[Math.floor(Math.random() * FIXED_DUDA.length)];
      return { text, emoji: pickEmojis(1 + Math.floor(Math.random() * 2)) };
    }

    // 15% plantillas con word bank (variedad)
    if (state.words.length > 0) {
      const useLong = Math.random() < 0.30; // 30% largo, 70% corto
      const tpl = useLong
        ? TEMPLATES_LONG[Math.floor(Math.random() * TEMPLATES_LONG.length)]
        : TEMPLATES_SHORT[Math.floor(Math.random() * TEMPLATES_SHORT.length)];
      const text = fillTemplate(tpl, state.words);
      return { text, emoji: pickEmojis(1 + Math.floor(Math.random() * 2)) };
    }

    return { text: 'Hola', emoji: pickEmojis(1) };
  }

  // Genera 1-4 emojis solos (sin texto)
  function generateEmojiOnly() {
    const count = 1 + Math.floor(Math.random() * 4); // 1-4
    let text = '';
    for (let i = 0; i < count; i++) {
      text += pickEmojis(1); // 1 emoji por iteración
    }
    return { text, emoji: null };
  }

  // Devuelve 1 o 2 emojis (sin repetir)
  function pickEmojis(count) {
    const pool = ['💕', '😏', '🥺', '🙈', '😈', '🔥', '👀', '😩', '🥰', '😍', '💋', '✨', '💖', '💯', '🥳', '😘', '🤭', '😻'];
    const used = new Set();
    let result = '';
    while (result.length < count * 2 && used.size < pool.length) {
      const e = pool[Math.floor(Math.random() * pool.length)];
      if (!used.has(e)) {
        used.add(e);
        result += e;
      }
    }
    return result || pool[0];
  }

  function pickRandomEmoji() {
    return pickEmojis(1);
  }

  function resetAndRender() {
    const container = $('#br-bubbles');
    container.innerHTML = '';
    if (state.responses.length === 0 && state.activeTab === 'all') {
      state.shown = [];
      const empty = document.createElement('div');
      empty.className = 'br-empty';
      empty.textContent = 'Tu banco está vacío. Tocá + para agregar respuestas.';
      container.appendChild(empty);
    } else {
      state.shown = pickN(getFilteredPool(), INITIAL_COUNT).map(toItem);
      renderBubbles(state.shown);
    }
    updateCount();
  }

  function updateCount() {
    // No-op: el contador se muestra en los badges de tabs y categorías.
    // Mantenida por compatibilidad con llamadas existentes.
  }

  function toItem(r) {
    return {
      id: r.id,
      text: r.text,
      emoji: r.emoji
    };
  }

  // Devuelve el pool filtrado por tab (Global/Fav) + categoría
  function getFilteredPool() {
    let pool = state.responses;
    if (state.activeTab === 'favorites') {
      pool = pool.filter((r) => state.favoriteIds.has(r.id));
    }
    const cat = CATEGORIES.find((c) => c.id === state.activeCategory);
    if (cat && cat.id !== 'all') {
      pool = pool.filter(cat.match);
    }
    return pool;
  }

  function renderCategoryChips() {
    const row = $('#br-cats-row');
    if (!row) return;
    row.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'br-cat-chip';
      btn.dataset.cat = cat.id;
      btn.innerHTML = `
        <span class="br-cat-icon">${cat.icon}</span>
        <span class="br-cat-label">${cat.label}</span>
      `;
      btn.addEventListener('click', () => setActiveCategory(cat.id));
      row.appendChild(btn);
    });
    setActiveCategory(state.activeCategory);
  }

  function setActiveCategory(catId) {
    state.activeCategory = catId;
    $$('.br-cat-chip').forEach((c) => {
      c.classList.toggle('br-cat-chip--active', c.dataset.cat === catId);
    });
    rerenderCurrentTab();
  }

  function renderBubbles(items) {
    const container = $('#br-bubbles');
    const frag = document.createDocumentFragment();
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'br-bubble';
      btn.style.setProperty('--br-float-dur', `${rand(3.2, 5.8).toFixed(2)}s`);
      btn.style.setProperty('--br-float-delay', `${rand(0, 2.5).toFixed(2)}s`);
      btn.dataset.text = item.text;
      btn.dataset.id = item.id || '';

      const emojiHtml = item.emoji ? `<span class="br-emoji-inline">${escapeHtml(item.emoji)}</span>` : '';

      if (item.id) {
        const isFav = state.favoriteIds.has(item.id);
        const starChar = isFav ? '⭐' : '☆';
        const starCls = isFav ? 'br-bubble__star--active' : '';
        btn.setAttribute('draggable', 'true');
        btn.innerHTML = `
          <span class="br-bubble__text">${escapeHtml(item.text)} ${emojiHtml}</span>
          <button type="button" class="br-bubble__star ${starCls}" data-star aria-label="Favorito">${starChar}</button>
        `;
        const starBtn = btn.querySelector('[data-star]');
        starBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFavorite(item.id, starBtn, btn);
        });
        btn.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', item.id);
          e.dataTransfer.effectAllowed = 'move';
          btn.style.opacity = '0.4';
        });
        btn.addEventListener('dragend', () => {
          btn.style.opacity = '';
        });
      } else {
        btn.innerHTML = `<span class="br-bubble__text">${escapeHtml(item.text)} ${emojiHtml}</span>`;
      }

      btn.addEventListener('click', () => onBubbleClick(btn, item));
      frag.appendChild(btn);
    });
    container.appendChild(frag);
  }

  // ============= FAVORITOS =============

  async function toggleFavorite(responseId, starBtn, bubbleBtn) {
    const isFav = state.favoriteIds.has(responseId);
    try {
      if (isFav) {
        await Store.removeFavorite(responseId);
        state.favoriteIds.delete(responseId);
        if (starBtn) {
          starBtn.textContent = '☆';
          starBtn.classList.remove('br-bubble__star--active');
        }
        Toast.show('Quitado de favoritos');
      } else {
        await Store.addFavorite(responseId);
        state.favoriteIds.add(responseId);
        if (starBtn) {
          starBtn.textContent = '⭐';
          starBtn.classList.add('br-bubble__star--active');
        }
        Toast.show('Agregado a favoritos ⭐');
      }
      updateFavCount();
      // Si estamos en tab Favoritos y estamos quitando, refrescar vista
      if (state.activeTab === 'favorites' && isFav) {
        rerenderCurrentTab();
      }
    } catch (err) {
      Toast.show('Error: ' + (err.message || err), 'error');
    }
  }

  // ============= TABS =============

  function setupTabs() {
    if (state.tabsBound) return;
    state.tabsBound = true;
    $$('.br-tab-btn').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));

      tab.addEventListener('dragover', (e) => {
        const data = e.dataTransfer.types.includes('text/plain');
        if (!data) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        tab.classList.add('br-tab-btn--drop-target');
      });
      tab.addEventListener('dragleave', () => {
        tab.classList.remove('br-tab-btn--drop-target');
      });
      tab.addEventListener('drop', async (e) => {
        e.preventDefault();
        tab.classList.remove('br-tab-btn--drop-target');
        const responseId = e.dataTransfer.getData('text/plain');
        if (!responseId) return;
        const targetTab = tab.dataset.tab;
        const isFav = state.favoriteIds.has(responseId);
        if (targetTab === 'favorites' && !isFav) {
          await Store.addFavorite(responseId);
          state.favoriteIds.add(responseId);
          updateFavCount();
          Toast.show('Agregado a favoritos ⭐');
          rerenderStarForId(responseId, true);
        } else if (targetTab === 'all' && isFav) {
          await Store.removeFavorite(responseId);
          state.favoriteIds.delete(responseId);
          updateFavCount();
          Toast.show('Quitado de favoritos');
          rerenderStarForId(responseId, false);
          if (state.activeTab === 'favorites') rerenderCurrentTab();
        }
      });
    });
    // (no actualizamos count del tab Global - es info random)
  }

  function rerenderStarForId(responseId, isFav) {
    const bubble = document.querySelector(`.br-bubble[data-id="${responseId}"]`);
    if (!bubble) return;
    const star = bubble.querySelector('[data-star]');
    if (!star) return;
    star.textContent = isFav ? '⭐' : '☆';
    star.classList.toggle('br-bubble__star--active', isFav);
  }

  function switchTab(tab) {
    state.activeTab = tab;
    $$('.br-tab-btn').forEach((b) => {
      b.classList.toggle('br-tab-btn--active', b.dataset.tab === tab);
    });
    rerenderCurrentTab();
  }

  function rerenderCurrentTab() {
    const container = $('#br-bubbles');
    container.innerHTML = '';
    const pool = getFilteredPool();
    if (pool.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'br-empty';
      empty.textContent = state.activeTab === 'favorites'
        ? 'Sin favoritos en esta categoría.'
        : 'Sin respuestas en esta categoría.';
      container.appendChild(empty);
    } else {
      state.shown = pickN(pool, INITIAL_COUNT).map(toItem);
      renderBubbles(state.shown);
    }
    updateCount();
  }

  async function onBubbleClick(btn, item) {
    const fullText = item.emoji
      ? `${item.text} ${item.emoji}`
      : item.text;
    const ok = await copyToClipboard(fullText);
    if (!ok) {
      Toast.show('No se pudo copiar', 'error');
      return;
    }
    btn.classList.add('br-bubble--copied');
    Toast.show('¡Copiado! ✓');
    if (item.id) {
      Store.incrementUseCount(item.id).catch(() => {});
    }
    setTimeout(() => btn.classList.remove('br-bubble--copied'), 1400);
  }

  // ============= DADO (50% DB + 50% generadas, guarda las nuevas) =============
  async function onDiceClick() {
    const half = Math.floor(DICE_COUNT / 2);
    const dbCount = DICE_COUNT - half;
    const genCount = half;

    // 1) Tomar del pool (DB)
    const dbSample = state.responses.length > 0
      ? pickN(state.responses, dbCount).map(toItem)
      : [];

    // 2) Generar nuevas
    const generated = [];
    for (let i = 0; i < genCount; i++) {
      generated.push(generateOne());
    }

    // 3) Guardar las generadas primero (necesitamos sus IDs para las estrellas)
    let savedGen = [];
    if (generated.length > 0) {
      try {
        savedGen = await Store.addResponsesBatch(generated);
        state.responses = [...savedGen, ...state.responses].slice(0, 500);
      } catch (err) {
        console.warn('No se pudieron guardar las generadas:', err);
      }
    }

    // 4) Combinar con las guardadas (tienen id)
    const all = shuffle([...dbSample, ...savedGen.map(toItem)]);

    // 5) Render
    const container = $('#br-bubbles');
    container.innerHTML = '';
    state.shown = all;
    renderBubbles(all);
    renderCategoryChips();
    updateCount();
    Toast.show(`🎲 ${generated.length} nuevas guardadas en tu banco`);
  }

  // ============= AUTH FORM =============

  function setupAuth() {
    $$('.br-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.br-tab').forEach((t) => t.classList.remove('br-tab--active'));
        tab.classList.add('br-tab--active');
        const which = tab.dataset.tab;
        $('#br-login').classList.toggle('br-hidden', which !== 'login');
        $('#br-signup').classList.toggle('br-hidden', which !== 'signup');
      });
    });

    $('#br-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = e.target.querySelector('[data-error]');
      errEl.textContent = '';
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Entrando…';
      try {
        await Store.signIn({ email: fd.get('email'), password: fd.get('password') });
        await loadProfileAndData();
        showView('main');
      } catch (err) {
        errEl.textContent = humanError(err);
      } finally {
        btn.disabled = false; btn.textContent = 'Entrar';
      }
    });

    $('#br-signup').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = e.target.querySelector('[data-error]');
      errEl.textContent = '';
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Creando…';
      try {
        await Store.signUp({
          email: fd.get('email'),
          password: fd.get('password'),
          displayName: fd.get('displayName')
        });
        await loadProfileAndData();
        showView('main');
      } catch (err) {
        errEl.textContent = humanError(err);
      } finally {
        btn.disabled = false; btn.textContent = 'Crear cuenta';
      }
    });
  }

  function humanError(err) {
    const m = err?.message || String(err);
    if (m.includes('Invalid login')) return 'Email o contraseña incorrectos';
    if (m.includes('already registered') || m.includes('already been registered')) return 'Ese email ya está registrado';
    if (m.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres';
    if (m.includes('suspendida') || m.includes('suspended')) return 'Tu cuenta está suspendida';
    if (m.includes('Email not confirmed')) return 'Confirmá tu email antes de entrar';
    return m;
  }

  // ============= AVATAR MENU =============
  function setupMenu() {
    const avatar = $('#br-avatar');
    const menu = $('#br-menu');
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('br-hidden');
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== avatar) menu.classList.add('br-hidden');
    });
    menu.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      menu.classList.add('br-hidden');
      if (action === 'settings') {
        chrome.runtime.openOptionsPage();
      } else if (action === 'add') {
        openAddModal();
      } else if (action === 'logout') {
        await Store.signOut();
        state.responses = []; state.words = []; state.user = null; state.profile = null; state.shown = [];
        showView('auth');
      }
    });
  }

  // ============= ADD MODAL =============
  function setupModal() {
    const modal = $('#br-modal');
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.close !== undefined) closeAddModal();
    });
    $('#br-add').addEventListener('click', openAddModal);
    $('#br-add-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = e.target.querySelector('[data-error]');
      errEl.textContent = '';

      const text = (fd.get('text') || '').trim();
      const emojis = state.selectedEmojis.slice(0, 4).join(''); // max 4

      if (!text && !emojis) {
        errEl.textContent = 'Escribí un texto o elegí al menos un emoji';
        return;
      }

      try {
        const finalText = text || emojis;
        const finalEmoji = text ? emojis || null : null;
        const inserted = await Store.addResponse({
          text: finalText,
          emoji: finalEmoji
        });
        state.responses = [inserted, ...state.responses].slice(0, 500);
        // Auto-fav ya se hizo en addResponse, actualizamos state
        state.favoriteIds.add(inserted.id);
        updateFavCount();
        renderCategoryChips();
        Toast.show('Respuesta agregada ⭐');
        closeAddModal();
        const container = $('#br-bubbles');
        container.innerHTML = '';
        state.shown = [toItem(inserted), ...pickN(state.responses.slice(1), INITIAL_COUNT - 1).map(toItem)];
        renderBubbles(state.shown);
        updateCount();
      } catch (err) {
        errEl.textContent = humanError(err);
      }
    });
  }

  function openAddModal() {
    state.selectedEmojis = [];
    renderSelectedEmojis();
    $('#br-modal').classList.remove('br-hidden');
    $('#br-add-form').reset();
    setTimeout(() => $('#br-add-form [name=text]').focus(), 50);
  }

  function closeAddModal() {
    $('#br-modal').classList.add('br-hidden');
    closeEmojiModal();
  }

  // ============= EMOJI PICKER (custom WhatsApp-style) =============

  function setupEmojiPicker() {
    if (!window.EmojiData) {
      console.warn('[Emoji] EmojiData no está disponible');
      $('#br-emoji-toggle').style.display = 'none';
      return;
    }

    // Trigger: click en icono smile dentro del input
    $('#br-emoji-toggle').addEventListener('click', openEmojiModal);

    // Search
    const search = $('#br-emoji-search');
    search.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      $('#br-emoji-search-clear').classList.toggle('br-hidden', q === '');
      renderEmojiGrid(q);
    });

    $('#br-emoji-search-clear').addEventListener('click', () => {
      search.value = '';
      $('#br-emoji-search-clear').classList.add('br-hidden');
      renderEmojiGrid('');
    });

    // Categorías (bottom bar)
    const catWrap = $('#br-emoji-categories');
    window.EmojiData.CATEGORIES.forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'br-emoji-cat';
      btn.dataset.idx = idx;
      btn.title = cat.label;
      btn.textContent = cat.icon;
      btn.addEventListener('click', () => selectCategory(idx));
      catWrap.appendChild(btn);
    });

    // Close handlers
    document.querySelectorAll('[data-emoji-close]').forEach((el) => {
      el.addEventListener('click', closeEmojiModal);
    });

    $('#br-emoji-accept').addEventListener('click', acceptEmojis);

    // ESC cierra
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#br-emoji-modal').classList.contains('br-hidden')) {
        closeEmojiModal();
      }
    });

    state.currentCategoryIdx = 0;
  }

  function selectCategory(idx) {
    state.currentCategoryIdx = idx;
    const search = $('#br-emoji-search');
    search.value = '';
    $('#br-emoji-search-clear').classList.add('br-hidden');
    $$('.br-emoji-cat').forEach((b, i) => {
      b.classList.toggle('br-emoji-cat--active', i === idx);
    });
    renderEmojiGrid('');
  }

  function openEmojiModal() {
    state.tempEmojis = [...state.selectedEmojis];
    renderEmojiCounter();
    selectCategory(state.currentCategoryIdx || 0);
    $('#br-emoji-modal').classList.remove('br-hidden');
  }

  function closeEmojiModal() {
    $('#br-emoji-modal').classList.add('br-hidden');
  }

  function acceptEmojis() {
    state.selectedEmojis = [...state.tempEmojis];
    renderSelectedEmojis();
    closeEmojiModal();
    Toast.show(`${state.selectedEmojis.length} emoji${state.selectedEmojis.length === 1 ? '' : 's'} listo${state.selectedEmojis.length === 1 ? '' : 's'}`);
  }

  function renderEmojiCounter() {
    const n = state.tempEmojis.length;
    const el = $('#br-emoji-counter');
    el.textContent = `${n} seleccionado${n === 1 ? '' : 's'}`;
    el.classList.toggle('br-emoji-counter--has', n > 0);
  }

  function renderEmojiGrid(query) {
    const grid = $('#br-emoji-grid');
    grid.innerHTML = '';

    if (query) {
      // Búsqueda
      const results = window.EmojiData.search(query);
      if (results.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'br-emoji-empty';
        empty.textContent = 'Sin resultados';
        grid.appendChild(empty);
        return;
      }
      renderEmojiSection(grid, `Resultados (${results.length})`, results.map((r) => r.char));
    } else {
      // Categoría actual
      const cats = window.EmojiData.CATEGORIES;
      const cat = cats[state.currentCategoryIdx];
      if (!cat) return;
      const emojis = window.EmojiData.getCategory(cat.id);
      renderEmojiSection(grid, cat.label, emojis);
    }
  }

  function renderEmojiSection(grid, title, emojis) {
    const section = document.createElement('div');
    section.className = 'br-emoji-section';

    const titleEl = document.createElement('div');
    titleEl.className = 'br-emoji-section__title';
    titleEl.textContent = title;
    section.appendChild(titleEl);

    const items = document.createElement('div');
    items.className = 'br-emoji-section__items';
    emojis.forEach((em) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'br-emoji-btn';
      if (state.tempEmojis.includes(em)) {
        btn.classList.add('br-emoji-btn--selected');
      }
      btn.textContent = em;
btn.addEventListener('click', () => {
        const i = state.tempEmojis.indexOf(em);
        if (i >= 0) {
          state.tempEmojis.splice(i, 1);
        } else if (state.tempEmojis.length < 4) {
          state.tempEmojis.push(em);
        } else {
          Toast.show('Máximo 4 emojis por mensaje', 'error');
          return;
        }
        btn.classList.toggle('br-emoji-btn--selected');
        renderEmojiCounter();
      });
      items.appendChild(btn);
    });
    section.appendChild(items);
    grid.appendChild(section);
  }

  function renderSelectedEmojis() {
    const wrap = $('#br-selected-emojis');
    wrap.innerHTML = '';
    if (state.selectedEmojis.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'br-selected-empty';
      empty.textContent = 'Ninguno';
      wrap.appendChild(empty);
      return;
    }
    state.selectedEmojis.forEach((ch, idx) => {
      const chip = document.createElement('span');
      chip.className = 'br-emoji-chip';
      chip.innerHTML = `${ch}<button type="button" data-idx="${idx}" aria-label="Quitar">×</button>`;
      wrap.appendChild(chip);
    });
    wrap.querySelectorAll('button[data-idx]').forEach((b) => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.idx, 10);
        state.selectedEmojis.splice(i, 1);
        renderSelectedEmojis();
      });
    });
  }

  // ============= BOOT =============
  document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    setupMenu();
    setupModal();
    setupEmojiPicker();
    $('#br-dice').addEventListener('click', onDiceClick);
    init();
  });
})();