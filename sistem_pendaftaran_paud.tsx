import React, { useState, useEffect, useRef } from "react";

const C = {
  green: "#2A7C6F", greenLight: "#3AAF9F", greenPale: "#E8F5F3",
  yellow: "#F5C842", yellowPale: "#FFFBEA",
  white: "#FFFFFF", gray100: "#F7F8FA", gray200: "#E8EAED",
  gray400: "#9AA0AB", gray700: "#3D4451", dark: "#1A2530",
  purple: "#7B5EA7", orange: "#FF8C42", blue: "#3B82F6",
};

const INITIAL_CLASSES = [
  { code: "PG", label: "Play Group (PG)", age: "2–3 tahun", quota: 20, color: "#FF8C42" },
  { code: "TKA", label: "TK A", age: "4–5 tahun", quota: 20, color: "#2A7C6F" },
  { code: "TKB", label: "TK B", age: "5–6 tahun", quota: 20, color: "#7B5EA7" },
];

const STATUS_LIST = [
  { label: "Menunggu Verifikasi", color: "#F59E0B", icon: "⏳" },
  { label: "Diterima", color: "#10B981", icon: "✅" },
  { label: "Wawancara", color: "#3B82F6", icon: "📞" },
  { label: "Daftar Ulang", color: "#8B5CF6", icon: "📋" },
  { label: "Verifikasi Dok", color: "#6366F1", icon: "🔍" },
  { label: "Menunggu Bayar", color: "#EAB308", icon: "💳" },
  { label: "Lunas", color: "#059669", icon: "🎓" },
  { label: "Ditolak", color: "#EF4444", icon: "❌" },
];

const DOCS_REQUIRED = [
  { key: "aktaLahir", label: "Foto Akta Kelahiran", icon: "📄" },
  { key: "kartuKeluarga", label: "Foto KK (Kartu Keluarga)", icon: "🏠" },
  { key: "ktpOrtu", label: "Foto KTP Orang Tua", icon: "🪪" },
  { key: "pasFoto", label: "Pas Foto Anak", icon: "📸" },
];

const WA_NUMBER = "6281234567890";
const ADMIN_PASS = "paud2025";
const SECRET_KEY = "pas-admin";

function calcAge(dob) {
  if (!dob) return "";
  const t = new Date(), b = new Date(dob);
  let y = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) { y--; m += 12; }
  if (m < 0) m += 12;
  return `${y} tahun ${m} bulan`;
}

function genNo(list) {
  return `PAS-${new Date().getFullYear()}-${(list.length + 1).toString().padStart(4, "0")}`;
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function formatWA(no) {
  let f = no.replace(/\D/g, "");
  if (f.startsWith("0")) f = "62" + f.slice(1);
  return f;
}

function formatRp(angka) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);
}

