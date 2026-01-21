
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, ChevronRight, Loader2, Users, Shield, UserPlus, ArrowLeft, KeyRound, MapPin, CreditCard, Building2, Upload, CheckCircle2, AlertTriangle, FileText, QrCode } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

type Mode = 'LOGIN' | 'REGISTER';
type Role = 'ADMIN' | 'USER';

const Login = () => {
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [role, setRole] = useState<Role>('USER');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Extended Register State (For USER)
  const [regAddress, setRegAddress] = useState('');
  const [regIdCard, setRegIdCard] = useState('');
  const [regBankName, setRegBankName] = useState('');
  const [regBankAccount, setRegBankAccount] = useState('');
  
  // Files
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [bookbankFile, setBookbankFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null); // NEW

  // CUSTOM ERROR MODAL STATE
  const [errorModal, setErrorModal] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  const { login, register, checkInviteCode, isLoading, user, showAlert } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const showError = (msg: string) => {
      setErrorModal({ show: true, message: msg });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    const result = await login(username, password); 
    if (!result.success) {
        showError(result.message || 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Basic Validation
      if (!regUsername || !regName || !regPassword) {
          showError('กรุณากรอกข้อมูลบัญชีให้ครบถ้วน');
          return;
      }

      if (!acceptedTerms) {
          showError('กรุณากดยอมรับข้อตกลงและสัญญาใจก่อนสมัครสมาชิก');
          return;
      }
      
      // Full Validation for USER role
      if (role === 'USER') {
          if (!inviteCode) {
              showError('กรุณากรอกรหัสเข้าวง (Invite Code)');
              return;
          }
          // Validate Invite Code Existence
          const isValidCode = await checkInviteCode(inviteCode);
          if (!isValidCode) {
              showError('❌ รหัสเข้าวง (Invite Code) ไม่ถูกต้อง\nกรุณาตรวจสอบกับท้าวแชร์อีกครั้ง');
              return;
          }

          if (!regAddress) { showError('กรุณาระบุที่อยู่ปัจจุบัน'); return; }
          if (!regIdCard) { showError('กรุณาระบุเลขบัตรประชาชน'); return; }
          if (!idCardFile) { showError('กรุณาอัปโหลดรูปถ่ายบัตรประชาชน'); return; }
          if (!regBankName || !regBankAccount) { showError('กรุณาระบุข้อมูลบัญชีธนาคาร'); return; }
          // Avatar is optional but recommended
          if (!avatarFile) { showError('กรุณาอัปโหลดรูปโปรไฟล์'); return; }
      }

      const result = await register({
          username: regUsername,
          password: regPassword,
          name: regName,
          role: role,
          inviteCode: inviteCode,
          
          address: regAddress,
          idCardNumber: regIdCard,
          bankName: regBankName,
          bankAccountNumber: regBankAccount,
          
          avatarImage: avatarFile,
          idCardImage: idCardFile,
          bookbankImage: bookbankFile,
          qrCodeImage: qrCodeFile // Pass new file
      });

      if (result.success) {
          showAlert('สมัครสมาชิกเรียบร้อย! ระบบจะเข้าสู่ระบบให้อัตโนมัติ', 'ยินดีต้อนรับ', 'success');
      } else {
          showError('เกิดข้อผิดพลาด: ' + result.message);
      }
  };

  const performQuickLogin = async (mockUser: string) => {
    setUsername(mockUser);
    setPassword('12345678'); 
    await login(mockUser, '12345678');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      
      {/* ERROR MODAL */}
      {errorModal.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setErrorModal({ show: false, message: '' })} />
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-slate-900 mb-2">แจ้งเตือน</h3>
                  <p className="text-center text-slate-600 mb-6 whitespace-pre-line">{errorModal.message}</p>
                  <button 
                      onClick={() => setErrorModal({ show: false, message: '' })}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                      ตกลง
                  </button>
              </div>
          </div>
      )}

      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] h-[85vh] md:h-auto relative z-10">
        
        {/* Left Side: Form */}
        <div className={`w-full md:w-3/5 p-8 md:p-12 flex flex-col ${mode === 'LOGIN' ? 'justify-center' : 'justify-start pt-8'} relative transition-all overflow-y-auto custom-scrollbar`}>
          {mode === 'REGISTER' && (
              <button 
                type="button"
                onClick={() => setMode('LOGIN')}
                className="mb-4 text-slate-400 hover:text-slate-800 flex items-center gap-1 text-sm font-bold transition-colors sticky top-0 bg-white z-20 py-2 w-full"
              >
                  <ArrowLeft size={16} /> กลับไปเข้าสู่ระบบ
              </button>
          )}

          <div className="mb-6 relative z-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {mode === 'LOGIN' ? 'เข้าสู่ระบบ ThaoPro' : 'สมัครสมาชิกใหม่'}
            </h1>
            <p className="text-slate-500">
                {mode === 'LOGIN' ? 'บริหารจัดการวงแชร์ด้วยบัญชีของคุณ' : 'สร้างบัญชีเพื่อเริ่มใช้งาน'}
            </p>
          </div>

          {mode === 'LOGIN' ? (
              // LOGIN FORM
              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username (ไอดีผู้ใช้ หรือ เบอร์โทร)</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="กรอกไอดีของคุณ"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-slate-600 cursor-pointer">
                        <input type="checkbox" className="mr-2 rounded text-blue-600 focus:ring-blue-500" />
                        จดจำฉันไว้
                    </label>
                    <a href="#" className="text-blue-600 font-bold hover:underline">ลืมรหัสผ่าน?</a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <span>เข้าสู่ระบบ</span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>

                <div className="text-center mt-6">
                    <p className="text-slate-500 text-sm">ยังไม่มีบัญชี?</p>
                    <button 
                        type="button"
                        onClick={() => setMode('REGISTER')}
                        className="text-blue-600 font-bold hover:underline mt-1"
                    >
                        สมัครสมาชิกใหม่
                    </button>
                </div>
              </form>
          ) : (
              // REGISTER FORM
              <form onSubmit={handleRegister} className="space-y-5 pb-8 relative z-10">
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setRole('ADMIN')}
                        className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all relative outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            role === 'ADMIN' 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200 z-10' 
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                          <Shield size={24} />
                          <span className="font-bold text-sm">ฉันเป็นท้าวแชร์</span>
                          {role === 'ADMIN' && <div className="absolute top-2 right-2 text-blue-600"><CheckCircle2 size={16} /></div>}
                      </button>
                      <button
                        type="button" 
                        onClick={() => setRole('USER')}
                        className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all relative outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                            role === 'USER' 
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 z-10' 
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                          <Users size={24} />
                          <span className="font-bold text-sm">ฉันเป็นลูกแชร์</span>
                          {role === 'USER' && <div className="absolute top-2 right-2 text-emerald-600"><CheckCircle2 size={16} /></div>}
                      </button>
                  </div>

                  {/* Invite Code for USER */}
                  {role === 'USER' && (
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2">
                          <label className="block text-sm font-bold text-emerald-800 mb-1">รหัสเข้าวง (Invite Code) *</label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 text-emerald-500" size={20} />
                            <input
                              type="text"
                              required
                              className="w-full pl-10 pr-4 py-2.5 border border-emerald-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              placeholder="เช่น THAO999"
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            />
                          </div>
                          <p className="text-xs text-emerald-600 mt-1">*ต้องขอรหัสนี้จากท้าวแชร์ของคุณ</p>
                      </div>
                  )}
                  
                  {/* Basic Info */}
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 border-b pb-2">1. ข้อมูลบัญชี</h3>
                      
                      <div className="flex flex-col items-center mb-4">
                         <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200">
                                {avatarFile ? (
                                    <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <UserIcon size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white" size={20} />
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                            />
                         </div>
                         <p className="text-xs text-slate-400 mt-1">รูปโปรไฟล์ *</p>
                      </div>

                      <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username (ตั้งไอดีสำหรับเข้าสู่ระบบ) *</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="เช่น admin01 หรือ 0812345678"
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">*ไม่ต้องใช้อีเมล ใช้เบอร์โทรหรือไอดีที่จำง่าย</p>
                      </div>

                      <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="••••••••"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                />
                            </div>
                      </div>

                      <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล (สำหรับแสดงในวง) *</label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="เช่น สมชาย ใจดี"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                />
                            </div>
                      </div>
                  </div>

                  {/* Extended Info for USER */}
                  {role === 'USER' && (
                      <div className="space-y-4 pt-4 border-t">
                          <h3 className="text-sm font-bold text-slate-900">2. ข้อมูลยืนยันตัวตน (KYC)</h3>
                          <p className="text-xs text-slate-500 -mt-2 mb-2">จำเป็นต้องกรอกให้ครบถ้วนเพื่อความโปร่งใสในวงแชร์</p>

                          <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่ปัจจุบัน *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <textarea
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                                        placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด"
                                        value={regAddress}
                                        onChange={(e) => setRegAddress(e.target.value)}
                                    />
                                </div>
                          </div>

                          <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">เลขบัตรประชาชน *</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        maxLength={13}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                        placeholder="xxxxxxxxxxxxx"
                                        value={regIdCard}
                                        onChange={(e) => setRegIdCard(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                </div>
                          </div>
                          
                          <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">รูปถ่ายบัตรประชาชน (ตัวจริง) *</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <input 
                                    type="file" 
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col items-center gap-1">
                                        {idCardFile ? (
                                            <span className="text-sm text-emerald-600 font-bold">{idCardFile.name}</span>
                                        ) : (
                                            <span className="text-sm text-slate-500">คลิกเพื่ออัปโหลด</span>
                                        )}
                                    </div>
                                </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ธนาคาร *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="เช่น KBANK"
                                            value={regBankName}
                                            onChange={(e) => setRegBankName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">เลขบัญชี *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                        placeholder="xxx-x-xxxxx-x"
                                        value={regBankAccount}
                                        onChange={(e) => setRegBankAccount(e.target.value.replace(/[^0-9-]/g, ''))}
                                    />
                                </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">รูปหน้าสมุดบัญชี (ถ้ามี)</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative h-28 flex items-center justify-center">
                                        <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setBookbankFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="flex flex-col items-center gap-1">
                                            {bookbankFile ? (
                                                <span className="text-xs text-emerald-600 font-bold truncate max-w-[100px]">{bookbankFile.name}</span>
                                            ) : (
                                                <>
                                                    <FileText size={20} className="text-slate-400"/>
                                                    <span className="text-[10px] text-slate-500">อัปโหลด</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                              </div>
                              <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">QR Code รับเงิน (ถ้ามี)</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative h-28 flex items-center justify-center">
                                        <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="flex flex-col items-center gap-1">
                                            {qrCodeFile ? (
                                                <span className="text-xs text-emerald-600 font-bold truncate max-w-[100px]">{qrCodeFile.name}</span>
                                            ) : (
                                                <>
                                                    <QrCode size={20} className="text-slate-400"/>
                                                    <span className="text-[10px] text-slate-500">อัปโหลด QR</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="flex items-start gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="terms"
                        className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                      />
                      <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                          ฉันยอมรับ <span className="text-blue-600 font-bold">ข้อตกลงและเงื่อนไข</span> และยินยอมให้ตรวจสอบข้อมูลเพื่อความโปร่งใส
                      </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        <span>กำลังสมัครสมาชิก...</span>
                      </>
                    ) : (
                      <>
                        <span>สมัครสมาชิก</span>
                        <UserPlus size={20} />
                      </>
                    )}
                  </button>
              </form>
          )}

        </div>

        {/* Right Side: Decoration */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col justify-between text-white relative overflow-hidden order-first md:order-last">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10"></div>
            
            <div className="relative z-10 hidden md:block">
                <h2 className="text-3xl font-bold mb-4">ThaoPro</h2>
                <p className="text-blue-100">ระบบบริหารจัดการวงแชร์ครบวงจร<br/>ที่ทันสมัยและปลอดภัยที่สุด</p>
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <CheckCircle2 className="text-emerald-400" />
                        <span className="text-sm font-bold">ระบบคำนวณดอกเบี้ยอัตโนมัติ</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <CheckCircle2 className="text-emerald-400" />
                        <span className="text-sm font-bold">ตรวจสอบสลิปด้วย AI</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <CheckCircle2 className="text-emerald-400" />
                        <span className="text-sm font-bold">ระบบประมูล Live Real-time</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 text-center md:text-left mt-8 md:mt-0">
                <p className="text-xs text-blue-200">
                    &copy; 2024 ThaoPro System. All rights reserved.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
