
import React, { useState, useEffect } from 'react';
import { X, QrCode, Clock, Upload, CheckCircle2, Loader2, Copy, CheckSquare, Wallet, Calculator, Building2, Smartphone, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { generatePromptPayPayload } from '../../lib/promptpay';
import { sendLineNotification, generatePaymentMessage } from '../../lib/services/lineNotification';
import * as API from '../../lib/api';
import { AdminPaymentInfo } from '../../types';

export interface PaymentData {
  id: string;
  circleId?: string; // Added to identify target circle
  circleName: string;
  targetRound: number;
  amount: number;
  handCount: number;
  isClosingBalance?: boolean;
  totalRounds?: number;
  fixedRatePerRound?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentData;
  onSubmit: (file: File | null) => Promise<void>;
}

export const PaymentModal = ({ isOpen, onClose, paymentData, onSubmit }: PaymentModalProps) => {
  const { user, circles } = useAppContext();
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [transferTime, setTransferTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Organizer Payment Info State
  const [organizerInfo, setOrganizerInfo] = useState<AdminPaymentInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  // 1. Fetch Organizer Info when Modal Opens
  useEffect(() => {
      const loadOrganizerInfo = async () => {
          if (!isOpen || !paymentData) return;
          
          setIsLoadingInfo(true);
          setOrganizerInfo(null); // Reset prev info

          try {
              // Determine Circle ID
              let targetCircleId = paymentData.circleId;
              
              // Fallback: try to extract from composite ID if not provided explicitly
              // (e.g., id="c1-r2" or "closing-c1")
              if (!targetCircleId && paymentData.id) {
                  if (paymentData.id.startsWith('closing-')) {
                      targetCircleId = paymentData.id.replace('closing-', '');
                  } else if (paymentData.id.includes('-r')) {
                      targetCircleId = paymentData.id.split('-r')[0];
                  } else {
                      // Attempt direct match if ID looks like a circle ID
                      const c = circles.find(c => c.id === paymentData.id);
                      if (c) targetCircleId = c.id;
                  }
              }

              if (!targetCircleId) {
                  console.warn("Could not determine Circle ID for payment");
                  setIsLoadingInfo(false);
                  return;
              }

              // Find Circle Config
              const circle = circles.find(c => c.id === targetCircleId);
              if (!circle || !circle.createdBy) {
                  console.warn("Circle or Creator not found");
                  setIsLoadingInfo(false);
                  return;
              }

              // Fetch Creator Profile from API
              const profile = await API.AuthService.getProfile(circle.createdBy);
              if (profile) {
                  setOrganizerInfo({
                      bankName: profile.bank_name || '',
                      accountName: profile.account_name || profile.name || 'Admin',
                      accountNumber: profile.bank_account_number || '',
                      qrCodeUrl: profile.qr_code_url,
                      promptPayId: profile.prompt_pay_id
                  });
              }
          } catch (e) {
              console.error("Error fetching organizer info:", e);
          } finally {
              setIsLoadingInfo(false);
          }
      };

      if (isOpen) {
          loadOrganizerInfo();
          const now = new Date();
          const timeString = now.toTimeString().slice(0, 5); // HH:MM
          setTransferTime(timeString);
      }
  }, [isOpen, paymentData, circles]);

  if (!isOpen || !paymentData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        await onSubmit(slipFile);
        
        // --- TRIGGER LINE NOTIFY ---
        if (user) {
            let msg = '';
            if (paymentData.isClosingBalance) {
                 msg = `
💸 แจ้งปิดยอดเหมาจ่าย (Close Balance)!
👤 สมาชิก: ${user.name}
⭕ วง: ${paymentData.circleName}
💰 ยอดรวม: ฿${paymentData.amount.toLocaleString()}
📅 เริ่มงวดที่: ${paymentData.targetRound}
`.trim();
            } else {
                 msg = generatePaymentMessage(
                    user.name, 
                    paymentData.circleName, 
                    paymentData.targetRound, 
                    paymentData.amount,
                    slipFile ? '(มีสลิปแนบ)' : undefined 
                );
            }
            sendLineNotification(msg);
        }

        setIsSubmitting(false);
        setSlipFile(null);
        setTransferTime('');
        onClose();

    } catch (error) {
        setIsSubmitting(false);
        console.error("Submission failed:", error);
    }
  };

  const handleCopyAccount = () => {
      if (!organizerInfo) return;
      const promptPayId = organizerInfo.promptPayId ? organizerInfo.promptPayId.replace(/[^0-9]/g, '') : '';
      const hasValidPromptPayId = promptPayId.length >= 10;
      const textToCopy = hasValidPromptPayId ? promptPayId : organizerInfo.accountNumber;
      
      if (textToCopy) {
          navigator.clipboard.writeText(textToCopy.replace(/[^0-9]/g, ''));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  // --- RENDER LOGIC FOR QR ---
  let displayQrUrl = null;
  let isDynamic = false;
  const promptPayId = organizerInfo?.promptPayId ? organizerInfo.promptPayId.replace(/[^0-9]/g, '') : '';
  const hasValidPromptPayId = promptPayId.length >= 10;

  if (organizerInfo) {
      if (hasValidPromptPayId) {
          const payload = generatePromptPayPayload(promptPayId, paymentData.amount);
          displayQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
          isDynamic = true;
      } else if (organizerInfo.qrCodeUrl) {
          displayQrUrl = organizerInfo.qrCodeUrl;
          isDynamic = false;
      }
  }

  const displayTitle = isDynamic ? 'PromptPay (พร้อมเพย์)' : (organizerInfo?.bankName || 'บัญชีธนาคาร');
  const displayNumber = isDynamic ? promptPayId : (organizerInfo?.accountNumber || '-');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-6 rounded-t-3xl relative ${paymentData.isClosingBalance ? 'bg-purple-600' : 'bg-slate-900'} text-white`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
          
          <h3 className="text-xl font-bold text-center flex items-center justify-center gap-2">
              {paymentData.isClosingBalance && <Wallet size={24} />}
              {paymentData.isClosingBalance ? 'ปิดยอดเหมาจ่าย' : 'ชำระงวดแชร์'}
          </h3>
          
          <p className="text-center text-white/80 text-sm mt-1">{paymentData.circleName}</p>
          
          {paymentData.isClosingBalance ? (
              <div className="mt-3 bg-purple-500/50 p-2 rounded-lg text-center text-xs font-bold border border-purple-400/50">
                  ครอบคลุมงวดที่ {paymentData.targetRound} ถึง {paymentData.totalRounds} (จบวง)
              </div>
          ) : (
              <p className="text-center text-emerald-400 text-xs mt-0.5 font-bold">ชำระงวดที่ {paymentData.targetRound} (รวม {paymentData.handCount} มือ)</p>
          )}
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-slate-500 text-sm mb-1">{paymentData.isClosingBalance ? 'ยอดรวมที่ต้องปิด' : 'ยอดรวมที่ต้องโอน'}</p>
            <h2 className={`text-4xl font-bold ${paymentData.isClosingBalance ? 'text-purple-600' : 'text-blue-600'}`}>
                ฿{paymentData.amount.toLocaleString()}
            </h2>
            
            {paymentData.isClosingBalance && (
                <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg inline-block border border-slate-200">
                    <div className="flex items-center justify-center gap-1">
                        <Calculator size={12} />
                        <span>คิดจาก: ฿{paymentData.fixedRatePerRound?.toLocaleString()} x {paymentData.totalRounds! - paymentData.targetRound + 1} งวด</span>
                    </div>
                </div>
            )}
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6 flex flex-col items-center relative overflow-hidden min-h-[250px]">
            {isLoadingInfo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50 z-20">
                    <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                    <p className="text-xs text-blue-400">กำลังดึงข้อมูลท้าวแชร์...</p>
                </div>
            ) : !organizerInfo ? (
                <div className="text-center text-slate-400 py-8">
                    <AlertTriangle className="mx-auto mb-2" />
                    <p className="text-sm">ไม่พบข้อมูลบัญชีของท้าวแชร์</p>
                    <p className="text-xs mt-1">โปรดติดต่อท้าวแชร์โดยตรง</p>
                </div>
            ) : (
                <>
                    {isDynamic && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold shadow-sm z-10">
                            AUTO-AMOUNT
                        </div>
                    )}
                    
                    {displayQrUrl ? (
                        <div className="bg-white p-3 rounded-xl shadow-sm mb-4 border border-blue-100">
                            <img src={displayQrUrl} alt="QR Code" className="w-48 h-48 object-contain mix-blend-multiply" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 bg-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 mb-4 gap-2 text-center p-4">
                            <QrCode size={40} />
                            <span className="text-xs">ไม่มี QR Code</span>
                        </div>
                    )}
                    
                    <div className="text-center w-full">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        {isDynamic ? (
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/PromptPay-logo.png" alt="PromptPay" className="h-6 object-contain" />
                        ) : (
                            <Building2 size={18} className="text-blue-600"/>
                        )}
                        <p className="font-bold text-slate-800 text-base">{displayTitle}</p>
                    </div>
                    
                    <div 
                        onClick={handleCopyAccount}
                        className="flex items-center justify-center gap-2 bg-white border border-blue-200 rounded-lg py-2 px-3 cursor-pointer hover:bg-blue-50 transition-colors active:scale-95 select-none"
                    >
                        <span className="text-lg font-mono font-bold text-slate-700 tracking-wider">
                            {displayNumber || '-'}
                        </span>
                        {copied ? <CheckSquare size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">ชื่อบัญชี: {organizerInfo.accountName}</p>

                    <div className="flex justify-center items-center gap-1 mt-3 text-xs text-blue-700 font-bold">
                        <Smartphone size={14} />
                        <span>{isDynamic ? 'สแกนได้เลย (ยอดเงินขึ้นอัตโนมัติ)' : 'สแกนเพื่อโอนเงิน'}</span>
                    </div>
                    {!isDynamic && (
                        <p className="text-[10px] text-red-400 mt-1">*กรุณาระบุยอดเงินด้วยตนเอง</p>
                    )}
                    </div>
                </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เวลาที่โอน (ตามสลิป)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="time" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-bold text-slate-700"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">แนบหลักฐานการโอน (สลิป)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setSlipFile(e.target.files ? e.target.files[0] : null)}
                />
                <div className="flex flex-col items-center gap-2 py-2">
                   {slipFile ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-sm text-emerald-600 font-bold break-all px-4">{slipFile.name}</span>
                        <span className="text-xs text-slate-400">แตะเพื่อเปลี่ยนรูป</span>
                      </>
                   ) : (
                      <>
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                            <Upload size={24} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">แตะเพื่ออัปโหลดสลิป</span>
                            <p className="text-xs text-slate-400">รองรับ JPG, PNG</p>
                        </div>
                      </>
                   )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !slipFile}
              className={`w-full py-3 text-white rounded-xl font-bold text-lg hover:bg-opacity-90 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 ${
                  paymentData.isClosingBalance ? 'bg-purple-600 shadow-purple-600/30' : 'bg-blue-600 shadow-blue-600/30 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                 <>
                   <Loader2 className="animate-spin" />
                   <span>กำลังส่งข้อมูล...</span>
                 </>
              ) : (
                 <>
                   <span>{paymentData.isClosingBalance ? 'ยืนยันปิดยอด' : 'ยืนยันการโอนเงิน'}</span>
                   <CheckCircle2 size={20} />
                 </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
