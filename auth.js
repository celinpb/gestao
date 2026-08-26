// =============================================================================
// auth.js — Gerenciamento de sessão
// SGE · CELINPB — GitHub Pages
// =============================================================================
// No Apps Script, a sessão ficava no CacheService do Google (getSessaoAtiva).
// No GitHub Pages, usamos localStorage — seguro porque:
//   1. Não há iframes aninhados (problema que causava falha no sessionStorage)
//   2. O domínio é fixo (github.io/celinpb) — não há risco de vazamento
//   3. O token expira de acordo com M1.SESSAO.DURACAO_MINUTOS, controlado
//      inteiramente pelo back-end (sliding window: cada chamada autenticada
//      bem-sucedida renova o prazo). O front-end NUNCA hardcoda esse número —
//      ele recebe "duracaoSegundos" do back-end (via auth.login ou
//      auth.verificarSessao) e replica o mesmo relógio localmente, resetando
//      a cada chamada de API bem-sucedida em api.js. Isso é usado para exibir
//      o contador regressivo de sessão e fazer logout automático ao expirar.
// =============================================================================

var Auth = (function() {
  var CHAVE_TOKEN    = 'sge_token';
  var CHAVE_USUARIO  = 'sge_usuario';
  var CHAVE_DURACAO  = 'sge_sessao_duracao_seg';
  var CHAVE_EXPIRA   = 'sge_sessao_expira_em'; // timestamp (ms) absoluto

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
        localStorage.removeItem(CHAVE_DURACAO);
        localStorage.removeItem(CHAVE_EXPIRA);
      } catch(e) {}
    },

    /**
     * Verifica se há uma sessão salva localmente.
     * Não valida com o servidor — use postApi('auth.verificarSessao') para isso.
     */
    temSessao: function() {
      return !!this.getToken();
    },

    // =========================================================
    // CRONÔMETRO DE SESSÃO (contador regressivo + logout automático)
    // =========================================================

    /**
     * Define (ou atualiza) a duração da sessão informada pelo back-end
     * e já renova o relógio local a partir de agora.
     * Chamado sempre que uma resposta da API trouxer "duracaoSegundos"
     * (respostas de auth.login, auth.definirNovaSenha e auth.verificarSessao).
     *
     * @param {number} segundos
     */
    definirDuracao: function(segundos) {
      if (!segundos || segundos <= 0) return;
      try {
        localStorage.setItem(CHAVE_DURACAO, String(segundos));
      } catch(e) {}
      this.renovar();
    },

    /**
     * Renova o relógio local da sessão para "duração completa a partir de agora".
     * Deve ser chamado a cada chamada de API autenticada bem-sucedida,
     * espelhando o sliding window que o back-end já aplica no CacheService.
     * Não faz nada se a duração ainda não é conhecida (ex: antes do primeiro
     * login bem-sucedido nesta aba/dispositivo).
     */
    renovar: function() {
      try {
        var duracao = Number(localStorage.getItem(CHAVE_DURACAO));
        if (!duracao || duracao <= 0) return;
        var expiraEm = Date.now() + (duracao * 1000);
        localStorage.setItem(CHAVE_EXPIRA, String(expiraEm));
      } catch(e) {}
    },

    /**
     * Retorna quantos segundos faltam até a sessão expirar (>= 0),
     * ou null se não há informação de expiração disponível ainda.
     *
     * @returns {number|null}
     */
    getSegundosRestantes: function() {
      try {
        var expiraEm = Number(localStorage.getItem(CHAVE_EXPIRA));
        if (!expiraEm) return null;
        var restante = Math.round((expiraEm - Date.now()) / 1000);
        return restante > 0 ? restante : 0;
      } catch(e) {
        return null;
      }
    },
  };
}());
