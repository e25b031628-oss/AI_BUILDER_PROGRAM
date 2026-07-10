"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

const AVATAR_SEEDS = [
  "Felix",
  "Aneka",
  "Milo",
  "Zoe",
  "Leo",
  "Nova",
  "Kai",
  "Luna",
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    displayName: "",
    phone: "",
    address: "",
    avatarSeed: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/get-started");
        return;
      }

      setUser(currentUser);

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          setProfile({
            displayName: data.displayName ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
            avatarSeed: data.avatarSeed ?? "",
          });
        } else {
          // no doc yet — keep empties
          setProfile((p) => ({ ...p }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  const handleChange = (field: string, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          displayName: profile.displayName,
          phone: profile.phone,
          address: profile.address,
          avatarSeed: profile.avatarSeed,
        },
        { merge: true }
      );
      setMessage("Profile saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return setError("No email available for password reset.");
    setMessage(null);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage("Password reset email sent.");
    } catch (err) {
      console.error(err);
      setError("Failed to send password reset email.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-6">
        <div className="rounded-3xl bg-slate-900/60 p-8 shadow-md backdrop-blur">
          <p className="text-slate-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-slate-900/60 p-6 shadow-lg backdrop-blur">
          <h1 className="mb-4 text-2xl font-semibold text-white">Profile</h1>

          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <div className="rounded-md bg-slate-800/60 px-3 py-2 text-sm text-slate-200">{user?.email}</div>

              <label className="block text-sm font-medium text-slate-300">Display Name</label>
              <input
                value={profile.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                className="w-full rounded-md bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Your display name"
              />

              <label className="block text-sm font-medium text-slate-300">Phone Number</label>
              <input
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-md bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="(555) 555-5555"
              />

              <label className="block text-sm font-medium text-slate-300">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                rows={4}
                className="w-full rounded-md bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Street, City, State, ZIP"
              />

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                {message && <span className="text-sm text-cyan-300">{message}</span>}
                {error && <span className="text-sm text-rose-400">{error}</span>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Avatar</label>
                <div className="mt-3 grid grid-cols-4 gap-3 md:grid-cols-4">
                  {AVATAR_SEEDS.map((seed) => {
                    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
                    const selected = profile.avatarSeed === seed;
                    return (
                      <button
                        type="button"
                        key={seed}
                        onClick={() => handleChange("avatarSeed", seed)}
                        className={`flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border-2 ${
                          selected ? "border-cyan-400" : "border-transparent"
                        } bg-white/5 p-1`}
                        aria-pressed={selected}
                      >
                        <img src={url} alt={seed} className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-800/40 p-4">
                <h3 className="mb-2 text-sm font-medium text-white">Change Password</h3>
                <div className="mb-3 text-sm text-slate-200">We will send a reset email to your address.</div>
                <div className="flex flex-col gap-2">
                  <input
                    value={user?.email ?? ""}
                    readOnly
                    className="rounded-md bg-slate-900/40 px-3 py-2 text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleSendReset}
                    className="inline-flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-500/20 hover:bg-white/2"
                  >
                    Send Password Reset Email
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
