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
  appId: "1:411502537546:web:7135e7322ca2e933b5efb3"
};

// Inisialisasi Firebase
// Cek agar tidak error jika config belum diisi
const app = initializeApp(
  firebaseConfig.apiKey !== "ISI_API_KEY_ANDA_DISINI" ? firebaseConfig : {}
);
const auth = getAuth(app);
const db = getFirestore(app);

// ID Aplikasi untuk nama folder di database
const appId = "e-spn-sekolah";

// --- MAIN APP COMPONENT ---
export default function App() {
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

  // Loading State
  const [loading, setLoading] = useState(true);

  // Helper context key (e.g. 2024-2025_Ganjil)
  const currentContextKey = `${tahunPelajaran.replace(/\//g, "-")}_${semester}`;

  // Nama koleksi dinamis
  const collections = useMemo(
    () => ({
      settings: "settings",
      kelas: `kelas_${currentContextKey}`,
      siswa: `siswa_${currentContextKey}`,
      nilai: `nilai_${currentContextKey}`,
    }),
    [currentContextKey]
  );

  // --- AUTHENTICATION INIT ---
  useEffect(() => {
    // Listener status login
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATA FETCHING (REALTIME) ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // 1. Fetch Identitas & Guru (Global Settings)
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
      },
      (err) => console.error("Settings error", err)
    );

    // 2. Fetch Kelas
    const unsubKelas = onSnapshot(
      collection(db, "artifacts", appId, "users", user.uid, collections.kelas),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setKelas(list.sort((a, b) => a.nama.localeCompare(b.nama)));
      },
      (err) => console.error("Kelas error", err)
    );

    // 3. Fetch Siswa
    const unsubSiswa = onSnapshot(
      collection(db, "artifacts", appId, "users", user.uid, collections.siswa),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSiswa(list);
      },
      (err) => console.error("Siswa error", err)
    );

    // 4. Fetch Nilai
    const unsubNilai = onSnapshot(
      collection(db, "artifacts", appId, "users", user.uid, collections.nilai),
      (snapshot) => {
        const data = {};
        snapshot.docs.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setNilaiData(data);
        setLoading(false);
      },
      (err) => console.error("Nilai error", err)
    );

    return () => {
      unsubSettings();
      unsubKelas();
      unsubSiswa();
      unsubNilai();
    };
  }, [user, collections]);

  // --- HELPERS ---
  const saveToFirestore = async (collectionKey, docId, data, merge = true) => {
    if (!user) return;
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
      console.error("Save Error:", e);
      alert(
        "Gagal menyimpan data. Pastikan config Firebase benar dan Rules Firestore diizinkan."
      );
    }
  };

  const deleteFromFirestore = async (collectionKey, docId) => {
    if (!user) return;
    const actualCollectionName = collections[collectionKey] || collectionKey;
    try {
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
    } catch (e) {
      console.error("Delete Error:", e);
      alert("Gagal menghapus data.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Gagal keluar: " + error.message);
    }
  };

  // --- RENDERERS ---

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 animate-pulse">
        Memuat e-SPN...
      </div>
    );

  // Jika belum login, tampilkan layar Login/Register
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
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
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded mt-1 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded mt-1 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option>Ganjil</option>
              <option>Genap</option>
            </select>
          </div>

          <div className="mt-3 text-xs text-yellow-500 bg-yellow-900/30 p-2 rounded border border-yellow-700/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Aktif: {tahunPelajaran.split("-")[0]}/{semester}
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
            label="Penilaian"
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
            icon={<Printer size={18} />}
            label="Laporan & Cetak"
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
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 print:p-0 print:bg-white">
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
                ? "Input Nilai"
                : activeMenu === "analisis"
                ? "Analisis Nilai"
                : "Laporan"}
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
              if (!confirm("Hapus kelas ini dari tahun pelajaran aktif?"))
                return;
              deleteFromFirestore("kelas", id);
            }}
          />
        )}
        {activeMenu === "siswa" && (
          <DataSiswa
            siswa={siswa}
            kelas={kelas}
            onSave={(s) => saveToFirestore("siswa", s.id, s)}
            onDelete={(id) => {
              if (!confirm("Hapus siswa dari tahun pelajaran aktif?")) return;
              deleteFromFirestore("siswa", id);
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
        {activeMenu === "laporan" && (
          <Laporan
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

// --- AUTH SCREEN COMPONENT ---
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
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let msg = "Terjadi kesalahan. Cek console untuk detail.";
      if (err.code === "auth/invalid-email") msg = "Format email salah.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      )
        msg = "Email atau password salah.";
      if (err.code === "auth/wrong-password") msg = "Password salah.";
      if (err.code === "auth/email-already-in-use")
        msg = "Email sudah terdaftar.";
      if (err.code === "auth/weak-password")
        msg = "Password terlalu lemah (min 6 karakter).";
      if (err.message.includes("API key"))
        msg = "API Key belum diset di kode App.jsx!";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-800 p-8 text-center">
          <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">e-SPN</h1>
          <p className="text-slate-400 text-sm">
            Sistem Pengolahan Nilai Sekolah
          </p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {isRegister ? "Buat Akun Baru" : "Masuk ke Aplikasi"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="nama@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center shadow-md"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : isRegister ? (
                "Daftar Sekarang"
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">
              {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? "Login disini" : "Daftar disini"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function MenuItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4
        ${
          active
            ? "bg-slate-700 text-white border-blue-500 shadow-inner"
            : "border-transparent text-slate-300 hover:bg-slate-700 hover:text-white hover:pl-5"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// 1. PENGATURAN
function Pengaturan({ identitas, guru, onSaveIdentitas, onSaveGuru }) {
  const [localIdentitas, setLocalIdentitas] = useState(identitas || {});
  const [localGuru, setLocalGuru] = useState(guru || []);
  const [newGuru, setNewGuru] = useState({ nama: "", nip: "", mapel: "" });

  useEffect(() => {
    setLocalIdentitas(identitas || {});
  }, [identitas]);
  useEffect(() => {
    setLocalGuru(guru || []);
  }, [guru]);

  const handleSaveIdentitas = () => {
    onSaveIdentitas(localIdentitas);
    alert("Identitas Sekolah Disimpan");
  };

  const handleAddGuru = () => {
    if (!newGuru.nama) return;
    const updated = [...localGuru, { ...newGuru, id: Date.now().toString() }];
    onSaveGuru(updated);
    setNewGuru({ nama: "", nip: "", mapel: "" });
  };

  const handleDeleteGuru = (id) => {
    const updated = localGuru.filter((g) => g.id !== id);
    onSaveGuru(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Identitas Sekolah */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
          <School size={20} /> Identitas Sekolah (Global)
        </h3>
        <p className="text-xs text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100">
          <span className="font-bold">Info:</span> Data identitas dan guru
          bersifat global (tetap sama meskipun tahun pelajaran berubah).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup
            label="Nama Sekolah"
            value={localIdentitas.namaSekolah}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, namaSekolah: v })
            }
          />
          <InputGroup
            label="NPSN / Kode"
            value={localIdentitas.npsn}
            onChange={(v) => setLocalIdentitas({ ...localIdentitas, npsn: v })}
          />
          <InputGroup
            label="Alamat Sekolah"
            value={localIdentitas.alamat}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, alamat: v })
            }
          />
          <InputGroup
            label="Nama Kepala Sekolah"
            value={localIdentitas.kepsek}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, kepsek: v })
            }
          />
          <InputGroup
            label="NIP Kepala Sekolah"
            value={localIdentitas.nipKepsek}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, nipKepsek: v })
            }
          />
          <InputGroup
            label="Kota Cetak Dokumen"
            value={localIdentitas.kotaCetak}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, kotaCetak: v })
            }
          />
          <InputGroup
            type="date"
            label="Tanggal Cetak Dokumen"
            value={localIdentitas.tglCetak}
            onChange={(v) =>
              setLocalIdentitas({ ...localIdentitas, tglCetak: v })
            }
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Logo URL (Link Gambar)
            </label>
            <input
              type="text"
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={localIdentitas.logoUrl || ""}
              onChange={(e) =>
                setLocalIdentitas({
                  ...localIdentitas,
                  logoUrl: e.target.value,
                })
              }
              placeholder="https://..."
            />
            {localIdentitas.logoUrl && (
              <img
                src={localIdentitas.logoUrl}
                alt="Preview"
                className="h-10 mt-2 object-contain"
              />
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveIdentitas}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save size={16} /> Simpan Identitas
          </button>
        </div>
      </div>

      {/* Data Guru */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
          <Users size={20} /> Data Guru & Mata Pelajaran
        </h3>
        <div className="flex gap-2 mb-4 items-end bg-gray-50 p-3 rounded border">
          <InputGroup
            label="Nama Guru"
            value={newGuru.nama}
            onChange={(v) => setNewGuru({ ...newGuru, nama: v })}
          />
          <InputGroup
            label="NIP"
            value={newGuru.nip}
            onChange={(v) => setNewGuru({ ...newGuru, nip: v })}
          />
          <InputGroup
            label="Mapel Diampu"
            value={newGuru.mapel}
            onChange={(v) => setNewGuru({ ...newGuru, mapel: v })}
          />
          <button
            onClick={handleAddGuru}
            className="bg-green-600 text-white px-4 py-2 rounded h-10 mb-[1px] hover:bg-green-700 shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 border-b">Nama Guru</th>
                <th className="p-3 border-b">NIP</th>
                <th className="p-3 border-b">Mata Pelajaran</th>
                <th className="p-3 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {localGuru.map((g) => (
                <tr
                  key={g.id}
                  className="border-b hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 border-r">{g.nama}</td>
                  <td className="p-3 border-r">{g.nip}</td>
                  <td className="p-3 border-r">{g.mapel}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteGuru(g.id)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {localGuru.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-6 text-center text-gray-400 italic"
                  >
                    Belum ada data guru. Silahkan tambah diatas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 2. DATA KELAS
function DataKelas({ kelas, onSave, onDelete }) {
  const [form, setForm] = useState({ id: "", nama: "", tingkat: "" });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = isEditing ? form.id : Date.now().toString();
    onSave({ ...form, id });
    setForm({ id: "", nama: "", tingkat: "" });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="grid md:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-lg shadow-sm border h-fit"
        >
          <h3 className="font-semibold mb-3 text-slate-700 border-b pb-2">
            {isEditing ? "Edit Kelas" : "Tambah Kelas"}
          </h3>
          <div className="space-y-4">
            <InputGroup
              label="Nama Kelas (Contoh: VII A)"
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
            />
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Tingkat
              </label>
              <select
                className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.tingkat}
                onChange={(e) => setForm({ ...form, tingkat: e.target.value })}
              >
                <option value="">Pilih Tingkat</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 shadow-sm transition-colors"
              >
                Simpan
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setForm({ id: "", nama: "", tingkat: "" });
                  }}
                  className="px-3 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="md:col-span-2 bg-white p-5 rounded-lg shadow-sm border flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700 sticky top-0">
                <tr>
                  <th className="p-3 border-b">Nama Kelas</th>
                  <th className="p-3 border-b">Tingkat</th>
                  <th className="p-3 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kelas.map((k) => (
                  <tr key={k.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{k.nama}</td>
                    <td className="p-3">{k.tingkat}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setForm(k);
                          setIsEditing(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(k.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {kelas.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-400">
                      Belum ada kelas untuk tahun ajaran ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. DATA SISWA
function DataSiswa({ siswa, kelas, onSave, onDelete }) {
  const [filterKelas, setFilterKelas] = useState("");
  const [form, setForm] = useState({
    id: "",
    nama: "",
    nis: "",
    gender: "L",
    kelasId: "",
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");

  const filteredSiswa = filterKelas
    ? siswa.filter((s) => s.kelasId === filterKelas)
    : siswa;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.kelasId) return alert("Pilih kelas!");
    const id = form.id || Date.now().toString();
    onSave({ ...form, id });
    setForm({
      id: "",
      nama: "",
      nis: "",
      gender: "L",
      kelasId: filterKelas || "",
    });
  };

  const handleImport = () => {
    if (!filterKelas)
      return alert(
        "Pilih kelas filter terlebih dahulu untuk import ke kelas tersebut."
      );
    const lines = importText.trim().split("\n");
    lines.forEach((line, idx) => {
      const [nama, nis, gender] = line.split(",").map((s) => s.trim());
      if (nama) {
        const id = Date.now().toString() + idx;
        onSave({
          id,
          nama,
          nis: nis || "-",
          gender: gender || "L",
          kelasId: filterKelas,
        });
      }
    });
    setImportText("");
    setIsImporting(false);
    alert(`Berhasil import ${lines.length} siswa.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setIsImporting(!isImporting)}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 shadow-sm transition-colors"
          >
            <Upload size={16} />{" "}
            {isImporting ? "Tutup Import" : "Import Data (CSV)"}
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="bg-amber-50 p-4 border border-amber-200 rounded-lg text-sm shadow-inner">
          <p className="font-bold mb-2 text-amber-800 flex items-center gap-2">
            <FileText size={16} /> Import Masal (Format: Nama, NIS, L/P)
          </p>
          <p className="mb-2 text-amber-700">
            Pastikan Anda memilih filter kelas di bawah sebelum import. Copy
            paste data dari Excel ke kotak ini.
          </p>
          <textarea
            className="w-full h-32 p-3 border border-amber-300 rounded font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            placeholder={`Budi Santoso, 1234, L\nSiti Aminah, 1235, P`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          ></textarea>
          <button
            onClick={handleImport}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Proses Import
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        {/* Form & Filter */}
        <div className="bg-white p-5 rounded-lg shadow-sm border h-fit space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700">
              Filter Kelas
            </label>
            <select
              className="w-full border border-gray-300 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-dashed" />

          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="font-semibold text-gray-700">Input Siswa Manual</h3>
            <InputGroup
              label="Nama Lengkap"
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
            />
            <InputGroup
              label="NIS / NISN"
              value={form.nis}
              onChange={(v) => setForm({ ...form, nis: v })}
            />
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Jenis Kelamin
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded text-sm mt-1"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Kelas
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded text-sm mt-1"
                value={form.kelasId}
                onChange={(e) => setForm({ ...form, kelasId: e.target.value })}
              >
                <option value="">Pilih Kelas...</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-2 shadow-sm"
            >
              Simpan Siswa
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="md:col-span-3 bg-white p-5 rounded-lg shadow-sm border flex flex-col">
          <div className="mb-2 text-sm text-gray-500 flex justify-between items-center">
            <span>Menampilkan {filteredSiswa.length} siswa</span>
            {filterKelas && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                Filter Aktif: {kelas.find((k) => k.id === filterKelas)?.nama}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="p-3 border-b">Nama</th>
                  <th className="p-3 border-b text-center">L/P</th>
                  <th className="p-3 border-b">NIS</th>
                  <th className="p-3 border-b">Kelas</th>
                  <th className="p-3 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s) => {
                  const namaKelas =
                    kelas.find((k) => k.id === s.kelasId)?.nama || "?";
                  return (
                    <tr key={s.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{s.nama}</td>
                      <td className="p-3 text-center">{s.gender}</td>
                      <td className="p-3">{s.nis}</td>
                      <td className="p-3">{namaKelas}</td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button
                          onClick={() => setForm(s)}
                          className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredSiswa.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-400">
                      Belum ada data siswa di kelas ini pada tahun ajaran aktif
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. PENILAIAN (GRADING)
function Penilaian({ siswa, kelas, guru, docPrefix, nilaiData, onSaveNilai }) {
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");

  const [currentData, setCurrentData] = useState({
    kktp: 75,
    tp: ["", "", "", "", ""],
    weights: { uh: 1, pts: 1, pas: 1 },
    scores: {},
  });

  const docId =
    selectedKelas && selectedMapel
      ? `${docPrefix}_${selectedKelas}_${selectedMapel}`
      : null;

  useEffect(() => {
    if (docId && nilaiData[docId]) {
      setCurrentData(nilaiData[docId]);
    } else {
      setCurrentData({
        kktp: 75,
        tp: ["", "", "", "", ""],
        weights: { uh: 2, pts: 1, pas: 1 },
        scores: {},
      });
    }
  }, [docId, nilaiData]);

  const handleScoreChange = (studentId, field, value) => {
    const val = parseFloat(value) || 0;
    setCurrentData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [studentId]: {
          ...prev.scores[studentId],
          [field]: val,
        },
      },
    }));
  };

  const saveAll = () => {
    if (!docId) return;
    onSaveNilai(`${selectedKelas}_${selectedMapel}`, currentData);
    alert("Data Nilai Tersimpan!");
  };

  const filteredSiswa = siswa.filter((s) => s.kelasId === selectedKelas);

  const calculateRow = (scores, w) => {
    if (!scores) return { avgUh: 0, final: 0 };
    const uhKeys = ["uh1", "uh2", "uh3", "uh4", "uh5"];
    let uhSum = 0;
    let uhCount = 0;
    uhKeys.forEach((k) => {
      if (scores[k] > 0) {
        uhSum += scores[k];
        uhCount++;
      }
    });
    const avgUh = uhCount > 0 ? uhSum / uhCount : 0;
    const pts = scores.pts || 0;
    const pas = scores.pas || 0;
    const totalW = w.uh + w.pts + w.pas;
    const final = (avgUh * w.uh + pts * w.pts + pas * w.pas) / totalW;
    return { avgUh: avgUh.toFixed(1), final: final.toFixed(1) };
  };

  if (!kelas.length || !guru.length)
    return (
      <div className="p-10 text-center bg-white rounded-lg shadow">
        Mohon lengkapi Data Kelas dan Guru terlebih dahulu di menu
        Pengaturan/Kelas.
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="font-bold text-sm text-gray-700">Pilih Kelas</label>
          <select
            className="w-full border border-gray-300 p-2.5 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
          >
            <option value="">-- Pilih Kelas --</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="font-bold text-sm text-gray-700">
            Pilih Mapel (Guru)
          </label>
          <select
            className="w-full border border-gray-300 p-2.5 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
          >
            <option value="">-- Pilih Mapel --</option>
            {guru.map((g) => (
              <option key={g.id} value={g.mapel}>
                {g.mapel} - {g.nama}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={saveAll}
          className="bg-blue-600 text-white px-6 py-2.5 rounded font-bold hover:bg-blue-700 flex items-center gap-2 shadow transition-transform active:scale-95"
        >
          <Save size={18} /> SIMPAN
        </button>
      </div>

      {selectedKelas && selectedMapel && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* CONFIG SECTION */}
          <div className="p-5 bg-slate-50 grid md:grid-cols-4 gap-6 border-b">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                KKTP (Passing Grade)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded mt-1 text-center font-bold text-blue-600"
                value={currentData.kktp}
                onChange={(e) =>
                  setCurrentData({ ...currentData, kktp: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Bobot Rerata UH
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded mt-1 text-center"
                value={currentData.weights.uh}
                onChange={(e) =>
                  setCurrentData({
                    ...currentData,
                    weights: {
                      ...currentData.weights,
                      uh: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Bobot PTS
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded mt-1 text-center"
                value={currentData.weights.pts}
                onChange={(e) =>
                  setCurrentData({
                    ...currentData,
                    weights: {
                      ...currentData.weights,
                      pts: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Bobot PAS
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded mt-1 text-center"
                value={currentData.weights.pas}
                onChange={(e) =>
                  setCurrentData({
                    ...currentData,
                    weights: {
                      ...currentData.weights,
                      pas: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          {/* TP INPUTS */}
          <div className="p-5 border-b bg-white">
            <h4 className="text-sm font-bold mb-3 text-slate-700 flex items-center gap-2">
              <Check size={16} /> Tujuan Pembelajaran (TP) untuk UH1 - UH5
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[0, 1, 2, 3, 4].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Deskripsi TP ${idx + 1}...`}
                  className="border border-gray-300 p-2 text-xs rounded w-full focus:border-blue-500 outline-none"
                  value={currentData.tp[idx] || ""}
                  onChange={(e) => {
                    const newTp = [...currentData.tp];
                    newTp[idx] = e.target.value;
                    setCurrentData({ ...currentData, tp: newTp });
                  }}
                />
              ))}
            </div>
          </div>

          {/* GRADES TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3 border-y sticky left-0 bg-slate-100 min-w-[200px] shadow-sm">
                    Nama Siswa
                  </th>
                  <th className="p-2 border-y text-center w-16">UH1</th>
                  <th className="p-2 border-y text-center w-16">UH2</th>
                  <th className="p-2 border-y text-center w-16">UH3</th>
                  <th className="p-2 border-y text-center w-16">UH4</th>
                  <th className="p-2 border-y text-center w-16">UH5</th>
                  <th className="p-2 border-y text-center bg-blue-50/50 w-20 text-blue-700">
                    Rerata
                  </th>
                  <th className="p-2 border-y text-center bg-yellow-50/50 w-20 text-yellow-700">
                    PTS
                  </th>
                  <th className="p-2 border-y text-center bg-green-50/50 w-20 text-green-700">
                    PAS
                  </th>
                  <th className="p-2 border-y text-center bg-slate-200 w-20">
                    Akhir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSiswa.map((s) => {
                  const sc = currentData.scores[s.id] || {};
                  const { avgUh, final } = calculateRow(
                    sc,
                    currentData.weights
                  );
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 group">
                      <td className="p-2 border-r sticky left-0 bg-white font-medium group-hover:bg-gray-50">
                        {s.nama}
                      </td>
                      {["uh1", "uh2", "uh3", "uh4", "uh5"].map((k) => (
                        <td key={k} className="p-1 border-r text-center">
                          <input
                            type="number"
                            className="w-full text-center outline-none bg-transparent focus:bg-white focus:ring-1 rounded"
                            placeholder="-"
                            value={sc[k] || ""}
                            onChange={(e) =>
                              handleScoreChange(s.id, k, e.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td className="p-2 border-r text-center bg-blue-50/30 font-bold text-blue-700">
                        {avgUh}
                      </td>
                      <td className="p-1 border-r text-center bg-yellow-50/30">
                        <input
                          type="number"
                          className="w-full text-center bg-transparent font-semibold"
                          value={sc.pts || ""}
                          onChange={(e) =>
                            handleScoreChange(s.id, "pts", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-1 border-r text-center bg-green-50/30">
                        <input
                          type="number"
                          className="w-full text-center bg-transparent font-semibold"
                          value={sc.pas || ""}
                          onChange={(e) =>
                            handleScoreChange(s.id, "pas", e.target.value)
                          }
                        />
                      </td>
                      <td
                        className={`p-2 text-center font-bold ${
                          final < currentData.kktp
                            ? "text-red-600"
                            : "text-blue-700"
                        } bg-slate-100`}
                      >
                        {final}
                      </td>
                    </tr>
                  );
                })}
                {filteredSiswa.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-gray-400">
                      Belum ada siswa di kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. ANALISIS
function Analisis({ siswa, kelas, guru, docPrefix, nilaiData, onSaveNilai }) {
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedUH, setSelectedUH] = useState("uh1");

  const docId =
    selectedKelas && selectedMapel
      ? `${docPrefix}_${selectedKelas}_${selectedMapel}`
      : null;
  const currentData = nilaiData[docId] || null;

  const filteredSiswa = siswa.filter((s) => s.kelasId === selectedKelas);

  const handleRemidiChange = (studentId, val) => {
    const field = `remedial_${selectedUH}`;
    const newScores = {
      ...currentData.scores,
      [studentId]: {
        ...currentData.scores[studentId],
        [field]: parseFloat(val),
      },
    };
    onSaveNilai(`${selectedKelas}_${selectedMapel}`, {
      ...currentData,
      scores: newScores,
    });
  };

  const handleCatatanChange = (studentId, val) => {
    const field = `note_${selectedUH}`;
    const newScores = {
      ...currentData.scores,
      [studentId]: {
        ...currentData.scores[studentId],
        [field]: val,
      },
    };
    onSaveNilai(`${selectedKelas}_${selectedMapel}`, {
      ...currentData,
      scores: newScores,
    });
  };

  if (!selectedKelas || !selectedMapel || !currentData) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-slate-700">
            Analisis Hasil Belajar
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <select
              className="border p-2 rounded"
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
            <select
              className="border p-2 rounded"
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
            >
              <option value="">-- Pilih Mapel --</option>
              {guru.map((g) => (
                <option key={g.id} value={g.mapel}>
                  {g.mapel}
                </option>
              ))}
            </select>
          </div>
          {!currentData && selectedKelas && selectedMapel && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded border border-red-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div> Belum ada
              data nilai. Input dulu di menu Penilaian.
            </div>
          )}
        </div>
      </div>
    );
  }

  const uhIndex = parseInt(selectedUH.replace("uh", "")) - 1;
  const tpText = currentData.tp[uhIndex] || "(TP Belum diisi)";
  const kktp = currentData.kktp || 75;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-lg font-bold text-slate-700">
            Analisis Penilaian
          </h2>
          <p className="text-sm text-gray-500">
            {kelas.find((k) => k.id === selectedKelas)?.nama} | {selectedMapel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold text-sm text-slate-600">
            Pilih Penilaian:
          </label>
          <select
            value={selectedUH}
            onChange={(e) => setSelectedUH(e.target.value)}
            className="border p-1 rounded bg-slate-50 font-medium"
          >
            <option value="uh1">UH 1</option>
            <option value="uh2">UH 2</option>
            <option value="uh3">UH 3</option>
            <option value="uh4">UH 4</option>
            <option value="uh5">UH 5</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="mb-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-900 border border-blue-100 shadow-sm">
          <p className="font-bold mb-1">Target Pembelajaran:</p>
          <p className="mb-2 italic">"{tpText}"</p>
          <div className="flex gap-4 mt-2 border-t border-blue-200 pt-2">
            <span>
              KKTP: <strong>{kktp}</strong>
            </span>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th className="p-3 border-b">Nama Siswa</th>
                <th className="p-3 border-b w-24 text-center">Nilai</th>
                <th className="p-3 border-b text-center">Ketuntasan</th>
                <th className="p-3 border-b text-center">Tindak Lanjut</th>
                <th className="p-3 border-b w-24 text-center">Perbaikan</th>
                <th className="p-3 border-b">Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSiswa.map((s) => {
                const sc = currentData.scores[s.id] || {};
                const val = sc[selectedUH] || 0;
                const isTuntas = val >= kktp;
                const remidiVal = sc[`remedial_${selectedUH}`] || "";
                const note = sc[`note_${selectedUH}`] || "";

                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 border-r font-medium">{s.nama}</td>
                    <td
                      className={`p-3 border-r text-center font-bold ${
                        isTuntas ? "text-blue-600" : "text-red-500"
                      }`}
                    >
                      {val}
                    </td>
                    <td className="p-3 border-r text-center">
                      {isTuntas ? (
                        <span className="text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold">
                          Tuntas
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-r text-center text-xs text-gray-600 font-medium">
                      {isTuntas ? "Pengayaan" : "Remedial"}
                    </td>
                    <td className="p-2 border-r">
                      {!isTuntas && (
                        <input
                          type="number"
                          className="w-full text-center border border-red-200 bg-red-50 rounded p-1 text-red-700 focus:bg-white"
                          placeholder="Nilai"
                          value={remidiVal}
                          onChange={(e) =>
                            handleRemidiChange(s.id, e.target.value)
                          }
                          onBlur={() =>
                            onSaveNilai(
                              `${selectedKelas}_${selectedMapel}`,
                              currentData
                            )
                          }
                        />
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full text-xs border-b border-gray-200 outline-none focus:border-blue-500 bg-transparent py-1"
                        placeholder="Tulis catatan..."
                        value={note}
                        onChange={(e) =>
                          handleCatatanChange(s.id, e.target.value)
                        }
                        onBlur={() =>
                          onSaveNilai(
                            `${selectedKelas}_${selectedMapel}`,
                            currentData
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 6. LAPORAN (REPORTING)
function Laporan({
  identitas,
  siswa,
  kelas,
  guru,
  docPrefix,
  nilaiData,
  tp,
  sem,
}) {
  const [view, setView] = useState("menu"); // menu, legger, uh, analisis
  const [config, setConfig] = useState({ kelasId: "", mapel: "", uh: "uh1" });

  const handlePrint = () => {
    window.print();
  };

  const selectedKelasData = kelas.find((k) => k.id === config.kelasId);
  const selectedGuru = guru.find((g) => g.mapel === config.mapel);
  const docId =
    config.kelasId && config.mapel
      ? `${docPrefix}_${config.kelasId}_${config.mapel}`
      : null;
  const currentData = nilaiData[docId] || null;
  const filteredSiswa = siswa.filter((s) => s.kelasId === config.kelasId);

  // Header Helper for Print
  const ReportHeader = ({ title }) => (
    <div className="text-center border-b-2 border-black pb-4 mb-6 hidden print:block">
      <div className="flex items-center justify-center gap-4 mb-2">
        {identitas.logoUrl && (
          <img
            src={identitas.logoUrl}
            alt="Logo"
            className="h-20 w-20 object-contain"
          />
        )}
        <div className="text-left">
          <h1 className="text-2xl font-bold uppercase">
            {identitas.namaSekolah || "NAMA SEKOLAH"}
          </h1>
          <p className="text-sm">{identitas.alamat}</p>
          <p className="text-sm">NPSN: {identitas.npsn}</p>
        </div>
      </div>
      <h2 className="font-bold text-xl mt-4 uppercase border-t-2 border-black pt-2">
        {title}
      </h2>
      <div className="flex justify-between text-sm mt-4 px-4 font-semibold border-b border-black pb-2">
        <span>Tahun Pelajaran: {tp}</span>
        <span>Semester: {sem}</span>
      </div>
    </div>
  );

  const ReportFooter = () => (
    <div className="hidden print:flex justify-between mt-12 px-10 text-sm break-inside-avoid">
      <div className="text-center">
        <p>Mengetahui,</p>
        <p>Kepala Sekolah</p>
        <br />
        <br />
        <br />
        <br />
        <p className="font-bold underline">{identitas.kepsek}</p>
        <p>NIP. {identitas.nipKepsek}</p>
      </div>
      <div className="text-center">
        <p>
          {identitas.kotaCetak || "Kota"}, {identitas.tglCetak || "........"}
        </p>
        <p>Guru Mata Pelajaran</p>
        <br />
        <br />
        <br />
        <br />
        <p className="font-bold underline">
          {selectedGuru?.nama || "................"}
        </p>
        <p>NIP. {selectedGuru?.nip || "................"}</p>
      </div>
    </div>
  );

  if (view === "menu") {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border space-y-8 animate-in zoom-in-95">
        <h2 className="text-3xl font-bold text-center text-slate-800">
          Pusat Cetak Laporan
        </h2>
        <div className="grid gap-6 bg-slate-50 p-6 rounded-lg border">
          <div>
            <label className="font-bold text-slate-700">Pilih Kelas</label>
            <select
              className="w-full border border-gray-300 p-3 rounded mt-1 bg-white"
              value={config.kelasId}
              onChange={(e) =>
                setConfig({ ...config, kelasId: e.target.value })
              }
            >
              <option value="">-- Pilih Kelas --</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700">Pilih Mapel</label>
            <select
              className="w-full border border-gray-300 p-3 rounded mt-1 bg-white"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setView("legger")}
            className="p-6 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center group"
          >
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <span className="font-bold text-slate-700">Legger Nilai</span>
            <span className="text-xs text-slate-400 mt-1">Rekap Lengkap</span>
          </button>
          <button
            onClick={() => setView("analisis")}
            className="p-6 bg-white border-2 border-purple-100 rounded-xl hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center group"
          >
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <BarChart2 size={28} />
            </div>
            <span className="font-bold text-slate-700">Analisis UH</span>
            <span className="text-xs text-slate-400 mt-1">Per Ulangan</span>
          </button>
          <button
            onClick={() => setView("daftar")}
            className="p-6 bg-white border-2 border-green-100 rounded-xl hover:border-green-500 hover:shadow-md transition-all flex flex-col items-center group"
          >
            <div className="p-3 bg-green-100 text-green-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <span className="font-bold text-slate-700">Nilai Akhir</span>
            <span className="text-xs text-slate-400 mt-1">Rapor Sederhana</span>
          </button>
        </div>
      </div>
    );
  }

  // --- REPORT VIEWS ---

  // LEGGER
  if (view === "legger") {
    return (
      <div className="bg-white min-h-screen p-8 animate-in fade-in">
        <div className="print:hidden flex justify-between mb-4 sticky top-0 bg-white/90 backdrop-blur p-2 border-b z-10">
          <button
            onClick={() => setView("menu")}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={16} /> Kembali
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow-lg"
          >
            <Printer size={16} /> Cetak Dokumen
          </button>
        </div>

        <ReportHeader
          title={`LEGER NILAI - KELAS ${selectedKelasData?.nama || ""} - ${
            config.mapel
          }`}
        />

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nama Siswa</th>
              <th className="border border-black p-2 w-10 text-center">UH1</th>
              <th className="border border-black p-2 w-10 text-center">UH2</th>
              <th className="border border-black p-2 w-10 text-center">UH3</th>
              <th className="border border-black p-2 w-10 text-center">UH4</th>
              <th className="border border-black p-2 w-10 text-center">UH5</th>
              <th className="border border-black p-2 w-12 bg-gray-50 text-center font-bold">
                Rata
              </th>
              <th className="border border-black p-2 w-12 text-center">PTS</th>
              <th className="border border-black p-2 w-12 text-center">PAS</th>
              <th className="border border-black p-2 w-16 bg-gray-200 text-center font-bold">
                Akhir
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, idx) => {
              const sc = currentData?.scores?.[s.id] || {};
              let sum = 0,
                count = 0;
              ["uh1", "uh2", "uh3", "uh4", "uh5"].forEach((k) => {
                if (sc[k] > 0) {
                  sum += sc[k];
                  count++;
                }
              });
              const avg = count ? (sum / count).toFixed(0) : "";
              const w = currentData?.weights || { uh: 2, pts: 1, pas: 1 };
              const final = avg
                ? (
                    (parseFloat(avg) * w.uh +
                      (sc.pts || 0) * w.pts +
                      (sc.pas || 0) * w.pas) /
                    (w.uh + w.pts + w.pas)
                  ).toFixed(0)
                : "";

              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-black p-1 pl-2">{s.nama}</td>
                  <td className="border border-black p-1 text-center">
                    {sc.uh1 || "-"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.uh2 || "-"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.uh3 || "-"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.uh4 || "-"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.uh5 || "-"}
                  </td>
                  <td className="border border-black p-1 text-center font-bold bg-gray-50">
                    {avg}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.pts || "-"}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {sc.pas || "-"}
                  </td>
                  <td className="border border-black p-1 text-center font-bold bg-gray-200">
                    {final}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <ReportFooter />
      </div>
    );
  }

  // ANALISIS
  if (view === "analisis") {
    return (
      <div className="bg-white min-h-screen p-8 animate-in fade-in">
        <div className="print:hidden flex justify-between mb-4 items-center sticky top-0 bg-white/90 backdrop-blur p-2 border-b z-10">
          <button
            onClick={() => setView("menu")}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={16} /> Kembali
          </button>
          <select
            className="border border-gray-300 p-2 rounded"
            value={config.uh}
            onChange={(e) => setConfig({ ...config, uh: e.target.value })}
          >
            <option value="uh1">UH 1</option>
            <option value="uh2">UH 2</option>
            <option value="uh3">UH 3</option>
            <option value="uh4">UH 4</option>
            <option value="uh5">UH 5</option>
          </select>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow-lg"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>

        <ReportHeader
          title={`ANALISIS HASIL PENILAIAN (${config.uh.toUpperCase()})`}
        />

        <div className="mb-4 text-sm border p-3 bg-gray-50">
          <p className="mb-1">
            <strong>Kelas:</strong> {selectedKelasData?.nama} |{" "}
            <strong>Mapel:</strong> {config.mapel}
          </p>
          <p className="mb-1">
            <strong>Tujuan Pembelajaran:</strong>{" "}
            {currentData?.tp?.[parseInt(config.uh.replace("uh", "")) - 1] ||
              "-"}
          </p>
          <p>
            <strong>KKTP (Kriteria Ketuntasan):</strong>{" "}
            {currentData?.kktp || 75}
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nama Siswa</th>
              <th className="border border-black p-2 w-20 text-center">
                Nilai
              </th>
              <th className="border border-black p-2 w-32 text-center">
                Status
              </th>
              <th className="border border-black p-2">Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, idx) => {
              const val = currentData?.scores?.[s.id]?.[config.uh] || 0;
              const tuntas = val >= (currentData?.kktp || 75);
              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-black p-1 pl-2">{s.nama}</td>
                  <td className="border border-black p-1 text-center font-bold">
                    {val}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {tuntas ? "Tuntas" : "Belum Tuntas"}
                  </td>
                  <td className="border border-black p-1 pl-2">
                    {tuntas ? "Pengayaan Materi" : "Remedial Teaching"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 text-sm grid grid-cols-2 gap-8 break-inside-avoid">
          <div className="border border-black p-4">
            <strong>Rekapitulasi Hasil:</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Jumlah Siswa: {filteredSiswa.length}</li>
              <li>
                Siswa Tuntas:{" "}
                {
                  filteredSiswa.filter(
                    (s) =>
                      (currentData?.scores?.[s.id]?.[config.uh] || 0) >=
                      (currentData?.kktp || 75)
                  ).length
                }
              </li>
              <li>
                Siswa Belum Tuntas:{" "}
                {
                  filteredSiswa.filter(
                    (s) =>
                      (currentData?.scores?.[s.id]?.[config.uh] || 0) <
                      (currentData?.kktp || 75)
                  ).length
                }
              </li>
              <li>
                Persentase Ketuntasan:{" "}
                {filteredSiswa.length
                  ? (
                      (filteredSiswa.filter(
                        (s) =>
                          (currentData?.scores?.[s.id]?.[config.uh] || 0) >=
                          (currentData?.kktp || 75)
                      ).length /
                        filteredSiswa.length) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </li>
            </ul>
          </div>
        </div>

        <ReportFooter />
      </div>
    );
  }

  // DAFTAR NILAI (Simple)
  if (view === "daftar") {
    return (
      <div className="bg-white min-h-screen p-8 animate-in fade-in">
        <div className="print:hidden flex justify-between mb-4 sticky top-0 bg-white/90 backdrop-blur p-2 border-b z-10">
          <button
            onClick={() => setView("menu")}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ChevronRight className="rotate-180" size={16} /> Kembali
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow-lg"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>

        <ReportHeader title={`DAFTAR NILAI AKHIR - ${config.mapel}`} />

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nama Siswa</th>
              <th className="border border-black p-2 text-center w-16">L/P</th>
              <th className="border border-black p-2 w-32 text-center">
                Nilai Akhir
              </th>
              <th className="border border-black p-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, idx) => {
              const sc = currentData?.scores?.[s.id] || {};
              let sum = 0,
                count = 0;
              ["uh1", "uh2", "uh3", "uh4", "uh5"].forEach((k) => {
                if (sc[k] > 0) {
                  sum += sc[k];
                  count++;
                }
              });
              const avg = count ? sum / count : 0;
              const w = currentData?.weights || { uh: 2, pts: 1, pas: 1 };
              const final = avg
                ? (
                    (avg * w.uh +
                      (sc.pts || 0) * w.pts +
                      (sc.pas || 0) * w.pas) /
                    (w.uh + w.pts + w.pas)
                  ).toFixed(0)
                : 0;
              const tuntas = final >= (currentData?.kktp || 75);

              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-black p-1 pl-2">{s.nama}</td>
                  <td className="border border-black p-1 text-center">
                    {s.gender}
                  </td>
                  <td className="border border-black p-1 text-center font-bold">
                    {final > 0 ? final : "-"}
                  </td>
                  <td className="border border-black p-1 pl-2">
                    {final > 0
                      ? tuntas
                        ? "Tercapai"
                        : "Perlu Bimbingan"
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <ReportFooter />
      </div>
    );
  }

  return <div>Loading...</div>;
}

// --- UTILS ---
const InputGroup = ({ label, value, onChange, type = "text" }) => (
  <div className="w-full">
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {label}
    </label>
    <input
      type={type}
      className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
