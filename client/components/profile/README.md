# Profile Components

Role-based profile components rendered by `/dashboard/profile` (`app/dashboard/profile/page.tsx`), which switches on `user.role`:

- **`farmer` / `partner`** → `ProfileForm` (`profile-form.tsx`) — handles both roles internally
- **`buyer`** → `BuyerProfileForm` (`buyer-profile-form.tsx`)
- **`admin`** → `AdminProfile` (`admin-profile.tsx`)

Settings for the same roles are rendered by `/dashboard/settings` (`app/dashboard/settings/page.tsx`):

- **`farmer` / `partner`** → `SettingsForm` (`settings-form.tsx`)
- **`buyer`** → `BuyerSettingsForm` (`buyer-settings-form.tsx`)
- **`admin`** → `AdminSettings` (`@/components/settings/admin-settings`)

All components use `@/hooks/use-toast` for feedback and `@/components/ui/avatar-upload` for profile picture uploads.
