(async()=>{
 const selection=window.NexodentCatalog.choice(),format=c=>(c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 try{
 const plans=await window.NexodentCatalog.ready,p=plans.find(p=>p.code===selection.plan);if(!p)throw Error('Plano indisponível');
 try{localStorage.setItem('nexodent_plan_choice',JSON.stringify(selection));}catch{};
 document.getElementById('nd-plan-description').textContent=p.monthly_cents===0?'Plano Grátis · sem mensalidade':p.name+' · '+format(selection.cycle==='annual'?p.annual_cents:p.monthly_cents)+(selection.cycle==='annual'?' por ano':' por mês')+' · teste de 7 dias';
 document.getElementById('nd-payment-options').hidden=true;
 const title=document.querySelector('.card>h2'),tag=document.querySelector('.tag');if(p.code==='gratis'){if(title)title.textContent='Crie sua conta gratuita';if(tag)tag.textContent='Plano gratuito · sem mensalidade';}
 }catch(error){document.getElementById('nd-plan-description').textContent=error.message;document.getElementById('submit').disabled=true;}
})();
