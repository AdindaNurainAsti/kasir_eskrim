// Kasir Es Krim - logika aplikasi kasir
// ===== Fungsi bantu =====
const $ = (s) => document.querySelector(s),
  K = 'kasir_eskrim_v1';
const rp = (n) => 'Rp' + Math.round(+n || 0).toLocaleString('id-ID');
const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
// ===== Data awal dan penyimpanan (localStorage) =====
const MENU = [
  ['Es Sorang', 5000, 1, 'Es Krim'],
  ['Es Mini', 3000, 1, 'Es Krim'],
  ['Es Ngedate', 8000, 1, 'Es Krim'],
  ['Es Cemil', 10000, 1, 'Es Krim'],
  ['Es Minim', 2000, 1, 'Es Krim'],
  ['Kapucino Cincau', 8000, 0, 'Minuman'],
  ['Kapucino Ice', 8000, 0, 'Minuman'],
  ['Pop Ice', 5000, 0, 'Minuman'],
  ['BIG Cola', 0, 0, 'Minuman Botol'],
];
const defBase = () => location.href.split(/[?#]/)[0].replace(/[^/]*$/, '') + 'pesan.html';
const def = () => ({
  biz: 'The Revr',
  wa: '',
  base: '',
  qris: '',
  per: 50,
  portions: 0,
  users: [
    { n: 'Eka', r: 'owner', pin: '1234' },
    { n: 'Vidi', r: 'staff', pin: '0000' },
  ],
  cats: ['Es Krim', 'Minuman', 'Minuman Botol'],
  tops: ['Coklat', 'Oreo', 'Meses', 'Keju'],
  prods: MENU.map((m, i) => ({ id: i + 1, n: m[0], pr: m[1], ice: m[2], c: m[3], st: null })),
  tx: [],
  ex: [],
  nid: 10,
});
let S;
try {
  S = JSON.parse(localStorage.getItem(K)) || def();
} catch (e) {
  S = def();
}
const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {
    toast('Penyimpanan penuh!');
  }
};
let pfid,
  fx = 1,
  me = null,
  tab = 'kasir',
  lu = null,
  dr = { q: 1, tops: [], pay: 'Tunai', amt: '' },
  rd = today();
const owner = () => me && me.r === 'owner';
function toast(t) {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('on');
  setTimeout(() => e.classList.remove('on'), 1800);
}
const cupTxt = (p) => {
  const c = Math.floor(p / S.per);
  return c + ' cup + ' + (p - c * S.per) + ' porsi';
};
const P = (id) => S.prods.find((p) => p.id == id);
// ===== Ikon dan komponen kecil =====
const IC = {
  kasir: '<path d="M7 12h10l-5 10z"/><path d="M7 12a5 5 0 1 1 10 0"/>',
  stok: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  biaya: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  lap: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  set: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 20h2"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-6h16v6h-3"/><rect x="7" y="14" width="10" height="7"/>',
  down: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  up: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h0"/>',
};
const ic = (n) =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const LOGO =
  '<svg viewBox="0 0 24 24"><path d="M7.5 12h9L12 22z" fill="#f0c27b"/><circle cx="12" cy="8.5" r="5.5" fill="#ec5b8a"/></svg>';
const logo = () => `<div class="logo">${S.logo ? `<img src="${S.logo}" alt="">` : LOGO}</div>`;
const th = (p) =>
  p.img
    ? `<img src="${p.img}" alt="">`
    : `<i style="background:hsl(${(p.id * 53) % 360} 65% 86%);color:hsl(${(p.id * 53) % 360} 45% 32%)">${esc((p.n.trim()[0] || '?').toUpperCase())}</i>`;
const tile = (p) =>
  `<button class="tile ${dr.p == p.id ? 'on' : ''}" data-a="pick" data-v="${p.id}"><span class="th">${th(p)}</span><b>${esc(p.n)}</b><small>${p.pr ? rp(p.pr) : 'harga bebas'}</small></button>`;
const rz = (f, m, cb) => {
  const im = new Image();
  im.onload = () => {
    const s = Math.min(1, m / Math.max(im.width, im.height)),
      c = document.createElement('canvas');
    c.width = im.width * s;
    c.height = im.height * s;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(im, 0, 0, c.width, c.height);
    cb(c.toDataURL('image/jpeg', 0.8));
  };
  im.src = URL.createObjectURL(f);
};
function pop() {
  const d = document.createElement('div');
  d.className = 'okp';
  const cols = ['#ec5b8a', '#f0c27b', '#2e6f52', '#6ec6ff', '#ffd23f'];
  let s =
    '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 14-16"/></svg>';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * 6.283,
      r = 90 + Math.random() * 70;
    s += `<s style="--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;background:${cols[i % 5]};animation-delay:${Math.random() * 0.12}s"></s>`;
  }
  d.innerHTML = s;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1400);
}
function keep() {
  const a = $('#amt');
  if (a) dr.amt = a.value;
}

// ===== Menampilkan layar =====
function render() {
  const A = $('#app');
  if (!me) {
    A.innerHTML = `<div class="hd">${logo()}<div><b>${esc(S.biz)}</b><small>Masuk dulu ya</small></div></div><main class="${fx ? 'in' : ''}">${hero()}<div class="card"><h2>Siapa yang bertugas?</h2><div class="chips">${S.users.map((u, i) => `<button class="chip ${lu === i ? 'on' : ''}" data-a="lu" data-v="${i}">${esc(u.n)}<small>${u.r === 'owner' ? 'Pemilik' : 'Pegawai'}</small></button>`).join('')}</div><h3>PIN</h3><input id="pin" type="password" inputmode="numeric" maxlength="8" placeholder="Masukkan PIN"><br><br><button class="btn" data-a="login">Masuk</button></div></main>`;
    fx = 0;
    return;
  }
  const tabs = [
    ['kasir', 'kasir', 'Kasir'],
    ['pesan', 'pesan', 'Pesanan'],
    ['stok', 'stok', 'Stok'],
    ['biaya', 'biaya', 'Biaya'],
  ];
  if (owner()) tabs.push(['lap', 'lap', 'Laporan'], ['set', 'set', 'Kelola']);
  if (!tabs.find((t) => t[0] === tab)) tab = 'kasir';
  A.innerHTML = `<div class="hd">${logo()}<div><b>${esc(S.biz)}</b><small>Halo, ${esc(me.n)} (${owner() ? 'Pemilik' : 'Pegawai'})</small></div><button data-a="out">Keluar</button></div><main class="${fx ? 'in' : ''}">${V[tab]()}</main><div class="nav">${tabs.map((t) => `<button class="${tab === t[0] ? 'on' : ''}" data-a="tab" data-v="${t[0]}"><span>${ic(t[1])}${t[0] === 'pesan' ? `<i class="nb" ${newCount ? '' : 'hidden'}>${newCount}</i>` : ''}</span>${t[2]}</button>`).join('')}</div>`;
  fx = 0;
}

