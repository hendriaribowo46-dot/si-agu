import React, { useState, useEffect } from "react";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Trash2,
  Menu,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  LogOut,
  Lock,
  Mail,
  School,
  Building,
  UserCircle,
  Settings,
  Calendar,
  ChevronDown,
  History,
  Upload,
  Image as ImageIcon,
  UserCheck,
  FileText,
  Activity,
  Save,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Target,
  Filter,
  Calculator,
  BarChart2,
  Printer,
  BookOpen,
  TrendingUp,
  ClipboardList,
  Database,
  Sliders,
} from "lucide-react";

// --- Firebase Configuration & Setup ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";

// ==========================================
// KONFIGURASI FIREBASE
// ==========================================
const myFirebaseConfig = {
  apiKey: "AIzaSyBJ6ys7BbNxSPHdOtWG_kWI_hqlOwdg7jQ",
  authDomain: "gurupro-app.firebaseapp.com",
  projectId: "gurupro-app",
  storageBucket: "gurupro-app.firebasestorage.app",
  messagingSenderId: "411502537546",
  appId: "1:411502537546:web:7135e7322ca2e933b5efb3",
  measurementId: "G-FNB5YFM7ZR",
};

const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : myFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// --- Print Header Component ---
const PrintHeader = ({ profile, title, subtitle }) => (
  <div className="hidden print:flex flex-col items-center border-b-2 border-black pb-4 mb-6">
    <div className="flex items-center gap-4 w-full justify-center relative">
      {profile?.schoolLogo && (
        <img
          src={profile.schoolLogo}
          alt="Logo"
          className="h-24 w-24 object-contain absolute left-0 top-0"
        />
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold uppercase">
          {profile?.schoolName || "NAMA SEKOLAH"}
        </h1>
        <p className="text-sm">{profile?.schoolAddress || "Alamat Sekolah"}</p>
      </div>
    </div>
    <div className="mt-4 text-center w-full">
      <h2 className="text-xl font-bold uppercase border-t border-black pt-2 inline-block px-8">
        {title}
      </h2>
      {subtitle && <p className="text-sm font-medium">{subtitle}</p>}
    </div>
  </div>
);

// --- Signature Component ---
const PrintSignature = ({ profile, date = new Date() }) => (
  <div className="hidden print:flex justify-end mt-12 px-8">
    <div className="text-center">
      <p className="mb-16">
        {date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        <br />
        Guru Mata Pelajaran,
      </p>
      <p className="font-bold underline">
        {profile?.teacherName || "........................."}
      </p>
      <p>NIP. {profile?.teacherNIP || "........................."}</p>
    </div>
  </div>
);

// --- Auth Page ---
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let msg = "Terjadi kesalahan.";
      if (err.code === "auth/invalid-email") msg = "Format email salah.";
      if (err.code === "auth/user-not-found") msg = "Akun tidak ditemukan.";
      if (err.code === "auth/wrong-password") msg = "Password salah.";
      if (err.code === "auth/email-already-in-use")
        msg = "Email sudah terdaftar.";
      if (err.code === "auth/weak-password")
        msg = "Password minimal 6 karakter.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
        <div className="text-center mb-8">
          {/* BRANDING BARU: Gradient Text */}
          <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 drop-shadow-sm">
            SI-AGU
          </h1>
          <p className="text-indigo-500 text-xs font-bold mb-4 uppercase tracking-[0.2em]">
            (Sistem Administrasi Guru)
          </p>

          <p className="text-slate-500 text-sm mt-4">
            {isLogin
              ? "Masuk untuk mengelola kelas Anda"
              : "Buat akun guru baru secara gratis"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-start gap-2 border border-red-200 animate-pulse">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-slate-400"
                size={20}
              />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="nama@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-400"
                size={20}
              />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading
              ? "Memproses..."
              : isLogin
              ? "Masuk Aplikasi"
              : "Daftar Sekarang"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-slate-100 pt-6">
          <p className="text-slate-500">
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="ml-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
            >
              {isLogin ? "Daftar Baru" : "Login Disini"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Navigation ---
const Navigation = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onLogout,
  userProfile,
  academicYear,
  setAcademicYear,
  semester,
  setSemester,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "Profil & Sekolah", icon: School },
    { id: "classes", label: "Data Kelas", icon: Building },
    { id: "students", label: "Data Siswa", icon: Users },
    { id: "schedule", label: "Jadwal Ajar", icon: Clock },
    { id: "journal", label: "Jurnal Mengajar", icon: ClipboardList },
    { id: "attendance", label: "Absensi", icon: CalendarCheck },
    { id: "grades", label: "Buku Nilai", icon: GraduationCap },
    { id: "reports", label: "Laporan & Cetak", icon: Printer },
  ];

  const teacherName = userProfile?.teacherName || "Guru";
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -2; i < 3; i++) {
    years.push(`${currentYear + i}/${currentYear + i + 1}`);
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white shadow-lg">
      <div className="p-6 flex items-center justify-center border-b border-slate-800">
        {userProfile?.schoolLogo ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={userProfile.schoolLogo}
              alt="Logo"
              className="h-16 w-16 object-contain bg-white rounded-full p-1"
            />
            {/* BRANDING SIDEBAR (ADA LOGO) */}
            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                SI-AGU
              </h1>
              <p className="text-[10px] text-sky-200 font-medium tracking-wide uppercase">
                (Sistem Administrasi Guru)
              </p>
            </div>
          </div>
        ) : (
          /* BRANDING SIDEBAR (TANPA LOGO) */
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
              SI-AGU
            </h1>
            <p className="text-[10px] text-sky-200 font-medium tracking-wide uppercase">
              (Sistem Administrasi Guru)
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-4 border-b border-slate-700 space-y-3">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
          <History size={14} /> Tahun Ajaran Aktif
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="relative">
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg p-2 pr-8 appearance-none border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
            />
          </div>

          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setSemester("Ganjil")}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                semester === "Ganjil"
                  ? "bg-blue-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Ganjil
            </button>
            <button
              onClick={() => setSemester("Genap")}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                semester === "Genap"
                  ? "bg-blue-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Genap
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
            {teacherName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
              Login sebagai
            </p>
            <p
              className="text-sm font-medium text-white truncate w-32"
              title={teacherName}
            >
              {teacherName}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 group"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block w-64 fixed inset-y-0 left-0 z-30 print:hidden">
        <NavContent />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-40 px-4 py-2 flex justify-between items-center shadow-md print:hidden">
        {/* BRANDING HEADER MOBILE */}
        <div>
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 leading-none">
            SI-AGU
          </h1>
          <p className="text-[8px] text-sky-200 font-medium tracking-wide uppercase">
            (Sistem Administrasi Guru)
          </p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 flex items-center gap-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <span className="text-xs font-bold uppercase tracking-wider">
            Menu
          </span>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-16 bg-slate-900 animate-fade-in print:hidden">
          <NavContent />
        </div>
      )}
    </>
  );
};

