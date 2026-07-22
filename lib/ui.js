// lib/ui.js — Helpers de UI: toast, escape, formato

(function () {
  const Toast = {
    show(message, type = 'success') {
      let el = document.getElementById('br-toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'br-toast';
        el.className = 'br-toast';
        document.body.appendChild(el);
      }
      el.textContent = message;
      el.classList.remove('br-toast--success', 'br-toast--error', 'br-toast--show');
      el.classList.add(`br-toast--${type}`);
      // Forzar reflow para reiniciar animación
      void el.offsetWidth;
      el.classList.add('br-toast--show');
      clearTimeout(this._t);
      this._t = setTimeout(() => {
        el.classList.remove('br-toast--show');
      }, 1800);
    }
  };

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickN(arr, n) {
    return shuffle(arr).slice(0, Math.min(n, arr.length));
  }

  // Arma una respuesta a partir de plantilla + palabras
  // Ej: "{verb} {noun}?" + {verb: 'tienes', noun: 'video'} -> "tienes video?"
  function fillTemplate(template, wordBank) {
    const types = ['noun', 'verb', 'adj', 'phrase'];
    return template.replace(/\{(\w+)\}/g, (_, kind) => {
      const candidates = wordBank.filter((w) => w.kind === kind);
      if (candidates.length === 0) return _;
      return candidates[Math.floor(Math.random() * candidates.length)].word;
    });
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback para popup context
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  window.UI = {
    Toast,
    escapeHtml,
    rand,
    shuffle,
    pickN,
    fillTemplate,
    copyToClipboard
  };
})();