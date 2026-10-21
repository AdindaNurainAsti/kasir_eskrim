// Kasir Es Krim - halaman pesan untuk pelanggan
// ===== Data: dari Firebase (mode online) atau dari isi QR (mode WhatsApp) =====
const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const DB = (q.get('db') || '').replace(/\/+$/, ''),
  KEY = q.get('k') || '';
const api = (p) => `${DB}/${KEY}/${p}.json`;
const MASCOT =
  '<svg class="mascot" viewBox="0 0 120 150"><path d="M30 78h60L60 142z" fill="#f0c27b"/><path d="M42 94l24 36M54 88l24 36M74 90L52 124" stroke="#d9a255" stroke-width="3" stroke-linecap="round"/><path d="M26 80c-6-30 12-52 34-52s40 22 34 52c-6 8-14 4-18 10-4-6-10 6-16 0-6 6-12-6-16 0-4-6-12-2-18-10z" fill="#ec5b8a"/><circle cx="48" cy="58" r="5" fill="#23302a"/><circle cx="72" cy="58" r="5" fill="#23302a"/><circle cx="50" cy="56" r="1.8" fill="#fff"/><circle cx="74" cy="56" r="1.8" fill="#fff"/><path d="M52 70q8 8 16 0" stroke="#23302a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="40" cy="68" r="5" fill="#ff9db9" opacity=".7"/><circle cx="80" cy="68" r="5" fill="#ff9db9" opacity=".7"/><circle cx="60" cy="26" r="9" fill="#d9363e"/><path d="M60 18c2-6 6-8 10-8" stroke="#2e6f52" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
const LOGO =
  '<svg viewBox="0 0 24 24"><path d="M7.5 12h9L12 22z" fill="#f0c27b"/><circle cx="12" cy="8.5" r="5.5" fill="#ec5b8a"/></svg>';
const rp = (n) => 'Rp' + n.toLocaleString('id-ID');
const e = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

let M = [],
  C = [],
  T = [],
  biz = q.get('b') || 'Toko',
  wa = (q.get('w') || '').replace(/\D/g, '');
let logoSrc = '',
  banner = '',
  loading = !!DB,
  loadErr = false;

function fromQuery() {
  C = (q.get('c') || '').split('|').filter(Boolean);
  T = (q.get('t') || '').split('|').filter(Boolean);
  M = (q.get('m') || '')
    .split('|')
    .filter(Boolean)
    .map((s) => {
      const a = s.split('~');
      return { n: a[0], p: +a[1] || 0, c: C[+a[2]] || '', img: '' };
    });
}
function applyMenu(m) {
  biz = m.biz || biz;
  wa = (m.wa || '').replace(/\D/g, '');
  logoSrc = m.logo || '';
  banner = m.banner || '';
  T = Object.values(m.tops || {});
  C = Object.values(m.cats || {});
  M = Object.values(m.prods || {}).map((p) => ({
    n: p.n,
    p: +p.pr || 0,
    c: p.c || '',
    img: p.img || '',
  }));
}
async function boot() {
  if (!DB) {
    fromQuery();
    return r();
  }
  try {
    const c = localStorage.getItem('rv_menu_' + KEY);
    if (c) {
      applyMenu(JSON.parse(c));
      loading = false;
      r();
    }
  } catch (x) {}
  try {
    const m = await (await fetch(api('menu'))).json();
    if (m) {
      applyMenu(m);
      try {
        localStorage.setItem('rv_menu_' + KEY, JSON.stringify(m));
      } catch (x) {}
    }
    loadErr = !m && !M.length;
  } catch (x) {
    loadErr = !M.length;
  }
  loading = false;
  r();
  resumeOrder();
}

// ===== Keadaan halaman =====
let cat = '',
  cart = [],
  det = null,
  pay = 'Tunai',
  nm = '',
  first = 1,
  mode = '',
  order = null,
  pt;