// ===== Daftar transaksi dan peringatan stok =====
const lowBox = () => {
  const lo = S.portions <= S.per;
  return lo
    ? `<div class="warn">${ic('warn')} Stok es krim tinggal ${cupTxt(Math.max(S.portions, 0))}. Segera beli cup baru!</div>`
    : '';
};
const txRows = (list, ed) =>
  list.length
    ? list
        .slice()
        .reverse()
        .map(
          (t) =>
            `<div class="li"><div>${t.q}× ${esc(t.p)}<small>${new Date(t.t).toTimeString().slice(0, 5)} · ${t.pay} · ${esc(t.u)}${t.from ? ' · pesan QR' : ''}${t.tops.length ? ' · +' + esc(t.tops.join(', ')) : ''}</small></div><div><b>${rp(t.amt)}</b>${ed && owner() ? ` <button class="x" data-a="etx" data-v="${t.id}">${ic('edit')}</button><button class="x" data-a="dtx" data-v="${t.id}">${ic('trash')}</button>` : ''}</div></div>`,
        )
        .join('')
    : '<p style="color:var(--mut)">Belum ada transaksi.</p>';

// ===== Isi tiap menu (Kasir, Stok, Biaya, Laporan, Kelola) =====
const V = {
  kasir() {
    const sel = P(dr.p),
      td = S.tx.filter((t) => t.d === today());
    return `${lowBox()}<div class="card"><h2>Pilih produk</h2>${S.cats
      .map((c) => {
        const l = S.prods.filter((p) => p.c === c);
        return l.length ? `<h3>${esc(c)}</h3><div class="grid">${l.map(tile).join('')}</div>` : '';
      })
      .join('')}
 <h3>Jumlah</h3><div class="row"><button class="step fx" data-a="q" data-v="-1">−</button><div class="qty">${dr.q}</div><button class="step fx" data-a="q" data-v="1">+</button></div>
 ${S.tops.length ? `<h3>Topping (tanpa harga)</h3><div class="chips">${S.tops.map((t) => `<button class="chip ${dr.tops.includes(t) ? 'on' : ''}" data-a="top" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
 <h3>Nominal transaksi (Rp)</h3><input id="amt" class="amt" type="number" inputmode="numeric" placeholder="0" value="${dr.amt}" oninput="dr.man=1">
 <div class="chips" style="margin-top:8px">${[2000, 3000, 5000, 10000, 15000].map((n) => `<button class="chip" data-a="nom" data-v="${n}">${n / 1000}rb</button>`).join('')}</div>
 <h3>Pembayaran</h3><div class="seg">${['Tunai', 'QRIS'].map((m) => `<button class="${dr.pay === m ? 'on' : ''}" data-a="pay" data-v="${m}">${ic(m === 'Tunai' ? 'cash' : 'qr')} ${m}</button>`).join('')}</div><br>
 ${dr.pay === 'QRIS' ? (S.qris ? '<button class="btn s" data-a="showq">Tampilkan QRIS ke pelanggan</button><br><br>' : '<p style="color:var(--mut)">Unggah foto QRIS di menu Kelola agar bisa ditampilkan di sini.</p>') : ''}<button class="btn" data-a="sell">Simpan transaksi</button></div>
 <div class="card"><h2>Hari ini · ${rp(td.reduce((a, t) => a + t.amt, 0))}</h2>${txRows(td, 1)}</div>`;
  },

  stok() {
    const lo = S.portions <= S.per,
      pct = Math.min(100, Math.max(0, (S.portions / (S.per * 5)) * 100));
    return `${lowBox()}<div class="card"><h2>Es krim</h2><div class="big">${cupTxt(Math.max(S.portions, 0))}</div><p style="margin:2px 0 10px;color:var(--mut)">${S.portions} porsi tersisa · 1 cup = ${S.per} porsi</p><div class="bar ${lo ? 'lo' : ''}"><i style="width:${pct}%"></i></div>
 <h3>Tambah stok (jumlah cup)</h3><div class="row"><input id="addcup" type="number" inputmode="numeric" placeholder="mis. 3"><button class="btn s fx" style="width:auto" data-a="addcup">Tambah</button></div>
 ${owner() ? `<h3>Koreksi manual (porsi)</h3><div class="row"><input id="fixp" type="number" inputmode="numeric" value="${S.portions}"><button class="btn g fx" style="width:auto" data-a="fixp">Simpan</button></div>` : ''}</div>
 <div class="card"><h2>Barang satuan (botol, dll)</h2>${
   S.prods
     .filter((p) => !p.ice)
     .map(
       (p) =>
         `<div class="li"><div>${esc(p.n)}<small>${esc(p.c)}</small></div><div class="row fx"><b>${p.st == null ? 'tanpa stok' : p.st + ' pcs'}</b><button class="btn s sm" data-a="addst" data-v="${p.id}">+ Stok</button></div></div>`,
     )
     .join('') || '<p style="color:var(--mut)">Belum ada.</p>'
 }</div>`;
  },

  biaya() {
    const cats = ['Bahan', 'Cup', 'Plastik', 'Transport', 'Lainnya'],
      list = S.ex.filter((e) => owner() || e.d === today()).slice(-30);
    return `<div class="card"><h2>Catat pengeluaran</h2><select id="ecat">${cats.map((c) => `<option>${c}</option>`).join('')}</select><br><br><input id="enom" class="amt" type="number" inputmode="numeric" placeholder="Nominal (Rp)"><br><br><input id="enote" placeholder="Catatan (opsional)"><br><br><button class="btn" data-a="addex">Simpan pengeluaran</button></div>
 <div class="card"><h2>${owner() ? 'Pengeluaran terbaru' : 'Pengeluaran hari ini'}</h2>${
   list.length
     ? list
         .slice()
         .reverse()
         .map(
           (e) =>
             `<div class="li"><div>${esc(e.c)}${e.note ? ' · ' + esc(e.note) : ''}<small>${e.d} · ${esc(e.u)}</small></div><div><b>${rp(e.amt)}</b>${owner() ? ` <button class="x" data-a="dex" data-v="${e.id}">${ic('trash')}</button>` : ''}</div></div>`,
         )
         .join('')
     : '<p style="color:var(--mut)">Belum ada.</p>'
 }</div>`;
  },

  lap() {
    const t = S.tx.filter((x) => x.d === rd),
      e = S.ex.filter((x) => x.d === rd),
      sum = (l, f) => l.reduce((a, x) => a + (f ? f(x) : x.amt), 0);
    const tn = sum(t.filter((x) => x.pay === 'Tunai')),
      qr = sum(t.filter((x) => x.pay === 'QRIS')),
      om = tn + qr,
      bi = sum(e),
      lb = om - bi;
    return `<div class="card noprint"><h2>Laporan harian</h2><div class="row"><input id="rd" type="date" value="${rd}" data-a="rd"><button class="btn fx" style="width:auto" data-a="pdf">${ic('down')} Unduh PDF</button></div><div class="row" style="margin-top:10px">${navigator.canShare ? '<button class="btn s" data-a="pdfshare">Bagikan (WhatsApp, dll)</button>' : ''}<button class="btn g" data-a="print">${ic('print')} Cetak</button></div><p style="color:var(--mut);font-size:13px;margin:8px 0 0">PDF langsung tersimpan di HP (folder Unduhan).</p></div>
 <div class="card"><div class="ph"><h2>${esc(S.biz)}</h2></div><h2>Ringkasan · ${rd}</h2><div class="k"><div><small>${ic('cash')} Tunai</small><b>${rp(tn)}</b></div><div><small>${ic('qr')} QRIS</small><b>${rp(qr)}</b></div><div><small>Total penjualan</small><b>${rp(om)}</b></div><div><small>Pengeluaran</small><b>${rp(bi)}</b></div><div class="net ${lb < 0 ? 'neg' : ''}"><small>Laba bersih</small><b>${rp(lb)}</b></div><div><small>Transaksi</small><b>${t.length}</b></div><div><small>Item terjual</small><b>${sum(t, (x) => x.q)}</b></div><div><small>Dari pesan QR</small><b>${rp(sum(t.filter((x) => x.from)))}</b></div></div>
 <h3>Penjualan</h3>${txRows(t, 0)}<h3>Pengeluaran</h3>${e.length ? e.map((x) => `<div class="li"><div>${esc(x.c)}${x.note ? ' · ' + esc(x.note) : ''}</div><b>${rp(x.amt)}</b></div>`).join('') : '<p style="color:var(--mut)">Tidak ada.</p>'}</div>`;
  },

  set() {
    return `<div class="card"><h2>Produk</h2><input id="pf" type="file" accept="image/*" style="display:none"><p style="color:var(--mut);margin-top:0">Ketuk foto atau ikon kamera untuk memasang dan mengganti foto produk. Foto ikut tampil di halaman pesan pelanggan.</p>${S.prods.map((p) => `<div class="li"><span class="th sm tap" data-a="pf" data-v="${p.id}">${th(p)}</span><div style="flex:1">${esc(p.n)}<small>${esc(p.c)} · ${p.pr ? rp(p.pr) : 'harga bebas'} · ${p.ice ? 'stok cup' : 'stok satuan'}</small></div><div style="white-space:nowrap"><button class="x" data-a="pf" data-v="${p.id}">${ic('cam')}</button>${p.img ? `<button class="x" data-a="rmimg" data-v="${p.id}">${ic('x')}</button>` : ''}<button class="x" data-a="eprod" data-v="${p.id}">${ic('edit')}</button><button class="x" data-a="dprod" data-v="${p.id}">${ic('trash')}</button></div></div>`).join('')}
 <h3>Tambah produk</h3><input id="pn" placeholder="Nama produk"><br><br><select id="pc">${S.cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select><br><br><input id="pp" type="number" inputmode="numeric" placeholder="Harga standar (boleh kosong)"><br><br><select id="pi"><option value="1">Pakai stok cup (es krim)</option><option value="0">Stok satuan (botol, dll)</option></select><br><br><button class="btn" data-a="addprod">Tambah produk</button></div>
 <div class="card"><h2>Logo &amp; foto banner</h2><h3>Logo toko (tampil di header)</h3><div class="row"><span class="logo-prev tap" data-a="lf">${S.logo ? `<img src="${S.logo}" alt="">` : LOGO}</span><div class="stack"><button class="btn s sm" data-a="lf">${ic('cam')} ${S.logo ? 'Ganti logo' : 'Pasang logo'}</button>${S.logo ? '<button class="btn g sm" data-a="rmlogo">Hapus logo</button>' : ''}</div></div><input id="lf" type="file" accept="image/*" hidden><h3>Foto banner (tampil di halaman login dan halaman pesan)</h3><div class="banner-prev tap" data-a="bf">${S.banner ? `<img src="${S.banner}" alt="">` : '<span>Ketuk untuk menambah foto banner</span>'}</div><input id="bf" type="file" accept="image/*" hidden>${S.banner ? '<br><button class="btn g sm" data-a="rmbanner">Hapus banner</button>' : ''}</div>
 <div class="card"><h2>Sambung pesanan online</h2><p class="mut" style="margin-top:0">Agar pesanan pelanggan masuk ke tab Pesanan dan otomatis tercatat di laporan penjualan. Langkah membuatnya ada di README.md.</p><h3>Alamat Firebase Realtime Database</h3><input id="dburl" type="url" placeholder="https://nama-proyek-default-rtdb.region.firebasedatabase.app" value="${esc(S.db || '')}"><br><br><button class="btn" data-a="sync">${S.db ? 'Simpan &amp; kirim ulang menu' : 'Sambungkan'}</button>${S.db ? '<br><br><button class="btn g" data-a="unsync">Putuskan sambungan</button>' : ''}</div>
 <div class="card"><h2>Kategori</h2><div class="chips">${S.cats.map((c, i) => `<button class="chip" data-a="dcat" data-v="${i}">${esc(c)} ✕</button>`).join('')}</div><br><div class="row"><input id="nc" placeholder="Kategori baru"><button class="btn s fx" style="width:auto" data-a="addcat">Tambah</button></div></div>
 <div class="card"><h2>Topping</h2><div class="chips">${S.tops.map((c, i) => `<button class="chip" data-a="dtop" data-v="${i}">${esc(c)} ✕</button>`).join('')}</div><br><div class="row"><input id="nt" placeholder="Topping baru"><button class="btn s fx" style="width:auto" data-a="addtop">Tambah</button></div></div>
 <div class="card"><h2>Pengaturan</h2><h3>Nama usaha</h3><input id="biz" value="${esc(S.biz)}"><h3>Porsi per 1 cup</h3><input id="per" type="number" inputmode="numeric" value="${S.per}"><br><br><button class="btn" data-a="savecfg">Simpan</button></div>
 <div class="card"><h2>Akun pengguna</h2>${S.users.map((u, i) => `<div class="li"><div>${esc(u.n)}<small>${u.r === 'owner' ? 'Pemilik · akses penuh' : 'Pegawai · kasir, stok, biaya'}</small></div><div><button class="btn g sm" data-a="pin" data-v="${i}">Ganti PIN</button> <button class="x" data-a="duser" data-v="${i}">${ic('trash')}</button></div></div>`).join('')}
 <h3>Tambah akun baru</h3><input id="un" placeholder="Nama"><br><br><select id="ur"><option value="staff">Pegawai (kasir, stok, biaya)</option><option value="owner">Pemilik (akses penuh)</option></select><br><br><input id="up" type="password" inputmode="numeric" maxlength="8" placeholder="PIN (4-8 angka)"><br><br><button class="btn" data-a="adduser">Tambah akun</button></div>
 <div class="card" id="qrc"><div class="ph"><h2>Scan untuk memesan · ${esc(S.biz)}</h2></div><h2>Pesan lewat QR</h2><p style="color:var(--mut);margin-top:0">Pelanggan scan QR, pilih menu, lalu pesanan terkirim ke WhatsApp toko.</p><h3>Nomor WhatsApp toko</h3><input id="wa" type="tel" inputmode="numeric" placeholder="0812xxxxxxxx" value="${esc(S.wa || '')}"><h3>Alamat halaman pesan</h3><input id="base" value="${esc(S.base || defBase())}"><br><br><button class="btn" data-a="mkqr">Buat QR menu</button><div id="qrbox" style="text-align:center;margin-top:12px"></div><br><button class="btn g" data-a="loadmenu">Muat menu The Revr dari spanduk</button></div>
 <div class="card"><h2>QRIS toko</h2>${S.qris ? `<img src="${S.qris}" style="width:100%;max-width:260px;display:block;margin:0 auto 12px">` : '<p style="color:var(--mut);margin-top:0">Belum ada foto QRIS.</p>'}<input id="qf" type="file" accept="image/*" style="display:none"><button class="btn s" data-a="qf">Unggah foto QRIS</button></div>
 <div class="card"><h2>Cadangan data</h2><p style="color:var(--mut);margin-top:0">Data tersimpan di HP ini. Unduh cadangan secara rutin.</p><button class="btn s" data-a="bk">${ic('down')} Unduh cadangan</button><br><br><input id="rs" type="file" accept=".json" style="display:none"><button class="btn g" data-a="rs">${ic('up')} Pulihkan dari file</button></div>`;
  },
};

// ===== Aksi tombol =====
const A = {
  lu(v) {
    lu = +v;
  },
  login() {
    const u = S.users[lu];
    if (!u) return toast('Pilih nama dulu');
    if ($('#pin').value !== u.pin) return toast('PIN salah');
    me = u;
    tab = 'kasir';
    fx = 1;
  },
  out() {
    me = null;
    lu = null;
    fx = 1;
  },
  tab(v) {
    tab = v;
    fx = 1;
  },
  pick(v) {
    const p = P(v);
    dr.p = +v;
    if (!dr.man) dr.amt = p.pr ? p.pr * dr.q : '';
  },
  q(v) {
    dr.q = Math.max(1, dr.q + +v);
    const p = P(dr.p);
    if (p && p.pr && !dr.man) dr.amt = p.pr * dr.q;
  },
  top(v) {
    dr.tops = dr.tops.includes(v) ? dr.tops.filter((x) => x !== v) : [...dr.tops, v];
  },
  nom(v) {
    dr.amt = v;
    dr.man = 1;
  },
  pay(v) {
    dr.pay = v;
  },
  sell() {
    const p = P(dr.p),
      amt = +dr.amt;
    if (!p) return toast('Pilih produk dulu');
    if (!(amt > 0)) return toast('Isi nominal transaksi');
    const stk = p.ice ? S.portions : p.st;
    if (
      stk != null &&
      stk < dr.q &&
      !confirm('Stok tercatat tidak cukup (' + stk + '). Tetap simpan?')
    )
      return;
    if (p.ice) S.portions -= dr.q;
    else if (p.st != null) p.st -= dr.q;
    S.tx.push({
      id: S.nid++,
      t: Date.now(),
      d: today(),
      u: me.n,
      pid: p.id,
      p: p.n,
      q: dr.q,
      amt,
      pay: dr.pay,
      tops: dr.tops,
      ice: p.ice,
    });
    dr = { q: 1, tops: [], pay: dr.pay, amt: '' };
    save();
    toast('Tersimpan ✓');
    pop();
    if (S.portions === S.per) setTimeout(() => alert('Sisa 1 cup! Segera restok.'), 200);
  },
  etx(v) {
    const t = S.tx.find((x) => x.id == v),
      n = prompt('Ubah nominal (Rp):', t.amt);
    if (n && +n > 0) {
      t.amt = +n;
      save();
    }
  },
  dtx(v) {
    if (!confirm('Hapus transaksi ini? Stok dikembalikan.')) return;
    const t = S.tx.find((x) => x.id == v),
      p = P(t.pid);
    if (t.ice) S.portions += t.q;
    else if (p) p.st = (p.st || 0) + t.q;
    S.tx = S.tx.filter((x) => x.id != v);
    save();
  },
  addcup() {
    const n = +$('#addcup').value;
    if (!(n > 0)) return toast('Isi jumlah cup');
    S.portions += n * S.per;
    save();
    toast('+' + n + ' cup');
  },
  fixp() {
    S.portions = +$('#fixp').value || 0;
    save();
    toast('Stok dikoreksi');
  },
  addst(v) {
    const n = +prompt('Tambah berapa pcs?');
    if (n > 0) {
      const p = P(v);
      p.st = (p.st || 0) + n;
      save();
    }
  },
  addex() {
    const n = +$('#enom').value;
    if (!(n > 0)) return toast('Isi nominal');
    S.ex.push({
      id: S.nid++,
      d: today(),
      c: $('#ecat').value,
      amt: n,
      note: $('#enote').value.trim(),
      u: me.n,
    });
    save();
    toast('Tersimpan ✓');
  },
  dex(v) {
    if (confirm('Hapus pengeluaran ini?')) {
      S.ex = S.ex.filter((x) => x.id != v);
      save();
    }
  },
  rd() {
    rd = $('#rd').value || today();
  },
  print() {
    window.print();
  },
  addprod() {
    const n = $('#pn').value.trim();
    if (!n) return toast('Isi nama produk');
    S.prods.push({
      id: S.nid++,
      n,
      c: $('#pc').value,
      pr: +$('#pp').value || 0,
      ice: +$('#pi').value,
      st: null,
    });
    save();
    toast('Produk ditambah');
  },
  eprod(v) {
    const p = P(v),
      n = prompt('Nama produk:', p.n);
    if (!n) return;
    const h = prompt('Harga standar (0 = bebas):', p.pr);
    p.n = n;
    p.pr = +h || 0;
    save();
  },
  dprod(v) {
    if (confirm('Hapus produk ini? Riwayat penjualan tetap ada.')) {
      S.prods = S.prods.filter((p) => p.id != v);
      if (dr.p == v) dr.p = null;
      save();
    }
  },
  addcat() {
    const c = $('#nc').value.trim();
    if (c && !S.cats.includes(c)) {
      S.cats.push(c);
      save();
    }
  },
  dcat(v) {
    const c = S.cats[v];
    if (S.prods.some((p) => p.c === c)) return toast('Masih ada produk di kategori ini');
    S.cats.splice(v, 1);
    save();
  },
  addtop() {
    const c = $('#nt').value.trim();
    if (c && !S.tops.includes(c)) {
      S.tops.push(c);
      save();
    }
  },
  dtop(v) {
    S.tops.splice(v, 1);
    save();
  },
  savecfg() {
    S.biz = $('#biz').value.trim() || S.biz;
    S.per = Math.max(1, +$('#per').value || 50);
    save();
    toast('Tersimpan ✓');
  },
  pin(v) {
    const n = prompt('PIN baru untuk ' + S.users[v].n + ' (4-8 angka):');
    if (n && /^\d{4,8}$/.test(n)) {
      S.users[v].pin = n;
      save();
      toast('PIN diganti');
    } else if (n) toast('PIN harus 4-8 angka');
  },
  adduser() {
    const n = $('#un').value.trim(),
      p = $('#up').value;
    if (!n) return toast('Isi nama dulu');
    if (S.users.some((u) => u.n.toLowerCase() === n.toLowerCase()))
      return toast('Nama sudah dipakai');
    if (!/^\d{4,8}$/.test(p)) return toast('PIN harus 4-8 angka');
    S.users.push({ n, r: $('#ur').value, pin: p });
    save();
    toast('Akun ditambah ✓');
  },
  duser(v) {
    const u = S.users[v];
    if (u === me) return toast('Akun yang sedang dipakai tidak bisa dihapus');
    if (u.r === 'owner' && S.users.filter((x) => x.r === 'owner').length < 2)
      return toast('Minimal harus ada 1 pemilik');
    if (confirm('Hapus akun ' + u.n + '?')) {
      S.users.splice(v, 1);
      save();
    }
  },
  mkqr() {
    const w = $('#wa').value.replace(/\D/g, '').replace(/^0/, '62');
    if (w.length < 9) return toast('Isi nomor WhatsApp dulu');
    S.wa = w;
    S.base = $('#base').value.trim();
    let u;
    try {
      u = new URL(S.base || defBase());
    } catch (x) {
      return toast('Alamat tidak valid');
    }
    u.search = new URLSearchParams({
      b: S.biz,
      w,
      m: S.prods.map((p) => p.n + '~' + p.pr + '~' + Math.max(0, S.cats.indexOf(p.c))).join('|'),
      c: S.cats.join('|'),
      t: S.tops.join('|'),
    });
    save();
    const q = qrcode(0, 'L');
    q.addData(u.href);
    q.make();
    const b = $('#qrbox');
    b.innerHTML = q.createSvgTag(4, 4);
    const s = b.firstChild;
    s.removeAttribute('height');
    s.style.cssText = 'width:100%;max-width:320px';
    b.insertAdjacentHTML(
      'beforeend',
      '<p style="color:var(--mut);font-size:13px;word-break:break-all">' +
        esc(u.href) +
        '</p><button class="btn s" data-a="pq">' +
        ic('print') +
        ' Cetak QR</button>',
    );
  },
  pq() {
    document.body.classList.add('pq');
    print();
    setTimeout(() => document.body.classList.remove('pq'), 800);
  },
  qf() {
    $('#qf').click();
  },
  showq() {
    const d = document.createElement('div');
    d.style.cssText =
      'position:fixed;inset:0;background:#fff;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px';
    d.innerHTML = `<b style="font-size:20px">${esc(S.biz)}</b><img src="${S.qris}" style="max-width:100%;max-height:62vh"><b style="font-size:26px">${rp(dr.amt)}</b><button class="btn" style="max-width:320px" onclick="this.parentNode.remove()">Tutup</button>`;
    document.body.appendChild(d);
  },
  loadmenu() {
    MENU.forEach((m) => {
      if (!S.cats.includes(m[3])) S.cats.push(m[3]);
      if (!S.prods.some((p) => p.n === m[0]))
        S.prods.push({ id: S.nid++, n: m[0], pr: m[1], ice: m[2], c: m[3], st: null });
    });
    if (S.biz === 'Es Krim Eka') S.biz = 'The Revr';
    save();
    toast('Menu dimuat ✓');
  },
  pf(v) {
    pfid = v;
    $('#pf').click();
  },
  lf() {
    $('#lf').click();
  },
  bk() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }));
    a.download = 'cadangan-eskrim-' + today() + '.json';
    a.click();
  },
  rs() {
    $('#rs').click();
  },
};
// ===== Penangkap klik dan perubahan file =====
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b || b.tagName === 'INPUT') return;
  keep();
  A[b.dataset.a]?.(b.dataset.v);
  if (MA.includes(b.dataset.a)) msync();
  if (!NR.includes(b.dataset.a)) render();
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'rd') {
    A.rd();
    render();
  }
  if (['qf', 'pf', 'lf', 'bf'].includes(e.target.id)) {
    const id = e.target.id,
      f = e.target.files[0];
    if (!f) return;
    rz(f, id === 'qf' ? 700 : id === 'bf' ? 900 : id === 'lf' ? 240 : 320, (d) => {
      if (id === 'qf') S.qris = d;
      else if (id === 'lf') S.logo = d;
      else if (id === 'bf') S.banner = d;
      else P(pfid).img = d;
      save();
      render();
      toast('Foto tersimpan ✓');
      msync();
    });
  }
  if (e.target.id === 'rs') {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d.prods || !d.users) throw 0;
        if (confirm('Timpa semua data dengan file ini?')) {
          S = d;
          save();
          render();
          toast('Data dipulihkan');
        }
      } catch (x) {
        toast('File tidak valid');
      }
    };
    r.readAsText(f);
  }
});
if ('serviceWorker' in navigator)
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
// ===== Sambungan online: pesanan pelanggan lewat Firebase Realtime Database =====
const rnd = () => Math.random().toString(36).slice(2, 10);
S.key = S.key || rnd();
S.db = S.db || '';
S.rec = S.rec || [];
S.banner = S.banner || '';
save();

