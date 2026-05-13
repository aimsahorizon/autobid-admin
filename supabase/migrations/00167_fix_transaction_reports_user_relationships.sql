-- Align transaction_reports with the app-owned users table so embeds resolve in PostgREST.
-- The reports admin UI joins reporter/reported_user through public.users, not auth.users.

ALTER TABLE public.transaction_reports
  DROP CONSTRAINT IF EXISTS transaction_reports_reporter_id_fkey,
  DROP CONSTRAINT IF EXISTS transaction_reports_reported_user_id_fkey;

ALTER TABLE public.transaction_reports
  ADD CONSTRAINT transaction_reports_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.users(id),
  ADD CONSTRAINT transaction_reports_reported_user_id_fkey
    FOREIGN KEY (reported_user_id) REFERENCES public.users(id);
