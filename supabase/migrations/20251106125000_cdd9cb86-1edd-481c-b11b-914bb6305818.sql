-- Add confidence score columns to validation_results table
ALTER TABLE validation_results
ADD COLUMN technologies_confidence numeric DEFAULT 0 CHECK (technologies_confidence >= 0 AND technologies_confidence <= 100),
ADD COLUMN materials_confidence numeric DEFAULT 0 CHECK (materials_confidence >= 0 AND materials_confidence <= 100),
ADD COLUMN location_confidence numeric DEFAULT 0 CHECK (location_confidence >= 0 AND location_confidence <= 100);