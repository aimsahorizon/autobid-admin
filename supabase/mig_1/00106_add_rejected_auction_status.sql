-- Add 'rejected' status to auction_statuses table
-- Used when an admin rejects a listing during review (instead of cancelling)
-- 'rejected' = admin declined listing during review
-- 'cancelled' = seller-initiated or post-auction cancellation

-- 1. Update CHECK constraint to include 'rejected'
ALTER TABLE auction_statuses
  DROP CONSTRAINT IF EXISTS auction_statuses_status_name_check;

ALTER TABLE auction_statuses
  ADD CONSTRAINT auction_statuses_status_name_check
  CHECK (status_name IN (
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'scheduled',
    'live',
    'ended',
    'cancelled',
    'in_transaction',
    'sold',
    'deal_failed'
  ));

-- 2. Insert the new status row
INSERT INTO auction_statuses (status_name, display_name)
VALUES ('rejected', 'Rejected')
ON CONFLICT (status_name) DO NOTHING;

-- 3. Add rejection_reason column to auctions table
-- Displayed to the seller so they know why their listing was rejected
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN auctions.rejection_reason IS 'Reason provided by admin when rejecting a listing during review';
