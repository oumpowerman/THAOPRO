
import React, { useState, useEffect } from 'react';
import { Transaction } from '../../../types';

interface ManualPayModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any; // The member data object from CollectionTable
    roundNumber: number;
    onConfirm: (amount: number, note: string, isFine: boolean) => void;
}

export const ManualPayModal: React.FC<ManualPayModalProps> = ({ isOpen, onClose, data, roundNumber, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isFine, setIsFine] = useState(false);

    useEffect(() => {
        if (isOpen && data) {
            // Set default amount
            if (data.balanceRemaining > 0) {
                setAmount(data.balanceRemaining.toString());
            } else {
                setAmount('');
            }
            setNote('');
            setIsFine(false);
        }
    }, [isOpen, data]);

    const handleSubmit = () => {
        if (!amount) return;
        onConfirm(Number(amount), note, isFine);
    };

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-800">บันทึกการชำระเงิน (Manual)</h3>
                <div className="mb-4 text-sm text-slate-600">
                    <p>สมาชิก: <span className="font-bold">{data.name}</span></p>
                    <p className="text-xs text-slate-400">งวดที่ {roundNumber}</p>
                    {data.showAmount ? (
                        <>
                        <p>ยอดค้าง: <span className="text-red-500 font-bold">฿{data.balanceRemaining.toLocaleString()}</span></p>
                        {data.fineAmount > 0 && <p>ค่าปรับ: ฿{data.fineAmount}</p>}
                        </>
                    ) : (
                        <p className="text-amber-500 font-bold">สถานะ: รอสรุปยอดประมูล</p>
                    )}
                </div>
                
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-bold mb-1">ยอดเงินที่ได้รับ</label>
                        <input 
                            type="number" 
                            className="w-full border rounded-lg p-2" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">หมายเหตุ</label>
                        <input 
                            type="text" 
                            className="w-full border rounded-lg p-2" 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="เช่น จ่ายสด, ตัดยอดฝาก"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={isFine}
                            onChange={(e) => setIsFine(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                        />
                        <label className="text-sm text-slate-600">นี่คือการจ่ายค่าปรับ</label>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-slate-600">ยกเลิก</button>
                    <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">บันทึก</button>
                </div>
            </div>
        </div>
    );
};
