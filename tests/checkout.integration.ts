import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createClient} from '@supabase/supabase-js';
process.loadEnvFile('.env.local');process.loadEnvFile('.env.test.local');
const create=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});
test('checkout derives prices on server, saves quantity, rejects invalid quantities and keeps users isolated',async()=>{
 const a=create(),b=create();const login=await a.auth.signInWithPassword({email:process.env.TEST_EMAIL!,password:process.env.TEST_PASSWORD!});assert.equal(login.error,null);const other=await b.auth.signInWithPassword({email:process.env.TEST_OTHER_EMAIL!,password:process.env.TEST_OTHER_PASSWORD!});assert.equal(other.error,null);
 const id=crypto.randomUUID(),args={p_id:id,p_menu_id:'pizza-1',p_quantity:2,p_mode:'pickup',p_context:{address:'home',time:'dinner',weather:'normal'}};
 const responses=await Promise.all([a.rpc('tl_checkout',args),a.rpc('tl_checkout',args)]);responses.forEach(r=>assert.equal(r.error,null));assert.equal(responses[0].data.id,responses[1].data.id);assert.equal(responses[0].data.total,responses[0].data.unit_price*2);assert.equal(responses[0].data.delivery_fee,0);
 const rows=await a.from('tl_orders').select('id').eq('id',id);assert.equal(rows.data?.length,1);
 const stolen=await b.from('tl_checkouts').select('*').eq('id',id);assert.deepEqual(stolen.data,[]);
 const invalid=await a.rpc('tl_checkout',{...args,p_id:crypto.randomUUID(),p_quantity:11});assert.ok(invalid.error);
 const invalidContext=await a.rpc('tl_checkout',{...args,p_id:crypto.randomUUID(),p_context:{address:null,time:'dinner',weather:'normal'}});assert.ok(invalidContext.error);
 const replay=await a.rpc('tl_checkout',{...args,p_quantity:3});assert.ok(replay.error);
 const delivery=await a.rpc('tl_checkout',{...args,p_id:crypto.randomUUID(),p_quantity:1,p_mode:'delivery'});assert.equal(delivery.data.total,delivery.data.unit_price+2000);
 await a.auth.signOut({scope:'local'});await b.auth.signOut({scope:'local'});
});
