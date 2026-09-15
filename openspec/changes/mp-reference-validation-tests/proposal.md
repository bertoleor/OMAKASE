# Proposal: MP Reference Validation Tests

## Intent

Kanban P2-10 (tests base, QA): `createBookingInputSchema` locks PCI behavior
for Mercado Pago reference IDs, but `mpPaymentId` / `mpPreferenceId` boundary
rules have no dedicated tests. Lock them before they regress.

## Scope

### In Scope

- Tests: `mpPaymentId` accepts 1–32 digits, rejects letters/overlength
- Tests: `mpPreferenceId` accepts 1–64 chars, rejects empty/overlength
- Fix prod code only if a boundary test exposes a real gap

### Out of Scope

- RLS/schema changes (ORN-85/ORN-141 track those separately)
- Rate-limit / anti-abuse coverage

## Capabilities

### New Capabilities

- `booking-validation`: MP reference boundary contract for `createBookingInputSchema`

### Modified Capabilities

- None (additive test coverage only unless a gap is found)

## Approach

Append a `describe` block to `src/lib/validations.test.ts` (test-first).
Run `pnpm test src/lib/validations.test.ts`. No prod change if all green.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/validations.test.ts` | Modified | New MP-reference boundary block |
| `src/lib/validations.ts` | Modified only if gap | Boundary fix, if RED exposes one |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests pass trivially (no bug) | Med | Still valid P2-10 coverage evidence; reported honestly |

## Rollback Plan

Revert single commit; schema behavior unchanged.

## Dependencies

- None

## Success Criteria

- [ ] 6+ new boundary assertions green in `vitest run`
- [ ] No unrelated test breaks; Linear mirror updated with evidence
