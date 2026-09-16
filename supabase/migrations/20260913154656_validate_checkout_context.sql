create or replace function public.tl_checkout(p_id uuid,p_menu_id text,p_quantity integer,p_mode text,p_context jsonb) returns public.tl_checkouts language plpgsql security invoker set search_path='' as $$
declare m public.tl_menus; result public.tl_checkouts; baseline timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_quantity is null or p_quantity not between 1 and 10 or p_mode is null or p_mode not in ('delivery','pickup') then raise exception 'Invalid checkout'; end if;
 if p_context is null or not(p_context ?& array['address','time','weather']) or coalesce(p_context->>'address','') not in ('home','school','work','other') or coalesce(p_context->>'time','') not in ('breakfast','lunch','afternoon','dinner','late-night') or coalesce(p_context->>'weather','') not in ('normal','rain','hot','cold','unknown') then raise exception 'Invalid context'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into result from public.tl_checkouts where id=p_id and user_id=auth.uid();
 if found then
  if result.menu_id<>p_menu_id or result.quantity<>p_quantity or result.mode<>p_mode then raise exception 'Request ID already used with different contents'; end if;
  return result;
 end if;
 select baseline_at into baseline from public.tl_profiles where user_id=auth.uid() for update;
 select * into strict m from public.tl_menus where id=p_menu_id;
 insert into public.tl_orders(id,user_id,menu_id,food_id,vector,context,repeat_order)
 values(p_id,auth.uid(),m.id,m.food_id,(select vector from public.tl_foods where id=m.food_id),p_context,exists(select 1 from public.tl_orders where user_id=auth.uid() and menu_id=m.id and (baseline is null or created_at>=baseline)));
 insert into public.tl_checkouts(id,user_id,menu_id,food_id,quantity,mode,unit_price,delivery_fee)
 values(p_id,auth.uid(),m.id,m.food_id,p_quantity,p_mode,m.price,case when p_mode='pickup' then 0 else 2000 end) returning * into result;
 return result;
end; $$;
revoke execute on function public.tl_checkout(uuid,text,integer,text,jsonb) from public,anon;
grant execute on function public.tl_checkout(uuid,text,integer,text,jsonb) to authenticated;
