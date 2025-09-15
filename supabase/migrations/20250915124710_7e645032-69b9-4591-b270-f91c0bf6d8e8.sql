-- Create shops table for shop category management
CREATE TABLE public.shops (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations since it's single user)
CREATE POLICY "Allow all operations on shops" 
ON public.shops 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update modified_at timestamp
CREATE OR REPLACE FUNCTION public.update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shops_modified_at
    BEFORE UPDATE ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_at_column();