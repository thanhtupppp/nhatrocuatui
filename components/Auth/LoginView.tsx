
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { DoorOpen, UserSearch } from 'lucide-react';

interface LoginViewProps {
  onEnterTenantMode: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onEnterTenantMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role: 'admin',
          createdAt: Timestamp.now(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError("Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cia-bg min-h-screen w-full flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      <div className="world-map" />
      <div className="grid-overlay" />
      <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-xl rotate-3">
            <DoorOpen size={40} className="text-white -rotate-3" />
          </div>
          <h1 className="text-white text-2xl font-black tracking-widest uppercase text-center">NhaTroAdmin</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500 font-bold placeholder:text-slate-600" 
            placeholder="Email Admin" required 
          />
          <input 
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500 font-bold placeholder:text-slate-600" 
            placeholder="Mật khẩu" required 
          />
          {error && <div className="text-red-500 text-[11px] font-black uppercase text-center bg-red-500/10 p-3 rounded-xl">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all">
            {loading ? "Đang xử lý..." : isRegistering ? "Đăng ký chủ nhà" : "Đăng nhập Chủ trọ"}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-white/10 space-y-4">
          <button 
            onClick={onEnterTenantMode}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
          >
            <UserSearch size={20} /> Tôi là khách thuê
          </button>
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] text-slate-500 hover:text-white transition-colors uppercase font-bold text-center">
            {isRegistering ? "Quay lại Đăng nhập" : "Chưa có tài khoản quản trị? Đăng ký ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
