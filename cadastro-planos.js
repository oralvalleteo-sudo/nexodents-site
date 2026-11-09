(()=>{
 const prices={gratis:[0,0],basico:[39.90,383.04],profissional:[79.90,767.04],premium:[119.90,1151.04]};
 const qs=new URLSearchParams(location.search),p=prices[qs.get('plano')]?qs.get('plano'):'gratis';
 const annual=qs.get('ciclo')==='annual'&&p!=='gratis';
 const format=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const name={gratis:'Free',basico:'Básico',profissional:'Profissional',premium:'Premium'}[p];
 document.getElementById('nd-plan-description').textContent=p==='gratis'?'Plano Free · gratuito':annual?`${name} · ${format(prices[p][1])} por ano (20% de desconto), equivalente a ${format(prices[p][1]/12)} por mês`:`${name} · ${format(prices[p][0])} por mês`;
 const opts=document.getElementById('nd-payment-options');opts.hidden=!annual;
 const choice=document.getElementById('nd-payment-choice');
 if(qs.get('pagamento')==='parcelado')choice.value='parcelado';
 const sync=()=>{const url=new URL(location.href);if(annual)url.searchParams.set('pagamento',choice.value);history.replaceState(null,'',url)};
 choice.addEventListener('change',sync);
})();
