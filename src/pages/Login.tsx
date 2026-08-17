import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const navigate = useNavigate();

  const getFriendlyErrorMessage = (code: string, defaultMessage: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in or reset your password.";
      case "auth/invalid-credential":
        return "Incorrect email or password. Please try again or reset your password.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      default:
        return defaultMessage;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code, err.message));
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    setError("");
    setInfoMsg("");
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMsg("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code, err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1A1A1A] font-sans flex items-center justify-center p-4 sm:p-6 md:p-10 border-0 sm:border-[6px] md:border-[12px] border-white shadow-inner">
      <div className="max-w-md w-full bg-white border border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] p-6 sm:p-8 md:p-10">
        <div className="text-center mb-8 border-b-2 border-[#1A1A1A] pb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif italic font-light tracking-tight text-[#1A1A1A]">ExpensePlanner</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold mt-3 text-[#555]">Personal Finance Tracker</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 sm:p-4 border border-red-700 bg-[#FCFAF7] text-red-700 text-xs font-mono uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        {infoMsg && (
          <div className="mb-6 p-3 sm:p-4 border border-green-700 bg-[#FCFAF7] text-green-700 text-xs font-mono uppercase tracking-wider text-center">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3 border border-[#1A1A1A] bg-[#FCFAF7] focus:ring-0 focus:outline-none focus:border-[2px] transition-all font-mono text-xs"
              required 
            />
          </div>
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]">Password</label>
              {!isRegister && (
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-[10px] uppercase font-bold tracking-widest text-[#555] hover:text-[#1A1A1A] transition-colors py-1"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3 border border-[#1A1A1A] bg-[#FCFAF7] focus:ring-0 focus:outline-none focus:border-[2px] transition-all font-mono text-xs"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#1A1A1A] text-white py-3.5 sm:py-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors mt-2 active:scale-[0.99] touch-manipulation"
          >
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center border-t border-[#1A1A1A] border-dotted pt-5 sm:pt-6">
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setInfoMsg("");
            }} 
            className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] hover:opacity-70 transition-opacity py-2"
          >
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
