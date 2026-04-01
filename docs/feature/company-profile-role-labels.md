# Company Profile Role Labels

## Summary

Company user profile now displays role as human-readable text instead of a numeric code.

## What Changed

- Updated `frontend/src/app/app/profile/page.tsx` to map company role values:
  - `1` -> `Admin`
  - `2` -> `HR`
  - unknown values -> `Unknown`
- Replaced numeric role rendering in Company User Profile with the mapped label.

## Why

Numeric role IDs are internal values and unclear for users. Text labels improve clarity and reduce support friction.
