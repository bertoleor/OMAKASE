# Booking Validation Specification

## Purpose

Boundary contract for Mercado Pago reference fields in `createBookingInputSchema`
(PCI: only reference IDs accompany a booking — never PAN data).

## Requirements

### Requirement: MP Payment ID Format

The system MUST accept `mpPaymentId` only as 1–32 ASCII digits when present,
and MUST reject anything else.

#### Scenario: Valid payment reference

- GIVEN `mpPaymentId: "123456789"`
- WHEN parsed by `createBookingInputSchema`
- THEN validation succeeds

#### Scenario: Non-numeric reference

- GIVEN `mpPaymentId: "pay_abc123"`
- WHEN parsed
- THEN validation fails

#### Scenario: Overlength reference

- GIVEN `mpPaymentId` with 33 digits
- WHEN parsed
- THEN validation fails

### Requirement: MP Preference ID Format

The system MUST accept `mpPreferenceId` only as 1–64 non-empty chars when
present, and MUST reject empty or overlength values.

#### Scenario: Valid preference

- GIVEN `mpPreferenceId: "pref_01K7"`
- WHEN parsed
- THEN validation succeeds

#### Scenario: Empty or overlength preference

- GIVEN `mpPreferenceId: ""` or 65 chars
- WHEN parsed
- THEN validation fails
