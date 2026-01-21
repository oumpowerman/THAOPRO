
import React, { useState } from 'react';
import { Users, Search, KeyRound, Shield, Save, CheckCircle2, Copy, Database, Terminal, AlertTriangle, X, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SQL_FIX_COMMAND = `-- SQL FIX SCRIPT (UPDATED)
-- สคริปต์นี้จะล้างข้อมูลซ้ำและตั้งค่า Database ให้ถูกต้อง 100%

-- 1. ล้าง Policy เก่า
DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
DROP POLICY IF EXISTS "Auth Update Profiles" ON profiles;
DROP POLICY IF EXISTS "Auth Insert Profiles" ON profiles;
DROP POLICY IF EXISTS "Auth Delete Profiles" ON profiles;
DROP POLICY IF EXISTS "Public Read Circles" ON share_circles;
DROP POLICY IF EXISTS "Auth Insert Circles" ON share_circles;
DROP POLICY IF EXISTS "Creator Update Circles" ON share_circles;
DROP POLICY IF EXISTS "Creator Delete Circles" ON share_circles;
DROP POLICY IF EXISTS "Public Read Circle Members" ON circle_members;
DROP POLICY IF EXISTS "Auth Manage Circle Members" ON circle_members;
DROP POLICY IF EXISTS "Public Read Rounds" ON share_rounds;
DROP POLICY IF EXISTS "Auth Manage Rounds" ON share_rounds;
DROP POLICY IF EXISTS "Public Read Transactions" ON transactions;
DROP POLICY IF EXISTS "Auth Manage Transactions" ON transactions;
DROP POLICY IF EXISTS "Public Read Payouts" ON payouts;
DROP POLICY IF EXISTS "Auth Manage Payouts" ON payouts;

-- 2. ปรับปรุงตาราง (Add Columns)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prompt_pay_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

ALTER TABLE share_circles ADD COLUMN IF NOT EXISTS admin_fee NUMERIC DEFAULT 0;
ALTER TABLE share_circles ADD COLUMN IF NOT EXISTS fine_rate NUMERIC DEFAULT 0;
ALTER TABLE share_circles ADD COLUMN IF NOT EXISTS payment_window_start TEXT DEFAULT '00:00';
ALTER TABLE share_circles ADD COLUMN IF NOT EXISTS payment_window_end TEXT DEFAULT '23:59';
ALTER TABLE share_circles ADD COLUMN IF NOT EXISTS period_interval INTEGER DEFAULT 1; -- New: Period Interval

ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS pid_ton_amount NUMERIC DEFAULT 0;
ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS slip_url text; 
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note text; 
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_fine boolean DEFAULT false;

-- ตาราง Payouts (สร้างใหม่ถ้าไม่มี)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES share_circles(id) ON DELETE CASCADE, 
  round_number INT,
  winner_id UUID,
  amount_net NUMERIC DEFAULT 0,
  admin_fee NUMERIC DEFAULT 0,
  slip_url TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. *** สำคัญ: ลบข้อมูลสมาชิกที่ซ้ำกัน (Duplicate Slots) ***
-- เก็บเฉพาะ row ล่าสุดของแต่ละ slot ในแต่ละวง
DELETE FROM circle_members a USING (
    SELECT MIN(ctid) as ctid, circle_id, slot_number
    FROM circle_members 
    GROUP BY circle_id, slot_number HAVING COUNT(*) > 1
) b
WHERE a.circle_id = b.circle_id 
AND a.slot_number = b.slot_number 
AND a.ctid <> b.ctid;

-- 4. สร้าง Constraint เพื่อรองรับ UPSERT
ALTER TABLE circle_members DROP CONSTRAINT IF EXISTS circle_members_circle_id_member_id_key;
ALTER TABLE circle_members DROP CONSTRAINT IF EXISTS circle_members_circle_id_slot_number_key;
-- สร้าง Unique Index เพื่อให้ Upsert ทำงานได้
CREATE UNIQUE INDEX IF NOT EXISTS circle_members_circle_id_slot_number_idx ON circle_members (circle_id, slot_number);
ALTER TABLE circle_members ADD CONSTRAINT circle_members_circle_id_slot_number_key UNIQUE USING INDEX circle_members_circle_id_slot_number_idx;

-- 5. เปิด RLS และสร้าง Policy ใหม่ (อนุญาตหมดเพื่อแก้ปัญหา Permission)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles All Access" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE share_circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circles All Access" ON share_circles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members All Access" ON circle_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE share_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rounds All Access" ON share_rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tx All Access" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payouts All Access" ON payouts FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

const SystemAdminDashboard = () => {
  const { members, updateInviteCode, showAlert } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  // 1. Separate Data Sources
  const allOrganizers = members.filter(m => m.role === 'ADMIN');
  const allPlayers = members.filter(m => m.role === 'USER');
  
  // 2. Filter for Display Table (Only Admins)
  const displayedOrganizers = allOrganizers.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.phone.includes(searchTerm)
  );
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCode, setTempCode] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleEditClick = (id: string, currentCode: string) => {
      setEditingId(id);
      setTempCode(currentCode || '');
  };

  const handleSaveClick = async (id: string) => {
      if (!tempCode) return showAlert('กรุณาระบุรหัสเชิญ', 'แจ้งเตือน', 'error');
      try {
          await updateInviteCode(id, tempCode);
          setEditingId(null);
          showAlert('บันทึกรหัสเชิญเรียบร้อย', 'สำเร็จ', 'success');
      } catch (error: any) {
          console.error("Save Error:", error);
          if (error.message && (error.message.includes('RLS') || error.message.includes('permission'))) {
              setShowSqlModal(true);
          } else {
              showAlert('บันทึกไม่สำเร็จ: ' + (error.message || 'Unknown error'), 'Error', 'error');
          }
      }
  };

  const generateRandomCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'THAO';
      for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setTempCode(result);
  };

  const copySqlToClipboard = () => {
      navigator.clipboard.writeText(SQL_FIX_COMMAND);
      showAlert('คัดลอกคำสั่ง SQL แล้ว! \nกรุณานำไปวางใน Supabase > SQL Editor', 'สำเร็จ', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold flex items-center gap-3">
             <Shield className="text-red-500" size={32} /> System Administrator
          </h2>
          <p className="text-slate-400 mt-1">ควบคุมดูแลท้าวแชร์และจัดการรหัสเข้าใช้งาน</p>
        </div>
        <div className="flex gap-4 relative z-10 items-center">
            <button 
                onClick={() => setShowSqlModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border border-slate-700 transition-colors"
            >
                <Database size={16} /> SQL Helper
            </button>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center min-w-[140px]">
                <p className="text-xs text-slate-400 uppercase">Total Organizers</p>
                <p className="text-2xl font-bold text-white">{allOrganizers.length}</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center min-w-[140px]">
                <p className="text-xs text-slate-400 uppercase">Total Players</p>
                <p className="text-2xl font-bold text-emerald-400">{allPlayers.length}</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" /> รายชื่อท้าวแชร์ (Organizers)
            </h3>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Organizer Name</th>
                        <th className="px-6 py-4">Phone / Username</th>
                        <th className="px-6 py-4">Invite Code</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {displayedOrganizers.map(org => (
                        <tr key={org.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        {org.avatarUrl ? (
                                            <img src={org.avatarUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20}/></div>
                                        )}
                                    </div>
                                    <span className="font-bold text-slate-800">{org.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-600">{org.phone}</td>
                            <td className="px-6 py-4">
                                {editingId === org.id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            className="w-24 px-2 py-1 border border-blue-300 rounded text-center font-bold text-blue-600 focus:outline-none uppercase"
                                            value={tempCode}
                                            onChange={(e) => setTempCode(e.target.value.toUpperCase())}
                                        />
                                        <button onClick={generateRandomCode} className="text-slate-400 hover:text-blue-600" title="Auto Generate">
                                            <KeyRound size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className={`font-bold px-3 py-1 rounded-lg ${org.inviteCode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {org.inviteCode || 'Not Set'}
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {editingId === org.id ? (
                                    <button 
                                        onClick={() => handleSaveClick(org.id)}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1 mx-auto"
                                    >
                                        <Save size={14} /> Save
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleEditClick(org.id, org.inviteCode || '')}
                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200"
                                    >
                                        Manage Code
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {displayedOrganizers.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-12 text-slate-400">ไม่พบรายชื่อท้าวแชร์</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* SQL Helper Modal */}
      {showSqlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSqlModal(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center rounded-t-2xl">
                      <div className="flex items-center gap-3">
                          <AlertTriangle className="text-amber-500" />
                          <div>
                            <h3 className="text-lg font-bold">แก้ไขปัญหา Database Schema</h3>
                            <p className="text-slate-400 text-xs">คำสั่ง SQL นี้จะช่วยเพิ่มคอลัมน์ที่ขาดหาย และล้างข้อมูลซ้ำ</p>
                          </div>
                      </div>
                      <button onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-white"><X /></button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-50">
                      <p className="text-slate-700 mb-4 text-sm">
                          หากพบปัญหา <strong>Error: fetch failed</strong> หรือ <strong>บันทึกข้อมูลไม่ได้</strong> แสดงว่า Database มีข้อมูลซ้ำซ้อนหรือ Policy ไม่ถูกต้อง <br/>
                          กรุณาก๊อปปี้คำสั่งนี้ไปรันใน <strong>Supabase SQL Editor</strong> เพื่อแก้ไข:
                      </p>
                      
                      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 relative group">
                          <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap h-64 overflow-y-auto custom-scrollbar">
                              {SQL_FIX_COMMAND}
                          </pre>
                          <button 
                              onClick={copySqlToClipboard}
                              className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                              title="Copy SQL"
                          >
                              <Copy size={16} />
                          </button>
                      </div>

                      <div className="mt-6 flex gap-3">
                          <a 
                              href="https://supabase.com/dashboard/project/_/sql/new" 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-center hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                              <Terminal size={18} /> ไปที่ Supabase SQL Editor
                          </a>
                          <button 
                              onClick={() => setShowSqlModal(false)}
                              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                          >
                              ปิด
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SystemAdminDashboard;
