
import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { AuctionSession, BidRecord } from '../types';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AuctionContextType {
  auctionSession: AuctionSession | null;
  openAuctionRoom: (circleId: string) => void;
  joinAuctionRoom: () => void; 
  leaveAuctionRoom: () => void; 
  startAuctionTimer: (seconds: number) => void;
  placeLiveBid: (amount: number) => void;
  closeAuctionRoom: () => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { circles } = useData();
  const [auctionSession, setAuctionSession] = useState<AuctionSession | null>(null);
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<AuctionSession | null>(null); // Latest state
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map()); // Manage multiple channels

  // Sync ref with state
  useEffect(() => {
      sessionRef.current = auctionSession;
  }, [auctionSession]);

  // --- AUTOMATIC DISCOVERY & CONNECTION ---
  // When user logs in and circles are loaded, subscribe to all relevant rooms to listen for activity.
  useEffect(() => {
      if (!user || circles.length === 0) return;

      // 1. Identify relevant circles (Member of, or Created By)
      const myCircles = circles.filter(c => 
          c.createdBy === user.id || 
          c.members.some(m => m.memberId === user.id)
      );

      // 2. Subscribe to each circle's channel
      myCircles.forEach(circle => {
          const channelId = `auction_room:${circle.id}`;
          
          // Prevent duplicate subscriptions
          if (channelsRef.current.has(channelId)) return;

          const channel = supabase.channel(channelId, {
              config: {
                  broadcast: { self: true }, 
                  presence: { key: user.id },
              },
          });

          channel
              .on('broadcast', { event: 'AUCTION_UPDATE' }, (payload) => {
                  console.log(`[${circle.name}] Received Update:`, payload);
                  if (payload.payload) {
                      // Update State
                      setAuctionSession(prev => {
                          // Merge with existing if same circle, or replace if new room detected
                          if (prev && prev.circleId !== circle.id) {
                              // If we are already in a room, do we switch? 
                              // For now, yes, assuming only one active auction at a time for a user.
                              return { ...payload.payload };
                          }
                          return { ...(prev || {}), ...payload.payload };
                      });
                  }
              })
              .on('broadcast', { event: 'NEW_BID' }, (payload) => {
                  const { amount, userId, userName, timestamp } = payload.payload;
                  setAuctionSession(prev => {
                      if (!prev || prev.circleId !== circle.id) return prev; // Ignore if not current room
                      if (amount <= prev.highestBid) return prev; 
                      
                      return {
                          ...prev,
                          highestBid: amount,
                          winnerId: userId,
                          bidHistory: [{ userId, userName, amount, timestamp }, ...prev.bidHistory],
                          timeLeft: 60, // Reset timer on bid
                          status: 'LIVE'
                      };
                  });
              })
              .on('broadcast', { event: 'TIMER_SYNC' }, (payload) => {
                  setAuctionSession(prev => {
                      if (!prev || prev.circleId !== circle.id) return prev;
                      return { ...prev, timeLeft: payload.payload.timeLeft, status: payload.payload.status };
                  });
              })
              .on('broadcast', { event: 'REQUEST_STATE' }, () => {
                  // Handshake: If I am the Admin/Host and I have the state for this channel, send it.
                  if (sessionRef.current && sessionRef.current.circleId === circle.id) {
                      console.log(`[${circle.name}] Sending State to new peer`);
                      channel.send({
                          type: 'broadcast',
                          event: 'AUCTION_UPDATE',
                          payload: sessionRef.current
                      });
                  }
              })
              .subscribe((status) => {
                  if (status === 'SUBSCRIBED') {
                      // Handshake: Ask "Is there an active auction here?"
                      channel.send({ type: 'broadcast', event: 'REQUEST_STATE', payload: {} });
                  }
              });

          channelsRef.current.set(channelId, channel);
      });

      // Cleanup function (optional: keep connections alive for seamless experience, or clean on unmount)
      // For a SPA, we might want to keep them. But to be safe against memory leaks:
      return () => {
          // We don't unsubscribe here to avoid constant reconnects on re-renders 
          // (useEffect dependency array handles updates).
          // But strict React might trigger cleanup.
          // Let's rely on the map check to prevent duplicates.
      };

  }, [circles, user]);

  // --- ACTIONS ---

  const openAuctionRoom = (circleId: string) => {
      const circle = circles.find(c => c.id === circleId);
      if (!circle) return;
      
      // Determine round
      let roundNumber = 1;
      if (circle.rounds.length > 0) {
          const sortedRounds = [...circle.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
          const lastRound = sortedRounds[sortedRounds.length - 1];
          if (lastRound.status === 'OPEN') {
              roundNumber = lastRound.roundNumber;
          } else {
              roundNumber = lastRound.roundNumber + 1;
          }
      }

      const initialSession: AuctionSession = {
          circleId, 
          circleName: circle.name, 
          roundNumber: roundNumber,
          status: 'WAITING', 
          timeLeft: 60, 
          highestBid: 0, 
          winnerId: null, 
          bidHistory: [], 
          participants: [], 
          minBid: circle.minBid || 0, 
          bidStep: circle.bidStep || 0
      };

      setAuctionSession(initialSession);
      
      // Broadcast Initial State using the existing channel
      const channelId = `auction_room:${circleId}`;
      const channel = channelsRef.current.get(channelId);
      
      if (channel) {
          setTimeout(() => {
              channel.send({
                  type: 'broadcast',
                  event: 'AUCTION_UPDATE',
                  payload: initialSession
              });
          }, 500);
      }
  };

  const joinAuctionRoom = () => {
      // Deprecated: Logic is now handled automatically in useEffect
      // But we can use this to force a state refresh request
      if (auctionSession) {
          const channelId = `auction_room:${auctionSession.circleId}`;
          const channel = channelsRef.current.get(channelId);
          if (channel) {
              channel.send({ type: 'broadcast', event: 'REQUEST_STATE', payload: {} });
          }
      }
  };

  const leaveAuctionRoom = () => {
      // Don't disconnect, just clear local view state if needed.
      // But for members, we want to stay connected to receive notifications.
      // So maybe just do nothing or setSession(null) ONLY if we want to "exit" the UI.
      // setAuctionSession(null); 
  };

  const startAuctionTimer = (seconds: number) => {
      if (!auctionSession) return;
      
      // 1. Update Local
      setAuctionSession(prev => prev ? { ...prev, timeLeft: seconds, status: 'LIVE' } : null);

      const channelId = `auction_room:${auctionSession.circleId}`;
      const channel = channelsRef.current.get(channelId);

      // 2. Broadcast Start
      if (channel) {
          channel.send({
              type: 'broadcast',
              event: 'AUCTION_UPDATE',
              payload: { status: 'LIVE', timeLeft: seconds }
          });
      }

      if (timerRef.current) clearInterval(timerRef.current);
      
      // Server-authoritative-ish timer (Admin controls the tick)
      timerRef.current = setInterval(() => {
          if (!sessionRef.current) return;
          
          const current = sessionRef.current;
          let newTime = current.timeLeft - 1;
          let newStatus = current.status;

          if (newTime <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              newTime = 0;
              newStatus = 'FINISHED';
          }

          // Update Local
          setAuctionSession(prev => prev ? { ...prev, timeLeft: newTime, status: newStatus } : null);

          // Broadcast Sync
          if (channel) {
              channel.send({
                  type: 'broadcast',
                  event: 'TIMER_SYNC',
                  payload: { timeLeft: newTime, status: newStatus }
              });
          }

      }, 1000);
  };

  const placeLiveBid = (amount: number) => {
      if (!auctionSession || !user) return;
      if (auctionSession.status !== 'LIVE') return;
      if (amount <= auctionSession.highestBid) return;

      const bidPayload = {
          amount,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString() // Use ISO for serialization
      };

      const channelId = `auction_room:${auctionSession.circleId}`;
      const channel = channelsRef.current.get(channelId);

      // Send to Channel
      if (channel) {
          channel.send({
              type: 'broadcast',
              event: 'NEW_BID',
              payload: bidPayload
          });
      }
  };

  const closeAuctionRoom = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // We don't remove channel, just clear session state
      setAuctionSession(null);
  };

  // Cleanup on full unmount
  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
          channelsRef.current.forEach(ch => supabase.removeChannel(ch));
          channelsRef.current.clear();
      };
  }, []);

  return (
    <AuctionContext.Provider value={{ 
      auctionSession,
      openAuctionRoom, joinAuctionRoom, leaveAuctionRoom, startAuctionTimer, placeLiveBid, closeAuctionRoom
    }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (context === undefined) throw new Error('useAuction must be used within an AuctionProvider');
  return context;
};