// --- Profile View (Updated with Backup) ---
const SchoolProfileView = ({
  profile,
  onSaveProfile,
  db,
  user,
  appId,
  sessionID,
}) => {
  const [formData, setFormData] = useState({
    schoolName: "",
    schoolAddress: "",
    principalName: "",
    principalNIP: "",
    teacherName: "",
    teacherNIP: "",
    teacherSubject: "",
    schoolLogo: "",
  });
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    if (profile) setFormData((prev) => ({ ...prev, ...profile }));
  }, [profile]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) return alert("Ukuran file max 500KB.");
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({ ...prev, schoolLogo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // --- NEW FEATURE: BACKUP DATA ---
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const backupData = {
        profile: formData,
        session: sessionID,
        timestamp: new Date().toISOString(),
        students: [],
        classes: [],
        journals: [],
      };

      // Fetch all relevant collections
      const qStudents = await getDocs(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "students"
        )
      );
      backupData.students = qStudents.docs.map((d) => d.data());

      const qClasses = await getDocs(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "classes"
        )
      );
      backupData.classes = qClasses.docs.map((d) => d.data());

      const qJournals = await getDocs(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "journals"
        )
      );
      backupData.journals = qJournals.docs.map((d) => d.data());

      // Create Blob & Download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Backup_SIAGU_${sessionID}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Backup data berhasil didownload!");
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">
          Profil & Data Sekolah
        </h2>
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="flex items-center gap-2 text-xs font-bold bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900 disabled:opacity-50"
        >
          <Database size={14} />{" "}
          {isBackingUp ? "Proses Backup..." : "Backup Data"}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSaveProfile(formData);
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2 text-lg border-b pb-2">
              <School size={20} className="text-blue-500" /> Identitas Sekolah
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Logo Sekolah
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                    {formData.schoolLogo ? (
                      <img
                        src={formData.schoolLogo}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="text-slate-300" size={32} />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="text-white" size={20} />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    <p>Format: PNG/JPG</p>
                    <p>Max: 500KB</p>
                    {formData.schoolLogo && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, schoolLogo: "" }))
                        }
                        className="text-red-500 hover:underline mt-1"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="SMA Negeri..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Alamat Sekolah
                </label>
                <textarea
                  name="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2 text-lg border-b pb-2">
              <UserCheck size={20} className="text-purple-500" /> Kepala Sekolah
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  name="principalName"
                  value={formData.principalName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  name="principalNIP"
                  value={formData.principalNIP}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2 text-lg border-b pb-2">
              <UserCircle size={20} className="text-green-500" /> Data Guru
              (Anda)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="teacherName"
                  value={formData.teacherName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  NIP / NUPTK
                </label>
                <input
                  type="text"
                  name="teacherNIP"
                  value={formData.teacherNIP}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  name="teacherSubject"
                  value={formData.teacherSubject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Simpan Semua Data
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Classes Manager ---
const ClassesManager = ({
  classes,
  onAddClass,
  onDeleteClass,
  sessionLabel,
}) => {
  const [className, setClassName] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (className.trim()) {
      onAddClass({ name: className });
      setClassName("");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Kelas</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
          {sessionLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={18} /> Tambah Kelas
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Misal: X-A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Tambah
            </button>
          </form>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {classes.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada data kelas.
            </div>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-300 transition-colors"
              >
                <div className="font-bold text-slate-700 text-lg">
                  {cls.name}
                </div>
                <button
                  onClick={() => onDeleteClass(cls.id)}
                  className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Dashboard ---
const Dashboard = ({
  students,
  schedules,
  profile,
  academicYear,
  semester,
}) => {
  const totalStudents = students.length;
  const todayDate = new Date().toISOString().split("T")[0];
  const presentToday = students.filter(
    (s) => s.attendance?.[todayDate] === "present"
  ).length;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayName = days[new Date().getDay()];
  const todaySchedules = schedules.filter((s) => s.day === todayName);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          {profile?.schoolLogo ? (
            <img
              src={profile.schoolLogo}
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500">
              <School size={32} />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Dashboard{" "}
              {profile?.teacherName ? `Pak/Bu ${profile.teacherName}` : "Guru"}
            </h2>
            <p className="text-slate-500 font-medium">
              {profile?.schoolName || "Nama Sekolah Belum Diisi"}
              {profile?.principalName && (
                <span className="block text-xs text-slate-400 mt-1 font-normal">
                  Kepala Sekolah: {profile.principalName}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right border-l pl-6 border-slate-100 hidden md:block">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Sesi Aktif
          </div>
          <div className="text-xl font-bold text-blue-600">
            {academicYear}{" "}
            <span className="text-slate-400 text-sm font-normal">
              | {semester}
            </span>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Siswa</p>
            <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-100 rounded-full text-green-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Hadir Hari Ini</p>
            <p className="text-2xl font-bold text-slate-800">{presentToday}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-100 rounded-full text-orange-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Jadwal Hari Ini</p>
            <p className="text-2xl font-bold text-slate-800">
              {todaySchedules.length}{" "}
              <span className="text-sm font-normal text-slate-400">Kelas</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Students Manager ---
const StudentsManager = ({
  students,
  classes,
  onAddStudent,
  onBatchAddStudents,
  onDeleteStudent,
  sessionLabel,
}) => {
  const [newName, setNewName] = useState("");
  const [newNIS, setNewNIS] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newNIS.trim()) {
      onAddStudent({
        name: newName,
        nis: newNIS,
        className: selectedClass || "Tanpa Kelas",
        attendance: {},
        grades: {},
      });
      setNewName("");
      setNewNIS("");
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const newStudents = [];
      const startIndex = lines[0].toLowerCase().includes("nis") ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(",");
          if (parts.length >= 2) {
            const nis = parts[0].trim();
            const name = parts[1].trim();
            const cls = parts[2]
              ? parts[2].trim()
              : selectedClass || "Tanpa Kelas";
            if (nis && name)
              newStudents.push({
                nis: nis,
                name: name,
                className: cls,
                attendance: {},
                grades: {},
              });
          }
        }
      }
      if (newStudents.length > 0) {
        if (
          confirm(
            `Ditemukan ${newStudents.length} data siswa. Lanjutkan import?`
          )
        ) {
          await onBatchAddStudents(newStudents);
          alert("Import berhasil!");
        }
      } else {
        alert("Tidak ada data valid.");
      }
      setIsImporting(false);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,NIS,Nama Lengkap,Kelas\n12345,Ahmad Budi,X-A\n12346,Siti Aminah,X-A";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_siswa_gurupro.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Siswa</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 mt-1 inline-block">
            {sessionLabel}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download size={16} />{" "}
            <span className="hidden sm:inline">Template</span>
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors ${
                isImporting ? "opacity-70 cursor-wait" : ""
              }`}
            >
              {isImporting ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <FileSpreadsheet size={16} />
              )}
              <span className="hidden sm:inline">
                {isImporting ? "Importing..." : "Import CSV"}
              </span>
            </button>
          </div>
        </div>
      </div>
      {classes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>
            <b>Tips:</b> Anda bisa mengetik nama kelas langsung di bawah, atau
            buat daftar kelas di menu <b>Data Kelas</b> agar muncul otomatis.
          </span>
        </div>
      )}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Plus size={18} /> Tambah Siswa Baru
        </h3>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-4"
        >
          <input
            type="text"
            placeholder="NIS"
            value={newNIS}
            onChange={(e) => setNewNIS(e.target.value)}
            className="w-full md:w-1/4 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="w-full md:w-1/4 relative">
            <input
              list="classOptions"
              placeholder="Pilih/Ketik Kelas"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full pl-4 pr-8 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <datalist id="classOptions">
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name} />
              ))}
            </datalist>
            {selectedClass && (
              <button
                type="button"
                onClick={() => setSelectedClass("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 bg-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Simpan
          </button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">NIS</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Nama</th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  Kelas
                </th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-slate-600">
                    {student.nis}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {student.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
                      {student.className || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDeleteStudent(student.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Belum ada data siswa untuk sesi ini.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Schedule View ---
const ScheduleView = ({
  schedules,
  classes,
  onAddSchedule,
  onDeleteSchedule,
  sessionLabel,
}) => {
  const [day, setDay] = useState("Senin");
  const [time, setTime] = useState("");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [className, setClassName] = useState("");
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (time && subject && className) {
      onAddSchedule({ day, time, subject, room, className });
      setTime("");
      setSubject("");
      setRoom("");
      setClassName("");
    }
  };

  const groupedSchedules = days.map((d) => ({
    day: d,
    items: schedules
      .filter((s) => s.day === d)
      .sort((a, b) => a.time.localeCompare(b.time)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Jadwal Mengajar</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
          {sessionLabel}
        </span>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Plus size={18} /> Tambah Jadwal
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              list="scheduleClassOptions"
              placeholder="Pilih Kelas"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full pl-4 pr-8 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <datalist id="scheduleClassOptions">
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name} />
              ))}
            </datalist>
            {className && (
              <button
                type="button"
                onClick={() => setClassName("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 bg-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Mapel"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Simpan
          </button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedSchedules.map((group) => (
          <div
            key={group.day}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
              {group.day}
              <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-500">
                {group.items.length} Mapel
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {group.items.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm italic">
                  Kosong
                </div>
              ) : (
                group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          {item.className}
                        </span>
                        <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                          <Clock size={12} /> {item.time}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">{item.subject}</div>
                    </div>
                    <button
                      onClick={() => onDeleteSchedule(item.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Attendance View ---
const AttendanceView = ({
  students,
  schedules,
  onUpdateStudent,
  sessionLabel,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceBuffer, setAttendanceBuffer] = useState({});
  const [loading, setLoading] = useState(false);
  const uniqueClasses = [...new Set(students.map((s) => s.className))].sort();

  useEffect(() => {
    if (activeTab === "recap" && !selectedClass && uniqueClasses.length > 0)
      setSelectedClass(uniqueClasses[0]);
  }, [activeTab, uniqueClasses]);

  const getRecap = (student) => {
    const attendance = student.attendance || {};
    let h = 0,
      s = 0,
      i = 0,
      a = 0;
    Object.values(attendance).forEach((st) => {
      if (st === "present") h++;
      if (st === "sick") s++;
      if (st === "permission") i++;
      if (st === "absent") a++;
    });
    const total = h + s + i + a;
    const percent = total > 0 ? Math.round((h / total) * 100) : 0;
    return { h, s, i, a, percent };
  };

  const getDayName = (dateStr) =>
    ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
      new Date(dateStr).getDay()
    ];
  const dayName = getDayName(date);
  const todaySchedules = schedules.filter((s) => s.day === dayName);
  const dailyClasses = [...new Set(todaySchedules.map((s) => s.className))];
  const classStudents = students.filter((s) => s.className === selectedClass);

  useEffect(() => {
    if (selectedClass && activeTab === "daily") {
      const buffer = {};
      classStudents.forEach((student) => {
        buffer[student.id] = student.attendance?.[date] || "present";
      });
      setAttendanceBuffer(buffer);
    }
  }, [selectedClass, date, students, activeTab]);
  const handleStatusChange = (studentId, status) =>
    setAttendanceBuffer((prev) => ({ ...prev, [studentId]: status }));
  const handleSaveAttendance = async () => {
    setLoading(true);
    try {
      await Promise.all(
        Object.keys(attendanceBuffer).map((studentId) => {
          const student = students.find((s) => s.id === studentId);
          if (
            student &&
            student.attendance?.[date] !== attendanceBuffer[studentId]
          )
            return onUpdateStudent(studentId, {
              attendance: {
                ...student.attendance,
                [date]: attendanceBuffer[studentId],
              },
            });
          return Promise.resolve();
        })
      );
      alert("Data absensi berhasil disimpan!");
      if (activeTab === "daily") setSelectedClass(null);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-2xl font-bold text-slate-800">Absensi Siswa</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
              activeTab === "daily"
                ? "bg-white shadow text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setActiveTab("recap")}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
              activeTab === "recap"
                ? "bg-white shadow text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Rekapitulasi
          </button>
        </div>
      </div>

      {activeTab === "daily" && (
        <>
          {!selectedClass ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border p-2 rounded-lg"
                />
                <span className="text-slate-500">{dayName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dailyClasses.length > 0 ? (
                  dailyClasses.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className="bg-white p-6 rounded-xl border shadow-sm hover:border-blue-300 text-left"
                    >
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        KELAS
                      </span>
                      <h3 className="text-2xl font-bold text-slate-800 mt-2">
                        {cls}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {students.filter((s) => s.className === cls).length}{" "}
                        Siswa
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400">
                    Tidak ada jadwal hari ini.
                  </div>
                )}
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-400 mb-2">
                  Pilih kelas manual:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {uniqueClasses.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedClass(c)}
                      className="text-xs border px-3 py-1 rounded-full hover:bg-slate-50"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <ArrowLeft />
                </button>
                <h3 className="text-xl font-bold">
                  Input Absen Kelas {selectedClass}
                </h3>
              </div>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Nama</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classStudents.map((s) => (
                      <tr key={s.id}>
                        <td className="px-6 py-3 font-medium">{s.name}</td>
                        <td className="px-6 py-3 flex justify-center gap-2">
                          {["present", "sick", "permission", "absent"].map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(s.id, st)}
                                className={`w-8 h-8 rounded font-bold text-xs ${
                                  attendanceBuffer[s.id] === st
                                    ? st === "present"
                                      ? "bg-green-500 text-white"
                                      : st === "sick"
                                      ? "bg-yellow-500 text-white"
                                      : st === "permission"
                                      ? "bg-blue-500 text-white"
                                      : "bg-red-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {st === "present"
                                  ? "H"
                                  : st === "sick"
                                  ? "S"
                                  : st === "permission"
                                  ? "I"
                                  : "A"}
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleSaveAttendance}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg"
              >
                Simpan Absensi
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "recap" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center print:hidden">
            <select
              value={selectedClass || ""}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border p-2 rounded-lg bg-white shadow-sm font-medium"
            >
              <option value="">-- Pilih Kelas --</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {selectedClass && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Printer size={18} /> Cetak Rekap
              </button>
            )}
          </div>
          {selectedClass ? (
            <div className="print:w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
              <PrintHeader
                profile={profile}
                title={`REKAPITULASI ABSENSI SISWA`}
                subtitle={`Kelas: ${selectedClass} | Sesi: ${sessionLabel}`}
              />
              <div className="overflow-hidden border border-black rounded-sm print:border-black">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-black print:bg-white">
                    <tr>
                      <th className="px-4 py-3 border-r border-black w-10 text-center">
                        No
                      </th>
                      <th className="px-4 py-3 border-r border-black">
                        Nama Siswa
                      </th>
                      <th className="px-2 py-3 text-center border-r border-black w-12 bg-green-50 print:bg-white">
                        H
                      </th>
                      <th className="px-2 py-3 text-center border-r border-black w-12 bg-yellow-50 print:bg-white">
                        S
                      </th>
                      <th className="px-2 py-3 text-center border-r border-black w-12 bg-blue-50 print:bg-white">
                        I
                      </th>
                      <th className="px-2 py-3 text-center border-r border-black w-12 bg-red-50 print:bg-white">
                        A
                      </th>
                      <th className="px-4 py-3 text-center w-24">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {classStudents.map((s, idx) => {
                      const r = getRecap(s);
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-2 border-r border-black text-center">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 border-r border-black">
                            {s.name}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-black">
                            {r.h}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-black">
                            {r.s}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-black">
                            {r.i}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-black">
                            {r.a}
                          </td>
                          <td className="px-4 py-2 text-center font-bold">
                            {r.percent}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PrintSignature profile={profile} />
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">
              Pilih kelas untuk melihat rekap.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Journal View ---
const JournalView = ({
  classes,
  sessionLabel,
  db,
  user,
  appId,
  sessionID,
  profile,
}) => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    className: "",
    timeSlot: "",
    subject: profile?.teacherSubject?.split(",")[0]?.trim() || "",
    material: "",
    notes: "",
  });
  useEffect(() => {
    if (!user || !sessionID) return;
    const q = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "journals"
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setJournals(
        snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.date.localeCompare(a.date))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [user, sessionID]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.className || !formData.material)
      return alert("Kelas dan Materi wajib diisi");
    try {
      await addDoc(
        collection(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "journals"
        ),
        { ...formData, createdAt: serverTimestamp() }
      );
      setFormData((prev) => ({ ...prev, material: "", notes: "" }));
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan jurnal");
    }
  };
  const handleDelete = async (id) => {
    if (confirm("Hapus jurnal ini?"))
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "journals",
          id
        )
      );
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 print:hidden">
        <ClipboardList /> Jurnal Mengajar Guru
      </h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Kelas
            </label>
            <select
              required
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
              className="w-full border p-2 rounded-lg bg-white"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Jam Ke-
            </label>
            <input
              type="text"
              placeholder="Contoh: 1-2"
              value={formData.timeSlot}
              onChange={(e) =>
                setFormData({ ...formData, timeSlot: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Mata Pelajaran
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
              placeholder="Matematika"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Materi / Topik Pembelajaran
            </label>
            <textarea
              required
              rows="2"
              value={formData.material}
              onChange={(e) =>
                setFormData({ ...formData, material: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
              placeholder="Ringkasan materi yang diajarkan..."
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Catatan / Kejadian di Kelas
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
              placeholder="Siswa ijin, kendala teknis, dll..."
            ></textarea>
          </div>
          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
            >
              Simpan Jurnal
            </button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center print:hidden">
          <h3 className="font-bold text-slate-700">Riwayat Jurnal</h3>
          <button
            onClick={() => window.print()}
            className="text-sm flex items-center gap-2 text-blue-600 font-bold"
          >
            <Printer size={16} /> Cetak Jurnal
          </button>
        </div>
        <div className="print:p-8">
          <PrintHeader
            profile={profile}
            title="JURNAL MENGAJAR GURU"
            subtitle={`Sesi: ${sessionLabel}`}
          />
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-100 print:bg-white border-b border-black">
              <tr>
                <th className="border border-black px-4 py-2 w-24">Tanggal</th>
                <th className="border border-black px-4 py-2 w-16 text-center">
                  Jam
                </th>
                <th className="border border-black px-4 py-2 w-20 text-center">
                  Kelas
                </th>
                <th className="border border-black px-4 py-2 w-32">Mapel</th>
                <th className="border border-black px-4 py-2">
                  Materi / Kegiatan
                </th>
                <th className="border border-black px-4 py-2 w-48">Catatan</th>
                <th className="border border-black px-2 py-2 w-10 text-center print:hidden">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {journals.length > 0 ? (
                journals.map((j) => (
                  <tr key={j.id}>
                    <td className="border border-black px-4 py-2">{j.date}</td>
                    <td className="border border-black px-4 py-2 text-center">
                      {j.timeSlot}
                    </td>
                    <td className="border border-black px-4 py-2 text-center font-bold">
                      {j.className}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {j.subject}
                    </td>
                    <td className="border border-black px-4 py-2">
                      {j.material}
                    </td>
                    <td className="border border-black px-4 py-2 italic text-slate-600">
                      {j.notes || "-"}
                    </td>
                    <td className="border border-black px-2 py-2 text-center print:hidden">
                      <button
                        onClick={() => handleDelete(j.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Belum ada data jurnal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PrintSignature profile={profile} />
        </div>
      </div>
    </div>
  );
};

// --- GRADES VIEW (With Weighting) ---
const GradesView = ({
  students,
  onUpdateStudent,
  profile,
  sessionLabel,
  db,
  user,
  appId,
  sessionID,
}) => {
  const defaultSubjects = [
    "Matematika",
    "B. Indonesia",
    "IPA",
    "IPS",
    "B. Inggris",
  ];
  const [subjectList, setSubjectList] = useState(defaultSubjects);
  const [selectedSubject, setSelectedSubject] = useState(defaultSubjects[0]);
  const [selectedClassFilter, setSelectedClassFilter] = useState("Semua");
  const [kktpSettings, setKktpSettings] = useState({});
  const [weights, setWeights] = useState({ h: 2, t: 1, a: 1 }); // Default weights
  const [isEditingWeights, setIsEditingWeights] = useState(false);

  useEffect(() => {
    if (profile?.teacherSubject) {
      const customSubjects = profile.teacherSubject
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (customSubjects.length > 0) {
        setSubjectList(customSubjects);
        setSelectedSubject(customSubjects[0]);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!user || !sessionID) return;
    const configRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "grade_config",
      "settings"
    );
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setKktpSettings(data);
        if (data.weights) setWeights(data.weights);
      }
    });
    return () => unsub();
  }, [user, sessionID, db, appId]);

  const handleKktpChange = async (e) => {
    const val = parseInt(e.target.value) || 0;
    const key = `${selectedSubject}_${selectedClassFilter}`;
    setKktpSettings((prev) => ({ ...prev, [key]: val }));
    if (user && sessionID)
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "grade_config",
          "settings"
        ),
        { [key]: val },
        { merge: true }
      );
  };
  const handleGradeChange = (student, type, value) => {
    const key = `${selectedSubject}_${type}`;
    onUpdateStudent(student.id, {
      grades: { ...student.grades, [key]: value },
    });
  };
  const getKktpForClass = (className) => {
    const key = `${selectedSubject}_${className}`;
    return kktpSettings[key] || 75;
  };

  const saveWeights = async () => {
    if (user && sessionID) {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "grade_config",
          "settings"
        ),
        { weights },
        { merge: true }
      );
    }
    setIsEditingWeights(false);
  };

  const filteredStudents =
    selectedClassFilter === "Semua"
      ? students
      : students.filter((s) => s.className === selectedClassFilter);
  const uniqueClasses = ["Semua", ...new Set(students.map((s) => s.className))];
  const getDisplayValue = (value) => {
    if (value === 0 || value === "0" || value === undefined || value === null)
      return "";
    return value;
  };
  const getEffectiveScore = (student, type) => {
    const g = student.grades || {};
    const original = parseInt(g[`${selectedSubject}_${type}`] || 0);
    const remedial = parseInt(g[`${selectedSubject}_${type}_remedial`] || 0);
    const isRemedialUsed = remedial > original;
    return {
      val: isRemedialUsed ? remedial : original,
      isRemedial: isRemedialUsed,
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Buku Nilai (Input)
            </h2>
            <p className="text-xs text-slate-500 mt-1">Sesi: {sessionLabel}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm bg-slate-50 font-medium"
            >
              {subjectList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm bg-slate-50 font-medium"
            >
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Weighting Config */}
        <div className="pt-4 border-t flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Sliders size={16} /> Bobot Nilai:
          </div>
          {isEditingWeights ? (
            <div className="flex items-center gap-2">
              H:{" "}
              <input
                type="number"
                className="w-10 border rounded text-center"
                value={weights.h}
                onChange={(e) =>
                  setWeights({ ...weights, h: Number(e.target.value) })
                }
              />
              T:{" "}
              <input
                type="number"
                className="w-10 border rounded text-center"
                value={weights.t}
                onChange={(e) =>
                  setWeights({ ...weights, t: Number(e.target.value) })
                }
              />
              A:{" "}
              <input
                type="number"
                className="w-10 border rounded text-center"
                value={weights.a}
                onChange={(e) =>
                  setWeights({ ...weights, a: Number(e.target.value) })
                }
              />
              <button
                onClick={saveWeights}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs"
              >
                Simpan
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                Harian: {weights.h}
              </span>
              <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                UTS: {weights.t}
              </span>
              <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                UAS: {weights.a}
              </span>
              <button
                onClick={() => setIsEditingWeights(true)}
                className="text-blue-600 text-xs underline"
              >
                Ubah
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
        {selectedClassFilter !== "Semua" && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              KKTP Kelas {selectedClassFilter}:
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={getKktpForClass(selectedClassFilter)}
              onChange={handleKktpChange}
              className="w-16 text-center border rounded px-2 py-1 text-sm font-bold text-blue-600"
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs uppercase text-slate-500 font-bold w-48">
                  Siswa
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14">
                  UH 1
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14">
                  UH 2
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14">
                  UH 3
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14">
                  UH 4
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14">
                  UH 5
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14 bg-purple-50">
                  UTS
                </th>
                <th className="px-2 py-3 text-center text-xs uppercase text-slate-500 w-14 bg-orange-50">
                  UAS
                </th>
                <th className="px-4 py-3 text-center text-xs uppercase text-slate-500 font-bold border-l">
                  NA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.map((s) => {
                const g = s.grades || {};

                // Calculate Effective Scores
                const uhList = ["uh1", "uh2", "uh3", "uh4", "uh5"].map(
                  (t) => getEffectiveScore(s, t).val
                );
                const uts = getEffectiveScore(s, "uts").val;
                const uas = getEffectiveScore(s, "uas").val;

                // Calculate Avg UH based on NON-ZERO count
                const activeUH = uhList.filter((v) => v > 0);
                const avgUH =
                  activeUH.length > 0
                    ? activeUH.reduce((a, b) => a + b, 0) / activeUH.length
                    : 0;

                // Dynamic Weighted NA Calculation
                let na = 0,
                  hasScore = false;
                if (activeUH.length > 0 || uts > 0 || uas > 0) {
                  const totalWeight =
                    (activeUH.length > 0 ? weights.h : 0) +
                    (uts > 0 ? weights.t : 0) +
                    (uas > 0 ? weights.a : 0);
                  if (totalWeight > 0) {
                    na = Math.round(
                      (weights.h * avgUH + weights.t * uts + weights.a * uas) /
                        totalWeight
                    );
                    hasScore = true;
                  }
                }
                const kktp = getKktpForClass(s.className);
                const color = hasScore
                  ? na >= kktp
                    ? "text-green-600"
                    : "text-red-500"
                  : "text-slate-400";

                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">
                      {s.name}
                      <div className="text-xs text-slate-400">
                        {s.className}
                      </div>
                    </td>
                    {["uh1", "uh2", "uh3", "uh4", "uh5", "uts", "uas"].map(
                      (type) => {
                        const isRem =
                          (g[`${selectedSubject}_${type}_remedial`] || 0) >
                          (g[`${selectedSubject}_${type}`] || 0);
                        const bgColor =
                          type === "uts"
                            ? "bg-purple-50/30"
                            : type === "uas"
                            ? "bg-orange-50/30"
                            : "";
                        return (
                          <td key={type} className={`px-1 py-2 ${bgColor}`}>
                            <div className="relative">
                              <input
                                type="number"
                                className={`w-full text-center border rounded p-1 ${
                                  isRem
                                    ? "text-blue-600 font-bold border-blue-300"
                                    : ""
                                }`}
                                value={getDisplayValue(
                                  g[`${selectedSubject}_${type}`]
                                )}
                                onChange={(e) =>
                                  handleGradeChange(s, type, e.target.value)
                                }
                              />
                              {isRem && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full -mt-1 -mr-1"></div>
                              )}
                            </div>
                          </td>
                        );
                      }
                    )}
                    <td
                      className={`px-4 py-2 text-center font-bold border-l ${color}`}
                    >
                      {hasScore ? na : "-"}
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
};

// --- Reports View (Dedicated Page with Export) ---
const ReportsView = ({
  students,
  profile,
  sessionLabel,
  db,
  user,
  appId,
  sessionID,
}) => {
  const [reportType, setReportType] = useState("attendance");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Matematika");
  const [selectedUH, setSelectedUH] = useState("uh1");
  const [kktpSettings, setKktpSettings] = useState({});
  const [assessmentMeta, setAssessmentMeta] = useState({});
  const [journals, setJournals] = useState([]);
  const [weights, setWeights] = useState({ h: 2, t: 1, a: 1 });

  const uniqueClasses = [...new Set(students.map((s) => s.className))].sort();
  const filteredStudents = selectedClass
    ? students.filter((s) => s.className === selectedClass)
    : [];

  useEffect(() => {
    if (!selectedClass && uniqueClasses.length > 0)
      setSelectedClass(uniqueClasses[0]);
  }, [uniqueClasses]);
  useEffect(() => {
    if (!user || !sessionID) return;
    const configRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "grade_config",
      "settings"
    );
    const unsubKKTP = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setKktpSettings(d);
        if (d.weights) setWeights(d.weights);
      } else setKktpSettings({});
    });
    const metaRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "grade_config",
      "assessment_meta"
    );
    const unsubMeta = onSnapshot(metaRef, (snap) =>
      snap.exists() ? setAssessmentMeta(snap.data()) : setAssessmentMeta({})
    );
    const journalRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "journals"
    );
    const unsubJournal = onSnapshot(journalRef, (snap) => {
      setJournals(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => b.date.localeCompare(a.date))
      );
    });
    return () => {
      unsubKKTP();
      unsubMeta();
      unsubJournal();
    };
  }, [user, sessionID]);

  const getRecap = (student) => {
    const attendance = student.attendance || {};
    let h = 0,
      s = 0,
      i = 0,
      a = 0;
    Object.values(attendance).forEach((st) => {
      if (st === "present") h++;
      if (st === "sick") s++;
      if (st === "permission") i++;
      if (st === "absent") a++;
    });
    const total = h + s + i + a;
    const percent = total > 0 ? Math.round((h / total) * 100) : 0;
    return { h, s, i, a, percent };
  };
  const getKktp = () => {
    const key = `${selectedSubject}_${selectedClass}`;
    return kktpSettings[key] || 75;
  };
  const getEffectiveScore = (student, type) => {
    const g = student.grades || {};
    const original = parseInt(g[`${selectedSubject}_${type}`] || 0);
    const remedial = parseInt(g[`${selectedSubject}_${type}_remedial`] || 0);
    return Math.max(original, remedial);
  };
  const getAnalysisStats = () => {
    if (!selectedClass) return null;
    const scores = filteredStudents.map((s) =>
      getEffectiveScore(s, selectedUH)
    );
    const valid = scores.filter((s) => s > 0);
    if (valid.length === 0) return null;
    const kktp = getKktp();
    const passed = valid.filter((s) => s >= kktp).length;
    return {
      max: Math.max(...valid),
      min: Math.min(...valid),
      avg: Math.round(valid.reduce((a, b) => a + b, 0) / valid.length),
      passRate: Math.round((passed / valid.length) * 100),
      passed,
      failed: valid.length - passed,
    };
  };

  const handleExportExcel = () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    let filename = `Laporan_${reportType}.csv`;
    if (reportType === "journal") {
      filename = `Jurnal_Mengajar_${sessionLabel}.csv`;
      csv += "Tanggal,Jam Ke,Kelas,Mata Pelajaran,Materi,Catatan\n";
      journals.forEach((j) => {
        csv += `"${j.date}","${j.timeSlot}","${j.className}","${j.subject}","${
          j.material
        }","${j.notes || ""}"\n`;
      });
    } else if (reportType === "attendance") {
      if (!selectedClass) return;
      filename = `Rekap_Absen_${selectedClass}_${sessionLabel}.csv`;
      csv +=
        "No,Nama Siswa,Hadir (H),Sakit (S),Ijin (I),Alpa (A),Persentase (%)\n";
      filteredStudents.forEach((s, i) => {
        const r = getRecap(s);
        csv += `${i + 1},"${s.name}",${r.h},${r.s},${r.i},${r.a},"${
          r.percent
        }%"\n`;
      });
    } else if (reportType === "grades") {
      if (!selectedClass) return;
      filename = `Leger_Nilai_${selectedSubject}_${selectedClass}.csv`;
      csv +=
        "No,Nama Siswa,UH1,UH2,UH3,UH4,UH5,UTS,UAS,Nilai Akhir,Keterangan\n";
      const kktp = getKktp();
      filteredStudents.forEach((s, i) => {
        const scores = ["uh1", "uh2", "uh3", "uh4", "uh5"].map((t) =>
          getEffectiveScore(s, t)
        );
        const uts = getEffectiveScore(s, "uts");
        const uas = getEffectiveScore(s, "uas");
        const activeUH = scores.filter((v) => v > 0);
        const avgUH =
          activeUH.length > 0
            ? activeUH.reduce((a, b) => a + b, 0) / activeUH.length
            : 0;
        let na = 0;
        if (activeUH.length > 0 || uts > 0 || uas > 0) {
          const totalWeight =
            (activeUH.length > 0 ? weights.h : 0) +
            (uts > 0 ? weights.t : 0) +
            (uas > 0 ? weights.a : 0);
          if (totalWeight > 0)
            na = Math.round(
              (weights.h * avgUH + weights.t * uts + weights.a * uas) /
                totalWeight
            );
        }
        const ket = na >= kktp ? "Tuntas" : na > 0 ? "Belum Tuntas" : "-";
        csv += `${i + 1},"${s.name}",${scores.join(",")},${uts || ""},${
          uas || ""
        },${na || ""},${ket}\n`;
      });
    } else if (reportType === "analysis") {
      if (!selectedClass) return;
      filename = `Analisis_${selectedSubject}_${selectedUH}_${selectedClass}.csv`;
      csv += "No,Nama Siswa,Nilai Awal,Status,Nilai Perbaikan,Nilai Akhir\n";
      const kktp = getKktp();
      filteredStudents.forEach((s, i) => {
        const g = s.grades || {};
        const org = parseInt(g[`${selectedSubject}_${selectedUH}`] || 0);
        const rem = g[`${selectedSubject}_${selectedUH}_remedial`] || 0;
        const final = Math.max(org, parseInt(rem) || 0);
        const status = org >= kktp ? "Tuntas" : "Remedial";
        if (!org && !rem) return;
        csv += `${i + 1},"${s.name}",${org},${status},${rem || "-"},${final}\n`;
      });
    }
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Printer /> Pusat Laporan & Cetak
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Jenis Laporan
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border p-2 rounded-lg bg-slate-50"
            >
              <option value="attendance">Rekap Absensi</option>
              <option value="grades">Leger Nilai (Rapor)</option>
              <option value="analysis">Analisis Ulangan</option>
              <option value="journal">Jurnal Mengajar</option>
            </select>
          </div>
          {reportType !== "journal" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Pilih Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border p-2 rounded-lg bg-slate-50"
              >
                <option value="">-- Pilih --</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          {reportType !== "attendance" && reportType !== "journal" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border p-2 rounded-lg bg-slate-50"
              >
                {["Matematika", "B. Indonesia", "IPA", "IPS", "B. Inggris"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </div>
          )}
          {reportType === "analysis" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Penilaian
              </label>
              <select
                value={selectedUH}
                onChange={(e) => setSelectedUH(e.target.value)}
                className="w-full border p-2 rounded-lg bg-slate-50"
              >
                {["uh1", "uh2", "uh3", "uh4", "uh5", "uts", "uas"].map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button
            onClick={handleExportExcel}
            disabled={reportType !== "journal" && !selectedClass}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 shadow-md transition-colors"
          >
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button
            onClick={() => window.print()}
            disabled={reportType !== "journal" && !selectedClass}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 shadow-md transition-colors"
          >
            <Printer size={18} /> Cetak Dokumen
          </button>
        </div>
      </div>

      {selectedClass || reportType === "journal" ? (
        <div className="bg-white p-8 rounded-xl shadow-none border-none print:p-0">
          {(selectedClass || reportType === "journal") && (
            <PrintHeader
              profile={profile}
              title={
                reportType === "journal"
                  ? "JURNAL MENGAJAR GURU"
                  : reportType === "attendance"
                  ? "REKAPITULASI ABSENSI"
                  : reportType === "grades"
                  ? "DAFTAR NILAI SISWA"
                  : "ANALISIS HASIL PENILAIAN"
              }
              subtitle={`Sesi: ${sessionLabel} ${
                selectedClass ? `| Kelas: ${selectedClass}` : ""
              } ${
                reportType !== "attendance" && reportType !== "journal"
                  ? `| Mapel: ${selectedSubject}`
                  : ""
              }`}
            />
          )}
          {reportType === "journal" && (
            <div className="overflow-hidden border border-black rounded-sm print:border-black">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 print:bg-white border-b border-black">
                  <tr>
                    <th className="border border-black px-4 py-2 w-24">
                      Tanggal
                    </th>
                    <th className="border border-black px-4 py-2 w-16 text-center">
                      Jam
                    </th>
                    <th className="border border-black px-4 py-2 w-20 text-center">
                      Kelas
                    </th>
                    <th className="border border-black px-4 py-2 w-32">
                      Mapel
                    </th>
                    <th className="border border-black px-4 py-2">
                      Materi / Kegiatan
                    </th>
                    <th className="border border-black px-4 py-2 w-48">
                      Catatan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {journals.length > 0 ? (
                    journals.map((j) => (
                      <tr key={j.id}>
                        <td className="border border-black px-4 py-2">
                          {j.date}
                        </td>
                        <td className="border border-black px-4 py-2 text-center">
                          {j.timeSlot}
                        </td>
                        <td className="border border-black px-4 py-2 text-center font-bold">
                          {j.className}
                        </td>
                        <td className="border border-black px-4 py-2">
                          {j.subject}
                        </td>
                        <td className="border border-black px-4 py-2">
                          {j.material}
                        </td>
                        <td className="border border-black px-4 py-2 italic">
                          {j.notes || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center">
                        Belum ada data jurnal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {reportType === "attendance" && selectedClass && (
            <div className="overflow-hidden border border-black rounded-sm print:border-black">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 print:bg-white border-b border-black">
                  <tr>
                    <th className="border-r border-black px-4 py-2 w-10 text-center">
                      No
                    </th>
                    <th className="border-r border-black px-4 py-2">
                      Nama Siswa
                    </th>
                    <th className="border-r border-black px-2 py-2 w-12 text-center">
                      H
                    </th>
                    <th className="border-r border-black px-2 py-2 w-12 text-center">
                      S
                    </th>
                    <th className="border-r border-black px-2 py-2 w-12 text-center">
                      I
                    </th>
                    <th className="border-r border-black px-2 py-2 w-12 text-center">
                      A
                    </th>
                    <th className="border-black px-4 py-2 w-20 text-center">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredStudents.map((s, idx) => {
                    const r = getRecap(s);
                    return (
                      <tr key={s.id}>
                        <td className="border-r border-black px-4 py-2 text-center">
                          {idx + 1}
                        </td>
                        <td className="border-r border-black px-4 py-2">
                          {s.name}
                        </td>
                        <td className="border-r border-black px-2 py-2 text-center">
                          {r.h}
                        </td>
                        <td className="border-r border-black px-2 py-2 text-center">
                          {r.s}
                        </td>
                        <td className="border-r border-black px-2 py-2 text-center">
                          {r.i}
                        </td>
                        <td className="border-r border-black px-2 py-2 text-center">
                          {r.a}
                        </td>
                        <td className="border-black px-4 py-2 text-center font-bold">
                          {r.percent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {reportType === "grades" && selectedClass && (
            <div className="overflow-hidden border border-black rounded-sm print:border-black">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 print:bg-white border-b border-black">
                  <tr>
                    <th className="border-r border-black px-4 py-2 w-10 text-center">
                      No
                    </th>
                    <th className="border-r border-black px-4 py-2">
                      Nama Siswa
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-10">
                      UH1
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-10">
                      UH2
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-10">
                      UH3
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-10">
                      UH4
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-10">
                      UH5
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-12">
                      UTS
                    </th>
                    <th className="border-r border-black px-1 py-2 text-center w-12">
                      UAS
                    </th>
                    <th className="border-r border-black px-2 py-2 text-center font-bold">
                      NA
                    </th>
                    <th className="border-black px-4 py-2 text-center">Ket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredStudents.map((s, idx) => {
                    const scores = ["uh1", "uh2", "uh3", "uh4", "uh5"].map(
                      (t) => getEffectiveScore(s, t)
                    );
                    const uts = getEffectiveScore(s, "uts");
                    const uas = getEffectiveScore(s, "uas");
                    const activeUH = scores.filter((v) => v > 0);
                    const avgUH =
                      activeUH.length > 0
                        ? activeUH.reduce((a, b) => a + b, 0) / activeUH.length
                        : 0;
                    let na = 0;
                    if (activeUH.length > 0 || uts > 0 || uas > 0) {
                      const totalWeight =
                        (activeUH.length > 0 ? weights.h : 0) +
                        (uts > 0 ? weights.t : 0) +
                        (uas > 0 ? weights.a : 0);
                      if (totalWeight > 0)
                        na = Math.round(
                          (weights.h * avgUH +
                            weights.t * uts +
                            weights.a * uas) /
                            totalWeight
                        );
                    }
                    const kktp = getKktp();
                    return (
                      <tr key={s.id}>
                        <td className="border-r border-black px-4 py-2 text-center">
                          {idx + 1}
                        </td>
                        <td className="border-r border-black px-4 py-2">
                          {s.name}
                        </td>
                        {scores.map((sc, i) => (
                          <td
                            key={i}
                            className="border-r border-black px-1 py-2 text-center"
                          >
                            {sc || ""}
                          </td>
                        ))}
                        <td className="border-r border-black px-1 py-2 text-center">
                          {uts || ""}
                        </td>
                        <td className="border-r border-black px-1 py-2 text-center">
                          {uas || ""}
                        </td>
                        <td className="border-r border-black px-2 py-2 text-center font-bold">
                          {na || ""}
                        </td>
                        <td className="border-black px-4 py-2 text-center">
                          {na > 0
                            ? na >= kktp
                              ? "Tuntas"
                              : "Belum Tuntas"
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {reportType === "analysis" && selectedClass && (
            <div className="space-y-6">
              <div className="border border-black p-4">
                <h3 className="font-bold border-b border-black pb-2 mb-2 uppercase">
                  A. Tujuan Pembelajaran
                </h3>
                <p className="min-h-[40px]">
                  {assessmentMeta[
                    `${selectedSubject}_${selectedClass}_${selectedUH}_tp`
                  ] || "-"}
                </p>
              </div>
              {getAnalysisStats() ? (
                <div className="border border-black p-4">
                  <h3 className="font-bold border-b border-black pb-2 mb-2 uppercase">
                    B. Hasil Analisis Kuantitatif
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p>
                      Nilai Tertinggi: <b>{getAnalysisStats().max}</b>
                    </p>
                    <p>
                      Nilai Terendah: <b>{getAnalysisStats().min}</b>
                    </p>
                    <p>
                      Rata-rata Kelas: <b>{getAnalysisStats().avg}</b>
                    </p>
                    <p>
                      Ketuntasan Klasikal: <b>{getAnalysisStats().passRate}%</b>
                    </p>
                    <p>
                      Jumlah Tuntas: <b>{getAnalysisStats().passed}</b> Siswa
                    </p>
                    <p>
                      Jumlah Belum Tuntas: <b>{getAnalysisStats().failed}</b>{" "}
                      Siswa
                    </p>
                  </div>
                </div>
              ) : (
                <p className="italic">Belum ada data nilai.</p>
              )}
              <div className="border border-black p-0">
                <h3 className="font-bold p-4 border-b border-black uppercase bg-slate-100 print:bg-white">
                  C. Program Remedial & Pengayaan
                </h3>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-r border-black px-4 py-2 w-10">
                        No
                      </th>
                      <th className="border-b border-r border-black px-4 py-2">
                        Nama Siswa
                      </th>
                      <th className="border-b border-r border-black px-4 py-2 w-24 text-center">
                        Nilai Awal
                      </th>
                      <th className="border-b border-r border-black px-4 py-2 w-32 text-center">
                        Keterangan
                      </th>
                      <th className="border-b border-black px-4 py-2 w-24 text-center">
                        Nilai Akhir
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => {
                      const g = s.grades || {};
                      const org = parseInt(
                        g[`${selectedSubject}_${selectedUH}`] || 0
                      );
                      const rem =
                        g[`${selectedSubject}_${selectedUH}_remedial`];
                      const kktp = getKktp();
                      if (!org && !rem) return null;
                      return (
                        <tr key={s.id}>
                          <td className="border-b border-r border-black px-4 py-2 text-center">
                            {idx + 1}
                          </td>
                          <td className="border-b border-r border-black px-4 py-2">
                            {s.name}
                          </td>
                          <td className="border-b border-r border-black px-4 py-2 text-center">
                            {org}
                          </td>
                          <td className="border-b border-r border-black px-4 py-2 text-center">
                            {org >= kktp ? "Pengayaan" : "Remedial"}
                          </td>
                          <td className="border-b border-black px-4 py-2 text-center">
                            {rem || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border border-black p-4">
                <h3 className="font-bold border-b border-black pb-2 mb-2 uppercase">
                  D. Kesimpulan / Tindak Lanjut
                </h3>
                <p className="min-h-[40px]">
                  {assessmentMeta[
                    `${selectedSubject}_${selectedClass}_${selectedUH}_notes`
                  ] || "-"}
                </p>
              </div>
            </div>
          )}
          {(selectedClass || reportType === "journal") && (
            <PrintSignature profile={profile} />
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed print:hidden">
          Pilih kelas terlebih dahulu untuk melihat preview laporan.
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  // ... (No changes to App component logic)
  // ... (Copy the full App component from previous response)
  // (For brevity in this fix response, I'm ensuring the export is correct. The user has the full file content above.)
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("Ganjil");

  const sessionID = `${academicYear.replace("/", "-")}_${semester}`;
  const sessionLabel = `${academicYear} - ${semester}`;

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    checkAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setStudents([]);
      setSchedules([]);
      setClasses([]);
      setProfile(null);
      return;
    }
    const docProfile = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "settings",
      "profile"
    );
    const unsubProfile = onSnapshot(docProfile, (docSnap) => {
      if (docSnap.exists()) setProfile(docSnap.data());
    });
    const qStudents = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "students"
    );
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(
        snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    const qClasses = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "classes"
    );
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      setClasses(
        snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    const qSchedules = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "schedules"
    );
    const unsubSchedules = onSnapshot(qSchedules, (snapshot) => {
      setSchedules(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubStudents();
      unsubClasses();
      unsubSchedules();
      unsubProfile();
    };
  }, [user, sessionID]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  const handleSaveProfile = async (data) => {
    if (!user) return;
    await setDoc(
      doc(db, "artifacts", appId, "users", user.uid, "settings", "profile"),
      data,
      { merge: true }
    );
    alert("Profil tersimpan!");
  };
  const handleAddStudent = async (data) => {
    if (!user) return;
    await addDoc(
      collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "sessions",
        sessionID,
        "students"
      ),
      { ...data, createdAt: serverTimestamp() }
    );
  };
  const handleDeleteStudent = async (id) => {
    if (!user) return;
    if (confirm("Hapus siswa ini?"))
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "students",
          id
        )
      );
  };
  const handleUpdateStudent = async (id, data) => {
    if (!user) return;
    await updateDoc(
      doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "sessions",
        sessionID,
        "students",
        id
      ),
      data
    );
  };
  const handleBatchAddStudents = async (studentsData) => {
    if (!user) return;
    const batch = writeBatch(db);
    const collectionRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "sessions",
      sessionID,
      "students"
    );
    studentsData.forEach((student) => {
      const newDocRef = doc(collectionRef);
      batch.set(newDocRef, { ...student, createdAt: serverTimestamp() });
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error("Batch write failed: ", e);
      alert("Gagal mengimport data.");
    }
  };
  const handleAddClass = async (data) => {
    if (!user) return;
    await addDoc(
      collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "sessions",
        sessionID,
        "classes"
      ),
      { ...data, createdAt: serverTimestamp() }
    );
  };
  const handleDeleteClass = async (id) => {
    if (!user) return;
    if (confirm("Hapus kelas ini?"))
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "classes",
          id
        )
      );
  };
  const handleAddSchedule = async (data) => {
    if (!user) return;
    await addDoc(
      collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "sessions",
        sessionID,
        "schedules"
      ),
      { ...data, createdAt: serverTimestamp() }
    );
  };
  const handleDeleteSchedule = async (id) => {
    if (!user) return;
    if (confirm("Hapus jadwal ini?"))
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "sessions",
          sessionID,
          "schedules",
          id
        )
      );
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <div className="print:hidden">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onLogout={handleLogout}
          userProfile={profile}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
          semester={semester}
          setSemester={setSemester}
        />
      </div>
      <main className="flex-1 md:ml-64 h-full overflow-y-auto w-full pt-16 md:pt-0 print:ml-0 print:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full print:p-0">
          {activeTab === "dashboard" && (
            <Dashboard
              students={students}
              schedules={schedules}
              profile={profile}
              academicYear={academicYear}
              semester={semester}
            />
          )}
          {activeTab === "profile" && (
            <SchoolProfileView
              profile={profile}
              onSaveProfile={handleSaveProfile}
              db={db}
              user={user}
              appId={appId}
              sessionID={sessionID}
            />
          )}
          {activeTab === "classes" && (
            <ClassesManager
              classes={classes}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              sessionLabel={sessionLabel}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleView
              schedules={schedules}
              classes={classes}
              onAddSchedule={handleAddSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              sessionLabel={sessionLabel}
            />
          )}
          {activeTab === "students" && (
            <StudentsManager
              students={students}
              classes={classes}
              onAddStudent={handleAddStudent}
              onBatchAddStudents={handleBatchAddStudents}
              onDeleteStudent={handleDeleteStudent}
              sessionLabel={sessionLabel}
            />
          )}
          {activeTab === "attendance" && (
            <AttendanceView
              students={students}
              schedules={schedules}
              onUpdateStudent={handleUpdateStudent}
              sessionLabel={sessionLabel}
              profile={profile}
            />
          )}
          {activeTab === "journal" && (
            <JournalView
              classes={classes}
              sessionLabel={sessionLabel}
              db={db}
              user={user}
              appId={appId}
              sessionID={sessionID}
              profile={profile}
            />
          )}
          {activeTab === "grades" && (
            <GradesView
              students={students}
              profile={profile}
              onUpdateStudent={handleUpdateStudent}
              sessionLabel={sessionLabel}
              db={db}
              user={user}
              appId={appId}
              sessionID={sessionID}
            />
          )}
          {activeTab === "reports" && (
            <ReportsView
              students={students}
              profile={profile}
              sessionLabel={sessionLabel}
              db={db}
              user={user}
              appId={appId}
              sessionID={sessionID}
            />
          )}
        </div>
      </main>
    </div>
  );
}