const inp_style = (err, focus) => ({
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1.5px solid ${err ? "#E05252" : focus ? C.greenLight : C.gray200}`,
  fontSize: 14, color: C.dark, boxSizing: "border-box", outline: "none", background: C.white,
});
const Btn = ({ children, onClick, style: sx = {}, disabled = false }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      background: `linear-gradient(135deg,${C.green},${C.greenLight})`, color: C.white, border: "none",
      borderRadius: 12, padding: "13px 20px", fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      width: "100%", boxShadow: "0 4px 14px rgba(42,124,111,0.25)", opacity: disabled ? 0.7 : 1, ...sx
    }}>
    {children}
  </button>
);
const Card = ({ children, style: sx = {} }) => (
  <div style={{
    background: C.white, borderRadius: 16, boxShadow: "0 2px 16px rgba(42,124,111,0.08)",
    padding: "24px 20px", marginBottom: 18, ...sx
  }}>{children}</div>
);
const SecTitle = ({ children }) => (
  <p style={{
    fontSize: 12, fontWeight: 700, color: C.greenLight, textTransform: "uppercase", letterSpacing: 1,
    borderBottom: `2px solid ${C.greenPale}`, paddingBottom: 8, marginBottom: 18, marginTop: 0
  }}>{children}</p>
);

const Field = ({ label, req, children, error }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.gray700, marginBottom: 5 }}>
      {label}{req && <span style={{ color: "#E05252", marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {error && <p style={{ color: "#E05252", fontSize: 12, marginTop: 4 }}>⚠ {error}</p>}
  </div>
);
const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, display: "inline-block" }}>{label}</span>
);
const BackBtn = ({ onClick, children = "← Kembali" }) => (
  <button onClick={onClick} style={{
    background: "none", border: `1.5px solid ${C.gray200}`, color: C.gray700,
    borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", marginTop: 12
  }}>{children}</button>
);

const BuktiPrint = ({ data, kelasData }) => {
  const cls = kelasData.find(c => c.code === data.kelas)?.label || data.kelas;
  return (
    <div id="print-area" style={{ display: "none", padding: 40, color: "#000", fontFamily: "sans-serif", position: "relative", backgroundColor: "#ffffff" }}>
      
      {/* Watermark Lunas */}
      <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%) rotate(-25deg)", fontSize: "100px", color: "rgba(5, 150, 105, 0.1)", fontWeight: 900, border: "10px solid rgba(5, 150, 105, 0.1)", padding: "20px 40px", borderRadius: "20px", zIndex: 0, pointerEvents: "none" }}>LUNAS</div>

      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 20, marginBottom: 20, position: "relative", zIndex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>PESANTREN ANAK SHOLEH</h1>
        <p style={{ margin: "5px 0 0" }}>Bukti Pendaftaran Siswa Baru TA 2025/2026</p>
      </div>
      <table style={{ width: "100%", fontSize: 16, lineHeight: 1.6, position: "relative", zIndex: 1 }}>
        <tbody>
          <tr><td style={{ width: 200, fontWeight: "bold" }}>No. Pendaftaran</td><td>: {data.noDaftar}</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>Nama Anak</td><td>: {data.namaAnak}</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>Tempat, Tgl Lahir</td><td>: {data.tempatLahir}, {data.tglLahir} ({data.usia})</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>Kelas</td><td>: {cls}</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>Nama Wali</td><td>: {data.namaAyah || data.namaIbu || "-"}</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>No. WhatsApp</td><td>: {data.noWA}</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>Tanggal Daftar</td><td>: {data.timestamp}</td></tr>
          <tr><td style={{ fontWeight: "bold" }}>Status Pembayaran</td><td>: <strong>LUNAS</strong></td></tr>
        </tbody>
      </table>
      <div style={{ marginTop: 40, borderTop: "1px dashed #000", paddingTop: 20, fontSize: 14, position: "relative", zIndex: 1 }}>
        <strong>Catatan:</strong> Dokumen ini merupakan bukti sah pendaftaran dan siswa telah menyelesaikan seluruh proses administrasi pendaftaran awal.
      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState("home");
  const [regs, setRegs] = useState([]);
  const [kelasData, setKelasData] = useState(INITIAL_CLASSES);
  const [successData, setSuc] = useState(null);
  const [adminPass, setAP] = useState("");
  const [adminAuth, setAA] = useState(false);
  const [apErr, setApErr] = useState("");
  const [clicks, setClicks] = useState(0);
  const [hint, setHint] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("key") === SECRET_KEY) setPage("login");
    } catch (e) { }
  }, []);

  const logoClick = () => {
    const n = clicks + 1; setClicks(n);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setClicks(0); setHint(false); }, 3000);
    if (n >= 3) setHint(true);
    if (n >= 5) { setClicks(0); setHint(false); setPage("login"); }
  };

  const quotaOf = code => regs.filter(r => r.kelas === code).length;

  const handleReg = data => {
    const no = genNo(regs);
    const rec = {
      ...data, noDaftar: no, timestamp: new Date().toLocaleString("id-ID"),
      status: "Menunggu Verifikasi", dokumen: null, rincianTagihan: []
    };
    setRegs(p => [...p, rec]); setSuc(rec); setPage("success");
  };

  const handleDaftarUlang = (noDaftar, dok) => {
    setRegs(p => p.map(r => r.noDaftar === noDaftar ? { ...r, dokumen: dok, status: "Verifikasi Dok" } : r));
    setPage("duSukses");
  };

  const doLogin = () => {
    if (adminPass === ADMIN_PASS) { setAA(true); setApErr(""); setPage("admin"); }
    else setApErr("Password salah.");
  };
  const doLogout = () => { setAA(false); setAP(""); setPage("home"); };

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", background: C.gray100, minHeight: "100vh", color: C.dark }}>
      <header style={{
        background: `linear-gradient(135deg,${C.green},${C.greenLight})`, padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 62,
        boxShadow: "0 2px 8px rgba(42,124,111,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "default", userSelect: "none" }} onClick={logoClick}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%", background: C.yellow, display: "flex",
            alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: C.green,
            flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            transform: clicks > 0 ? "scale(0.9)" : "scale(1)", transition: "transform 0.1s",
            outline: hint ? "2px solid rgba(255,255,255,0.4)" : "none"
          }}>PAS</div>
          <div style={{ color: C.white }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Pesantren Anak Sholeh</p>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.85 }}>PAUD Islami Terpercaya{hint && <span style={{ opacity: 0.5, marginLeft: 4 }}>{"·".repeat(clicks)}</span>}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {page === "admin" && <button onClick={doLogout} style={{ background: "rgba(255,80,80,0.2)", border: "1px solid rgba(255,150,150,0.4)", color: C.white, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Keluar Admin</button>}
          {["success", "daftarUlang", "duSukses", "cekStatus"].includes(page) &&
            <button onClick={() => setPage("home")} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)", color: C.white, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🏠 Beranda</button>}
        </div>
      </header>

      {page === "home" && <HomePage setPage={setPage} quotaOf={quotaOf} kelasData={kelasData} />}
      {page === "form" && <FormPage onSubmit={handleReg} quotaOf={quotaOf} kelasData={kelasData} onBack={() => setPage("home")} />}
      {page === "success" && successData && <SuccessPage data={successData} kelasData={kelasData} onBack={() => setPage("home")} />}
      {page === "daftarUlang" && <DaftarUlangPage regs={regs} kelasData={kelasData} onSubmit={handleDaftarUlang} onBack={() => setPage("home")} />}
      {page === "duSukses" && <DUSuksesPage onBack={() => setPage("home")} />}
      {page === "cekStatus" && <CekStatusPage regs={regs} kelasData={kelasData} onBack={() => setPage("home")} />}

      {page === "login" && (
        <div style={{ maxWidth: 360, margin: "80px auto", background: C.white, borderRadius: 16, padding: "36px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
          <h2 style={{ color: C.green, marginTop: 0, marginBottom: 4 }}>Panel Admin</h2>
          <p style={{ fontSize: 13, color: C.gray400, margin: "0 0 20px" }}>Pesantren Anak Sholeh</p>
          <input type="password" placeholder="Password admin" value={adminPass}
            onChange={e => { setAP(e.target.value); setApErr(""); }}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            style={{ ...inp_style(apErr, false), marginBottom: 8, textAlign: "center", letterSpacing: 3 }} autoFocus />
          {apErr && <p style={{ color: "#E05252", fontSize: 12, marginBottom: 8 }}>⚠ {apErr}</p>}
          <Btn onClick={doLogin} style={{ marginTop: 8 }}>Masuk ke Dashboard</Btn>
          <br /><BackBtn onClick={() => { setPage("home"); setAP(""); setApErr(""); }}>← Kembali</BackBtn>
        </div>
      )}

      {page === "admin" && adminAuth && <AdminPage regs={regs} setRegs={setRegs} quotaOf={quotaOf} kelasData={kelasData} setKelasData={setKelasData} />}
      {page === "admin" && !adminAuth && (
        <div style={{ textAlign: "center", padding: "80px 24px", color: C.gray400 }}>
          <div style={{ fontSize: 48 }}>🚫</div><p>Halaman tidak ditemukan.</p>
          <BackBtn onClick={() => setPage("home")} />
        </div>
      )}
    </div>
  );
}

function HomePage({ setPage, quotaOf, kelasData }) {
  return (
    <>
      <div style={{ background: C.greenPale, borderBottom: `3px solid ${C.yellow}`, padding: "36px 20px 28px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.green, margin: "0 0 8px" }}>🌙 Pendaftaran Siswa Baru</h1>
        <p style={{ fontSize: 14, color: C.gray700, margin: "0 0 20px", lineHeight: 1.6 }}>Tahun Ajaran 2025/2026<br />Membentuk Generasi Qurani sejak Dini</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {kelasData.map(c => {
            const cnt = quotaOf(c.code), full = cnt >= c.quota;
            return (
              <div key={c.code} style={{ background: C.white, border: `2px solid ${full ? C.gray400 : c.color}`, borderRadius: 12, padding: "10px 18px", textAlign: "center", minWidth: 90 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: full ? C.gray400 : c.color, margin: 0 }}>{c.code}</p>
                <p style={{ fontSize: 11, color: C.gray700, margin: "2px 0" }}>{c.label.replace(`(${c.code})`, "").trim()}</p>
                <p style={{ fontSize: 10, color: C.gray400, margin: "2px 0 0" }}>{c.age}</p>
                <p style={{ fontSize: 11, color: full ? "#EF4444" : C.green, fontWeight: 700, margin: "4px 0 0" }}>{full ? "PENUH" : `${cnt}/${c.quota}`}</p>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
          <button onClick={() => setPage("form")} style={{ background: `linear-gradient(135deg,${C.green},${C.greenLight})`, color: C.white, border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(42,124,111,0.25)" }}>📝 Daftar Sekarang</button>
          <button onClick={() => setPage("daftarUlang")} style={{ background: "linear-gradient(135deg,#7B5EA7,#8B5CF6)", color: C.white, border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(123,94,167,0.25)" }}>🔄 Daftar Ulang</button>
          <button onClick={() => setPage("cekStatus")} style={{ background: C.white, color: C.green, border: `2px solid ${C.greenLight}`, borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🔍 Cek Status</button>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "🕌", title: "Berbasis Pesantren", desc: "Kurikulum islami terpadu dengan hafalan dan akhlak" },
            { icon: "👩‍🏫", title: "Guru Berpengalaman", desc: "Tenaga pendidik bersertifikat dan berdedikasi" },
            { icon: "🎮", title: "Belajar Sambil Bermain", desc: "Metode play-based learning sesuai usia anak" },
            { icon: "📱", title: "Laporan ke Orang Tua", desc: "Update perkembangan anak via WhatsApp" },
          ].map(x => (
            <div key={x.title} style={{ background: C.white, borderRadius: 12, padding: "14px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{x.icon}</div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: C.green }}>{x.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.gray400, lineHeight: 1.5 }}>{x.desc}</p>
            </div>
          ))}
        </div>
        <Card style={{ marginTop: 18 }}>
          <SecTitle>Alur Pendaftaran</SecTitle>
          {[
            { n: "1", t: "Isi Formulir Online", d: "Lengkapi data anak dan orang tua" },
            { n: "2", t: "Konfirmasi via WhatsApp", d: "Kirim konfirmasi ke nomor WA sekolah" },
            { n: "3", t: "Verifikasi & Wawancara", d: "Tim sekolah akan menghubungi Anda" },
            { n: "4", t: "Daftar Ulang & Pembayaran", d: "Upload dokumen dan tunggu tagihan biaya pendidikan" },
          ].map(step => (
            <div key={step.n} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.green, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{step.n}</div>
              <div><p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13 }}>{step.t}</p><p style={{ margin: 0, fontSize: 12, color: C.gray400 }}>{step.d}</p></div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function FormPage({ onSubmit, quotaOf, kelasData, onBack }) {
  const [form, setForm] = useState({ namaAnak: "", tempatLahir: "", tglLahir: "", jk: "", kelas: "", alamat: "", namaAyah: "", namaIbu: "", noWA: "", pekerjaan: "", asalSekolah: "", infoFrom: "", catatan: "" });
  const [err, setErr] = useState({});
  const [foc, setFoc] = useState("");
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErr(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.namaAnak) e.namaAnak = "Nama anak wajib diisi";
    if (!form.tempatLahir) e.tempatLahir = "Tempat lahir wajib diisi";
    if (!form.tglLahir) e.tglLahir = "Tanggal lahir wajib diisi";
    if (!form.jk) e.jk = "Jenis kelamin wajib dipilih";
    if (!form.kelas) e.kelas = "Tingkatan kelas wajib dipilih";
    
    let tel = form.noWA.replace(/\D/g, "");
    if (!tel) e.noWA = "Nomor WA wajib diisi";
    else if (tel.length < 9 || tel.length > 15) e.noWA = "Format: 08xxxxxxxxxx atau 628xxxxxxxx";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErr(e); return; }
    const cls = kelasData.find(c => c.code === form.kelas);
    if (quotaOf(form.kelas) >= cls.quota) { setErr({ kelas: `Kuota ${cls.label} penuh!` }); return; }
    // Normalisasi nomor sebelum disubmit
    onSubmit({ ...form, noWA: formatWA(form.noWA), usia: calcAge(form.tglLahir) });
  };

  const I = (k) => ({ value: form[k] || "", onChange: e => set(k, e.target.value), onFocus: () => setFoc(k), onBlur: () => setFoc(""), style: inp_style(err[k], foc === k) });
  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.dark }}>←</button>
        <div><h2 style={{ margin: 0, fontSize: 19, color: C.dark }}>Formulir Pendaftaran</h2><p style={{ margin: 0, fontSize: 12, color: C.gray400 }}>Pesantren Anak Sholeh · TA 2025/2026</p></div>
      </div>

      <Card>
        <SecTitle>👶 Data Anak</SecTitle>
        <Field label="Nama Lengkap Anak" req error={err.namaAnak}><input type="text" placeholder="Nama lengkap anak" {...I("namaAnak")} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Tempat Lahir" req error={err.tempatLahir}><input type="text" placeholder="Kota / Kabupaten" {...I("tempatLahir")} /></Field>
          <Field label="Tanggal Lahir" req error={err.tglLahir}>
            <input type="date" max={today} {...I("tglLahir")} />
            {form.tglLahir && <span style={{ display: "inline-block", background: C.greenPale, color: C.green, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, marginTop: 6 }}>🎂 {calcAge(form.tglLahir)}</span>}
          </Field>
        </div>
        <Field label="Jenis Kelamin" req error={err.jk}>
          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            {["Laki-laki", "Perempuan"].map(g => (
              <label key={g} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
                <input type="radio" name="jk" value={g} checked={form.jk === g} onChange={() => set("jk", g)} style={{ accentColor: C.green }} />
                {g === "Laki-laki" ? "👦" : "👧"} {g}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Tingkatan Kelas" req error={err.kelas}>
          <select value={form.kelas} onChange={e => set("kelas", e.target.value)} style={{ ...inp_style(err.kelas, false) }}>
            <option value="">-- Pilih Tingkatan --</option>
            {kelasData.map(c => { const full = quotaOf(c.code) >= c.quota; return <option key={c.code} value={c.code} disabled={full}>{c.label} · {c.age}{full ? " (PENUH)" : ""}</option>; })}
          </select>
        </Field>
        <Field label="Alamat Rumah">
          <textarea value={form.alamat} onChange={e => set("alamat", e.target.value)} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..." style={{ ...inp_style(false, false), resize: "vertical", minHeight: 70, fontFamily: "inherit" }} />
        </Field>
      </Card>

      <Card>
        <SecTitle>👨‍👩‍👧 Data Orang Tua / Wali</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Nama Ayah"><input type="text" placeholder="Nama ayah" {...I("namaAyah")} /></Field>
          <Field label="Nama Ibu"><input type="text" placeholder="Nama ibu" {...I("namaIbu")} /></Field>
        </div>
        <Field label="No. WhatsApp Aktif" req error={err.noWA}><input type="tel" placeholder="08xxxxxxxxxx" {...I("noWA")} /></Field>
        <Field label="Pekerjaan"><input type="text" placeholder="Wiraswasta, PNS, dll." {...I("pekerjaan")} /></Field>
        <Field label="Asal Sekolah Sebelumnya"><input type="text" placeholder="Kosongkan jika belum pernah sekolah" {...I("asalSekolah")} /></Field>
      </Card>

      <Card>
        <SecTitle>📋 Informasi Tambahan</SecTitle>
        <Field label="Mengetahui sekolah ini dari">
          <select value={form.infoFrom} onChange={e => set("infoFrom", e.target.value)} style={inp_style(false, false)}>
            <option value="">-- Pilih --</option>
            {["Teman / Keluarga", "Media Sosial", "Spanduk / Brosur", "Lainnya"].map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Catatan / Pertanyaan">
          <textarea value={form.catatan} onChange={e => set("catatan", e.target.value)} placeholder="Pertanyaan atau info tambahan..." style={{ ...inp_style(false, false), resize: "vertical", minHeight: 70, fontFamily: "inherit" }} />
        </Field>
      </Card>

      <Btn onClick={submit}>✅ Kirim Pendaftaran</Btn>
      <p style={{ textAlign: "center", fontSize: 11, color: C.gray400, marginTop: 10 }}>Dengan mendaftar, Anda menyetujui penggunaan data untuk keperluan administrasi sekolah.</p>
    </div>
  );
}

function SuccessPage({ data, kelasData, onBack }) {
  const cls = kelasData.find(c => c.code === data.kelas);
  
  const sendWA = () => {
    const msg = `Assalamu'alaikum, Pesantren Anak Sholeh 🌙\n\nKonfirmasi pendaftaran:\n📋 *No. Daftar:* ${data.noDaftar}\n👶 *Nama Anak:* ${data.namaAnak}\n🏫 *Kelas:* ${cls?.label}\n\nMohon konfirmasi. Terima kasih! 🙏`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 60px" }}>
      <Card style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.green, margin: "0 0 8px" }}>Pendaftaran Berhasil!</h2>
        <p style={{ color: C.gray700, fontSize: 14, margin: "0 0 16px" }}>Alhamdulillah, data <strong>{data.namaAnak}</strong> berhasil kami terima.</p>
        <div style={{ background: C.greenPale, border: `2px dashed ${C.greenLight}`, borderRadius: 12, padding: "14px 24px", margin: "16px 0", display: "inline-block" }}>
          <p style={{ fontSize: 12, color: C.gray400, margin: 0 }}>Nomor Pendaftaran</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.green, margin: "4px 0 0", letterSpacing: 1 }}>{data.noDaftar}</p>
        </div>
        <div style={{ background: C.gray100, borderRadius: 12, padding: "14px 18px", textAlign: "left", margin: "14px 0" }}>
          {[["👶 Nama Anak", data.namaAnak], ["🏫 Kelas", cls?.label], ["📅 Tgl Lahir", `${data.tglLahir} (${data.usia})`], ["📱 No. WA", data.noWA], ["📋 Status", data.status]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.gray200}`, fontSize: 13 }}>
              <span style={{ color: C.gray400, fontWeight: 500 }}>{k}</span>
              <span style={{ color: C.dark, fontWeight: 600, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.yellowPale, border: `1px solid ${C.yellow}`, borderRadius: 10, padding: "12px 16px", textAlign: "left", fontSize: 13, color: C.gray700 }}>
          <strong>📌 Langkah Selanjutnya:</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Simpan nomor pendaftaran Anda untuk melakukan cek status.</li>
            <li>Klik tombol WhatsApp di bawah untuk konfirmasi</li>
            <li>Tim kami menghubungi dalam 1×24 jam</li>
            <li>Jika diterima, Anda akan mendapat link Daftar Ulang</li>
          </ol>
        </div>
        <button onClick={sendWA} style={{ background: "#25D366", color: C.white, border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, margin: "18px auto 0", boxShadow: "0 4px 12px rgba(37,211,102,0.3)" }}>
          <span style={{ fontSize: 20 }}>💬</span> Konfirmasi via WhatsApp
        </button>
        {/* Tombol cetak tidak dirender di sini karena status belum lunas */}
        <br /><BackBtn onClick={onBack}>← Kembali ke Beranda</BackBtn>
      </Card>
    </div>
  );
}

function DaftarUlangPage({ regs, kelasData, onSubmit, onBack }) {
  const [step, setStep] = useState(1);
  const [noInput, setNoInput] = useState("");
  const [found, setFound] = useState(null);
  const [cariErr, setCariErr] = useState("");
  const [docs, setDocs] = useState({ aktaLahir: null, kartuKeluarga: null, ktpOrtu: null, pasFoto: null });
  const [prev, setPrev] = useState({});
  const [namaWali, setNW] = useState("");
  const [noHP, setNH] = useState("");
  const [catatan, setCat] = useState("");
  const [err, setErr] = useState({});
  const [loading, setLoad] = useState(false);

  const cari = () => {
    setCariErr(""); setErr({});
    const r = regs.find(x => x.noDaftar.toLowerCase() === noInput.trim().toLowerCase());
    if (!r) { setCariErr("Nomor pendaftaran tidak ditemukan."); return; }
    if (!["Diterima", "Daftar Ulang"].includes(r.status)) { setCariErr(`Status Anda saat ini: "${r.status}". Daftar ulang tersedia setelah diterima.`); return; }
    if (r.dokumen) { setCariErr("Daftar ulang untuk nomor ini sudah pernah dikirim."); return; }
    setFound(r); setStep(2);
  };

  const handleFile = async (key, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr(p => ({ ...p, [key]: "Ukuran maks 5MB" })); return; }
    setErr(p => ({ ...p, [key]: "" }));
    setDocs(p => ({ ...p, [key]: file }));
    const b64 = await fileToBase64(file);
    setPrev(p => ({ ...p, [key]: b64 }));
  };

  const kirim = async () => {
    const e = {};
    DOCS_REQUIRED.forEach(d => { if (!docs[d.key]) e[d.key] = `${d.label} wajib diupload`; });
    
    let tel = noHP.replace(/\D/g, "");
    if (!tel) e.noHP = "Nomor HP wajib diisi";
    else if (tel.length < 9) e.noHP = "Nomor tidak valid";

    if (!namaWali) e.namaWali = "Nama wali wajib diisi";
    if (Object.keys(e).length) { setErr(e); return; }
    setLoad(true);
    await new Promise(r => setTimeout(r, 800));
    onSubmit(found.noDaftar, { ...prev, namaWali, noHP: formatWA(noHP), catatan, timestamp: new Date().toLocaleString("id-ID") });
    setLoad(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>←</button>
        <div><h2 style={{ margin: 0, fontSize: 19 }}>🔄 Daftar Ulang Online</h2><p style={{ margin: 0, fontSize: 12, color: C.gray400 }}>Upload dokumen persyaratan secara online</p></div>
      </div>

      {step === 1 && (
        <Card>
          <SecTitle>🔍 Masukkan Nomor Pendaftaran</SecTitle>
          <div style={{ background: C.yellowPale, border: `1px solid ${C.yellow}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: C.gray700, marginBottom: 18 }}>
            <strong>📌 Info:</strong> Daftar ulang hanya bisa dilakukan setelah status berubah menjadi <strong>"Diterima"</strong> atau <strong>"Daftar Ulang"</strong>.
          </div>
          <Field label="Nomor Pendaftaran" req error={cariErr}>
            <input type="text" placeholder="Contoh: PAS-2025-0001" value={noInput}
              onChange={e => { setNoInput(e.target.value.toUpperCase()); setCariErr(""); }}
              onKeyDown={e => e.key === "Enter" && cari()}
              style={{ ...inp_style(cariErr, false), letterSpacing: 1, fontWeight: 700 }} />
          </Field>
          <Btn onClick={cari}>🔍 Cari Data Pendaftaran</Btn>
        </Card>
      )}

      {step === 2 && found && (
        <>
          <div style={{ background: C.greenPale, border: `2px solid ${C.greenLight}`, borderRadius: 16, padding: "20px", marginBottom: 18 }}>
            <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 1 }}>✅ Data Ditemukan</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["No. Daftar", found.noDaftar], ["Nama Anak", found.namaAnak], ["Kelas", kelasData.find(c => c.code === found.kelas)?.label], ["Status", found.status]].map(([k, v]) => (
                <div key={k}><p style={{ margin: 0, fontSize: 11, color: C.gray400 }}>{k}</p><p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700 }}>{v}</p></div>
              ))}
            </div>
          </div>

          <Card>
            <SecTitle>📎 Upload Dokumen Persyaratan</SecTitle>
            <p style={{ fontSize: 12, color: C.gray400, margin: "-12px 0 18px" }}>Format: JPG, PNG, PDF · Maks. 5MB per file</p>
            {DOCS_REQUIRED.map(doc => (
              <Field key={doc.key} label={`${doc.icon} ${doc.label}`} req error={err[doc.key]}>
                <UploadBox docKey={doc.key} file={docs[doc.key]} preview={prev[doc.key]} onChange={handleFile} />
              </Field>
            ))}
          </Card>

          <Card>
            <SecTitle>👤 Konfirmasi Data Wali</SecTitle>
            <Field label="Nama Lengkap Wali" req error={err.namaWali}>
              <input type="text" placeholder="Nama ayah atau ibu" value={namaWali}
                onChange={e => { setNW(e.target.value); setErr(p => ({ ...p, namaWali: "" })); }}
                style={inp_style(err.namaWali, false)} />
            </Field>
            <Field label="Nomor HP Aktif" req error={err.noHP}>
              <input type="tel" placeholder="08xxxxxxxxxx" value={noHP}
                onChange={e => { setNH(e.target.value); setErr(p => ({ ...p, noHP: "" })); }}
                style={inp_style(err.noHP, false)} />
            </Field>
            <Field label="Catatan Tambahan">
              <textarea value={catatan} onChange={e => setCat(e.target.value)}
                placeholder="Informasi tambahan untuk sekolah..."
                style={{ ...inp_style(false, false), resize: "vertical", minHeight: 70, fontFamily: "inherit" }} />
            </Field>
          </Card>

          <Btn onClick={kirim} disabled={loading}>{loading ? "⏳ Mengirim..." : "📤 Kirim Dokumen Daftar Ulang"}</Btn>
          <BackBtn onClick={() => setStep(1)}>← Ganti Nomor Pendaftaran</BackBtn>
        </>
      )}
    </div>
  );
}

