
// Utility to parse errors from Supabase or JavaScript and return a user-friendly Thai message.

export const formatErrorMessage = (error: any): string => {
    if (!error) return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ (Unknown Error)';

    // 1. Handle String errors
    if (typeof error === 'string') return error;

    // 2. Handle Supabase/Postgres Errors
    const message = error.message || error.error_description || '';
    const code = error.code || '';
    const details = error.details || '';

    // Database Constraint Violations
    if (code === '23505') { // Unique Violation
        if (message.includes('phone')) return 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนไว้แล้ว';
        if (message.includes('username')) return 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
        return 'ข้อมูลซ้ำในระบบ (Duplicate Data)';
    }

    if (code === '23503') { // Foreign Key Violation
        return 'ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลมีความเชื่อมโยงกับส่วนอื่น (Foreign Key Violation)';
    }

    if (code === '42501') { // RLS Policy Violation (Permission denied)
        return 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้ (Permission Denied)';
    }

    if (code === 'PGRST116') { // JSON object requested, multiple (or no) rows returned
        return 'ไม่พบข้อมูล หรือข้อมูลซ้ำซ้อน';
    }

    // Auth Errors
    if (message.includes('Invalid login credentials')) return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    if (message.includes('Email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าใช้งาน';
    if (message.includes('User already registered')) return 'ผู้ใช้นี้สมัครสมาชิกไปแล้ว';

    // Network/Fetch Errors
    if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
        return 'การเชื่อมต่อขัดข้อง กรุณาตรวจสอบอินเทอร์เน็ต';
    }

    // Default: Return the technical message if specific translation not found
    return `ระบบเกิดข้อผิดพลาด: ${message} (${code})`;
};
