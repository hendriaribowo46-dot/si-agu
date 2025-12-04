import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, Users, School, BookOpen, FileText, 
  Settings, Printer, Plus, Trash2, Edit, 
  ChevronRight, BarChart2, Upload, Download, Check,
  LogOut, Lock, Mail
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
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
  where
} from "firebase/firestore";

// --- KONFIGURASI FIREBASE ---
// ⚠️ PENTING: GANTI NILAI DI BAWAH INI DENGAN CONFIG DARI FIREBASE CONSOLE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyBJ6ys7BbNxSPHdOtWG_kWI_hqlOwdg7jQ",
  authDomain: "gurupro-app.firebaseapp.com",
  projectId: "gurupro-app",
  storageBucket: "gurupro-app.firebasestorage.app",
  messagingSenderId: "411502537546",
  appId: "1:411502537546:web:7135e7322ca2e933b5efb3"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID Aplikasi (Bisa diganti sesuka hati untuk nama folder di database)
const appId = 'e-spn-sekolah';

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('pengaturan'); 
  
  // Global Context State
  const [tahunPelajaran, setTahunPelajaran] = useState('2024-2025');
  const [semester, setSemester] = useState('Ganjil');
  
  // Data State
  const [identitas, setIdentitas] = useState({});
  const [guru, setGuru] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [nilaiData, setNilaiData] = useState({}); 
  
  // Loading State
  const [loading, setLoading] = useState(true);

  // Helper context key
  const currentContextKey = `${tahunPelajaran.replace(/\//g, '-')}_${semester}`;

  // Nama koleksi dinamis
  const collections = useMemo(() => ({
    settings: 'settings', 
    kelas: `kelas_${currentContextKey}`,
    siswa: `siswa_${currentContextKey}`,
    nilai: `nilai_${currentContextKey}`
  }), [currentContextKey]);

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
    const unsubSettings = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, collections.settings), (snapshot) => {
      snapshot.docs.forEach(doc => {
        if (doc.id === 'identitas') setIdentitas(doc.data());
        if (doc.id === 'guru') setGuru(doc.data().list || []);
      });
    }, (err) => console.error("Settings error", err));

    // 2. Fetch Kelas
    const unsubKelas = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, collections.kelas), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setKelas(list.sort((a, b) => a.nama.localeCompare(b.nama)));
    }, (err) => console.error("Kelas error", err));

    // 3. Fetch Siswa
    const unsubSiswa = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, collections.siswa), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSiswa(list);
    }, (err) => console.error("Siswa error", err));

    // 4. Fetch Nilai
    const unsubNilai = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, collections.nilai), (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setNilaiData(data);
      setLoading(false);
    }, (err) => console.error("Nilai error", err));

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
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, actualCollectionName, docId), data, { merge });
    } catch (e) {
      console.error("Save Error:", e);
      alert("Gagal menyimpan data. Pastikan Firestore Rules mengizinkan write.");
    }
  };
  
  const deleteFromFirestore = async (collectionKey, docId) => {
    if (!user) return;
    const actualCollectionName = collections[collectionKey] || collectionKey;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, actualCollectionName, docId));
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600">Sinkronisasi Data...</div>;

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
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tahun Pelajaran</label>
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
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Semester</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded mt-1 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option>Ganjil</option>
              <option>Genap</option>
            </select>
          </div>
          
          <div className="mt-3 text-xs text-yellow-500 bg-yellow-900/30 p-2 rounded border border-yellow-700/50">
             Mode: {tahunPelajaran} ({semester})
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <MenuItem icon={<Settings size={18} />} label="Pengaturan" active={activeMenu === 'pengaturan'} onClick={() => setActiveMenu('pengaturan')} />
          <MenuItem icon={<School size={18} />} label="Data Kelas" active={activeMenu === 'kelas'} onClick={() => setActiveMenu('kelas')} />
          <MenuItem icon={<Users size={18} />} label="Data Siswa" active={activeMenu === 'siswa'} onClick={() => setActiveMenu('siswa')} />
          <MenuItem icon={<Edit size={18} />} label="Penilaian" active={activeMenu === 'penilaian'} onClick={() => setActiveMenu('penilaian')} />
          <MenuItem icon={<BarChart2 size={18} />} label="Analisis Nilai" active={activeMenu === 'analisis'} onClick={() => setActiveMenu('analisis')} />
          <MenuItem icon={<Printer size={18} />} label="Laporan & Cetak" active={activeMenu === 'laporan'} onClick={() => setActiveMenu('laporan')} />
        </nav>

        <div className="p-4 border-t border-slate-700">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm transition-colors"
           >
             <LogOut size={16} /> Keluar
           </button>
           <div className="mt-2 text-xs text-slate-500 text-center truncate px-1">
             {user.email}
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 print:p-0 print:bg-white">
        <div className="mb-6 print:hidden flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                  {activeMenu === 'pengaturan' ? 'Pengaturan Umum' : 
                   activeMenu === 'kelas' ? 'Data Kelas' :
                   activeMenu === 'siswa' ? 'Data Siswa' :
                   activeMenu === 'penilaian' ? 'Input Nilai' :
                   activeMenu === 'analisis' ? 'Analisis Nilai' : 'Laporan'}
              </h2>
              {activeMenu !== 'pengaturan' && (
                <p className="text-sm text-blue-600 font-semibold bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100 mt-1">
                  Data Aktif: {tahunPelajaran} - {semester}
                </p>
              )}
            </div>
        </div>

        {activeMenu === 'pengaturan' && (
          <Pengaturan 
            identitas={identitas} 
            guru={guru} 
            onSaveIdentitas={(data) => saveToFirestore('settings', 'identitas', data)}
            onSaveGuru={(list) => saveToFirestore('settings', 'guru', { list })}
          />
        )}
        {activeMenu === 'kelas' && (
          <DataKelas 
            kelas={kelas} 
            onSave={(cls) => saveToFirestore('kelas', cls.id, cls)}
            onDelete={(id) => {
              if(!confirm('Hapus kelas ini dari tahun pelajaran aktif?')) return;
              deleteFromFirestore('kelas', id);
            }}
          />
        )}
        {activeMenu === 'siswa' && (
          <DataSiswa 
            siswa={siswa} 
            kelas={kelas}
            onSave={(s) => saveToFirestore('siswa', s.id, s)}
            onDelete={(id) => {
              if(!confirm('Hapus siswa dari tahun pelajaran aktif?')) return;
              deleteFromFirestore('siswa', id);
            }}
          />
        )}
        {activeMenu === 'penilaian' && (
          <Penilaian 
            siswa={siswa} 
            kelas={kelas} 
            guru={guru}
            docPrefix={`${currentContextKey}`}
            nilaiData={nilaiData}
            onSaveNilai={(keySuffix, data) => saveToFirestore('nilai', `${currentContextKey}_${keySuffix}`, data)}
          />
        )}
        {activeMenu === 'analisis' && (
          <Analisis 
            siswa={siswa}
            kelas={kelas}
            guru={guru}
            docPrefix={`${currentContextKey}`}
            nilaiData={nilaiData}
            onSaveNilai={(keySuffix, data) => saveToFirestore('nilai', `${currentContextKey}_${keySuffix}`, data)}
          />
        )}
        {activeMenu === 'laporan' && (
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let msg = "Terjadi kesalahan.";
      if (err.code === 'auth/invalid-email') msg = "Format email salah.";
      if (err.code === 'auth/user-not-found') msg = "Pengguna tidak ditemukan.";
      if (err.code === 'auth/wrong-password') msg = "Password salah.";
      if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar.";
      if (err.code === 'auth/weak-password') msg = "Password terlalu lemah (min 6 karakter).";
      if (err.code === 'auth/invalid-credential') msg = "Email atau password salah.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-slate-800 p-6 text-center">
           <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-2" />
           <h1 className="text-2xl font-bold text-white">e-SPN</h1>
           <p className="text-slate-400 text-sm">Sistem Pengolahan Nilai Sekolah</p>
        </div>
        
        <div className="p-8">
           <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
             {isRegister ? 'Buat Akun Baru' : 'Masuk ke Aplikasi'}
           </h2>

           {error && (
             <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm text-center">
               {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                 <input 
                   type="email" 
                   required
                   className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                   placeholder="nama@sekolah.sch.id"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                 />
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                 <input 
                   type="password" 
                   required
                   className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                   placeholder="******"
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                 />
               </div>
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center"
             >
               {loading ? (
                 <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
               ) : (
                 isRegister ? 'Daftar Sekarang' : 'Masuk'
               )}
             </button>
           </form>

           <div className="mt-6 text-center text-sm">
             <span className="text-gray-500">
               {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
             </span>
             <button 
               onClick={() => { setIsRegister(!isRegister); setError(''); }}
               className="text-blue-600 font-semibold hover:underline"
             >
               {isRegister ? 'Login disini' : 'Daftar disini'}
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
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4
        ${active ? 'bg-slate-700 text-white border-blue-500' : 'border-transparent text-slate-300 hover:bg-slate-700 hover:text-white'}`}
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
  const [newGuru, setNewGuru] = useState({ nama: '', nip: '', mapel: '' });

  useEffect(() => { setLocalIdentitas(identitas || {}) }, [identitas]);
  useEffect(() => { setLocalGuru(guru || []) }, [guru]);

  const handleSaveIdentitas = () => {
    onSaveIdentitas(localIdentitas);
    alert('Identitas Sekolah Disimpan');
  };

  const handleAddGuru = () => {
    if (!newGuru.nama) return;
    const updated = [...localGuru, { ...newGuru, id: Date.now().toString() }];
    onSaveGuru(updated);
    setNewGuru({ nama: '', nip: '', mapel: '' });
  };

  const handleDeleteGuru = (id) => {
    const updated = localGuru.filter(g => g.id !== id);
    onSaveGuru(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Identitas Sekolah */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><School size={20}/> Identitas Sekolah (Global)</h3>
        <p className="text-xs text-gray-500 mb-4">Pengaturan ini berlaku untuk semua tahun pelajaran.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Nama Sekolah" value={localIdentitas.namaSekolah} onChange={v => setLocalIdentitas({...localIdentitas, namaSekolah: v})} />
          <InputGroup label="NPSN / Kode" value={localIdentitas.npsn} onChange={v => setLocalIdentitas({...localIdentitas, npsn: v})} />
          <InputGroup label="Alamat Sekolah" value={localIdentitas.alamat} onChange={v => setLocalIdentitas({...localIdentitas, alamat: v})} />
          <InputGroup label="Nama Kepala Sekolah" value={localIdentitas.kepsek} onChange={v => setLocalIdentitas({...localIdentitas, kepsek: v})} />
          <InputGroup label="NIP Kepala Sekolah" value={localIdentitas.nipKepsek} onChange={v => setLocalIdentitas({...localIdentitas, nipKepsek: v})} />
          <InputGroup label="Kota Cetak Dokumen" value={localIdentitas.kotaCetak} onChange={v => setLocalIdentitas({...localIdentitas, kotaCetak: v})} />
          <InputGroup type="date" label="Tanggal Cetak Dokumen" value={localIdentitas.tglCetak} onChange={v => setLocalIdentitas({...localIdentitas, tglCetak: v})} />
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700">Logo URL (Link Gambar)</label>
             <input type="text" className="w-full mt-1 p-2 border rounded" value={localIdentitas.logoUrl || ''} onChange={(e) => setLocalIdentitas({...localIdentitas, logoUrl: e.target.value})} placeholder="https://..." />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSaveIdentitas} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
            <Save size={16} /> Simpan Identitas
          </button>
        </div>
      </div>

      {/* Data Guru */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users size={20}/> Data Guru & Mata Pelajaran (Global)</h3>
        <div className="flex gap-2 mb-4 items-end">
          <InputGroup label="Nama Guru" value={newGuru.nama} onChange={v => setNewGuru({...newGuru, nama: v})} />
          <InputGroup label="NIP" value={newGuru.nip} onChange={v => setNewGuru({...newGuru, nip: v})} />
          <InputGroup label="Mapel Diampu" value={newGuru.mapel} onChange={v => setNewGuru({...newGuru, mapel: v})} />
          <button onClick={handleAddGuru} className="bg-green-600 text-white px-4 py-2 rounded h-10 mb-[1px] hover:bg-green-700"><Plus size={20}/></button>
        </div>

        <table className="w-full text-sm text-left border rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 border">Nama Guru</th>
              <th className="p-2 border">NIP</th>
              <th className="p-2 border">Mata Pelajaran</th>
              <th className="p-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {localGuru.map((g) => (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">{g.nama}</td>
                <td className="p-2 border">{g.nip}</td>
                <td className="p-2 border">{g.mapel}</td>
                <td className="p-2 border text-center">
                  <button onClick={() => handleDeleteGuru(g.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {localGuru.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-400">Belum ada data guru</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. DATA KELAS
function DataKelas({ kelas, onSave, onDelete }) {
  const [form, setForm] = useState({ id: '', nama: '', tingkat: '' });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = isEditing ? form.id : Date.now().toString();
    onSave({ ...form, id });
    setForm({ id: '', nama: '', tingkat: '' });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="grid md:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow border h-fit">
            <h3 className="font-semibold mb-3">{isEditing ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
            <div className="space-y-3">
              <InputGroup label="Nama Kelas (Contoh: VII A)" value={form.nama} onChange={v => setForm({...form, nama: v})} />
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Tingkat</label>
                <select className="border p-2 rounded" value={form.tingkat} onChange={e => setForm({...form, tingkat: e.target.value})}>
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
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Simpan</button>
                {isEditing && <button type="button" onClick={() => {setIsEditing(false); setForm({id:'', nama:'', tingkat:''})}} className="px-3 bg-gray-200 rounded">Batal</button>}
              </div>
            </div>
          </form>

          <div className="md:col-span-2 bg-white p-4 rounded shadow border">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-3 border-b">Nama Kelas</th>
                    <th className="p-3 border-b">Tingkat</th>
                    <th className="p-3 border-b text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kelas.map(k => (
                    <tr key={k.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{k.nama}</td>
                      <td className="p-3">{k.tingkat}</td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button onClick={() => {setForm(k); setIsEditing(true)}} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                        <button onClick={() => onDelete(k.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {kelas.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">Belum ada kelas untuk tahun ajaran ini</td></tr>}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}

// 3. DATA SISWA
function DataSiswa({ siswa, kelas, onSave, onDelete }) {
  const [filterKelas, setFilterKelas] = useState('');
  const [form, setForm] = useState({ id: '', nama: '', nis: '', gender: 'L', kelasId: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');

  const filteredSiswa = filterKelas 
    ? siswa.filter(s => s.kelasId === filterKelas)
    : siswa;

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!form.kelasId) return alert("Pilih kelas!");
    const id = form.id || Date.now().toString();
    onSave({ ...form, id });
    setForm({ id: '', nama: '', nis: '', gender: 'L', kelasId: filterKelas || '' });
  };

  const handleImport = () => {
    // Simple CSV parser: Nama, NIS, L/P
    // Assumes importing into currently selected filterKelas
    if(!filterKelas) return alert("Pilih kelas filter terlebih dahulu untuk import ke kelas tersebut.");
    
    const lines = importText.trim().split('\n');
    lines.forEach((line, idx) => {
      const [nama, nis, gender] = line.split(',').map(s => s.trim());
      if(nama) {
        const id = Date.now().toString() + idx;
        onSave({ id, nama, nis: nis || '-', gender: gender || 'L', kelasId: filterKelas });
      }
    });
    setImportText('');
    setIsImporting(false);
    alert(`Berhasil import ${lines.length} siswa.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
       <div className="flex justify-between items-center border-b pb-2">
         <div className="flex gap-2">
           <button onClick={() => setIsImporting(!isImporting)} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
             <Upload size={16}/> {isImporting ? 'Tutup Import' : 'Import Data'}
           </button>
         </div>
       </div>

       {isImporting && (
         <div className="bg-yellow-50 p-4 border border-yellow-200 rounded text-sm">
           <p className="font-bold mb-2 text-yellow-800">Import Masal (Format: Nama, NIS, L/P)</p>
           <p className="mb-2">Pastikan Anda memilih filter kelas di bawah sebelum import. Copy paste data dari Excel ke sini.</p>
           <textarea 
             className="w-full h-32 p-2 border rounded font-mono text-xs" 
             placeholder={`Budi Santoso, 1234, L\nSiti Aminah, 1235, P`}
             value={importText}
             onChange={e => setImportText(e.target.value)}
           ></textarea>
           <button onClick={handleImport} className="mt-2 bg-blue-600 text-white px-4 py-1 rounded">Proses Import</button>
         </div>
       )}

       <div className="grid md:grid-cols-4 gap-6">
         {/* Form & Filter */}
         <div className="bg-white p-4 rounded shadow border h-fit space-y-4">
           <div>
             <label className="text-sm font-bold text-gray-700">Filter Kelas</label>
             <select className="w-full border p-2 rounded mt-1" value={filterKelas} onChange={e => setFilterKelas(e.target.value)}>
               <option value="">Semua Kelas</option>
               {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
             </select>
           </div>
           
           <hr/>
           <form onSubmit={handleSubmit} className="space-y-3">
              <h3 className="font-semibold text-gray-700">Input Siswa</h3>
              <InputGroup label="Nama Lengkap" value={form.nama} onChange={v => setForm({...form, nama: v})} />
              <InputGroup label="NIS / NISN" value={form.nis} onChange={v => setForm({...form, nis: v})} />
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Jenis Kelamin</label>
                <select className="w-full border p-2 rounded text-sm mt-1" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Kelas</label>
                <select className="w-full border p-2 rounded text-sm mt-1" value={form.kelasId} onChange={e => setForm({...form, kelasId: e.target.value})}>
                  <option value="">Pilih Kelas...</option>
                  {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-2">Simpan Siswa</button>
           </form>
         </div>

         {/* Table */}
         <div className="md:col-span-3 bg-white p-4 rounded shadow border">
           <div className="mb-2 text-sm text-gray-500">Menampilkan {filteredSiswa.length} siswa</div>
           <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 font-semibold text-gray-600">
                <tr>
                  <th className="p-3 border-b">Nama</th>
                  <th className="p-3 border-b">L/P</th>
                  <th className="p-3 border-b">NIS</th>
                  <th className="p-3 border-b">Kelas</th>
                  <th className="p-3 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map(s => {
                  const namaKelas = kelas.find(k => k.id === s.kelasId)?.nama || '?';
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{s.nama}</td>
                      <td className="p-2 text-center">{s.gender}</td>
                      <td className="p-2">{s.nis}</td>
                      <td className="p-2">{namaKelas}</td>
                      <td className="p-2 text-center flex justify-center gap-2">
                        <button onClick={() => setForm(s)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                        <button onClick={() => onDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                })}
                {filteredSiswa.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada data siswa di kelas ini pada tahun ajaran aktif</td></tr>}
              </tbody>
            </table>
           </div>
         </div>
       </div>
    </div>
  )
}

// 4. PENILAIAN (GRADING)
function Penilaian({ siswa, kelas, guru, docPrefix, nilaiData, onSaveNilai }) {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  
  // Local state for the current editing sheet
  const [currentData, setCurrentData] = useState({
    kktp: 75,
    tp: ['', '', '', '', ''], // 5 TPs for UH1-5
    weights: { uh: 1, pts: 1, pas: 1 },
    scores: {} // { studentId: { uh1, uh2, uh3, uh4, uh5, pts, pas } }
  });

  const docId = selectedKelas && selectedMapel ? `${docPrefix}_${selectedKelas}_${selectedMapel}` : null;

  // Load data when selection changes
  useEffect(() => {
    if (docId && nilaiData[docId]) {
      setCurrentData(nilaiData[docId]);
    } else {
      // Reset if no data exists
      setCurrentData({
        kktp: 75,
        tp: ['', '', '', '', ''],
        weights: { uh: 2, pts: 1, pas: 1 },
        scores: {}
      });
    }
  }, [docId, nilaiData]);

  const handleScoreChange = (studentId, field, value) => {
    const val = parseFloat(value) || 0;
    setCurrentData(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [studentId]: {
          ...prev.scores[studentId],
          [field]: val
        }
      }
    }));
  };

  const saveAll = () => {
    if(!docId) return;
    // We send only the suffix part of the key if needed, or full logic in parent
    // Parent expects suffix: `${selectedKelas}_${selectedMapel}`
    onSaveNilai(`${selectedKelas}_${selectedMapel}`, currentData);
    alert("Data Nilai Tersimpan!");
  };

  const filteredSiswa = siswa.filter(s => s.kelasId === selectedKelas);

  // Helper to calc final grade row
  const calculateRow = (scores, w) => {
    if (!scores) return { avgUh: 0, final: 0 };
    const uhKeys = ['uh1', 'uh2', 'uh3', 'uh4', 'uh5'];
    let uhSum = 0;
    let uhCount = 0;
    uhKeys.forEach(k => {
      if(scores[k] > 0) { uhSum += scores[k]; uhCount++; }
    });
    const avgUh = uhCount > 0 ? (uhSum / uhCount) : 0;
    
    // Final Formula
    const pts = scores.pts || 0;
    const pas = scores.pas || 0;
    const totalW = w.uh + w.pts + w.pas;
    const final = ((avgUh * w.uh) + (pts * w.pts) + (pas * w.pas)) / totalW;
    
    return { avgUh: avgUh.toFixed(1), final: final.toFixed(1) };
  };

  if(!kelas.length || !guru.length) return <div className="p-10 text-center">Mohon lengkapi Data Kelas dan Guru terlebih dahulu.</div>;

  return (
    <div className="space-y-6">
       <div className="bg-white p-4 rounded shadow border flex flex-col md:flex-row gap-4 items-end">
         <div className="flex-1">
           <label className="font-bold text-sm">Pilih Kelas</label>
           <select className="w-full border p-2 rounded" value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}>
             <option value="">-- Pilih Kelas --</option>
             {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
           </select>
         </div>
         <div className="flex-1">
           <label className="font-bold text-sm">Pilih Mapel (Guru)</label>
           <select className="w-full border p-2 rounded" value={selectedMapel} onChange={e => setSelectedMapel(e.target.value)}>
             <option value="">-- Pilih Mapel --</option>
             {guru.map(g => <option key={g.id} value={g.mapel}>{g.mapel} - {g.nama}</option>)}
           </select>
         </div>
         <button onClick={saveAll} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2">
            <Save size={18}/> SIMPAN
         </button>
       </div>

       {selectedKelas && selectedMapel && (
         <div className="bg-white rounded shadow border overflow-hidden">
            {/* CONFIG SECTION */}
            <div className="p-4 bg-blue-50 grid md:grid-cols-4 gap-4 border-b">
              <div>
                 <label className="text-xs font-bold text-gray-600">KKTP (Passing Grade)</label>
                 <input type="number" className="w-full border p-1 rounded" value={currentData.kktp} onChange={e => setCurrentData({...currentData, kktp: e.target.value})} />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-600">Bobot Rerata UH</label>
                 <input type="number" className="w-full border p-1 rounded" value={currentData.weights.uh} onChange={e => setCurrentData({...currentData, weights: {...currentData.weights, uh: parseFloat(e.target.value)}})} />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-600">Bobot PTS</label>
                 <input type="number" className="w-full border p-1 rounded" value={currentData.weights.pts} onChange={e => setCurrentData({...currentData, weights: {...currentData.weights, pts: parseFloat(e.target.value)}})} />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-600">Bobot PAS</label>
                 <input type="number" className="w-full border p-1 rounded" value={currentData.weights.pas} onChange={e => setCurrentData({...currentData, weights: {...currentData.weights, pas: parseFloat(e.target.value)}})} />
              </div>
            </div>

            {/* TP INPUTS */}
            <div className="p-4 border-b">
              <h4 className="text-sm font-bold mb-2">Tujuan Pembelajaran (TP) untuk UH1 - UH5</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 {[0,1,2,3,4].map(idx => (
                    <input 
                      key={idx}
                      type="text" 
                      placeholder={`TP ${idx+1}...`} 
                      className="border p-1 text-xs rounded w-full"
                      value={currentData.tp[idx] || ''}
                      onChange={(e) => {
                         const newTp = [...currentData.tp];
                         newTp[idx] = e.target.value;
                         setCurrentData({...currentData, tp: newTp});
                      }}
                    />
                 ))}
              </div>
            </div>

            {/* GRADES TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase">
                  <tr>
                    <th className="p-3 border sticky left-0 bg-gray-100 min-w-[150px]">Nama Siswa</th>
                    <th className="p-2 border text-center w-16">UH1</th>
                    <th className="p-2 border text-center w-16">UH2</th>
                    <th className="p-2 border text-center w-16">UH3</th>
                    <th className="p-2 border text-center w-16">UH4</th>
                    <th className="p-2 border text-center w-16">UH5</th>
                    <th className="p-2 border text-center bg-blue-50 w-16">Rerata</th>
                    <th className="p-2 border text-center bg-yellow-50 w-16">PTS</th>
                    <th className="p-2 border text-center bg-green-50 w-16">PAS</th>
                    <th className="p-2 border text-center bg-gray-200 w-16">Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSiswa.map(s => {
                    const sc = currentData.scores[s.id] || {};
                    const { avgUh, final } = calculateRow(sc, currentData.weights);
                    return (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 border sticky left-0 bg-white font-medium">{s.nama}</td>
                        {['uh1','uh2','uh3','uh4','uh5'].map(k => (
                          <td key={k} className="p-1 border text-center">
                            <input 
                              type="number" 
                              className="w-full text-center outline-none bg-transparent" 
                              placeholder="-"
                              value={sc[k] || ''}
                              onChange={e => handleScoreChange(s.id, k, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="p-2 border text-center bg-blue-50 font-bold text-gray-600">{avgUh}</td>
                        <td className="p-1 border text-center bg-yellow-50">
                           <input type="number" className="w-full text-center bg-transparent font-semibold" value={sc.pts || ''} onChange={e => handleScoreChange(s.id, 'pts', e.target.value)}/>
                        </td>
                        <td className="p-1 border text-center bg-green-50">
                           <input type="number" className="w-full text-center bg-transparent font-semibold" value={sc.pas || ''} onChange={e => handleScoreChange(s.id, 'pas', e.target.value)}/>
                        </td>
                        <td className={`p-2 border text-center font-bold ${final < currentData.kktp ? 'text-red-600' : 'text-blue-600'} bg-gray-100`}>
                          {final}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
         </div>
       )}
    </div>
  )
}

// 5. ANALISIS
function Analisis({ siswa, kelas, guru, docPrefix, nilaiData, onSaveNilai }) {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedUH, setSelectedUH] = useState('uh1');
  
  const docId = selectedKelas && selectedMapel ? `${docPrefix}_${selectedKelas}_${selectedMapel}` : null;
  const currentData = nilaiData[docId] || null;
  
  const filteredSiswa = siswa.filter(s => s.kelasId === selectedKelas);

  // Remedial Logic Helper
  const handleRemidiChange = (studentId, val) => {
    // We store remedial data nested in a separate 'analysis' object inside the main doc or simpler: separate field
    // For simplicity: `remedial_uh1_studentId` in `scores`
    const field = `remedial_${selectedUH}`;
    const newScores = {
      ...currentData.scores,
      [studentId]: {
        ...currentData.scores[studentId],
        [field]: parseFloat(val)
      }
    };
    onSaveNilai(`${selectedKelas}_${selectedMapel}`, { ...currentData, scores: newScores });
  };
  
  const handleCatatanChange = (studentId, val) => {
      const field = `note_${selectedUH}`;
      const newScores = {
        ...currentData.scores,
        [studentId]: {
          ...currentData.scores[studentId],
          [field]: val
        }
      };
      onSaveNilai(`${selectedKelas}_${selectedMapel}`, { ...currentData, scores: newScores });
  }

  if (!selectedKelas || !selectedMapel || !currentData) {
     return (
       <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow border">
            <h2 className="text-xl font-bold mb-4">Analisis Hasil Belajar</h2>
            <div className="grid grid-cols-2 gap-4">
              <select className="border p-2 rounded" value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
              <select className="border p-2 rounded" value={selectedMapel} onChange={e => setSelectedMapel(e.target.value)}>
                <option value="">-- Pilih Mapel --</option>
                {guru.map(g => <option key={g.id} value={g.mapel}>{g.mapel}</option>)}
              </select>
            </div>
            {!currentData && selectedKelas && selectedMapel && <p className="mt-4 text-red-500">Belum ada data nilai untuk kelas/mapel ini. Silahkan input di menu Penilaian.</p>}
          </div>
       </div>
     );
  }

  // Determine UH Index for TP
  const uhIndex = parseInt(selectedUH.replace('uh', '')) - 1;
  const tpText = currentData.tp[uhIndex] || '(TP Belum diisi)';
  const kktp = currentData.kktp || 75;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <div>
           <h2 className="text-lg font-bold">Analisis Penilaian</h2>
           <p className="text-sm text-gray-500">{kelas.find(k=>k.id===selectedKelas)?.nama} | {selectedMapel}</p>
        </div>
        <div className="flex items-center gap-2">
           <label className="font-semibold text-sm">Pilih Penilaian:</label>
           <select value={selectedUH} onChange={e => setSelectedUH(e.target.value)} className="border p-1 rounded">
             <option value="uh1">UH 1</option>
             <option value="uh2">UH 2</option>
             <option value="uh3">UH 3</option>
             <option value="uh4">UH 4</option>
             <option value="uh5">UH 5</option>
           </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow border">
         <div className="mb-4 bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-200">
            <strong>Tujuan Pembelajaran:</strong> {tpText} <br/>
            <strong>KKTP:</strong> {kktp}
         </div>

         <table className="w-full text-sm text-left border">
           <thead className="bg-gray-100 font-bold text-gray-700">
             <tr>
               <th className="p-3 border">Nama Siswa</th>
               <th className="p-3 border w-24 text-center">Nilai Murni</th>
               <th className="p-3 border text-center">Ketuntasan</th>
               <th className="p-3 border text-center">Tindak Lanjut</th>
               <th className="p-3 border w-24 text-center">Nilai Perbaikan</th>
               <th className="p-3 border">Catatan</th>
             </tr>
           </thead>
           <tbody>
             {filteredSiswa.map(s => {
               const sc = currentData.scores[s.id] || {};
               const val = sc[selectedUH] || 0;
               const isTuntas = val >= kktp;
               const remidiVal = sc[`remedial_${selectedUH}`] || '';
               const note = sc[`note_${selectedUH}`] || '';

               return (
                 <tr key={s.id} className="border-b hover:bg-gray-50">
                   <td className="p-2 border font-medium">{s.nama}</td>
                   <td className={`p-2 border text-center font-bold ${isTuntas ? 'text-blue-600':'text-red-500'}`}>{val}</td>
                   <td className="p-2 border text-center">
                     {isTuntas ? <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs">Tuntas</span> : <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded text-xs">Belum Tuntas</span>}
                   </td>
                   <td className="p-2 border text-center text-xs text-gray-600">
                     {isTuntas ? 'Pengayaan' : 'Remedial'}
                   </td>
                   <td className="p-2 border">
                     {!isTuntas && (
                       <input 
                         type="number" 
                         className="w-full text-center border rounded p-1" 
                         placeholder="Nilai" 
                         value={remidiVal} 
                         onChange={e => handleRemidiChange(s.id, e.target.value)}
                         onBlur={() => onSaveNilai(`${selectedKelas}_${selectedMapel}`, currentData)} // Save on blur
                       />
                     )}
                   </td>
                   <td className="p-2 border">
                      <input 
                         type="text" 
                         className="w-full text-xs border-b outline-none focus:border-blue-500" 
                         placeholder="Catatan..." 
                         value={note}
                         onChange={e => handleCatatanChange(s.id, e.target.value)}
                         onBlur={() => onSaveNilai(`${selectedKelas}_${selectedMapel}`, currentData)}
                      />
                   </td>
                 </tr>
               )
             })}
           </tbody>
         </table>
      </div>
    </div>
  )
}

// 6. LAPORAN (REPORTING)
function Laporan({ identitas, siswa, kelas, guru, docPrefix, nilaiData, tp, sem }) {
  const [view, setView] = useState('menu'); // menu, legger, uh, analisis
  const [config, setConfig] = useState({ kelasId: '', mapel: '', uh: 'uh1' });

  const handlePrint = () => {
    window.print();
  };

  const selectedKelasData = kelas.find(k => k.id === config.kelasId);
  const selectedGuru = guru.find(g => g.mapel === config.mapel);
  const docId = config.kelasId && config.mapel ? `${docPrefix}_${config.kelasId}_${config.mapel}` : null;
  const currentData = nilaiData[docId] || null;
  const filteredSiswa = siswa.filter(s => s.kelasId === config.kelasId);

  // Header Helper for Print
  const ReportHeader = ({ title }) => (
    <div className="text-center border-b-2 border-black pb-4 mb-6 hidden print:block">
      <div className="flex items-center justify-center gap-4 mb-2">
         {identitas.logoUrl && <img src={identitas.logoUrl} alt="Logo" className="h-16 w-16 object-contain"/>}
         <div>
            <h1 className="text-xl font-bold uppercase">{identitas.namaSekolah || 'NAMA SEKOLAH'}</h1>
            <p className="text-sm">{identitas.alamat}</p>
         </div>
      </div>
      <h2 className="font-bold text-lg mt-2 uppercase">{title}</h2>
      <div className="flex justify-between text-sm mt-2 px-10 font-semibold">
        <span>Tahun Pelajaran: {tp}</span>
        <span>Semester: {sem}</span>
      </div>
    </div>
  );

  const ReportFooter = () => (
    <div className="hidden print:flex justify-between mt-10 px-8 text-sm break-inside-avoid">
       <div className="text-center">
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <br/><br/><br/>
          <p className="font-bold underline">{identitas.kepsek}</p>
          <p>NIP. {identitas.nipKepsek}</p>
       </div>
       <div className="text-center">
          <p>{identitas.kotaCetak || 'Kota'}, {identitas.tglCetak || '........'}</p>
          <p>Guru Mata Pelajaran</p>
          <br/><br/><br/>
          <p className="font-bold underline">{selectedGuru?.nama || '................'}</p>
          <p>NIP. {selectedGuru?.nip || '................'}</p>
       </div>
    </div>
  );

  if (view === 'menu') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow border space-y-6">
        <h2 className="text-2xl font-bold text-center">Pusat Cetak Laporan</h2>
        <div className="grid gap-4">
           <div>
             <label className="font-bold">Pilih Kelas</label>
             <select className="w-full border p-2 rounded" value={config.kelasId} onChange={e => setConfig({...config, kelasId: e.target.value})}>
               <option value="">Pilih...</option>
               {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
             </select>
           </div>
           <div>
             <label className="font-bold">Pilih Mapel</label>
             <select className="w-full border p-2 rounded" value={config.mapel} onChange={e => setConfig({...config, mapel: e.target.value})}>
               <option value="">Pilih...</option>
               {guru.map(g => <option key={g.id} value={g.mapel}>{g.mapel}</option>)}
             </select>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
           <button onClick={() => setView('legger')} className="p-4 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 flex flex-col items-center">
             <FileText size={32} className="text-blue-600 mb-2"/>
             <span className="font-bold">Rekap / Legger Nilai</span>
           </button>
           <button onClick={() => setView('analisis')} className="p-4 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 flex flex-col items-center">
             <BarChart2 size={32} className="text-purple-600 mb-2"/>
             <span className="font-bold">Analisis Nilai (UH)</span>
           </button>
           <button onClick={() => setView('daftar')} className="p-4 bg-green-50 border border-green-200 rounded hover:bg-green-100 flex flex-col items-center">
             <Users size={32} className="text-green-600 mb-2"/>
             <span className="font-bold">Daftar Nilai</span>
           </button>
        </div>
      </div>
    )
  }

  // --- REPORT VIEWS ---
  
  // LEGGER
  if (view === 'legger') {
     return (
       <div className="bg-white min-h-screen p-8">
         <div className="print:hidden flex justify-between mb-4">
            <button onClick={() => setView('menu')} className="text-gray-500">Kembali</button>
            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Printer size={16}/> Cetak</button>
         </div>
         
         <ReportHeader title={`LEGER NILAI - KELAS ${selectedKelasData?.nama || ''} - ${config.mapel}`} />
         
         <table className="w-full border-collapse border border-black text-sm">
           <thead>
             <tr className="bg-gray-100">
               <th className="border border-black p-2 w-10">No</th>
               <th className="border border-black p-2">Nama Siswa</th>
               <th className="border border-black p-2 w-12">UH1</th>
               <th className="border border-black p-2 w-12">UH2</th>
               <th className="border border-black p-2 w-12">UH3</th>
               <th className="border border-black p-2 w-12">UH4</th>
               <th className="border border-black p-2 w-12">UH5</th>
               <th className="border border-black p-2 w-12 bg-gray-50">Rata</th>
               <th className="border border-black p-2 w-12">PTS</th>
               <th className="border border-black p-2 w-12">PAS</th>
               <th className="border border-black p-2 w-16 bg-gray-200">Akhir</th>
             </tr>
           </thead>
           <tbody>
             {filteredSiswa.map((s, idx) => {
               const sc = currentData?.scores?.[s.id] || {};
               // Calc logic repeated (ideally util func)
               let sum=0, count=0;
               ['uh1','uh2','uh3','uh4','uh5'].forEach(k=>{if(sc[k]>0){sum+=sc[k];count++}});
               const avg = count ? (sum/count).toFixed(0) : '';
               const w = currentData?.weights || {uh:2, pts:1, pas:1};
               const final = avg ? ((parseFloat(avg)*w.uh + (sc.pts||0)*w.pts + (sc.pas||0)*w.pas)/(w.uh+w.pts+w.pas)).toFixed(0) : '';

               return (
                 <tr key={s.id}>
                   <td className="border border-black p-1 text-center">{idx+1}</td>
                   <td className="border border-black p-1">{s.nama}</td>
                   <td className="border border-black p-1 text-center">{sc.uh1||'-'}</td>
                   <td className="border border-black p-1 text-center">{sc.uh2||'-'}</td>
                   <td className="border border-black p-1 text-center">{sc.uh3||'-'}</td>
                   <td className="border border-black p-1 text-center">{sc.uh4||'-'}</td>
                   <td className="border border-black p-1 text-center">{sc.uh5||'-'}</td>
                   <td className="border border-black p-1 text-center font-bold bg-gray-50">{avg}</td>
                   <td className="border border-black p-1 text-center">{sc.pts||'-'}</td>
                   <td className="border border-black p-1 text-center">{sc.pas||'-'}</td>
                   <td className="border border-black p-1 text-center font-bold bg-gray-200">{final}</td>
                 </tr>
               )
             })}
           </tbody>
         </table>
         <ReportFooter />
       </div>
     )
  }

  // ANALISIS
  if (view === 'analisis') {
    return (
      <div className="bg-white min-h-screen p-8">
        <div className="print:hidden flex justify-between mb-4 items-center">
           <button onClick={() => setView('menu')} className="text-gray-500">Kembali</button>
           <select className="border p-2 rounded" value={config.uh} onChange={e=>setConfig({...config, uh: e.target.value})}>
              <option value="uh1">UH 1</option>
              <option value="uh2">UH 2</option>
              <option value="uh3">UH 3</option>
              <option value="uh4">UH 4</option>
              <option value="uh5">UH 5</option>
           </select>
           <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Printer size={16}/> Cetak</button>
        </div>

        <ReportHeader title={`ANALISIS HASIL PENILAIAN (${config.uh.toUpperCase()})`} />
        
        <div className="mb-4 text-sm border p-2">
           <p><strong>Kelas:</strong> {selectedKelasData?.nama} | <strong>Mapel:</strong> {config.mapel}</p>
           <p><strong>Tujuan Pembelajaran:</strong> {currentData?.tp?.[parseInt(config.uh.replace('uh',''))-1] || '-'}</p>
           <p><strong>KKTP:</strong> {currentData?.kktp || 75}</p>
        </div>

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-10">No</th>
              <th className="border border-black p-2">Nama Siswa</th>
              <th className="border border-black p-2 w-20">Nilai</th>
              <th className="border border-black p-2 w-24">Ketuntasan</th>
              <th className="border border-black p-2">Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.map((s, idx) => {
              const val = currentData?.scores?.[s.id]?.[config.uh] || 0;
              const tuntas = val >= (currentData?.kktp || 75);
              return (
                <tr key={s.id}>
                  <td className="border border-black p-1 text-center">{idx+1}</td>
                  <td className="border border-black p-1">{s.nama}</td>
                  <td className="border border-black p-1 text-center">{val}</td>
                  <td className="border border-black p-1 text-center">{tuntas ? 'Tuntas' : 'Belum'}</td>
                  <td className="border border-black p-1">{tuntas ? 'Pengayaan' : 'Remedial'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        <div className="mt-6 text-sm grid grid-cols-2 gap-8 break-inside-avoid">
           <div className="border p-4">
              <strong>Hasil Analisis:</strong>
              <ul className="list-disc ml-5 mt-2">
                 <li>Jumlah Siswa: {filteredSiswa.length}</li>
                 <li>Tuntas: {filteredSiswa.filter(s => (currentData?.scores?.[s.id]?.[config.uh] || 0) >= (currentData?.kktp||75)).length}</li>
                 <li>Belum Tuntas: {filteredSiswa.filter(s => (currentData?.scores?.[s.id]?.[config.uh] || 0) < (currentData?.kktp||75)).length}</li>
              </ul>
           </div>
        </div>

        <ReportFooter />
      </div>
    )
  }

  // DAFTAR NILAI (Simple)
  if (view === 'daftar') {
      return (
          <div className="bg-white min-h-screen p-8">
            <div className="print:hidden flex justify-between mb-4">
                <button onClick={() => setView('menu')} className="text-gray-500">Kembali</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Printer size={16}/> Cetak</button>
            </div>
            
            <ReportHeader title={`DAFTAR NILAI - ${config.mapel}`} />
            
            <table className="w-full border-collapse border border-black text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-10">No</th>
                        <th className="border border-black p-2">Nama Siswa</th>
                        <th className="border border-black p-2 text-center">L/P</th>
                        <th className="border border-black p-2 w-32">Nilai Akhir</th>
                        <th className="border border-black p-2">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSiswa.map((s, idx) => {
                         const sc = currentData?.scores?.[s.id] || {};
                         // Calc
                         let sum=0, count=0;
                         ['uh1','uh2','uh3','uh4','uh5'].forEach(k=>{if(sc[k]>0){sum+=sc[k];count++}});
                         const avg = count ? (sum/count) : 0;
                         const w = currentData?.weights || {uh:2, pts:1, pas:1};
                         const final = avg ? ((avg*w.uh + (sc.pts||0)*w.pts + (sc.pas||0)*w.pas)/(w.uh+w.pts+w.pas)).toFixed(0) : 0;
                         const tuntas = final >= (currentData?.kktp || 75);

                        return (
                            <tr key={s.id}>
                                <td className="border border-black p-1 text-center">{idx+1}</td>
                                <td className="border border-black p-1">{s.nama}</td>
                                <td className="border border-black p-1 text-center">{s.gender}</td>
                                <td className="border border-black p-1 text-center font-bold">{final > 0 ? final : '-'}</td>
                                <td className="border border-black p-1">{final > 0 ? (tuntas ? 'Lulus KKTP' : 'Perlu Bimbingan') : '-'}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <ReportFooter />
          </div>
      )
  }

  return <div>Loading...</div>;
}

// --- UTILS ---
const InputGroup = ({ label, value, onChange, type="text" }) => (
  <div className="w-full">
    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
    <input 
      type={type} 
      className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);