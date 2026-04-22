

# Filter Access Requests to Pending Only

## Problem
`getPendingRequests()` in `src/services/request.ts` fetches **all** access requests (pending, approved, declined). The Admin sees approved/declined requests cluttering the list.

## Fix
Add `.eq('status', 'pending')` to the query on line 17-18, so only pending requests are returned.

**File**: `src/services/request.ts`, line ~17

```typescript
const { data, error } = await supabase
  .from('access_requests')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

Single-line addition. No other files need changes — the component and Admin page already handle the data correctly.