const qtyOf = (i) => cart.filter((l) => l.i === i).reduce((a, l) => a + l.q, 0);
const tot = () => cart.reduce((a, l) => a + M[l.i].p * l.q, 0);
const cnt = () => cart.reduce((a, l) => a + l.q, 0);
const thumb = (m, i) => {
  const h = (i * 53) % 360;
  const badge = `<i style="background:hsl(${h} 65% 86%);color:hsl(${h} 45% 32%)">${e((m.n[0] || '?').toUpperCase())}</i>`;
  if (m.img) return badge + `<img src="${m.img}" alt="">`;
  return badge + (DB ? '' : `<img src="foto/${slug(m.n)}.jpg" alt="" onerror="this.remove()">`);
};
const item = (m, i) =>
  `<div class="it" onclick="od(${i})"><div class="th">${thumb(m, i)}</div><b>${e(m.n)}</b><small>${m.p ? rp(m.p) : 'harga menyesuaikan'}</small><span class="add">Pilih</span>${qtyOf(i) ? `<span class="bd">${qtyOf(i)}</span>` : ''}</div>`;
const STATUS = {
  baru: 'Menunggu penjual',
  proses: 'Sedang dibuat',
  selesai: 'Siap diambil!',
  batal: 'Dibatalkan',
};

// ===== Tampilan menu =====
function r() {
  const logoHTML = logoSrc
    ? `<img src="${logoSrc}" alt="">`
    : DB
      ? LOGO
      : `<img src="logo.jpg" alt="" onerror="this.outerHTML=LOGO">`;
  let body;
  if (loading) body = `<div class="card empty">${MASCOT}<h2>Menyiapkan menu...</h2></div>`;
  else if (loadErr)
    body = `<div class="card empty">${MASCOT}<h2>Menu belum bisa dimuat</h2><p class="mut">Cek internet kamu, lalu coba lagi.</p><button class="btn" onclick="location.reload()">Coba lagi</button></div>`;
  else
    body =
      (banner ? `<div class="hero"><img src="${banner}" alt=""></div>` : '') +
      (order
        ? `<div class="pill" onclick="sh('s')"><span class="dot"></span><span>Pesananmu: ${STATUS[order.s]}</span><b>lihat</b></div>`
        : '') +
      (C.length > 1
        ? `<div class="cats">${['', ...C].map((c) => `<button class="chip ${cat === c ? 'on' : ''}" onclick="sc(${JSON.stringify(c).replace(/"/g, '&quot;')})">${e(c) || 'Semua'}</button>`).join('')}</div>`
        : '') +
      (M.length
        ? `<div class="grid">${M.map((m, i) => (!cat || m.c === cat ? item(m, i) : '')).join('')}</div>`
        : '<p>Menu belum tersedia.</p>');
  $('a').innerHTML =
    `<div class="hd"><div class="logo">${logoHTML}</div><div><b>${e(biz)}</b><small>Ketuk menu untuk memesan</small></div></div><main class="${first ? 'in' : ''}">${body}</main>`;
  first = 0;
  ub();
}
function ub() {
  $('bc').textContent = cnt() + ' item';
  $('bt').textContent = rp(tot());
  $('bar').classList.toggle('show', cnt() > 0);
}
const sc = (c) => {
  cat = c;
  first = 1;
  r();
};

