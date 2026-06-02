// =============================================================================
// api.js — Comunicação com o back-end (Apps Script)
// SGE · CELINPB — GitHub Pages
// =============================================================================
// COMO FUNCIONA:
//   O Apps Script com "Executar como: eu / Qualquer pessoa" já permite
//   requisições cross-origin. O segredo é NÃO usar Content-Type: application/json
//   (que aciona um preflight OPTIONS que o Apps Script não suporta).
//   Usamos Content-Type: text/plain com JSON no corpo — o Apps Script
//   aceita e parseia normalmente, e o navegador não faz preflight.
// =============================================================================

// URL do Web App do Apps Script — NÃO altere após publicar
var API_URL = 'https://script.google.com/macros/s/AKfycbzxgk_wBLI_0-U1RZ9ikgWEPgX9XHQnTvZcY6Y8WfYol1apV6JV2ddLgWjn00T9FWqG/exec';
// ATENÇÃO: substitua pela URL /exec da sua implantação atual.
// Encontre em: Apps Script → Implantações → Gerenciar → copiar URL /exec

/**
 * Envia uma requisição ao back-end do Apps Script.
 * Usa text/plain para evitar o preflight CORS que bloquearia a requisição.
 *
 * @param {string} acao   - Nome da ação (ex: 'turmas.listar')
 * @param {Object} dados  - Dados da requisição
 * @returns {Promise<Object>} Resposta do back-end { sucesso, dados, mensagem }
 */
function postApi(acao, dados) {
  var token = Auth.getToken();
  var payload = JSON.stringify({
    acao:  acao,
    token: token,
    dados: dados || {}
  });

  return fetch(API_URL, {
    method:   'POST',
    // text/plain evita o preflight OPTIONS — o Apps Script parseia o body normalmente
    headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
    body:     payload,
    redirect: 'follow',
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Erro HTTP ' + response.status);
    }
    return response.json();
  })
  .then(function(res) {
    if (res === null || res === undefined) {
      throw new Error('Resposta nula do servidor para ação: ' + acao);
    }
    return res;
  });
}
