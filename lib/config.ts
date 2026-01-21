
// รวมการตั้งค่าทั้งหมดไว้ที่นี่ เพื่อให้ง่ายต่อการแก้ไขเมื่อจะขึ้นระบบจริง
// ปรับปรุงให้รองรับ Environment Variables (VITE_...) เพื่อความปลอดภัยในการ Deploy

const getEnv = (key: string, defaultValue: string = '') => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key] || defaultValue;
    }
    return defaultValue;
};

const getBoolEnv = (key: string, defaultValue: boolean = false) => {
    const val = getEnv(key);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return defaultValue;
};

export const APP_CONFIG = {
    // =================================================================
    // 1. SYSTEM CONFIGURATION (ตั้งค่าระบบ)
    // =================================================================
    
    // ตั้งค่าผ่าน Environment Variable: VITE_USE_REAL_SLIP=true
    // หากเป็น false ระบบจะใช้ Mockup (สุ่มผลลัพธ์) สำหรับทดสอบฟรี
    USE_REAL_SLIP_VERIFICATION: getBoolEnv('VITE_USE_REAL_SLIP', false), 

    // ตั้งค่าผ่าน Environment Variable: VITE_USE_REAL_LINE=true
    // คำเตือน: การยิง LINE Notify จาก Browser โดยตรงอาจติด CORS ต้องใช้ Proxy หรือ Supabase Edge Function
    USE_REAL_LINE_NOTIFY: getBoolEnv('VITE_USE_REAL_LINE', false), 

    // =================================================================
    // 2. API KEYS & ENDPOINTS (คีย์เชื่อมต่อ)
    // =================================================================

    // [Slip Verification]
    // ตัวอย่างใช้ของ EasySlip (https://easyslip.com/) หรือ SlipOK
    // ตั้งค่าผ่าน VITE_SLIP_API_URL และ VITE_SLIP_API_KEY
    SLIP_API_URL: getEnv('VITE_SLIP_API_URL', 'https://developer.easyslip.com/api/v1/verify'), 
    SLIP_API_KEY: getEnv('VITE_SLIP_API_KEY', ''), 

    // [LINE Notify]
    // ไปขอ Token ที่ https://notify-bot.line.me/my/
    // ตั้งค่าผ่าน VITE_LINE_NOTIFY_TOKEN
    LINE_NOTIFY_API_URL: 'https://notify-api.line.me/api/notify', 
    LINE_NOTIFY_TOKEN: getEnv('VITE_LINE_NOTIFY_TOKEN', ''), 

    // [CORS PROXY] 
    // ใช้สำหรับ Production ที่ไม่มี Backend ของตัวเอง (อาจไม่เสถียรสำหรับเว็บจริง แนะนำให้ตั้ง Proxy เองหากทำได้)
    // ตั้งค่าผ่าน VITE_CORS_PROXY_URL
    CORS_PROXY_URL: getEnv('VITE_CORS_PROXY_URL', 'https://cors-anywhere.herokuapp.com/'),
};