IC.pesan = '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>';
IC.x = '<path d="M6 6l12 12M18 6L6 18"/>';
const MASCOT =
  '<svg class="mascot" viewBox="0 0 120 150"><path d="M30 78h60L60 142z" fill="#f0c27b"/><path d="M42 94l24 36M54 88l24 36M74 90L52 124" stroke="#d9a255" stroke-width="3" stroke-linecap="round"/><path d="M26 80c-6-30 12-52 34-52s40 22 34 52c-6 8-14 4-18 10-4-6-10 6-16 0-6 6-12-6-16 0-4-6-12-2-18-10z" fill="#ec5b8a"/><circle cx="48" cy="58" r="5" fill="#23302a"/><circle cx="72" cy="58" r="5" fill="#23302a"/><circle cx="50" cy="56" r="1.8" fill="#fff"/><circle cx="74" cy="56" r="1.8" fill="#fff"/><path d="M52 70q8 8 16 0" stroke="#23302a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="40" cy="68" r="5" fill="#ff9db9" opacity=".7"/><circle cx="80" cy="68" r="5" fill="#ff9db9" opacity=".7"/><circle cx="60" cy="26" r="9" fill="#d9363e"/><path d="M60 18c2-6 6-8 10-8" stroke="#2e6f52" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
const hero = () =>
  S.banner
    ? `<div class="hero"><img src="${S.banner}" alt=""></div>`
    : `<div class="hero m">${MASCOT}</div>`;

