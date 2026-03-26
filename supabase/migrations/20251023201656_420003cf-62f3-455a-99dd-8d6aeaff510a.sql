-- Enable realtime for suppliers table
ALTER TABLE public.suppliers REPLICA IDENTITY FULL;

-- Add suppliers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;