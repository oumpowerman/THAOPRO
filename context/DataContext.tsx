
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Member, ShareCircle, Transaction, Payout, SharePeriod, ShareType, BiddingType, CircleStatus, CircleMember, MemberStatus, TransactionStatus } from '../types';
import * as API from '../lib/api';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { formatErrorMessage } from '../lib/errorHandler';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const DEFAULT_SCRIPT = `📢 เปิดจองวงใหม่จ้า
ชื่อวง {name}
เงินต้น {principal}
รูปแบบ {biddingType}
ส่ง {period}
บิทขั้นต่ำ {minBid}
บิทเพิ่มทีละ {bidStep}

รายชื่อสมาชิก
{members}

สนใจทักแชทได้เลยจ้า 💸`;

interface DataContextType {
  members: Member[];
  circles: ShareCircle[];
  transactions: Transaction[];
  payouts: Payout[];
  scriptTemplate: string;
  saveScriptTemplate: (template: string) => void;
  
  addMember: (member: Member) => Promise<void>;
  approveMember: (id: string) => Promise<void>;
  rejectMember: (id: string) => Promise<void>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>; 
  updateInviteCode: (memberId: string, code: string) => Promise<void>; 

  addCircle: (circle: ShareCircle) => Promise<void>;
  updateCircle: (id: string, data: Partial<ShareCircle>) => Promise<void>; 
  updateCircleSlot: (circleId: string, slotNumber: number, data: Partial<CircleMember>) => Promise<void>;
  deleteCircle: (id: string) => Promise<void>;
  startCircle: (id: string) => Promise<void>; 
  
  recordBid: (circleId: string, roundNumber: number, winnerId: string, bidAmount: number, totalPot: number) => Promise<void>;
  submitPayment: (circleId: string, roundNumber: number, amount: number, slipFile: File | null) => Promise<void>;
  submitClosingBalance: (circleId: string, startRound: number, amount: number, slipFile: File | null) => Promise<void>; 
  createTransaction: (transaction: Transaction) => Promise<void>; 
  approveTransaction: (transactionId: string, deductScore?: number) => Promise<void>; 
  rejectTransaction: (transactionId: string, reason: string) => Promise<void>; 
  
