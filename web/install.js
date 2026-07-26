const EXTENSION_ZIP_URL = '/filary-extension.zip';
const DOWNLOADS_API = '/api/downloads';

function formatCount(n) {
  return new Intl.NumberFormat('en').format(n);
}

function setCount(value) {
  const nodes = document.querySelectorAll('[data-download-count]');
  const text = typeof value === 'number' ? formatCount(value) : '—';
  for (const node of nodes) node.textContent = text;
}

function setStatus(text) {
  const nodes = document.querySelectorAll('[data-download-status]');
  for (const node of nodes) node.textContent = text;
}

async function fetchCount() {
  try {
    const res = await fetch(DOWNLOADS_API);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch {
    return null;
  }
}

async function recordDownload() {
  try {
    const res = await fetch(DOWNLOADS_API, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch {
    return null;
  }
}

function triggerZipDownload() {
  const link = document.createElement('a');
  link.href = EXTENSION_ZIP_URL;
  link.download = 'filary-extension.zip';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function shouldAutoDownload() {
  const params = new URLSearchParams(window.location.search);
  return params.has('download') || params.get('dl') === '1';
}

function cleanDownloadQuery() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('download') && url.searchParams.get('dl') !== '1') {
    return;
  }
  url.searchParams.delete('download');
  url.searchParams.delete('dl');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

async function boot() {
  const count = await fetchCount();
  if (count !== null) setCount(count);

  const auto = shouldAutoDownload();
  if (auto) {
    setStatus('Downloading filary-extension.zip…');
    triggerZipDownload();
    cleanDownloadQuery();
    const next = await recordDownload();
    if (next !== null) setCount(next);
    setStatus('Download started — unzip, then follow the steps below.');
  } else {
    setStatus('Zip ready when you are.');
  }

  for (const link of document.querySelectorAll('[data-manual-download]')) {
    link.addEventListener('click', async () => {
      setStatus('Downloading filary-extension.zip…');
      const next = await recordDownload();
      if (next !== null) setCount(next);
      setStatus('Download started — unzip, then follow the steps below.');
    });
  }

  for (const link of document.querySelectorAll('[data-download-cta]')) {
    link.addEventListener('click', (event) => {
      // Full navigation to ?download=1 handles auto-download + counter
      if (link.getAttribute('href')?.includes('download=')) return;
      event.preventDefault();
      window.location.href = '/install?download=1';
    });
  }
}

void boot();
