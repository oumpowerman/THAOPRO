
import { ShareCircle, CircleMember, BiddingType } from '../../types';
import { CalculationInput, CalculationResult } from './types';
import { AuctionCalculator } from './auction';
import { LadderCalculator } from './ladder';

export const calculateSharePayment = (
    circle: ShareCircle,
    member: CircleMember,
    roundNumber: number,
    winnerId?: string,
    bidAmount: number = 0,
    isRoundOpen: boolean = false
): CalculationResult => {
    
    const input: CalculationInput = {
        circle,
        member,
        roundNumber,
        winnerId,
        bidAmount,
        isRoundOpen
    };

    // Factory Logic: เลือก Strategy ตามประเภทการประมูล
    if (circle.biddingType === BiddingType.FIXED) {
        return LadderCalculator.calculate(input);
    } else {
        // Default to Auction for AUCTION and others
        return AuctionCalculator.calculate(input);
    }
};