function UploadBox({ docKey, file, preview, onChange }) {
  const ref = useRef();
  const isImg = file && file.type.startsWith("image/");
  const isPDF = file && file.type === "application/pdf";
  return (
    <div onClick={() => ref.current.click()}
      style={{
        border: `2px dashed ${file ? C.green : C.gray200}`, borderRadius: 12, padding: "18px 14px",
        textAlign: "center", cursor: "pointer", background: file ? C.greenPale : C.gray100, transition: "all 0.2s"
      }}>
      <input ref={ref} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
        onChange={e => onChange(docKey, e.target.files[0])} />
      {!file && <><div style={{ fontSize: 30, marginBottom: 6 }}>📂</div><p style={{ margin: 0, fontSize: 13, color: C.gray400 }}>Klik untuk pilih file</p><p style={{ margin: "4px 0 0", fontSize: 11, color: C.gray400 }}>JPG, PNG, atau PDF · Maks 5MB</p></>}
      {file && isImg && preview && <><img src={preview} alt="prev" style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 8, objectFit: "contain" }} /><p style={{ margin: "8px 0 0", fontSize: 12, color: C.green, fontWeight: 600 }}>✓ {file.name}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: C.gray400 }}>Klik untuk ganti</p></>}
      {file && isPDF && <><div style={{ fontSize: 38 }}>📄</div><p style={{ margin: "6px 0 0", fontSize: 12, color: C.green, fontWeight: 600 }}>✓ {file.name}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: C.gray400 }}>Klik untuk ganti</p></>}
    </div>
  );
}