// ===== Lembar bawah: detail menu, keranjang, status =====
const cl = () => {
  $('sh').classList.remove('open');
  if (order && (order.s === 'selesai' || order.s === 'batal')) {
    order = null;
    clearInterval(pt);
    r();
  }
};
function sh(m) {
  if (m === 'c' && !cart.length) return;
  if (m === 's' && !order) return;
  mode = m;
  $('pn').innerHTML = '<div class="grab"></div>' + (m === 'd' ? dH() : m === 's' ? stH() : cH());
  $('sh').classList.add('open');
}
const od = (i) => {
  det = { i, q: 1, t: [], n: '' };
  navigator.vibrate && navigator.vibrate(10);
  sh('d');
};
const dH = () => {
  const m = M[det.i];
  return `<div class="th big">${thumb(m, det.i)}</div><h2 style="margin-top:12px">${e(m.n)}</h2><div class="mut">${m.p ? rp(m.p) : 'harga menyesuaikan'}</div>
${T.length ? `<h3>Topping (gratis)</h3><div class="chips">${T.map((t, k) => `<button class="chip ${det.t.includes(t) ? 'on' : ''}" onclick="dt(${k})">${e(t)}</button>`).join('')}</div>` : ''}
<h3>Catatan</h3><input placeholder="mis. es krim coklat saja" value="${e(det.n)}" oninput="det.n=this.value">
<div class="row2"><div class="ctl2"><button onclick="dq(-1)">−</button><span>${det.q}</span><button onclick="dq(1)">+</button></div><button class="btn" id="addb" onclick="ad()">Tambah · ${rp(m.p * det.q)}</button></div>`;
};
const dq = (d) => {
  det.q = Math.max(1, det.q + d);
  sh('d');
};
const dt = (k) => {
  const t = T[k];
  det.t = det.t.includes(t) ? det.t.filter((x) => x !== t) : [...det.t, t];
  sh('d');
};
function ad() {
  const k = det.t.slice().sort().join(),
    l = cart.find((x) => x.i === det.i && x.t.slice().sort().join() === k && x.n === det.n);
  l ? (l.q += det.q) : cart.push({ i: det.i, q: det.q, t: [...det.t], n: det.n });
  fly($('addb'));
  navigator.vibrate && navigator.vibrate(20);
  $('sh').classList.remove('open');
  r();
}
// ===== Animasi: bola es krim terbang ke keranjang =====
function fly(b) {
  const a = b.getBoundingClientRect(),
    d = document.createElement('div');
  d.className = 'fl';
  d.style.cssText = `left:${a.left + a.width / 2 - 14}px;top:${a.top + a.height / 2 - 14}px`;
  document.body.appendChild(d);
  if (!d.animate) return d.remove();
  d.animate(
    [
      { transform: 'translate(0,0) scale(1)' },
      {
        transform: `translate(${50 - a.left - a.width / 2}px,${innerHeight - 40 - a.top - a.height / 2}px) scale(.3)`,
        opacity: 0.4,
      },
    ],
    { duration: 650, easing: 'cubic-bezier(.5,0,.75,.4)' },
  ).onfinish = () => {
    d.remove();
    $('bar').animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
      { duration: 300 },
    );
  };
}

