
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, MessageSquare } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ScriptSettings = () => {
    const { scriptTemplate, saveScriptTemplate } = useAppContext();
    const [localTemplate, setLocalTemplate] = useState('');

    useEffect(() => {
        setLocalTemplate(scriptTemplate);
    }, [scriptTemplate]);

    const handleSave = () => {
        saveScriptTemplate(localTemplate);
        alert('บันทึกรูปแบบข้อความเรียบร้อยแล้ว');
    };

    const handleReset = () => {
        const DEFAULT = `📢 เปิดจองวงใหม่จ้า
ชื่อวง {name}
เงินต้น {principal}
รูปแบบ {biddingType}
ส่ง {period}
บิทขั้นต่ำ {minBid}
บิทเพิ่มทีละ {bidStep}

รายชื่อสมาชิก
{members}

สนใจทักแชทได้เลยจ้า 💸`;
        setLocalTemplate(DEFAULT);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-black">ตั้งค่าข้อความ (Script Settings)</h2>
                <p className="text-black">กำหนดรูปแบบข้อความอัตโนมัติสำหรับแจ้งเตือนหรือสร้างวงแชร์</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-sm font-bold text-black mb-2 flex items-center gap-2">
                             <MessageSquare size={18} /> รูปแบบข้อความตั้งต้น
                        </label>
                        <textarea
                            className="w-full h-96 p-4 border border-slate-200 rounded-xl font-mono text-sm leading-relaxed bg-slate-50 text-black focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            value={localTemplate}
                            onChange={(e) => setLocalTemplate(e.target.value)}
                        />
                        <div className="mt-4 flex gap-3">
                            <button 
                                onClick={handleReset}
                                className="px-4 py-2 text-black font-bold text-sm hover:bg-slate-100 rounded-lg flex items-center gap-2 border border-slate-200"
                            >
                                <RefreshCw size={16} /> คืนค่าเดิม
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> บันทึกการตั้งค่า
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="font-bold text-black mb-3">ตัวแปรที่ใช้ได้ (Variables)</h3>
                        <p className="text-sm text-black mb-4">
                            คุณสามารถใช้คำสั่งด้านล่างแทรกลงในข้อความ ระบบจะแทนที่ด้วยข้อมูลจริงอัตโนมัติ
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{name}`}</code>
                                <span className="text-xs text-black">ชื่อวงแชร์</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{principal}`}</code>
                                <span className="text-xs text-black">ยอดเงินต้น</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{period}`}</code>
                                <span className="text-xs text-black">ระยะเวลา (รายวัน/เดือน)</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{biddingType}`}</code>
                                <span className="text-xs text-black">รูปแบบ (ประมูล/ขั้นบันได)</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{minBid}`}</code>
                                <span className="text-xs text-black">บิทขั้นต่ำ</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{bidStep}`}</code>
                                <span className="text-xs text-black">บิทเพิ่มทีละ</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100">
                                <code className="bg-slate-100 px-2 py-1 rounded text-red-500 font-bold font-mono text-xs">{`{members}`}</code>
                                <span className="text-xs text-black">รายการสมาชิก (1. ... 2. ...)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScriptSettings;
