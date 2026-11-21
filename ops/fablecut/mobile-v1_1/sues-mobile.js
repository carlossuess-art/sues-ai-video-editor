/* SUES V1.1 isolated mobile navigation. Reuses FableCut panels and actions. */
(() => {
  'use strict';
  const app = document.getElementById('app');
  if (!app || document.getElementById('suesMobileDock')) return;
  const dock = document.createElement('nav');
  dock.id = 'suesMobileDock';
  dock.setAttribute('aria-label', 'Herramientas móviles');
  const entries = [
    ['media', 'Medios', null],
    ['tools', 'Ajustes', 'inspector'],
    ['mixer', 'Mezcla', 'mixer'],
    ['transcript', 'Transcripción', 'transcript'],
    ['close', 'Cerrar', null]
  ];
  for (const [id, label] of entries) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.mobileAction = id;
    btn.textContent = label;
    btn.setAttribute('aria-pressed', 'false');
    dock.appendChild(btn);
  }
  function open(id) {
    if (id === 'close' || app.dataset.mobileAction === id) {
      app.dataset.mobilePanel = '';
      app.dataset.mobileAction = '';
    } else {
      const item = entries.find(x => x[0] === id);
      if (!item) return;
      const side = item[2];
      if (side) document.querySelector('.inspector [data-side="' + side + '"]')?.click();
      app.dataset.mobilePanel = id === 'media' ? 'media' : 'tools';
      app.dataset.mobileAction = id;
    }
    for (const b of dock.querySelectorAll('button'))
      b.setAttribute('aria-pressed', String(b.dataset.mobileAction === app.dataset.mobileAction));
  }
  dock.addEventListener('click', e => {
    const btn = e.target.closest('button[data-mobile-action]');
    if (btn) open(btn.dataset.mobileAction);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && app.dataset.mobilePanel) open('close');
  });
  app.appendChild(dock);
  window.SuesMobileShell = { open };
})();

