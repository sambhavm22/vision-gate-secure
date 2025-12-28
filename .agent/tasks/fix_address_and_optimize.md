# Task: Fix Address Selection Error and Optimize Performance

## Status
- [x] Analyze `addresses` schema and frontend error
- [x] Add `lat` and `lng` columns to `addresses` table via migration
- [x] Implement trigger to sync `lat`/`lng` to `location` column for PostGIS performance
- [x] Update `AddressSelectionDialog.tsx` to correctly handle new columns
- [x] Apply `optimize_rpc_functions.sql` for requested performance improvements
- [x] Fix postal code geocoding flow (Auto-fetch on PIN blur + Save validation)


## Context
The user encountered a `PGRST204` error ("Could not find the 'lat' column") when saving an address. This was caused by the frontend trying to write to non-existent columns. Additionally, the user requested performance optimizations for the Supabase backend.

## Solution
1.  **Schema Update**: Added `lat` and `lng` columns to the `addresses` table to support the frontend's data model.
2.  **Geospatial Sync**: Created a database trigger to automatically populate the `location` (geography) column from `lat`/`lng` values. This ensures that spatial queries (like finding nearby workers) continue to work efficiently using PostGIS indexes.
3.  **Frontend Fix**: Updated `AddressSelectionDialog.tsx` to read coordinates from the new top-level columns while maintaining backward compatibility for reading.
4.  **Performance Optimization**: Applied the `optimize_rpc_functions.sql` migration to enhance `get_market_bookings` and `match_worker_for_booking` with better indexing and progressive radius search.
