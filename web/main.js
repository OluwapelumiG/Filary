/** Packaged extension for manual install (Load unpacked). */
const EXTENSION_ZIP_URL = '/filary-extension.zip';

/**
 * Optional: when the Chrome Web Store listing is live, set this and
 * the primary CTA can switch to the store. Until then we ship the zip.
 * Example: 'https://chromewebstore.google.com/detail/filary/xxxxxxxx'
 */
const CHROME_STORE_URL = '';

const samples = {
  name: ['Adebola Okonkwo', 'Chiamaka Eze', 'Tunde Balogun', 'Funke Adeyemi'],
  email: [
    'adebola.okonkwo@gmail.com',
    'chiamaka.eze@yahoo.com',
    'tunde.balogun@outlook.com',
    'funke.adeyemi@gmail.com',
  ],
  phone: [
    '+234 803 441 2291',
    '+234 701 882 3045',
    '+234 908 115 6670',
    '+234 812 334 9081',
  ],
  city: ['Ikeja', 'Enugu', 'Ibadan', 'Port Harcourt'],
  state: ['Lagos', 'Enugu', 'Oyo', 'Rivers'],
  country: ['Nigeria', 'Nigeria', 'Nigeria', 'Nigeria'],
};

const localeSets = [
  {
    tag: 'en-NG',
    name: 'Nigeria · English',
    fields: {
      name: 'Adebola Okonkwo',
      phone: '+234 803 441 2291',
      city: 'Ikeja',
      state: 'Lagos',
    },
  },
  {
    tag: 'en-NG',
    name: 'Nigeria · English',
    fields: {
      name: 'Chiamaka Eze',
      phone: '+234 701 882 3045',
      city: 'Enugu',
      state: 'Enugu',
    },
  },
  {
    tag: 'en-NG',
    name: 'Nigeria · English',
    fields: {
      name: 'Tunde Balogun',
      phone: '+234 908 115 6670',
      city: 'Ibadan',
      state: 'Oyo',
    },
  },
];

function wireChromeLinks() {
  const links = document.querySelectorAll('[data-chrome-store]');
  const storeUrl = CHROME_STORE_URL?.trim();

  for (const link of links) {
    link.classList.remove('is-soon');

    if (storeUrl) {
      link.href = storeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.removeAttribute('download');
      const status = link.querySelector('[data-chrome-status]');
      if (status) status.textContent = 'Free · Chrome Web Store';
      continue;
    }

    // Manual install: download zip → Load unpacked
    link.href = EXTENSION_ZIP_URL;
    link.setAttribute('download', 'filary-extension.zip');
    link.removeAttribute('target');
    const status = link.querySelector('[data-chrome-status]');
    if (status) status.textContent = 'Zip · Load unpacked';
    const label = link.querySelector('.cta-label');
    if (label && link.classList.contains('cta')) {
      label.textContent = 'Download extension';
    }
  }

  const nav = document.getElementById('nav-chrome');
  if (nav && !storeUrl) {
    nav.textContent = 'Download';
  }
}

function typeInto(el, text) {
  return new Promise((resolve) => {
    el.textContent = '';
    el.classList.add('is-typing');
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) {
        window.setTimeout(tick, 28 + Math.random() * 36);
      } else {
        el.classList.remove('is-typing');
        resolve();
      }
    };
    tick();
  });
}

async function cycleFields() {
  const fields = [...document.querySelectorAll('.field[data-type]')];
  if (!fields.length) return;

  let round = 0;
  for (;;) {
    for (const field of fields) {
      const key = field.dataset.type;
      const list = samples[key];
      if (!list?.length) continue;
      const value = list[round % list.length];
      await typeInto(field, value);
      await new Promise((r) => window.setTimeout(r, 200));
    }
    round += 1;
    await new Promise((r) => window.setTimeout(r, 1500));
  }
}

function cycleLocaleStage() {
  const tagEl = document.querySelector('[data-locale-tag]');
  const nameEl = document.querySelector('[data-locale-name]');
  const fieldEls = [...document.querySelectorAll('[data-locale-field]')];
  if (!tagEl || !nameEl || !fieldEls.length) return;

  let index = 0;
  const apply = () => {
    const set = localeSets[index % localeSets.length];
    tagEl.textContent = set.tag;
    nameEl.textContent = set.name;
    for (const el of fieldEls) {
      const key = el.dataset.localeField;
      const next = set.fields[key];
      if (!next) continue;
      el.classList.remove('is-swap');
      void el.offsetWidth;
      el.textContent = next;
      el.classList.add('is-swap');
    }
    index += 1;
  };

  apply();
  window.setInterval(apply, 3200);
}

function observeReveals() {
  const nodes = document.querySelectorAll('.reveal');
  if (!nodes.length) return;

  if (!('IntersectionObserver' in window)) {
    for (const node of nodes) node.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  for (const node of nodes) observer.observe(node);
}

wireChromeLinks();
observeReveals();

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  void cycleFields();
  cycleLocaleStage();
}
