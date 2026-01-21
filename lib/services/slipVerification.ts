
import { APP_CONFIG } from '../config';

export interface SlipVerificationResult {
    isValid: boolean;
    sender: string;
    receiver: string;
    amount: number;
    txId: string;
    timestamp: string;
    bankRef?: string;
    message: string;
}

// ฟังก์ชันหลักสำหรับเรียกใช้งานจากหน้าบ้าน
export const verifySlipService = async (file: File | string, expectedAmount?: number): Promise<SlipVerificationResult> => {
    
    // 1. ถ้ายังไม่เปิดใช้จริง ให้ส่งค่า Mock กลับไป
    if (!APP_CONFIG.USE_REAL_SLIP_VERIFICATION) {
        return mockVerifySlip(file, expectedAmount);
    }

    // 2. ถ้าเปิดใช้จริง จะยิง API ไปหา Provider (เช่น EasySlip)
    try {
        const formData = new FormData();
        // กรณี file เป็น URL (String) อาจต้องแปลงเป็น Blob ก่อน หรือถ้า API รับ URL ได้ก็ส่งเลย
        // ในที่นี้สมมติว่าเป็น File object จาก input type="file"
        if (typeof file === 'string') {
             // Logic convert URL to Blob if needed
             throw new Error("Real API requires File object");
        }
        
        formData.append('image', file);

        // ตัวอย่างการยิง API (ต้องปรับตาม Provider ที่เลือกใช้)
        /*
        const response = await fetch(APP_CONFIG.SLIP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${APP_CONFIG.SLIP_API_KEY}`
            },
            body: formData
        });
        const data = await response.json();
        
        // Map data from API to SlipVerificationResult here...
        if (data.status === 200) {
             return {
                isValid: true,
                sender: data.data.sender.displayName,
                receiver: data.data.receiver.displayName,
                amount: data.data.amount.amount,
                txId: data.data.transRef,
                timestamp: data.data.date,
                message: 'ตรวจสอบถูกต้อง (Verified by API)'
             };
        }
        */

        // Placeholder for Real API implementation
        await new Promise(resolve => setTimeout(resolve, 1500));
        return mockVerifySlip(file, expectedAmount); // Fallback

    } catch (error) {
        console.error("Slip Verification Error:", error);
        return {
            isValid: false,
            sender: '-',
            receiver: '-',
            amount: 0,
            txId: '-',
            timestamp: '-',
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ API'
        };
    }
};

// --- MOCKUP LOGIC (เก็บไว้ใช้ตอน Dev / Demo) ---
const mockVerifySlip = async (file: File | string, expectedAmount: number = 0): Promise<SlipVerificationResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

    // Random success rate for demo (90% success)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
        return {
            isValid: true,
            sender: "นายทดสอบ จ่ายจริง",
            receiver: "ท้าวแชร์ (Admin)",
            amount: expectedAmount > 0 ? expectedAmount : 1000 + Math.floor(Math.random() * 500),
            txId: `MOCK-${Date.now().toString().slice(-8)}`,
            timestamp: new Date().toLocaleString('th-TH'),
            message: 'ตรวจสอบข้อมูลถูกต้อง (Simulated)'
        };
    } else {
        return {
            isValid: false,
            sender: "-",
            receiver: "-",
            amount: 0,
            txId: "-",
            timestamp: "-",
            message: 'ไม่พบข้อมูลในระบบธนาคาร (Mock Fail)'
        };
    }
};
