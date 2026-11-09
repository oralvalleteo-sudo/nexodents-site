/* Escolha comercial, sem simular pagamento ou ativação de assinatura. */
(()=>{
 const plans=new Set(['gratis','basico','profissional','premium']);
 const links=[...document.querySelectorAll('a[href*="cadastro.html?plano="]')];
 let billing='monthly';
 const update=()=>links.forEach(a=>{
  const u=new URL(a.getAttribute('href'),location.href),plan=u.searchParams.get('plano');
  if(!plans.has(plan))return;
  if(plan==='gratis'){u.searchParams.delete('ciclo');u.searchParams.delete('pagamento');}
  else{u.searchParams.set('ciclo',billing);u.searchParams.set('pagamento',billing==='annual'?'avista':'mensal');}
  a.href=u.pathname.split('/').pop()+u.search;
 });
 document.querySelectorAll('[data-billing]').forEach(b=>b.addEventListener('click',()=>{billing=b.dataset.billing==='annual'?'annual':'monthly';update()}));
 update();
})();