function DUSuksesPage({ onBack }) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 60px" }}>
      <Card style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#7B5EA7", margin: "0 0 8px" }}>Dokumen Berhasil Dikirim!</h2>
        <p style={{ color: C.gray700, fontSize: 14, margin: "0 0 20px" }}>Alhamdulillah, dokumen daftar ulang Anda telah kami terima.</p>
        <div style={{ background: "#8B5CF611", border: "2px solid #8B5CF6", borderRadius: 12, padding: "16px 20px", textAlign: "left", fontSize: 13, color: C.gray700 }}>
          <strong>📌 Selanjutnya:</strong>
          <ol style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.9 }}>
            <li>Tim kami akan memverifikasi dokumen Anda</li>
            <li>Anda akan menerima WA tagihan pembayaran jika dokumen disetujui</li>
            <li>Setelah pembayaran dikonfirmasi, status berubah menjadi <strong>"Lunas"</strong></li>
            <li>Selamat datang di keluarga Pesantren Anak Sholeh! 🌙</li>
          </ol>
        </div>
        <br /><BackBtn onClick={onBack}>← Kembali ke Beranda</BackBtn>
      </Card>
    </div>
  );
}

function CekStatusPage({ regs, kelasData, onBack }) {
  const [noInput, setNoInput] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  const cari = () => {
    setErr("");
    const r = regs.find(x => x.noDaftar.toLowerCase() === noInput.trim().toLowerCase());
    if (r) setRes(r);
    else { setRes(null); setErr("Nomor pendaftaran tidak ditemukan."); }
  };

  const totalTagihan = res?.rincianTagihan ? res.rincianTagihan.reduce((sum, item) => sum + Number(item.nominal), 0) : 0;

  const handlePrint = () => {
    const printContent = document.getElementById("print-area");
    if (!printContent) return;

    // Membuat iframe tak terlihat khusus untuk mencetak dokumen
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Bukti Pendaftaran - ${res.namaAnak}</title>
          <style>
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
            @page { margin: 15mm; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Memunculkan display secara paksa di dalam iframe hasil kloning
    const area = doc.getElementById("print-area");
    if (area) area.style.display = "block";

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Bersihkan iframe setelah menu print dimunculkan
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>←</button>
        <div><h2 style={{ margin: 0, fontSize: 19 }}>🔍 Cek Status Pendaftaran</h2></div>
      </div>

      <Card>
        <Field label="Nomor Pendaftaran" error={err}>
          <input type="text" placeholder="Contoh: PAS-2025-0001" value={noInput}
            onChange={e => { setNoInput(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && cari()}
            style={{ ...inp_style(err, false), letterSpacing: 1, fontWeight: 700 }} />
        </Field>
        <Btn onClick={cari}>Cari Status</Btn>
      </Card>

      {res && (
        <>
          {/* Komponen cetak HANYA dimuat jika status Lunas */}
          {res.status === "Lunas" && <BuktiPrint data={res} kelasData={kelasData} />}
          
          <Card style={{ borderTop: `4px solid ${C.greenLight}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: C.gray400 }}>Status Saat Ini:</p>
                <h3 style={{ margin: "4px 0 0", color: STATUS_LIST.find(s => s.label === res.status)?.color || C.dark, display: "flex", alignItems: "center", gap: 6 }}>
                  {STATUS_LIST.find(s => s.label === res.status)?.icon} {res.status}
                </h3>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: 13, color: C.gray700 }}>
              <div><span style={{ color: C.gray400, display: "block" }}>No. Daftar</span><strong style={{ color: C.dark }}>{res.noDaftar}</strong></div>
              <div><span style={{ color: C.gray400, display: "block" }}>Nama Anak</span><strong style={{ color: C.dark }}>{res.namaAnak}</strong></div>
              <div><span style={{ color: C.gray400, display: "block" }}>Kelas</span><strong style={{ color: C.dark }}>{kelasData.find(c => c.code === res.kelas)?.label}</strong></div>
              <div><span style={{ color: C.gray400, display: "block" }}>Tgl Daftar</span><strong style={{ color: C.dark }}>{res.timestamp.split(" ")[0]}</strong></div>
            </div>

            {res.status === "Menunggu Bayar" && totalTagihan > 0 && (
            <div style={{ marginTop: 20, background: C.yellowPale, border: `1px solid ${C.yellow}`, borderRadius: 10, padding: "14px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: C.gray700 }}>Total Tagihan Daftar Ulang:</p>
              <h2 style={{ margin: "4px 0", color: C.dark, fontSize: 24 }}>{formatRp(totalTagihan)}</h2>
              <div style={{ textAlign: "left", background: C.white, borderRadius: 8, padding: 10, margin: "10px 0", fontSize: 12 }}>
                 {res.rincianTagihan.map((rt, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{rt.nama}</span><strong>{formatRp(rt.nominal)}</strong>
                    </div>
                 ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.gray400 }}>Silakan transfer sesuai dengan rincian yang dikirim via WA.</p>
          </div>
          )}
          
          <div style={{ marginTop: 20, textAlign: "center" }}>
            {res.status === "Lunas" ? (
              <button onClick={handlePrint} style={{ background: C.white, color: C.gray700, border: `2px solid ${C.gray200}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                🖨️ Cetak Bukti Pendaftaran
              </button>
            ) : (
              <div style={{ background: C.gray100, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.gray700 }}>
                <span style={{ color: "#F59E0B", fontWeight: "bold" }}>📌 Info:</span> Fitur cetak bukti pendaftaran akan tersedia setelah status pembayaran <strong style={{ color: "#059669" }}>Lunas</strong>.
              </div>
            )}
          </div>
        </Card>
      </>
    )}
  </div>
);
}

function AdminPage({ regs, setRegs, quotaOf, kelasData, setKelasData }) {
  const [filterKelas, setFK] = useState("ALL");
  const [filterStatus, setFS] = useState("ALL");
  const [toast, setToast] = useState(null);
  
  // Modals
  const [modalReg, setModal] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [showQuotaSet, setShowQS] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null); 

  const [tempRincian, setTempRincian] = useState([]);
  const [isZipping, setIsZipping] = useState(false);

  const showToast = (msg, color = C.green) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };

  const updateStatus = (no, st) => {
    setRegs(p => p.map(r => r.noDaftar === no ? { ...r, status: st } : r));
    showToast(`Status → "${st}"`, STATUS_LIST.find(s => s.label === st)?.color);
  };

  const saveRincianAndSend = () => {
    const total = tempRincian.reduce((sum, item) => sum + Number(item.nominal), 0);
    setRegs(p => p.map(r => r.noDaftar === modalReg.noDaftar ? { ...r, rincianTagihan: tempRincian } : r));
    updateStatus(modalReg.noDaftar, "Menunggu Bayar");

    let msg = `Assalamu'alaikum 🌙\n\nKepada Bapak/Ibu Wali dari *${modalReg.namaAnak}*,\n\nAlhamdulillah, dokumen daftar ulang telah kami verifikasi. Mohon melakukan pembayaran administrasi dengan rincian berikut:\n\n`;
    tempRincian.forEach(rt => {
      msg += `- ${rt.nama}: ${formatRp(rt.nominal)}\n`;
    });
    msg += `\nTotal Tagihan: *${formatRp(total)}*\n\n`;
    msg += `Pembayaran dapat ditransfer ke rekening:\n*Bank BSI: 123456789*\n*(a.n. PAUD Pesantren Anak Sholeh)*\n\nMohon balas pesan ini dengan menyertakan bukti transfer agar status pendaftaran dapat segera kami ubah menjadi *Lunas*. Jazakumullahu khairan 🙏`;
    
    window.open(`https://wa.me/${modalReg.noWA}?text=${encodeURIComponent(msg)}`, "_blank");
    setModal(null);
  };

  const sendWA = (r) => {
    const cls = kelasData.find(c => c.code === r.kelas)?.label || r.kelas;
    const msgTemplate = {
      "Diterima": `Assalamu'alaikum 🌙\n\nKepada Bapak/Ibu Wali dari *${r.namaAnak}*,\n\nAlhamdulillah, pendaftaran putra/putri Bapak/Ibu telah *DITERIMA*.\n\n📋 No. Daftar: ${r.noDaftar}\n🏫 Kelas: ${cls}\n\nSilakan lakukan Pendaftaran Ulang secara online melalui menu Daftar Ulang di web pendaftaran.\n\nJazakumullahu khairan 🙏`,
      "Wawancara": `Assalamu'alaikum 🌙\n\nKepada Bapak/Ibu Wali dari *${r.namaAnak}*,\n\n📋 No. Daftar: ${r.noDaftar}\n\nKami mengundang Bapak/Ibu untuk *wawancara*. Mohon konfirmasi jadwal dengan membalas pesan ini.\n\nJazakumullahu khairan 🙏`,
      "Daftar Ulang": `Assalamu'alaikum 🌙\n\nKepada Bapak/Ibu Wali dari *${r.namaAnak}*,\n\nMohon segera melakukan Pendaftaran Ulang secara online melalui menu Daftar Ulang di web pendaftaran.\n\n📋 No. Daftar: ${r.noDaftar}\n🏫 Kelas: ${cls}\n\nJazakumullahu khairan 🙏`,
      "Ditolak": `Assalamu'alaikum 🌙\n\nKepada Bapak/Ibu Wali dari *${r.namaAnak}*,\n\nDengan hormat, kami belum dapat menerima pendaftaran putra/putri Bapak/Ibu karena keterbatasan kapasitas.\n\n📋 No. Daftar: ${r.noDaftar}\n\nMohon maaf atas ketidaknyamanan ini.\n\nJazakumullahu khairan 🙏`,
    };
    const msg = msgTemplate[r.status] || `Assalamu'alaikum 🌙\n\nKepada Bapak/Ibu Wali dari *${r.namaAnak}*,\n\nStatus pendaftaran saat ini adalah: *${r.status}*.\n\nJazakumullahu khairan 🙏`;
    window.open(`https://wa.me/${r.noWA}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const exportExcel = () => {
    const h = ["No Daftar", "Timestamp", "Nama Anak", "Tgl Lahir", "Usia", "JK", "Kelas", "Alamat", "Nama Ayah", "Nama Ibu", "No WA", "Pekerjaan", "Asal Sekolah", "Status", "Tagihan", "Dok Ulang"];
    const rows = filtered.map(r => [
      r.noDaftar, r.timestamp, r.namaAnak, r.tglLahir, r.usia, r.jk, r.kelas, r.alamat, r.namaAyah, r.namaIbu, r.noWA, r.pekerjaan, r.asalSekolah, r.status,
      (r.rincianTagihan ? r.rincianTagihan.reduce((sum, item) => sum + Number(item.nominal), 0) : 0),
      r.dokumen ? "Sudah" : "Belum"
    ]);
    const csv = [h, ...rows].map(r => r.map(v => `"${(v || "").toString().replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })); 
    a.download = `Data-Pendaftar-PAS.csv`; 
    a.click();
  };

  const downloadZIP = async (reg) => {
    setIsZipping(true);
    try {
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const zip = new window.JSZip();
      const folderName = `${kelasData.find(c=>c.code===reg.kelas)?.label || reg.kelas} - ${reg.namaAnak}`;
      const folder = zip.folder(folderName);
      
      for (const doc of DOCS_REQUIRED) {
        const b64 = reg.dokumen[doc.key];
        if (b64) {
          const ext = b64.startsWith('data:application/pdf') ? 'pdf' : 'jpg';
          const data = b64.split(',')[1];
          folder.file(`${doc.label}.${ext}`, data, { base64: true });
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
    } catch (err) {
      showToast("Gagal membuat ZIP. Pastikan koneksi internet stabil.", "#EF4444");
    }
    setIsZipping(false);
  };

  const filtered = regs.filter(r => (filterKelas === "ALL" || r.kelas === filterKelas) && (filterStatus === "ALL" || r.status === filterStatus));
  const stCount = label => regs.filter(r => r.status === label).length;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 60px" }}>
      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 76, right: 20, background: toast.color, color: "#fff", padding: "11px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>✓ {toast.msg}</div>}

      {/* Lightbox Zoom Gambar */}
      {lightboxImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Preview" style={{ maxWidth: "90%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
          <button style={{ position: "absolute", top: 20, right: 30, background: "none", border: "none", color: "#fff", fontSize: 40, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Modal Pengaturan Kuota */}
      {showQuotaSet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ margin: "0 0 16px", color: C.green }}>⚙️ Pengaturan Kuota Kelas</h3>
            {kelasData.map((c, i) => (
              <div key={c.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</span>
                <input type="number" value={c.quota}
                  onChange={e => {
                    const newK = [...kelasData];
                    newK[i].quota = parseInt(e.target.value) || 0;
                    setKelasData(newK);
                  }}
                  style={{ width: 80, padding: "8px", borderRadius: 8, border: `1px solid ${C.gray200}`, textAlign: "center" }} />
              </div>
            ))}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowQS(false)}>Tutup & Simpan</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Pendaftaran Awal */}
      {modalDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 16, padding: 24, maxWidth: 580, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: C.green, fontSize: 16 }}>📄 Detail Pendaftaran</h3>
              <button onClick={() => setModalDetail(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.gray400 }}>✕</button>
            </div>

            <div style={{ background: C.gray100, borderRadius: 10, padding: "18px", fontSize: 13, color: C.gray700 }}>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 12px", marginBottom: 16 }}>
                <div style={{ color: C.gray400 }}>No. Pendaftaran</div><div style={{ fontWeight: 700, color: C.dark }}>{modalDetail.noDaftar}</div>
                <div style={{ color: C.gray400 }}>Waktu Daftar</div><div style={{ fontWeight: 600 }}>{modalDetail.timestamp}</div>
                <div style={{ color: C.gray400 }}>Status</div><div><Badge label={modalDetail.status} color={STATUS_LIST.find(s => s.label === modalDetail.status)?.color || C.gray400} /></div>
              </div>

              <SecTitle>Data Anak</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 12px", marginBottom: 16 }}>
                <div style={{ color: C.gray400 }}>Nama Lengkap</div><div style={{ fontWeight: 600, color: C.dark }}>{modalDetail.namaAnak}</div>
                <div style={{ color: C.gray400 }}>Tempat, Tgl Lahir</div><div style={{ fontWeight: 600 }}>{modalDetail.tempatLahir}, {modalDetail.tglLahir} ({modalDetail.usia})</div>
                <div style={{ color: C.gray400 }}>Jenis Kelamin</div><div style={{ fontWeight: 600 }}>{modalDetail.jk}</div>
                <div style={{ color: C.gray400 }}>Kelas Tujuan</div><div style={{ fontWeight: 600 }}>{kelasData.find(c => c.code === modalDetail.kelas)?.label || modalDetail.kelas}</div>
                <div style={{ color: C.gray400 }}>Alamat</div><div style={{ fontWeight: 600, lineHeight: 1.4 }}>{modalDetail.alamat || "-"}</div>
              </div>

              <SecTitle>Data Orang Tua</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 12px", marginBottom: 16 }}>
                <div style={{ color: C.gray400 }}>Nama Ayah</div><div style={{ fontWeight: 600, color: C.dark }}>{modalDetail.namaAyah || "-"}</div>
                <div style={{ color: C.gray400 }}>Nama Ibu</div><div style={{ fontWeight: 600, color: C.dark }}>{modalDetail.namaIbu || "-"}</div>
                <div style={{ color: C.gray400 }}>No. WhatsApp</div><div style={{ fontWeight: 600 }}><a href={`https://wa.me/${modalDetail.noWA}`} target="_blank" rel="noreferrer" style={{ color: "#25D366" }}>{modalDetail.noWA}</a></div>
                <div style={{ color: C.gray400 }}>Pekerjaan</div><div style={{ fontWeight: 600 }}>{modalDetail.pekerjaan || "-"}</div>
              </div>

              <SecTitle>Lainnya</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 12px" }}>
                <div style={{ color: C.gray400 }}>Asal Sekolah</div><div style={{ fontWeight: 600 }}>{modalDetail.asalSekolah || "-"}</div>
                <div style={{ color: C.gray400 }}>Info Dari</div><div style={{ fontWeight: 600 }}>{modalDetail.infoFrom || "-"}</div>
                <div style={{ color: C.gray400 }}>Catatan</div><div style={{ fontWeight: 600, lineHeight: 1.4 }}>{modalDetail.catatan || "-"}</div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <BackBtn onClick={() => setModalDetail(null)}>Tutup</BackBtn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dokumen & Tagihan (Lightbox Enabled) */}
      {modalReg && modalReg.dokumen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 16, padding: 24, maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ margin: 0, color: C.green, fontSize: 16 }}>📎 Dokumen & Tagihan</h3>
                <button onClick={() => downloadZIP(modalReg)} disabled={isZipping} style={{ background: "#F5C842", color: C.dark, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{isZipping ? "⏳ Memproses..." : "⬇ Download ZIP"}</button>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.gray400 }}>✕</button>
            </div>

            <div style={{ background: C.gray100, borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 13 }}>
              <div><strong>Nama Anak:</strong> {modalReg.namaAnak}</div>
              <div><strong>Status:</strong> <Badge label={modalReg.status} color={STATUS_LIST.find(s => s.label === modalReg.status)?.color} /></div>
              <div style={{ marginTop: 8 }}><strong>Dikirim oleh wali:</strong> {modalReg.dokumen.namaWali} ({modalReg.dokumen.noHP})</div>
              <div><strong>Waktu kirim:</strong> {modalReg.dokumen.timestamp}</div>
              {modalReg.dokumen.catatan && <div><strong>Catatan ortu:</strong> {modalReg.dokumen.catatan}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {DOCS_REQUIRED.map(doc => {
                const src = modalReg.dokumen[doc.key];
                const isPDF = src && src.startsWith("data:application/pdf");
                return (
                  <div key={doc.key} style={{ border: `1px solid ${C.gray200}`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ background: C.greenPale, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: C.green }}>{doc.icon} {doc.label}</div>
                    {src && !isPDF && (
                      <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setLightboxImg(src)}>
                        <img src={src} alt={doc.label} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>🔍 Perbesar</div>
                      </div>
                    )}
                    {src && isPDF && <div style={{ padding: 14, textAlign: "center", color: C.gray400 }}><div style={{ fontSize: 32 }}>📄</div><p style={{ fontSize: 11 }}>File PDF</p></div>}
                    {src && <div style={{ padding: "4px 12px 8px" }}><a href={src} download={`${doc.key}`} style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>⬇ Download</a></div>}
                  </div>
                );
              })}
            </div>

            {/* Aksi khusus Daftar Ulang (Tabel Rincian Tagihan Dinamis) */}
            {modalReg.status === "Verifikasi Dok" && (
              <div style={{ background: C.yellowPale, border: `1px solid ${C.yellow}`, borderRadius: 10, padding: 14 }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700 }}>Rincian Tagihan Daftar Ulang (Dinamis)</p>
                {tempRincian.map((rt, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="text" placeholder="Nama Biaya (Cth: SPP)" value={rt.nama} onChange={e => {
                      const nr = [...tempRincian]; nr[idx].nama = e.target.value; setTempRincian(nr);
                    }} style={{ ...inp_style(false, false), flex: 1, padding: "8px 10px" }} />
                    <input type="number" placeholder="Nominal" value={rt.nominal} onChange={e => {
                      const nr = [...tempRincian]; nr[idx].nominal = e.target.value; setTempRincian(nr);
                    }} style={{ ...inp_style(false, false), width: 140, padding: "8px 10px" }} />
                    <button onClick={() => setTempRincian(tempRincian.filter((_, i) => i !== idx))} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "0 10px", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setTempRincian([...tempRincian, { nama: "", nominal: "" }])} style={{ background: C.gray200, color: C.dark, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>+ Tambah Rincian</button>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #ccc", paddingTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>Total: {formatRp(tempRincian.reduce((sum, item) => sum + Number(item.nominal), 0))}</div>
                  <button onClick={saveRincianAndSend} style={{ background: C.green, color: C.white, border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>Simpan & Kirim Tagihan (WA)</button>
                </div>
              </div>
            )}

            {modalReg.status === "Menunggu Bayar" && (
              <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
                <button onClick={() => { updateStatus(modalReg.noDaftar, "Lunas"); setModal(null); }}
                  style={{ background: "#059669", color: C.white, border: "none", borderRadius: 8, padding: "12px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, width: "100%" }}>✅ Konfirmasi Pembayaran (Lunas)</button>
              </div>
            )}

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <BackBtn onClick={() => setModal(null)}>Tutup</BackBtn>
            </div>
          </div>
        </div>
      )}

      {/* Header Halaman Admin */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Dashboard Admin</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.gray400 }}>Kelola data pendaftar sekolah</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowQS(true)} style={{ background: C.white, color: C.green, border: `2px solid ${C.gray200}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⚙️ Pengaturan Kuota</button>
          <button onClick={exportExcel} style={{ background: C.green, color: C.white, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⬇ Download Excel</button>
        </div>
      </div>

      {/* Rangkuman Status */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {STATUS_LIST.map(st => (
          <div key={st.label} style={{ background: C.white, border: `1.5px solid ${st.color}33`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <span>{st.icon}</span>
            <div><div style={{ fontSize: 18, fontWeight: 800, color: st.color, lineHeight: 1 }}>{stCount(st.label)}</div><div style={{ fontSize: 10, color: C.gray400, marginTop: 1 }}>{st.label}</div></div>
          </div>
        ))}
      </div>

      {/* Grafik Kuota Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {kelasData.map(c => {
          const cnt = quotaOf(c.code), pct = c.quota > 0 ? (cnt / c.quota) * 100 : 100; return (
            <div key={c.code} style={{ background: C.white, borderRadius: 12, padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: c.color }}>{c.code}</p>
              <p style={{ margin: "2px 0 6px", fontSize: 20, fontWeight: 800, color: C.dark }}>{cnt}<span style={{ fontSize: 12, color: C.gray400, fontWeight: 400 }}>/{c.quota}</span></p>
              <div style={{ height: 6, borderRadius: 3, background: C.gray200, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: c.color, borderRadius: 3 }} /></div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabel dengan bentuk Pil estetik */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {["ALL", ...kelasData.map(c => c.code)].map(f => (
          <button key={f} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filterKelas === f ? C.green : C.gray200}`, background: filterKelas === f ? C.greenPale : C.white, color: filterKelas === f ? C.green : C.gray700, cursor: "pointer", fontSize: 12, fontWeight: filterKelas === f ? 700 : 500 }} onClick={() => setFK(f)}>
            {f === "ALL" ? "Semua Kelas" : kelasData.find(c => c.code === f)?.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filterStatus === "ALL" ? C.green : C.gray200}`, background: filterStatus === "ALL" ? C.greenPale : C.white, color: filterStatus === "ALL" ? C.green : C.gray700, cursor: "pointer", fontSize: 12, fontWeight: filterStatus === "ALL" ? 700 : 500 }} onClick={() => setFS("ALL")}>Semua Status</button>
        {STATUS_LIST.map(st => (
          <button key={st.label} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filterStatus === st.label ? st.color : C.gray200}`, background: filterStatus === st.label ? st.color + "18" : C.white, color: filterStatus === st.label ? st.color : C.gray700, cursor: "pointer", fontSize: 12, fontWeight: filterStatus === st.label ? 700 : 500 }} onClick={() => setFS(st.label)}>
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      {/* Tabel Data dengan Badge Notifikasi Baru */}
      <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 2px 16px rgba(42,124,111,0.08)", overflowX: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.gray400 }}><div style={{ fontSize: 40, marginBottom: 8 }}>📭</div><p>Tidak ada data</p></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>{["No Daftar", "Nama Anak", "Kelas", "Kontak WA", "Status", "Dokumen", "Aksi"].map(h => (
                <th key={h} style={{ background: C.green, color: C.white, padding: "12px 14px", textAlign: "left", fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const st = STATUS_LIST.find(s => s.label === r.status) || STATUS_LIST[0];
                const isNewDoc = r.status === "Verifikasi Dok";
                const isNewReg = r.status === "Menunggu Verifikasi";
                
                return (
                  <tr key={r.noDaftar} style={{ background: i % 2 === 0 ? C.white : C.gray100 }}>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top", position: "relative" }}>
                      {/* Badge garis merah untuk pendaftar yang belum dipegang sama sekali */}
                      {isNewReg && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#F59E0B" }} title="Pendaftar Baru"></span>}
                      <span style={{ fontWeight: 700, color: C.green, fontSize: 11 }}>{r.noDaftar}</span>
                      <div style={{ fontSize: 10, color: C.gray400, marginTop: 4 }}>{r.timestamp.split(" ")[0]}</div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top" }}>
                      <span style={{ fontWeight: 600 }}>{r.namaAnak}</span>
                      <div style={{ fontSize: 11, color: C.gray400 }}>{r.jk === "Laki-laki" ? "👦" : "👧"} {r.usia}</div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top" }}>
                      <Badge label={r.kelas} color={kelasData.find(c => c.code === r.kelas)?.color || C.green} />
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top" }}>
                      <a href={`https://wa.me/${r.noWA}`} target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 600, textDecoration: "none", fontSize: 12 }}>{r.noWA}</a>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top" }}>
                      <select value={r.status} onChange={e => updateStatus(r.noDaftar, e.target.value)}
                        style={{ padding: "4px 8px", borderRadius: 8, border: `1.5px solid ${st.color}`, background: st.color + "18", color: st.color, fontWeight: 700, fontSize: 11, cursor: "pointer", outline: "none", maxWidth: 140 }}>
                        {STATUS_LIST.map(s => <option key={s.label} value={s.label}>{s.icon} {s.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top", position: "relative" }}>
                      {r.dokumen ? (
                        <div style={{ position: "relative", display: "inline-block" }}>
                           {/* Titik Merah (Badge Notifikasi) untuk dokumen yang baru masuk */}
                           {isNewDoc && <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", width: 10, height: 10, borderRadius: "50%", border: "2px solid #fff" }} title="Dokumen Belum Diverifikasi"></span>}
                           <button onClick={() => { 
                               setModal(r); 
                               setTempRincian(r.rincianTagihan && r.rincianTagihan.length ? r.rincianTagihan : [{ nama: "Uang Pangkal", nominal: "" }]); 
                           }} style={{ background: "#8B5CF6", color: C.white, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>📎 Dok & Tagihan</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: C.gray400 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: 120 }}>
                        <button onClick={() => setModalDetail(r)} style={{ background: C.blue, color: C.white, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>👁️ Detail</button>
                        <button onClick={() => sendWA(r)} style={{ background: "#25D366", color: C.white, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>💬 WA</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}