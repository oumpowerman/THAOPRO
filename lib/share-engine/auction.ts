
import { ShareCalculatorStrategy, CalculationInput, CalculationResult } from './types';
import { ShareType, BiddingType } from '../../types';

// --- LOGIC สำหรับแบบ "ประมูล" (Auction) ---

export const AuctionCalculator: ShareCalculatorStrategy = {
    calculate(input: CalculationInput): CalculationResult {
        const { circle, member, roundNumber, winnerId, bidAmount, isRoundOpen } = input;
        const principal = circle.principal;

        // 1. กฎเหล็ก: ท้าวแชร์ (Slot 1) ไม่ต้องส่งเงินต้น
        if (member.slotNumber === 1) {
            return {
                payAmount: 0,
                status: 'THAO',
                note: 'ท้าวแชร์ (ไม่ต้องส่ง)'
            };
        }

        // 2. ผู้ชนะประมูล (Winner) ไม่ต้องส่งเงินเข้ากองกลาง (รอรับเงินก้อน)
        if (winnerId && member.memberId === winnerId) {
            return {
                payAmount: 0,
                status: 'WINNER',
                note: 'ผู้ชนะประมูล (รับเงินก้อน)'
            };
        }

        // 3. เช็คสถานะมือตาย ณ งวดปัจจุบัน
        const wonRound = member.wonRound || 9999;
        const isDeadAtThisRound = member.status === 'DEAD' && wonRound < roundNumber;

        // 4. กรณีปิดต้น (Pid Ton) - UPDATED LOGIC
        // มือปิดต้นจ่ายเหมาหมดตั้งแต่งวดแรก งวดต่อๆ ไปไม่ต้องจ่าย
        if (member.pidTonAmount && member.pidTonAmount > 0) {
             if (roundNumber === 1) {
                 // งวดแรกจ่ายก้อนใหญ่
                 return {
                     payAmount: member.pidTonAmount,
                     status: 'PID_TON', // Treat as special status
                     note: `ปิดต้นงวดแรก (Fixed ฿${member.pidTonAmount.toLocaleString()})`
                 };
             } else {
                 // งวดถัดๆ ไปไม่ต้องจ่าย (ถือว่าจ่ายแล้ว)
                 return {
                     payAmount: 0,
                     status: 'PID_TON_PAID', // Special status indicating already paid upfront
                     note: 'ปิดต้นแล้ว (Paid Upfront)'
                 };
             }
        }

        if (isDeadAtThisRound) {
            // --- กรณีมือตาย (เปียไปแล้ว) ---
            if (circle.type === ShareType.DOK_TAM) {
                // ดอกตาม: มือตายจ่าย "ต้น + ดอกที่ตัวเองเคยเปียไว้"
                const amount = principal + (member.bidAmount || 0);
                return {
                    payAmount: amount,
                    status: 'DEAD',
                    note: `มือตาย (ต้น+ดอก ${member.bidAmount})`
                };
            } else {
                // ดอกหัก: มือตายจ่าย "ต้นเต็ม"
                return {
                    payAmount: principal,
                    status: 'DEAD',
                    note: 'มือตาย (จ่ายเต็ม)'
                };
            }
        } else {
            // --- กรณีมือเป็น (ยังไม่เปีย) ---
            if (circle.type === ShareType.DOK_HAK) {
                // ดอกหัก: มือเป็นจ่าย "ต้น - ดอกประมูลของงวดนี้"
                const amount = Math.max(0, principal - bidAmount);
                return {
                    payAmount: amount,
                    status: 'ALIVE',
                    note: isRoundOpen && bidAmount === 0 
                        ? 'มือเป็น (รอสรุปดอก)' 
                        : `มือเป็น (หักดอก ${bidAmount})`
                };
            } else {
                // ดอกตาม: มือเป็นจ่าย "ต้นเต็ม"
                return {
                    payAmount: principal,
                    status: 'ALIVE',
                    note: 'มือเป็น (ส่งต้น)'
                };
            }
        }
    }
};
