import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  Users,
  School,
  BookOpen,
  FileText,
  Settings,
  Printer,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  BarChart2,
  Upload,
  Download,
  Check,
  LogOut,
  Lock,
  Mail,
  AlertTriangle,
  GraduationCap,
  FileSpreadsheet,
  Image as ImageIcon,
  Layout,
} from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

// --- KONFIGURASI FIREBASE MANUAL ---
// ⚠️ GANTI BAGIAN INI DENGAN CONFIG DARI FIREBASE CONSOLE ANDA ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyBJ6ys7BbNxSPHdOtWG_kWI_hqlOwdg7jQ",
  authDomain: "gurupro-app.firebaseapp.com",
  projectId: "gurupro-app",
  storageBucket: "gurupro-app.firebasestorage.app",
  messagingSenderId: "411502537546",
  appId: "1:411502537546:web:7135e7322ca2e933b5efb3",
};

// Inisialisasi Firebase Aman
let app = null;
let auth = null;
let db = null;
let configError = null;

try {
  if (firebaseConfig.apiKey === "ISI_API_KEY_ANDA_DISINI") {
    throw new Error("API Key belum diisi.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Init Error:", error);
  configError = error.message;
}

const appId = "e-spn-sekolah";

// --- UTILS (DEFINED ONCE) ---
const InputGroup = ({ label, value, onChange, type = "text" }) => (
  <div className="w-full">
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {label}
    </label>
    <input
      type={type}
      className="w-full border border-gray-300 rounded p-2 focus:outline-none"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const exportTableToExcel = (tableId, filename = "Laporan.xls") => {
  const table = document.getElementById(tableId);
  if (!table) return;
  const html = table.outerHTML;
  const blob = new Blob(
    [
      `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'></head><body>${html}</body></html>
  `,
    ],
    { type: "application/vnd.ms-excel" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// --- MAIN APP COMPONENT ---
export default function App() {
  if (configError) return <ConfigErrorScreen error={configError} />;

  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("pengaturan");

  // Global Context State
  const [tahunPelajaran, setTahunPelajaran] = useState("2024-2025");
  const [semester, setSemester] = useState("Ganjil");

  // Data State
  const [identitas, setIdentitas] = useState({});
  const [guru, setGuru] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [nilaiData, setNilaiData] = useState({});
  const [loading, setLoading] = useState(true);

  const currentContextKey = `${tahunPelajaran.replace(/\//g, "-")}_${semester}`;

  const collections = useMemo(
    () => ({
      settings: "settings",
      kelas: `kelas_${currentContextKey}`,
      siswa: `siswa_${currentContextKey}`,
      nilai: `nilai_${currentContextKey}`,
    }),
    [currentContextKey]
  );

  // Auth & Data Fetching
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setLoading(true);

    try {
      const unsubSettings = onSnapshot(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          collections.settings
        ),
        (snapshot) => {
          snapshot.docs.forEach((doc) => {
            if (doc.id === "identitas") setIdentitas(doc.data());
            if (doc.id === "guru") setGuru(doc.data().list || []);
          });
        }
      );

      const unsubKelas = onSnapshot(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          collections.kelas
        ),
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setKelas(list.sort((a, b) => a.nama.localeCompare(b.nama)));
        }
      );

      const unsubSiswa = onSnapshot(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          collections.siswa
        ),
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setSiswa(list);
        }
      );

      const unsubNilai = onSnapshot(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          collections.nilai
        ),
        (snapshot) => {
          const data = {};
          snapshot.docs.forEach((doc) => {
            data[doc.id] = doc.data();
          });
          setNilaiData(data);
          setLoading(false);
        }
      );

      return () => {
        unsubSettings();
        unsubKelas();
        unsubSiswa();
        unsubNilai();
      };
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [user, collections]);

  // Helpers
  const saveToFirestore = async (collectionKey, docId, data, merge = true) => {
    if (!user || !db) return;
    const actualCollectionName = collections[collectionKey] || collectionKey;
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          actualCollectionName,
          docId
        ),
        data,
        { merge }
      );
    } catch (e) {
      alert(`Gagal menyimpan: ${e.message}`);
    }
  };

  const deleteFromFirestore = async (collectionKey, docId) => {
    if (!user || !db) return;
    const actualCollectionName = collections[collectionKey] || collectionKey;
    await deleteDoc(
      doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        actualCollectionName,
        docId
      )
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 animate-pulse">
        Memuat e-SPN...
      </div>
    );
  if (!user) return <AuthScreen />;

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden print:overflow-visible print:h-auto print:block">
      {/* CSS KHUSUS CETAK UNTUK MENGATASI PREVIEW KOSONG */}
      {/* Saya menghapus size: landscape global agar bisa diatur dinamis */}
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body, #root, main { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
            display: block !important;
          }
          aside, .print\\:hidden, nav, button { 
            display: none !important; 
          }
          table { page-break-inside: auto; width: 100% !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col print:hidden shadow-xl z-20">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <h1 className="font-bold text-lg">e-SPN</h1>
        </div>

        <div className="p-4 bg-slate-900 border-b border-slate-700">
          <div className="mb-3">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Tahun Pelajaran
            </label>
            <select
              value={tahunPelajaran}
              onChange={(e) => setTahunPelajaran(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded mt-1 p-2 focus:outline-none"
            >
              <option>2023-2024</option>
              <option>2024-2025</option>
              <option>2025-2026</option>
              <option>2026-2027</option>
              <option>2027-2028</option>
              <option>2028-2029</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded mt-1 p-2 focus:outline-none"
            >
              <option>Ganjil</option>
              <option>Genap</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <MenuItem
            icon={<Settings size={18} />}
            label="Pengaturan"
            active={activeMenu === "pengaturan"}
            onClick={() => setActiveMenu("pengaturan")}
          />
          <MenuItem
            icon={<School size={18} />}
            label="Data Kelas"
            active={activeMenu === "kelas"}
            onClick={() => setActiveMenu("kelas")}
          />
          <MenuItem
            icon={<Users size={18} />}
            label="Data Siswa"
            active={activeMenu === "siswa"}
            onClick={() => setActiveMenu("siswa")}
          />
          <MenuItem
            icon={<Edit size={18} />}
            label="Input Nilai"
            active={activeMenu === "penilaian"}
            onClick={() => setActiveMenu("penilaian")}
          />
          <MenuItem
            icon={<BarChart2 size={18} />}
            label="Analisis Nilai"
            active={activeMenu === "analisis"}
            onClick={() => setActiveMenu("analisis")}
          />
          <MenuItem
            icon={<GraduationCap size={18} />}
            label="Nilai Akhir (FIX)"
            active={activeMenu === "nilaiakhir"}
            onClick={() => setActiveMenu("nilaiakhir")}
          />
          <MenuItem
            icon={<Printer size={18} />}
            label="Laporan & Export"
            active={activeMenu === "laporan"}
            onClick={() => setActiveMenu("laporan")}
          />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm transition-colors mb-2"
          >
            <LogOut size={16} /> Keluar
          </button>
          <div className="w-full bg-slate-700/50 p-2 rounded text-xs text-slate-400 text-center border border-slate-600 truncate">
            {user.email}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 print:p-0 print:bg-white print:overflow-visible print:h-auto">
        <div className="mb-6 print:hidden flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {activeMenu === "pengaturan" && (
                <Settings className="text-blue-600" />
              )}
              {activeMenu === "kelas" && <School className="text-blue-600" />}
              {activeMenu === "siswa" && <Users className="text-blue-600" />}
              {activeMenu === "penilaian" && <Edit className="text-blue-600" />}
              {activeMenu === "analisis" && (
                <BarChart2 className="text-blue-600" />
              )}
              {activeMenu === "nilaiakhir" && (
                <GraduationCap className="text-blue-600" />
              )}
              {activeMenu === "laporan" && (
                <Printer className="text-blue-600" />
              )}

              {activeMenu === "pengaturan"
                ? "Pengaturan Umum"
                : activeMenu === "kelas"
                ? "Data Kelas"
                : activeMenu === "siswa"
                ? "Data Siswa"
                : activeMenu === "penilaian"
                ? "Input Nilai & TP"
                : activeMenu === "analisis"
                ? "Analisis & Remedial"
                : activeMenu === "nilaiakhir"
                ? "Nilai Akhir & Rapor"
                : "Laporan & Export"}
            </h2>
            {activeMenu !== "pengaturan" && (
              <p className="text-sm text-blue-600 font-semibold bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-100 mt-1 shadow-sm">
                Data Aktif: {tahunPelajaran} - {semester}
              </p>
            )}
          </div>
        </div>

        {activeMenu === "pengaturan" && (
          <Pengaturan
            identitas={identitas}
            guru={guru}
            onSaveIdentitas={(data) =>
              saveToFirestore("settings", "identitas", data)
            }
            onSaveGuru={(list) => saveToFirestore("settings", "guru", { list })}
          />
        )}
        {activeMenu === "kelas" && (
          <DataKelas
            kelas={kelas}
            onSave={(cls) => saveToFirestore("kelas", cls.id, cls)}
            onDelete={(id) => {
              if (confirm("Hapus kelas?")) deleteFromFirestore("kelas", id);
            }}
          />
        )}
        {activeMenu === "siswa" && (
          <DataSiswa
            siswa={siswa}
            kelas={kelas}
            onSave={(s) => saveToFirestore("siswa", s.id, s)}
            onDelete={(id) => {
              if (confirm("Hapus siswa?")) deleteFromFirestore("siswa", id);
            }}
          />
        )}

        {activeMenu === "penilaian" && (
          <Penilaian
            siswa={siswa}
            kelas={kelas}
            guru={guru}
            docPrefix={`${currentContextKey}`}
            nilaiData={nilaiData}
            onSaveNilai={(keySuffix, data) =>
              saveToFirestore(
                "nilai",
                `${currentContextKey}_${keySuffix}`,
                data
              )
            }
          />
        )}

        {activeMenu === "analisis" && (
          <Analisis
            siswa={siswa}
            kelas={kelas}
            guru={guru}
            docPrefix={`${currentContextKey}`}
            nilaiData={nilaiData}
            onSaveNilai={(keySuffix, data) =>
              saveToFirestore(
                "nilai",
                `${currentContextKey}_${keySuffix}`,
                data
              )
            }
          />
        )}

        {/* MENU NILAI AKHIR */}
        {activeMenu === "nilaiakhir" && (
          <NilaiAkhir
            identitas={identitas}
            siswa={siswa}
            kelas={kelas}
            guru={guru}
            docPrefix={`${currentContextKey}`}
            nilaiData={nilaiData}
            tp={tahunPelajaran}
            sem={semester}
          />
        )}

        {/* MENU LAPORAN LENGKAP */}
        {activeMenu === "laporan" && (
          <LaporanLengkap
            identitas={identitas}
            siswa={siswa}
            kelas={kelas}
            guru={guru}
            docPrefix={`${currentContextKey}`}
            nilaiData={nilaiData}
            tp={tahunPelajaran}
            sem={semester}
          />
        )}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function ConfigErrorScreen({ error }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full text-center border-t-4 border-red-500">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Konfigurasi Firebase Diperlukan
        </h2>
        <p className="text-gray-600 mb-6">
          {error === "API Key belum diisi."
            ? "Anda perlu memasukkan API Key dan konfigurasi Firebase Anda di file App.jsx baris 33."
            : `Error: ${error}`}
        </p>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister)
        await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden p-8">
        <h2 className="text-xl font-bold text-center mb-6">
          {isRegister ? "Daftar" : "Login"} e-SPN
        </h2>
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            className="w-full border p-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full border p-2 rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Loading..." : isRegister ? "Daftar" : "Masuk"}
          </button>
        </form>
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-center text-sm text-blue-600 mt-4"
        >
          {isRegister ? "Sudah punya akun?" : "Buat akun baru"}
        </button>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4 ${
        active
          ? "bg-slate-700 text-white border-blue-500"
          : "border-transparent text-slate-300 hover:bg-slate-700"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Pengaturan({ identitas, guru, onSaveIdentitas, onSaveGuru }) {
  const [localIdentitas, setLocalIdentitas] = useState(identitas || {});
  const [newGuru, setNewGuru] = useState({ nama: "", nip: "", mapel: "" });
  useEffect(() => {
    setLocalIdentitas(identitas || {});
  }, [identitas]);

  const addGuru = () => {
    if (newGuru.nama) {
      onSaveGuru([...guru, { ...newGuru, id: Date.now().toString() }]);
      setNewGuru({ nama: "", nip: "", mapel: "" });
    }
  };
  const delGuru = (id) => {
    onSaveGuru(guru.filter((g) => g.id !== id));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) {
        alert(
          "Ukuran file terlalu besar! Harap gunakan gambar di bawah 500KB."
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalIdentitas({ ...localIdentitas, logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-bold mb-4">Identitas Sekolah</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <InputGroup
            label="Nama Sekolah"
            value={localIdentitas.namaSekolah}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, namaSekolah: v })
            }
          />
          <InputGroup
            label="NPSN"
            value={localIdentitas.npsn}
            onChange={(v) => setLocalIdentitas({ ...localIdentitas, npsn: v })}
          />
          <InputGroup
            label="Alamat"
            value={localIdentitas.alamat}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, alamat: v })
            }
          />
          <InputGroup
            label="Kepala Sekolah"
            value={localIdentitas.kepsek}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, kepsek: v })
            }
          />
          <InputGroup
            label="NIP Kepsek"
            value={localIdentitas.nipKepsek}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, nipKepsek: v })
            }
          />

          {/* LOGO UPLOAD INPUT */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo Sekolah
            </label>
            <div className="flex items-center gap-4">
              {localIdentitas.logoUrl && (
                <img
                  src={localIdentitas.logoUrl}
                  alt="Logo"
                  className="h-16 w-16 object-contain border p-1 rounded bg-gray-50"
                />
              )}
              <label className="cursor-pointer bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded flex items-center gap-2 text-sm transition-colors">
                <ImageIcon size={16} />{" "}
                {localIdentitas.logoUrl ? "Ganti Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
              <span className="text-xs text-gray-400">Max 500KB (JPG/PNG)</span>
            </div>
          </div>

          <InputGroup
            label="Kota Cetak"
            value={localIdentitas.kotaCetak}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, kotaCetak: v })
            }
          />
          <InputGroup
            label="Tanggal Cetak"
            type="date"
            value={localIdentitas.tglCetak}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, tglCetak: v })
            }
          />
        </div>
        <button
          onClick={() => onSaveIdentitas(localIdentitas)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Simpan
        </button>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-bold mb-4">Data Guru</h3>
        <div className="flex gap-2 mb-4 items-end">
          <InputGroup
            label="Nama"
            value={newGuru.nama}
            onChange={(v) => setNewGuru({ ...newGuru, nama: v })}
          />
          <InputGroup
            label="Mapel"
            value={newGuru.mapel}
            onChange={(v) => setNewGuru({ ...newGuru, mapel: v })}
          />
          <button
            onClick={addGuru}
            className="bg-green-600 text-white px-4 py-2 rounded h-10 mb-[1px]"
          >
            <Plus />
          </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Nama</th>
              <th className="p-2">Mapel</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {guru.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="p-2">{g.nama}</td>
                <td className="p-2">{g.mapel}</td>
                <td className="p-2">
                  <button
                    onClick={() => delGuru(g.id)}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataKelas({ kelas, onSave, onDelete }) {
  const [form, setForm] = useState({ id: "", nama: "", tingkat: "" });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: form.id || Date.now().toString() });
    setForm({ id: "", nama: "", tingkat: "" });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow h-fit space-y-3"
      >
        <h3 className="font-bold">Kelola Kelas</h3>
        <InputGroup
          label="Nama Kelas"
          value={form.nama}
          onChange={(v) => setForm({ ...form, nama: v })}
        />
        <InputGroup
          label="Tingkat"
          value={form.tingkat}
          onChange={(v) => setForm({ ...form, tingkat: v })}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Simpan
        </button>
      </form>
      <div className="md:col-span-2 bg-white p-4 rounded shadow">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Kelas</th>
              <th className="p-2">Tingkat</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kelas.map((k) => (
              <tr key={k.id} className="border-b">
                <td className="p-2">{k.nama}</td>
                <td className="p-2">{k.tingkat}</td>
                <td className="p-2">
                  <button
                    onClick={() => setForm(k)}
                    className="text-blue-500 mr-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(k.id)}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataSiswa({ siswa, kelas, onSave, onDelete }) {
  const [form, setForm] = useState({
    id: "",
    nama: "",
    nis: "",
    gender: "L",
    kelasId: "",
  });
  const [filter, setFilter] = useState("");
  const [isImport, setIsImport] = useState(false);
  const [txt, setTxt] = useState("");

  const handleImp = () => {
    if (!filter) return alert("Pilih filter kelas dulu");
    txt.split("\n").forEach((l, i) => {
      const [n, ni, g] = l.split(",");
      if (n)
        onSave({
          id: Date.now() + i + "",
          nama: n.trim(),
          nis: ni?.trim() || "-",
          gender: g?.trim() || "L",
          kelasId: filter,
        });
    });
    setIsImport(false);
  };

  const filtered = filter ? siswa.filter((s) => s.kelasId === filter) : siswa;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between border-b pb-2">
        <h2 className="font-bold text-xl">Data Siswa</h2>
        <button
          onClick={() => setIsImport(!isImport)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          <Upload size={14} className="inline" /> Import
        </button>
      </div>
      {isImport && (
        <div className="bg-yellow-50 p-4 border rounded">
          <textarea
            className="w-full h-24 border p-2 text-xs"
            placeholder="Nama, NIS, L/P"
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
          />
          <button
            onClick={handleImp}
            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
          >
            Proses
          </button>
        </div>
      )}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow h-fit space-y-3">
          <label className="font-bold text-sm">Filter Kelas</label>
          <select
            className="w-full border p-2 rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Semua</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
          <hr />
          <h3 className="font-bold text-sm">Input Siswa</h3>
          <InputGroup
            label="Nama"
            value={form.nama}
            onChange={(v) => setForm({ ...form, nama: v })}
          />
          <InputGroup
            label="NIS"
            value={form.nis}
            onChange={(v) => setForm({ ...form, nis: v })}
          />
          <div>
            <label className="text-xs font-bold text-gray-500">L/P</label>
            <select
              className="w-full border p-2 rounded"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Kelas</label>
            <select
              className="w-full border p-2 rounded"
              value={form.kelasId}
              onChange={(e) => setForm({ ...form, kelasId: e.target.value })}
            >
              <option value="">Pilih...</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (form.kelasId) {
                onSave({ ...form, id: form.id || Date.now() + "" });
                setForm({
                  id: "",
                  nama: "",
                  nis: "",
                  gender: "L",
                  kelasId: filter || "",
                });
              }
            }}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Simpan
          </button>
        </div>
        <div className="md:col-span-3 bg-white p-4 rounded shadow overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Nama</th>
                <th className="p-2">L/P</th>
                <th className="p-2">Kelas</th>
                <th className="p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.nama}</td>
                  <td className="p-2">{s.gender}</td>
                  <td className="p-2">
                    {kelas.find((k) => k.id === s.kelasId)?.nama}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => setForm(s)}
                      className="text-blue-500"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Penilaian({ siswa, kelas, guru, docPrefix, nilaiData, onSaveNilai }) {
  const [k, setK] = useState("");
  const [m, setM] = useState("");
  const [data, setData] = useState({
    kktp: 75,
    tp: ["", "", "", "", ""],
    weights: { uh: 1, pts: 1, pas: 1 },
    scores: {},
  });
  const docId = k && m ? `${docPrefix}_${k}_${m}` : null;

  useEffect(() => {
    if (docId && nilaiData[docId]) setData(nilaiData[docId]);
    else
      setData({
        kktp: 75,
        tp: ["", "", "", "", ""],
        weights: { uh: 1, pts: 1, pas: 1 },
        scores: {},
      });
  }, [docId, nilaiData]);

  const handleChange = (sid, field, val) => {
    setData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [sid]: { ...prev.scores[sid], [field]: parseFloat(val) || 0 },
      },
    }));
  };

  const filtered = siswa.filter((s) => s.kelasId === k);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-bold">Kelas</label>
          <select
            className="w-full border p-2 rounded"
            value={k}
            onChange={(e) => setK(e.target.value)}
          >
            <option value="">Pilih</option>
            {kelas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold">Mapel</label>
          <select
            className="w-full border p-2 rounded"
            value={m}
            onChange={(e) => setM(e.target.value)}
          >
            <option value="">Pilih</option>
            {guru.map((g) => (
              <option key={g.id} value={g.mapel}>
                {g.mapel}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            if (docId) {
              onSaveNilai(`${k}_${m}`, data);
              alert("Tersimpan");
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Simpan
        </button>
      </div>
      {k && m && (
        <div className="bg-white rounded shadow overflow-auto p-4">
          <div className="mb-4 p-3 bg-gray-50 border rounded">
            <h4 className="font-bold text-sm mb-2">
              Tujuan Pembelajaran (TP) untuk UH 1 - 5
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <input
                  key={i}
                  className="border p-1 text-xs w-full rounded"
                  placeholder={`Deskripsi TP UH ${i + 1}`}
                  value={data.tp[i] || ""}
                  onChange={(e) => {
                    const newTp = [...data.tp];
                    newTp[i] = e.target.value;
                    setData({ ...data, tp: newTp });
                  }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
            <div>
              <label>KKTP</label>
              <input
                type="number"
                className="border w-full p-1"
                value={data.kktp}
                onChange={(e) => setData({ ...data, kktp: e.target.value })}
              />
            </div>
            <div>
              <label>Bobot UH</label>
              <input
                type="number"
                className="border w-full p-1"
                value={data.weights.uh}
                onChange={(e) =>
                  setData({
                    ...data,
                    weights: {
                      ...data.weights,
                      uh: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label>Bobot PTS</label>
              <input
                type="number"
                className="border w-full p-1"
                value={data.weights.pts}
                onChange={(e) =>
                  setData({
                    ...data,
                    weights: {
                      ...data.weights,
                      pts: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label>Bobot PAS</label>
              <input
                type="number"
                className="border w-full p-1"
                value={data.weights.pas}
                onChange={(e) =>
                  setData({
                    ...data,
                    weights: {
                      ...data.weights,
                      pas: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
          <table className="w-full text-xs text-center border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Nama</th>
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="border p-1 w-12">
                    UH{i}
                  </th>
                ))}
                <th className="border p-1 w-12 bg-yellow-50">PTS</th>
                <th className="border p-1 w-12 bg-green-50">PAS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="border p-2 text-left font-medium">{s.nama}</td>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <td key={i} className="border p-1">
                      <input
                        type="number"
                        className="w-full text-center"
                        value={data.scores[s.id]?.[`uh${i}`] || ""}
                        onChange={(e) =>
                          handleChange(s.id, `uh${i}`, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td className="border p-1 bg-yellow-50">
                    <input
                      type="number"
                      className="w-full text-center bg-transparent"
                      value={data.scores[s.id]?.pts || ""}
                      onChange={(e) =>
                        handleChange(s.id, "pts", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-1 bg-green-50">
                    <input
                      type="number"
                      className="w-full text-center bg-transparent"
                      value={data.scores[s.id]?.pas || ""}
                      onChange={(e) =>
                        handleChange(s.id, "pas", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Analisis({ siswa, kelas, guru, docPrefix, nilaiData, onSaveNilai }) {
  const [k, setK] = useState("");
  const [m, setM] = useState("");
  const [uh, setUh] = useState("uh1");
  const docId = k && m ? `${docPrefix}_${k}_${m}` : null;
  const data = docId && nilaiData[docId] ? nilaiData[docId] : null;
  const filtered = siswa.filter((s) => s.kelasId === k);

  const handleUpdate = (sid, field, val) => {
    const newData = {
      ...data,
      scores: { ...data.scores, [sid]: { ...data.scores[sid], [field]: val } },
    };
    onSaveNilai(`${k}_${m}`, newData);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow flex gap-4 items-center">
        <select
          className="border p-1 rounded"
          value={k}
          onChange={(e) => setK(e.target.value)}
        >
          <option value="">Kelas</option>
          {kelas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama}
            </option>
          ))}
        </select>
        <select
          className="border p-1 rounded"
          value={m}
          onChange={(e) => setM(e.target.value)}
        >
          <option value="">Mapel</option>
          {guru.map((g) => (
            <option key={g.id} value={g.mapel}>
              {g.mapel}
            </option>
          ))}
        </select>
        <select
          className="border p-1 rounded"
          value={uh}
          onChange={(e) => setUh(e.target.value)}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <option key={i} value={`uh${i}`}>
              UH {i}
            </option>
          ))}
        </select>
      </div>
      {data && (
        <div className="bg-white p-4 rounded shadow">
          <div className="mb-4 text-sm bg-blue-50 p-2 border">
            <strong>Target Pembelajaran ({uh.toUpperCase()}):</strong>{" "}
            {data.tp[parseInt(uh.slice(2)) - 1] || "-"} <br />
            <strong>KKTP:</strong> {data.kktp}
          </div>
          <table className="w-full text-sm border text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Nama</th>
                <th className="p-2 border text-center">Nilai</th>
                <th className="p-2 border text-center">Status</th>
                <th className="p-2 border text-center">Perbaikan</th>
                <th className="p-2 border text-center">Catatan Guru</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const v = data.scores[s.id]?.[uh] || 0;
                const tuntas = v >= data.kktp;
                return (
                  <tr key={s.id} className="border-b">
                    <td className="p-2 border">{s.nama}</td>
                    <td
                      className={`p-2 border text-center font-bold ${
                        tuntas ? "text-blue-600" : "text-red-500"
                      }`}
                    >
                      {v}
                    </td>
                    <td className="p-2 border text-center">
                      {tuntas ? "Tuntas" : "Belum"}
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        placeholder="Nilai Remidi/Pengayaan"
                        className="w-full text-center border bg-gray-50"
                        value={data.scores[s.id]?.[`remedial_${uh}`] || ""}
                        onChange={(e) =>
                          handleUpdate(
                            s.id,
                            `remedial_${uh}`,
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        placeholder="Catatan..."
                        className="w-full text-xs border-b outline-none"
                        value={data.scores[s.id]?.[`note_${uh}`] || ""}
                        onChange={(e) =>
                          handleUpdate(s.id, `note_${uh}`, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NilaiAkhir({
  identitas,
  siswa,
  kelas,
  guru,
  docPrefix,
  nilaiData,
  tp,
  sem,
}) {
  const [config, setConfig] = useState({ kelasId: "", mapel: "" });
  const [orientation, setOrientation] = useState("landscape");

  const handlePrint = () => window.print();
  const selectedKelasData = kelas.find((k) => k.id === config.kelasId);
  const docId =
    config.kelasId && config.mapel
      ? `${docPrefix}_${config.kelasId}_${config.mapel}`
      : null;
  const currentData = nilaiData[docId] || null;
  const filteredSiswa = siswa.filter((s) => s.kelasId === config.kelasId);

  const getEffectiveScore = (scores, uhKey) => {
    if (!scores) return 0;
    const original = parseFloat(scores[uhKey] || 0);
    const remedial = scores[`remedial_${uhKey}`];
    return remedial !== undefined && remedial !== "" && !isNaN(remedial)
      ? parseFloat(remedial)
      : original;
  };

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white min-h-screen p-8 animate-in fade-in">
      {/* STYLE PAGE ORIENTATION KHUSUS NILAI AKHIR */}
      <style>{`@media print { @page { size: ${orientation}; } }`}</style>

      <div className="print:hidden flex justify-between mb-4 sticky top-0 bg-white/90 backdrop-blur p-2 border-b z-10 items-center">
        <div className="flex gap-2">
          <select
            className="border border-gray-300 p-2 rounded"
            value={config.kelasId}
            onChange={(e) => setConfig({ ...config, kelasId: e.target.value })}
          >
            <option value="">-- Pilih Kelas --</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 p-2 rounded"
            value={config.mapel}
            onChange={(e) => setConfig({ ...config, mapel: e.target.value })}
          >
            <option value="">-- Pilih Mapel --</option>
            {guru.map((g) => (
              <option key={g.id} value={g.mapel}>
                {g.mapel}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border border-gray-300 p-2 rounded text-sm"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow-lg"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {config.kelasId && config.mapel && currentData ? (
        <>
          <div className="mb-6 hidden print:block">
            {/* KOP SECTION */}
            <div className="border-b-4 border-double border-black pb-2 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  {identitas.logoUrl && (
                    <img
                      src={identitas.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold uppercase m-0 leading-tight tracking-wide">
                    PEMERINTAH KABUPATEN KEBUMEN
                  </h3>
                  <h3 className="text-lg font-bold uppercase m-0 leading-tight tracking-wide">
                    DINAS PENDIDIKAN PEMUDA DAN OLAH RAGA
                  </h3>
                  <h1 className="text-2xl font-bold uppercase m-0 mt-2 leading-tight">
                    {identitas.namaSekolah || "NAMA SEKOLAH"}
                  </h1>
                  <p className="text-sm m-0 italic">{identitas.alamat}</p>
                </div>
              </div>
            </div>

            {/* TITLE & DETAILS SECTION (Below Line) */}
            <div className="text-center">
              <h2 className="font-bold text-lg uppercase underline">
                LAPORAN NILAI AKHIR (FIX)
              </h2>
              <div className="flex justify-between text-sm mt-2 px-4 font-semibold">
                <span>Mapel: {config.mapel}</span>
                <span>Kelas: {selectedKelasData?.nama}</span>
                <span>
                  Tahun Pelajaran: {tp} ({sem})
                </span>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th rowSpan="2" className="border border-black p-2 w-8">
                  No
                </th>
                <th rowSpan="2" className="border border-black p-2 w-20">
                  NIS
                </th>
                <th rowSpan="2" className="border border-black p-2 text-left">
                  Nama Siswa
                </th>
                <th
                  rowSpan="2"
                  className="border border-black p-2 w-12 text-center"
                >
                  L/P
                </th>
                <th colSpan="5" className="border border-black p-1">
                  Nilai Ulangan Harian (Efektif)
                </th>
                <th
                  rowSpan="2"
                  className="border border-black p-2 w-12 bg-blue-50"
                >
                  Rata UH
                </th>
                <th
                  rowSpan="2"
                  className="border border-black p-2 w-12 bg-yellow-50"
                >
                  PTS
                </th>
                <th
                  rowSpan="2"
                  className="border border-black p-2 w-12 bg-green-50"
                >
                  PAS
                </th>
                <th
                  rowSpan="2"
                  className="border border-black p-2 w-16 bg-gray-300"
                >
                  Nilai Akhir
                </th>
                <th rowSpan="2" className="border border-black p-2 w-24">
                  Keterangan
                </th>
              </tr>
              <tr className="bg-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="border border-black p-1 w-10">
                    UH{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSiswa.map((s, idx) => {
                const sc = currentData.scores[s.id] || {};
                const effUH1 = getEffectiveScore(sc, "uh1");
                const effUH2 = getEffectiveScore(sc, "uh2");
                const effUH3 = getEffectiveScore(sc, "uh3");
                const effUH4 = getEffectiveScore(sc, "uh4");
                const effUH5 = getEffectiveScore(sc, "uh5");

                let sum = 0,
                  count = 0;
                [effUH1, effUH2, effUH3, effUH4, effUH5].forEach((v) => {
                  if (v > 0) {
                    sum += v;
                    count++;
                  }
                });
                const avgUH = count > 0 ? sum / count : 0;

                const w = currentData.weights;
                const totalW = w.uh + w.pts + w.pas;
                const pts = sc.pts || 0;
                const pas = sc.pas || 0;
                const final =
                  totalW > 0
                    ? (avgUH * w.uh + pts * w.pts + pas * w.pas) / totalW
                    : 0;
                const ket =
                  final >= currentData.kktp ? "Tuntas" : "Belum Tuntas";

                return (
                  <tr key={s.id}>
                    <td className="border border-black p-1 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {s.nis}
                    </td>
                    <td className="border border-black p-1 pl-2 font-medium">
                      {s.nama}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {s.gender}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {effUH1 || "-"}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {effUH2 || "-"}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {effUH3 || "-"}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {effUH4 || "-"}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {effUH5 || "-"}
                    </td>
                    <td className="border border-black p-1 text-center font-bold bg-blue-50">
                      {avgUH.toFixed(0)}
                    </td>
                    <td className="border border-black p-1 text-center bg-yellow-50">
                      {pts || "-"}
                    </td>
                    <td className="border border-black p-1 text-center bg-green-50">
                      {pas || "-"}
                    </td>
                    <td className="border border-black p-1 text-center font-bold bg-gray-200 text-blue-900">
                      {final.toFixed(0)}
                    </td>
                    <td
                      className={`border border-black p-1 text-center text-xs ${
                        final >= currentData.kktp
                          ? "text-green-700 font-bold"
                          : "text-red-600"
                      }`}
                    >
                      {final > 0 ? ket : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="hidden print:flex justify-between mt-10 px-8 text-sm break-inside-avoid">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p>Kepala Sekolah</p>
              <br />
              <br />
              <br />
              <p className="font-bold underline">{identitas.kepsek}</p>
              <p>NIP. {identitas.nipKepsek}</p>
            </div>
            <div className="text-center">
              <p>
                {identitas.kotaCetak}, {today}
              </p>
              <p>Guru Mata Pelajaran</p>
              <br />
              <br />
              <br />
              <p className="font-bold underline">.........................</p>
              <p>NIP. .........................</p>
            </div>
          </div>

          {/* FOOTER ARSIP */}
          <div className="hidden print:block mt-4 text-[8pt] italic text-gray-500">
            Laporan Nilai Akhir_{config.mapel}_{selectedKelasData?.nama}_{tp}_
            {sem}
          </div>
        </>
      ) : (
        <div className="text-center p-10 text-gray-500 border-2 border-dashed rounded">
          Silakan pilih Kelas dan Mapel, atau pastikan data nilai sudah diinput.
        </div>
      )}
    </div>
  );
}

function LaporanLengkap({
  identitas,
  siswa,
  kelas,
  guru,
  docPrefix,
  nilaiData,
  tp,
  sem,
}) {
  const [view, setView] = useState("menu"); // menu, nilaiuh, analisis, rekapasli, rekapakhir
  const [config, setConfig] = useState({ kelasId: "", mapel: "", uh: "uh1" });
  const [orientation, setOrientation] = useState("landscape"); // State orientasi

  const handlePrint = () => window.print();
  const handleExport = () =>
    exportTableToExcel(
      "laporan-table",
      `Laporan_${view}_${config.kelasId}.xls`
    );

  const selectedKelasData = kelas.find((k) => k.id === config.kelasId);
  const selectedGuru = guru.find((g) => g.mapel === config.mapel);
  const docId =
    config.kelasId && config.mapel
      ? `${docPrefix}_${config.kelasId}_${config.mapel}`
      : null;
  const currentData = nilaiData[docId] || {
    kktp: 75,
    scores: {},
    weights: { uh: 1, pts: 1, pas: 1 },
    tp: [],
  };
  const filteredSiswa = siswa.filter((s) => s.kelasId === config.kelasId);

  // Helper Logic
  const getEffectiveScore = (scores, uhKey) => {
    if (!scores) return 0;
    const original = parseFloat(scores[uhKey] || 0);
    const remedial = scores[`remedial_${uhKey}`];
    return remedial !== undefined && remedial !== "" && !isNaN(remedial)
      ? parseFloat(remedial)
      : original;
  };

  const calculateFinal = (scores, weights, useEffective = true) => {
    if (!scores) return 0;
    let sum = 0,
      count = 0;
    ["uh1", "uh2", "uh3", "uh4", "uh5"].forEach((k) => {
      const val = useEffective
        ? getEffectiveScore(scores, k)
        : parseFloat(scores[k] || 0);
      if (val > 0) {
        sum += val;
        count++;
      }
    });
    const avg = count ? sum / count : 0;
    const w = weights || { uh: 1, pts: 1, pas: 1 };
    return (
      (avg * w.uh + (scores.pts || 0) * w.pts + (scores.pas || 0) * w.pas) /
      (w.uh + w.pts + w.pas)
    );
  };

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const ReportHeader = ({ title }) => (
    <div className="mb-6 hidden print:block">
      {/* KOP SECTION */}
      <div className="border-b-4 border-double border-black pb-2 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
            {identitas.logoUrl && (
              <img
                src={identitas.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="flex-1 text-center">
            <h3 className="text-xl font-bold uppercase m-0 leading-tight tracking-wide">
              PEMERINTAH KABUPATEN KEBUMEN
            </h3>
            <h3 className="text-lg font-bold uppercase m-0 leading-tight tracking-wide">
              DINAS PENDIDIKAN PEMUDA DAN OLAH RAGA
            </h3>
            <h1 className="text-2xl font-bold uppercase m-0 mt-2 leading-tight">
              {identitas.namaSekolah || "NAMA SEKOLAH"}
            </h1>
            <p className="text-sm m-0 italic">{identitas.alamat}</p>
          </div>
        </div>
      </div>

      {/* TITLE & DETAILS SECTION (Below Line) */}
      <div className="text-center">
        <h2 className="font-bold text-lg uppercase underline">{title}</h2>
        <div className="flex justify-between text-sm mt-2 px-4 font-semibold">
          <span>Mata Pelajaran: {config.mapel}</span>
          <span>Kelas: {selectedKelasData?.nama}</span>
          <span>
            Tahun Pelajaran: {tp} ({sem})
          </span>
        </div>
      </div>
    </div>
  );

  const ReportFooter = () => (
    <div className="hidden print:flex justify-between mt-10 px-8 text-sm break-inside-avoid">
      <div className="text-center">
        <p>Mengetahui,</p>
        <p>Kepala Sekolah</p>
        <br />
        <br />
        <br />
        <p className="font-bold underline">{identitas.kepsek}</p>
        <p>NIP. {identitas.nipKepsek}</p>
      </div>
      <div className="text-center">
        <p>
          {identitas.kotaCetak}, {today}
        </p>
        <p>Guru Mata Pelajaran</p>
        <br />
        <br />
        <br />
        <p className="font-bold underline">{selectedGuru?.nama}</p>
        <p>NIP. {selectedGuru?.nip}</p>
      </div>
    </div>
  );

  if (view === "menu") {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow space-y-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          Pusat Laporan & Export
        </h2>
        <div className="grid gap-4 bg-gray-50 p-4 rounded border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-xs">Kelas</label>
              <select
                className="w-full border p-2 rounded"
                value={config.kelasId}
                onChange={(e) =>
                  setConfig({ ...config, kelasId: e.target.value })
                }
              >
                <option value="">Pilih...</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-xs">Mapel</label>
              <select
                className="w-full border p-2 rounded"
                value={config.mapel}
                onChange={(e) =>
                  setConfig({ ...config, mapel: e.target.value })
                }
              >
                <option value="">Pilih...</option>
                {guru.map((g) => (
                  <option key={g.id} value={g.mapel}>
                    {g.mapel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setView("nilaiuh")}
            className="p-4 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 flex flex-col items-center"
          >
            <FileText size={24} className="mb-2 text-blue-600" />
            <span className="font-bold text-sm">Nilai Ulangan Harian</span>
            <span className="text-xs text-gray-500">Nilai Murni per UH</span>
          </button>
          <button
            onClick={() => setView("analisis")}
            className="p-4 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 flex flex-col items-center"
          >
            <BarChart2 size={24} className="mb-2 text-purple-600" />
            <span className="font-bold text-sm">Analisis Penilaian</span>
            <span className="text-xs text-gray-500">
              Ketuntasan & Perbaikan
            </span>
          </button>
          <button
            onClick={() => setView("rekapasli")}
            className="p-4 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 flex flex-col items-center"
          >
            <FileText size={24} className="mb-2 text-orange-600" />
            <span className="font-bold text-sm">Rekap Nilai Asli</span>
            <span className="text-xs text-gray-500">Sebelum Remedial</span>
          </button>
          <button
            onClick={() => setView("rekapakhir")}
            className="p-4 bg-green-50 border border-green-200 rounded hover:bg-green-100 flex flex-col items-center"
          >
            <GraduationCap size={24} className="mb-2 text-green-600" />
            <span className="font-bold text-sm">Rekap Nilai Akhir</span>
            <span className="text-xs text-gray-500">
              Rapor (Setelah Remedial)
            </span>
          </button>
        </div>
      </div>
    );
  }

  const ReportWrapper = ({ children, title }) => (
    <div className="bg-white min-h-screen p-8 animate-in fade-in">
      {/* STYLE PAGE ORIENTATION KHUSUS LAPORAN LENGKAP */}
      <style>{`@media print { @page { size: ${orientation}; } }`}</style>

      <div className="print:hidden flex justify-between mb-4 sticky top-0 bg-white/95 p-3 border-b z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("menu")}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 font-bold"
          >
            <ChevronRight className="rotate-180" size={16} /> Kembali
          </button>
          {view === "analisis" && (
            <select
              className="border p-1 rounded text-sm ml-2"
              value={config.uh}
              onChange={(e) => setConfig({ ...config, uh: e.target.value })}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <option key={i} value={`uh${i}`}>
                  UH {i}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border border-gray-300 p-2 rounded text-sm"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm shadow hover:bg-green-700"
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm shadow hover:bg-blue-700"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>
      {config.kelasId && config.mapel ? (
        <>
          <ReportHeader title={title} />
          {children}
          <ReportFooter />
          <div className="hidden print:block mt-4 text-[8pt] italic text-gray-500">
            {title}_{config.mapel}_{selectedKelasData?.nama}_{tp}_{sem}
          </div>
        </>
      ) : (
        <div className="text-center p-10 text-gray-400">
          Silakan pilih kelas dan mapel kembali.
        </div>
      )}
    </div>
  );

  if (view === "nilaiuh") {
    return (
      <ReportWrapper title="DAFTAR NILAI ULANGAN HARIAN (MURNI)">
        <table
          id="laporan-table"
          className="w-full border-collapse border border-black text-sm"
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2 w-20">NIS</th>
              <th className="border border-black p-2 text-left">Nama Siswa</th>
              <th className="border border-black p-2 w-12 text-center">L/P</th>
              <th className="border border-black p-2 w-12">UH1</th>
              <th className="border border-black p-2 w-12">UH2</th>
              <th className="border border-black p-2 w-12">UH3</th>
              <th className="border border-black p-2 w-12">UH4</th>
              <th className="border border-black p-2 w-12">UH5</th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, i) => (
              <tr key={s.id}>
                <td className="border border-black p-1 text-center">{i + 1}</td>
                <td className="border border-black p-1 text-center">{s.nis}</td>
                <td className="border border-black p-1">{s.nama}</td>
                <td className="border border-black p-1 text-center">
                  {s.gender}
                </td>
                {[1, 2, 3, 4, 5].map((u) => (
                  <td key={u} className="border border-black p-1 text-center">
                    {currentData.scores[s.id]?.[`uh${u}`] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ReportWrapper>
    );
  }

  if (view === "analisis") {
    const uhIdx = parseInt(config.uh.slice(2));
    const tpDesc = currentData.tp[uhIdx - 1] || "-";
    return (
      <ReportWrapper
        title={`ANALISIS HASIL PENILAIAN (${config.uh.toUpperCase()})`}
      >
        <div className="mb-4 text-sm border p-2">
          <strong>TP:</strong> {tpDesc} | <strong>KKTP:</strong>{" "}
          {currentData.kktp}
        </div>
        <table
          id="laporan-table"
          className="w-full border-collapse border border-black text-sm"
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-2">No</th>
              <th className="border border-black p-2 w-20">NIS</th>
              <th className="border border-black p-2 text-left">Nama</th>
              <th className="border border-black p-2 w-12 text-center">L/P</th>
              <th className="border border-black p-2">Nilai</th>
              <th className="border border-black p-2">Ketuntasan</th>
              <th className="border border-black p-2">Tindak Lanjut</th>
              <th className="border border-black p-2">Nilai Perbaikan</th>
              <th className="border border-black p-2">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, i) => {
              const val = currentData.scores[s.id]?.[config.uh] || 0;
              const tuntas = val >= currentData.kktp;
              const rem =
                currentData.scores[s.id]?.[`remedial_${config.uh}`] || "-";
              const note =
                currentData.scores[s.id]?.[`note_${config.uh}`] || "-";
              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {s.nis}
                  </td>
                  <td className="border border-black p-1">{s.nama}</td>
                  <td className="border border-black p-1 text-center">
                    {s.gender}
                  </td>
                  <td className="border border-black p-1 text-center">{val}</td>
                  <td className="border border-black p-1 text-center">
                    {tuntas ? "Tuntas" : "Belum"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {tuntas ? "Pengayaan" : "Remedial"}
                  </td>
                  <td className="border border-black p-1 text-center">{rem}</td>
                  <td className="border border-black p-1">{note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ReportWrapper>
    );
  }

  if (view === "rekapasli") {
    return (
      <ReportWrapper title="REKAP NILAI ASLI (PRA-REMEDIAL)">
        <table
          id="laporan-table"
          className="w-full border-collapse border border-black text-sm"
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-2" rowSpan="2">
                No
              </th>
              <th className="border border-black p-2" rowSpan="2">
                NIS
              </th>
              <th className="border border-black p-2 text-left" rowSpan="2">
                Nama
              </th>
              <th
                className="border border-black p-2 w-12 text-center"
                rowSpan="2"
              >
                L/P
              </th>
              <th className="border border-black p-1" colSpan="5">
                Nilai UH (Murni)
              </th>
              <th className="border border-black p-2" rowSpan="2">
                Rata UH
              </th>
              <th className="border border-black p-2" rowSpan="2">
                PTS
              </th>
              <th className="border border-black p-2" rowSpan="2">
                PAS
              </th>
              <th className="border border-black p-2" rowSpan="2">
                NA Murni
              </th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="border border-black p-1 w-8">
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, i) => {
              const sc = currentData.scores[s.id] || {};
              const finalMurni = calculateFinal(sc, currentData.weights, false);
              let sum = 0,
                c = 0;
              ["uh1", "uh2", "uh3", "uh4", "uh5"].forEach((k) => {
                if (sc[k] > 0) {
                  sum += parseFloat(sc[k]);
                  c++;
                }
              });
              const avg = c ? sum / c : 0;
              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {s.nis}
                  </td>
                  <td className="border border-black p-1">{s.nama}</td>
                  <td className="border border-black p-1 text-center">
                    {s.gender}
                  </td>
                  {[1, 2, 3, 4, 5].map((u) => (
                    <td key={u} className="border border-black p-1 text-center">
                      {sc[`uh${u}`] || "-"}
                    </td>
                  ))}
                  <td className="border border-black p-1 text-center font-bold bg-gray-50">
                    {avg.toFixed(0)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.pts || "-"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.pas || "-"}
                  </td>
                  <td className="border border-black p-1 text-center font-bold">
                    {finalMurni.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ReportWrapper>
    );
  }

  if (view === "rekapakhir") {
    return (
      <ReportWrapper title="REKAP NILAI AKHIR (RAPOR)">
        <table
          id="laporan-table"
          className="w-full border-collapse border border-black text-sm"
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-2" rowSpan="2">
                No
              </th>
              <th className="border border-black p-2" rowSpan="2">
                NIS
              </th>
              <th className="border border-black p-2 text-left" rowSpan="2">
                Nama
              </th>
              <th
                className="border border-black p-2 w-12 text-center"
                rowSpan="2"
              >
                L/P
              </th>
              <th className="border border-black p-1" colSpan="5">
                Nilai UH (Efektif/Setelah Remidi)
              </th>
              <th className="border border-black p-2" rowSpan="2">
                Rata UH
              </th>
              <th className="border border-black p-2" rowSpan="2">
                PTS
              </th>
              <th className="border border-black p-2" rowSpan="2">
                PAS
              </th>
              <th className="border border-black p-2 bg-gray-200" rowSpan="2">
                NA Akhir
              </th>
              <th className="border border-black p-2" rowSpan="2">
                Ket
              </th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5].map((i) => (
                <th key={i} className="border border-black p-1 w-8">
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, i) => {
              const sc = currentData.scores[s.id] || {};
              const final = calculateFinal(sc, currentData.weights, true);
              let sum = 0,
                c = 0;
              ["uh1", "uh2", "uh3", "uh4", "uh5"].forEach((k) => {
                const v = getEffectiveScore(sc, k);
                if (v > 0) {
                  sum += v;
                  c++;
                }
              });
              const avg = c ? sum / c : 0;
              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {s.nis}
                  </td>
                  <td className="border border-black p-1">{s.nama}</td>
                  <td className="border border-black p-1 text-center">
                    {s.gender}
                  </td>
                  {[1, 2, 3, 4, 5].map((u) => (
                    <td key={u} className="border border-black p-1 text-center">
                      {getEffectiveScore(sc, `uh${u}`) || "-"}
                    </td>
                  ))}
                  <td className="border border-black p-1 text-center font-bold bg-blue-50">
                    {avg.toFixed(0)}
                  </td>
                  <td className="border border-black p-1 text-center bg-yellow-50">
                    {sc.pts || "-"}
                  </td>
                  <td className="border border-black p-1 text-center bg-green-50">
                    {sc.pas || "-"}
                  </td>
                  <td className="border border-black p-1 text-center font-bold bg-gray-200">
                    {final.toFixed(0)}
                  </td>
                  <td className="border border-black p-1 text-center text-xs">
                    {final >= currentData.kktp ? "Tuntas" : "Belum"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ReportWrapper>
    ); // Menutup return
  } // Menutup blok if (view === 'rekapakhir')

  // --- JIKA ADA LOGIKA LAIN ATAU DEFAULT RETURN, LETAKNYA DI SINI ---
  // Contoh return default agar tidak error jika view bukan 'rekapakhir':
  return null;
} // <--- PASTIKAN KURUNG INI ADA (Untuk menutup function App)
