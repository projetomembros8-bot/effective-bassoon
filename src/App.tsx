/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MapPin, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  Church,
  Plus,
  CheckCircle2,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  LogIn,
  MoreVertical,
  Filter,
  UserCheck,
  UserMinus,
  Briefcase,
  TrendingUp,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType,
  User,
  signInWithEmailAndPassword
} from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

interface Member {
  id: string;
  fullName: string;
  birthDate: string;
  address: string;
  neighborhood: string;
  phone: string;
  maritalStatus: string;
  position: string;
  city: string;
  congregation: string;
  status: string;
  createdAt: Timestamp;
  createdBy: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [view, setView] = useState<'home' | 'form' | 'list' | 'dashboard' | 'communion' | 'login' | 'youth'>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formData, setFormData] = useState<Omit<Member, 'id' | 'createdAt' | 'createdBy'>>({
    fullName: '',
    birthDate: '',
    address: '',
    neighborhood: '',
    phone: '',
    maritalStatus: 'Solteiro(a)',
    position: 'Membro (a)',
    city: '',
    congregation: 'Sede',
    status: 'Ativo',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auth Effect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Fetching
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'members');
    });

    return () => unsubscribe();
  }, [user]);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    let formatted = cleaned;
    if (cleaned.length > 0) {
      formatted = `(${cleaned.slice(0, 2)}`;
      if (cleaned.length > 2) {
        formatted += `) ${cleaned.slice(2, 7)}`;
        if (cleaned.length > 7) {
          formatted += `-${cleaned.slice(7, 11)}`;
        }
      }
    }
    setFormData({ ...formData, phone: formatted });
  };

  const handleDateChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      if (cleaned.length > 4) {
        formatted += `/${cleaned.slice(4, 8)}`;
      }
    } else if (cleaned.length > 0) {
      formatted = cleaned;
    }
    setFormData({ ...formData, birthDate: formatted });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'members'), {
        ...formData,
        createdAt: Timestamp.now(),
        createdBy: user?.uid || 'public_registration'
      });
      setShowSuccess(true);
      setFormData({
        fullName: '',
        birthDate: '',
        address: '',
        neighborhood: '',
        phone: '',
        maritalStatus: 'Solteiro(a)',
        position: 'Membro (a)',
        city: '',
        congregation: 'Sede',
        status: 'Ativo',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setView('dashboard');
    } catch (error: any) {
      console.error(error);
      setAuthError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleStatus = async (member: Member) => {
    try {
      const newStatus = member.status === 'Ativo' ? 'Desligado' : 'Ativo';
      await updateDoc(doc(db, 'members', member.id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${member.id}`);
    }
  };

  const positions = ['Membro (a)', 'Auxiliar', 'Diácono', 'Presbítero', 'Evangelista', 'Pastor'];
  const maritalStatuses = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)'];
  const congregations = ['Sede', 'Jardim Caíc'];
    const activeMembers = members.filter(m => m.status === 'Ativo');
  const youthList = members.filter(m => {
      if (!m.birthDate) return false;
      const [day, month, year] = m.birthDate.split('/').map(Number);
      if (!day || !month || !year) return false;
      const today = new Date();
      const birthDate = new Date(year, month - 1, day);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m_diff = today.getMonth() - birthDate.getMonth();
      if (m_diff < 0 || (m_diff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 12 && age <= 25;
    });

    const stats = {
    total: members.length,
    active: activeMembers.length,
    inactive: members.filter(m => m.status === 'Desligado').length,
    youth: youthList.filter(m => m.status === 'Ativo').length,
    youthTotal: youthList.length,
    youthInactive: youthList.filter(m => m.status === 'Desligado').length,
    sede: members.filter(m => m.congregation === 'Sede').length,
    jardimCaic: members.filter(m => m.congregation === 'Jardim Caíc').length,
  };

  // Enhanced Chart Data Calculations
  const getDashboardData = () => {
    const monthsName = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Sort members by date - Safety check for createdAt
    const sortedMembers = [...members]
      .filter(m => m.createdAt && typeof m.createdAt.toMillis === 'function')
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    
    const fluxMap: { [key: string]: { entrado: number; saido: number } } = {};
    const monthlyMap: { [key: string]: number } = {};
    const semesterMap: { [key: string]: number } = {};

    sortedMembers.forEach(m => {
      // Safety check just in case, though filter above handles it
      const date = m.createdAt.toDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${monthsName[month]}/${year.toString().slice(-2)}`;
      
      // Flux
      if (!fluxMap[monthKey]) fluxMap[monthKey] = { entrado: 0, saido: 0 };
      fluxMap[monthKey].entrado++;
      if (m.status === 'Desligado') fluxMap[monthKey].saido++;
      
      // Monthly
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;

      // Semester
      const semester = month < 6 ? '1º Sem' : '2º Sem';
      const semesterKey = `${semester}/${year}`;
      semesterMap[semesterKey] = (semesterMap[semesterKey] || 0) + 1;
    });

    const fluxData = Object.keys(fluxMap).map(key => ({
      name: key,
      Entradas: fluxMap[key].entrado,
      Saídas: fluxMap[key].saido
    })).slice(-6);

    const monthlyData = Object.keys(monthlyMap).map(key => ({
      name: key,
      Novos: monthlyMap[key]
    })).slice(-12);

    const semesterData = Object.keys(semesterMap).map(key => ({
      name: key,
      Membros: semesterMap[key]
    })).slice(-4);

    return { fluxData, monthlyData, semesterData };
  };

  const { fluxData, monthlyData, semesterData } = getDashboardData();
  const chartData = fluxData; // backwards compatibility for existing BarChart

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-vibrant-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-vibrant-indigo/30 border-t-vibrant-indigo rounded-full animate-spin" />
      </div>
    );
  }

  // Public View Logic (Landing page for registration)
  if (!user && view !== 'login') {
    return (
      <div className="min-h-screen bg-vibrant-bg flex flex-col items-center justify-center p-0 sm:p-4 md:p-8">
        <div className="w-full max-w-[800px] bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden border-none sm:border border-slate-100">
          <div className="bg-indigo-600 p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            </div>
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl inline-block mb-4 sm:mb-6"
            >
              <img 
                src="https://i.ibb.co/JwN0Jpym/culto-12.png" 
                alt="Logo Assembleia de Deus" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-4xl font-black tracking-tighter leading-tight px-4"
            >
              Igreja Assembleia de Deus de Parobé
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-indigo-100 mt-2 font-medium px-4 text-sm sm:text-base"
            >
              Seja bem-vindo! Preencha seus dados para fazer parte da nossa família.
            </motion.p>
          </div>

          <div className="p-6 sm:p-8 md:p-12">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-vibrant-slate">Cadastro Realizado!</h2>
                    <p className="text-slate-500 mt-2">Seus dados foram enviados com sucesso para a secretaria.</p>
                  </div>
                  <button onClick={() => setShowSuccess(false)} className="btn-vibrant px-12 py-4 text-lg">Cadastrar Outro Fiel</button>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  noValidate
                  onSubmit={handleSubmit} 
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Informações Pessoais</h3>
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">NOME COMPLETO</label>
                        <input 
                          required 
                          className="form-input bg-slate-50/50" 
                          placeholder="Digite seu nome completo"
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">DATA DE NASCIMENTO</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          autoComplete="off"
                          className="form-input bg-slate-50/50"
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          value={formData.birthDate}
                          onChange={e => handleDateChange(e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">TELEFONE DE CONTATO</label>
                        <input 
                          required 
                          type="text"
                          inputMode="tel"
                          className="form-input bg-slate-50/50" 
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={e => handlePhoneChange(e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">ESTADO CIVIL</label>
                        <select 
                          className="form-input bg-slate-50/50"
                          value={formData.maritalStatus}
                          onChange={e => setFormData({...formData, maritalStatus: e.target.value})}
                        >
                          {maritalStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">ENDEREÇO E CONGREGAÇÃO</h3>
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-4">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">ENDEREÇO RESIDENCIAL</label>
                        <input 
                          className="form-input bg-slate-50/50" 
                          placeholder="Rua, Número, Complemento"
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">BAIRRO</label>
                        <input 
                          className="form-input bg-slate-50/50" 
                          placeholder="Bairro"
                          value={formData.neighborhood}
                          onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">QUAL É A SUA CIDADE?</label>
                        <input 
                          className="form-input bg-slate-50/50" 
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={e => setFormData({...formData, city: e.target.value})}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">QUAL SUA CONGREGAÇÃO?</label>
                        <select 
                          className="form-input bg-slate-50/50"
                          value={formData.congregation}
                          onChange={e => setFormData({...formData, congregation: e.target.value})}
                        >
                          {congregations.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-span-6">
                        <label className="form-label font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 block">QUAL O SEU CARGO ECLESIÁSTICO?</label>
                        <select 
                          className="form-input bg-slate-50/50"
                          value={formData.position}
                          onChange={e => setFormData({...formData, position: e.target.value})}
                        >
                          {positions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50">
                    {isSubmitting ? "Gravando Cadastro..." : "Confirmar meu Cadastro"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
            <button 
              onClick={() => setView('login')}
              className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs hover:text-vibrant-indigo shadow-sm hover:shadow-md transition-all flex items-center gap-3 mx-auto border border-slate-200"
            >
              <ShieldCheck className="w-4 h-4" />
              PORTAL DA SECRETARIA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login View Logic
  if (!user && view === 'login') {
    return (
      <div className="min-h-screen bg-vibrant-bg flex items-center justify-center p-0 md:p-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 md:p-12 h-screen md:h-auto rounded-none md:rounded-[30px] shadow-2xl space-y-6 sm:space-y-8 border-none md:border border-slate-100 flex flex-col justify-center">
          <div className="text-center">
            <button 
              onClick={() => setView('home')}
              className="mb-8 text-slate-400 hover:text-vibrant-indigo flex items-center gap-2 mx-auto font-bold text-xs uppercase"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar ao Início
            </button>
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <img 
                src="https://i.ibb.co/JwN0Jpym/culto-12.png" 
                alt="Logo Assembleia de Deus" 
                className="w-12 h-12 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-vibrant-slate tracking-tight">Dashboard Admin</h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">Identifique-se para acessar os dados.</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                required 
                className="form-input" 
                placeholder="admin@igreja.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                required 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full btn-vibrant py-4 text-lg mt-2"
            >
              {isLoggingIn ? "Autenticando..." : "Entrar no Sistema"}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest"><span className="bg-white px-4 text-slate-300">Ou use</span></div>
          </div>

          <button 
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Google Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-vibrant-bg flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Sticky Header (Mobile Only) */}
      <header className="md:hidden sidebar-gradient px-5 py-4 flex items-center justify-between sticky top-0 z-50 text-white shadow-lg overflow-hidden shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl shadow-lg">
            <img src="https://i.ibb.co/JwN0Jpym/culto-12.png" alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
          </div>
          <span className="font-black tracking-tighter text-base whitespace-nowrap">AD Parobé</span>
        </div>
        <img 
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
          alt="Profile" 
          className="w-8 h-8 rounded-full border-2 border-white/20"
          referrerPolicy="no-referrer"
        />
      </header>

      <div className="w-full flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar/BottomNav */}
        <aside className={`sidebar-gradient text-white flex shrink-0 transition-all duration-300 md:sticky md:top-0 group/sidebar 
          md:flex-col md:h-screen md:p-8 md:justify-between
          fixed bottom-0 left-0 right-0 h-16 md:h-full z-50 md:z-auto
          ${isSidebarCollapsed ? 'md:w-[88px]' : 'md:w-[320px]'}`}>
          <div className="flex-1 flex md:flex-col items-center md:items-stretch h-full">
            {/* Desktop Logo & Toggle */}
            <div className={`hidden md:flex items-center justify-between mb-10 ${isSidebarCollapsed ? 'md:flex-col md:gap-4' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-900/20">
                  <img src="https://i.ibb.co/JwN0Jpym/culto-12.png" alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
                {!isSidebarCollapsed && <span className="font-black tracking-tighter text-2xl whitespace-nowrap">AD Parobé</span>}
              </div>
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex w-6 h-6 bg-white rounded-full items-center justify-center text-indigo-600 shadow-lg border border-slate-200">
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
            
            <nav className="flex-1 flex md:flex-col justify-around md:justify-start gap-1 md:gap-2 w-full px-2 md:px-0 h-full md:h-auto items-center md:items-stretch overflow-hidden">
              {[
                { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
                { id: 'communion', label: 'Comunhão', icon: UserCheck },
                { id: 'list', label: 'Membros', icon: Users },
                { id: 'youth', label: 'Juventude', icon: Sparkles },
                { id: 'form', label: 'Novo', icon: UserPlus },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-xl md:rounded-xl transition-all duration-200 relative whitespace-nowrap
                    ${view === item.id 
                      ? 'text-white md:bg-white md:text-vibrant-indigo md:shadow-md' 
                      : 'text-white/60 hover:text-white md:hover:bg-white/10'}`}
                >
                  <item.icon className="w-5 h-5 md:w-5 md:h-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="text-[10px] md:text-base font-bold md:font-semibold whitespace-nowrap">{item.label}</span>}
                  {view === item.id && (
                    <motion.div 
                      layoutId="activeNav" 
                      className="md:hidden absolute -bottom-1 w-1 h-1 bg-white rounded-full" 
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className={`hidden md:block mt-8 pt-8 border-t border-white/10 space-y-6 ${isSidebarCollapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-white/20 shrink-0"
                referrerPolicy="no-referrer"
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{user.displayName}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Operador</p>
                </div>
              )}
            </div>
            <button 
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-semibold text-white/70 hover:text-white border border-white/10 ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? 'Sair' : ''}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-12 flex flex-col overflow-y-auto w-full custom-scrollbar bg-slate-50/30">
          <div className="max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">Dashboard Geral</h2>
                    <p className="text-slate-500 text-sm sm:text-base">Visão consolidada da nossa comunidade ministerial.</p>
                  </div>
                  <div className="flex items-center gap-2 md:hidden">
                    <button onClick={logout} className="p-2 bg-white border border-red-100 rounded-xl text-red-500 shadow-sm flex items-center gap-2 font-bold text-xs">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-indigo-50 p-5 sm:p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
                    <div className="bg-vibrant-indigo text-white p-3 rounded-2xl">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-vibrant-indigo uppercase tracking-wider">Total Membros</p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">{stats.total}</h3>
                    </div>
                  </div>
                  <div className="bg-green-50 p-5 sm:p-6 rounded-3xl border border-green-100 flex items-center gap-4">
                    <div className="bg-green-500 text-white p-3 rounded-2xl">
                      <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-green-600 uppercase tracking-wider">Ativos</p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">{stats.active}</h3>
                    </div>
                  </div>
                  <div className="bg-red-50 p-5 sm:p-6 rounded-3xl border border-red-100 flex items-center gap-4">
                    <div className="bg-red-500 text-white p-3 rounded-2xl">
                      <UserMinus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider">Desligados</p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">{stats.inactive}</h3>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-5 sm:p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
                    <div className="bg-amber-500 text-white p-3 rounded-2xl">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider">Juventude Ativa</p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">{stats.youth}</h3>
                    </div>
                  </div>
                </div>

                {/* Flux Chart */}
                <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-vibrant-indigo" />
                      Fluxo Ministerial (Entradas vs Saídas)
                    </h3>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Últimos 6 meses ativos</p>
                  </div>
                  
                  <div className="h-[220px] md:h-[300px] w-full pt-4 pr-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          align="right" 
                          iconType="circle"
                          wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}
                        />
                        <Bar dataKey="Entradas" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* New Growth Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {/* Monthly Growth */}
                  <div className="bg-white p-6 sm:p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-6 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                      <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Crescimento Mensal
                      </h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">Últimos 12 meses</p>
                    </div>
                    <div className="h-[180px] sm:h-[250px] w-full pt-4 pr-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="Novos" stroke="#6366f1" fillOpacity={1} fill="url(#colorNovos)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Semester Growth */}
                  <div className="bg-white p-6 sm:p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-6 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                      <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-violet-500" />
                        Evolução Semestral
                      </h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">Histórico por semestre</p>
                    </div>
                    <div className="h-[180px] sm:h-[250px] w-full pt-4 pr-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={semesterData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                          />
                          <Bar dataKey="Membros" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-10">
                  <div className="bg-white p-6 md:p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                      <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                        <Church className="w-5 h-5 text-vibrant-indigo" />
                        Congregações
                      </h3>
                      <Filter className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="space-y-4">
                      {[
                        { name: 'Sede', value: stats.sede, perc: (stats.sede / stats.total) * 100 || 0, color: 'bg-vibrant-indigo' },
                        { name: 'Jardim Caíc', value: stats.jardimCaic, perc: (stats.jardimCaic / stats.total) * 100 || 0, color: 'bg-vibrant-violet' }
                      ].map(cong => (
                        <div key={cong.name} className="space-y-2">
                          <div className="flex justify-between text-xs md:text-sm font-bold">
                            <span className="text-slate-600">{cong.name}</span>
                            <span className="text-vibrant-slate">{cong.value} membros</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${cong.color}`} style={{ width: `${cong.perc}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-6 md:p-8 rounded-[30px] text-white flex flex-col justify-between shadow-xl shadow-indigo-200 relative overflow-hidden min-h-[160px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <UserCheck className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl md:text-2xl font-bold mb-2">Gestão de Comunhão</h3>
                      <p className="text-indigo-100 text-xs md:text-sm mb-6 font-medium">Ligue ou desligue membros do corpo ministerial.</p>
                    </div>
                    <button 
                      onClick={() => setView('communion')}
                      className="relative z-10 w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      Acessar Gestão de Comunhão
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'communion' && (
              <motion.div
                key="communion"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">Gestão de Comunhão</h2>
                    <p className="text-slate-500 text-sm sm:text-base">Controle de vínculo ministerial dos fiéis.</p>
                  </div>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button 
                      onClick={() => setDashboardSearch('')} 
                      className="px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 sm:p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-6">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar fiel por nome..." 
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:border-vibrant-indigo transition-all shadow-sm"
                      value={dashboardSearch}
                      onChange={e => setDashboardSearch(e.target.value)}
                    />
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                    {members
                      .filter(m => m.fullName.toLowerCase().includes(dashboardSearch.toLowerCase()))
                      .map(m => (
                        <div key={m.id} className="flex flex-col xs:flex-row xs:items-center justify-between p-4 bg-white rounded-2xl sm:rounded-[24px] border border-slate-100 hover:border-vibrant-indigo/20 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-xl shrink-0 ${m.status === 'Ativo' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {m.fullName.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-vibrant-indigo transition-colors truncate">{m.fullName}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${m.status === 'Ativo' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                                  {m.status === 'Ativo' ? 'Ligado' : 'Desligado'}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">{m.congregation}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => toggleStatus(m)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-bold shadow-sm transition-all active:scale-95 ${
                              m.status === 'Ativo' 
                              ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                              : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            {m.status === 'Ativo' ? (
                              <>
                                <UserMinus className="w-4 h-4" />
                                Desligar
                                <ChevronRight className="w-3 h-3 opacity-50 hidden sm:block" />
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4" />
                                Ligar
                                <ChevronRight className="w-3 h-3 opacity-50 hidden sm:block" />
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    {members.length === 0 && <div className="col-span-full text-center py-20 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200 text-slate-300 italic">Nenhum fiel encontrado na base de dados</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {showSuccess ? (
                  <div className="my-auto py-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-vibrant-slate">Sucesso!</h2>
                      <p className="text-slate-500 mt-2">Membro adicionado ao sistema da igreja.</p>
                    </div>
                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                      <button onClick={() => setShowSuccess(false)} className="btn-vibrant">Cadastrar Outro</button>
                      <button onClick={() => setView('dashboard')} className="text-slate-400 font-bold text-sm">Ir para Dashboard</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-vibrant-slate mb-8">Cadastro de Membros</h2>
                    <form noValidate onSubmit={handleSubmit} className="space-y-10 pb-12">
                      {/* Section 1 */}
                      <div>
                        <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-2">INFORMAÇÕES PESSOAIS</h3>
                        <div className="grid grid-cols-6 gap-6">
                          <div className="col-span-6">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">NOME COMPLETO</label>
                            <input 
                              required 
                              className="form-input" 
                              placeholder="Digite seu nome completo"
                              value={formData.fullName}
                              onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">DATA DE NASCIMENTO</label>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              autoComplete="off"
                              className="form-input"
                              placeholder="DD/MM/AAAA"
                              maxLength={10}
                              value={formData.birthDate}
                              onChange={e => handleDateChange(e.target.value)}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">TELEFONE DE CONTATO</label>
                            <input 
                              required 
                              type="text"
                              inputMode="tel"
                              className="form-input" 
                              placeholder="(00) 00000-0000"
                              value={formData.phone}
                              onChange={e => handlePhoneChange(e.target.value)}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">ESTADO CIVIL</label>
                            <select 
                              className="form-input"
                              value={formData.maritalStatus}
                              onChange={e => setFormData({...formData, maritalStatus: e.target.value})}
                            >
                              {maritalStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2 */}
                      <div>
                        <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-2">ENDEREÇO E CONGREGAÇÃO</h3>
                        <div className="grid grid-cols-6 gap-6">
                          <div className="col-span-6 sm:col-span-4">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">ENDEREÇO RESIDENCIAL</label>
                            <input 
                              className="form-input" 
                              placeholder="Rua, Número, Complemento"
                              value={formData.address}
                              onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">BAIRRO</label>
                            <input 
                              className="form-input" 
                              placeholder="Bairro"
                              value={formData.neighborhood}
                              onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">QUAL É A SUA CIDADE?</label>
                            <input 
                              className="form-input" 
                              placeholder="Cidade"
                              value={formData.city}
                              onChange={e => setFormData({...formData, city: e.target.value})}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">QUAL SUA CONGREGAÇÃO?</label>
                            <select 
                              className="form-input"
                              value={formData.congregation}
                              onChange={e => setFormData({...formData, congregation: e.target.value})}
                            >
                              {congregations.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="col-span-6">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">QUAL O SEU CARGO ECLESIÁSTICO?</label>
                            <select 
                              className="form-input"
                              value={formData.position}
                              onChange={e => setFormData({...formData, position: e.target.value})}
                            >
                              {positions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label className="form-label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">STATUS INICIAL</label>
                            <select 
                              className="form-input"
                              value={formData.status}
                              onChange={e => setFormData({...formData, status: e.target.value})}
                            >
                              <option value="Ativo">Ativo na Comunhão</option>
                              <option value="Desligado">Desligado</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isSubmitting} className="btn-vibrant w-full sm:w-auto shadow-xl shadow-indigo-200">
                          {isSubmitting ? "Gravando..." : "Realizar Cadastro"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            )}

            {view === 'youth' && (
              <motion.div
                key="youth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">Ministério da Juventude</h2>
                  <p className="text-slate-500 text-sm sm:text-base">Gestão e acompanhamento da força jovem (12 a 25 anos).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Juventude</p>
                      <h3 className="text-2xl font-bold text-slate-800">{stats.youthTotal}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 p-3 rounded-2xl">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jovens Ativos</p>
                      <h3 className="text-2xl font-bold text-slate-800">{stats.youth}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-red-100 text-red-600 p-3 rounded-2xl">
                      <UserMinus className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jovens Desligados</p>
                      <h3 className="text-2xl font-bold text-slate-800">{stats.youthInactive}</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-vibrant-indigo" />
                      Status da Juventude
                    </h3>
                  </div>

                  <div className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Ativos na Comunhão', valor: stats.youth, fill: '#10b981' },
                          { name: 'Desligados do Rol', valor: stats.youthInactive, fill: '#ef4444' }
                        ]} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="valor" radius={[10, 10, 0, 0]} barSize={60}>
                          {
                            [
                              { name: 'Ativos', fill: '#10b981' },
                              { name: 'Desligados', fill: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-vibrant-slate">Registro de Membros ({members.length})</h2>
                    <p className="text-slate-500 text-sm sm:text-base">Listagem completa do corpo de membros.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 sm:p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 border border-slate-100">
                      <Filter className="w-5 h-5" />
                    </button>
                    <button onClick={() => setView('form')} className="p-2.5 sm:p-2 bg-indigo-50 text-vibrant-indigo rounded-xl hover:bg-indigo-100 border border-indigo-100">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar membro..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:border-vibrant-indigo transition-all shadow-sm"
                    value={dashboardSearch}
                    onChange={e => setDashboardSearch(e.target.value)}
                  />
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 custom-scrollbar">
                  {members
                    .filter(m => m.fullName.toLowerCase().includes(dashboardSearch.toLowerCase()))
                    .map((member) => (
                    <div key={member.id} className="group p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm hover:border-vibrant-indigo/30 transition-all flex flex-col xs:flex-row xs:items-center gap-4 sm:gap-5">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 ${member.status === 'Ativo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {member.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800 text-sm sm:text-base truncate">{member.fullName}</h4>
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${member.status === 'Ativo' ? 'border-green-200 text-green-600 bg-green-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                              {member.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                              <Briefcase className="w-3 h-3" /> {member.position}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {member.city || 'Não informada'}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                              <Church className="w-3 h-3" /> {member.congregation}
                            </span>
                            {member.birthDate && (
                              <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {member.birthDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between xs:flex-col xs:items-end gap-1 px-14 xs:px-0">
                        <span className="text-[10px] sm:text-xs font-medium text-vibrant-indigo">{member.phone}</span>
                        <span className="text-[9px] text-slate-300 font-bold uppercase">{member.maritalStatus}</span>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                      <Users className="w-20 h-20 mx-auto mb-4" />
                      <p>Nenhum registro encontrado</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  </div>
);
}