// Aksi yang mengubah menu (perlu dikirim ulang ke pelanggan) dan aksi yang tidak perlu render ulang
const MA = [
  'addprod',
  'eprod',
  'dprod',
  'addcat',
  'dcat',
  'addtop',
  'dtop',
  'savecfg',
  'loadmenu',
  'rmimg',
  'rmlogo',
  'rmbanner',
];
const NR = ['print', 'bk', 'rs', 'mkqr', 'pq', 'qf', 'showq', 'pf', 'lf', 'bf', 'sync'];

const dbu = (p) => `${S.db.replace(/\/+$/, '')}/${S.key}/${p}.json`;
const fb = async (p, method = 'GET', body) => {
  const ac = new AbortController(),
    tm = setTimeout(() => ac.abort(), 10000);
  try {
    const r = await fetch(dbu(p), {
      method,
      signal: ac.signal,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally {
    clearTimeout(tm);
  }
};
const menuData = () => ({
  biz: S.biz,
  wa: S.wa || '',
  logo: S.logo || '',
  banner: S.banner || '',
  tops: S.tops,
  cats: S.cats,
  prods: S.prods.map((p) => ({ n: p.n, pr: p.pr, c: p.c, img: p.img || '' })),
  upd: Date.now(),
});
let mt;
const msync = () => {
  if (!S.db) return;
  clearTimeout(mt);
  mt = setTimeout(
    () => fb('menu', 'PUT', menuData()).catch(() => toast('Menu belum terkirim (cek internet)')),
    1500,
  );
};

let ORD = [],
  newCount = 0;
const lines = (o) => Object.values(o.l || []);
const beep = () => {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(),
      o = c.createOscillator(),
      g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    o.start();
    o.stop(c.currentTime + 0.5);
  } catch (e) {}
  navigator.vibrate && navigator.vibrate([120, 60, 120]);
};
async function pull() {
  if (!S.db || !me) return;
  try {
    const o = (await fb('orders')) || {};
    ORD = Object.entries(o)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.t - b.t);
    ORD.forEach((x) => {
      if (S.rec.includes(x.id) && x.s !== 'selesai')
        fb('orders/' + x.id, 'PATCH', { s: 'selesai', done: Date.now() }).catch(() => {});
      if ((x.s === 'selesai' || x.s === 'batal') && Date.now() - (x.done || x.t) > 864e5)
        fb('orders/' + x.id, 'DELETE').catch(() => {});
    });
    const act = ORD.filter((x) => x.s === 'baru' && !S.rec.includes(x.id));
    if (act.length > newCount) {
      beep();
      toast('Pesanan baru masuk!');
    }
    newCount = act.length;
    const nb = document.querySelector('.nb');
    if (nb) {
      nb.textContent = newCount;
      nb.hidden = !newCount;
    }
    if (tab === 'pesan') {
      const m = $('main');
      if (m) m.innerHTML = V.pesan();
    }
  } catch (e) {}
}
setInterval(pull, 8000);

const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  return m < 1 ? 'baru saja' : m + ' menit lalu';
};
const oCard = (o) => {
  const L = lines(o),
    est = L.reduce((a, l) => a + l.p * l.q, 0);
  return `<div class="card ord ${o.s}"><div class="oh"><b>${esc(o.n)}</b><span class="tag ${o.s}">${o.s === 'baru' ? 'Baru' : 'Diproses'}</span></div><small class="mut">${ago(o.t)} · ${esc(o.pay)}</small>${L.map((l) => `<div class="li"><div>${l.q}× ${esc(l.n)}<small>${l.t ? '+ ' + esc(Object.values(l.t).join(', ')) : 'Tanpa topping'}${l.c ? ' · ' + esc(l.c) : ''}</small></div><b>${l.p ? rp(l.p * l.q) : '-'}</b></div>`).join('')}<div class="li"><b>Perkiraan total</b><b>${rp(est)}</b></div><div class="row">${o.s === 'baru' ? `<button class="btn s" data-a="oproc" data-v="${o.id}">Proses</button>` : `<button class="btn" data-a="odone" data-v="${o.id}">Selesai &amp; catat</button>`}<button class="btn g fx" style="width:auto" data-a="ocancel" data-v="${o.id}">${ic('trash')}</button></div></div>`;
};
V.pesan = () => {
  if (!S.db)
    return `<div class="card empty">${MASCOT}<h2>Pesanan online belum aktif</h2><p class="mut">Sambungkan dulu di menu Kelola agar pesanan pelanggan masuk ke sini.</p>${owner() ? '<button class="btn" data-a="tab" data-v="set">Buka Kelola</button>' : ''}</div>`;
  const act = ORD.filter((o) => !S.rec.includes(o.id) && (o.s === 'baru' || o.s === 'proses'));
  const done = S.tx.filter((t) => t.d === today() && t.from).length;
  return (
    `<div class="card"><h2>Pesanan masuk</h2><p class="mut" style="margin:0">Selesai hari ini: ${done} pesanan · diperbarui otomatis</p></div>` +
    (act.length
      ? act.map(oCard).join('')
      : `<div class="card empty">${MASCOT}<h2>Belum ada pesanan</h2><p class="mut">Pesanan dari QR akan muncul di sini.</p></div>`)
  );
};

