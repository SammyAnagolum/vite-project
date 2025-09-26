// src/pages/settings/ProfilePage.tsx
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Globe,
  ImageIcon,
  Loader2,
  ShieldCheck,
  LockKeyhole,
  Save,
} from "lucide-react";
import { toast } from "sonner";

type Profile = {
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  timezone: string;
  language: string;
  productEmails: boolean;
  securityEmails: boolean;
};

// Mocked initial profile; wire to real API later
const INITIAL: Profile = {
  fullName: "Jane Smith",
  email: "jane.smith@bank.com",
  role: "Administrator",
  phone: "",
  timezone: "Asia/Kolkata",
  language: "en-IN",
  productEmails: true,
  securityEmails: true,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(INITIAL);
  const [saving, setSaving] = useState(false);

  // Avatar local preview (client-side only)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  function openFilePicker() {
    fileRef.current?.click();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    const next = URL.createObjectURL(f);
    setAvatarUrl(next);
    toast.success("Avatar selected (not uploaded yet)");
  }

  function removeAvatar() {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(null);
    if (fileRef.current) fileRef.current.value = "";
    toast.message("Avatar removed");
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // TODO: wire to your real API
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile updated");
    }, 700);
  }

  function sendPasswordReset() {
    // TODO: wire to backend
    toast.success("Password reset email sent");
  }

  function signOutOtherSessions() {
    // TODO: wire to backend
    toast.message("Other sessions will be signed out");
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        <h2 className="text-base font-medium">Profile</h2>
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Manage your personal info, avatar, and security preferences.
        </p>
      </div>

      <div className="mx-auto max-w-7xl py-6">
        <form onSubmit={onSave} className="grid gap-6 lg:grid-cols-3">
          {/* Left: Profile info */}
          <Card className="p-4 md:p-5 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-base font-medium">Profile</h3>
              <p className="text-sm text-muted-foreground">
                This information is visible to other admins in the console.
              </p>
            </div>

            {/* Avatar + actions */}
            <div className="mb-5 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl ?? undefined} alt={profile.fullName} />
                <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile}
                />
                <Button type="button" variant="outline" onClick={openFilePicker}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Change
                </Button>
                <Button type="button" variant="ghost" onClick={removeAvatar} disabled={!avatarUrl}>
                  Remove
                </Button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label className="mb-1 text-xs">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    value={profile.fullName}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </Field>

              <Field>
                <Label className="mb-1 text-xs">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" value={profile.email} disabled />
                </div>
              </Field>

              <Field>
                <Label className="mb-1 text-xs">Role</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" value={profile.role} disabled />
                </div>
              </Field>

              <Field>
                <Label className="mb-1 text-xs">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    inputMode="tel"
                    value={profile.phone ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </Field>

              <Field>
                <Label className="mb-1 text-xs">Timezone</Label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={profile.timezone}
                    onValueChange={(v) => setProfile((p) => ({ ...p, timezone: v }))}
                  >
                    <SelectTrigger className="pl-8">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (BST/GMT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Field>

              <Field>
                <Label className="mb-1 text-xs">Language</Label>
                <Select
                  value={profile.language}
                  onValueChange={(v) => setProfile((p) => ({ ...p, language: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-IN">English (India)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Notifications */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="mb-2 text-sm font-medium">Email notifications</div>
                <ToggleRow
                  label="Product updates"
                  checked={profile.productEmails}
                  onCheckedChange={(v) => setProfile((p) => ({ ...p, productEmails: v }))}
                />
                <ToggleRow
                  label="Security alerts"
                  checked={profile.securityEmails}
                  onCheckedChange={(v) => setProfile((p) => ({ ...p, securityEmails: v }))}
                />
              </div>
              <div className="rounded-lg border p-3">
                <div className="mb-2 text-sm font-medium">Preferences</div>
                <p className="text-sm text-muted-foreground">
                  For theme, tables, and other UI preferences, head to{" "}
                  <Button asChild variant="link" className="px-0">
                    <a href="/settings/preferences">Settings → Preferences</a>
                  </Button>
                  .
                </p>
              </div>
            </div>

            {/* Save */}
            <div className="mt-6 flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfile(INITIAL)}
                disabled={saving}
              >
                Reset
              </Button>
            </div>
          </Card>

          {/* Right: Security */}
          <Card className="p-4 md:p-5">
            <div className="mb-4">
              <h3 className="text-base font-medium">Security</h3>
              <p className="text-sm text-muted-foreground">
                Keep your account protected.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Password</div>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  You can request a password reset email.
                </p>
                <Button type="button" variant="outline" onClick={sendPasswordReset}>
                  Send reset email
                </Button>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 text-sm font-medium">Sessions</div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Sign out everywhere except this browser.
                </p>
                <Button type="button" variant="outline" onClick={signOutOtherSessions}>
                  Sign out other sessions
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}

/* --- Small helpers/components --- */
function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md px-2 py-2 hover:bg-muted/60">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
