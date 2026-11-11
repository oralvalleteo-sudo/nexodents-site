/* Catálogo público; preços e permissões de contratação são validados no servidor. */
(()=>{
 const cfg=window.NEXODENT_PUBLIC_CONFIG||{};
 const choice=()=>{const q=new URLSearchParams(location.search);let stored={};try{stored=JSON.parse(localStorage.getItem('nexodent_plan_choice')||'{}')}catch{};const plan=q.get('plano')||stored.plan||'gratis',cycle=q.get('ciclo')||stored.cycle||'monthly';return {plan:['gratis','basico','profissional','premium'].includes(plan)?plan:'gratis',cycle:cycle==='annual'?'annual':'monthly'};};
 const ready=fetch(cfg.supabaseUrl+'/rest/v1/rpc/nexodent_public_plans',{method:'POST',headers:{apikey:cfg.supabaseAnonKey,'Content-Type':'application/json'},body:'{}',cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Catálogo de planos indisponível');const plans=await r.json();if(!Array.isArray(plans))throw Error('Catálogo inválido');return plans;});
 ready.catch(()=>{});window.NexodentCatalog={ready,choice};
 ready.then(plans=>{for(const card of document.querySelectorAll('.nd-pricing>div')){const link=card.querySelector('a[href*="plano="]');if(!link)continue;const code=new URL(link.href).searchParams.get('plano'),p=plans.find(x=>x.code===code);if(!p)continue;const price=card.querySelector('.nd-money');if(price&&p.monthly_cents>0){price.dataset.month=(p.monthly_cents/100).toFixed(2);price.dataset.year=(p.annual_cents/100).toFixed(2)}const users=document.createElement('p');users.textContent=p.max_users+' usuário(s) ativo(s)';card.append(users);}document.querySelector('[data-billing][aria-pressed="true"]')?.click();}).catch(()=>{});
})();
