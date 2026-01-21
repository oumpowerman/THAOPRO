
import { ShareType, SharePeriod, BiddingType } from '../types';

export interface ParsedMember {
    name: string;
    amount?: number; // Interest for Ladder / Fixed
}

export interface ParsedShareData {
  name: string;
  totalPot: number | '';
  targetSlots: number;
  type: ShareType;
  biddingType: BiddingType;
  period: SharePeriod;
  periodInterval: number;
  minBid: number | '';
  bidStep: number | '';
  adminFee: number | '';
  fineRate: number | '';
  startDate: string; // YYYY-MM-DD
  members: ParsedMember[]; // New: List of members found in text
}

// Helper to convert "10k", "1.5หมื่น", "1แสน" to numbers
const parseThaiMoney = (text: string): number => {
    if (!text) return 0;
    const clean = text.replace(/,/g, '').trim();
    if (!clean) return 0;

    let multiplier = 1;
    if (clean.match(/k/i)) multiplier = 1000;
    if (clean.includes('พัน')) multiplier = 1000;
    if (clean.includes('หมื่น')) multiplier = 10000;
    if (clean.includes('แสน')) multiplier = 100000;
    if (clean.includes('ล้าน')) multiplier = 1000000;

    const numPart = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(numPart) ? 0 : numPart * multiplier;
};

// Helper to find date from "เริ่ม 15/10" or "เริ่ม 15 ตค"
const parseThaiDate = (text: string): string => {
    const now = new Date();
    // Regex for DD/MM or DD-MM
    const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // JS month 0-11
        const year = now.getFullYear();
        // If month is passed, assume next year
        const d = new Date(year, month, day);
        if (d < now && now.getMonth() > month) d.setFullYear(year + 1);
        return d.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0]; // Default to today
};

