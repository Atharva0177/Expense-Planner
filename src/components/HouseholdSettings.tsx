import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createInvite, checkAndAcceptInvite, getHouseholdMembers, updateMemberRole } from "../lib/db_household";
import { HouseholdMember } from "../types";
import { Users, UserPlus, KeyRound, Shield, Mail, CheckCircle2, Crown } from "lucide-react";

export function HouseholdSettings() {
  const { user, household, householdMember, refreshHousehold } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("spouse");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (household) {
      getHouseholdMembers(household.id!).then(setMembers);
    }
  }, [household]);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household || householdMember?.role !== "primary" || !inviteEmail.trim()) return;
    setLoading(true);
    try {
      const code = await createInvite(household.id!, inviteEmail.trim(), inviteRole);
      setGeneratedCode(code);
      setInviteEmail("");
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;
    setLoading(true);
    try {
      const success = await checkAndAcceptInvite(user.uid, user.email || "", inviteCode.trim());
      if (success) {
        setMessage("Joined household successfully!");
        await refreshHousehold();
      } else {
        setMessage("Invalid or expired invite code.");
      }
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  const handlePromoteToPrimary = async (memberId: string) => {
    if (!household || householdMember?.role !== "primary") return;
    setLoading(true);
    try {
      const success = await updateMemberRole(memberId, "primary");
      if (success) {
        setMessage("Member promoted to Primary successfully!");
        const updatedMembers = await getHouseholdMembers(household.id!);
        setMembers(updatedMembers);
      } else {
        setMessage("Failed to promote member.");
      }
    } catch (err: any) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div className="border-b-2 border-[#1A1A1A] pb-2">
        <h2 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">Household Settings</h2>
        <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] mt-0.5">Family sync & member access</p>
      </div>

      {message && (
        <div className="p-3 sm:p-4 border border-[#1A1A1A] bg-[#FCFAF7] text-xs font-mono font-bold tracking-wider">
          {message}
        </div>
      )}

      {!household ? (
        <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
          <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 sm:mb-4 border-b border-[#1A1A1A] pb-2 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            <span>Join an Existing Household</span>
          </h3>
          <form onSubmit={handleAcceptInvite} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-grow">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Invite Code</label>
              <input 
                type="text" 
                placeholder="e.g. AB12CD"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs uppercase focus:outline-none focus:border-[2px]"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#1A1A1A] text-white px-6 py-2.5 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors touch-manipulation min-h-[38px]"
            >
              {loading ? "Joining..." : "Join Household"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Members List */}
          <div className="border border-[#1A1A1A] bg-white p-4 sm:p-6 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 border-b border-[#1A1A1A] pb-2 gap-1">
              <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{household.name}</span>
              </h3>
              <span className="text-[10px] font-mono text-[#666] uppercase">
                Your Role: <strong className="text-[#1A1A1A]">{householdMember?.role || 'member'}</strong>
              </span>
            </div>
            
            <div className="space-y-2.5">
              {members.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-2.5 border border-[#1A1A1A] bg-[#FCFAF7] gap-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#666] shrink-0" />
                    <span className="font-mono text-xs font-bold truncate max-w-[240px] sm:max-w-none">{m.email}</span>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="uppercase tracking-widest text-[9px] font-mono bg-white px-2 py-0.5 border border-[#1A1A1A]">
                      {m.role}
                    </span>
                    {householdMember?.role === "primary" && m.role !== "primary" && (
                      <button 
                        onClick={() => handlePromoteToPrimary(m.id!)}
                        disabled={loading}
                        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-blue-700 hover:text-blue-900 ml-2 disabled:opacity-50"
                      >
                        <Crown className="w-3 h-3" />
                        <span>Make Primary</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite New Member (Primary Only) */}
            {householdMember?.role === "primary" && (
              <div className="mt-8 pt-4 border-t border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Family Member</span>
                </h4>
                <form onSubmit={handleGenerateInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="spouse@family.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs focus:outline-none focus:border-[2px]"
                      required 
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">Role</label>
                    <select 
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs uppercase focus:outline-none focus:border-[2px]"
                    >
                      <option value="primary">Co-Primary / Admin</option>
                      <option value="spouse">Spouse (Adult)</option>
                      <option value="dependent">Child / Dependent</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-[#1A1A1A] text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-colors touch-manipulation min-h-[38px]"
                    >
                      {loading ? "Generating..." : "Generate Code"}
                    </button>
                  </div>
                </form>

                {generatedCode && (
                  <div className="mt-4 p-3.5 border-2 border-[#2A4B3A] bg-[#F0F5F2] text-[#2A4B3A] text-xs font-mono font-bold tracking-widest flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Invite Code generated! Share with your family member:</span>
                    </div>
                    <span className="font-mono text-sm bg-white border border-[#2A4B3A] px-3 py-1 text-[#2A4B3A]">
                      {generatedCode}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
