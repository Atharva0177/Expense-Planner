import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  createHousehold, 
  createInvite, 
  checkAndAcceptInvite, 
  getHouseholdMembers, 
  updateMemberRole, 
  updateHouseholdName, 
  leaveHousehold 
} from "../lib/db_household";
import { HouseholdMember } from "../types";
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  Crown, 
  PlusCircle, 
  Edit3, 
  Copy, 
  Check, 
  ArrowRight,
  LogOut,
  Sparkles,
  Home
} from "lucide-react";

export function HouseholdSettings() {
  const { user, household, householdMember, refreshHousehold } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"create" | "join">(household ? "create" : "create");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(household?.name || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("spouse");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (household) {
      getHouseholdMembers(household.id!).then(setMembers);
      setEditNameValue(household.name);
    }
  }, [household]);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHouseholdName.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const email = user.email || `user_${user.uid}@example.com`;
      const id = await createHousehold(user.uid, newHouseholdName.trim(), email);
      if (id) {
        setMessage({ type: "success", text: `Household "${newHouseholdName.trim()}" created successfully!` });
        setNewHouseholdName("");
        await refreshHousehold();
      } else {
        setMessage({ type: "error", text: "Could not create household. Please try again." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create household" });
    }
    setLoading(false);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household || !editNameValue.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const ok = await updateHouseholdName(household.id!, editNameValue.trim());
      if (ok) {
        setMessage({ type: "success", text: "Household name updated successfully!" });
        setIsEditingName(false);
        await refreshHousehold();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update name" });
    }
    setLoading(false);
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household || householdMember?.role !== "primary" || !inviteEmail.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const code = await createInvite(household.id!, inviteEmail.trim(), inviteRole);
      setGeneratedCode(code);
      setInviteEmail("");
      setMessage({ type: "success", text: "Invite code generated! Share it with your family member." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to generate invite code" });
    }
    setLoading(false);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const success = await checkAndAcceptInvite(user.uid, user.email || "", inviteCode.trim());
      if (success) {
        setMessage({ type: "success", text: "Joined household successfully!" });
        setInviteCode("");
        await refreshHousehold();
      } else {
        setMessage({ type: "error", text: "Invalid or expired invite code." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to join household" });
    }
    setLoading(false);
  };

  const handlePromoteToPrimary = async (memberId: string) => {
    if (!household || householdMember?.role !== "primary") return;
    setLoading(true);
    setMessage(null);
    try {
      const success = await updateMemberRole(memberId, "primary");
      if (success) {
        setMessage({ type: "success", text: "Member promoted to Primary successfully!" });
        const updatedMembers = await getHouseholdMembers(household.id!);
        setMembers(updatedMembers);
      } else {
        setMessage({ type: "error", text: "Failed to promote member." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to promote member." });
    }
    setLoading(false);
  };

  const handleLeaveHousehold = async () => {
    if (!user || !window.confirm("Are you sure you want to leave this household? You can create or join another anytime.")) return;
    setLoading(true);
    setMessage(null);
    try {
      await leaveHousehold(user.uid);
      setMessage({ type: "success", text: "You have left the household." });
      await refreshHousehold();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error leaving household" });
    }
    setLoading(false);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="border-b-2 border-[#1A1A1A] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-[#1A1A1A]">Family & Household</h2>
          <p className="text-[10px] uppercase font-mono tracking-widest text-[#666] mt-0.5">
            Synchronized tracking, joint budgets & member permissions
          </p>
        </div>
        {household && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-mono tracking-wider bg-white px-2.5 py-1 border border-[#1A1A1A]">
              Active: <strong>{household.name}</strong>
            </span>
          </div>
        )}
      </div>

      {message && (
        <div 
          className={`p-3.5 border ${
            message.type === "success" 
              ? "border-[#2A4B3A] bg-[#F0F5F2] text-[#2A4B3A]" 
              : "border-red-900 bg-red-50 text-red-900"
          } text-xs font-mono font-bold tracking-wide flex items-center justify-between`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs uppercase hover:underline ml-3">✕</button>
        </div>
      )}

      {/* Main Household View */}
      {household ? (
        <div className="space-y-6">
          {/* Current Household Card */}
          <div className="border-2 border-[#1A1A1A] bg-white p-5 sm:p-7 shadow-[4px_4px_0px_#1A1A1A]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b-2 border-[#1A1A1A] pb-4 gap-3">
              <div>
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editNameValue}
                      onChange={e => setEditNameValue(e.target.value)}
                      className="px-2.5 py-1 border border-[#1A1A1A] bg-[#FCFAF7] font-serif italic text-lg sm:text-xl font-bold focus:outline-none"
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-[#1A1A1A] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800"
                    >
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingName(false)}
                      className="border border-[#1A1A1A] px-2.5 py-1 text-[10px] uppercase font-mono"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <Home className="w-5 h-5 text-[#1A1A1A]" />
                    <h3 className="text-xl sm:text-2xl font-serif italic font-bold tracking-tight text-[#1A1A1A]">
                      {household.name}
                    </h3>
                    {householdMember?.role === "primary" && (
                      <button 
                        onClick={() => setIsEditingName(true)}
                        title="Rename Household"
                        className="p-1 text-[#666] hover:text-[#1A1A1A] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[10px] font-mono text-[#666] uppercase mt-1">
                  Your Role: <strong className="text-[#1A1A1A] uppercase">{householdMember?.role || 'member'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLeaveHousehold}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] text-[10px] font-mono uppercase tracking-wider hover:bg-red-50 hover:text-red-800 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Leave Family</span>
                </button>
              </div>
            </div>

            {/* Member Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Family Members ({members.length})</span>
                </h4>
              </div>

              <div className="space-y-2.5">
                {members.map(m => (
                  <div key={m.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 border border-[#1A1A1A] bg-[#FCFAF7] gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-[#666] shrink-0" />
                      <span className="font-mono text-xs font-bold truncate">{m.email}</span>
                      {m.user_id === user.uid && (
                        <span className="text-[9px] font-mono uppercase bg-[#1A1A1A] text-white px-1.5 py-0.2 rounded-none">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="uppercase tracking-widest text-[9px] font-mono bg-white px-2 py-0.5 border border-[#1A1A1A] font-bold">
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
            </div>

            {/* Invite New Member (Primary Role Only) */}
            {householdMember?.role === "primary" && (
              <div className="mt-8 pt-5 border-t-2 border-[#1A1A1A]">
                <h4 className="text-[11px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Family Member</span>
                </h4>
                <p className="text-xs text-[#555] mb-3">
                  Generate a 6-digit sync code to add your spouse, partner, or dependent to this household account.
                </p>
                <form onSubmit={handleGenerateInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                      Member Email
                    </label>
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
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                      Role & Permissions
                    </label>
                    <select 
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs uppercase focus:outline-none focus:border-[2px]"
                    >
                      <option value="spouse">Spouse (Adult)</option>
                      <option value="primary">Co-Primary / Admin</option>
                      <option value="dependent">Child / Dependent</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-[#1A1A1A] text-white px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-colors touch-manipulation min-h-[38px]"
                    >
                      {loading ? "Generating..." : "Generate Code"}
                    </button>
                  </div>
                </form>

                {generatedCode && (
                  <div className="mt-4 p-4 border-2 border-[#2A4B3A] bg-[#F0F5F2] text-[#2A4B3A] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Invite Code generated! Share with your family member:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold bg-white border border-[#2A4B3A] px-3.5 py-1 tracking-widest text-[#2A4B3A]">
                        {generatedCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1.5 bg-[#2A4B3A] text-white hover:bg-[#1E362A] transition-colors"
                        title="Copy Code"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Switch, Create New, or Join Another Household Accordion */}
          <div className="border border-[#1A1A1A] bg-white p-5 sm:p-6 shadow-[3px_3px_0px_#1A1A1A]">
            <h3 className="text-base sm:text-lg font-serif italic tracking-tight text-[#1A1A1A] mb-3 pb-2 border-b border-[#1A1A1A] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                <span>Switch, Create, or Join Another Family</span>
              </span>
            </h3>

            {/* Sub Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveSubTab("create")}
                className={`px-3.5 py-1.5 text-[10px] uppercase font-mono font-bold border border-[#1A1A1A] transition-colors ${
                  activeSubTab === "create" ? "bg-[#1A1A1A] text-white" : "bg-[#FCFAF7] hover:bg-gray-100"
                }`}
              >
                + Create New Family
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("join")}
                className={`px-3.5 py-1.5 text-[10px] uppercase font-mono font-bold border border-[#1A1A1A] transition-colors ${
                  activeSubTab === "join" ? "bg-[#1A1A1A] text-white" : "bg-[#FCFAF7] hover:bg-gray-100"
                }`}
              >
                Join with Invite Code
              </button>
            </div>

            {activeSubTab === "create" ? (
              <form onSubmit={handleCreateHousehold} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-grow">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                    New Family / Household Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. The Sharma Family, Mumbai Residence"
                    value={newHouseholdName}
                    onChange={e => setNewHouseholdName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs focus:outline-none focus:border-[2px]"
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#1A1A1A] text-white px-5 py-2.5 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors touch-manipulation min-h-[38px] shrink-0"
                >
                  {loading ? "Creating..." : "Create & Switch"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAcceptInvite} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-grow">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                    6-Digit Invite Code
                  </label>
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
                  className="bg-[#1A1A1A] text-white px-5 py-2.5 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors touch-manipulation min-h-[38px] shrink-0"
                >
                  {loading ? "Joining..." : "Join & Switch"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Standalone Dual-Choice Screen: Create vs Join */
        <div className="space-y-6">
          <div className="text-center py-4">
            <h3 className="text-xl sm:text-2xl font-serif italic tracking-tight text-[#1A1A1A]">
              Choose How to Set Up Your Family Space
            </h3>
            <p className="text-xs font-mono text-[#666] mt-1 max-w-md mx-auto">
              Create a brand new family finance account or join your partner's existing household using an invite code.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab("create")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs uppercase font-bold tracking-wider border-2 border-[#1A1A1A] transition-all shadow-[3px_3px_0px_#1A1A1A] ${
                activeSubTab === "create" ? "bg-[#1A1A1A] text-white" : "bg-white text-[#1A1A1A] hover:bg-gray-100"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Family</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("join")}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs uppercase font-bold tracking-wider border-2 border-[#1A1A1A] transition-all shadow-[3px_3px_0px_#1A1A1A] ${
                activeSubTab === "join" ? "bg-[#1A1A1A] text-white" : "bg-white text-[#1A1A1A] hover:bg-gray-100"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Join with Invite Code</span>
            </button>
          </div>

          {activeSubTab === "create" ? (
            <div className="border-2 border-[#1A1A1A] bg-white p-5 sm:p-7 shadow-[4px_4px_0px_#1A1A1A] max-w-xl mx-auto">
              <h4 className="text-lg font-serif italic font-bold tracking-tight text-[#1A1A1A] mb-2 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Create a New Family Household</span>
              </h4>
              <p className="text-xs text-[#555] mb-4">
                You will be set as the Primary Admin. You can invite your spouse, partner, or dependents anytime.
              </p>
              <form onSubmit={handleCreateHousehold} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                    Family Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mandavkar Family, Mumbai Residence"
                    value={newHouseholdName}
                    onChange={e => setNewHouseholdName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-xs focus:outline-none focus:border-[2px]"
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#1A1A1A] text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-[3px_3px_0px_#888]"
                >
                  {loading ? "Creating Family..." : "Create Family Account"}
                </button>
              </form>
            </div>
          ) : (
            <div className="border-2 border-[#1A1A1A] bg-white p-5 sm:p-7 shadow-[4px_4px_0px_#1A1A1A] max-w-xl mx-auto">
              <h4 className="text-lg font-serif italic font-bold tracking-tight text-[#1A1A1A] mb-2 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                <span>Join an Existing Household</span>
              </h4>
              <p className="text-xs text-[#555] mb-4">
                Ask your family admin or spouse for their 6-character invite code generated in their Family settings.
              </p>
              <form onSubmit={handleAcceptInvite} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1">
                    6-Digit Invite Code
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. AB12CD"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 border border-[#1A1A1A] bg-[#FCFAF7] font-mono text-sm uppercase tracking-widest font-bold focus:outline-none focus:border-[2px]"
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#1A1A1A] text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-[3px_3px_0px_#888]"
                >
                  {loading ? "Joining Family..." : "Join Family Space"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

