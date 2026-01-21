

/* 
  PromptPay QR Payload Generator (EMVCo Standard)
  Implmented purely in JS to avoid external heavy dependencies.
*/

function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  let targetSanitized = target.replace(/[^0-9]/g, '');
  
  // Determine if Phone (08...) or ID Card (13 digits) or E-Wallet (15 digits)
  // Phone: 0812345678 -> 0066812345678
  if (targetSanitized.length === 10 && targetSanitized.startsWith('0')) {
     targetSanitized = '0066' + targetSanitized.substring(1);
  }

  const tag00 = '000201'; // Payload Format Indicator
  const tag01 = amount ? '010212' : '010211'; // Point of Initiation Method (11=Static, 12=Dynamic)
  
  // Merchant Account Information (29 for PromptPay)
  const aid = 'A000000677010111'; // PromptPay AID
  const subTag00 = '00' + aid.length.toString().padStart(2, '0') + aid;
  const subTag01 = '01' + targetSanitized.length.toString().padStart(2, '0') + targetSanitized;
  const tag29Body = subTag00 + subTag01;
  const tag29 = '29' + tag29Body.length.toString().padStart(2, '0') + tag29Body;

  const tag53 = '5303764'; // Currency Code (THB)
  const tag58 = '5802TH'; // Country Code

  let tag54 = '';
  if (amount) {
      const amtStr = amount.toFixed(2);
      tag54 = '54' + amtStr.length.toString().padStart(2, '0') + amtStr;
  }

  let data = tag00 + tag01 + tag29 + tag53 + tag54 + tag58 + '6304';
  const checksum = crc16(data);
  
  return data + checksum;
}