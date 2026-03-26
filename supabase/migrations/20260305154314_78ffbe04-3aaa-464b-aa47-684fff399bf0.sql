CREATE TRIGGER on_supplier_application_insert
  AFTER INSERT ON public.supplier_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_signup_event();