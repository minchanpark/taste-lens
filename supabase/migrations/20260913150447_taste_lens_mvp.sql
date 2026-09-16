-- Taste Lens isolated prefix; no pre-existing tables are modified.
create function public.tl_valid_vector(v jsonb) returns boolean language sql immutable set search_path='' as $$
 select case when jsonb_typeof(v) <> 'array' then false else jsonb_array_length(v)=6 and not exists(select 1 from jsonb_array_elements(v) x where jsonb_typeof(x)<>'number' or (x::text)::numeric not between 0 and 1) end;
$$;
create table public.tl_foods(id text primary key,name text not null,category text not null,emoji text not null,description text not null,vector jsonb not null check(public.tl_valid_vector(vector)),color text not null,vector_version text not null);
create table public.tl_menus(id text primary key,food_id text not null references public.tl_foods(id),name text not null,price integer not null check(price>=0),rating numeric not null check(rating between 0 and 5),description text not null,vector jsonb not null check(public.tl_valid_vector(vector)),claims jsonb not null,source_type text not null check(source_type in ('synthetic','manual_seed','platform')),evidence_count integer not null,unique(id,food_id));
create index tl_menus_food_idx on public.tl_menus(food_id);
create table public.tl_profiles(user_id uuid primary key references auth.users(id) on delete cascade,vector jsonb not null check(public.tl_valid_vector(vector)),responses jsonb not null check(jsonb_typeof(responses)='array' and jsonb_array_length(responses)=10),vector_version text not null default 'taste-v1.0',source text not null default 'onboarding',baseline_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.tl_orders(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,menu_id text not null,food_id text not null,vector jsonb not null check(public.tl_valid_vector(vector)),context jsonb not null,repeat_order boolean not null default false,applied boolean not null default false,created_at timestamptz not null default now(),foreign key(menu_id,food_id) references public.tl_menus(id,food_id));
create index tl_orders_user_created_idx on public.tl_orders(user_id,created_at);
create index tl_orders_menu_food_idx on public.tl_orders(menu_id,food_id);
create table public.tl_recommendations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,kind text not null check(kind in ('food','restaurant')),candidates jsonb not null,context jsonb not null,vector jsonb not null check(public.tl_valid_vector(vector)),vector_version text not null default 'taste-v1.0',created_at timestamptz not null default now());
create index tl_recommendations_user_idx on public.tl_recommendations(user_id);
create table public.tl_feedback(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,recommendation_id uuid references public.tl_recommendations(id),answer text not null check(answer in ('yes','no')),created_at timestamptz not null default now());
create index tl_feedback_user_idx on public.tl_feedback(user_id);
create index tl_feedback_rec_idx on public.tl_feedback(recommendation_id);
alter table public.tl_foods enable row level security;
alter table public.tl_menus enable row level security;
alter table public.tl_profiles enable row level security;
alter table public.tl_orders enable row level security;
alter table public.tl_recommendations enable row level security;
alter table public.tl_feedback enable row level security;
revoke all on public.tl_foods, public.tl_menus, public.tl_profiles, public.tl_orders, public.tl_recommendations, public.tl_feedback from anon, authenticated;
grant select on public.tl_foods,public.tl_menus to anon,authenticated;
grant select,insert,update on public.tl_profiles,public.tl_orders to authenticated;
grant select,insert on public.tl_recommendations,public.tl_feedback to authenticated;
create policy catalog_read on public.tl_foods for select to anon,authenticated using(true);
create policy catalog_read on public.tl_menus for select to anon,authenticated using(true);
create policy own_read on public.tl_profiles for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.tl_profiles for insert to authenticated with check((select auth.uid())=user_id);
create policy own_update on public.tl_profiles for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_read on public.tl_orders for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.tl_orders for insert to authenticated with check((select auth.uid())=user_id);
create policy own_update on public.tl_orders for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy own_read on public.tl_recommendations for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.tl_recommendations for insert to authenticated with check((select auth.uid())=user_id);
create policy own_read on public.tl_feedback for select to authenticated using((select auth.uid())=user_id);
create policy own_insert on public.tl_feedback for insert to authenticated with check((select auth.uid())=user_id and (recommendation_id is null or exists(select 1 from public.tl_recommendations r where r.id=recommendation_id and r.user_id=(select auth.uid()))));
create function public.tl_save_profile(p_vector jsonb,p_responses jsonb) returns public.tl_profiles language plpgsql security invoker set search_path='' as $$
declare result public.tl_profiles;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.tl_profiles(user_id,vector,responses) values(auth.uid(),p_vector,p_responses)
 on conflict(user_id) do update set vector=excluded.vector,responses=excluded.responses,source='onboarding',baseline_at=clock_timestamp(),updated_at=clock_timestamp()
 returning * into result;
 return result;
end; $$;
create function public.tl_record_order(p_id uuid,p_menu_id text,p_context jsonb) returns public.tl_orders language plpgsql security invoker set search_path='' as $$
declare m public.tl_menus; p public.tl_profiles; result public.tl_orders;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into p from public.tl_profiles where user_id=auth.uid() for update;
 if not found then raise exception 'Complete onboarding first'; end if;
 select * into result from public.tl_orders where id=p_id and user_id=auth.uid();
 if found then return result; end if;
 if p_context->>'address' not in ('home','school','work','other') or p_context->>'time' not in ('breakfast','lunch','afternoon','dinner','late-night') or p_context->>'weather' not in ('normal','rain','hot','cold','unknown') or not(p_context ?& array['address','time','weather']) then raise exception 'Invalid context'; end if;
 select * into strict m from public.tl_menus where id=p_menu_id;
 insert into public.tl_orders(id,user_id,menu_id,food_id,vector,context,repeat_order)
 values(p_id,auth.uid(),m.id,m.food_id,(select vector from public.tl_foods where id=m.food_id),p_context,exists(select 1 from public.tl_orders where user_id=auth.uid() and menu_id=m.id and created_at>=p.baseline_at)) returning * into result;
 return result;
end; $$;
create function public.tl_apply_orders() returns public.tl_profiles language plpgsql security invoker set search_path='' as $$
declare p public.tl_profiles; o public.tl_orders; eta numeric; updated jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into strict p from public.tl_profiles where user_id=auth.uid() for update;
 for o in select * from public.tl_orders where user_id=auth.uid() and not applied and created_at>=p.baseline_at order by created_at,id for update loop
  eta:=case when o.repeat_order then .18 else .10 end;
  select jsonb_agg((1-eta)*(p.vector->>k)::numeric+eta*(o.vector->>k)::numeric order by k) into updated from generate_series(0,5) k;
  p.vector:=updated;
  update public.tl_orders set applied=true where id=o.id;
  p.source:='mixed';
 end loop;
 update public.tl_profiles set vector=p.vector,source=p.source,updated_at=clock_timestamp() where user_id=auth.uid() returning * into p;
 return p;
end; $$;
revoke execute on function public.tl_save_profile(jsonb,jsonb),public.tl_record_order(uuid,text,jsonb),public.tl_apply_orders() from public,anon;
grant execute on function public.tl_save_profile(jsonb,jsonb),public.tl_record_order(uuid,text,jsonb),public.tl_apply_orders() to authenticated;
