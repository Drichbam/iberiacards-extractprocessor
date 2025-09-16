-- Create trigger to automatically update modified_at when shops are updated
CREATE TRIGGER update_shops_modified_at
    BEFORE UPDATE ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_at_column();