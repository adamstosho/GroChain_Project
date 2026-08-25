# Settings Components

Only `AdminSettings` (`admin-settings.tsx`) lives here — it's rendered by `/dashboard/settings` (`app/dashboard/settings/page.tsx`) for `admin` users.

Farmer/partner and buyer settings are handled instead by `SettingsForm` and `BuyerSettingsForm` in `@/components/profile` (see that directory's README) — kept there rather than here to match how the profile page groups them.
