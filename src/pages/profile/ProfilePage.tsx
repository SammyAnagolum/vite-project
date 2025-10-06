// src/pages/settings/ProfilePage.tsx
export default function ProfilePage() {
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
      <p className="text-sm text-muted-foreground py-6">Coming Soon...</p>

    </div>
  );
}