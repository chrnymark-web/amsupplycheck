-- Remove the auto-validation trigger and function for new suppliers using CASCADE
DROP FUNCTION IF EXISTS auto_validate_new_supplier() CASCADE;