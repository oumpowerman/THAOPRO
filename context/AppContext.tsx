
import React from 'react';
import { useUI, UIProvider } from './UIContext';
import { useAuth, AuthProvider } from './AuthContext';
import { useData, DataProvider } from './DataContext';
import { useAuction, AuctionProvider } from './AuctionContext';
import { useDialog, DialogProvider } from './DialogContext';

// This file now acts as a FACADE (Aggregator) for all sub-contexts.
// This ensures backward compatibility with existing code that imports `useAppContext`.

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DialogProvider children={
        <UIProvider children={
            <AuthProvider children={
                <DataProvider children={
                    <AuctionProvider children={children} />
                } />
            } />
        } />
    } />
  );
};

export const useAppContext = () => {
  const ui = useUI();
  const auth = useAuth();
  const data = useData();
  const auction = useAuction();
  const dialog = useDialog();

  // Combine everything into one object to match the original AppContextType interface
  return {
    // Dialog (NEW)
    alert: dialog.alert,
    confirm: dialog.confirm,

    // UI (Legacy AlertModal - retained for backward compatibility for now)
    showAlert: ui.showAlert,
    
    // Auth
    user: auth.user,
    isLoading: auth.isLoading,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    updateCurrentUser: auth.updateCurrentUser,
    adminPaymentInfo: auth.adminPaymentInfo,
    updateAdminPaymentInfo: auth.updateAdminPaymentInfo,
    checkInviteCode: auth.checkInviteCode,
    requestOtp: async () => ({success: true}), // Stub
    verifyOtp: async () => ({success: true}), // Stub

    // Data
    members: data.members,
    circles: data.circles,
    transactions: data.transactions,
    payouts: data.payouts,
    scriptTemplate: data.scriptTemplate,
    saveScriptTemplate: data.saveScriptTemplate,
    
    addMember: data.addMember,
    approveMember: data.approveMember,
    rejectMember: data.rejectMember,
    updateMember: data.updateMember,
    updateInviteCode: data.updateInviteCode,
    addCircle: data.addCircle,
    updateCircle: data.updateCircle,
    updateCircleSlot: data.updateCircleSlot,
    deleteCircle: data.deleteCircle,
    startCircle: data.startCircle,
    recordBid: data.recordBid,
    submitPayment: data.submitPayment,
    submitClosingBalance: data.submitClosingBalance,
    createTransaction: data.createTransaction,
    approveTransaction: data.approveTransaction,
    rejectTransaction: data.rejectTransaction,
    addPayout: data.addPayout,

    // Auction
    auctionSession: auction.auctionSession,
    openAuctionRoom: auction.openAuctionRoom,
    joinAuctionRoom: auction.joinAuctionRoom,
    leaveAuctionRoom: auction.leaveAuctionRoom,
    startAuctionTimer: auction.startAuctionTimer,
    placeLiveBid: auction.placeLiveBid,
    closeAuctionRoom: auction.closeAuctionRoom,
  };
};
