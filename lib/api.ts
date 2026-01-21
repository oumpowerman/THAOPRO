
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MOCK_MEMBERS, MOCK_CIRCLES } from '../constants';
import { Member, ShareCircle, User, Transaction, Payout, CircleMember, ShareRound, ShareType, BiddingType, CircleStatus, SharePeriod, TransactionStatus } from '../types';

// --- HELPER: Upload File ---
export const uploadFile = async (file: File, bucket: string, path: string) => {
    if (!isSupabaseConfigured) return URL.createObjectURL(file);
    try {
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) {
            console.error('Upload error details:', error);
            return null;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    } catch (e) {
        console.error('Upload exception:', e);
        return null;
    }
};

// --- HELPER: Fake Email Gen ---
export const getFakeEmail = (username: string) => {
    const cleanUser = username.trim().toLowerCase();
    return `${cleanUser}@thaopro.local`;
};

// --- HELPER: Clean Payload ---
const safeNum = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

// ==========================================
// AUTH SERVICE
// ==========================================
export const AuthService = {
    async login(username: string, password?: string) {
        if (!isSupabaseConfigured) {
            return { success: true, user: null }; // Mock
        }
        const email = getFakeEmail(username);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || '12345678',
        });
        return { data, error };
    },

    async register(email: string, password?: string) {
        if (!isSupabaseConfigured) return { data: { user: { id: 'mock-id' }, session: {} }, error: null };
        return await supabase.auth.signUp({
            email,
            password: password || '12345678',
        });
    },

    async getProfile(userId: string) {
        if (!isSupabaseConfigured) return null;
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        return data;
    },

    async updateProfile(userId: string, updates: any) {
        if (!isSupabaseConfigured) return null;
        return await supabase.from('profiles').update(updates).eq('id', userId);
    },
    
    async logout() {
        if (isSupabaseConfigured) await supabase.auth.signOut();
    },

    async deleteProfile(id: string) {
        if (!isSupabaseConfigured) return;
        return await supabase.from('profiles').delete().eq('id', id);
    },

    async checkInviteCode(code: string) {
        if (!isSupabaseConfigured) return true;
        const { data } = await supabase.from('profiles').select('id').eq('invite_code', code).limit(1);
        return !!data && data.length > 0;
    }
};

// ==========================================
// DATA FETCHING SERVICE
// ==========================================
export const DataService = {
    async fetchAll(currentUserRole: string, currentUserId: string, currentInviteCode: string) {
        if (!isSupabaseConfigured) {
            return { members: MOCK_MEMBERS, circles: MOCK_CIRCLES, transactions: [], payouts: [] };
        }

        // 1. Fetch Members
        let profilesQuery = supabase.from('profiles').select('*');
        if (currentUserRole === 'SYSTEM_ADMIN') {
            // No filter
        } else if (currentUserRole === 'ADMIN') {
            if (currentInviteCode) {
                profilesQuery = profilesQuery.or(`invite_code.eq.${currentInviteCode},id.eq.${currentUserId}`);
            } else {
                profilesQuery = profilesQuery.eq('id', currentUserId);
            }
        } else {
            if (currentInviteCode) {
                profilesQuery = profilesQuery.eq('invite_code', currentInviteCode);
            } else {
                profilesQuery = profilesQuery.eq('id', currentUserId);
            }
        }
        const { data: profiles } = await profilesQuery;

        // 2. Fetch Circles
        let circlesQuery = supabase.from('share_circles').select(`*, circle_members(*), share_rounds(*)`);
        const { data: circlesData } = await circlesQuery;

        // 3. Fetch Transactions
        const { data: txData } = await supabase.from('transactions').select('*');

        // 4. Fetch Payouts
        const { data: payoutData } = await supabase.from('payouts').select('*');

        // Map circle members back to include pid_ton_amount
        const mappedCirclesData = circlesData?.map((c: any) => ({
            ...c,
            // Map payment window fields
            paymentWindowStart: c.payment_window_start,
            paymentWindowEnd: c.payment_window_end,
            circle_members: c.circle_members.map((cm: any) => ({
                ...cm,
                pidTonAmount: cm.pid_ton_amount, // Map DB snake_case to TS camelCase
                fixedDueAmount: cm.fixed_due_amount, // NEW MAP: Critical for Fixed Mode
                note: cm.note 
            }))
        }));

        // Map profiles to add creditScore & qrCodeUrl
        const mappedProfiles = profiles?.map((p: any) => ({
            ...p,
            credit_score: p.credit_score,
            qrCodeUrl: p.qr_code_url
        }));

        return {
            profiles: mappedProfiles,
            circlesData: mappedCirclesData,
            txData,
            payoutData
        };
    }
};

