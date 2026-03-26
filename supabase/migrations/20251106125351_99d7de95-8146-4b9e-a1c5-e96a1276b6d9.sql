-- Add overall confidence score column to validation_results table
ALTER TABLE validation_results
ADD COLUMN overall_confidence numeric DEFAULT 0 CHECK (overall_confidence >= 0 AND overall_confidence <= 100);