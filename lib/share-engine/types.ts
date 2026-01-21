
import { ShareCircle, CircleMember, ShareType } from '../../types';

// ข้อมูลที่จำเป็นสำหรับการคำนวณ 1 มือ (Input)
export interface CalculationInput {
    circle: ShareCircle;
    member: CircleMember;       // ข้อมูลสมาชิก (Slot, Status, PidTon)
    roundNumber: number;        // งวดที่กำลังคำนวณ
    winnerId: string | undefined; // ID ของผู้ชนะในงวดนั้น (ถ้ามี)
    bidAmount: number;          // ยอดบิทของงวดนั้น (ถ้ายังไม่รู้ ใส่ 0 หรือค่าคาดการณ์)
    isRoundOpen: boolean;       // ถ้างวดเปิดอยู่ (ยังไม่สรุปยอด) การคำนวณบางอย่างจะเป็น "ยอดเบื้องต้น"
}

// ผลลัพธ์การคำนวณ (Output)
export interface CalculationResult {
    payAmount: number;          // ยอดที่ต้องจ่าย
    status: 'THAO' | 'WINNER' | 'DEAD' | 'ALIVE' | 'PID_TON' | 'PID_TON_PAID'; // สถานะเชิง Logic ของมือนั้นในงวดนั้น
    note: string;               // คำอธิบาย (เช่น "มือตาย (ต้น+ดอก)")
}

// Interface สำหรับ Strategy (แม่แบบของไฟล์ auction.ts และ ladder.ts)
export interface ShareCalculatorStrategy {
    calculate(input: CalculationInput): CalculationResult;
}