// ==========================================
// CIRCLE SERVICE
// ==========================================
export const CircleService = {
    async create(circle: ShareCircle, userId: string) {
        if (!isSupabaseConfigured) return null;
        
        const { data, error } = await supabase.from('share_circles').insert({
            name: circle.name,
            principal: circle.principal,
            total_slots: circle.totalSlots,
            type: circle.type,
            bidding_type: circle.biddingType,
            status: circle.status,
            min_bid: circle.minBid,
            bid_step: circle.bidStep,
            admin_fee: circle.adminFee,
            fine_rate: circle.fineRate,
            period: circle.period,
            start_date: circle.startDate,
            next_due_date: circle.nextDueDate,
            // New fields
            payment_window_start: circle.paymentWindowStart,
            payment_window_end: circle.paymentWindowEnd,
            created_by: userId
        }).select().single();

        if (error || !data) throw error || new Error("Create failed: " + error.message);

        // Add Members (Ensuring fixed_due_amount is passed)
        const membersPayload = circle.members.map(m => ({
            circle_id: data.id,
            member_id: m.memberId,
            slot_number: m.slotNumber,
            status: m.status,
            pid_ton_amount: safeNum(m.pidTonAmount),
            fixed_due_amount: safeNum(m.fixedDueAmount), // Explicitly mapping
            note: m.note ?? null
        }));
        
        const { error: membersError } = await supabase.from('circle_members').insert(membersPayload);
        if (membersError) {
            console.error('Failed to insert members:', membersError);
            throw membersError;
        }

        // Add Initial Round
        const roundsPayload = circle.rounds.map(r => ({
            circle_id: data.id,
            round_number: r.roundNumber,
            date: r.date,
            status: r.status,
            total_pot: r.totalPot // Use correct CamelCase property from ShareRound interface
        }));
        await supabase.from('share_rounds').insert(roundsPayload);

        return data.id;
    },

    async update(id: string, data: any) {
        if (!isSupabaseConfigured) return;
        return await supabase.from('share_circles').update(data).eq('id', id);
    },

    // Specific slot update to preserve data integrity and allow partial updates (like notes)
    async updateSlot(circleId: string, slotNumber: number, updates: any) {
        if (!isSupabaseConfigured) return;
        const dbUpdates: any = {};
        if (updates.memberId) dbUpdates.member_id = updates.memberId;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.bidAmount !== undefined) dbUpdates.bid_amount = safeNum(updates.bidAmount);
        if (updates.fixedDueAmount !== undefined) dbUpdates.fixed_due_amount = safeNum(updates.fixedDueAmount); // NEW
        if (updates.wonRound !== undefined) dbUpdates.won_round = updates.wonRound;
        if (updates.note !== undefined) dbUpdates.note = updates.note;
        if (updates.pidTonAmount !== undefined) dbUpdates.pid_ton_amount = safeNum(updates.pidTonAmount);

        return await supabase.from('circle_members')
            .update(dbUpdates)
            .match({ circle_id: circleId, slot_number: slotNumber });
    },

    async updateMembers(circleId: string, members: CircleMember[]) {
        if (!isSupabaseConfigured) return;
        
        // 1. Sanitize Payload: Strictly control types to prevent 'fetch' errors
        const membersPayload = members.map(m => ({
            circle_id: circleId,
            member_id: m.memberId,
            slot_number: m.slotNumber,
            status: m.status,
            bid_amount: safeNum(m.bidAmount),
            fixed_due_amount: safeNum(m.fixedDueAmount), // NEW
            won_round: m.wonRound ?? null,
            pid_ton_amount: safeNum(m.pidTonAmount),
            note: m.note ?? null
        }));
        
        if (membersPayload.length > 0) {
            // Upsert members (Requires UNIQUE CONSTRAINT on circle_id, slot_number)
            const { error } = await supabase.from('circle_members').upsert(membersPayload, { onConflict: 'circle_id, slot_number' });
            if (error) {
                console.error('Update Members Error (Upsert):', error);
                throw error;
            }

            // 2. Cleanup: Remove slots that are beyond the new list length (if totalSlots was reduced)
            const maxSlot = Math.max(...members.map(m => m.slotNumber));
            const { error: deleteError } = await supabase.from('circle_members')
                .delete()
                .eq('circle_id', circleId)
                .gt('slot_number', maxSlot);
            
            if (deleteError) {
                console.error('Update Members Error (Cleanup):', deleteError);
            }
        }
    },

    async delete(id: string) {
        if (!isSupabaseConfigured) return;
        
        // --- MANUAL CASCADE DELETE TO FIX 409 CONFLICT ---
        await supabase.from('payouts').delete().eq('circle_id', id);
        await supabase.from('transactions').delete().eq('circle_id', id);
        await supabase.from('share_rounds').delete().eq('circle_id', id);
        await supabase.from('circle_members').delete().eq('circle_id', id);
        
        const { error } = await supabase.from('share_circles').delete().eq('id', id);
        if (error) {
            console.error("Delete Circle Error:", error);
            throw error;
        }
        return true;
    },

    async start(circleId: string, slot1MemberId: string, slot1TotalPot: number) {
        if (!isSupabaseConfigured) return;

        // 1. Update Circle Status
        const { error: cError } = await supabase.from('share_circles')
            .update({ status: 'SETUP_COMPLETE' })
            .eq('id', circleId);
        if (cError) throw cError;

        // 2. Update Thao Member (Slot 1)
        const { error: mError } = await supabase.from('circle_members')
            .update({ status: 'DEAD', won_round: 1, bid_amount: 0 })
            .match({ circle_id: circleId, slot_number: 1 });
        if (mError) throw mError;

        // 3. Update Round 1 -> CHANGE TO 'COLLECTING' (To trigger payment logic)
        const { error: rError } = await supabase.from('share_rounds')
            .update({ status: 'COLLECTING', winner_id: slot1MemberId, bid_amount: 0, total_pot: slot1TotalPot })
            .match({ circle_id: circleId, round_number: 1 });
        if (rError) throw rError;
        
        // 4. Ensure Round 2 exists (OPEN)
        const { data: circle } = await supabase.from('share_circles').select('next_due_date').eq('id', circleId).single();
        const { data: r2 } = await supabase.from('share_rounds').select('id').match({ circle_id: circleId, round_number: 2 });
        
        if ((!r2 || r2.length === 0) && circle) {
             await supabase.from('share_rounds').insert({
                 circle_id: circleId,
                 round_number: 2,
                 date: circle.next_due_date, 
                 status: 'OPEN',
                 total_pot: 0
             });
        }
    },

    async recordBid(circleId: string, roundNumber: number, winnerId: string, bidAmount: number, totalPot: number, memberSlot: number, nextDueDate: string, isLastRound: boolean) {
        if (!isSupabaseConfigured) return;

        // CHANGE: Set status to 'COLLECTING' instead of 'COMPLETED'
        await supabase.from('share_rounds')
            .update({ status: 'COLLECTING', winner_id: winnerId, bid_amount: bidAmount, total_pot: totalPot })
            .match({ circle_id: circleId, round_number: roundNumber });

        await supabase.from('circle_members')
            .update({ status: 'DEAD', bid_amount: bidAmount, won_round: roundNumber })
            .match({ circle_id: circleId, member_id: winnerId, slot_number: memberSlot });

        if (!isLastRound) {
            await supabase.from('share_rounds').insert({
                circle_id: circleId,
                round_number: roundNumber + 1,
                date: nextDueDate,
                status: 'OPEN',
                total_pot: 0
            });
            await supabase.from('share_circles').update({ next_due_date: nextDueDate }).eq('id', circleId);
        }
    },

    // NEW: Function to close a round (mark COMPLETED) after payout
    async completeRound(circleId: string, roundNumber: number) {
        if (!isSupabaseConfigured) return;
        await supabase.from('share_rounds')
            .update({ status: 'COMPLETED' })
            .match({ circle_id: circleId, round_number: roundNumber });
    }
};

// ==========================================
// TRANSACTION SERVICE
// ==========================================
export const TransactionService = {
    async create(tx: any) {
        if (!isSupabaseConfigured) return;
        const dbTx = {
            circle_id: tx.circleId,
            member_id: tx.memberId,
            round_number: tx.roundNumber,
            amount_expected: tx.amountExpected,
            amount_paid: tx.amountPaid,
            status: tx.status,
            slip_url: tx.slipUrl,
            note: tx.note,
            is_fine: tx.isFine
        };
        const { error } = await supabase.from('transactions').insert(dbTx);
        if (error) throw error;
    },

    async updateStatus(id: string, status: string, rejectReason?: string) {
        if (!isSupabaseConfigured) return;
        const updates: any = { status };
        if (rejectReason) updates.reject_reason = rejectReason;
        await supabase.from('transactions').update(updates).eq('id', id);
    }
};

// ==========================================
// PAYOUT SERVICE
// ==========================================
export const PayoutService = {
    async create(payout: any) {
        if (!isSupabaseConfigured) return { error: null };
        return await supabase.from('payouts').insert(payout);
    }
};
