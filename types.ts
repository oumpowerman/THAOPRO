
export enum ShareType {
  DOK_HAK = 'DOK_HAK', // ดอกหัก
  DOK_TAM = 'DOK_TAM', // ดอกตาม
}

export enum SharePeriod {
  DAILY = 'DAILY',     // รายวัน
  WEEKLY = 'WEEKLY',   // รายสัปดาห์
  MONTHLY = 'MONTHLY', // รายเดือน
}

export enum BiddingType {
  AUCTION = 'AUCTION', // แข่งกันบิท (ประมูล)
  FIXED = 'FIXED',     // ล็อคมือ (ระบุงวดชัดเจน)
}

export enum MemberStatus {
  PENDING = 'PENDING', // รออนุมัติ (สมัครใหม่)
  ACTIVE = 'ACTIVE',
  BLACKLIST = 'BLACKLIST',
  WATCHLIST = 'WATCHLIST',
}

export enum CircleStatus {
  INITIALIZING = 'INITIALIZING', // กำลังตั้งวง (ยังไม่เริ่ม)
  SETUP_COMPLETE = 'SETUP_COMPLETE', // ตั้งวงสำเร็จ (เริ่มเดินวงแล้ว)
  ACTIVE = 'ACTIVE',             // Active (Legacy)
  COMPLETED = 'COMPLETED',       // จบวงแล้ว
}

export interface User {
  id: string;
  username: string; 
  name: string;
  role: 'ADMIN' | 'USER' | 'SYSTEM_ADMIN'; // Added SYSTEM_ADMIN
  memberId?: string;
  avatarUrl?: string;
  status?: string; // Added status to track PENDING state
  qrCodeUrl?: string; // New: User's receiving QR Code
}

export interface Member {
  id: string;
  name: string;
  phone: string; 
  role?: 'ADMIN' | 'USER' | 'SYSTEM_ADMIN'; // Added role to member for filtering
  inviteCode?: string; // Added Invite Code for Organizers
  riskScore: 'GOOD' | 'MEDIUM' | 'WATCHLIST';
  status: MemberStatus;
  avatarUrl: string;
  address?: string;
  idCardNumber?: string;
  idCardImageUrl?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bookbankImageUrl?: string;
  qrCodeUrl?: string; // New: Member's receiving QR Code
  creditScore?: number;
}

export interface AdminPaymentInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl: string | null;
  promptPayId?: string;
}

export interface ShareCircle {
  id: string;
  name: string;
  principal: number;
  totalSlots: number;
  type: ShareType;
  biddingType: BiddingType;
  status: CircleStatus;
  minBid: number;
  bidStep: number;
  adminFee?: number; // New: ค่าดูแลท้าว
  fineRate?: number; // New: ค่าปรับต่อวัน
  period: SharePeriod;
  periodInterval?: number; // New: ระยะห่างของงวด (เช่น 2 วันครั้ง) Default 1
  startDate: string;
  nextDueDate: string;
  paymentWindowStart?: string; // New: Start of payment window
  paymentWindowEnd?: string;   // New: End of payment window
  members: CircleMember[];
  rounds: ShareRound[];
  createdBy?: string; 
}

export interface CircleMember {
  memberId: string;
  slotNumber: number;
  status: 'ALIVE' | 'DEAD';
  wonRound?: number;
  bidAmount?: number;
  fixedDueAmount?: number; // New: ยอดส่งงวดแบบ Fix (รวมต้น+ดอกแล้ว หรือ ยอดที่ตกลงกันไว้)
  pidTonAmount?: number; // New: ยอดจ่ายกรณีปิดต้น
  note?: string; // New: หมายเหตุรายมือ
}

export interface ShareRound {
  roundNumber: number;
  date: string;
  winnerId?: string;
  bidAmount: number;
  status: 'OPEN' | 'CLOSED' | 'COLLECTING' | 'COMPLETED';
  totalPot: number;
}

export type TransactionStatus = 'PENDING' | 'WAITING_APPROVAL' | 'PAID' | 'LATE' | 'REJECTED' | 'PARTIAL';

export interface Transaction {
  id: string;
  circleId: string;
  roundNumber: number;
  memberId: string;
  amountExpected: number;
  amountPaid: number;
  status: TransactionStatus;
  slipUrl?: string;
  timestamp?: string;
  rejectReason?: string;
  note?: string; // For comments/partial payment notes
  isFine?: boolean; // Is this a fine payment?
  isClosingBalance?: boolean; // New: Is this a lump sum close balance payment?
}

// NEW INTERFACE FOR PAYOUTS
export interface Payout {
  id: string;
  circleId: string;
  roundNumber: number;
  winnerId: string;
  amount: number; // Net Amount (Pot - AdminFee)
  adminFeeDeducted: number;
  slipUrl?: string;
  status: 'PENDING' | 'PAID';
  timestamp: string;
}

export type AuctionStatus = 'WAITING' | 'LIVE' | 'FINISHED';

export interface BidRecord {
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
}

export interface OnlineParticipant {
    id: string;
    name: string;
    avatarUrl: string;
    joinedAt: string;
}

export interface AuctionSession {
  circleId: string;
  circleName: string;
  roundNumber: number;
  status: AuctionStatus;
  timeLeft: number;
  highestBid: number;
  winnerId: string | null;
  bidHistory: BidRecord[];
  participants: OnlineParticipant[];
  minBid: number;
  bidStep: number;
}
