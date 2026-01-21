
import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Member, MemberStatus, ShareCircle } from '../types';

export type ViewMode = 'GRID' | 'LIST' | 'KANBAN';
export type SortOption = 'NAME' | 'CREDIT_SCORE' | 'HANDS_COUNT';

export const useMemberProfile = () => {
    const { members, circles, transactions, addMember, updateMember, approveMember, rejectMember, user, showAlert } = useAppContext();

    // --- UI STATES ---
    const [viewMode, setViewMode] = useState<ViewMode>('GRID');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState<'ALL' | 'GOOD' | 'MEDIUM' | 'WATCHLIST'>('ALL');
    const [sortBy, setSortBy] = useState<SortOption>('NAME');

    // --- MODAL STATES ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [viewingSlip, setViewingSlip] = useState<{url: string, title: string, amount?: number, date?: string} | null>(null);

    // --- DATA FILTERING & SORTING ---
    // 1. Separate Pending (Inbox) from Active (Database)
    const pendingMembers = members.filter(m => m.status === MemberStatus.PENDING && m.id !== user?.id);

    // 2. Filter Active Members
    const filteredMembers = useMemo(() => {
        let data = members.filter(m => m.status !== MemberStatus.PENDING && m.id !== user?.id && m.role !== 'ADMIN');

        // Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(m => m.name.toLowerCase().includes(lowerTerm) || m.phone.includes(lowerTerm));
        }

        // Filter Risk
        if (filterRisk !== 'ALL') {
            data = data.filter(m => m.riskScore === filterRisk);
        }

        // Sort
        return data.sort((a, b) => {
            if (sortBy === 'NAME') return a.name.localeCompare(b.name);
            if (sortBy === 'CREDIT_SCORE') return (b.creditScore || 0) - (a.creditScore || 0);
            return 0;
        });
    }, [members, searchTerm, filterRisk, sortBy, user?.id]);

    // Calculate Total Active for Stats
    const totalActiveMembers = members.filter(m => m.status === MemberStatus.ACTIVE && m.role !== 'ADMIN').length;

    // --- HELPER FUNCTIONS ---
    const getMemberCircles = (memberId: string) => circles.filter(c => c.members.some(m => m.memberId === memberId));

    const getMemberStats = (memberId: string) => {
        const activeCircles = getMemberCircles(memberId);
        let totalPrincipal = 0;
        let wonCount = 0;
        let totalHands = 0;
        let totalBidsPaid = 0;

        activeCircles.forEach(c => {
            const mInfo = c.members.find(m => m.memberId === memberId);
            if (mInfo) {
                totalPrincipal += c.principal;
                totalHands++;
                if (mInfo.status === 'DEAD') {
                    wonCount++;
                    totalBidsPaid += (mInfo.bidAmount || 0);
                }
            }
        });
        return { totalPrincipal, wonCount, totalHands, totalBidsPaid };
    };

    const getWinningHistory = (memberId: string) => {
        const wins: any[] = [];
        circles.forEach(c => {
            c.rounds.forEach(r => {
                if (r.winnerId === memberId) {
                    wins.push({
                        circleName: c.name,
                        circleType: c.type,
                        roundNumber: r.roundNumber,
                        date: r.date,
                        bidAmount: r.bidAmount,
                        totalPot: r.totalPot
                    });
                }
            });
        });
        return wins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getRiskStatusBadge = (score: string) => {
        switch(score) {
            case 'GOOD': return { label: 'สถานะดี', color: 'bg-emerald-500', text: 'text-emerald-500', bgLight: 'bg-emerald-100', border: 'border-emerald-200' };
            case 'MEDIUM': return { label: 'ปานกลาง', color: 'bg-amber-500', text: 'text-amber-500', bgLight: 'bg-amber-100', border: 'border-amber-200' };
            case 'WATCHLIST': return { label: 'เฝ้าระวัง', color: 'bg-red-500', text: 'text-red-500', bgLight: 'bg-red-100', border: 'border-red-200' };
            default: return { label: 'Unknown', color: 'bg-slate-500', text: 'text-slate-500', bgLight: 'bg-slate-100', border: 'border-slate-200' };
        }
    };

    // --- ACTIONS ---
    const handleApprove = async (id: string) => {
        if (confirm('ยืนยันอนุมัติสมาชิกรายนี้?')) {
            await approveMember(id);
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('ต้องการปฏิเสธคำขอสมัครสมาชิกนี้?')) {
            await rejectMember(id);
        }
    };

    const handleDeleteMember = async (member: Member) => {
        if (confirm(`⚠️ คำเตือน: การลบสมาชิก "${member.name}"\nยืนยันที่จะลบหรือไม่?`)) {
            await rejectMember(member.id);
            setSelectedMember(null);
        }
    };

    return {
        // State
        viewMode, setViewMode,
        searchTerm, setSearchTerm,
        filterRisk, setFilterRisk,
        sortBy, setSortBy,
        isCreateModalOpen, setIsCreateModalOpen,
        selectedMember, setSelectedMember,
        viewingSlip, setViewingSlip,
        
        // Data
        pendingMembers,
        filteredMembers,
        totalActiveMembers,
        circles,
        transactions,
        user,

        // Actions
        addMember,
        updateMember,
        handleApprove,
        handleReject,
        handleDeleteMember,
        showAlert,

        // Helpers
        getMemberStats,
        getWinningHistory,
        getMemberCircles,
        getRiskStatusBadge
    };
};
