#!/usr/bin/env bash
# 释放种子账号 guide_slot（内存 + 可见订单）。与 frontend/e2e/helpers/releaseSeedGuideSlot.ts 同源。
# 用法：source 后调用 release_seed_guide_slot "$API_BASE"
release_seed_guide_slot() {
  local api_base="${1:?API_BASE required}"
  api_base="${api_base%/}"
  node -e "
    const api=process.argv[1];
    const idem=()=>require('crypto').randomUUID();
    async function releaseFor(email){
      const lr=await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Test123!'})});
      if(!lr.ok) return;
      const {token}=await lr.json();
      if(!token) return;
      const or=await fetch(api+'/api/v1/orders',{headers:{Authorization:'Bearer '+token}});
      if(!or.ok) return;
      const {items=[]}=await or.json();
      for (const row of items) {
        const id=String(row.id||'').trim();
        if(!id) continue;
        const st=String(row.state||row.status||'').toLowerCase();
        const opts={method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Idempotency-Key':idem()}};
        if(st==='escrowed'){
          await fetch(api+'/api/v1/orders/'+encodeURIComponent(id)+'/confirm-completion',{...opts,body:'{}'}).catch(()=>{});
        } else if(['draft','open','created','accepted'].includes(st)){
          await fetch(api+'/api/v1/orders/'+encodeURIComponent(id)+'/cancel',{...opts,body:'{}'}).catch(()=>{});
        }
      }
    }
    (async()=>{
      await releaseFor('guide@test.com');
      await releaseFor('tourist@test.com');
    })();
  " "$api_base" >/dev/null 2>&1 || true
}
