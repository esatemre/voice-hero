# Firebase Remote Config - Feature Flags

This project uses **Firebase Remote Config** for **server-side** feature flags, enabling safe rollouts and operational toggles without redeploys.

## Overview

Flags are evaluated server-side and cached for 60 seconds.

- **`email_onboarding_enabled`** → Controls whether onboarding emails are sent to new users
- **`new_project_creation_enabled`** → Controls the dashboard "New Project" entry points and `/dashboard/new` route availability

**Configuration:**
- Location: `/apps/web/lib/server-feature-flags.ts`
- Cache: 60 seconds
- Defaults: `SERVER_FLAG_DEFAULTS`
- Function: `getServerFeatureFlag(flag)` → `Promise<boolean>`

## Usage Example

```ts
import { getServerFeatureFlag } from "@/lib/server-feature-flags";

export default async function DashboardPage() {
  const enabled = await getServerFeatureFlag("new_project_creation_enabled");

  if (!enabled) {
    // Hide entry points or redirect
  }
}
```

## Setting Flags in Firebase Console

1. Go to **Firebase Console** → Your Project
2. Navigate to **Remote Config**
3. Add/Edit parameters:

   | Parameter Name | Type | Value | Notes |
   |---|---|---|---|
   | `email_onboarding_enabled` | Boolean | `true`/`false` | Server-side flag |
   | `new_project_creation_enabled` | Boolean | `true`/`false` | Server-side flag |

4. **Publish Changes** to apply immediately

## Fallback Behavior

All flags fall back to defaults from `SERVER_FLAG_DEFAULTS` when:

- **Missing from Firebase**
- **Firebase unavailable**
- **Network error**
- **Test environment** (`NODE_ENV === "test"` or `VITEST` set)

This ensures backward compatibility and graceful degradation.

## Caching Strategy

| Layer | Server |
|---|---|
| **Cache Duration** | 60 seconds |
| **Fetching** | On first request, then cached |
| **Cache Invalidation** | Every 60s |
| **Error Handling** | Falls back to defaults |

## Adding New Flags

1. **Define the flag** in the defaults object:
   ```ts
   // /apps/web/lib/server-feature-flags.ts
   const SERVER_FLAG_DEFAULTS = {
     email_onboarding_enabled: false,
     new_project_creation_enabled: true,
     your_new_server_flag: false,
   } as const;
   ```

2. **Use the helper** in your code:
   ```ts
   const enabled = await getServerFeatureFlag("your_new_server_flag");
   ```

3. **Add the parameter** in Firebase Remote Config

## Testing

Flags return defaults in test environments:

```ts
const enabled = await getServerFeatureFlag("new_project_creation_enabled");
// Uses SERVER_FLAG_DEFAULTS in test or VITEST
```

To test specific values, mock the helper:

```ts
import { vi } from "vitest";

vi.mock("@/lib/server-feature-flags", () => ({
  getServerFeatureFlag: async () => true,
}));
```

## Monitoring

- Check **Firebase Console → Remote Config → Revision history** to see changes
- Monitor **Cloud Logs** for Remote Config fetch errors
- Watch **Analytics** to see how flags impact user behavior after rollout

## Best Practices

✅ **Do:**
- Use for UI entry points and operational toggles
- Default to safe values in `SERVER_FLAG_DEFAULTS`
- Test flags in staging before production rollout
- Clean up old flags after rollout completes

❌ **Don't:**
- Store sensitive data in flag values
- Use for authentication or authorization (use proper auth)
- Create too many flags (consolidate related features)

## References

- [Firebase Remote Config Documentation](https://firebase.google.com/docs/remote-config)
- [Firebase Remote Config Best Practices](https://firebase.google.com/docs/remote-config/best-practices)
- Implementation: `lib/server-feature-flags.ts`
