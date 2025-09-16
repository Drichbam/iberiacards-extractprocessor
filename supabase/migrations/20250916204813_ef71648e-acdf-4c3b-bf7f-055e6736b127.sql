-- Enable real-time updates for the shops table
ALTER TABLE public.shops REPLICA IDENTITY FULL;

-- Add the shops table to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.shops;