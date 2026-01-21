
import { APP_CONFIG } from '../config';

// ฟังก์ชันส่งแจ้งเตือนเข้าไลน์
export const sendLineNotification = async (message: string, imageUrl?: string) => {
    
    // 1. Check if disabled or missing token
    if (!APP_CONFIG.USE_REAL_LINE_NOTIFY) {
        console.log(`[MOCK LINE NOTIFY]: ${message}`);
        return;
    }

    if (!APP_CONFIG.LINE_NOTIFY_TOKEN) {
        console.warn("LINE Notify Token is missing in config.ts");
        return;
    }

    try {
        // 2. Prepare Payload (x-www-form-urlencoded)
        const params = new URLSearchParams();
        params.append('message', message);
        
        if (imageUrl) {
            params.append('imageThumbnail', imageUrl);
            params.append('imageFullsize', imageUrl);
        }

        // 3. Construct URL with Proxy (to bypass CORS in browser)
        // Note: Direct call to https://notify-api.line.me will fail in browser due to CORS policy
        const targetUrl = APP_CONFIG.LINE_NOTIFY_API_URL;
        const proxyUrl = APP_CONFIG.CORS_PROXY_URL || ''; 
        const finalUrl = proxyUrl + targetUrl;

        console.log(`Sending Real Line Notify to: ${finalUrl}`);

        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${APP_CONFIG.LINE_NOTIFY_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                // Add custom header if using specific proxies, usually not needed for standard cors-anywhere
            },
            body: params
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LINE API Error: ${response.status} - ${errorText}`);
        }

        console.log("Line Notification Sent Successfully!");

    } catch (error) {
        console.error("Line Notify Error:", error);
        console.info("Tip: If you see a CORS error, ensure you are using a Proxy or running this on a backend server.");
    }
};

// Helper: สร้างข้อความแจ้งโอนเงิน
export const generatePaymentMessage = (
    memberName: string, 
    circleName: string, 
    round: number, 
    amount: number,
    additionalNote?: string
) => {
    return `
💰 แจ้งโอนเงินใหม่!
👤 สมาชิก: ${memberName}
⭕ วง: ${circleName} (งวดที่ ${round})
💵 ยอดเงิน: ฿${amount.toLocaleString()}
📅 เวลา: ${new Date().toLocaleString('th-TH')}
${additionalNote ? `📝 ${additionalNote}` : ''}
    `.trim();
};

// Helper: สร้างข้อความแจ้งเตือนค้างชำระ
export const generateOverdueMessage = (
    memberName: string,
    circleName: string,
    amount: number,
    daysLate: number
) => {
    return `
⚠️ แจ้งเตือนยอดค้างชำระ
👤 ถึง: ${memberName}
⭕ วง: ${circleName}
💵 ยอดค้าง: ฿${amount.toLocaleString()}
❗ ล่าช้า: ${daysLate} วัน
กรุณาชำระโดยเร็วที่สุด ขอบคุณครับ 🙏
    `.trim();
};
