// options.js — Página de configuración

(function () {
  'use strict';
  const Store = window.Store;
  const { Toast, escapeHtml } = window.UI;
  const $ = (s) => document.querySelector(s);

  let profile = null;

  async function init() {
    const session = await Store.getSession();
    if (!session?.user) {
      // No autenticado → pedir que abra el popup
      document.body.innerHTML = `
        <div style="padding:40px;text-align:center;font-family:sans-serif;">
          <h2>No estás autenticado</h2>
          <p style="color:#71717a;">Abrí la extensión desde el icono en la barra de Chrome para iniciar sesión.</p>
        </div>`;
      return;
    }

    profile = await Store.getProfile();
    renderHeader();
    await applyAdminVisibility();

    if (profile) {
      $('#opt-profile [name=displayName]').value = profile.display_name || '';
      if (profile.role === 'admin') {
        $('#opt-ai [name=aiProvider]').value = profile.ai_provider || 'minimax';
        $('#opt-ai [name=aiToken]').value = profile.ai_token || '';
        await loadUsers();
        await setupFavoritesViewer();
      }
    }

    bindForms();
  }

  async function loadUsers() {
    const wrap = $('#opt-users');
    try {
      const users = await Store.listAllUsers();
      if (users.length === 0) {
        wrap.innerHTML = '<div class="opt-gen__status">No hay usuarios todavía.</div>';
        return;
      }
      wrap.innerHTML = '';
      const me = (await Store.client.auth.getUser()).data.user;
      users.forEach((u) => {
        wrap.appendChild(renderUserRow(u, u.id === me.id));
      });
    } catch (err) {
      wrap.innerHTML = `<div class="opt-gen__status">❌ ${escapeHtml(err.message || err)}</div>`;
    }
  }

  function renderUserRow(u, isMe) {
    const row = document.createElement('div');
    row.className = 'opt-user-row' + (u.status === 'suspended' ? ' opt-user-row--suspended' : '');
    const name = u.display_name || (u.email ? u.email.split('@')[0] : 'Usuario');
    const roleTag = u.role === 'admin'
      ? '<span class="opt-tag opt-tag--admin">ADMIN</span>'
      : '<span class="opt-tag opt-tag--user">USER</span>';
    const statusTag = u.status === 'suspended'
      ? '<span class="opt-tag opt-tag--suspended">SUSPENDIDO</span>'
      : '<span class="opt-tag opt-tag--active">ACTIVO</span>';
    const created = u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—';

    row.innerHTML = `
      <div class="opt-user-info">
        <span class="opt-user-info__name">${escapeHtml(name)}${isMe ? ' <small style="color:var(--muted);font-weight:400">(vos)</small>' : ''}</span>
        <span class="opt-user-info__meta">${escapeHtml(u.email || 'sin email')} · ${roleTag} · ${statusTag} · ${created}</span>
      </div>
      <div class="opt-user-actions">
        ${u.role === 'admin'
          ? `<button data-act="demote" data-id="${u.id}">↓ Quitar admin</button>`
          : `<button data-act="promote" data-id="${u.id}">↑ Hacer admin</button>`}
        ${u.status === 'suspended'
          ? `<button data-act="activate" data-id="${u.id}">✓ Reactivar</button>`
          : `<button data-act="suspend" data-id="${u.id}" class="opt-act--danger">🚫 Suspender</button>`}
      </div>
    `;

    row.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => onUserAction(b.dataset.act, b.dataset.id));
    });
    return row;
  }

  async function onUserAction(act, userId) {
    const me = (await Store.client.auth.getUser()).data.user;
    const confirmations = {
      promote: '¿Hacer admin a este usuario?',
      demote: '¿Quitar permisos de admin a este usuario?',
      suspend: '¿Suspender a este usuario? No podrá iniciar sesión.',
      activate: '¿Reactivar la cuenta de este usuario?'
    };
    if (!confirm(confirmations[act])) return;
    try {
      if (act === 'promote') await Store.setUserRole(userId, 'admin');
      if (act === 'demote') await Store.setUserRole(userId, 'user');
      if (act === 'suspend') {
        await Store.setUserStatus(userId, 'suspended');
        if (userId === me.id) {
          alert('Te suspendiste a vos mismo. Cerrando sesión…');
          await Store.signOut();
          window.close();
          return;
        }
      }
      if (act === 'activate') await Store.setUserStatus(userId, 'active');
      await loadUsers();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  }

  async function applyAdminVisibility() {
    const isAdmin = await Store.isAdmin();
    if (isAdmin) {
      $('#opt-admin').classList.remove('br-hidden');
    } else {
      // Regular users: solo ven "Cerrar sesión" (es la sección Sesión)
      // Ocultamos todo lo demás
      $('#opt-profile-card').classList.add('br-hidden');
    }
  }

  function renderHeader() {
    const session = Store.client.auth.getSession();
    session.then(({ data }) => {
      const email = data?.session?.user?.email || '';
      const name = profile?.display_name || email.split('@')[0];
      $('#opt-avatar').textContent = name[0].toUpperCase();
      $('#opt-name').textContent = name;
      $('#opt-email').textContent = email;
    });
  }

  function bindForms() {
    // Mostrar/ocultar API key
    document.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const inp = btn.previousElementSibling;
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    });

    // Guardar perfil
    $('#opt-profile').addEventListener('submit', async (e) => {
      e.preventDefault();
      const displayName = e.target.displayName.value.trim();
      const succ = e.target.querySelector('[data-success]');
      try {
        profile = await Store.updateProfile({ display_name: displayName });
        showSuccess(succ);
        renderHeader();
      } catch (err) {
        Toast.show('Error: ' + (err.message || err), 'error');
      }
    });

    // Guardar AI config
    $('#opt-ai').addEventListener('submit', async (e) => {
      e.preventDefault();
      const aiProvider = e.target.aiProvider.value;
      const aiToken = e.target.aiToken.value.trim();
      const succ = e.target.querySelector('[data-success]');
      try {
        profile = await Store.updateProfile({ ai_provider: aiProvider, ai_token: aiToken });
        showSuccess(succ);
      } catch (err) {
        Toast.show('Error: ' + (err.message || err), 'error');
      }
    });

    // Generar con IA
    $('#opt-gen-btn').addEventListener('click', async () => {
      const count = parseInt($('#opt-gen-count').value, 10);
      const status = $('#opt-gen-status');
      const btn = $('#opt-gen-btn');
      if (!profile?.ai_token) {
        status.textContent = '⚠️ Primero guardá tu API key arriba.';
        return;
      }
      btn.disabled = true; btn.textContent = 'Generando…';
      status.textContent = `Llamando a ${profile.ai_provider}...`;
      try {
        const resp = await generateBatch(profile.ai_provider, profile.ai_token, count);
        // Guardar en Supabase
        const { data: { user } } = await Store.client.auth.getUser();
        const rows = resp.map((r) => ({
          user_id: user.id,
          text: r.text,
          emoji: r.emoji || null,
          source: 'ai',
          type: 'full'
        }));
        const { error } = await Store.client.from('responses').insert(rows);
        if (error) throw error;
        status.textContent = `✅ ${resp.length} respuestas generadas y guardadas.`;
        Toast.show(`${resp.length} respuestas agregadas`);
      } catch (err) {
        status.textContent = '❌ ' + (err.message || err);
      } finally {
        btn.disabled = false; btn.textContent = '✨ Generar';
      }
    });

    // Logout
    $('#opt-logout').addEventListener('click', async () => {
      if (!confirm('¿Cerrar sesión?')) return;
      await Store.signOut();
      window.close();
    });

    // Refresh seed (solo admin)
    const refreshBtn = $('#opt-refresh-seed');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        if (!confirm('¿Refrescar el banco de respuestas seed? Tus respuestas manuales NO se borran.')) return;
        const status = $('#opt-refresh-status');
        refreshBtn.disabled = true; refreshBtn.textContent = '⏳ Refrescando…';
        status.textContent = 'Borrando seed anterior...';
        try {
          const res = await Store.refreshSeed();
          status.textContent = `✅ ${res.responses} respuestas + ${res.words} palabras insertadas.`;
        } catch (err) {
          status.textContent = '❌ ' + (err.message || err);
        } finally {
          refreshBtn.disabled = false; refreshBtn.textContent = '♻️ Refrescar banco seed';
        }
      });
    }
  }

  // ============= FAVORITES VIEWER (admin) =============

  async function setupFavoritesViewer() {
    try {
      const users = await Store.listAllUsers();
      const sel = $('#opt-fav-user-select');
      sel.innerHTML = '<option value="">Seleccionar usuario...</option>';
      users.forEach((u) => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.display_name || u.email;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => loadUserFavorites(sel.value));
    } catch (err) {
      console.warn('setupFavoritesViewer', err);
    }
  }

  async function loadUserFavorites(userId) {
    const wrap = $('#opt-fav-list');
    if (!userId) {
      wrap.innerHTML = '<div class="opt-gen__status">Seleccioná un usuario para ver sus favoritos.</div>';
      return;
    }
    wrap.innerHTML = '<div class="opt-gen__status">Cargando...</div>';
    try {
      const favs = await Store.listUserFavorites(userId);
      if (favs.length === 0) {
        wrap.innerHTML = '<div class="opt-gen__status">Este user no tiene favoritos.</div>';
        return;
      }
      wrap.innerHTML = '';
      favs.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'opt-fav-row';
        const emoji = r.emoji ? ` ${escapeHtml(r.emoji)}` : '';
        row.innerHTML = `
          <span class="opt-fav-row__star">⭐</span>
          <span class="opt-fav-row__text">${escapeHtml(r.text)}${emoji}</span>
        `;
        wrap.appendChild(row);
      });
    } catch (err) {
      wrap.innerHTML = `<div class="opt-gen__status">❌ ${escapeHtml(err.message || err)}</div>`;
    }
  }

  function showSuccess(el) {
    el.textContent = '✓ Guardado';
    el.classList.add('opt-success--show');
    setTimeout(() => {
      el.classList.remove('opt-success--show');
      el.textContent = '';
    }, 1800);
  }

  // ============= AI CALL =============
  async function generateBatch(provider, token, count) {
    const systemPrompt = `Sos un asistente que genera respuestas coquetas y seductoras en español. Son respuestas que una modelo escribiría como COMENTARIO en un reel de Instagram, respondiendo a usuarios que la piropean o preguntan cosas. Las respuestas:
- Son cortas (1-5 palabras, mayoría max 3)
- Usan términos cariñosos MASCULINOS o neutros: amor, mor, cariño, bebe, nene, papi, bb, cielo, guapo, hermoso, lindo, corazón
- Son coquetas, seductoras, con doble sentido sutil
- A veces son preguntas (de duda) para que el usuario siga respondiendo
- A veces redirigen a la bio o a las historias destacadas
- Siempre llevan 1 o 2 emojis al final

REGLAS ESTRICTAS:
- NUNCA le preguntes al cliente cosas sobre la modelo (no "subes contenido?", "haces videos?", "tienes fotos?", "atiendes?", "es nuevo?" — ella ya sabe eso de sí misma)
- NUNCA menciones precios, pagos, promos, descuentos, packs, suscripciones
- NUNCA menciones plataformas externas (WhatsApp, Telegram, OnlyFans, etc.)
- NUNCA menciones videollamadas, transferencias, cripto, métodos de pago
- NUNCA ofrezcas "tratos" comerciales ni pidas datos de envío
- NUNCA preguntes por país o envío físico
- Solo cosas que pasan en Instagram (bio, destacadas, replies, lives, fotos, videos)
- Las referencias al usuario son SIEMPRE en masculino (papi, nene, guapo, etc.)

LO QUE SÍ PUEDES HACER:
- Reaccionar a piropos ("Ayy cariño", "Mmm bebe", "Me encantas", "Nene para")
- Redirigir a la bio o a las historias destacadas ("Pasa mi bio", "Mira destacadas")
- Preguntarle cosas AL CLIENTE sobre él ("Y tú?", "Muéstrame", "Dime más", "Cuéntame")

Ejemplos del estilo:
- "En serio amor? 🥺"
- "Ayy cariño 🥰💕"
- "Pasa mi bio mor 🔥"
- "Bio + destacadas 💕"
- "Mira destacadas 👀"
- "Mmm bebe 😈"
- "Cuidado que me enamoro 😩"
- "Tú también piensas eso? 👀"
- "Muéstrame 👀"
- "Haces videos? 🎬"

IMPORTANTE: cuando redirijas, SIEMPRE a la bio o a las historias destacadas. NUNCA digas "DM", "mensaje directo", "escríbeme" ni nada similar.

Generá ${count} respuestas VARIADAS y creativas. NO repitas patrones. Respondé SOLO con JSON válido: un array de objetos {text, emoji}. Sin markdown, sin explicaciones, sin texto fuera del array.`;

    if (provider === 'minimax') {
      const res = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model: 'MiniMax-Text-01',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generá ${count} respuestas.` }
          ],
          temperature: 0.95
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Error MiniMax');
      const content = data.choices?.[0]?.message?.content || '';
      return parseAIResponse(content);
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generá ${count} respuestas.` }
          ],
          temperature: 0.95
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Error OpenAI');
      return parseAIResponse(data.choices?.[0]?.message?.content || '');
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: `Generá ${count} respuestas.` }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Error Anthropic');
      return parseAIResponse(data.content?.[0]?.text || '');
    }

    throw new Error('Proveedor no soportado: ' + provider);
  }

  function parseAIResponse(content) {
    // Limpiar markdown por si la IA lo incluye
    let s = content.trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const match = s.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('La IA no devolvió JSON válido');
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) throw new Error('JSON inválido');
    return arr.map((r) => ({
      text: String(r.text || '').trim(),
      emoji: r.emoji ? String(r.emoji).trim() : null
    })).filter((r) => r.text.length > 0);
  }

  document.addEventListener('DOMContentLoaded', init);
})();