// ===== Keranjang dan kirim pesanan =====
const cH =
  () => `<h2>Keranjang</h2>${cart.map((l, k) => `<div class="ln"><div><b>${e(M[l.i].n)}</b><small>${e([l.t.length ? '+ ' + l.t.join(', ') : 'Tanpa topping', l.n].filter(Boolean).join(' · '))}</small></div><div class="ctl2 s"><button onclick="cq(${k},-1)">−</button><span>${l.q}</span><button onclick="cq(${k},1)">+</button></div></div>`).join('')}
<h3>Nama pemesan</h3><input id="nmi" placeholder="Nama kamu" value="${e(nm)}" oninput="nm=this.value"><h3>Bayar pakai</h3><div class="seg">${['Tunai', 'QRIS'].map((m) => `<button class="${pay === m ? 'on' : ''}" onclick="pay='${m}';sh('c')">${m}</button>`).join('')}</div>
<div class="tt"><span>Perkiraan total</span><b>${rp(tot())}</b></div><button class="btn full" id="sendb" onclick="send()">${DB ? 'Kirim pesanan' : 'Kirim lewat WhatsApp'}</button><p class="mut" style="font-size:13px;margin:10px 0 0">Harga akhir dikonfirmasi penjual sesuai pilihan es krim dan topping.</p>`;
function cq(k, d) {
  cart[k].q += d;
  if (cart[k].q <= 0) cart.splice(k, 1);
  cart.length ? sh('c') : $('sh').classList.remove('open');
  r();
}
async function send() {
  if (!nm.trim()) {
    const i = $('nmi');
    i.focus();
    i.animate &&
      i.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-8px)' },
          { transform: 'translateX(8px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 300 },
      );
    return;
  }
  if (DB) {
    const b = $('sendb');
    b.disabled = true;
    b.textContent = 'Mengirim...';
    const o = {
      n: nm.trim(),
      pay,
      tot: tot(),
      t: Date.now(),
      s: 'baru',
      l: cart.map((l) => ({ n: M[l.i].n, q: l.q, p: M[l.i].p, t: l.t, c: l.n })),
    };
    try {
      const res = await fetch(api('orders'), { method: 'POST', body: JSON.stringify(o) });
      if (!res.ok) throw 0;
      const j = await res.json();
      order = { id: j.name, s: 'baru', n: o.n };
      try {
        localStorage.setItem('rv_ord_' + KEY, j.name);
      } catch (x) {}
      cart = [];
      r();
      sh('s');
      poll();
    } catch (x) {
      b.disabled = false;
      b.textContent = 'Kirim pesanan';
      alert('Pesanan belum terkirim. Cek internet lalu coba lagi.');
    }
    return;
  }
  if (!wa) return alert('Nomor toko belum diatur');
  const L = ['Pesanan ' + biz, 'Nama: ' + nm.trim(), ''];
  cart.forEach((l) =>
    L.push(
      l.q +
        'x ' +
        M[l.i].n +
        (l.t.length ? ' (' + l.t.join(', ') + ')' : '') +
        (l.n ? ' - ' + l.n : ''),
    ),
  );
  L.push('', 'Bayar: ' + pay, 'Perkiraan total: ' + rp(tot()));
  location.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(L.join('\n'));
}

// ===== Status pesanan (diperbarui otomatis) =====
const stH = () => {
  const s = order.s,
    idx = { baru: 0, proses: 1, selesai: 2, batal: 0 }[s],
    done = s === 'selesai';
  const msg = {
    baru: 'Pesananmu sudah masuk. Menunggu penjual...',
    proses: 'Pesananmu sedang dibuat!',
    selesai: 'Pesanan selesai! Silakan diambil dan dibayar ya.',
    batal: 'Maaf, pesanan dibatalkan penjual.',
  }[s];
  return `${MASCOT}<h2 class="c">${msg}</h2><div class="steps">${['Terkirim', 'Dibuat', 'Selesai'].map((t, k) => `<div class="st ${done || k < idx ? 'on' : k === idx && s !== 'batal' ? 'cur' : ''}"><i>${done || k < idx ? '✓' : k + 1}</i>${t}</div>`).join('')}</div><button class="btn full" onclick="cl()">${done || s === 'batal' ? 'Tutup' : 'Pesan lagi'}</button>`;
};
function poll() {
  clearInterval(pt);
  pt = setInterval(async () => {
    if (!order) return;
    try {
      const o = await (await fetch(api('orders/' + order.id))).json();
      const s = o ? o.s : 'selesai';
      if (s !== order.s) {
        order.s = s;
        navigator.vibrate && navigator.vibrate(60);
        r();
        if (mode === 's' && $('sh').classList.contains('open')) sh('s');
      }
      if (s === 'selesai' || s === 'batal') clearInterval(pt);
    } catch (x) {}
  }, 5000);
}
async function resumeOrder() {
  try {
    const id = localStorage.getItem('rv_ord_' + KEY);
    if (!id) return;
    const o = await (await fetch(api('orders/' + id))).json();
    if (!o || o.s === 'selesai' || o.s === 'batal') return localStorage.removeItem('rv_ord_' + KEY);
    order = { id, s: o.s, n: o.n };
    r();
    poll();
  } catch (x) {}
}
boot();