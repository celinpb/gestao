// =============================================================================
// auth.js — Gerenciamento de sessão com Supabase Auth
// SGE · CELINPB — GitHub Pages
// =============================================================================
// MUDANÇAS EM RELAÇÃO À VERSÃO ANTERIOR (Apps Script):
//   • Token JWT gerenciado pelo Supabase Auth (não mais pelo CacheService)
//   • Sessão persiste automaticamente via Supabase JS SDK
//   • Dados do perfil SGE (papel, nome, external_id) carregados da tabela usuarios
//
// TEMPO DE SESSÃO (06/10): 30 minutos de INATIVIDADE, como no sistema antigo
// (M1.SESSAO.DURACAO_MINUTOS = 30, com renovação a cada uso). Cada chamada
// bem-sucedida ao banco (postApi → _ok em api.js) chama Auth.renovar() e o
// prazo volta a 30 minutos; o contador no canto superior direito mostra o
// tempo restante. Ao chegar a zero, index.html encerra a sessão. Se a página
// for reaberta depois do prazo (aba fechada, computador desligado), index.html
// também encerra a sessão em vez de entrar direto.
// =============================================================================

var Auth = (function () {
  var CHAVE_USUARIO  = 'sge_usuario';   // perfil SGE do usuário logado
  var CHAVE_DURACAO  = 'sge_sessao_duracao_seg';
  var CHAVE_EXPIRA   = 'sge_sessao_expira_em';
  var SESSAO_MINUTOS = 30; // tempo máximo sem uso antes de a sessão expirar

  return {

    SESSAO_SEGUNDOS: SESSAO_MINUTOS * 60,

    // ── Salvar perfil SGE após login ────────────────────────────────────────
    salvar: function (usuario) {
      try {
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
        this.definirDuracao(SESSAO_MINUTOS * 60);
      } catch (e) {
        console.error('Auth.salvar erro:', e);
      }
    },

    // ── Retorna o perfil SGE salvo (papel, nome, id, etc.) ─────────────────
    getUsuario: function () {
      try {
        var json = localStorage.getItem(CHAVE_USUARIO);
        return json ? JSON.parse(json) : null;
      } catch (e) {
        return null;
      }
    },

    // ── Retorna o papel do usuário logado ───────────────────────────────────
    getPapel: function () {
      var u = this.getUsuario();
      return u ? u.papel : null;
    },

    // ── Verifica se há sessão Supabase ativa ────────────────────────────────
    // Assíncrono — usa o SDK para verificar o JWT atual
    temSessao: async function () {
      try {
        var sb = window._supabase;
        if (!sb) return false;
        var res = await sb.auth.getSession();
        return !!(res.data && res.data.session);
      } catch (e) {
        return false;
      }
    },

    // ── Limpa sessão local (logout) ─────────────────────────────────────────
    limpar: function () {
      try {
        localStorage.removeItem(CHAVE_USUARIO);
        localStorage.removeItem(CHAVE_DURACAO);
        localStorage.removeItem(CHAVE_EXPIRA);
      } catch (e) {}
    },

    // ── Cronômetro de sessão ────────────────────────────────────────────────
    // A duração é sempre limitada a SESSAO_MINUTOS, mesmo que algum valor
    // antigo maior (ex.: 120 min de uma versão anterior) esteja guardado.
    definirDuracao: function (segundos) {
      if (!segundos || segundos <= 0) return;
      segundos = Math.min(segundos, SESSAO_MINUTOS * 60);
      try {
        localStorage.setItem(CHAVE_DURACAO, String(segundos));
      } catch (e) {}
      this.renovar();
    },

    renovar: function () {
      try {
        var duracao = Number(localStorage.getItem(CHAVE_DURACAO));
        if (!duracao || duracao <= 0) return;
        duracao = Math.min(duracao, SESSAO_MINUTOS * 60);
        localStorage.setItem(CHAVE_EXPIRA, String(Date.now() + duracao * 1000));
      } catch (e) {}
    },

    getSegundosRestantes: function () {
      try {
        var expiraEm = Number(localStorage.getItem(CHAVE_EXPIRA));
        if (!expiraEm) return null;
        var restante = Math.round((expiraEm - Date.now()) / 1000);
        // Prazo guardado por uma versão anterior (120 min) não passa de 30.
        restante = Math.min(restante, SESSAO_MINUTOS * 60);
        return restante > 0 ? restante : 0;
      } catch (e) {
        return null;
      }
    },
  };
}());
