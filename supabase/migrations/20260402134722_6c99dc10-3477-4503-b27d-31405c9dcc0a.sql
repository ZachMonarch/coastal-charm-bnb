-- Remove sensitive tables from Realtime publication
-- Using DO block to handle cases where tables may not be in publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE bookings;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE vendor_bids;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE transactions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;