A.oproc = (id) => {
  const o = ORD.find((x) => x.id === id);
  if (!o) return;
  o.s = 'proses';
  fb('orders/' + id, 'PATCH', { s: 'proses' }).catch(() =>
    toast('Gagal memperbarui (cek internet)'),
  );
};
A.ocancel = (id) => {
  if (!confirm('Tolak dan hapus pesanan ini?')) return;
  ORD = ORD.filter((x) => x.id !== id);
  fb('orders/' + id, 'PATCH', { s: 'batal', done: Date.now() }).catch(() => {});
  newCount = ORD.filter((x) => x.s === 'baru' && !S.rec.includes(x.id)).length;
};
A.odone = (id) => {
  const o = ORD.find((x) => x.id === id);
  if (!o) return;
  const L = lines(o),
    est = L.reduce((a, l) => a + l.p * l.q, 0),
    v = prompt('Total akhir pesanan ' + o.n + ' (Rp):', est || '');
  if (v === null) return;
  const total = +v;
  if (!(total > 0)) return toast('Isi total yang benar');
  const w = L.map((l) => l.p * l.q || l.q),
    sw = w.reduce((a, b) => a + b, 0);
  let left = total;
  L.forEach((l, k) => {
    const prod = S.prods.find((p) => p.n === l.n),
      amt = k === L.length - 1 ? left : Math.round((total * w[k]) / sw);
    left -= amt;
    if (prod) {
      if (prod.ice) S.portions -= l.q;
      else if (prod.st != null) prod.st -= l.q;
    }
    S.tx.push({
      id: S.nid++,
      t: Date.now(),
      d: today(),
      u: me.n,
      pid: prod ? prod.id : 0,
      p: l.n,
      q: l.q,
      amt,
      pay: o.pay,
      tops: l.t ? Object.values(l.t) : [],
      ice: prod ? prod.ice : 0,
      from: 'QR',
      oid: id,
    });
  });
  S.rec.push(id);
  o.s = 'selesai';
  save();
  fb('orders/' + id, 'PATCH', { s: 'selesai', done: Date.now() }).catch(() => {});
  newCount = ORD.filter((x) => x.s === 'baru' && !S.rec.includes(x.id)).length;
  pop();
  toast('Dicatat ke penjualan ✓');
};
A.sync = async () => {
  const v = $('#dburl').value.trim().replace(/\/+$/, '');
  if (!/^https:\/\/[^/\s]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(v))
    return toast('Alamat database tidak valid');
  S.db = v;
  save();
  toast('Menghubungkan...');
  try {
    await fb('menu', 'PUT', menuData());
    toast('Tersambung dan menu terkirim ✓');
    pull();
  } catch (e) {
    toast('Gagal tersambung. Cek alamat dan aturan database');
  }
  render();
};
A.unsync = () => {
  if (confirm('Putuskan sambungan online? Pesanan online berhenti masuk.')) {
    S.db = '';
    save();
  }
};
A.rmimg = (v) => {
  delete P(v).img;
  save();
};
A.rmlogo = () => {
  S.logo = '';
  save();
};
A.rmbanner = () => {
  S.banner = '';
  save();
};
A.bf = () => $('#bf').click();
A.mkqr = () => {
  S.wa = ($('#wa').value || '').replace(/\D/g, '').replace(/^0/, '62');
  S.base = $('#base').value.trim();
  let u;
  try {
    u = new URL(S.base || defBase());
  } catch (x) {
    return toast('Alamat tidak valid');
  }
  if (S.db) u.search = new URLSearchParams({ db: S.db.replace(/\/+$/, ''), k: S.key });
  else {
    if (S.wa.length < 9) return toast('Isi nomor WhatsApp dulu');
    u.search = new URLSearchParams({
      b: S.biz,
      w: S.wa,
      m: S.prods.map((p) => p.n + '~' + p.pr + '~' + Math.max(0, S.cats.indexOf(p.c))).join('|'),
      c: S.cats.join('|'),
      t: S.tops.join('|'),
    });
  }
  save();
  if (S.db) msync();
  const q = qrcode(0, 'L');
  q.addData(u.href);
  q.make();
  const b = $('#qrbox');
  b.innerHTML = q.createSvgTag(4, 4);
  const s = b.firstChild;
  s.removeAttribute('height');
  s.style.cssText = 'width:100%;max-width:320px';
  b.insertAdjacentHTML(
    'beforeend',
    '<p class="mut" style="font-size:13px;word-break:break-all">' +
      esc(u.href) +
      '</p><button class="btn s" data-a="pq">' +
      ic('print') +
      ' Cetak QR</button>',
  );
};
const baseLogin = A.login;
A.login = () => {
  baseLogin();
  if (me) setTimeout(pull, 400);
};