  addPayout: (payoutData: {circleId: string, roundNumber: number, winnerId: string, amount: number, adminFee: number, slipFile: File | null}) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshProfile } = useAuth();
  const { showAlert } = useUI();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [circles, setCircles] = useState<ShareCircle[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [scriptTemplate, setScriptTemplate] = useState<string>(DEFAULT_SCRIPT);

  const fetchData = async () => {
      try {
          if (!user && isSupabaseConfigured) return;

          // Resolve User
          const currentUserRole = user?.role || '';
          const currentUserId = user?.id || '';
          const profile = await API.AuthService.getProfile(currentUserId);
          const currentInviteCode = profile?.invite_code || '';

          const data = await API.DataService.fetchAll(currentUserRole, currentUserId, currentInviteCode);

          // Map Data Logic
          if (data.profiles) {
              const mappedMembers: Member[] = data.profiles.map((p: any) => ({
                  id: p.id,
                  name: p.name || 'Unknown',
                  phone: p.phone || '', 
                  role: p.role || 'USER', 
                  inviteCode: p.invite_code || '', 
                  riskScore: p.risk_score || 'GOOD',
                  status: p.status || 'PENDING',
                  avatarUrl: p.avatar_url || 'https://ui-avatars.com/api/?name=User',
                  address: p.address,
                  idCardNumber: p.id_card_number,
                  idCardImageUrl: p.id_card_image_url,
                  bankName: p.bank_name,
                  bankAccountNumber: p.bank_account_number,
                  bookbankImageUrl: p.bookbank_image_url,
                  creditScore: p.credit_score || 100
              }));
              let finalMembers = mappedMembers;
              if (currentUserRole === 'ADMIN') {
                  finalMembers = mappedMembers.filter(m => m.id !== currentUserId && m.role !== 'ADMIN');
              }
              setMembers(finalMembers);
          }

          if (data.circlesData) {
              const relevantCircles = data.circlesData.filter((c: any) => {
                  if (currentUserRole === 'SYSTEM_ADMIN') return true;
                  else if (currentUserRole === 'ADMIN') return c.created_by === currentUserId; 
                  else return c.circle_members.some((m:any) => m.member_id === currentUserId);
              });

              const mappedCircles: ShareCircle[] = relevantCircles.map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  principal: c.principal,
                  totalSlots: c.total_slots,
                  type: c.type as ShareType,
                  biddingType: c.bidding_type as BiddingType,
                  status: c.status as CircleStatus,
                  minBid: c.min_bid,
                  bidStep: c.bid_step,
                  adminFee: c.admin_fee || 0,
                  fineRate: c.fine_rate || 0,
                  period: c.period as SharePeriod,
                  periodInterval: c.periodInterval || c.period_interval || 1, 
                  startDate: c.start_date,
                  nextDueDate: c.next_due_date,
                  createdBy: c.created_by,
                  paymentWindowStart: c.paymentWindowStart, 
                  paymentWindowEnd: c.paymentWindowEnd,     
                  members: c.circle_members.map((cm: any) => ({
                      memberId: cm.member_id,
                      slotNumber: cm.slot_number,
                      status: cm.status,
                      wonRound: cm.won_round,
                      bidAmount: cm.bid_amount,
                      pidTonAmount: cm.pidTonAmount,
                      fixedDueAmount: cm.fixedDueAmount, // ADDED: Mapping fixedDueAmount correctly
                      note: cm.note 
                  })).sort((a:any,b:any) => a.slotNumber - b.slotNumber),
                  rounds: c.share_rounds.map((r: any) => ({
                      roundNumber: r.round_number,
                      date: r.date,
                      winnerId: r.winner_id,
                      bidAmount: r.bid_amount,
                      status: r.status,
                      totalPot: r.total_pot
                  })).sort((a: any, b: any) => a.roundNumber - b.roundNumber)
              }));
              setCircles(mappedCircles);
          }

          if (data.txData) {
              const mappedTx: Transaction[] = data.txData.map((t: any) => ({
                  id: t.id,
                  circleId: t.circle_id,
                  roundNumber: t.round_number,
                  memberId: t.member_id,
                  amountExpected: t.amount_expected,
                  amountPaid: t.amount_paid,
                  status: t.status as TransactionStatus,
                  slipUrl: t.slip_url,
                  timestamp: new Date(t.created_at).toLocaleString('th-TH'),
                  rejectReason: t.reject_reason,
                  note: t.note,
                  isFine: t.is_fine,
                  isClosingBalance: t.is_closing_balance 
              }));
              setTransactions(mappedTx);
          }

          if (data.payoutData) {
              const mappedPayouts: Payout[] = data.payoutData.map((p: any) => ({
                  id: p.id,
                  circleId: p.circle_id,
                  roundNumber: p.round_number,
                  winnerId: p.winner_id,
                  amount: p.amount_net,
                  adminFeeDeducted: p.admin_fee,
                  slipUrl: p.slip_url,
                  status: p.status,
                  timestamp: new Date(p.created_at).toLocaleString('th-TH')
              }));
              setPayouts(mappedPayouts);
          }

      } catch (error) {
          console.error("Fetch Data Error:", error);
      }
  };

  useEffect(() => {
      fetchData();
  }, [user]);

  // --- ACTIONS ---

  const addMember = async (member: Member) => {
      setMembers(prev => [...prev, member]);
  };

  const approveMember = async (id: string) => {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: MemberStatus.ACTIVE } : m));
      try {
          await API.AuthService.updateProfile(id, { status: 'ACTIVE' });
      } catch(e) {
          showAlert(formatErrorMessage(e), 'อนุมัติไม่สำเร็จ', 'error');
      }
  };

  const rejectMember = async (id: string) => {
      setMembers(prev => prev.filter(m => m.id !== id));
      try {
          await API.AuthService.deleteProfile(id);
      } catch(e) {
          showAlert(formatErrorMessage(e), 'ปฏิเสธไม่สำเร็จ', 'error');
      }
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      const dbData: any = {};
      if (data.name) dbData.name = data.name;
      if (data.phone) dbData.phone = data.phone; 
      if (data.riskScore) dbData.risk_score = data.riskScore; 
      if (data.creditScore !== undefined) dbData.credit_score = data.creditScore; 
      if (data.address) dbData.address = data.address; 
      if (data.idCardNumber) dbData.id_card_number = data.idCardNumber; 
      if (data.bankName) dbData.bank_name = data.bankName; 
      if (data.bankAccountNumber) dbData.bank_account_number = data.bankAccountNumber; 
      if (data.avatarUrl) dbData.avatar_url = data.avatarUrl;
      
      try {
          await API.AuthService.updateProfile(id, dbData);
      } catch (err) {
          showAlert(formatErrorMessage(err), 'บันทึกข้อมูลไม่สำเร็จ', 'error');
      }
  };

  const updateInviteCode = async (memberId: string, code: string) => {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, inviteCode: code } : m));
      try {
          await API.AuthService.updateProfile(memberId, { invite_code: code });
      } catch(e) {
          showAlert(formatErrorMessage(e), 'บันทึกรหัสเชิญไม่สำเร็จ', 'error');
      }
  };

  const addCircle = async (circle: ShareCircle) => {
      if (user?.id) circle.createdBy = user.id;
      try {
          const circleId = await API.CircleService.create(circle, user?.id || '');
          if (circleId) {
              circle.id = circleId; 
              await fetchData(); 
          }
      } catch (e) {
          console.error(e);
          throw e; 
      }
  };

  const updateCircle = async (id: string, data: Partial<ShareCircle>) => {
      const dbData: any = {};
      
      if (data.name !== undefined) dbData.name = data.name;
      if (data.principal !== undefined) dbData.principal = data.principal; 
      if (data.totalSlots !== undefined) dbData.total_slots = data.totalSlots;
      if (data.type !== undefined) dbData.type = data.type;
      if (data.biddingType !== undefined) dbData.bidding_type = data.biddingType;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.minBid !== undefined) dbData.min_bid = data.minBid;
      if (data.bidStep !== undefined) dbData.bid_step = data.bidStep;
      if (data.adminFee !== undefined) dbData.admin_fee = data.adminFee;
      if (data.fineRate !== undefined) dbData.fine_rate = data.fineRate;
      if (data.period !== undefined) dbData.period = data.period;
      if (data.periodInterval !== undefined) dbData.period_interval = data.periodInterval; 
      if (data.startDate !== undefined) dbData.start_date = data.startDate;
      if (data.nextDueDate !== undefined) dbData.next_due_date = data.nextDueDate;
      if (data.paymentWindowStart !== undefined) dbData.payment_window_start = data.paymentWindowStart;
      if (data.paymentWindowEnd !== undefined) dbData.payment_window_end = data.paymentWindowEnd;

      try {
          const { error } = await API.CircleService.update(id, dbData);
          if (error) throw error;

          if (data.members) {
              await API.CircleService.updateMembers(id, data.members);
          }
          
          setCircles(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      } catch (e) {
          console.error(e);
          throw e; 
      }
  };

  const updateCircleSlot = async (circleId: string, slotNumber: number, data: Partial<CircleMember>) => {
      setCircles(prev => prev.map(c => {
          if (c.id === circleId) {
              const updatedMembers = c.members.map(m => m.slotNumber === slotNumber ? { ...m, ...data } : m);
              return { ...c, members: updatedMembers };
          }
          return c;
      }));
      try {
          await API.CircleService.updateSlot(circleId, slotNumber, data);
      } catch(e) {
          showAlert(formatErrorMessage(e), 'อัปเดตสล็อตไม่สำเร็จ', 'error');
      }
  };

  const deleteCircle = async (id: string) => {
      setCircles(prev => prev.filter(c => c.id !== id));
      try {
          await API.CircleService.delete(id);
      } catch(e) {
          showAlert(formatErrorMessage(e), 'ลบวงไม่สำเร็จ', 'error');
          await fetchData();
      }
  };

  const startCircle = async (id: string) => {
      const circle = circles.find(c => c.id === id);
      if (!circle) return;

      const slot1Member = circle.members.find(m => m.slotNumber === 1);
      if (!slot1Member) return;

      setCircles(prev => prev.map(c => {
          if (c.id === id) {
              const newStatus = CircleStatus.SETUP_COMPLETE;
              const newMembers = c.members.map(m => m.slotNumber === 1 ? { ...m, status: 'DEAD' as const, wonRound: 1, bidAmount: 0 } : m);
              // CHANGE: Set status to COLLECTING for Round 1
              const newRounds = c.rounds.map(r => r.roundNumber === 1 ? { ...r, status: 'COLLECTING' as const, winnerId: slot1Member.memberId, bidAmount: 0, totalPot: circle.totalSlots * circle.principal } : r);
              if (newRounds.length === 1) {
                  const d = new Date(circle.startDate);
                  const interval = circle.periodInterval || 1;
                  if (circle.period === SharePeriod.DAILY) d.setDate(d.getDate() + (1 * interval));
                  if (circle.period === SharePeriod.WEEKLY) d.setDate(d.getDate() + (7 * interval));
                  if (circle.period === SharePeriod.MONTHLY) d.setMonth(d.getMonth() + (1 * interval));
                  
                  newRounds.push({ roundNumber: 2, date: d.toISOString(), status: 'OPEN', bidAmount: 0, totalPot: 0 });
              }
              return { ...c, status: newStatus, members: newMembers, rounds: newRounds };
          }
          return c;
      }));

      try {
          await API.CircleService.start(id, slot1Member.memberId, circle.totalSlots * circle.principal);
      } catch(e) {
          showAlert(formatErrorMessage(e), 'เริ่มวงไม่สำเร็จ', 'error');
      }
  };

  const recordBid = async (circleId: string, roundNumber: number, winnerId: string, bidAmount: number, totalPot: number) => {
      const circle = circles.find(c => c.id === circleId);
      if (!circle) return;

      const currentRoundNum = roundNumber;
      
      // Optimistic Update
      setCircles(prev => prev.map(c => {
          if (c.id !== circleId) return c;
          
          // 1. Update Rounds -> Set to COLLECTING instead of COMPLETED
          const newRounds = c.rounds.map(r => 
              r.roundNumber === currentRoundNum 
              ? { ...r, status: 'COLLECTING', winnerId, bidAmount, totalPot } as any
              : r
          );

          // 2. Update Member (Winner)
          const newMembers = c.members.map(m => 
              m.memberId === winnerId 
              ? { ...m, status: 'DEAD', bidAmount, wonRound: currentRoundNum } as any
              : m
          );

          // 3. Add Next Round (If not last)
          let nextDueDate = c.nextDueDate;
          if (currentRoundNum < c.totalSlots) {
              const d = new Date(c.nextDueDate);
              const interval = c.periodInterval || 1;
              if (c.period === SharePeriod.DAILY) d.setDate(d.getDate() + (1 * interval));
              if (c.period === SharePeriod.WEEKLY) d.setDate(d.getDate() + (7 * interval));
              if (c.period === SharePeriod.MONTHLY) d.setMonth(d.getMonth() + (1 * interval));
              nextDueDate = d.toISOString();

              if (!newRounds.find(r => r.roundNumber === currentRoundNum + 1)) {
                  newRounds.push({
                      roundNumber: currentRoundNum + 1,
                      date: nextDueDate,
                      status: 'OPEN',
                      bidAmount: 0,
                      totalPot: 0
                  });
              }
          }
          
          return { ...c, members: newMembers, rounds: newRounds, nextDueDate };
      }));

      try {
          const winnerMember = circle.members.find(m => m.memberId === winnerId);
          const memberSlot = winnerMember ? winnerMember.slotNumber : 0;
          
          const d = new Date(circle.nextDueDate);
          const interval = circle.periodInterval || 1;
          if (circle.period === SharePeriod.DAILY) d.setDate(d.getDate() + (1 * interval));
          if (circle.period === SharePeriod.WEEKLY) d.setDate(d.getDate() + (7 * interval));
          if (circle.period === SharePeriod.MONTHLY) d.setMonth(d.getMonth() + (1 * interval));

          await API.CircleService.recordBid(circleId, roundNumber, winnerId, bidAmount, totalPot, memberSlot, d.toISOString(), roundNumber === circle.totalSlots);
      } catch (e) {
          console.error(e);
          showAlert(formatErrorMessage(e), 'บันทึกผลประมูลไม่สำเร็จ', 'error');
          await fetchData(); 
      }
  };

  const submitPayment = async (circleId: string, roundNumber: number, amount: number, slipFile: File | null) => {
      if (!user) return;
      
      const newTx: Transaction = {
          id: `temp-${Date.now()}`,
          circleId,
          roundNumber,
          memberId: user.id,
          amountExpected: amount,
          amountPaid: amount,
          status: 'WAITING_APPROVAL',
          timestamp: new Date().toLocaleString('th-TH'),
          slipUrl: slipFile ? URL.createObjectURL(slipFile) : undefined
      };

      try {
          let slipUrl = undefined;
          if (slipFile) {
              slipUrl = await API.uploadFile(slipFile, 'slips', `${user.id}/${Date.now()}_slip.jpg`);
              if (!slipUrl && isSupabaseConfigured) {
                  throw new Error("อัปโหลดสลิปไม่สำเร็จ (Upload failed)");
              }
          }
          
          const dbTx = {
              ...newTx,
              slipUrl: slipUrl
          };
          await API.TransactionService.create(dbTx);
          
          // Only update local state if API success
          setTransactions(prev => [...prev, dbTx]);
      } catch(e) {
          console.error(e);
          // Re-throw so the UI component knows it failed
          throw e; 
      }
  };

  // --- NEW: Submit Closing Balance Payment (Lump Sum) ---
  const submitClosingBalance = async (circleId: string, startRound: number, amount: number, slipFile: File | null) => {
      if (!user) return;

      const newTx: Transaction = {
          id: `temp-close-${Date.now()}`,
          circleId,
          roundNumber: startRound, 
          memberId: user.id,
          amountExpected: amount,
          amountPaid: amount,
          status: 'WAITING_APPROVAL',
          timestamp: new Date().toLocaleString('th-TH'),
          slipUrl: slipFile ? URL.createObjectURL(slipFile) : undefined,
          isClosingBalance: true, 
          note: `ปิดยอดเหมาจ่าย (Close Balance) ตั้งแต่งวดที่ ${startRound}`
      };

      try {
          let slipUrl = undefined;
          if (slipFile) {
              slipUrl = await API.uploadFile(slipFile, 'slips', `${user.id}/${Date.now()}_close_balance.jpg`);
              if (!slipUrl && isSupabaseConfigured) {
                  throw new Error("อัปโหลดสลิปไม่สำเร็จ (Upload failed)");
              }
          }
          
          const dbTx = {
              ...newTx,
              slipUrl: slipUrl
          };
          await API.TransactionService.create(dbTx);
          
          // Only update local state if API success
          setTransactions(prev => [...prev, dbTx]);
      } catch(e) {
          console.error(e);
          throw e;
      }
  };

  const createTransaction = async (tx: Transaction) => {
      setTransactions(prev => [...prev, tx]);
      try {
          await API.TransactionService.create(tx);
      } catch(e) {
          showAlert(formatErrorMessage(e), 'สร้างรายการไม่สำเร็จ', 'error');
      }
  };

  const approveTransaction = async (transactionId: string, deductScore?: number) => {
      const targetTx = transactions.find(t => t.id === transactionId);
      
      // Update UI Optimistically
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'PAID' as TransactionStatus } : t));
      
      try {
          await API.TransactionService.updateStatus(transactionId, 'PAID');
          
          if (targetTx && targetTx.isClosingBalance) {
              const circle = circles.find(c => c.id === targetTx.circleId);
              if (circle) {
                  const startRound = targetTx.roundNumber;
                  const memberId = targetTx.memberId;
                  const circleMember = circle.members.find(m => m.memberId === memberId);
                  
                  let payPerRound = circle.principal;
                  if (circle.type === ShareType.DOK_TAM && circleMember?.bidAmount) {
                      payPerRound += circleMember.bidAmount;
                  }
                  
                  const futureTransactions: Transaction[] = [];
                  for (let r = startRound + 1; r <= circle.totalSlots; r++) {
                      const autoTx: Transaction = {
                          id: `auto-closed-${circle.id}-${r}-${memberId}-${Date.now()}`,
                          circleId: circle.id,
                          roundNumber: r,
                          memberId: memberId,
                          amountExpected: payPerRound,
                          amountPaid: payPerRound, 
                          status: 'PAID',
                          timestamp: new Date().toLocaleString('th-TH'),
                          slipUrl: targetTx.slipUrl, 
                          note: `ระบบอัตโนมัติ (จากยอดปิดเหมา - Ref: ${transactionId})`,
                          isClosingBalance: false 
                      };
                      futureTransactions.push(autoTx);
                  }

                  setTransactions(prev => [...prev, ...futureTransactions]);

                  for (const tx of futureTransactions) {
                      await API.TransactionService.create(tx);
                  }
                  
                  showAlert('อนุมัติยอดปิดเหมาและอัปเดตงวดในอนาคตเรียบร้อยแล้ว', 'สำเร็จ', 'success');
              }
          }

          if (deductScore && deductScore > 0) {
              const tx = transactions.find(t => t.id === transactionId);
              if (tx) {
                  const member = members.find(m => m.id === tx.memberId);
                  if (member) {
                      const newScore = Math.max(0, (member.creditScore || 100) - deductScore);
                      updateMember(member.id, { creditScore: newScore });
                  }
              }
          }
      } catch(e) {
          showAlert(formatErrorMessage(e), 'อนุมัติไม่สำเร็จ', 'error');
      }
  };

  const rejectTransaction = async (transactionId: string, reason: string) => {
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'REJECTED' as TransactionStatus, rejectReason: reason } : t));
      try {
          await API.TransactionService.updateStatus(transactionId, 'REJECTED', reason);
      } catch(e) {
          showAlert(formatErrorMessage(e), 'ปฏิเสธไม่สำเร็จ', 'error');
      }
  };

  const addPayout = async (payoutData: {circleId: string, roundNumber: number, winnerId: string, amount: number, adminFee: number, slipFile: File | null}) => {
      const { circleId, roundNumber, winnerId, amount, adminFee, slipFile } = payoutData;
      
      const newPayout: Payout = {
          id: `temp-payout-${Date.now()}`,
          circleId,
          roundNumber,
          winnerId,
          amount,
          adminFeeDeducted: adminFee,
          status: 'PAID',
          timestamp: new Date().toLocaleString('th-TH')
      };
      setPayouts(prev => [...prev, newPayout]);

      // Optimistic Update: Mark Round as COMPLETED (Closed)
      setCircles(prev => prev.map(c => {
          if (c.id === circleId) {
              return {
                  ...c,
                  rounds: c.rounds.map(r => r.roundNumber === roundNumber ? { ...r, status: 'COMPLETED' } as any : r)
              };
          }
          return c;
      }));

      try {
          let slipUrl = '';
          if (slipFile) {
              slipUrl = await API.uploadFile(slipFile, 'payouts', `${circleId}_r${roundNumber}_${Date.now()}.jpg`) || '';
          }
          
          await API.PayoutService.create({
              circle_id: circleId,
              round_number: roundNumber,
              winner_id: winnerId,
              amount_net: amount,
              admin_fee: adminFee,
              slip_url: slipUrl,
              status: 'PAID'
          });

          // COMPLETE THE ROUND IN DB
          await API.CircleService.completeRound(circleId, roundNumber);

          return true;
      } catch(e) {
          console.error(e);
          showAlert(formatErrorMessage(e), 'บันทึกการโอนเงินไม่สำเร็จ', 'error');
          // Revert optimistic update? Or just reload?
          await fetchData();
          return false;
      }
  };

  const refreshData = async () => {
      await fetchData();
  };

  return (
    <DataContext.Provider value={{
      members, circles, transactions, payouts, scriptTemplate, saveScriptTemplate: setScriptTemplate,
      addMember, approveMember, rejectMember, updateMember, updateInviteCode,
      addCircle, updateCircle, updateCircleSlot, deleteCircle, startCircle,
      recordBid, submitPayment, submitClosingBalance, createTransaction, approveTransaction, rejectTransaction,
      addPayout, refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
