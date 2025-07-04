ALTER TABLE public.recipes DROP CONSTRAINT recipes_coffee_id_fkey;

ALTER TABLE public.recipes ADD CONSTRAINT recipes_coffee_id_fkey
  FOREIGN KEY (coffee_id)
  REFERENCES public.coffees (id)
  ON DELETE SET NULL; 