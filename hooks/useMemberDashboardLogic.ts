
import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { CircleStatus, ShareType, BiddingType } from '../types';
import { calculateSharePayment } from '../lib/share-engine';

export const useMemberDashboardLogic = () => {
    const { user, circles, transactions, auctionSession, members, submitPayment, submitClosingBalance } = useAppContext();

    // 1. All Circles User Participated In (Active + Completed)
    // Used for calculating Debts/History
    const allParticipatedCircles = useMemo(() => circles.filter(c => 
        c.members.some(m => m.memberId === user?.memberId) &&
        c.status !== CircleStatus.INITIALIZING 
    ), [circles, user?.memberId]);

    // 2. Active Circles Only (For Display List)
    // Filter out COMPLETED circles so they don't clutter the dashboard
    const myActiveCircles = useMemo(() => allParticipatedCircles.filter(c => 
        c.status !== CircleStatus.COMPLETED
    ), [allParticipatedCircles]);

    const myActiveAuction = useMemo(() => {
        return auctionSession && myActiveCircles.find(c => c.id === auctionSession.circleId);
    }, [auctionSession, myActiveCircles]);

    // Total Principal Calculation (Global - Based on ACTIVE circles only to show current exposure)
    const totalPrincipal = useMemo(() => myActiveCircles.reduce((sum, c) => {
        const myHands = c.members.filter(m => m.memberId === user?.memberId);
        const circleSum = myHands.reduce((handSum, hand) => {
            if (hand.pidTonAmount && hand.pidTonAmount > 0) {
                return handSum + hand.pidTonAmount;
            }
            return handSum + c.principal;
        }, 0);
        return sum + circleSum;
    }, 0), [myActiveCircles, user?.memberId]);

    const totalPoints = Math.floor(totalPrincipal / 1000);
    const activeCount = myActiveCircles.length;

    // Upcoming Payments Calculation 
    // CRITICAL: We scan 'allParticipatedCircles' (including COMPLETED) to ensure legacy debts are shown
    const upcomingPayments = useMemo(() => {
        return allParticipatedCircles.flatMap(c => {
            const myHands = c.members.filter(m => m.memberId === user?.memberId);
            if (myHands.length === 0) return [];

            // Iterate through ALL rounds available in the circle to find unpaid ones
            const unpaidRounds = c.rounds.map(r => {
                const targetRoundNum = r.roundNumber;
                const isFixed = c.biddingType === BiddingType.FIXED;
                
                // --- VISIBILITY LOGIC ---
                // Auction: Only show when status is 'COLLECTING' (Winner decided)
                // Fixed (Ladder): Show when 'OPEN' or 'COLLECTING' (Schedule is pre-determined)
                if (!isFixed && r.status !== 'COLLECTING') return null;
                if (isFixed && r.status === 'COMPLETED') return null; // Don't pay for completed rounds
                
                // For Fixed, if it's OPEN, we treat it as ready to pay.
                // For Auction, we strict filter to COLLECTING.

                let roundBidAmount = r.bidAmount || 0;
                let roundWinnerId = r.winnerId;

                // --- FIXED/LADDER DATA OVERRIDE ---
                if (isFixed) {
                    // In Fixed mode, the "Winner" is the owner of the slot matching the round number
                    const currentSlotOwner = c.members.find(m => m.slotNumber === targetRoundNum);
                    if (currentSlotOwner) {
                        // Winner is predetermined by slot
                        roundWinnerId = currentSlotOwner.memberId;
                        // Interest is predetermined by the member's bidAmount setting (Fixed Rate)
                        roundBidAmount = currentSlotOwner.bidAmount || 0;
                    }
                }

                // Check Transactions for THIS specific round
                const allMyTxForRound = transactions.filter(t => 
                    t.circleId === c.id && t.memberId === user?.memberId && t.roundNumber === targetRoundNum
                );
                
                const amountPaidOrPending = allMyTxForRound
                    .filter(t => t.status === 'PAID' || t.status === 'WAITING_APPROVAL')
                    .reduce((sum, t) => sum + t.amountPaid, 0);

                const myTx = allMyTxForRound.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];

                let totalAmountToPay = 0;
                let isDead = false;

                // Calculate Expected Amount
                myHands.forEach(hand => {
                    const calculation = calculateSharePayment(
                        c,
                        hand,
                        targetRoundNum,
                        roundWinnerId,
                        roundBidAmount,
                        false // isRoundOpen = false (Forces calculation of final amount even if round is OPEN in Fixed mode)
                    );

                    totalAmountToPay += calculation.payAmount;
                    if (calculation.status === 'DEAD') isDead = true;
                });

                // If nothing to pay for this round (e.g. You are the winner, or Thao), skip
                if (totalAmountToPay <= 0) return null;

                // If already fully paid, skip
                if (amountPaidOrPending >= totalAmountToPay - 1) return null;

                // Determine remaining to pay
                const remainingToPay = Math.max(0, totalAmountToPay - amountPaidOrPending);

                // --- STRICT FINE & LATE LOGIC ---
                // Must match Admin logic: Check against Payment Window End
                const currentMaxRound = Math.max(...c.rounds.map(rd => rd.roundNumber));
                
                let daysLate = 0;
                let estimatedFine = 0;

                const now = new Date();
                const dueDate = new Date(c.nextDueDate);
                const [endH, endM] = (c.paymentWindowEnd || '23:59').split(':').map(Number);
                
                const deadline = new Date(dueDate);
                deadline.setHours(endH, endM, 0, 0);

                // If circle is COMPLETED, or this is an old round -> It's definitely overdue
                const isOldRound = c.status === CircleStatus.COMPLETED || targetRoundNum < currentMaxRound;

                if (isOldRound) {
                    // Rough estimate for old rounds: at least 1 day late
                    daysLate = 1; 
                } else if (now.getTime() > deadline.getTime()) {
                    // Precise calculation for current round
                    const diff = Math.abs(now.getTime() - deadline.getTime());
                    daysLate = Math.ceil(diff / (1000 * 60 * 60 * 24));
                }

                if (daysLate > 0 && c.fineRate) {
                    estimatedFine = daysLate * c.fineRate;
                }

                const isOverdue = daysLate > 0;

                return {
                    id: `${c.id}-r${targetRoundNum}`, // Unique ID for key
                    circleId: c.id,
                    circleName: c.name,
                    dueDate: c.nextDueDate, 
                    targetRound: targetRoundNum,
                    amount: remainingToPay,
                    type: c.type,
                    status: isDead ? 'DEAD' : 'ALIVE',
                    txStatus: myTx ? myTx.status : 'PENDING',
                    rejectReason: myTx?.rejectReason, // Pass reason to UI
                    isRoundOpen: r.status === 'OPEN' && !isFixed, // Flag strictly for UI status (Fixed is never treated as "Waiting for bid")
                    handCount: myHands.length,
                    paymentWindowStart: c.paymentWindowStart,
                    paymentWindowEnd: c.paymentWindowEnd,
                    isOverdue: isOverdue,
                    isCircleCompleted: c.status === CircleStatus.COMPLETED,
                    daysLate,       // New
                    estimatedFine,  // New
                    fineRate: c.fineRate // New
                };
            }).filter(Boolean); // Remove nulls

            return unpaidRounds as any[];
        })
        .sort((a, b) => {
            // Sort by Overdue first, then by Round Number
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return a.targetRound - b.targetRound;
        });
    }, [allParticipatedCircles, user?.memberId, transactions]);

    const currentUserAvatar = user?.avatarUrl || members.find(m => m.id === user?.memberId)?.avatarUrl;
    const creditScore = members.find(m => m.id === user?.memberId)?.creditScore || 100;

    return {
        user,
        myCircles: myActiveCircles, 
        myActiveAuction,
        totalPrincipal,
        totalPoints,
        activeCount,
        upcomingPayments, 
        currentUserAvatar,
        creditScore,
        auctionSession,
        submitPayment,
        submitClosingBalance
    };
};
