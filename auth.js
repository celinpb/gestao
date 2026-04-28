// =============================================================================
// auth.js — Gerenciamento de sessão
// SGE · CELINPB — GitHub Pages
// =============================================================================
// No Apps Script, a sessão ficava no CacheService do Google (getSessaoAtiva).
// No GitHub Pages, usamos localStorage — seguro porque:
//   1. Não há iframes aninhados (problema que causava falha no sessionStorage)
//   2. O domínio é fixo (github.io/celinpb) — não há risco de vazamento
//   3. O token tem expiração de 30 minutos controlada pelo back-end
// =============================================================================

var Auth = (function() {
  var CHAVE_TOKEN   = 'sge_token';
  var CHAVE_USUARIO = 'sge_usuario';

  return {
    /**
     * Salva token e dados do usuário após login bem-sucedido.
     */
    salvar: function(token, usuario) {
      try {
        localStorage.setItem(CHAVE_TOKEN,   token);
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
      } catch(e) {
        console.error('Auth.salvar erro:', e);
      }
    },

    /**
     * Retorna o token salvo ou null se não houver sessão.
     */
    getToken: function() {
      try {
        return localStorage.getItem(CHAVE_TOKEN) || null;
      } catch(e) {
        return null;
      }
    },

    /**
     * Retorna os dados do usuário logado ou null.
     */
    getUsuario: function() {
      try {
        var json = localStorage.getItem(CHAVE_USUARIO);
        return json ? JSON.parse(json) : null;
      } catch(e) {
        return null;
      }
    },

    /**
     * Remove a sessão local (usado no logout).
     */
    limpar: function() {
      try {
        localStorage.removeItem(CHAVE_TOKEN);
        localStorage.removeItem(CHAVE_USUARIO);
      } catch(e) {}
    },

    /**
     * Verifica se há uma sessão salva localmente.
     * Não valida com o servidor — use postApi('auth.verificarSessao') para isso.
     */
    temSessao: function() {
      return !!this.getToken();
    },
  };
}());
