
import { useMemo } from 'react';
import { ShareCircle, Transaction, Member, ShareType, BiddingType, CircleStatus } from '../types';
import { calculateSharePayment } from '../lib/share-engine';

interface UseCollectionLogicProps {
    circles: ShareCircle[];
    members: Member[];
    transactions: Transaction[];
    payouts: any[];
    user: any;
    selectedCircleId: string;
    selectedRoundNum: number;
}

export const useCollectionLogic = ({
    circles,
    members,
    transactions,
    payouts,
    user,
    selectedCircleId,
    selectedRoundNum
}: UseCollectionLogicProps) => {

    const activeCircle = circles.find(c => c.id === selectedCircleId);

    const paymentData = useMemo(() => {
        if (!activeCircle) return [];

        return activeCircle.members.map(m => {
            // Check if this member is ME
            const isMe = user && m.memberId === user.id;
            const member = members.find(mem => mem.id === m.memberId);
            
            const displayName = isMe ? `${user.name} (คุณ/ท้าวแชร์)` : (member?.name || 'Unknown');
            const displayAvatar = isMe ? user.avatarUrl : member?.avatarUrl;

            // TARGET ROUND DATA
            const targetRoundData = activeCircle.rounds.find(r => r.roundNumber === selectedRoundNum);
            const isRoundOpen = targetRoundData?.status === 'OPEN';
            const roundBidAmount = targetRoundData?.bidAmount || 0;
            const roundWinnerId = targetRoundData?.winnerId;

            // Get Transactions
            const userTxs = transactions.filter(t => 
                t.circleId === activeCircle.id && 
                t.memberId === m.memberId &&
                t.roundNumber === selectedRoundNum
            );

            const totalPaid = userTxs
                .filter(t => t.status === 'PAID')
                .reduce((sum, t) => sum + t.amountPaid, 0);
            
            const pendingAmount = userTxs
                .filter(t => t.status === 'WAITING_APPROVAL' || t.status === 'PENDING')
                .reduce((sum, t) => sum + t.amountPaid, 0);

            // --- USE SHARE ENGINE FOR CALCULATION ---
            const calculation = calculateSharePayment(
                activeCircle,
                m,
                selectedRoundNum,
                roundWinnerId,
                roundBidAmount,
                isRoundOpen
            );

            let expectedAmount = calculation.payAmount; // Use let to allow override for Pid Ton
            const note = calculation.note;
            const memberRoundStatus = calculation.status;

            // Determine Overall Display Status
            let displayStatus: any = 'PENDING';
            let isPayoutCompleted = false;
            
            // SPECIAL HANDLING FOR PID TON (Already Paid Upfront)
            let isPidTonPaid = false;

            if (memberRoundStatus === 'THAO') {
                displayStatus = 'PAID'; 
            } else if (memberRoundStatus === 'WINNER') {
                // Check Payout Status
                const payoutRecord = payouts.find(p => p.circleId === activeCircle.id && p.roundNumber === selectedRoundNum && p.winnerId === m.memberId);
                if (payoutRecord) {
                    isPayoutCompleted = true;
                    displayStatus = 'PAYOUT_COMPLETED';
                } else {
                    displayStatus = 'WAITING_PAYOUT';
                }
            } else if (memberRoundStatus === 'PID_TON_PAID') {
                // Logic: Show as PAID visually
                displayStatus = 'PAID';
                isPidTonPaid = true;
                // FIX: Set expected amount to Principal so totals (Sum Expected) in Modals match visual reality
                // Even though they paid 0 *this round*, conceptually they contribute Principal to the pot.
                expectedAmount = activeCircle.principal;
            } else if (totalPaid >= expectedAmount && expectedAmount > 0) {
                displayStatus = 'PAID';
            } else if (totalPaid > 0 && totalPaid < expectedAmount) {
                displayStatus = 'PARTIAL';
            } else if (pendingAmount > 0) {
                displayStatus = 'WAITING_APPROVAL';
            }

            const latestTx = userTxs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];
            
            // FIX: Always show amount for Admin Tracking
            const showAmount = true;

            // --- FINE & LATE CALCULATION (STRICT TIME) ---
            // Requirement: Check Payment Window End (e.g. 18:00)
            let daysLate = 0;
            let fineAmount = 0;
            
            // Conditions to check fine:
            // 1. Not Thao (Slot 1)
            // 2. Not Winner
            // 3. Not Pid Ton (Paid Upfront)
            // 4. Must be an active collection round (not future) or overdue round
            // 5. Payment not fully completed (or check against due date regardless of payment for display?)
            //    -> Typically fines stop accumulating when paid. Here we check "Current Status".
            
            if (m.slotNumber !== 1 && memberRoundStatus !== 'WINNER' && memberRoundStatus !== 'PID_TON_PAID' && displayStatus !== 'PAID') {
                const now = new Date();
                const dueDate = new Date(activeCircle.nextDueDate);
                
                // Parse paymentWindowEnd (e.g., "18:00") or default to end of day
                const [endHour, endMin] = (activeCircle.paymentWindowEnd || '23:59').split(':').map(Number);
                
                // Create a comparison Date: DueDate at the End of Window
                const deadline = new Date(dueDate);
                deadline.setHours(endHour, endMin, 0, 0);

                // Check if NOW is past the DEADLINE
                if (now.getTime() > deadline.getTime()) {
                    const diffTime = Math.abs(now.getTime() - deadline.getTime());
                    // Logic: 1 minute late = 1 day late (Start counting immediately)
                    // Math.ceil converts any fraction of a day to a full day
                    daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    const rate = activeCircle.fineRate || 0;
                    fineAmount = daysLate * rate;
                }
            }

            // VISUAL TWEAK FOR PID TON
            // If PidTonPaid, we want to show Principal in "Paid" column visually, but 'expected' is 0.
            const visualPaid = isPidTonPaid ? activeCircle.principal : totalPaid;
            const visualBalance = isPidTonPaid ? 0 : Math.max(0, expectedAmount - totalPaid);

            return {
                ...m,
                memberStatus: m.status, // Original persistent status
                roundStatus: memberRoundStatus, // Contextual status for this round
                name: displayName,
                avatar: displayAvatar,
                amountExpected: expectedAmount,
                amountPaid: visualPaid,
                balanceRemaining: visualBalance,
                showAmount,
                status: displayStatus,
                isPayoutCompleted, 
                isPidTonPaid, // New flag
                note,
                time: latestTx ? latestTx.timestamp : '-',
                slipUrl: latestTx?.slipUrl,
                latestTxObject: latestTx,
                daysLate,
                fineAmount,
                history: userTxs
            };
        });
    }, [activeCircle, members, selectedRoundNum, transactions, payouts, user]);

    return { activeCircle, paymentData };
};