export const parseShareScript = (text: string): ParsedShareData => {
    const raw = text.toLowerCase();
    
    const result: ParsedShareData = {
        name: '',
        totalPot: '',
        targetSlots: 0,
        type: ShareType.DOK_TAM, // Default
        biddingType: BiddingType.AUCTION, // Default
        period: SharePeriod.MONTHLY, // Default
        periodInterval: 1,
        minBid: '',
        bidStep: '',
        adminFee: '',
        fineRate: '',
        startDate: new Date().toISOString().split('T')[0],
        members: []
    };

    // 1. NAME (ชื่อวง)
    // Strategies: Quote content, or words after "วง", "บ้าน"
    const nameMatch = text.match(/(?:เปิด|วง|บ้าน)(?:น้อง)?\s*['"]?([^'"\n\r]+)['"]?/i);
    if (nameMatch) {
        let nameRaw = nameMatch[1].trim();
        const cutoff = nameRaw.search(/(?:ต้น|ยอด|รับ|มือ|ส่ง|เริ่ม)/);
        if (cutoff > -1) nameRaw = nameRaw.substring(0, cutoff);
        result.name = nameRaw.replace(/[:\-]/g, '').trim();
    }

    // 2. MONEY (เงินต้น/ยอดวง)
    const moneyMatch = text.match(/(?:ต้น|ยอด|วง|รับ|รับยอด)\s*([\d.,kKหมื่นแสนล้าน]+)/);
    if (moneyMatch) {
        result.totalPot = parseThaiMoney(moneyMatch[1]);
    }

    // 3. SLOTS (จำนวนมือ)
    const slotMatch = text.match(/(\d+)\s*(?:มือ|คน|ที่|ขา)/);
    if (slotMatch) {
        result.targetSlots = parseInt(slotMatch[1]);
    }

    // 4. TYPE DETECTION (ดอกหัก/ตาม, ประมูล/ขั้นบันได)
    if (raw.includes('ดอกหัก') || raw.includes('หักออก') || raw.includes('รับช้า')) {
        result.type = ShareType.DOK_HAK;
    } else {
        result.type = ShareType.DOK_TAM;
    }

    // Enhanced Bidding Type Detection
    const ladderKeywords = ['บันได', 'ขั้นบันได', 'เรท', 'ดอกตายตัว', 'fix', 'ฟิก', 'ล็อคดอก'];
    const isLadderKeyword = ladderKeywords.some(kw => raw.includes(kw));
    
    if (isLadderKeyword) {
        result.biddingType = BiddingType.FIXED;
    } else {
        // Fallback: Check later if members have amounts attached, might flip to FIXED
        result.biddingType = BiddingType.AUCTION;
    }

    // 5. PERIOD (ระยะเวลา)
    if (raw.includes('รายวัน') || raw.includes('วัน')) {
        result.period = SharePeriod.DAILY;
        const intervalMatch = text.match(/(?:ทุก|ส่ง|เว้น)\s*(\d+)\s*วัน/);
        if (intervalMatch) {
            result.periodInterval = parseInt(intervalMatch[1]);
        }
    } else if (raw.includes('อาทิตย์') || raw.includes('สัปดาห์') || raw.includes('วีค') || raw.includes('week')) {
        result.period = SharePeriod.WEEKLY;
    } else {
        result.period = SharePeriod.MONTHLY; 
    }

    // 6. BIDS (ขั้นต่ำ/Step)
    const minBidMatch = text.match(/(?:บิท|บิด|ขั้นต่ำ|สตาร์ท)\s*([\d.,]+)/);
    if (minBidMatch) {
        result.minBid = parseThaiMoney(minBidMatch[1]);
    }

    const stepMatch = text.match(/(?:เพิ่ม|สเต็ป|step|ขยับ)\s*([\d.,]+)/);
    if (stepMatch) {
        result.bidStep = parseThaiMoney(stepMatch[1]);
    }

    // 7. FEES & START
    const feeMatch = text.match(/(?:ดูแล|น้ำ|ค่าโต๊ะ)\s*([\d.,]+)/);
    if (feeMatch) {
        result.adminFee = parseThaiMoney(feeMatch[1]);
    }

    const startMatch = text.match(/(?:เริ่ม|เดิน|run)\s*([^\s]+)/);
    if (startMatch) {
        result.startDate = parseThaiDate(startMatch[1]);
    }

    // 8. MEMBER LIST PARSING (New Feature)
    // Look for a block of text that looks like a list: "1. Name [Amount]"
    const lines = text.split(/\r?\n/);
    const parsedMembers: ParsedMember[] = [];
    let foundListStart = false;
    let listCounter = 0;

    for (const line of lines) {
        const trimLine = line.trim();
        
        // Skip empty lines or obvious headers unless it contains a number
        if (!trimLine) continue;

        // Detection strategy: Look for "Number. Name [Amount]"
        // Regex: 
        // ^(\d+)[.\-)]?  -> Starts with number and separator (1. or 1- or 1)
        // \s*            -> Spaces
        // ([^\s\d]+)     -> Name (Non-space, Non-digit chars) - Simplified, might need tuning for spaces in names
        // (?:.*?)        -> Optional filler
        // (\d+[.,]?\d*)? -> Optional Amount at the end
        
        const listMatch = trimLine.match(/^(\d+)[.\-)]\s*([^\s]+)(?:\s+.*?(\d+[.,]?\d*))?/);
        
        if (listMatch) {
            foundListStart = true;
            const name = listMatch[2];
            const amountStr = listMatch[3]; // Optional amount
            
            // Clean amount string if exists
            let amount = 0;
            if (amountStr) {
                amount = parseThaiMoney(amountStr);
            }

            // Exclude "ท้าว" or empty names
            if (name && !name.includes('ท้าว') && !name.includes('ว่าง')) {
                parsedMembers.push({ name, amount: amount > 0 ? amount : undefined });
            }
            listCounter++;
        } else if (foundListStart && listCounter > 0) {
            // Stop parsing if we hit a non-list line after finding a list (heuristics)
            // But sometimes people put comments in between. Let's be lenient.
        }
    }

    result.members = parsedMembers;

    // AUTO-CORRECT: If we found members with explicit amounts, it's likely a Ladder (Fixed) circle
    if (parsedMembers.some(m => m.amount !== undefined) && result.biddingType === BiddingType.AUCTION) {
        result.biddingType = BiddingType.FIXED;
    }

    return result;
};
