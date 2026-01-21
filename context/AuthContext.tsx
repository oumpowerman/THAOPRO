
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AdminPaymentInfo, Member } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import * as API from '../lib/api';
import { useUI } from './UIContext';
import { formatErrorMessage } from '../lib/errorHandler';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  adminPaymentInfo: AdminPaymentInfo;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCurrentUser: (data: Partial<User>, avatarFile?: File | null, qrCodeFile?: File | null) => Promise<void>;
  updateAdminPaymentInfo: (info: AdminPaymentInfo, file?: File | null) => Promise<void>;
  checkInviteCode: (code: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showAlert } = useUI();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminPaymentInfo, setAdminPaymentInfo] = useState<AdminPaymentInfo>({
      bankName: 'KBank',
      accountName: 'Admin',
      accountNumber: '-',
      qrCodeUrl: null,
      promptPayId: ''
  });

  const fetchProfile = async (userId: string) => {
      const profile = await API.AuthService.getProfile(userId);
      if (profile) {
          setUser({
              id: profile.id,
              username: profile.phone || '', 
              name: profile.name || 'User',
              role: profile.role || 'USER',
              memberId: profile.id,
              avatarUrl: profile.avatar_url,
              status: profile.status,
              qrCodeUrl: profile.qr_code_url
          });

          if (profile.role === 'ADMIN') {
              setAdminPaymentInfo({
                  bankName: profile.bank_name || '',
                  accountName: profile.account_name || profile.name || 'Admin', 
                  accountNumber: profile.bank_account_number || '',
                  qrCodeUrl: profile.qr_code_url || null,
                  promptPayId: profile.prompt_pay_id || '' 
              });
          }
      }
  };

  useEffect(() => {
      let isMounted = true;
      const initSession = async () => {
          try {
            if (isSupabaseConfigured) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    await fetchProfile(session.user.id);
                }
            }
          } catch(e) {
              console.error("Session Init Error:", e);
          } finally {
              if (isMounted) setIsLoading(false);
          }
      };
      initSession();
      return () => { isMounted = false; };
  }, []);

  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    // System Admin Backdoor
    if (username === 'systemadmin' && password === 'oum72192') {
         const sysUser: User = {
              id: 'sys_admin_master',
              username: 'systemadmin',
              name: 'System Administrator',
              role: 'SYSTEM_ADMIN',
              status: 'ACTIVE',
              avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=ef4444&color=fff'
          };
          setUser(sysUser);
          setIsLoading(false);
          return { success: true };
    }

    const { data, error } = await API.AuthService.login(username, password);
    if (error) {
        setIsLoading(false);
        return { success: false, message: formatErrorMessage(error) };
    }

    if (data?.session) {
         await fetchProfile(data.session.user.id);
         setIsLoading(false);
         return { success: true };
    }
    
    // Mock Fallback
    if (!isSupabaseConfigured) {
         const mockUser: User = { id: 'm1', name: 'Offline Admin', username: username, role: 'ADMIN', memberId: 'm1', status: 'ACTIVE' };
         setUser(mockUser);
         setIsLoading(false);
         return { success: true };
    }

    setIsLoading(false);
    return { success: false, message: 'Unknown error' };
  };

  const register = async (data: any) => {
      setIsLoading(true);
      if (!isSupabaseConfigured) { setIsLoading(false); return { success: true }; }

      const email = API.getFakeEmail(data.username);
      const { data: authData, error: authError } = await API.AuthService.register(email, data.password);
      
      if (authError) { setIsLoading(false); return { success: false, message: formatErrorMessage(authError) }; }

      if (!authData.session) {
           await API.AuthService.login(data.username, data.password);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const newUserId = session?.user?.id;

      if (!newUserId) { setIsLoading(false); return { success: false, message: 'Session ID missing' }; }

      // Uploads
      const [avatarUrl, idCardUrl, bookbankUrl, qrCodeUrl] = await Promise.all([
          data.avatarImage ? API.uploadFile(data.avatarImage, 'avatars', `${newUserId}/avatar_${Date.now()}.jpg`) : null,
          data.idCardImage ? API.uploadFile(data.idCardImage, 'documents', `${newUserId}/id_card_${Date.now()}.jpg`) : null,
          data.bookbankImage ? API.uploadFile(data.bookbankImage, 'documents', `${newUserId}/bookbank_${Date.now()}.jpg`) : null,
          data.qrCodeImage ? API.uploadFile(data.qrCodeImage, 'documents', `${newUserId}/qrcode_${Date.now()}.jpg`) : null
      ]);

      const initialStatus = data.role === 'ADMIN' ? 'ACTIVE' : 'PENDING';
      const profileData: any = {
          id: newUserId,
          phone: data.username,
          name: data.name,
          role: data.role,
          status: initialStatus, 
          avatar_url: avatarUrl,
          address: data.address,
          id_card_number: data.idCardNumber,
          id_card_image_url: idCardUrl,
          bank_name: data.bankName,
          bank_account_number: data.bankAccountNumber,
          bookbank_image_url: bookbankUrl,
          qr_code_url: qrCodeUrl,
          invite_code: data.inviteCode
      };

      const { error: profileError } = await supabase.from('profiles').upsert(profileData);

      if (profileError) {
          setIsLoading(false);
          return { success: false, message: formatErrorMessage(profileError) };
      }
      
      setUser({
          id: newUserId,
          username: data.username,
          name: data.name,
          role: data.role,
          memberId: newUserId,
          avatarUrl: avatarUrl || undefined,
          status: initialStatus,
          qrCodeUrl: qrCodeUrl || undefined
      });

      setIsLoading(false);
      return { success: true };
  };

  const logout = async () => {
      await API.AuthService.logout();
      setUser(null);
  };

  const updateCurrentUser = async (data: Partial<User>, avatarFile?: File | null, qrCodeFile?: File | null) => {
      if (user) {
          // Handle Uploads if provided
          let newAvatarUrl = data.avatarUrl;
          let newQrUrl = data.qrCodeUrl;

          if (avatarFile) {
              const uploaded = await API.uploadFile(avatarFile, 'avatars', `${user.id}/avatar_${Date.now()}.jpg`);
              if (uploaded) newAvatarUrl = uploaded;
          }

          if (qrCodeFile) {
              const uploaded = await API.uploadFile(qrCodeFile, 'documents', `${user.id}/qrcode_${Date.now()}.jpg`);
              if (uploaded) newQrUrl = uploaded;
          }

          // Merge updates with new URLs
          const finalData = { 
              ...data, 
              avatarUrl: newAvatarUrl || user.avatarUrl,
              qrCodeUrl: newQrUrl || user.qrCodeUrl
          };

          setUser(prev => prev ? { ...prev, ...finalData } : null);
          
          const dbData: any = {};
          if (finalData.name) dbData.name = finalData.name;
          if (finalData.avatarUrl) dbData.avatar_url = finalData.avatarUrl;
          if (finalData.qrCodeUrl) dbData.qr_code_url = finalData.qrCodeUrl;

          try {
              await API.AuthService.updateProfile(user.id, dbData);
          } catch(e) {
              showAlert(formatErrorMessage(e), 'อัปเดตโปรไฟล์ไม่สำเร็จ', 'error');
          }
      }
  };

  const updateAdminPaymentInfo = async (info: AdminPaymentInfo, file?: File | null) => {
      let finalQrUrl = info.qrCodeUrl;
      if (file && user) {
          const uploaded = await API.uploadFile(file, 'documents', `${user.id}/qr_${Date.now()}.jpg`);
          if (uploaded) finalQrUrl = uploaded;
      }
      setAdminPaymentInfo({ ...info, qrCodeUrl: finalQrUrl }); 
      
      if (user) {
          try {
              await API.AuthService.updateProfile(user.id, {
                  bank_name: info.bankName,
                  bank_account_number: info.accountNumber,
                  account_name: info.accountName, 
                  qr_code_url: finalQrUrl,
                  prompt_pay_id: info.promptPayId 
              });
          } catch(e) {
              showAlert(formatErrorMessage(e), 'บันทึกข้อมูลไม่สำเร็จ', 'error');
          }
      }
  };

  const checkInviteCode = async (code: string) => {
      return await API.AuthService.checkInviteCode(code);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, adminPaymentInfo, login, register, logout, updateCurrentUser, updateAdminPaymentInfo, checkInviteCode, refreshProfile: async () => { if(user) await fetchProfile(user.id); } }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