// ===== Laporan PDF (dibuat langsung di aplikasi, tanpa jendela cetak) =====
NR.push('pdf', 'pdfshare');
const pdfClean = (s) => String(s).replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
const pdfEsc = (s) => pdfClean(s).replace(/([\\()])/g, '\\$1');
const pdfW = (s, sz) => {
  let w = 0;
  for (const c of pdfClean(s))
    w +=
      c === ' ' || c === '.' || c === ','
        ? 0.278
        : /\d/.test(c)
          ? 0.556
          : c === 'R'
            ? 0.722
            : c === '-'
              ? 0.333
              : 0.52;
  return w * sz;
};
const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
function reportData(d) {
  const t = S.tx.filter((x) => x.d === d),
    e = S.ex.filter((x) => x.d === d),
    sum = (l, f) => l.reduce((a, x) => a + (f ? f(x) : x.amt), 0),
    tn = sum(t.filter((x) => x.pay === 'Tunai')),
    qr = sum(t.filter((x) => x.pay === 'QRIS'));
  return {
    t,
    e,
    tn,
    qr,
    om: tn + qr,
    bi: sum(e),
    lb: tn + qr - sum(e),
    items: sum(t, (x) => x.q),
    qrx: sum(t.filter((x) => x.from)),
  };
}
function buildPDF(d) {
  const R = reportData(d),
    pages = [],
    M = 40,
    RX = 555;
  let s, y;
  const T = (str, x, yy, sz, bold, c) =>
    s.push(
      `${(c || [0.14, 0.19, 0.16]).join(' ')} rg BT /F${bold ? 2 : 1} ${sz} Tf ${x.toFixed(1)} ${yy} Td (${pdfEsc(str)}) Tj ET`,
    );
  const RA = (str, xr, yy, sz, bold, c) => T(str, xr - pdfW(str, sz), yy, sz, bold, c);
  const rule = (yy) => s.push(`0.85 0.89 0.87 RG 0.6 w ${M} ${yy} m ${RX} ${yy} l S`);
  const newPage = (first) => {
    s = [];
    pages.push(s);
    if (first) {
      s.push('0.18 0.44 0.32 rg 0 780 595 62 re f');
      T(S.biz, M, 812, 20, 1, [1, 1, 1]);
      T('Laporan harian · ' + d, M, 792, 11, 0, [1, 1, 1]);
      y = 750;
    } else {
      T(S.biz + ' · Laporan ' + d + ' (lanjutan)', M, 810, 10, 0, [0.43, 0.5, 0.46]);
      y = 785;
    }
  };
  const need = () => {
    if (y < 62) newPage(false);
  };
  newPage(true);
  const sumRows = [
    ['Penjualan tunai', rp(R.tn)],
    ['Penjualan QRIS', rp(R.qr)],
    ['Total penjualan', rp(R.om), 1],
    ['Pengeluaran', rp(R.bi)],
    ['Laba bersih', rp(R.lb), 1, R.lb < 0 ? [0.85, 0.21, 0.24] : [0.18, 0.44, 0.32]],
    ['Jumlah transaksi', String(R.t.length)],
    ['Item terjual', String(R.items)],
    ['Dari pesan QR', rp(R.qrx)],
  ];
  sumRows.forEach((r) => {
    T(r[0], M, y, 11, r[2], r[3]);
    RA(r[1], RX, y, 11, r[2], r[3]);
    y -= 6;
    rule(y);
    y -= 14;
  });
  y -= 8;
  T('Penjualan', M, y, 13, 1);
  y -= 18;
  const gray = [0.43, 0.5, 0.46];
  T('Jam', M, y, 9, 0, gray);
  T('Item', 82, y, 9, 0, gray);
  T('Bayar', 385, y, 9, 0, gray);
  T('Petugas', 435, y, 9, 0, gray);
  RA('Jumlah', RX, y, 9, 0, gray);
  y -= 6;
  rule(y);
  y -= 14;
  if (!R.t.length) {
    T('Tidak ada penjualan.', M, y, 10, 0, gray);
    y -= 18;
  }
  R.t.forEach((t) => {
    need();
    T(new Date(t.t).toTimeString().slice(0, 5), M, y, 9.5);
    T(
      clip(t.q + 'x ' + t.p + (t.tops && t.tops.length ? ' (+' + t.tops.join(', ') + ')' : ''), 56),
      82,
      y,
      9.5,
    );
    T(t.pay, 385, y, 9.5);
    T(clip(t.u, 14), 435, y, 9.5);
    RA(rp(t.amt), RX, y, 9.5);
    y -= 16;
  });
  y -= 10;
  need();
  T('Pengeluaran', M, y, 13, 1);
  y -= 20;
  if (!R.e.length) T('Tidak ada pengeluaran.', M, y, 10, 0, gray);
  R.e.forEach((x) => {
    need();
    T(clip(x.c + (x.note ? ' - ' + x.note : ''), 80), M, y, 9.5);
    RA(rp(x.amt), RX, y, 9.5);
    y -= 16;
  });
  const now = new Date().toLocaleString('id-ID');
  pages.forEach((p, i) => {
    s = p;
    T(S.biz + ' · dicetak oleh ' + (me ? me.n : '-') + ' · ' + now, M, 26, 8, 0, gray);
    RA('Hal ' + (i + 1) + '/' + pages.length, RX, 26, 8, 0, gray);
  });
  let out = '%PDF-1.4\n';
  const offs = [];
  const obj = (n, body) => {
    offs[n] = out.length;
    out += n + ' 0 obj\n' + body + '\nendobj\n';
  };
  obj(1, '<</Type/Catalog/Pages 2 0 R>>');
  obj(
    2,
    '<</Type/Pages/Count ' +
      pages.length +
      '/Kids[' +
      pages.map((_, i) => 5 + i * 2 + ' 0 R').join(' ') +
      ']>>',
  );
  obj(3, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>');
  obj(4, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>');
  pages.forEach((p, i) => {
    const c = p.join('\n');
    obj(
      5 + i * 2,
      '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ' +
        (6 + i * 2) +
        ' 0 R>>',
    );
    obj(6 + i * 2, '<</Length ' + c.length + '>>\nstream\n' + c + '\nendstream');
  });
  const n = 4 + pages.length * 2,
    xr = out.length;
  out += 'xref\n0 ' + (n + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= n; i++) out += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  return out + 'trailer\n<</Size ' + (n + 1) + '/Root 1 0 R>>\nstartxref\n' + xr + '\n%%EOF';
}
function savePDF(d, share) {
  const str = buildPDF(d),
    u = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) u[i] = str.charCodeAt(i) & 255;
  const blob = new Blob([u], { type: 'application/pdf' }),
    name = 'laporan-' + S.biz.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + d + '.pdf';
  if (share && navigator.canShare) {
    const f = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare({ files: [f] }))
      return navigator.share({ files: [f], title: name }).catch(() => {});
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(a.href);
  }, 4000);
  toast('PDF tersimpan di Unduhan ✓');
}
A.pdf = () => savePDF(rd);
A.pdfshare = () => savePDF(rd, true);

render();