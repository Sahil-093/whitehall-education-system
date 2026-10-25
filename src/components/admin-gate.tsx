"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { clearSession, credentialsMatch, readSession, writeSession } from "@/lib/admin-auth";

const LogoutContext = createContext<() => void>(() => {});

export function useAdminLogout() {
  return useContext(LogoutContext);
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(readSession());
    setReady(true);
  }, []);

  function logout() {
    clearSession();
    setAuthed(false);
  }

  if (!ready) {
    return <p className="opening">Opening the office…</p>;
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return <LogoutContext.Provider value={logout}>{children}</LogoutContext.Provider>;
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const logo = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.png`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const allowed = await credentialsMatch(email, password);
    setBusy(false);
    if (!allowed) {
      setError("That email or password does not match the school office.");
      return;
    }
    writeSession();
    setPassword("");
    onSuccess();
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="brand-mark">
            <img src={logo} alt="" />
          </div>
          <div>
            <strong>Whitehall Education System</strong>
            <span>Karak office</span>
          </div>
        </div>
        <div>
          <p className="page-kicker">Office</p>
          <h1>Sign in</h1>
        </div>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Sign in"}
        </button>
        <p className="login-note">Use the school Gmail, or the email and password saved on a staff record.</p>
      </form>
    </main>
  );
}
