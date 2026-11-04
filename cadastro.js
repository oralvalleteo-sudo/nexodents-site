import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.NEXODENT_PUBLIC_CONFIG || {};
const ready = /^https:\/\/[^\s]+$/.test(cfg.supabaseUrl || '') && !!cfg.supabaseAnonKey;
const $ = (id) => document.getElementById(id);
const button = $('submit');
const msg = $('message');
const val = (id) => $(id).value.trim();
const setMsg = (value, bad = false) => {
  msg.textContent = value;
  msg.className = bad ? 'error' : 'ok';
};
const showActivation = (email = '') => {
  $('activate').classList.remove('hidden');
  if (email) $('login-email').value = email;
};

// A ativação deve permanecer acessível após o retorno do e-mail.
showActivation();

// Inserção discreta do reenvio sem exigir alterações em cadastro.html.
const resendBox = document.createElement('div');
resendBox.style.marginTop = '18px';
resendBox.innerHTML = `
  <p style="font-size:14px;line-height:1.5;margin:0 0 10px">Não recebeu a confirmação ou o link expirou?</p>
  <button id="resend-confirmation" type="button" style="width:100%;background:transparent;color:#f27724;border:1px solid #f27724;border-radius:10px;padding:13px;font-weight:750;cursor:pointer">Reenviar e-mail de confirmação</button>
  <p id="resend-status" role="status" aria-live="polite" style="font-size:13px;line-height:1.5;white-space:pre-wrap"></p>`;
$('activate').appendChild(resendBox);
const resendButton = $('resend-confirmation');
const resendStatus = $('resend-status');
const confirmationRedirect = () => new URL('cadastro.html', window.location.href).origin + new URL('cadastro.html', window.location.href).pathname;
const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
if (params.get('error_code') === 'otp_expired') {
  resendStatus.textContent = 'O link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail abaixo.';
  resendStatus.className = 'error';
  // Remover apenas os parâmetros de erro para não exibir o mesmo aviso a cada recarga.
  history.replaceState(null, '', window.location.pathname + window.location.search);
}


let client = null;
if (ready) {
  try {
    client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    button.disabled = false;
    $('config-warning').classList.add('hidden');
  } catch (err) {
    setMsg('Não foi possível iniciar a conexão de cadastro. Verifique a configuração pública.', true);
  }
}

resendButton.addEventListener('click', async () => {
  if (!client) {
    resendStatus.textContent = 'Conexão não configurada. Abra a página pelo servidor local e confira config-public.js.';
    return;
  }
  const email = val('login-email').toLowerCase() || val('email').toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    resendStatus.textContent = 'Informe seu e-mail no campo “Já confirmou o e-mail?” antes de reenviar.';
    return;
  }
  resendButton.disabled = true;
  resendStatus.textContent = 'Solicitando novo e-mail de confirmação...';
  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: confirmationRedirect() }
    });
    if (error) throw error;
    resendStatus.textContent = 'Solicitação enviada. Confira sua caixa de entrada e spam. Use o link mais recente; ele pode demorar alguns minutos.';
    resendStatus.className = 'ok';
  } catch (err) {
    const message = err?.message || 'erro desconhecido';
    resendStatus.textContent = /rate.limit|after \d+ seconds|too many requests/i.test(message)
      ? 'Aguarde um pouco antes de solicitar outro e-mail. ' + message
      : 'Não foi possível reenviar: ' + message;
    resendStatus.className = 'error';
  } finally {
    resendButton.disabled = false;
  }
});

// Uma solicitação já existente não deve impedir o usuário de tentar concluir
// a autenticação; a ativação continua protegida pelas verificações do banco.
$('signup').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!client) return;
  button.disabled = true;
  const email = val('email').toLowerCase();
  try {
    setMsg('Preparando seu cadastro...');
    const { error: requestError } = await client.rpc('nexodent_request_trial', {
      p_nome: val('name'),
      p_clinica: val('clinic'),
      p_email: email,
      p_whatsapp: val('phone')
    });
    if (requestError) {
      // Não contornar outras falhas: apenas informar que uma solicitação
      // anterior pode existir e permitir a ativação manual, se aplicável.
      showActivation(email);
      throw new Error('Não foi possível registrar a solicitação. Se você já se cadastrou, confirme seu e-mail e tente “Entrar e ativar 7 dias”. Detalhe: ' + requestError.message);
    }
    setMsg('Solicitação registrada. Criando sua conta...');
    const { data, error: signupError } = await client.auth.signUp({
      email,
      password: $('password').value,
      options: { emailRedirectTo: new URL('cadastro.html', window.location.href).href }
    });
    if (signupError) throw signupError;
    showActivation(email);
    if (data?.session) {
      setMsg('Conta autenticada. Se o e-mail já estiver confirmado, use “Entrar e ativar 7 dias”.');
    } else {
      setMsg('Confira sua caixa de entrada e spam. Após confirmar o e-mail, volte aqui e selecione “Entrar e ativar 7 dias”.');
    }
  } catch (err) {
    setMsg('Não foi possível concluir: ' + (err.message || 'erro desconhecido'), true);
  } finally {
    button.disabled = false;
  }
});

$('activate-btn').addEventListener('click', async () => {
  if (!client) return;
  const btn = $('activate-btn');
  const email = val('login-email');
  const password = $('login-password').value;
  if (!email || !password) {
    setMsg('Informe o e-mail e a senha para ativar o teste.', true);
    return;
  }
  btn.disabled = true;
  try {
    setMsg('Verificando sua conta...');
    const { error: loginError } = await client.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    const { data: userResult, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!userResult?.user?.email_confirmed_at) {
      throw new Error('Confirme seu e-mail antes de ativar o teste.');
    }
    const { data, error } = await client.rpc('nexodent_activate_self_service_trial');
    if (error) throw error;
    if (!data?.ok) throw new Error('A ativação não foi confirmada.');
    const appUrl = cfg.appUrl || '';
    setMsg('Teste de 7 dias ativado! ' + (/^https:\/\//.test(appUrl) ? 'Abrindo o NexoDent...' : 'O endereço do NexoDent ainda precisa ser configurado.'));
    if (/^https:\/\//.test(appUrl)) setTimeout(() => window.location.assign(appUrl), 1800);
  } catch (err) {
    setMsg('Não foi possível ativar: ' + (err.message || 'erro desconhecido'), true);
  } finally {
    btn.disabled = false;
  }
});

if (client) {
  client.auth.getSession().then(({ data, error }) => {
    if (!error && data?.session) showActivation(data.session.user?.email || '');
  }).catch(() => {});
}
