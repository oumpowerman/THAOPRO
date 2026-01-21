
import { ShareCalculatorStrategy, CalculationInput, CalculationResult } from './types';
import { ShareType } from '../../types';

// --- LOGIC สำหรับแบบ "ขั้นบันได" (Fixed/Ladder) ---

export const LadderCalculator: ShareCalculatorStrategy = {
    calculate(input: CalculationInput): CalculationResult {
        const { circle, member, roundNumber, winnerId } = input;
        
        // 1. กฎเหล็ก: ท้าวแชร์ (Slot 1) ไม่ต้องส่งเงินต้น
        if (member.slotNumber === 1) {
            return {
                payAmount: 0,
                status: 'THAO',
                note: 'ท้าวแชร์ (ไม่ต้องส่ง)'
            };
        }

        // 2. ผู้ชนะ (Winner)
        if (winnerId && member.memberId === winnerId) {
            return {
                payAmount: 0,
                status: 'WINNER',
                note: 'ผู้รับเงิน (Winner)'
            };
        }

        // 3. กรณีปิดต้น (Pid Ton)
        if (member.pidTonAmount && member.pidTonAmount > 0) {
             if (roundNumber === 1) {
                 return {
                     payAmount: member.pidTonAmount,
                     status: 'PID_TON',
                     note: `ปิดต้นงวดแรก (Fixed ฿${member.pidTonAmount.toLocaleString()})`
                 };
             } else {
                 return {
                     payAmount: 0,
                     status: 'PID_TON_PAID',
                     note: 'ปิดต้นแล้ว (Paid Upfront)'
                 };
             }
        }

        // 4. *** LOGIC ใหม่: ใช้ fixedDueAmount ที่ระบุไว้เฉพาะเจาะจง ***
        // ถ้ามีการระบุ fixedDueAmount ให้ใช้ค่านั้นจ่ายทุกงวด
        if (member.fixedDueAmount !== undefined && member.fixedDueAmount > 0) {
            return {
                payAmount: member.fixedDueAmount,
                status: member.status === 'DEAD' ? 'DEAD' : 'ALIVE',
                note: member.status === 'DEAD' ? 'ส่งงวด (Fixed)' : 'ส่งงวด (Fixed)'
            };
        }

        // --- Fallback Logic (ถ้าไม่มี fixedDueAmount ให้ใช้สูตรเดิมเพื่อ Backward Compatibility) ---
        const principal = circle.principal;
        
        const wonRound = member.wonRound || 9999;
        const isDeadAtThisRound = member.status === 'DEAD' && wonRound < roundNumber;

        if (isDeadAtThisRound) {
            // --- กรณีมือตาย ---
            if (circle.type === ShareType.DOK_TAM) {
                const amount = principal + (member.bidAmount || 0);
                return {
                    payAmount: amount,
                    status: 'DEAD',
                    note: `มือตาย (ต้น+ดอก ${member.bidAmount})`
                };
            } else {
                return {
                    payAmount: principal,
                    status: 'DEAD',
                    note: 'มือตาย (จ่ายเต็ม)'
                };
            }
        } else {
            // --- กรณีมือเป็น ---
            if (circle.type === ShareType.DOK_HAK) {
                 const bidAmount = input.bidAmount || 0; 
                 const amount = Math.max(0, principal - bidAmount);
                 return {
                    payAmount: amount,
                    status: 'ALIVE',
                    note: `มือเป็น (หักดอก ${bidAmount})`
                 };
            } else {
                return {
                    payAmount: principal,
                    status: 'ALIVE',
                    note: 'มือเป็น (ส่งต้น)'
                };
            }
        }
    }
};
