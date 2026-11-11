const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('seleção rejeita plano/ciclo adulterados e funciona sem armazenamento do navegador',()=>{
 const context={window:{NEXODENT_PUBLIC_CONFIG:{}},location:{search:'?plano=../../admin&ciclo=gratuito'},localStorage:{getItem(){throw Error('Armazenamento bloqueado')}},URLSearchParams,fetch:async()=>({ok:true,json:async()=>[]}),document:{querySelectorAll:()=>[],querySelector:()=>null}};
 vm.runInNewContext(fs.readFileSync('catalogo.js','utf8'),context);
 const selection=context.window.NexodentCatalog.choice();assert.equal(selection.plan,'gratis');assert.equal(selection.cycle,'monthly');
});
test('scripts do site são locais e páginas mantêm política de conteúdo e referências válidas',()=>{
 for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(file,'utf8');assert.match(html,/http-equiv="Content-Security-Policy"/);assert.match(html,/name="referrer"/);
 for(const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)){const src=match[1].split('?')[0];assert.ok(!/^(?:https?:)?\/\//.test(src),'JavaScript remoto em '+file);assert.ok(fs.existsSync(path.resolve(src)),'Script ausente '+src);}
 }
});
test('domínio do sistema é consistente e SDK não usa versão flutuante',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('config-public.js','utf8'),context);assert.equal(context.window.NEXODENT_PUBLIC_CONFIG.appUrl,'https://app.nexodents.com.br');
 assert.match(fs.readFileSync('cadastro.html','utf8'),/vendor\/supabase-2\.119\.0\.js/);assert.ok(!fs.readFileSync('cadastro.js','utf8').includes('https://cdn.jsdelivr.net'));
});
