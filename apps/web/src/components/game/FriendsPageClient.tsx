'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, UserMinus, UserCheck, Users, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';

interface Friend {
  id: string;
  name: string;
  avatar: string | null;
  friendshipId: string;
}

interface PendingRequest {
  id: string;
  name: string;
  avatar: string | null;
  friendshipId: string;
}

interface SearchedUser {
  id: string;
  name: string;
  avatar: string | null;
}

export function FriendsPageClient() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Fetch initial friends & requests
  const fetchFriendsData = async () => {
    try {
      const res = await fetch('/api/friends');
      const data = await res.json();
      if (!data.error) {
        setFriends(data.friends || []);
        setPending(data.pendingReceived || []);
      }
    } catch (err) {
      console.error('Failed to load friends list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  // Search users handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setStatusMsg('');
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
        if (data.length === 0) {
          setStatusMsg('No registered students found.');
        }
      }
    } catch {
      setStatusMsg('Error searching for players.');
    } finally {
      setSearching(false);
    }
  };

  // Add friend request
  const handleSendRequest = async (friendId: string) => {
    setActionLoading(friendId);
    setStatusMsg('');
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (data.error) {
        setStatusMsg(data.error);
      } else {
        setStatusMsg('Friend request dispatched successfully!');
        // Remove from search results to prevent re-clicks
        setSearchResults(prev => prev.filter(u => u.id !== friendId));
      }
    } catch {
      setStatusMsg('Failed to send request.');
    } finally {
      setActionLoading(null);
    }
  };

  // Accept request
  const handleAcceptRequest = async (friendshipId: string, name: string) => {
    setActionLoading(friendshipId);
    setStatusMsg('');
    try {
      const res = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });
      const data = await res.json();
      if (data.error) {
        setStatusMsg(data.error);
      } else {
        setStatusMsg(`You are now friends with ${name}!`);
        fetchFriendsData();
      }
    } catch {
      setStatusMsg('Failed to accept request.');
    } finally {
      setActionLoading(null);
    }
  };

  // Remove friend or decline request
  const handleRemoveFriend = async (friendshipId: string, isDecline: boolean) => {
    setActionLoading(friendshipId);
    setStatusMsg('');
    try {
      const res = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });
      const data = await res.json();
      if (data.error) {
        setStatusMsg(data.error);
      } else {
        setStatusMsg(isDecline ? 'Friend request declined.' : 'Friend removed.');
        fetchFriendsData();
      }
    } catch {
      setStatusMsg('Failed to complete action.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B1E] flex flex-col items-center justify-center font-mono text-white">
        <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin mb-4" />
        Syncing campus roster...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search panel */}
      <GlassCard className="bg-[#12142B]/85 border-white/[0.08] p-6">
        <h2 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#22D3EE]" /> Seek Classmates
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classmate by name..."
            className="flex-grow bg-[#0A0B1E] border border-white/[0.08] focus:border-[#22D3EE] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-white/20"
          />
          <NeonButton type="submit" variant="accent" disabled={searching || !searchQuery.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </NeonButton>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 grid gap-3 max-h-56 overflow-y-auto pr-1 border-t border-white/[0.05] pt-4">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-[#0A0B1E]/40 border border-white/[0.05] p-3 rounded-xl">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${user.id}`)}>
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                    className="w-8 h-8 rounded-full border border-white/10"
                    alt=""
                  />
                  <span className="text-sm font-medium text-white hover:text-[#22D3EE] transition-colors">{user.name}</span>
                </div>
                <NeonButton
                  onClick={() => handleSendRequest(user.id)}
                  disabled={actionLoading === user.id}
                  variant="primary"
                  className="py-1 px-3 text-xs"
                >
                  {actionLoading === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Send Request
                </NeonButton>
              </div>
            ))}
          </div>
        )}

        {statusMsg && (
          <p className="text-xs font-mono text-[#22D3EE] mt-3 text-center bg-[#22D3EE]/5 border border-[#22D3EE]/10 py-2 rounded-xl">
            {statusMsg}
          </p>
        )}
      </GlassCard>

      {/* Grid: Pending requests & friends */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Pending Requests Column */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#7C3AED] flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
            <Mail className="w-4 h-4" /> Pending Requests ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <GlassCard className="bg-[#12142B]/40 text-center py-8 text-xs text-textMuted font-mono">
              No pending invitations.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {pending.map(req => (
                <GlassCard key={req.id} className="bg-[#12142B]/85 border-white/[0.08] p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${req.id}`)}>
                    <img
                      src={req.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.name)}`}
                      className="w-8 h-8 rounded-full border border-white/10"
                      alt=""
                    />
                    <span className="text-sm font-medium text-white hover:text-[#22D3EE] transition-colors">{req.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <NeonButton
                      onClick={() => handleAcceptRequest(req.friendshipId, req.name)}
                      disabled={actionLoading === req.friendshipId}
                      variant="success"
                      className="flex-grow py-1.5 text-xs"
                    >
                      Accept
                    </NeonButton>
                    <NeonButton
                      onClick={() => handleRemoveFriend(req.friendshipId, true)}
                      disabled={actionLoading === req.friendshipId}
                      variant="danger"
                      className="py-1.5 px-3 text-xs"
                    >
                      Decline
                    </NeonButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Friends List Column */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#22D3EE] flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
            <Users className="w-4 h-4" /> Campus Network ({friends.length} Friends)
          </h3>
          {friends.length === 0 ? (
            <GlassCard className="bg-[#12142B]/40 text-center py-12 text-sm text-textMuted font-mono">
              Your academic network is empty. Seek classmates above!
            </GlassCard>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {friends.map(friend => (
                <GlassCard key={friend.id} className="bg-[#12142B]/85 border-white/[0.08] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${friend.id}`)}>
                    <img
                      src={friend.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(friend.name)}`}
                      className="w-9 h-9 rounded-full border border-white/10"
                      alt=""
                    />
                    <span className="text-sm font-medium text-white hover:text-[#22D3EE] transition-colors truncate max-w-[130px]">
                      {friend.name}
                    </span>
                  </div>
                  <NeonButton
                    onClick={() => handleRemoveFriend(friend.friendshipId, false)}
                    disabled={actionLoading === friend.friendshipId}
                    variant="danger"
                    className="py-1.5 px-2.5 text-xs"
                  >
                    <UserMinus className="w-4 h-4" />
                  </NeonButton>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
