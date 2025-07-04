ALTER TABLE public.saved_coffees DROP CONSTRAINT saved_coffees_coffee_id_fkey;

ALTER TABLE public.saved_coffees ADD CONSTRAINT saved_coffees_coffee_id_fkey
  FOREIGN KEY (coffee_id)
  REFERENCES public.coffees (id)
  ON DELETE CASCADE; 