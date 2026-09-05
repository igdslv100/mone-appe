// MONE — Fase 1 a 8 (front-end) + Fase Final (Supabase: dados de verdade + login)

const CHAVE_ULTIMA_CONTA = "mone_ultima_conta";
const CHAVE_ULTIMO_CARTAO = "mone_ultimo_cartao";

const PALAVRAS_PAGAMENTO = ["paguei", "pago", "quitei"];
const PALAVRAS_META = ["guardei", "depositei", "poupei"];
const PALAVRAS_TRANSFERENCIA = ["transferi", "transferir", "transferência", "transferencia"];
const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CATEGORIAS = [
  { nome: "Mercado", palavras: ["mercado", "supermercado", "feira", "hortifruti"] },
  { nome: "Alimentação", palavras: ["restaurante", "lanche", "ifood", "almoço", "almoco", "jantar", "café", "cafe", "padaria"] },
  { nome: "Transporte", palavras: ["uber", "99", "gasolina", "combustível", "combustivel", "ônibus", "onibus", "metrô", "metro", "estacionamento"] },
  { nome: "Moradia", palavras: ["aluguel", "condomínio", "condominio"] },
  { nome: "Contas", palavras: ["luz", "energia", "água", "agua", "internet", "telefone", "celular", "gás", "gas"] },
  { nome: "Saúde", palavras: ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "consulta", "plano de saúde"] },
  { nome: "Lazer", palavras: ["cinema", "show", "viagem", "passeio", "streaming", "netflix"] },
  { nome: "Compras", palavras: ["roupa", "loja", "sapato", "compra"] },
  { nome: "Renda", palavras: ["freela", "freelance", "salário", "salario", "venda", "bico", "pix recebido"] },
];

const CATEGORIAS_ORCAMENTO = [...CATEGORIAS.map((c) => c.nome).filter((n) => n !== "Renda"), "Outros"];

const PALAVRAS_ENTRADA = ["recebi", "ganhei", "caiu", "entrou", "vendi"];
const PALAVRAS_SAIDA = ["gastei", "paguei", "comprei", "gasto"];

const TIPOS_CONTA_LABEL = {
  banco: "Banco",
  dinheiro: "Dinheiro",
  poupanca: "Poupança",
  investimento: "Investimento",
};

// ---------- Supabase: conexão e dados do usuário ----------

const supabaseClient = window.supabase.createClient(MONE_SUPABASE_URL, MONE_SUPABASE_ANON_KEY);

let usuarioId = null;

async function inserirLinha(tabela, linha) {
  const { error } = await supabaseClient.from(tabela).insert(linha);
  if (error) console.error(`Erro ao salvar em ${tabela}:`, error.message);
  return !error;
}

async function atualizarLinha(tabela, id, campos) {
  const { error } = await supabaseClient.from(tabela).update(campos).eq("id", id);
  if (error) console.error(`Erro ao atualizar ${tabela}:`, error.message);
  return !error;
}

async function carregarDadosDoUsuario() {
  const [contas, movimentacoes, contasFixas, pagamentos, cartoes, compras, pagamentosFaturas, orcamentos, metas, contribuicoesMetas, transferencias, receitasFixas, recebimentos, contasVariaveis] = await Promise.all([
    supabaseClient.from("contas").select("*"),
    supabaseClient.from("movimentacoes").select("*"),
    supabaseClient.from("contas_fixas").select("*"),
    supabaseClient.from("pagamentos_fixas").select("*"),
    supabaseClient.from("cartoes").select("*"),
    supabaseClient.from("compras_cartao").select("*"),
    supabaseClient.from("pagamentos_faturas").select("*"),
    supabaseClient.from("orcamentos").select("*"),
    supabaseClient.from("metas").select("*"),
    supabaseClient.from("contribuicoes_metas").select("*"),
    supabaseClient.from("transferencias").select("*"),
    supabaseClient.from("receitas_fixas").select("*"),
    supabaseClient.from("recebimentos_fixos").select("*"),
    supabaseClient.from("contas_variaveis").select("*"),
  ]);

  let contasMapeadas = (contas.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: r.tipo }));

  if (contasMapeadas.length === 0) {
    const contaPadrao = { id: crypto.randomUUID(), nome: "Carteira", tipo: "dinheiro" };
    await inserirLinha("contas", { id: contaPadrao.id, user_id: usuarioId, nome: contaPadrao.nome, tipo: contaPadrao.tipo });
    contasMapeadas = [contaPadrao];
  }

  return {
    contas: contasMapeadas,
    movimentacoes: (movimentacoes.data || []).map((r) => ({
      id: r.id, contaId: r.conta_id, valor: Number(r.valor), tipo: r.tipo, categoria: r.categoria, data: r.data, descricao: r.descricao, cartaoId: r.cartao_id,
    })),
    contasFixas: (contasFixas.data || []).map((r) => ({
      id: r.id, nome: r.nome, valor: Number(r.valor), dia: r.dia, categoria: r.categoria, contaId: r.conta_id, repeticao: r.repeticao,
    })),
    pagamentos: (pagamentos.data || []).map((r) => ({ contaFixaId: r.conta_fixa_id, mesAno: r.mes_ano, movimentacaoId: r.movimentacao_id })),
    cartoes: (cartoes.data || []).map((r) => ({
      id: r.id, nome: r.nome, instituicao: r.instituicao, limite: Number(r.limite), diaFechamento: r.dia_fechamento, diaVencimento: r.dia_vencimento, contaId: r.conta_id,
    })),
    compras: (compras.data || []).map((r) => ({
      id: r.id, cartaoId: r.cartao_id, descricao: r.descricao, valorTotal: Number(r.valor_total), parcelas: r.parcelas,
      valorParcela: Number(r.valor_parcela), categoria: r.categoria, dataCompra: r.data_compra,
    })),
    pagamentosFaturas: (pagamentosFaturas.data || []).map((r) => ({ cartaoId: r.cartao_id, mesAno: r.mes_ano, movimentacaoId: r.movimentacao_id })),
    orcamentos: (orcamentos.data || []).map((r) => ({ id: r.id, categoria: r.categoria, limite: Number(r.limite) })),
    metas: (metas.data || []).map((r) => ({ id: r.id, nome: r.nome, valorAlvo: Number(r.valor_alvo), valorAtual: Number(r.valor_atual), prazo: r.prazo, contaId: r.conta_id })),
    contribuicoesMetas: (contribuicoesMetas.data || []).map((r) => ({ id: r.id, metaId: r.meta_id, valor: Number(r.valor), data: r.data })),
    transferencias: (transferencias.data || []).map((r) => ({
      id: r.id, contaOrigemId: r.conta_origem_id, contaDestinoId: r.conta_destino_id, valor: Number(r.valor), data: r.data, descricao: r.descricao,
    })),
    receitasFixas: (receitasFixas.data || []).map((r) => ({
      id: r.id, nome: r.nome, valor: Number(r.valor), dia: r.dia, categoria: r.categoria, contaId: r.conta_id, repeticao: r.repeticao,
    })),
    recebimentos: (recebimentos.data || []).map((r) => ({ receitaFixaId: r.receita_fixa_id, mesAno: r.mes_ano, movimentacaoId: r.movimentacao_id })),
    contasVariaveis: (contasVariaveis.data || []).map((r) => ({
      id: r.id, nome: r.nome, valor: Number(r.valor), categoria: r.categoria, contaId: r.conta_id,
      dataPrevista: r.data_prevista, paga: r.paga, movimentacaoId: r.movimentacao_id,
    })),
  };
}

// ---------- utilitários ----------

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataCurta(isoString) {
  const data = new Date(isoString);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function gerarId() {
  return crypto.randomUUID();
}

// ---------- interpretação da frase ----------

function extrairValor(texto) {
  const match = texto.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)(?:\s*reais)?/i);
  if (!match) return null;
  const bruto = match[1].replace(/\./g, "").replace(",", ".");
  const valor = parseFloat(bruto);
  return isNaN(valor) ? null : valor;
}

function extrairTipo(textoMinusculo) {
  if (PALAVRAS_ENTRADA.some((p) => textoMinusculo.includes(p))) return "entrada";
  if (PALAVRAS_SAIDA.some((p) => textoMinusculo.includes(p))) return "saida";
  return "saida";
}

function extrairCategoria(textoMinusculo, tipo) {
  for (const categoria of CATEGORIAS) {
    if (categoria.palavras.some((p) => textoMinusculo.includes(p))) {
      return categoria.nome;
    }
  }
  return tipo === "entrada" ? "Outras entradas" : "Outros";
}

function extrairData(textoMinusculo) {
  const hoje = new Date();
  if (textoMinusculo.includes("ontem")) {
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    return ontem.toISOString();
  }
  const matchData = textoMinusculo.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (matchData) {
    const dia = parseInt(matchData[1], 10);
    const mes = parseInt(matchData[2], 10) - 1;
    const ano = matchData[3] ? parseInt(matchData[3].length === 2 ? "20" + matchData[3] : matchData[3], 10) : hoje.getFullYear();
    const data = new Date(ano, mes, dia);
    if (!isNaN(data.getTime())) return data.toISOString();
  }
  return hoje.toISOString();
}

function extrairConta(textoMinusculo, contas) {
  const encontrada = contas.find((c) => textoMinusculo.includes(c.nome.toLowerCase()));
  if (encontrada) return encontrada.id;

  const ultimaConta = localStorage.getItem(CHAVE_ULTIMA_CONTA);
  if (ultimaConta && contas.some((c) => c.id === ultimaConta)) return ultimaConta;

  return contas[0].id;
}

// ---------- transferência entre contas ----------

async function registrarTransferencia(contaOrigemId, contaDestinoId, valor, data, descricao, contexto) {
  const transferencia = {
    id: gerarId(),
    contaOrigemId,
    contaDestinoId,
    valor,
    data: data || new Date().toISOString(),
    descricao: descricao || "",
  };

  contexto.transferencias = [transferencia, ...contexto.transferencias];
  await inserirLinha("transferencias", {
    id: transferencia.id, user_id: usuarioId, conta_origem_id: contaOrigemId, conta_destino_id: contaDestinoId,
    valor, data: transferencia.data, descricao: transferencia.descricao,
  });

  return transferencia;
}

function tentarRegistrarTransferencia(textoOriginal, textoMinusculo, contexto) {
  const ehTransferencia = PALAVRAS_TRANSFERENCIA.some((p) => textoMinusculo.includes(p));
  if (!ehTransferencia) return null;

  if (contexto.contas.length < 2) return { erro: "Você precisa ter pelo menos duas contas cadastradas pra transferir entre elas." };

  const valor = extrairValor(textoMinusculo);
  if (valor === null) return { erro: "Não consegui achar o valor da transferência 🤔" };

  const contasEncontradas = contexto.contas.filter((c) => textoMinusculo.includes(c.nome.toLowerCase()));
  if (contasEncontradas.length < 2) {
    return { erro: "Preciso saber a conta de origem e a de destino — tenta algo como \"transferi R$100 do Nubank pra poupança\"." };
  }

  const posicoes = contasEncontradas.map((c) => ({ conta: c, posicao: textoMinusculo.indexOf(c.nome.toLowerCase()) })).sort((a, b) => a.posicao - b.posicao);
  const origem = posicoes[0].conta;
  const destino = posicoes[1].conta;

  if (origem.id === destino.id) return { erro: "A conta de origem e destino não podem ser a mesma." };

  return { origem, destino, valor };
}

function interpretarFrase(textoOriginal, contas) {
  const texto = textoOriginal.trim();
  const textoMinusculo = texto.toLowerCase();

  const valor = extrairValor(textoMinusculo);
  const tipo = extrairTipo(textoMinusculo);
  const categoria = extrairCategoria(textoMinusculo, tipo);
  const data = extrairData(textoMinusculo);
  const contaId = extrairConta(textoMinusculo, contas);

  return { valor, tipo, categoria, data, contaId, descricao: texto };
}

// ---------- cálculos ----------

function saldoDaConta(contaId, movimentacoes, transferencias = []) {
  const saldoMovimentacoes = movimentacoes
    .filter((m) => m.contaId === contaId)
    .reduce((soma, m) => soma + (m.tipo === "entrada" ? m.valor : -m.valor), 0);

  const saldoTransferencias = transferencias.reduce((soma, t) => {
    if (t.contaOrigemId === contaId) return soma - t.valor;
    if (t.contaDestinoId === contaId) return soma + t.valor;
    return soma;
  }, 0);

  return saldoMovimentacoes + saldoTransferencias;
}

function nomeDaConta(contaId, contas) {
  const conta = contas.find((c) => c.id === contaId);
  return conta ? conta.nome : "Carteira";
}

// ---------- contas fixas ----------

function mesAnoDe(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

function estaPaga(contaFixaId, mesAno, pagamentos) {
  return pagamentos.some((p) => p.contaFixaId === contaFixaId && p.mesAno === mesAno);
}

function statusContaFixa(contaFixa, mesAno, pagamentos, hoje) {
  if (estaPaga(contaFixa.id, mesAno, pagamentos)) return "paga";
  const [ano, mes] = mesAno.split("-").map(Number);
  const diaLimite = Math.min(contaFixa.dia, diasNoMes(ano, mes - 1));
  const vencimento = new Date(ano, mes - 1, diaLimite);
  return hoje > vencimento ? "atrasada" : "pendente";
}

async function pagarContaFixa(contaFixa, mesAno, contexto) {
  const nova = {
    id: gerarId(),
    valor: contaFixa.valor,
    tipo: "saida",
    categoria: contaFixa.categoria || "Contas",
    data: new Date().toISOString(),
    contaId: contaFixa.contaId,
    descricao: `${contaFixa.nome} (conta fixa)`,
  };

  contexto.movimentacoes = [nova, ...contexto.movimentacoes];
  await inserirLinha("movimentacoes", {
    id: nova.id, user_id: usuarioId, conta_id: nova.contaId, valor: nova.valor, tipo: nova.tipo,
    categoria: nova.categoria, data: nova.data, descricao: nova.descricao,
  });

  const pagamento = { contaFixaId: contaFixa.id, mesAno, movimentacaoId: nova.id };
  contexto.pagamentos = [...contexto.pagamentos, pagamento];
  await inserirLinha("pagamentos_fixas", {
    user_id: usuarioId, conta_fixa_id: pagamento.contaFixaId, mes_ano: pagamento.mesAno, movimentacao_id: pagamento.movimentacaoId,
  });
}

// ---------- contas variáveis (sem dia fixo, não repetem todo mês) ----------

function contasVariaveisPendentes(contexto) {
  return contexto.contasVariaveis
    .filter((cv) => !cv.paga)
    .sort((a, b) => {
      if (!a.dataPrevista && !b.dataPrevista) return 0;
      if (!a.dataPrevista) return 1;
      if (!b.dataPrevista) return -1;
      return new Date(a.dataPrevista) - new Date(b.dataPrevista);
    });
}

async function pagarContaVariavel(contaVariavel, contexto) {
  const nova = {
    id: gerarId(),
    valor: contaVariavel.valor,
    tipo: "saida",
    categoria: contaVariavel.categoria || "Outros",
    data: new Date().toISOString(),
    contaId: contaVariavel.contaId,
    descricao: `${contaVariavel.nome} (conta variável)`,
  };

  contexto.movimentacoes = [nova, ...contexto.movimentacoes];
  await inserirLinha("movimentacoes", {
    id: nova.id, user_id: usuarioId, conta_id: nova.contaId, valor: nova.valor, tipo: nova.tipo,
    categoria: nova.categoria, data: nova.data, descricao: nova.descricao,
  });

  contaVariavel.paga = true;
  contaVariavel.movimentacaoId = nova.id;
  await atualizarLinha("contas_variaveis", contaVariavel.id, { paga: true, movimentacao_id: nova.id });
}

function tentarPagarContaVariavelPorTexto(textoMinusculo, contexto) {
  const contemPagamento = PALAVRAS_PAGAMENTO.some((p) => textoMinusculo.includes(p));
  if (!contemPagamento) return null;

  const contaVariavel = contexto.contasVariaveis.find((cv) => !cv.paga && textoMinusculo.includes(cv.nome.toLowerCase()));
  if (!contaVariavel) return null;

  pagarContaVariavel(contaVariavel, contexto);
  return contaVariavel;
}

// ---------- receitas fixas ----------

function receitaEstaRecebida(receitaFixaId, mesAno, recebimentos) {
  return recebimentos.some((r) => r.receitaFixaId === receitaFixaId && r.mesAno === mesAno);
}

function statusReceitaFixa(receitaFixa, mesAno, recebimentos, hoje) {
  if (receitaEstaRecebida(receitaFixa.id, mesAno, recebimentos)) return "paga";
  const [ano, mes] = mesAno.split("-").map(Number);
  const diaLimite = Math.min(receitaFixa.dia, diasNoMes(ano, mes - 1));
  const vencimento = new Date(ano, mes - 1, diaLimite);
  return hoje > vencimento ? "atrasada" : "pendente";
}

async function receberReceitaFixa(receitaFixa, mesAno, contexto) {
  const nova = {
    id: gerarId(),
    valor: receitaFixa.valor,
    tipo: "entrada",
    categoria: receitaFixa.categoria || "Renda",
    data: new Date().toISOString(),
    contaId: receitaFixa.contaId,
    descricao: `${receitaFixa.nome} (receita fixa)`,
  };

  contexto.movimentacoes = [nova, ...contexto.movimentacoes];
  await inserirLinha("movimentacoes", {
    id: nova.id, user_id: usuarioId, conta_id: nova.contaId, valor: nova.valor, tipo: nova.tipo,
    categoria: nova.categoria, data: nova.data, descricao: nova.descricao,
  });

  const recebimento = { receitaFixaId: receitaFixa.id, mesAno, movimentacaoId: nova.id };
  contexto.recebimentos = [...contexto.recebimentos, recebimento];
  await inserirLinha("recebimentos_fixos", {
    user_id: usuarioId, receita_fixa_id: recebimento.receitaFixaId, mes_ano: recebimento.mesAno, movimentacao_id: recebimento.movimentacaoId,
  });
}

function tentarReceberReceitaFixaPorTexto(textoMinusculo, contexto) {
  const contemRecebimento = PALAVRAS_ENTRADA.some((p) => textoMinusculo.includes(p));
  if (!contemRecebimento) return null;

  const mesAno = mesAnoDe(new Date());
  const receitaFixa = contexto.receitasFixas.find((rf) => {
    if (receitaEstaRecebida(rf.id, mesAno, contexto.recebimentos)) return false;
    return textoMinusculo.includes(rf.nome.toLowerCase());
  });

  if (!receitaFixa) return null;

  receberReceitaFixa(receitaFixa, mesAno, contexto);
  return receitaFixa;
}

function receitasFixasPendentesDoMes(contexto) {
  const hoje = new Date();
  const mesAno = mesAnoDe(hoje);
  return contexto.receitasFixas
    .map((rf) => ({ rf, status: statusReceitaFixa(rf, mesAno, contexto.recebimentos, hoje) }))
    .filter((item) => item.status !== "paga")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "atrasada" ? -1 : 1;
      return a.rf.dia - b.rf.dia;
    });
}

// ---------- cartões e faturas ----------

function addMesesAMesAno(mesAno, n) {
  let [ano, mes] = mesAno.split("-").map(Number);
  mes = mes - 1 + n;
  ano += Math.floor(mes / 12);
  mes = ((mes % 12) + 12) % 12;
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function mesAnoInicialCompra(compra, diaFechamento) {
  const d = new Date(compra.dataCompra);
  let ano = d.getFullYear();
  let mes = d.getMonth();
  if (d.getDate() > diaFechamento) {
    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
  }
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function parcelaDaCompraNoMes(compra, cartao, mesAno) {
  const inicial = mesAnoInicialCompra(compra, cartao.diaFechamento);
  for (let i = 0; i < compra.parcelas; i++) {
    if (addMesesAMesAno(inicial, i) === mesAno) return i + 1;
  }
  return null;
}

function comprasDaFatura(cartaoId, mesAno, compras, cartao) {
  return compras
    .filter((c) => c.cartaoId === cartaoId)
    .map((c) => ({ compra: c, parcela: parcelaDaCompraNoMes(c, cartao, mesAno) }))
    .filter((item) => item.parcela !== null);
}

function totalFatura(cartaoId, mesAno, compras, cartao) {
  return comprasDaFatura(cartaoId, mesAno, compras, cartao).reduce((soma, item) => soma + item.compra.valorParcela, 0);
}

function faturaEstaPaga(cartaoId, mesAno, pagamentosFaturas) {
  return pagamentosFaturas.some((p) => p.cartaoId === cartaoId && p.mesAno === mesAno);
}

function statusFatura(cartao, mesAno, pagamentosFaturas, hoje) {
  if (faturaEstaPaga(cartao.id, mesAno, pagamentosFaturas)) return "paga";
  const [ano, mes] = mesAno.split("-").map(Number);
  const diaLimite = Math.min(cartao.diaVencimento, diasNoMes(ano, mes - 1));
  const vencimento = new Date(ano, mes - 1, diaLimite);
  return hoje > vencimento ? "atrasada" : "pendente";
}

async function pagarFatura(cartao, mesAno, total, contexto) {
  const nova = {
    id: gerarId(),
    valor: total,
    tipo: "saida",
    categoria: "Cartão",
    data: new Date().toISOString(),
    contaId: cartao.contaId,
    descricao: `Fatura ${cartao.nome} (${mesAno})`,
    cartaoId: cartao.id,
  };

  contexto.movimentacoes = [nova, ...contexto.movimentacoes];
  await inserirLinha("movimentacoes", {
    id: nova.id, user_id: usuarioId, conta_id: nova.contaId, valor: nova.valor, tipo: nova.tipo,
    categoria: nova.categoria, data: nova.data, descricao: nova.descricao, cartao_id: nova.cartaoId,
  });

  const pagamento = { cartaoId: cartao.id, mesAno, movimentacaoId: nova.id };
  contexto.pagamentosFaturas = [...contexto.pagamentosFaturas, pagamento];
  await inserirLinha("pagamentos_faturas", {
    user_id: usuarioId, cartao_id: pagamento.cartaoId, mes_ano: pagamento.mesAno, movimentacao_id: pagamento.movimentacaoId,
  });
}

function limiteUsadoCartao(cartao, contexto) {
  const mesAnoAtual = mesAnoDe(new Date());
  let usado = 0;

  contexto.compras
    .filter((c) => c.cartaoId === cartao.id)
    .forEach((compra) => {
      const inicial = mesAnoInicialCompra(compra, cartao.diaFechamento);
      for (let i = 0; i < compra.parcelas; i++) {
        const mesAnoParcela = addMesesAMesAno(inicial, i);
        const jaFoiPaga = mesAnoParcela < mesAnoAtual && faturaEstaPaga(cartao.id, mesAnoParcela, contexto.pagamentosFaturas);
        if (!jaFoiPaga) usado += compra.valorParcela;
      }
    });

  return usado;
}

function proximasFaturas(cartao, contexto, quantidade = 4) {
  const hoje = new Date();
  const meses = [];
  for (let i = 0; i < quantidade; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    meses.push(mesAnoDe(data));
  }

  return meses.map((mesAno) => ({
    mesAno,
    total: totalFatura(cartao.id, mesAno, contexto.compras, cartao),
    paga: faturaEstaPaga(cartao.id, mesAno, contexto.pagamentosFaturas),
  }));
}

function totalFaturasEmAberto(contexto) {
  const mesAno = mesAnoDe(new Date());
  return contexto.cartoes.reduce((soma, cartao) => {
    if (faturaEstaPaga(cartao.id, mesAno, contexto.pagamentosFaturas)) return soma;
    return soma + totalFatura(cartao.id, mesAno, contexto.compras, cartao);
  }, 0);
}

function extrairParcelas(textoMinusculo) {
  const match = textoMinusculo.match(/(\d+)\s*(?:x\b|vezes)/);
  return match ? parseInt(match[1], 10) : 1;
}

function extrairCartaoDoTexto(textoMinusculo, cartoes, ultimoCartaoId) {
  const encontrado = cartoes.find((c) => textoMinusculo.includes(c.nome.toLowerCase()));
  if (encontrado) return encontrado;
  const ultimo = cartoes.find((c) => c.id === ultimoCartaoId);
  return ultimo || cartoes[0];
}

function tentarPagarFaturaPorTexto(textoMinusculo, contexto) {
  if (contexto.cartoes.length === 0) return null;
  const contemPagamento = PALAVRAS_PAGAMENTO.some((p) => textoMinusculo.includes(p));
  if (!contemPagamento || !textoMinusculo.includes("fatura")) return null;

  const ultimoCartaoId = localStorage.getItem(CHAVE_ULTIMO_CARTAO);
  const cartao = extrairCartaoDoTexto(textoMinusculo, contexto.cartoes, ultimoCartaoId);
  const mesAno = mesAnoDe(new Date());

  if (faturaEstaPaga(cartao.id, mesAno, contexto.pagamentosFaturas)) return null;
  const total = totalFatura(cartao.id, mesAno, contexto.compras, cartao);
  if (total <= 0) return null;

  pagarFatura(cartao, mesAno, total, contexto);
  return { cartao, total };
}

async function tentarRegistrarCompraCartao(textoOriginal, textoMinusculo, contexto) {
  if (contexto.cartoes.length === 0) return null;

  const mencionaCartao =
    textoMinusculo.includes("cartão") ||
    textoMinusculo.includes("cartao") ||
    contexto.cartoes.some((c) => textoMinusculo.includes(c.nome.toLowerCase()));
  if (!mencionaCartao) return null;

  const valor = extrairValor(textoMinusculo);
  if (valor === null) return null;

  const parcelas = extrairParcelas(textoMinusculo);
  const ultimoCartaoId = localStorage.getItem(CHAVE_ULTIMO_CARTAO);
  const cartao = extrairCartaoDoTexto(textoMinusculo, contexto.cartoes, ultimoCartaoId);
  const categoria = extrairCategoria(textoMinusculo, "saida");
  const dataCompra = extrairData(textoMinusculo);

  const compra = {
    id: gerarId(),
    descricao: textoOriginal.trim(),
    valorTotal: valor,
    parcelas,
    valorParcela: Math.round((valor / parcelas) * 100) / 100,
    cartaoId: cartao.id,
    categoria,
    dataCompra,
  };

  contexto.compras = [compra, ...contexto.compras];
  await inserirLinha("compras_cartao", {
    id: compra.id, user_id: usuarioId, cartao_id: compra.cartaoId, descricao: compra.descricao, valor_total: compra.valorTotal,
    parcelas: compra.parcelas, valor_parcela: compra.valorParcela, categoria: compra.categoria, data_compra: compra.dataCompra,
  });
  localStorage.setItem(CHAVE_ULTIMO_CARTAO, cartao.id);

  return { compra, cartao };
}

// ---------- metas ----------

function progressoMeta(meta) {
  return Math.min(100, Math.round((meta.valorAtual / meta.valorAlvo) * 100));
}

async function registrarContribuicaoMeta(meta, valor, contexto) {
  meta.valorAtual += valor;
  await atualizarLinha("metas", meta.id, { valor_atual: meta.valorAtual });

  const contribuicao = { id: gerarId(), metaId: meta.id, valor, data: new Date().toISOString() };
  contexto.contribuicoesMetas = [...contexto.contribuicoesMetas, contribuicao];
  await inserirLinha("contribuicoes_metas", {
    id: contribuicao.id, user_id: usuarioId, meta_id: contribuicao.metaId, valor: contribuicao.valor, data: contribuicao.data,
  });
}

async function tentarRegistrarMeta(textoMinusculo, contexto) {
  if (contexto.metas.length === 0) return null;

  const contemGuardar = PALAVRAS_META.some((p) => textoMinusculo.includes(p)) || textoMinusculo.includes("meta");
  if (!contemGuardar) return null;

  const meta = contexto.metas.find((m) => textoMinusculo.includes(m.nome.toLowerCase()));
  if (!meta) return null;

  const valor = extrairValor(textoMinusculo);
  if (valor === null) return null;

  await registrarContribuicaoMeta(meta, valor, contexto);

  return { meta, valor };
}

function tentarPagarContaFixaPorTexto(textoMinusculo, contexto) {
  const contemPagamento = PALAVRAS_PAGAMENTO.some((p) => textoMinusculo.includes(p));
  if (!contemPagamento) return null;

  const mesAno = mesAnoDe(new Date());
  const contaFixa = contexto.contasFixas.find((cf) => {
    if (estaPaga(cf.id, mesAno, contexto.pagamentos)) return false;
    return textoMinusculo.includes(cf.nome.toLowerCase());
  });

  if (!contaFixa) return null;

  pagarContaFixa(contaFixa, mesAno, contexto);
  return contaFixa;
}

// ---------- render: Início ----------

function calcularSaldoDisponivel(contexto) {
  const { movimentacoes } = contexto;
  const totalEntradas = movimentacoes.filter((m) => m.tipo === "entrada").reduce((soma, m) => soma + m.valor, 0);
  const totalSaidas = movimentacoes.filter((m) => m.tipo === "saida").reduce((soma, m) => soma + m.valor, 0);
  const faturasAbertas = totalFaturasEmAberto(contexto);
  return { totalEntradas, totalSaidas, faturasAbertas, saldoDisponivel: totalEntradas - totalSaidas - faturasAbertas };
}

function renderResumo(contexto) {
  const { totalEntradas, totalSaidas, faturasAbertas, saldoDisponivel } = calcularSaldoDisponivel(contexto);

  document.getElementById("saldoTotal").textContent = formatarMoeda(saldoDisponivel);
  document.getElementById("totalEntradas").textContent = formatarMoeda(totalEntradas);
  document.getElementById("totalSaidas").textContent = formatarMoeda(totalSaidas);
  document.getElementById("totalFaturasAbertas").textContent = formatarMoeda(faturasAbertas);
}

// ---------- render: Projeção ----------

function contasFixasPendentesDoMes(contexto) {
  const hoje = new Date();
  const mesAno = mesAnoDe(hoje);
  return contexto.contasFixas
    .map((cf) => ({ cf, status: statusContaFixa(cf, mesAno, contexto.pagamentos, hoje) }))
    .filter((item) => item.status !== "paga")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "atrasada" ? -1 : 1;
      return a.cf.dia - b.cf.dia;
    });
}

function calcularProjecaoAtual(contexto) {
  const { saldoDisponivel } = calcularSaldoDisponivel(contexto);
  const pendentes = contasFixasPendentesDoMes(contexto);
  const somaPendentes = pendentes.reduce((soma, item) => soma + item.cf.valor, 0);
  const receitasPendentes = receitasFixasPendentesDoMes(contexto);
  const somaReceitasPendentes = receitasPendentes.reduce((soma, item) => soma + item.rf.valor, 0);
  const variaveisPendentes = contasVariaveisPendentes(contexto);
  const somaVariaveisPendentes = variaveisPendentes.reduce((soma, cv) => soma + cv.valor, 0);
  return {
    saldoDisponivel,
    pendentes,
    somaPendentes,
    receitasPendentes,
    somaReceitasPendentes,
    variaveisPendentes,
    somaVariaveisPendentes,
    projecao: saldoDisponivel + somaReceitasPendentes - somaPendentes - somaVariaveisPendentes,
  };
}

// ---------- projeção detalhada ----------

function gerarEventosFuturos(contexto, hoje, dataFim) {
  const eventos = [];
  for (let mesOffset = 0; mesOffset <= 6; mesOffset++) {
    const dataMes = new Date(hoje.getFullYear(), hoje.getMonth() + mesOffset, 1);
    if (dataMes > dataFim) break;
    const mesAno = mesAnoDe(dataMes);
    const totalDiasMes = diasNoMes(dataMes.getFullYear(), dataMes.getMonth());

    contexto.contasFixas.forEach((cf) => {
      const dia = Math.min(cf.dia, totalDiasMes);
      const dataVenc = new Date(dataMes.getFullYear(), dataMes.getMonth(), dia);
      if (dataVenc >= hoje && dataVenc <= dataFim && !estaPaga(cf.id, mesAno, contexto.pagamentos)) {
        eventos.push({ data: dataVenc, valor: -cf.valor, label: cf.nome, tipo: "conta fixa" });
      }
    });

    contexto.receitasFixas.forEach((rf) => {
      const dia = Math.min(rf.dia, totalDiasMes);
      const dataReceb = new Date(dataMes.getFullYear(), dataMes.getMonth(), dia);
      if (dataReceb >= hoje && dataReceb <= dataFim && !receitaEstaRecebida(rf.id, mesAno, contexto.recebimentos)) {
        eventos.push({ data: dataReceb, valor: rf.valor, label: rf.nome, tipo: "receita fixa" });
      }
    });

    contexto.cartoes.forEach((cartao) => {
      const dia = Math.min(cartao.diaVencimento, totalDiasMes);
      const dataVenc = new Date(dataMes.getFullYear(), dataMes.getMonth(), dia);
      const total = totalFatura(cartao.id, mesAno, contexto.compras, cartao);
      if (dataVenc >= hoje && dataVenc <= dataFim && total > 0 && !faturaEstaPaga(cartao.id, mesAno, contexto.pagamentosFaturas)) {
        eventos.push({ data: dataVenc, valor: -total, label: `Fatura ${cartao.nome}`, tipo: "fatura" });
      }
    });
  }

  // contas variáveis são pontuais (não repetem todo mês) — cada uma entra uma única vez
  contexto.contasVariaveis.forEach((cv) => {
    if (cv.paga) return;
    const dataEvento = cv.dataPrevista ? new Date(cv.dataPrevista + "T00:00:00") : hoje;
    if (dataEvento <= dataFim) {
      const dataFinal = dataEvento < hoje ? hoje : dataEvento;
      eventos.push({ data: dataFinal, valor: -cv.valor, label: cv.nome, tipo: "conta variável" });
    }
  });

  return eventos.sort((a, b) => a.data - b.data);
}

function fimDoPeriodo(periodo, hoje) {
  if (periodo === "semana") {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (periodo === "30_dias") {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 30);
    return d;
  }
  if (periodo === "3_meses") {
    const d = new Date(hoje);
    d.setMonth(d.getMonth() + 3);
    return d;
  }
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
}

function calcularProjecaoDetalhada(contexto, periodo) {
  const hoje = new Date();
  const dataFim = fimDoPeriodo(periodo, hoje);
  const { saldoDisponivel } = calcularSaldoDisponivel(contexto);
  const eventos = gerarEventosFuturos(contexto, hoje, dataFim);

  const totalContasFuturas = eventos.filter((e) => e.tipo === "conta fixa").reduce((s, e) => s + Math.abs(e.valor), 0);
  const totalFaturasFuturas = eventos.filter((e) => e.tipo === "fatura").reduce((s, e) => s + Math.abs(e.valor), 0);
  const totalEntradasPrevistas = eventos.filter((e) => e.tipo === "receita fixa").reduce((s, e) => s + e.valor, 0);
  const totalContasVariaveis = eventos.filter((e) => e.tipo === "conta variável").reduce((s, e) => s + Math.abs(e.valor), 0);

  const mesesNoPeriodo = Math.max(1, (dataFim - hoje) / (1000 * 60 * 60 * 24 * 30));
  const totalMetas = contexto.metas.reduce((s, m) => {
    const sugestao = sugestaoMensalMeta(m);
    return s + (sugestao ? sugestao * mesesNoPeriodo : 0);
  }, 0);

  const saldoProjetado = saldoDisponivel + totalEntradasPrevistas - totalContasFuturas - totalFaturasFuturas - totalContasVariaveis - totalMetas;

  let saldoCorrente = saldoDisponivel;
  let dataFalta = null;
  let faltaValor = 0;
  eventos.forEach((ev) => {
    saldoCorrente += ev.valor;
    if (saldoCorrente < 0 && dataFalta === null) {
      dataFalta = ev.data;
      faltaValor = Math.abs(saldoCorrente);
    }
  });

  return { dataFim, saldoDisponivel, totalContasFuturas, totalFaturasFuturas, totalEntradasPrevistas, totalContasVariaveis, totalMetas, saldoProjetado, eventos, dataFalta, faltaValor };
}

function renderProjecao(contexto) {
  const { pendentes, projecao, somaReceitasPendentes, variaveisPendentes } = calcularProjecaoAtual(contexto);

  document.getElementById("projecaoValor").textContent = formatarMoeda(projecao);

  const alerta = document.getElementById("alertaProjecao");

  if (projecao >= 0 || (pendentes.length === 0 && variaveisPendentes.length === 0)) {
    alerta.hidden = true;
    return;
  }

  const falta = Math.abs(projecao);
  const itensPrioridade = [
    ...pendentes.map((item) => ({ nome: item.cf.nome, valor: item.cf.valor, extra: item.status === "atrasada" ? " (atrasada)" : "" })),
    ...variaveisPendentes.map((cv) => ({ nome: cv.nome, valor: cv.valor, extra: "" })),
  ].sort((a, b) => b.valor - a.valor);
  const prioridades = itensPrioridade
    .slice(0, 3)
    .map((item) => `<li>${escapeHtml(item.nome)} · ${formatarMoeda(item.valor)}${item.extra}</li>`)
    .join("");

  const textoReceitas = somaReceitasPendentes > 0
    ? ` (já contando ${formatarMoeda(somaReceitasPendentes)} de receitas fixas que ainda vão entrar)`
    : "";

  alerta.hidden = false;
  alerta.innerHTML = `
    <div class="alertaProjecaoTitulo">⚠️ Atenção: pode faltar ${formatarMoeda(falta)} até o fim do mês</div>
    <div class="alertaProjecaoTexto">Suas contas ainda pendentes somam mais do que você tem disponível${textoReceitas}. Prioridades:</div>
    <ul class="alertaProjecaoLista">${prioridades}</ul>
  `;
}

function renderSaldoPorConta(contas, movimentacoes, transferencias) {
  const lista = document.getElementById("listaSaldoContas");
  lista.innerHTML = contas
    .map((conta) => {
      const saldo = saldoDaConta(conta.id, movimentacoes, transferencias);
      return `
        <div class="cardSaldoConta">
          <div class="cardSaldoContaNome">${escapeHtml(conta.nome)}</div>
          <div class="cardSaldoContaValor">${formatarMoeda(saldo)}</div>
        </div>
      `;
    })
    .join("");
}

const LIMITE_HISTORICO_INICIAL = 5;
let historicoExpandido = false;

function renderHistorico(contexto) {
  const { movimentacoes, transferencias, contas } = contexto;
  const lista = document.getElementById("listaHistorico");
  const botaoMais = document.getElementById("toggleHistorico");

  const itensTransferencia = transferencias.map((t) => ({
    id: t.id,
    tipo: "transferencia",
    valor: t.valor,
    data: t.data,
    descricao: t.descricao && t.descricao.trim() ? t.descricao : `Transferência entre contas`,
    contaOrigemId: t.contaOrigemId,
    contaDestinoId: t.contaDestinoId,
  }));

  const todosItens = [...movimentacoes, ...itensTransferencia];

  if (todosItens.length === 0) {
    lista.innerHTML = '<p class="vazio">Nada por aqui ainda — registre sua primeira movimentação acima 👆</p>';
    botaoMais.hidden = true;
    return;
  }

  const ordenadas = todosItens.sort((a, b) => new Date(b.data) - new Date(a.data));
  const visiveis = historicoExpandido ? ordenadas : ordenadas.slice(0, LIMITE_HISTORICO_INICIAL);

  lista.innerHTML = visiveis
    .map((m) => {
      if (m.tipo === "transferencia") {
        return `
          <div class="itemHistorico">
            <div class="itemIcone">🔄</div>
            <div class="itemInfo">
              <div class="itemDescricao">${escapeHtml(m.descricao)}</div>
              <div class="itemMeta">${escapeHtml(nomeDaConta(m.contaOrigemId, contas))} → ${escapeHtml(nomeDaConta(m.contaDestinoId, contas))} · ${formatarDataCurta(m.data)}</div>
            </div>
            <div class="itemValor valorTransferencia">⇄ ${formatarMoeda(m.valor)}</div>
            <button type="button" class="botaoExcluirItem" data-excluir-transferencia="${m.id}" title="Apagar">✕</button>
          </div>
        `;
      }

      const sinal = m.tipo === "entrada" ? "+" : "−";
      const classeValor = m.tipo === "entrada" ? "valorEntrada" : "valorSaida";
      const icone = m.tipo === "entrada" ? "⬆️" : "⬇️";
      return `
        <div class="itemHistorico">
          <div class="itemIcone">${icone}</div>
          <div class="itemInfo">
            <div class="itemDescricao">${escapeHtml(m.descricao)}</div>
            <div class="itemMeta">${escapeHtml(m.categoria)} · ${escapeHtml(nomeDaConta(m.contaId, contas))} · ${formatarDataCurta(m.data)}</div>
          </div>
          <div class="itemValor ${classeValor}">${sinal} ${formatarMoeda(m.valor)}</div>
          <button type="button" class="botaoExcluirItem" data-excluir="${m.id}" title="Apagar">✕</button>
        </div>
      `;
    })
    .join("");

  if (ordenadas.length > LIMITE_HISTORICO_INICIAL) {
    botaoMais.hidden = false;
    botaoMais.textContent = historicoExpandido ? "mostrar menos ↑" : "mostrar mais ↓";
  } else {
    botaoMais.hidden = true;
  }
}

// ---------- histórico completo: busca, filtros, edição ----------

const filtrosHistorico = { busca: "", periodo: "todos", tipo: "todos", categoria: "todas", contaId: "todas", cartaoId: "todas" };
let ordemHistoricoDesc = true;
let itemEmEdicaoId = null;

function itensUnificadosHistorico(contexto) {
  const itensMovimentacao = contexto.movimentacoes.map((m) => ({ ...m, tipoItem: "movimentacao" }));
  const itensTransferencia = contexto.transferencias.map((t) => ({
    id: t.id,
    tipoItem: "transferencia",
    tipo: "transferencia",
    valor: t.valor,
    data: t.data,
    descricao: t.descricao && t.descricao.trim() ? t.descricao : "Transferência entre contas",
    contaOrigemId: t.contaOrigemId,
    contaDestinoId: t.contaDestinoId,
  }));
  return [...itensMovimentacao, ...itensTransferencia];
}

function dataDentroDoPeriodo(dataIso, periodo) {
  if (periodo === "todos") return true;
  const data = new Date(dataIso);
  const hoje = new Date();

  if (periodo === "este_mes") return mesAnoDe(data) === mesAnoDe(hoje);
  if (periodo === "mes_passado") {
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return mesAnoDe(data) === mesAnoDe(mesPassado);
  }
  if (periodo === "30_dias") {
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() - 30);
    return data >= limite && data <= hoje;
  }
  return true;
}

function popularFiltrosHistorico(contexto) {
  const categorias = [...new Set(contexto.movimentacoes.map((m) => m.categoria))].sort();
  const selectCategoria = document.getElementById("filtroCategoria");
  const valorAtualCategoria = selectCategoria.value;
  selectCategoria.innerHTML = '<option value="todas">Todas as categorias</option>' + categorias.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  selectCategoria.value = categorias.includes(valorAtualCategoria) ? valorAtualCategoria : "todas";

  const selectConta = document.getElementById("filtroConta");
  const valorAtualConta = selectConta.value;
  selectConta.innerHTML = '<option value="todas">Todas as contas</option>' + contexto.contas.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  selectConta.value = contexto.contas.some((c) => c.id === valorAtualConta) ? valorAtualConta : "todas";

  const selectCartao = document.getElementById("filtroCartao");
  const valorAtualCartao = selectCartao.value;
  selectCartao.innerHTML = '<option value="todas">Todos os cartões</option>' + contexto.cartoes.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  selectCartao.value = contexto.cartoes.some((c) => c.id === valorAtualCartao) ? valorAtualCartao : "todas";
}

function itemCombinaComFiltros(item) {
  if (filtrosHistorico.busca && !item.descricao.toLowerCase().includes(filtrosHistorico.busca.toLowerCase())) return false;
  if (!dataDentroDoPeriodo(item.data, filtrosHistorico.periodo)) return false;
  if (filtrosHistorico.tipo !== "todos" && item.tipo !== filtrosHistorico.tipo) return false;
  if (filtrosHistorico.categoria !== "todas" && item.categoria !== filtrosHistorico.categoria) return false;
  if (filtrosHistorico.contaId !== "todas") {
    const pertenceAConta = item.tipoItem === "transferencia"
      ? item.contaOrigemId === filtrosHistorico.contaId || item.contaDestinoId === filtrosHistorico.contaId
      : item.contaId === filtrosHistorico.contaId;
    if (!pertenceAConta) return false;
  }
  if (filtrosHistorico.cartaoId !== "todas" && item.cartaoId !== filtrosHistorico.cartaoId) return false;
  return true;
}

function renderItemEdicao(item, contexto) {
  if (item.tipoItem === "transferencia") {
    const opcoesContas = contexto.contas.map((c) => `<option value="${c.id}" ${c.id === item.contaOrigemId ? "selected" : ""}>${escapeHtml(c.nome)}</option>`).join("");
    const opcoesContasDestino = contexto.contas.map((c) => `<option value="${c.id}" ${c.id === item.contaDestinoId ? "selected" : ""}>${escapeHtml(c.nome)}</option>`).join("");
    return `
      <div class="formEditarItem" data-editando="${item.id}">
        <input type="text" data-campo="descricao" value="${escapeHtml(item.descricao)}" placeholder="Descrição" />
        <select data-campo="contaOrigemId">${opcoesContas}</select>
        <select data-campo="contaDestinoId">${opcoesContasDestino}</select>
        <input type="number" data-campo="valor" value="${item.valor}" step="0.01" min="0" />
        <input type="date" data-campo="data" value="${new Date(item.data).toISOString().slice(0, 10)}" />
        <div class="formEditarItemBotoes">
          <button type="button" class="botaoSalvarEdicao" data-salvar-transferencia="${item.id}">Salvar</button>
          <button type="button" class="botaoCancelarEdicao" data-cancelar-edicao>Cancelar</button>
        </div>
      </div>
    `;
  }

  const opcoesContas = contexto.contas.map((c) => `<option value="${c.id}" ${c.id === item.contaId ? "selected" : ""}>${escapeHtml(c.nome)}</option>`).join("");
  return `
    <div class="formEditarItem" data-editando="${item.id}">
      <input type="text" data-campo="descricao" value="${escapeHtml(item.descricao)}" placeholder="Descrição" />
      <input type="text" data-campo="categoria" value="${escapeHtml(item.categoria)}" placeholder="Categoria" />
      <select data-campo="contaId">${opcoesContas}</select>
      <input type="number" data-campo="valor" value="${item.valor}" step="0.01" min="0" />
      <input type="date" data-campo="data" value="${new Date(item.data).toISOString().slice(0, 10)}" />
      <div class="formEditarItemBotoes">
        <button type="button" class="botaoSalvarEdicao" data-salvar-movimentacao="${item.id}">Salvar</button>
        <button type="button" class="botaoCancelarEdicao" data-cancelar-edicao>Cancelar</button>
      </div>
    </div>
  `;
}

function renderHistoricoCompleto(contexto) {
  const lista = document.getElementById("listaHistoricoCompleto");
  const todosItens = itensUnificadosHistorico(contexto).filter(itemCombinaComFiltros);

  if (todosItens.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma movimentação encontrada com esses filtros.</p>';
    return;
  }

  const ordenados = todosItens.sort((a, b) => (ordemHistoricoDesc ? new Date(b.data) - new Date(a.data) : new Date(a.data) - new Date(b.data)));

  lista.innerHTML = ordenados
    .map((m) => {
      if (itemEmEdicaoId === m.id) return renderItemEdicao(m, contexto);

      if (m.tipoItem === "transferencia") {
        return `
          <div class="itemHistorico">
            <div class="itemIcone">🔄</div>
            <div class="itemInfo">
              <div class="itemDescricao">${escapeHtml(m.descricao)}</div>
              <div class="itemMeta">${escapeHtml(nomeDaConta(m.contaOrigemId, contexto.contas))} → ${escapeHtml(nomeDaConta(m.contaDestinoId, contexto.contas))} · ${formatarDataCurta(m.data)}</div>
            </div>
            <div class="itemValor valorTransferencia">⇄ ${formatarMoeda(m.valor)}</div>
            <button type="button" class="botaoEditarItem" data-editar-transferencia="${m.id}" title="Editar">✎</button>
            <button type="button" class="botaoExcluirItem" data-excluir-transferencia="${m.id}" title="Apagar">✕</button>
          </div>
        `;
      }

      const sinal = m.tipo === "entrada" ? "+" : "−";
      const classeValor = m.tipo === "entrada" ? "valorEntrada" : "valorSaida";
      const icone = m.tipo === "entrada" ? "⬆️" : "⬇️";
      return `
        <div class="itemHistorico">
          <div class="itemIcone">${icone}</div>
          <div class="itemInfo">
            <div class="itemDescricao">${escapeHtml(m.descricao)}</div>
            <div class="itemMeta">${escapeHtml(m.categoria)} · ${escapeHtml(nomeDaConta(m.contaId, contexto.contas))} · ${formatarDataCurta(m.data)}</div>
          </div>
          <div class="itemValor ${classeValor}">${sinal} ${formatarMoeda(m.valor)}</div>
          <button type="button" class="botaoEditarItem" data-editar-movimentacao="${m.id}" title="Editar">✎</button>
          <button type="button" class="botaoExcluirItem" data-excluir="${m.id}" title="Apagar">✕</button>
        </div>
      `;
    })
    .join("");
}

// ---------- render: Contas ----------

function renderContas(contas, movimentacoes, transferencias) {
  const lista = document.getElementById("listaContas");
  lista.innerHTML = contas
    .map((conta) => {
      const saldo = saldoDaConta(conta.id, movimentacoes, transferencias);
      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(conta.nome)}</div>
            <div class="cardContaTag">${TIPOS_CONTA_LABEL[conta.tipo] || conta.tipo}</div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(saldo)}</div>
        </div>
      `;
    })
    .join("");
}

// ---------- render: Contas fixas (resumo no Início) ----------

const ROTULO_STATUS = { paga: "Paga", pendente: "Pendente", atrasada: "Atrasada" };

function renderProximasFixas(contasFixas, pagamentos) {
  const alvo = document.getElementById("listaProximasFixas");
  if (contasFixas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma conta fixa cadastrada ainda.</p>';
    return;
  }

  const hoje = new Date();
  const mesAno = mesAnoDe(hoje);

  const comStatus = contasFixas
    .map((cf) => ({ cf, status: statusContaFixa(cf, mesAno, pagamentos, hoje) }))
    .sort((a, b) => a.cf.dia - b.cf.dia)
    .slice(0, 4);

  alvo.innerHTML = comStatus
    .map(({ cf, status }) => `
      <div class="cardSaldoConta cardFixaMini status-${status}">
        <div class="cardSaldoContaNome">${escapeHtml(cf.nome)}</div>
        <div class="cardSaldoContaValor">${formatarMoeda(cf.valor)}</div>
        <div class="statusFixa status-${status}">dia ${cf.dia} · ${ROTULO_STATUS[status]}</div>
      </div>
    `)
    .join("");
}

function renderContasFixas(contasFixas, pagamentos, contas) {
  const alvo = document.getElementById("listaContasFixas");
  if (contasFixas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma conta fixa cadastrada ainda — adicione abaixo.</p>';
    return;
  }

  const hoje = new Date();
  const mesAno = mesAnoDe(hoje);

  alvo.innerHTML = contasFixas
    .slice()
    .sort((a, b) => a.dia - b.dia)
    .map((cf) => {
      const status = statusContaFixa(cf, mesAno, pagamentos, hoje);
      const botao = status === "paga"
        ? ""
        : `<button class="botaoPagarFixa" data-pagar="${cf.id}">Marcar como paga</button>`;
      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(cf.nome)}</div>
            <div class="cardContaTopoAcoes">
              <div class="cardContaTag status-${status}">${ROTULO_STATUS[status]}</div>
              <button type="button" class="botaoExcluirItem" data-excluir-conta-fixa="${cf.id}" title="Apagar">✕</button>
            </div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(cf.valor)}</div>
          <div class="itemMeta">dia ${cf.dia} · ${escapeHtml(nomeDaConta(cf.contaId, contas))}</div>
          ${botao}
        </div>
      `;
    })
    .join("");
}

function renderContasVariaveis(contexto) {
  const alvo = document.getElementById("listaContasVariaveis");
  if (contexto.contasVariaveis.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma conta variável cadastrada ainda.</p>';
    return;
  }

  alvo.innerHTML = contexto.contasVariaveis
    .slice()
    .sort((a, b) => {
      if (a.paga !== b.paga) return a.paga ? 1 : -1;
      if (!a.dataPrevista && !b.dataPrevista) return 0;
      if (!a.dataPrevista) return 1;
      if (!b.dataPrevista) return -1;
      return new Date(a.dataPrevista) - new Date(b.dataPrevista);
    })
    .map((cv) => {
      const status = cv.paga ? "paga" : "pendente";
      const botao = cv.paga ? "" : `<button class="botaoPagarFixa" data-pagar-variavel="${cv.id}">Marcar como paga</button>`;
      const dataTexto = cv.dataPrevista ? formatarDataCurta(cv.dataPrevista) : "sem data definida";
      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(cv.nome)}</div>
            <div class="cardContaTopoAcoes">
              <div class="cardContaTag status-${status}">${ROTULO_STATUS[status]}</div>
              <button type="button" class="botaoExcluirItem" data-excluir-conta-variavel="${cv.id}" title="Apagar">✕</button>
            </div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(cv.valor)}</div>
          <div class="itemMeta">${escapeHtml(cv.categoria)} · ${dataTexto} · ${escapeHtml(nomeDaConta(cv.contaId, contexto.contas))}</div>
          ${botao}
        </div>
      `;
    })
    .join("");
}

function popularSelectContas(contas) {
  const opcoes = contas.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");

  const select = document.getElementById("contaPagamentoFixa");
  select.innerHTML = opcoes;

  const selectCartao = document.getElementById("contaPagamentoCartao");
  if (selectCartao) selectCartao.innerHTML = opcoes;

  const selectOrigem = document.getElementById("contaOrigemTransferencia");
  const selectDestino = document.getElementById("contaDestinoTransferencia");
  if (selectOrigem) selectOrigem.innerHTML = opcoes;
  if (selectDestino) selectDestino.innerHTML = opcoes;

  const selectMeta = document.getElementById("contaMeta");
  if (selectMeta) selectMeta.innerHTML = opcoes;

  const selectReceitaFixa = document.getElementById("contaReceitaFixa");
  if (selectReceitaFixa) selectReceitaFixa.innerHTML = opcoes;

  const selectContaVariavel = document.getElementById("contaPagamentoVariavel");
  if (selectContaVariavel) selectContaVariavel.innerHTML = opcoes;
}

// ---------- render: Cartões e fatura ----------

let cartaoAtualId = null;

function renderResumoCartoes(contexto) {
  const alvo = document.getElementById("listaResumoCartoes");
  const { cartoes, compras, pagamentosFaturas } = contexto;

  if (cartoes.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhum cartão cadastrado ainda.</p>';
    return;
  }

  const mesAno = mesAnoDe(new Date());
  const hoje = new Date();

  alvo.innerHTML = cartoes
    .map((cartao) => {
      const total = totalFatura(cartao.id, mesAno, compras, cartao);
      const status = statusFatura(cartao, mesAno, pagamentosFaturas, hoje);
      return `
        <div class="cardSaldoConta status-${status}">
          <div class="cardSaldoContaNome">${escapeHtml(cartao.nome)}</div>
          <div class="cardSaldoContaValor">${formatarMoeda(total)}</div>
          <div class="statusFixa status-${status}">${ROTULO_STATUS[status]}</div>
        </div>
      `;
    })
    .join("");
}

function renderCartoes(contexto) {
  const alvo = document.getElementById("listaCartoes");
  const { cartoes, compras, pagamentosFaturas } = contexto;

  if (cartoes.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhum cartão cadastrado ainda — adicione abaixo.</p>';
    return;
  }

  const mesAno = mesAnoDe(new Date());
  const hoje = new Date();

  alvo.innerHTML = cartoes
    .map((cartao) => {
      const total = totalFatura(cartao.id, mesAno, compras, cartao);
      const status = statusFatura(cartao, mesAno, pagamentosFaturas, hoje);
      const limiteUsado = limiteUsadoCartao(cartao, contexto);
      const limiteDisponivel = cartao.limite - limiteUsado;
      const nomeComInstituicao = cartao.instituicao ? `${cartao.nome} · ${cartao.instituicao}` : cartao.nome;
      return `
        <div class="cardConta cardCartaoClicavel" data-fatura="${cartao.id}">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(nomeComInstituicao)}</div>
            <div class="cardContaTopoAcoes">
              <div class="cardContaTag status-${status}">${ROTULO_STATUS[status]}</div>
              <button type="button" class="botaoExcluirItem" data-excluir-cartao="${cartao.id}" title="Apagar">✕</button>
            </div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(total)}</div>
          <div class="itemMeta">disponível ${formatarMoeda(limiteDisponivel)} de ${formatarMoeda(cartao.limite)} · fecha dia ${cartao.diaFechamento} · vence dia ${cartao.diaVencimento}</div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento${limiteDisponivel < 0 ? " estourada" : ""}" style="width:${Math.min(100, Math.round((limiteUsado / cartao.limite) * 100))}%"></div></div>
        </div>
      `;
    })
    .join("");
}

let mesAnoFaturaVisualizada = null;

function renderFatura(contexto) {
  if (!cartaoAtualId) return;
  const cartao = contexto.cartoes.find((c) => c.id === cartaoAtualId);
  if (!cartao) return;

  const mesAnoAtual = mesAnoDe(new Date());
  if (!mesAnoFaturaVisualizada) mesAnoFaturaVisualizada = mesAnoAtual;
  const mesAno = mesAnoFaturaVisualizada;

  const [ano, mes] = mesAno.split("-").map(Number);
  document.getElementById("faturaRotuloMes").textContent = `${NOMES_MES[mes - 1]} ${ano}`;
  document.getElementById("faturaEyebrow").textContent = mesAno === mesAnoAtual ? "Fatura do mês" : mesAno < mesAnoAtual ? "Fatura passada" : "Fatura futura";

  const itens = comprasDaFatura(cartao.id, mesAno, contexto.compras, cartao);
  const total = itens.reduce((soma, item) => soma + item.compra.valorParcela, 0);
  const status = statusFatura(cartao, mesAno, contexto.pagamentosFaturas, new Date());

  document.getElementById("tituloFatura").textContent = `Fatura · ${cartao.nome}`;
  document.getElementById("totalFatura").textContent = formatarMoeda(total);
  document.getElementById("statusFaturaTexto").textContent = `${ROTULO_STATUS[status]} · vence dia ${cartao.diaVencimento}`;

  const botaoPagar = document.getElementById("botaoPagarFatura");
  botaoPagar.hidden = status === "paga" || total <= 0 || mesAno > mesAnoAtual;

  const listaCompras = document.getElementById("listaComprasFatura");
  if (itens.length === 0) {
    listaCompras.innerHTML = '<p class="vazio">Nenhuma compra nessa fatura ainda.</p>';
  } else {
    listaCompras.innerHTML = itens
      .map(({ compra, parcela }) => `
        <div class="itemHistorico">
          <div class="itemIcone">💳</div>
          <div class="itemInfo">
            <div class="itemDescricao">${escapeHtml(compra.descricao)}</div>
            <div class="itemMeta">${escapeHtml(compra.categoria)} · parcela ${parcela}/${compra.parcelas}</div>
          </div>
          <div class="itemValor valorSaida">${formatarMoeda(compra.valorParcela)}</div>
        </div>
      `)
      .join("");
  }

  const statusAtual = statusFatura(cartao, mesAnoAtual, contexto.pagamentosFaturas, new Date());
  const proximas = proximasFaturas(cartao, contexto, 4);
  document.getElementById("listaProximasFaturas").innerHTML = proximas
    .map((f, i) => {
      const [anoCard, mesCard] = f.mesAno.split("-").map(Number);
      const rotuloMes = `${NOMES_MES[mesCard - 1]} ${anoCard}`;
      const situacao = i === 0 ? ROTULO_STATUS[statusAtual] : f.paga ? "Paga" : "Prevista";
      return `
        <button type="button" class="cardConta cardCartaoClicavel" data-ver-fatura-mes="${f.mesAno}">
          <div class="cardContaTopo">
            <div class="cardContaNome">${rotuloMes}</div>
            <div class="cardContaTag">${situacao}</div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(f.total)}</div>
        </button>
      `;
    })
    .join("");
}

// ---------- render: Calendário ----------

let modoCalendario = "mes";
let mesVisualizado = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let semanaVisualizada = inicioDaSemana(new Date());
let diaSelecionado = null;

function inicioDaSemana(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function mesmoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventosDoDia(data, contexto) {
  const { movimentacoes, contasFixas, pagamentos, cartoes, compras, pagamentosFaturas } = contexto;
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();
  const totalDias = diasNoMes(ano, mes);
  const mesAno = mesAnoDe(data);
  const eventos = [];

  movimentacoes.forEach((m) => {
    const d = new Date(m.data);
    if (mesmoDia(d, data)) {
      eventos.push({ tipo: m.tipo, label: m.descricao, valor: m.valor });
    }
  });

  contasFixas.forEach((cf) => {
    const diaLimite = Math.min(cf.dia, totalDias);
    if (diaLimite === dia) {
      const status = statusContaFixa(cf, mesAno, pagamentos, new Date());
      eventos.push({ tipo: "vencimento", label: cf.nome, valor: cf.valor, status });
    }
  });

  cartoes.forEach((cartao) => {
    const diaLimite = Math.min(cartao.diaVencimento, totalDias);
    if (diaLimite !== dia) return;
    const total = totalFatura(cartao.id, mesAno, compras, cartao);
    if (total <= 0) return;
    const status = statusFatura(cartao, mesAno, pagamentosFaturas, new Date());
    eventos.push({ tipo: "vencimento", label: `Fatura ${cartao.nome}`, valor: total, status });
  });

  return eventos;
}

function iconeEvento(evento) {
  if (evento.tipo === "entrada") return "⬆️";
  if (evento.tipo === "saida") return "⬇️";
  return "📌";
}

function renderListaEventos(eventos) {
  if (eventos.length === 0) {
    return '<p class="vazio">Nada nesse dia.</p>';
  }
  return eventos
    .map((ev) => {
      const classeValor = ev.tipo === "entrada" ? "valorEntrada" : "valorSaida";
      const extra = ev.tipo === "vencimento" ? ` · ${ROTULO_STATUS[ev.status]}` : "";
      return `
        <div class="itemHistorico itemAgenda">
          <div class="itemIcone">${iconeEvento(ev)}</div>
          <div class="itemInfo">
            <div class="itemDescricao">${escapeHtml(ev.label)}</div>
            <div class="itemMeta">${ev.tipo === "vencimento" ? "vencimento" : ev.tipo}${extra}</div>
          </div>
          <div class="itemValor ${classeValor}">${formatarMoeda(ev.valor)}</div>
        </div>
      `;
    })
    .join("");
}

function trocarModoCalendario(modo, contexto) {
  modoCalendario = modo;
  document.querySelectorAll(".botaoModo").forEach((el) => el.classList.toggle("ativo", el.dataset.modo === modo));
  document.getElementById("modoMes").hidden = modo !== "mes";
  document.getElementById("modoSemana").hidden = modo !== "semana";
  renderCalendario(contexto);
}

function renderMes(contexto) {
  const { movimentacoes, contasFixas, pagamentos } = contexto;
  const ano = mesVisualizado.getFullYear();
  const mes = mesVisualizado.getMonth();
  document.getElementById("rotuloMes").textContent = `${NOMES_MES[mes]} ${ano}`;

  const totalDias = diasNoMes(ano, mes);
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const hoje = new Date();

  const movsPorDia = {};
  movimentacoes.forEach((m) => {
    const d = new Date(m.data);
    if (d.getFullYear() === ano && d.getMonth() === mes) {
      const dia = d.getDate();
      if (!movsPorDia[dia]) movsPorDia[dia] = { entrada: false, saida: false };
      movsPorDia[dia][m.tipo] = true;
    }
  });

  const mesAnoVisualizado = mesAnoDe(mesVisualizado);
  const fixasPorDia = {};
  contasFixas.forEach((cf) => {
    const diaLimite = Math.min(cf.dia, totalDias);
    if (!fixasPorDia[diaLimite]) fixasPorDia[diaLimite] = [];
    fixasPorDia[diaLimite].push(cf);
  });

  contexto.cartoes.forEach((cartao) => {
    const diaLimite = Math.min(cartao.diaVencimento, totalDias);
    const total = totalFatura(cartao.id, mesAnoVisualizado, contexto.compras, cartao);
    if (total <= 0) return;
    if (!fixasPorDia[diaLimite]) fixasPorDia[diaLimite] = [];
    fixasPorDia[diaLimite].push(cartao);
  });

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) {
    celulas.push('<div class="diaCalendario vazio-dia"></div>');
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const movs = movsPorDia[dia] || {};
    const fixasDoDia = fixasPorDia[dia] || [];
    const dataCelula = new Date(ano, mes, dia);
    const ehHoje = mesmoDia(hoje, dataCelula);
    const ehSelecionado = diaSelecionado && mesmoDia(diaSelecionado, dataCelula);

    const pontos = [
      movs.entrada ? '<i class="pontoEntrada"></i>' : "",
      movs.saida ? '<i class="pontoSaida"></i>' : "",
      fixasDoDia.length > 0 ? '<i class="pontoVencimento"></i>' : "",
    ].join("");

    celulas.push(`
      <button type="button" class="diaCalendario${ehHoje ? " diaHoje" : ""}${ehSelecionado ? " diaSelecionado" : ""}" data-dia="${dia}">
        <span class="numeroDia">${dia}</span>
        <span class="pontosDia">${pontos}</span>
      </button>
    `);
  }

  document.getElementById("gradeCalendario").innerHTML = celulas.join("");

  const painel = document.getElementById("detalheDia");
  if (diaSelecionado && diaSelecionado.getFullYear() === ano && diaSelecionado.getMonth() === mes) {
    const eventos = eventosDoDia(diaSelecionado, contexto);
    painel.hidden = false;
    painel.innerHTML = `
      <div class="detalheDiaTitulo">${diaSelecionado.getDate()} de ${NOMES_MES[mes].toLowerCase()}</div>
      ${renderListaEventos(eventos)}
    `;
  } else {
    painel.hidden = true;
  }
}

function renderSemana(contexto) {
  const { movimentacoes, contasFixas, pagamentos } = contexto;
  const fim = new Date(semanaVisualizada);
  fim.setDate(fim.getDate() + 6);

  const mesmoMes = semanaVisualizada.getMonth() === fim.getMonth();
  const rotulo = mesmoMes
    ? `${semanaVisualizada.getDate()} – ${fim.getDate()} de ${NOMES_MES[fim.getMonth()]}`
    : `${semanaVisualizada.getDate()} de ${NOMES_MES[semanaVisualizada.getMonth()]} – ${fim.getDate()} de ${NOMES_MES[fim.getMonth()]}`;
  document.getElementById("rotuloSemana").textContent = rotulo;

  const NOMES_DIA_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const hoje = new Date();

  const blocos = [];
  for (let i = 0; i < 7; i++) {
    const data = new Date(semanaVisualizada);
    data.setDate(data.getDate() + i);
    const eventos = eventosDoDia(data, contexto);
    const ehHoje = mesmoDia(hoje, data);

    blocos.push(`
      <div class="blocoDiaSemana${ehHoje ? " diaHoje" : ""}">
        <div class="blocoDiaSemanaTitulo">
          <span>${NOMES_DIA_SEMANA[i]}</span>
          <span>${data.getDate()}/${data.getMonth() + 1}</span>
        </div>
        ${eventos.length > 0 ? renderListaEventos(eventos) : '<p class="vazio vazioSemana">Nada nesse dia.</p>'}
      </div>
    `);
  }

  document.getElementById("listaSemana").innerHTML = blocos.join("");
}

function renderCalendario(contexto) {
  if (modoCalendario === "mes") {
    renderMes(contexto);
  } else {
    renderSemana(contexto);
  }
}

// ---------- orçamento e análise ----------

function gastoPorCategoriaMes(categoria, contexto, mesAno = mesAnoDe(new Date())) {
  let soma = 0;

  contexto.movimentacoes.forEach((m) => {
    if (m.tipo === "saida" && m.categoria === categoria && mesAnoDe(new Date(m.data)) === mesAno) {
      soma += m.valor;
    }
  });

  contexto.cartoes.forEach((cartao) => {
    comprasDaFatura(cartao.id, mesAno, contexto.compras, cartao).forEach(({ compra }) => {
      if (compra.categoria === categoria) soma += compra.valorParcela;
    });
  });

  return soma;
}

function limiteDaCategoria(categoria, orcamentos) {
  const item = orcamentos.find((o) => o.categoria === categoria);
  return item ? item.limite : null;
}

function popularSelectCategoriaOrcamento() {
  const select = document.getElementById("categoriaOrcamento");
  if (!select) return;
  select.innerHTML = CATEGORIAS_ORCAMENTO.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function renderResumoOrcamento(contexto) {
  const alvo = document.getElementById("listaResumoOrcamento");
  const definidos = contexto.orcamentos;

  if (definidos.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhum limite definido ainda.</p>';
    return;
  }

  alvo.innerHTML = definidos
    .slice(0, 4)
    .map((o) => {
      const gasto = gastoPorCategoriaMes(o.categoria, contexto);
      const pct = Math.min(100, Math.round((gasto / o.limite) * 100));
      const estourado = gasto > o.limite;
      return `
        <div class="cardSaldoConta cardOrcamentoMini">
          <div class="cardSaldoContaNome">${escapeHtml(o.categoria)}</div>
          <div class="cardSaldoContaValor">${formatarMoeda(gasto)}</div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento${estourado ? " estourada" : ""}" style="width:${pct}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderOrcamento(contexto) {
  const alvo = document.getElementById("listaOrcamento");
  const definidos = contexto.orcamentos;

  if (definidos.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhum limite definido ainda — adicione abaixo.</p>';
    return;
  }

  alvo.innerHTML = definidos
    .map((o) => {
      const gasto = gastoPorCategoriaMes(o.categoria, contexto);
      const pct = Math.min(100, Math.round((gasto / o.limite) * 100));
      const estourado = gasto > o.limite;
      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(o.categoria)}</div>
            <div class="cardContaTag${estourado ? " status-atrasada" : ""}">${formatarMoeda(gasto)} de ${formatarMoeda(o.limite)}</div>
          </div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento${estourado ? " estourada" : ""}" style="width:${pct}%"></div></div>
        </div>
      `;
    })
    .join("");
}

const CORES_GRAFICO = ["#173B32", "#4F8068", "#D5A84B", "#8FB89A", "#A9793A", "#2E5C4E", "#E7CB94", "#5B7A6C", "#C9A06B"];

function gastosDoMes(mesAno, contexto) {
  return CATEGORIAS_ORCAMENTO
    .map((categoria, i) => ({ categoria, gasto: gastoPorCategoriaMes(categoria, contexto, mesAno), cor: CORES_GRAFICO[i % CORES_GRAFICO.length] }))
    .filter((item) => item.gasto > 0);
}

// ---------- fechamento do mês ----------

let fechamentoMesVisualizado = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

function renderFechamentoMes(contexto) {
  const mesAno = mesAnoDe(fechamentoMesVisualizado);
  document.getElementById("fechamentoRotuloMes").textContent = `${NOMES_MES[fechamentoMesVisualizado.getMonth()]} ${fechamentoMesVisualizado.getFullYear()}`;

  let entradas = 0;
  let saidas = 0;
  contexto.movimentacoes.forEach((m) => {
    if (mesAnoDe(new Date(m.data)) === mesAno) {
      if (m.tipo === "entrada") entradas += m.valor;
      else saidas += m.valor;
    }
  });

  const dadosCategorias = gastosDoMes(mesAno, contexto).sort((a, b) => b.gasto - a.gasto);
  const maiorCategoria = dadosCategorias[0];

  const guardadoEmMetas = contexto.contribuicoesMetas
    .filter((c) => mesAnoDe(new Date(c.data)) === mesAno)
    .reduce((soma, c) => soma + c.valor, 0);

  const contasFixasPagas = contexto.pagamentos.filter((p) => p.mesAno === mesAno).length;

  const cartoes = [
    { rotulo: "Entradas", valor: formatarMoeda(entradas), cor: "valorEntrada" },
    { rotulo: "Saídas", valor: formatarMoeda(saidas), cor: "valorSaida" },
    { rotulo: "Saldo do mês", valor: formatarMoeda(entradas - saidas), cor: entradas - saidas >= 0 ? "valorEntrada" : "valorSaida" },
    { rotulo: "Maior gasto", valor: maiorCategoria ? `${maiorCategoria.categoria} (${formatarMoeda(maiorCategoria.gasto)})` : "—", cor: "" },
    { rotulo: "Guardado em metas", valor: formatarMoeda(guardadoEmMetas), cor: "valorEntrada" },
    { rotulo: "Contas fixas pagas", valor: `${contasFixasPagas}`, cor: "" },
  ];

  document.getElementById("fechamentoGrid").innerHTML = cartoes
    .map((c) => `
      <div class="fechamentoCard">
        <div class="fechamentoRotulo">${c.rotulo}</div>
        <div class="fechamentoValor ${c.cor}">${c.valor}</div>
      </div>
    `)
    .join("");
}

function renderGraficoEvolucao(contexto) {
  const hoje = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ mesAno: mesAnoDe(data), rotulo: NOMES_MES[data.getMonth()].slice(0, 3) });
  }

  const totais = meses.map((m) => {
    let entradas = 0;
    let saidas = 0;
    contexto.movimentacoes.forEach((mov) => {
      if (mesAnoDe(new Date(mov.data)) === m.mesAno) {
        if (mov.tipo === "entrada") entradas += mov.valor;
        else saidas += mov.valor;
      }
    });
    return { ...m, entradas, saidas };
  });

  const maior = Math.max(1, ...totais.map((t) => Math.max(t.entradas, t.saidas)));

  document.getElementById("graficoEvolucao").innerHTML = totais
    .map(
      (t) => `
        <div class="colunaMes">
          <div class="parDeBarras">
            <div class="barraVertical barraVerticalEntrada" style="height:${Math.round((t.entradas / maior) * 100)}%" title="Entradas: ${formatarMoeda(t.entradas)}"></div>
            <div class="barraVertical barraVerticalSaida" style="height:${Math.round((t.saidas / maior) * 100)}%" title="Saídas: ${formatarMoeda(t.saidas)}"></div>
          </div>
          <div class="rotuloMesEvolucao">${t.rotulo}</div>
        </div>
      `
    )
    .join("");
}

function renderGraficoPizza(contexto) {
  const mesAno = mesAnoDe(new Date());
  const dados = gastosDoMes(mesAno, contexto);
  const pizza = document.getElementById("graficoPizza");
  const legenda = document.getElementById("legendaPizza");

  if (dados.length === 0) {
    pizza.style.background = CORES_ARVORE.verdeClaro;
    legenda.innerHTML = '<p class="vazio">Nada pra mostrar ainda.</p>';
    return;
  }

  const total = dados.reduce((soma, d) => soma + d.gasto, 0);
  let acumulado = 0;
  const fatias = dados.map((d) => {
    const inicio = (acumulado / total) * 100;
    acumulado += d.gasto;
    const fim = (acumulado / total) * 100;
    return `${d.cor} ${inicio}% ${fim}%`;
  });

  pizza.style.background = `conic-gradient(${fatias.join(", ")})`;

  legenda.innerHTML = dados
    .sort((a, b) => b.gasto - a.gasto)
    .map((d) => {
      const pct = Math.round((d.gasto / total) * 100);
      return `
        <div class="legendaPizzaItem">
          <i style="background:${d.cor}"></i>
          <span>${escapeHtml(d.categoria)}</span>
          <span class="legendaPizzaValor">${pct}%</span>
        </div>
      `;
    })
    .join("");
}

function renderGraficoContas(contexto) {
  const alvo = document.getElementById("graficoContas");
  if (contexto.contas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma conta cadastrada ainda.</p>';
    return;
  }

  const saldos = contexto.contas.map((c) => ({ nome: c.nome, saldo: saldoDaConta(c.id, contexto.movimentacoes, contexto.transferencias) }));
  const maior = Math.max(1, ...saldos.map((s) => Math.abs(s.saldo)));

  alvo.innerHTML = saldos
    .map(
      (s) => `
        <div class="barGraficoItem">
          <div class="barGraficoLabel">
            <span>${escapeHtml(s.nome)}</span>
            <span>${formatarMoeda(s.saldo)}</span>
          </div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento${s.saldo < 0 ? " estourada" : ""}" style="width:${Math.round((Math.abs(s.saldo) / maior) * 100)}%"></div></div>
        </div>
      `
    )
    .join("");
}

function renderAnalise(contexto) {
  const mesAno = mesAnoDe(new Date());
  const dados = CATEGORIAS_ORCAMENTO.map((categoria) => ({ categoria, gasto: gastoPorCategoriaMes(categoria, contexto) })).filter(
    (item) => item.gasto > 0
  );

  const grafico = document.getElementById("graficoAnalise");
  if (dados.length === 0) {
    grafico.innerHTML = '<p class="vazio">Nenhum gasto registrado este mês ainda.</p>';
  } else {
    const maior = Math.max(...dados.map((d) => d.gasto));
    grafico.innerHTML = dados
      .sort((a, b) => b.gasto - a.gasto)
      .map(
        (d) => `
          <div class="barGraficoItem">
            <div class="barGraficoLabel">
              <span>${escapeHtml(d.categoria)}</span>
              <span>${formatarMoeda(d.gasto)}</span>
            </div>
            <div class="barraProgresso"><div class="barraProgressoPreenchimento" style="width:${Math.round((d.gasto / maior) * 100)}%"></div></div>
          </div>
        `
      )
      .join("");
  }

  const sugestoes = document.getElementById("sugestoesAnalise");
  const hoje = new Date();
  const diasRestantes = diasNoMes(hoje.getFullYear(), hoje.getMonth()) - hoje.getDate();
  const textoDiasRestantes = diasRestantes > 0 ? `, e ainda faltam ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""} pro fim do mês` : ", e hoje é o último dia do mês";

  const alertasCategorias = contexto.orcamentos
    .map((o) => ({ o, gasto: gastoPorCategoriaMes(o.categoria, contexto), pct: o.limite > 0 ? (gastoPorCategoriaMes(o.categoria, contexto) / o.limite) * 100 : 0 }))
    .filter((item) => item.o.limite > 0 && item.pct >= 50)
    .sort((a, b) => b.pct - a.pct);

  if (alertasCategorias.length === 0) {
    sugestoes.innerHTML = '<p class="vazio">Nenhum alerta por enquanto — seus gastos estão dentro do combinado 🌿</p>';
    return;
  }

  sugestoes.innerHTML = alertasCategorias
    .map(({ o, gasto, pct }) => {
      const pctArredondado = Math.round(pct);
      let icone, texto;
      if (pct >= 100) {
        icone = "🔴";
        texto = `Você ultrapassou o orçamento de ${escapeHtml(o.categoria)} este mês (${pctArredondado}% usado). Bom momento pra segurar os gastos nessa categoria.`;
      } else if (pct >= 90) {
        icone = "🟠";
        texto = `Você já usou ${pctArredondado}% do orçamento de ${escapeHtml(o.categoria)}${textoDiasRestantes}. Está quase no limite.`;
      } else if (pct >= 75) {
        icone = "🟡";
        texto = `Você já usou ${pctArredondado}% do orçamento de ${escapeHtml(o.categoria)}${textoDiasRestantes}.`;
      } else {
        icone = "🟢";
        texto = `Você já usou ${pctArredondado}% do orçamento de ${escapeHtml(o.categoria)}${textoDiasRestantes} — dentro do esperado.`;
      }
      return `
        <div class="itemHistorico itemAgenda">
          <div class="itemIcone">${icone}</div>
          <div class="itemInfo">
            <div class="itemDescricao">${texto}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ---------- render: Metas ----------

function renderResumoMetas(contexto) {
  const alvo = document.getElementById("listaResumoMetas");
  if (contexto.metas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma meta criada ainda.</p>';
    return;
  }

  alvo.innerHTML = contexto.metas
    .slice(0, 4)
    .map((meta) => {
      const pct = progressoMeta(meta);
      const concluida = meta.valorAtual >= meta.valorAlvo;
      return `
        <div class="cardSaldoConta cardOrcamentoMini">
          <div class="cardSaldoContaNome">${escapeHtml(meta.nome)}${concluida ? " 🎉" : ""}</div>
          <div class="cardSaldoContaValor">${formatarMoeda(meta.valorAtual)}</div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento" style="width:${pct}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function mesesAteOPrazo(prazo) {
  if (!prazo) return null;
  const [ano, mes] = prazo.split("-").map(Number);
  const hoje = new Date();
  const meses = (ano - hoje.getFullYear()) * 12 + (mes - 1 - hoje.getMonth());
  return meses;
}

function sugestaoMensalMeta(meta) {
  const restante = meta.valorAlvo - meta.valorAtual;
  if (restante <= 0) return null;
  const meses = mesesAteOPrazo(meta.prazo);
  if (meses === null || meses <= 0) return null;
  return restante / meses;
}

function formatarPrazo(prazo) {
  const [ano, mes] = prazo.split("-").map(Number);
  return `${NOMES_MES[mes - 1]} de ${ano}`;
}

function renderMetas(contexto) {
  const alvo = document.getElementById("listaMetas");
  if (contexto.metas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma meta criada ainda — adicione abaixo.</p>';
    return;
  }

  const { projecao } = calcularProjecaoAtual(contexto);

  alvo.innerHTML = contexto.metas
    .map((meta) => {
      const pct = progressoMeta(meta);
      const concluida = meta.valorAtual >= meta.valorAlvo;
      const sugestaoMensal = sugestaoMensalMeta(meta);
      const comprometeSaldo = sugestaoMensal !== null && projecao - sugestaoMensal < 0;

      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(meta.nome)}${concluida ? " · concluída 🎉" : ""}</div>
            <div class="cardContaTopoAcoes">
              <div class="cardContaTag">${pct}%</div>
              <button type="button" class="botaoExcluirItem" data-excluir-meta="${meta.id}" title="Apagar">✕</button>
            </div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(meta.valorAtual)} <span class="itemMeta">de ${formatarMoeda(meta.valorAlvo)}</span></div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento" style="width:${pct}%"></div></div>
          ${meta.contaId ? `<div class="itemMeta">guardando em: ${escapeHtml(nomeDaConta(meta.contaId, contexto.contas))}</div>` : ""}
          ${meta.prazo ? `<div class="itemMeta">prazo: ${formatarPrazo(meta.prazo)}</div>` : ""}
          ${sugestaoMensal !== null ? `<div class="sugestaoMetaMensal">💡 Guarde ~${formatarMoeda(sugestaoMensal)}/mês pra bater essa meta no prazo.</div>` : ""}
          ${comprometeSaldo ? `<div class="avisoMetaRisco">⚠️ Guardar ${formatarMoeda(sugestaoMensal)} este mês pode deixar seu saldo abaixo do necessário para as contas previstas.</div>` : ""}
          <form class="formGuardarMeta" data-guardar="${meta.id}">
            <input type="number" step="0.01" min="0" placeholder="Guardar valor" required />
            <button type="submit">Guardar</button>
          </form>
        </div>
      `;
    })
    .join("");
}

// ---------- render: Projeção detalhada ----------

let periodoProjecaoDetalhada = "semana";

const ROTULOS_PERIODO = { semana: "os próximos 7 dias", mes: "o fim do mês", "30_dias": "os próximos 30 dias", "3_meses": "os próximos 3 meses" };

function renderProjecaoDetalhada(contexto) {
  const dados = calcularProjecaoDetalhada(contexto, periodoProjecaoDetalhada);

  const cartoes = [
    { rotulo: "Saldo atual", valor: formatarMoeda(dados.saldoDisponivel), cor: dados.saldoDisponivel >= 0 ? "valorEntrada" : "valorSaida" },
    { rotulo: "Entradas previstas", valor: `+ ${formatarMoeda(dados.totalEntradasPrevistas)}`, cor: "valorEntrada" },
    { rotulo: "Contas futuras", valor: `− ${formatarMoeda(dados.totalContasFuturas)}`, cor: "valorSaida" },
    { rotulo: "Faturas futuras", valor: `− ${formatarMoeda(dados.totalFaturasFuturas)}`, cor: "valorSaida" },
    { rotulo: "Contas variáveis", valor: `− ${formatarMoeda(dados.totalContasVariaveis)}`, cor: "valorSaida" },
    { rotulo: "Metas planejadas", valor: `− ${formatarMoeda(dados.totalMetas)}`, cor: "valorSaida" },
    { rotulo: "Saldo projetado", valor: formatarMoeda(dados.saldoProjetado), cor: dados.saldoProjetado >= 0 ? "valorEntrada" : "valorSaida" },
  ];

  document.getElementById("fechamentoGridProjecao").innerHTML = cartoes
    .map((c) => `
      <div class="fechamentoCard">
        <div class="fechamentoRotulo">${c.rotulo}</div>
        <div class="fechamentoValor ${c.cor}">${c.valor}</div>
      </div>
    `)
    .join("");

  const alerta = document.getElementById("alertaProjecaoDetalhada");
  if (dados.saldoProjetado < 0) {
    const prioridades = dados.eventos
      .filter((e) => e.valor < 0)
      .slice(0, 3)
      .map((e) => `<li>${escapeHtml(e.label)} — ${formatarDataCurta(e.data)} · ${formatarMoeda(Math.abs(e.valor))}</li>`)
      .join("");
    alerta.hidden = false;
    alerta.innerHTML = `
      <div class="alertaProjecaoTitulo">🔴 Atenção: pode faltar ${formatarMoeda(Math.abs(dados.saldoProjetado))} até ${ROTULOS_PERIODO[periodoProjecaoDetalhada]}</div>
      <div class="alertaProjecaoTexto">Você precisa de aproximadamente ${formatarMoeda(Math.abs(dados.saldoProjetado))} em novas entradas, ou reduzir gastos não essenciais. Suas prioridades:</div>
      <ul class="alertaProjecaoLista">${prioridades}</ul>
    `;
  } else if (dados.dataFalta) {
    alerta.hidden = false;
    alerta.innerHTML = `
      <div class="alertaProjecaoTitulo">🧠 ${ROTULOS_PERIODO[periodoProjecaoDetalhada].charAt(0).toUpperCase() + ROTULOS_PERIODO[periodoProjecaoDetalhada].slice(1)} fecha positivo, mas existe um problema de fluxo.</div>
      <div class="alertaProjecaoTexto">Você terá dinheiro suficiente no fim do período, mas pode faltar ${formatarMoeda(dados.faltaValor)} a partir de ${formatarDataCurta(dados.dataFalta)}.</div>
    `;
  } else {
    alerta.hidden = false;
    alerta.innerHTML = `<div class="alertaProjecaoTitulo">🌿 Tudo tranquilo — seu saldo deve se manter positivo até ${ROTULOS_PERIODO[periodoProjecaoDetalhada]}.</div>`;
  }

  const listaEventos = document.getElementById("listaEventosProjecao");
  if (dados.eventos.length === 0) {
    listaEventos.innerHTML = '<p class="vazio">Nenhum compromisso previsto nesse período.</p>';
  } else {
    listaEventos.innerHTML = dados.eventos
      .map((e) => {
        const icone = e.tipo === "fatura" ? "💳" : e.tipo === "receita fixa" ? "⬆️" : e.tipo === "conta variável" ? "📊" : "📅";
        const classeValor = e.valor >= 0 ? "valorEntrada" : "valorSaida";
        const sinal = e.valor >= 0 ? "+" : "−";
        return `
          <div class="itemHistorico">
            <div class="itemIcone">${icone}</div>
            <div class="itemInfo">
              <div class="itemDescricao">${escapeHtml(e.label)}</div>
              <div class="itemMeta">${formatarDataCurta(e.data)}</div>
            </div>
            <div class="itemValor ${classeValor}">${sinal} ${formatarMoeda(Math.abs(e.valor))}</div>
          </div>
        `;
      })
      .join("");
  }
}

// ---------- árvore da saúde financeira ----------

const ESTADOS_ARVORE = {
  florescendo: { emoji: "🌹", titulo: "Sua rosa está florescendo!" },
  saudavel: { emoji: "🌹", titulo: "Sua rosa está saudável" },
  brotando: { emoji: "🌱", titulo: "Sua rosa está brotando" },
  murchando: { emoji: "🥀", titulo: "Sua rosa está murchando" },
  risco: { emoji: "🥀", titulo: "Sua rosa está em risco" },
};

function calcularSaudeFinanceira(contexto) {
  const { pendentes, projecao } = calcularProjecaoAtual(contexto);
  const atrasadas = pendentes.filter((p) => p.status === "atrasada");

  const estourados = contexto.orcamentos.filter((o) => gastoPorCategoriaMes(o.categoria, contexto) > o.limite);
  const metasComProgresso = contexto.metas.filter((m) => m.valorAtual > 0);
  const metasConcluidas = contexto.metas.filter((m) => m.valorAtual >= m.valorAlvo);

  let score = 55;
  score += projecao >= 0 ? 20 : -25;
  score -= Math.min(atrasadas.length, 3) * 10;
  score -= Math.min(estourados.length, 3) * 8;
  score += Math.min(metasComProgresso.length, 3) * 4;
  score += Math.min(metasConcluidas.length, 3) * 3;
  score = Math.max(0, Math.min(100, score));

  let estado;
  if (score >= 80) estado = "florescendo";
  else if (score >= 60) estado = "saudavel";
  else if (score >= 40) estado = "brotando";
  else if (score >= 20) estado = "murchando";
  else estado = "risco";

  const motivos = [];
  motivos.push(projecao >= 0 ? "sua projeção do mês está positiva" : "sua projeção do mês está negativa");
  if (atrasadas.length > 0) motivos.push(`${atrasadas.length} conta${atrasadas.length > 1 ? "s" : ""} fixa${atrasadas.length > 1 ? "s" : ""} atrasada${atrasadas.length > 1 ? "s" : ""}`);
  if (estourados.length > 0) motivos.push(`orçamento estourado em ${estourados.length} categoria${estourados.length > 1 ? "s" : ""}`);
  if (metasComProgresso.length > 0) motivos.push(`${metasComProgresso.length} meta${metasComProgresso.length > 1 ? "s" : ""} em andamento`);

  return { score, estado, motivos };
}

const CORES_ARVORE = {
  verdeProfundo: "#173B32",
  verdeMedio: "#4F8068",
  verdeClaro: "#B8D8C0",
  dourado: "#D5A84B",
  grafite: "#202522",
  vermelhoClaro: "#DD6E82",
  vermelhoMedio: "#C23A56",
  vermelhoEscuro: "#7E1F35",
  vermelhoFadado: "#CFA9AD",
};

// cada estado descreve a rosa: quantas pétalas (anel externo/interno), cores,
// se mostra o botão fechado, inclinação da haste e pétalas caídas no chão
const CONFIG_ROSA = {
  florescendo: { externas: 6, internas: 0, corExterna: CORES_ARVORE.vermelhoClaro, corInterna: CORES_ARVORE.vermelhoEscuro, botao: false, miolo: true, inclinacao: 0, corFolhas: CORES_ARVORE.verdeMedio, caidas: 0 },
  saudavel: { externas: 6, internas: 0, corExterna: CORES_ARVORE.vermelhoMedio, corInterna: CORES_ARVORE.vermelhoEscuro, botao: false, miolo: true, inclinacao: 4, corFolhas: CORES_ARVORE.verdeMedio, caidas: 0 },
  brotando: { externas: 0, internas: 0, corExterna: CORES_ARVORE.vermelhoMedio, corInterna: CORES_ARVORE.vermelhoEscuro, botao: true, miolo: false, inclinacao: 8, corFolhas: CORES_ARVORE.verdeMedio, caidas: 0 },
  murchando: { externas: 3, internas: 2, corExterna: CORES_ARVORE.vermelhoFadado, corInterna: CORES_ARVORE.vermelhoMedio, botao: false, miolo: false, inclinacao: 22, corFolhas: CORES_ARVORE.verdeClaro, caidas: 2 },
  risco: { externas: 1, internas: 1, corExterna: CORES_ARVORE.vermelhoFadado, corInterna: CORES_ARVORE.vermelhoFadado, botao: false, miolo: false, inclinacao: 38, corFolhas: CORES_ARVORE.verdeClaro, caidas: 5 },
};

// pétala em formato de gota, base no centro da flor (0,0) apontando pra cima
const CAMINHO_PETALA = "M 0 0 C -10 -9 -12 -23 0 -32 C 12 -23 10 -9 0 0 Z";

function anguloPetalas(quantidade, deslocamento) {
  if (quantidade === 0) return [];
  const passo = 360 / quantidade;
  return Array.from({ length: quantidade }, (_, i) => deslocamento + passo * i);
}

function pontoDaPetala(cx, cy, angulo, escala, cor, opacidade = 1) {
  return `<path d="${CAMINHO_PETALA}" fill="${cor}" opacity="${opacidade}" transform="translate(${cx} ${cy}) rotate(${angulo}) scale(${escala})" />`;
}

// folhas espalhadas ao longo da haste, alternando de lado
const POSICOES_FOLHAS = [
  { y: 174, lado: -1, distancia: 20, rx: 16, ry: 8.5, rot: -25 },
  { y: 152, lado: 1, distancia: 19, rx: 15, ry: 8, rot: 22 },
];

const POSICOES_PETALAS_CAIDAS = [
  { cx: 55, cy: 200, rot: 95 },
  { cx: 148, cy: 202, rot: -100 },
  { cx: 88, cy: 208, rot: 80 },
  { cx: 122, cy: 205, rot: -85 },
  { cx: 70, cy: 192, rot: 105 },
];

function gerarSvgRosa(estado) {
  const config = CONFIG_ROSA[estado];
  const baseX = 100;
  const baseY = 210;
  const centroX = baseX + config.inclinacao;
  const centroY = 68;

  // haste curva do chão até o centro da flor
  const haste = `<path d="M ${baseX} ${baseY} Q ${baseX + config.inclinacao * 0.5} 140 ${centroX} ${centroY + 10}" stroke="${config.corFolhas}" stroke-width="5" fill="none" stroke-linecap="round" />`;

  const folhas = POSICOES_FOLHAS.map((p) => {
    const cx = baseX + p.lado * p.distancia + config.inclinacao * 0.3;
    const cy = p.y;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${p.rx}" ry="${p.ry}" fill="${config.corFolhas}" transform="rotate(${p.rot} ${cx} ${cy})" />`;
  }).join("");

  let flor;
  if (config.botao) {
    // botão fechado: duas pétalas sobrepostas, ainda não abertas
    flor = [
      pontoDaPetala(centroX, centroY, -12, 1.05, config.corInterna),
      pontoDaPetala(centroX, centroY, 12, 1.05, config.corExterna),
    ].join("");
  } else {
    const externas = anguloPetalas(config.externas, 0)
      .map((angulo) => pontoDaPetala(centroX, centroY, angulo, 1, config.corExterna))
      .join("");
    const internas = anguloPetalas(config.internas, 20)
      .map((angulo) => pontoDaPetala(centroX, centroY, angulo, 0.6, config.corInterna))
      .join("");
    const miolo = config.miolo ? `<circle cx="${centroX}" cy="${centroY}" r="3.5" fill="${CORES_ARVORE.dourado}" />` : "";
    flor = externas + internas + miolo;
  }

  const petalasCaidas = POSICOES_PETALAS_CAIDAS.slice(0, config.caidas)
    .map((p) => pontoDaPetala(p.cx, p.cy, p.rot, 0.55, config.corExterna, 0.85))
    .join("");

  return `
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" class="svgArvore">
      <ellipse cx="100" cy="206" rx="70" ry="9" fill="${CORES_ARVORE.verdeClaro}" opacity="0.35" />
      ${haste}
      ${folhas}
      ${flor}
      ${petalasCaidas}
    </svg>
  `;
}

function renderArvore(contexto) {
  const saude = calcularSaudeFinanceira(contexto);
  const info = ESTADOS_ARVORE[saude.estado];
  const motivoTexto = `porque ${saude.motivos.slice(0, 3).join(", ")}.`;

  document.getElementById("palcoArvore").innerHTML = gerarSvgRosa(saude.estado);
  document.getElementById("arvoreTitulo").textContent = `${info.titulo} ${info.emoji}`;
  document.getElementById("arvoreExplicacaoTexto").textContent = motivoTexto;
}

// ---------- IA conversacional (pergunte ao MONE) ----------

function montarResumoParaIA(contexto) {
  const { totalEntradas, totalSaidas, faturasAbertas, saldoDisponivel } = calcularSaldoDisponivel(contexto);
  const pendentes = contasFixasPendentesDoMes(contexto);
  const somaPendentes = pendentes.reduce((soma, item) => soma + item.cf.valor, 0);
  const saude = calcularSaudeFinanceira(contexto);

  return {
    saldoDisponivel,
    entradasDoMes: totalEntradas,
    saidasDoMes: totalSaidas,
    faturasEmAberto: faturasAbertas,
    projecaoFimDoMes: saldoDisponivel - somaPendentes,
    contasFixasPendentes: pendentes.map((p) => ({ nome: p.cf.nome, valor: p.cf.valor, dia: p.cf.dia, status: p.status })),
    receitasFixasPendentes: receitasFixasPendentesDoMes(contexto).map((p) => ({ nome: p.rf.nome, valor: p.rf.valor, dia: p.rf.dia, status: p.status })),
    contasVariaveisPendentes: contasVariaveisPendentes(contexto).map((cv) => ({ nome: cv.nome, valor: cv.valor, dataPrevista: cv.dataPrevista })),
    orcamentos: contexto.orcamentos.map((o) => ({ categoria: o.categoria, limite: o.limite, gastoAtual: gastoPorCategoriaMes(o.categoria, contexto) })),
    metas: contexto.metas.map((m) => ({ nome: m.nome, valorAlvo: m.valorAlvo, valorAtual: m.valorAtual, progresso: progressoMeta(m) + "%" })),
    saudeFinanceiraGeral: saude.estado,
  };
}

// ---------- render: Receitas ----------

function renderReceitasFixas(contexto) {
  const alvo = document.getElementById("listaReceitasFixas");
  if (contexto.receitasFixas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma receita fixa cadastrada ainda — adicione abaixo.</p>';
    return;
  }

  const hoje = new Date();
  const mesAno = mesAnoDe(hoje);

  alvo.innerHTML = contexto.receitasFixas
    .slice()
    .sort((a, b) => a.dia - b.dia)
    .map((rf) => {
      const status = statusReceitaFixa(rf, mesAno, contexto.recebimentos, hoje);
      const botao = status === "paga" ? "" : `<button class="botaoPagarFixa" data-receber="${rf.id}">Marcar como recebida</button>`;
      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(rf.nome)}</div>
            <div class="cardContaTopoAcoes">
              <div class="cardContaTag status-${status}">${ROTULO_STATUS[status]}</div>
              <button type="button" class="botaoExcluirItem" data-excluir-receita-fixa="${rf.id}" title="Apagar">✕</button>
            </div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(rf.valor)}</div>
          <div class="itemMeta">dia ${rf.dia} · ${escapeHtml(nomeDaConta(rf.contaId, contexto.contas))}</div>
          ${botao}
        </div>
      `;
    })
    .join("");
}

function renderReceitas(movimentacoes, contas) {
  const lista = document.getElementById("listaReceitas");
  const entradas = movimentacoes.filter((m) => m.tipo === "entrada");

  if (entradas.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma entrada registrada ainda.</p>';
    return;
  }

  const grupos = {};
  entradas.forEach((m) => {
    if (!grupos[m.categoria]) grupos[m.categoria] = [];
    grupos[m.categoria].push(m);
  });

  lista.innerHTML = Object.entries(grupos)
    .map(([categoria, itens]) => {
      const subtotal = itens.reduce((soma, m) => soma + m.valor, 0);
      const linhas = itens
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .map(
          (m) => `
            <div class="itemHistorico">
              <div class="itemIcone">⬆️</div>
              <div class="itemInfo">
                <div class="itemDescricao">${escapeHtml(m.descricao)}</div>
                <div class="itemMeta">${escapeHtml(nomeDaConta(m.contaId, contas))} · ${formatarDataCurta(m.data)}</div>
              </div>
              <div class="itemValor valorEntrada">+ ${formatarMoeda(m.valor)}</div>
            </div>
          `
        )
        .join("");

      return `
        <div class="grupoReceita">
          <div class="grupoReceitaTitulo">
            <span>${escapeHtml(categoria)}</span>
            <span>${formatarMoeda(subtotal)}</span>
          </div>
          ${linhas}
        </div>
      `;
    })
    .join("");
}

// ---------- feedback da conversa ----------

function mostrarFeedback(html) {
  const feedback = document.getElementById("feedback");
  feedback.innerHTML = html;
  feedback.hidden = false;
  clearTimeout(mostrarFeedback._timer);
  mostrarFeedback._timer = setTimeout(() => {
    feedback.hidden = true;
  }, 4000);
}

// ---------- navegação entre views ----------

function irPara(viewNome) {
  document.querySelectorAll(".view").forEach((el) => (el.hidden = true));
  document.getElementById(`view${viewNome.charAt(0).toUpperCase()}${viewNome.slice(1)}`).hidden = false;

  document.querySelectorAll(".navItem[data-nav]").forEach((el) => {
    el.classList.toggle("ativo", el.dataset.nav === viewNome);
  });
}

// ---------- início ----------

// ---------- autenticação ----------

function mostrarTelaAuth() {
  document.getElementById("telaAuth").hidden = false;
  document.getElementById("appConteudo").hidden = true;
}

function mostrarFeedbackAuth(mensagem) {
  const feedback = document.getElementById("feedbackAuth");
  feedback.textContent = mensagem;
  feedback.hidden = false;
}

async function entrarNoApp(user) {
  usuarioId = user.id;
  document.getElementById("telaAuth").hidden = true;
  document.getElementById("appConteudo").hidden = false;

  const dadosIniciais = await carregarDadosDoUsuario();
  iniciarApp(dadosIniciais);
}

function configurarFormulariosAuth() {
  const formLogin = document.getElementById("formLogin");
  const formCadastro = document.getElementById("formCadastro");

  document.querySelectorAll("[data-modo-auth]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const modo = botao.dataset.modoAuth;
      document.querySelectorAll("[data-modo-auth]").forEach((b) => b.classList.toggle("ativo", b.dataset.modoAuth === modo));
      formLogin.hidden = modo !== "login";
      formCadastro.hidden = modo !== "cadastro";
      document.getElementById("feedbackAuth").hidden = true;
    });
  });

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const email = document.getElementById("emailLogin").value.trim();
    const senha = document.getElementById("senhaLogin").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) {
      mostrarFeedbackAuth(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    await entrarNoApp(data.user);
  });

  formCadastro.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const email = document.getElementById("emailCadastro").value.trim();
    const senha = document.getElementById("senhaCadastro").value;

    const { data, error } = await supabaseClient.auth.signUp({ email, password: senha });
    if (error) {
      mostrarFeedbackAuth(error.message);
      return;
    }
    if (data.session) {
      await entrarNoApp(data.user);
    } else {
      mostrarFeedbackAuth("Conta criada! Confirme seu e-mail e depois faça login.");
    }
  });

  const botaoSair = document.getElementById("botaoSair");
  if (botaoSair) {
    botaoSair.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.reload();
    });
  }
}

// ---------- notificações push ----------

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)));
}

async function atualizarBotaoNotificacoes() {
  const botao = document.getElementById("botaoNotificacoes");
  if (!botao) return;

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    botao.hidden = true;
    return;
  }

  if (Notification.permission === "granted") {
    const registro = await navigator.serviceWorker.ready;
    const inscricaoAtual = await registro.pushManager.getSubscription();
    botao.textContent = inscricaoAtual ? "🔔 avisos ativados" : "🔔 ativar avisos";
  } else if (Notification.permission === "denied") {
    botao.textContent = "🔕 avisos bloqueados";
  } else {
    botao.textContent = "🔔 ativar avisos";
  }
}

async function ativarNotificacoes() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    await atualizarBotaoNotificacoes();
    return;
  }

  const registro = await navigator.serviceWorker.ready;
  let inscricao = await registro.pushManager.getSubscription();
  if (!inscricao) {
    inscricao = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(MONE_VAPID_PUBLIC_KEY),
    });
  }

  const dados = inscricao.toJSON();
  await supabaseClient.from("push_subscriptions").upsert(
    {
      user_id: usuarioId,
      endpoint: dados.endpoint,
      p256dh: dados.keys.p256dh,
      auth_key: dados.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  await atualizarBotaoNotificacoes();
}

async function iniciar() {
  configurarFormulariosAuth();

  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    await entrarNoApp(data.session.user);
  } else {
    mostrarTelaAuth();
  }
}

function iniciarApp(dadosIniciais) {
  const contexto = { ...dadosIniciais };

  function atualizarTudo() {
    const { contas, movimentacoes, contasFixas, pagamentos, transferencias } = contexto;
    renderResumo(contexto);
    renderProjecao(contexto);
    renderSaldoPorConta(contas, movimentacoes, transferencias);
    renderHistorico(contexto);
    popularFiltrosHistorico(contexto);
    renderHistoricoCompleto(contexto);
    renderContas(contas, movimentacoes, transferencias);
    renderReceitas(movimentacoes, contas);
    renderReceitasFixas(contexto);
    renderProximasFixas(contasFixas, pagamentos);
    renderContasFixas(contasFixas, pagamentos, contas);
    renderContasVariaveis(contexto);
    popularSelectContas(contas);
    renderCalendario(contexto);
    renderResumoCartoes(contexto);
    renderCartoes(contexto);
    renderFatura(contexto);
    renderResumoOrcamento(contexto);
    renderOrcamento(contexto);
    renderAnalise(contexto);
    renderFechamentoMes(contexto);
    renderGraficoEvolucao(contexto);
    renderGraficoPizza(contexto);
    renderGraficoContas(contexto);
    renderResumoMetas(contexto);
    renderMetas(contexto);
    renderArvore(contexto);
    renderProjecaoDetalhada(contexto);
  }

  popularSelectCategoriaOrcamento();
  atualizarTudo();
  atualizarBotaoNotificacoes();

  document.getElementById("botaoNotificacoes").addEventListener("click", ativarNotificacoes);

  // registrar movimentação por conversa
  const formConversa = document.getElementById("formConversa");
  const inputConversa = document.getElementById("inputConversa");

  formConversa.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const texto = inputConversa.value.trim();
    if (!texto) return;

    const textoMinusculo = texto.toLowerCase();

    const resultadoTransferencia = tentarRegistrarTransferencia(texto, textoMinusculo, contexto);
    if (resultadoTransferencia) {
      if (resultadoTransferencia.erro) {
        mostrarFeedback(resultadoTransferencia.erro);
        return;
      }
      const { origem, destino, valor } = resultadoTransferencia;
      await registrarTransferencia(origem.id, destino.id, valor, null, texto, contexto);
      atualizarTudo();
      mostrarFeedback(`Transferido <b>${formatarMoeda(valor)}</b>: ${escapeHtml(origem.nome)} → ${escapeHtml(destino.nome)} 🔄`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const receitaRecebida = tentarReceberReceitaFixaPorTexto(textoMinusculo, contexto);
    if (receitaRecebida) {
      atualizarTudo();
      mostrarFeedback(`Recebido: <b>${escapeHtml(receitaRecebida.nome)}</b> · ${formatarMoeda(receitaRecebida.valor)}`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const contaVariavelPaga = tentarPagarContaVariavelPorTexto(textoMinusculo, contexto);
    if (contaVariavelPaga) {
      atualizarTudo();
      mostrarFeedback(`Conta paga: <b>${escapeHtml(contaVariavelPaga.nome)}</b> · ${formatarMoeda(contaVariavelPaga.valor)}`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const contaFixaPaga = tentarPagarContaFixaPorTexto(textoMinusculo, contexto);

    if (contaFixaPaga) {
      atualizarTudo();
      mostrarFeedback(`Conta paga: <b>${escapeHtml(contaFixaPaga.nome)}</b> · ${formatarMoeda(contaFixaPaga.valor)}`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const faturaPaga = tentarPagarFaturaPorTexto(textoMinusculo, contexto);
    if (faturaPaga) {
      atualizarTudo();
      mostrarFeedback(`Fatura paga: <b>${escapeHtml(faturaPaga.cartao.nome)}</b> · ${formatarMoeda(faturaPaga.total)}`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const compraCartao = await tentarRegistrarCompraCartao(texto, textoMinusculo, contexto);
    if (compraCartao) {
      atualizarTudo();
      const parcelasTexto = compraCartao.compra.parcelas > 1 ? ` em ${compraCartao.compra.parcelas}x de ${formatarMoeda(compraCartao.compra.valorParcela)}` : "";
      mostrarFeedback(`Compra no cartão <b>${escapeHtml(compraCartao.cartao.nome)}</b>: ${formatarMoeda(compraCartao.compra.valorTotal)}${parcelasTexto}`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const contribuicaoMeta = await tentarRegistrarMeta(textoMinusculo, contexto);
    if (contribuicaoMeta) {
      atualizarTudo();
      mostrarFeedback(`Guardado <b>${formatarMoeda(contribuicaoMeta.valor)}</b> na meta <b>${escapeHtml(contribuicaoMeta.meta.nome)}</b> 🎯`);
      inputConversa.value = "";
      inputConversa.focus();
      return;
    }

    const interpretacao = interpretarFrase(texto, contexto.contas);

    if (interpretacao.valor === null) {
      mostrarFeedback("Não consegui achar um valor nessa frase 🤔 tente algo como \"gastei R$50 com uber\"");
      return;
    }

    const nova = { id: gerarId(), ...interpretacao };
    contexto.movimentacoes = [nova, ...contexto.movimentacoes];
    await inserirLinha("movimentacoes", {
      id: nova.id, user_id: usuarioId, conta_id: nova.contaId, valor: nova.valor, tipo: nova.tipo,
      categoria: nova.categoria, data: nova.data, descricao: nova.descricao,
    });
    localStorage.setItem(CHAVE_ULTIMA_CONTA, interpretacao.contaId);

    atualizarTudo();

    const tipoTexto = interpretacao.tipo === "entrada" ? "entrada" : "saída";
    mostrarFeedback(
      `Entendi: <b>${formatarMoeda(interpretacao.valor)}</b> · ${tipoTexto} · ${escapeHtml(interpretacao.categoria)} · ${escapeHtml(nomeDaConta(interpretacao.contaId, contexto.contas))}`
    );

    inputConversa.value = "";
    inputConversa.focus();
  });

  // pergunte ao MONE (IA conversacional)
  const formPerguntaIA = document.getElementById("formPerguntaIA");
  const inputPerguntaIA = document.getElementById("inputPerguntaIA");
  const respostaIA = document.getElementById("respostaIA");
  const botaoPerguntarIA = document.getElementById("botaoPerguntarIA");

  formPerguntaIA.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const pergunta = inputPerguntaIA.value.trim();
    if (!pergunta) return;

    respostaIA.hidden = false;
    respostaIA.classList.add("carregando");
    respostaIA.textContent = "Pensando...";
    botaoPerguntarIA.disabled = true;

    try {
      const { data, error } = await supabaseClient.functions.invoke("ia-assistente", {
        body: { pergunta, resumo: montarResumoParaIA(contexto) },
      });

      respostaIA.classList.remove("carregando");
      if (error || !data || data.error) {
        respostaIA.textContent = (data && data.error) || "Não consegui responder agora. Tenta de novo em instantes.";
      } else {
        respostaIA.textContent = data.resposta;
      }
    } catch (erro) {
      respostaIA.classList.remove("carregando");
      respostaIA.textContent = "Não consegui responder agora. Confere sua internet e tenta de novo.";
    }

    botaoPerguntarIA.disabled = false;
    inputPerguntaIA.value = "";
  });

  // nova conta
  const formNovaConta = document.getElementById("formNovaConta");
  const nomeConta = document.getElementById("nomeConta");
  const tipoConta = document.getElementById("tipoConta");

  formNovaConta.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeConta.value.trim();
    if (!nome) return;

    const novaConta = { id: gerarId(), nome, tipo: tipoConta.value };
    contexto.contas = [...contexto.contas, novaConta];
    await inserirLinha("contas", { id: novaConta.id, user_id: usuarioId, nome: novaConta.nome, tipo: novaConta.tipo });

    atualizarTudo();
    nomeConta.value = "";
    nomeConta.focus();
  });

  // transferência entre contas (formulário manual)
  const formTransferencia = document.getElementById("formTransferencia");
  const contaOrigemTransferencia = document.getElementById("contaOrigemTransferencia");
  const contaDestinoTransferencia = document.getElementById("contaDestinoTransferencia");
  const valorTransferencia = document.getElementById("valorTransferencia");
  const descricaoTransferencia = document.getElementById("descricaoTransferencia");

  formTransferencia.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const origemId = contaOrigemTransferencia.value;
    const destinoId = contaDestinoTransferencia.value;
    const valor = parseFloat(valorTransferencia.value);

    if (!origemId || !destinoId || isNaN(valor) || valor <= 0) return;
    if (origemId === destinoId) {
      contaDestinoTransferencia.setCustomValidity("A conta de destino precisa ser diferente da de origem.");
      contaDestinoTransferencia.reportValidity();
      contaDestinoTransferencia.addEventListener("input", () => contaDestinoTransferencia.setCustomValidity(""), { once: true });
      return;
    }

    await registrarTransferencia(origemId, destinoId, valor, null, descricaoTransferencia.value.trim(), contexto);

    atualizarTudo();
    valorTransferencia.value = "";
    descricaoTransferencia.value = "";
  });

  // nova conta fixa
  const formNovaContaFixa = document.getElementById("formNovaContaFixa");
  const nomeContaFixa = document.getElementById("nomeContaFixa");
  const valorContaFixa = document.getElementById("valorContaFixa");
  const diaContaFixa = document.getElementById("diaContaFixa");
  const contaPagamentoFixa = document.getElementById("contaPagamentoFixa");

  formNovaContaFixa.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeContaFixa.value.trim();
    const valor = parseFloat(valorContaFixa.value);
    const dia = parseInt(diaContaFixa.value, 10);
    if (!nome || isNaN(valor) || isNaN(dia)) return;

    const categoria = extrairCategoria(nome.toLowerCase(), "saida");
    const novaContaFixa = {
      id: gerarId(),
      nome,
      valor,
      dia,
      categoria,
      contaId: contaPagamentoFixa.value || contexto.contas[0].id,
      repeticao: "mensal",
    };

    contexto.contasFixas = [...contexto.contasFixas, novaContaFixa];
    await inserirLinha("contas_fixas", {
      id: novaContaFixa.id, user_id: usuarioId, nome: novaContaFixa.nome, valor: novaContaFixa.valor, dia: novaContaFixa.dia,
      categoria: novaContaFixa.categoria, conta_id: novaContaFixa.contaId, repeticao: novaContaFixa.repeticao,
    });

    atualizarTudo();
    nomeContaFixa.value = "";
    valorContaFixa.value = "";
    diaContaFixa.value = "";
    nomeContaFixa.focus();
  });

  // nova conta variável (sem dia fixo)
  const formNovaContaVariavel = document.getElementById("formNovaContaVariavel");
  const nomeContaVariavel = document.getElementById("nomeContaVariavel");
  const valorContaVariavel = document.getElementById("valorContaVariavel");
  const categoriaContaVariavel = document.getElementById("categoriaContaVariavel");
  const dataContaVariavel = document.getElementById("dataContaVariavel");
  const contaPagamentoVariavel = document.getElementById("contaPagamentoVariavel");

  formNovaContaVariavel.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeContaVariavel.value.trim();
    const valor = parseFloat(valorContaVariavel.value);
    const categoria = categoriaContaVariavel.value.trim();
    if (!nome || isNaN(valor) || !categoria) return;

    const novaContaVariavel = {
      id: gerarId(),
      nome,
      valor,
      categoria,
      contaId: contaPagamentoVariavel.value || contexto.contas[0].id,
      dataPrevista: dataContaVariavel.value || null,
      paga: false,
      movimentacaoId: null,
    };

    contexto.contasVariaveis = [...contexto.contasVariaveis, novaContaVariavel];
    await inserirLinha("contas_variaveis", {
      id: novaContaVariavel.id, user_id: usuarioId, nome: novaContaVariavel.nome, valor: novaContaVariavel.valor,
      categoria: novaContaVariavel.categoria, conta_id: novaContaVariavel.contaId, data_prevista: novaContaVariavel.dataPrevista, paga: false,
    });

    atualizarTudo();
    nomeContaVariavel.value = "";
    valorContaVariavel.value = "";
    categoriaContaVariavel.value = "";
    dataContaVariavel.value = "";
    nomeContaVariavel.focus();
  });

  // marcar/apagar conta variável
  document.getElementById("listaContasVariaveis").addEventListener("click", async (evento) => {
    const botaoExcluir = evento.target.closest("[data-excluir-conta-variavel]");
    if (botaoExcluir) {
      const id = botaoExcluir.dataset.excluirContaVariavel;
      contexto.contasVariaveis = contexto.contasVariaveis.filter((cv) => cv.id !== id);
      await supabaseClient.from("contas_variaveis").delete().eq("id", id);
      atualizarTudo();
      return;
    }

    const botaoPagar = evento.target.closest("[data-pagar-variavel]");
    if (botaoPagar) {
      const contaVariavel = contexto.contasVariaveis.find((cv) => cv.id === botaoPagar.dataset.pagarVariavel);
      if (!contaVariavel || contaVariavel.paga) return;
      await pagarContaVariavel(contaVariavel, contexto);
      atualizarTudo();
    }
  });

  // marcar conta fixa como paga (clique no botão)
  document.getElementById("listaContasFixas").addEventListener("click", async (evento) => {
    const botaoExcluir = evento.target.closest("[data-excluir-conta-fixa]");
    if (botaoExcluir) {
      const id = botaoExcluir.dataset.excluirContaFixa;
      contexto.contasFixas = contexto.contasFixas.filter((cf) => cf.id !== id);
      contexto.pagamentos = contexto.pagamentos.filter((p) => p.contaFixaId !== id);
      await supabaseClient.from("contas_fixas").delete().eq("id", id);
      atualizarTudo();
      return;
    }

    const botao = evento.target.closest("[data-pagar]");
    if (!botao) return;

    const contaFixa = contexto.contasFixas.find((cf) => cf.id === botao.dataset.pagar);
    if (!contaFixa) return;

    const mesAno = mesAnoDe(new Date());
    if (estaPaga(contaFixa.id, mesAno, contexto.pagamentos)) return;

    pagarContaFixa(contaFixa, mesAno, contexto);
    atualizarTudo();
  });

  // nova receita fixa
  const formNovaReceitaFixa = document.getElementById("formNovaReceitaFixa");
  const nomeReceitaFixa = document.getElementById("nomeReceitaFixa");
  const valorReceitaFixa = document.getElementById("valorReceitaFixa");
  const diaReceitaFixa = document.getElementById("diaReceitaFixa");
  const contaReceitaFixa = document.getElementById("contaReceitaFixa");

  formNovaReceitaFixa.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeReceitaFixa.value.trim();
    const valor = parseFloat(valorReceitaFixa.value);
    const dia = parseInt(diaReceitaFixa.value, 10);
    if (!nome || isNaN(valor) || isNaN(dia)) return;

    const novaReceitaFixa = {
      id: gerarId(), nome, valor, dia, categoria: "Renda",
      contaId: contaReceitaFixa.value || contexto.contas[0].id, repeticao: "mensal",
    };

    contexto.receitasFixas = [...contexto.receitasFixas, novaReceitaFixa];
    await inserirLinha("receitas_fixas", {
      id: novaReceitaFixa.id, user_id: usuarioId, nome: novaReceitaFixa.nome, valor: novaReceitaFixa.valor,
      dia: novaReceitaFixa.dia, categoria: novaReceitaFixa.categoria, conta_id: novaReceitaFixa.contaId, repeticao: novaReceitaFixa.repeticao,
    });

    atualizarTudo();
    nomeReceitaFixa.value = "";
    valorReceitaFixa.value = "";
    diaReceitaFixa.value = "";
    nomeReceitaFixa.focus();
  });

  // marcar receita fixa como recebida
  document.getElementById("listaReceitasFixas").addEventListener("click", async (evento) => {
    const botaoExcluir = evento.target.closest("[data-excluir-receita-fixa]");
    if (botaoExcluir) {
      const id = botaoExcluir.dataset.excluirReceitaFixa;
      contexto.receitasFixas = contexto.receitasFixas.filter((rf) => rf.id !== id);
      contexto.recebimentos = contexto.recebimentos.filter((r) => r.receitaFixaId !== id);
      await supabaseClient.from("receitas_fixas").delete().eq("id", id);
      atualizarTudo();
      return;
    }

    const botao = evento.target.closest("[data-receber]");
    if (!botao) return;

    const receitaFixa = contexto.receitasFixas.find((rf) => rf.id === botao.dataset.receber);
    if (!receitaFixa) return;

    const mesAno = mesAnoDe(new Date());
    if (receitaEstaRecebida(receitaFixa.id, mesAno, contexto.recebimentos)) return;

    await receberReceitaFixa(receitaFixa, mesAno, contexto);
    atualizarTudo();
  });

  // navegação do fechamento do mês
  document.getElementById("fechamentoAnterior").addEventListener("click", () => {
    fechamentoMesVisualizado = new Date(fechamentoMesVisualizado.getFullYear(), fechamentoMesVisualizado.getMonth() - 1, 1);
    renderFechamentoMes(contexto);
  });
  document.getElementById("fechamentoSeguinte").addEventListener("click", () => {
    fechamentoMesVisualizado = new Date(fechamentoMesVisualizado.getFullYear(), fechamentoMesVisualizado.getMonth() + 1, 1);
    renderFechamentoMes(contexto);
  });

  // navegação do calendário — modo mês/semana
  document.querySelectorAll(".botaoModo").forEach((botao) => {
    botao.addEventListener("click", () => trocarModoCalendario(botao.dataset.modo, contexto));
  });

  document.getElementById("mesAnterior").addEventListener("click", () => {
    diaSelecionado = null;
    mesVisualizado = new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth() - 1, 1);
    renderCalendario(contexto);
  });
  document.getElementById("mesSeguinte").addEventListener("click", () => {
    diaSelecionado = null;
    mesVisualizado = new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth() + 1, 1);
    renderCalendario(contexto);
  });

  document.getElementById("semanaAnterior").addEventListener("click", () => {
    semanaVisualizada.setDate(semanaVisualizada.getDate() - 7);
    renderCalendario(contexto);
  });
  document.getElementById("semanaSeguinte").addEventListener("click", () => {
    semanaVisualizada.setDate(semanaVisualizada.getDate() + 7);
    renderCalendario(contexto);
  });

  // clique num dia do modo mês abre o detalhe daquele dia
  document.getElementById("gradeCalendario").addEventListener("click", (evento) => {
    const botaoDia = evento.target.closest("[data-dia]");
    if (!botaoDia) return;
    const dia = parseInt(botaoDia.dataset.dia, 10);
    const novaData = new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth(), dia);
    diaSelecionado = diaSelecionado && mesmoDia(diaSelecionado, novaData) ? null : novaData;
    renderCalendario(contexto);
  });

  // novo cartão
  const formNovoCartao = document.getElementById("formNovoCartao");
  const nomeCartao = document.getElementById("nomeCartao");
  const instituicaoCartao = document.getElementById("instituicaoCartao");
  const limiteCartao = document.getElementById("limiteCartao");
  const fechamentoCartao = document.getElementById("fechamentoCartao");
  const vencimentoCartao = document.getElementById("vencimentoCartao");
  const contaPagamentoCartao = document.getElementById("contaPagamentoCartao");

  formNovoCartao.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeCartao.value.trim();
    const limite = parseFloat(limiteCartao.value);
    const diaFechamento = parseInt(fechamentoCartao.value, 10);
    const diaVencimento = parseInt(vencimentoCartao.value, 10);
    if (!nome || isNaN(limite) || isNaN(diaFechamento) || isNaN(diaVencimento)) return;

    const novoCartao = {
      id: gerarId(),
      nome,
      instituicao: instituicaoCartao.value.trim(),
      limite,
      diaFechamento,
      diaVencimento,
      contaId: contaPagamentoCartao.value || contexto.contas[0].id,
    };

    contexto.cartoes = [...contexto.cartoes, novoCartao];
    await inserirLinha("cartoes", {
      id: novoCartao.id, user_id: usuarioId, nome: novoCartao.nome, instituicao: novoCartao.instituicao || null, limite: novoCartao.limite,
      dia_fechamento: novoCartao.diaFechamento, dia_vencimento: novoCartao.diaVencimento, conta_id: novoCartao.contaId,
    });

    atualizarTudo();
    nomeCartao.value = "";
    instituicaoCartao.value = "";
    limiteCartao.value = "";
    fechamentoCartao.value = "";
    vencimentoCartao.value = "";
    nomeCartao.focus();
  });

  // abrir a fatura de um cartão
  document.getElementById("listaCartoes").addEventListener("click", async (evento) => {
    const botaoExcluir = evento.target.closest("[data-excluir-cartao]");
    if (botaoExcluir) {
      const id = botaoExcluir.dataset.excluirCartao;
      contexto.cartoes = contexto.cartoes.filter((c) => c.id !== id);
      contexto.compras = contexto.compras.filter((c) => c.cartaoId !== id);
      contexto.pagamentosFaturas = contexto.pagamentosFaturas.filter((p) => p.cartaoId !== id);
      await supabaseClient.from("cartoes").delete().eq("id", id);
      atualizarTudo();
      return;
    }

    const botao = evento.target.closest("[data-fatura]");
    if (!botao) return;
    cartaoAtualId = botao.dataset.fatura;
    mesAnoFaturaVisualizada = null;
    renderFatura(contexto);
    irPara("fatura");
  });

  // navegação da fatura entre meses (passada/futura)
  document.getElementById("faturaMesAnterior").addEventListener("click", () => {
    mesAnoFaturaVisualizada = addMesesAMesAno(mesAnoFaturaVisualizada || mesAnoDe(new Date()), -1);
    renderFatura(contexto);
  });
  document.getElementById("faturaMesSeguinte").addEventListener("click", () => {
    mesAnoFaturaVisualizada = addMesesAMesAno(mesAnoFaturaVisualizada || mesAnoDe(new Date()), 1);
    renderFatura(contexto);
  });

  // pular direto pra uma fatura futura clicada na lista de próximas faturas
  document.getElementById("listaProximasFaturas").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-ver-fatura-mes]");
    if (!botao) return;
    mesAnoFaturaVisualizada = botao.dataset.verFaturaMes;
    renderFatura(contexto);
  });

  // registrar compra antiga (parcelas restantes de algo comprado antes do app)
  const formCompraAntiga = document.getElementById("formCompraAntiga");
  formCompraAntiga.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const cartao = contexto.cartoes.find((c) => c.id === cartaoAtualId);
    if (!cartao) return;

    const descricao = document.getElementById("descricaoCompraAntiga").value.trim();
    const categoria = document.getElementById("categoriaCompraAntiga").value.trim();
    const valorParcela = parseFloat(document.getElementById("valorParcelaCompraAntiga").value);
    const parcelasRestantes = parseInt(document.getElementById("parcelasRestantesCompraAntiga").value, 10);
    if (!descricao || !categoria || isNaN(valorParcela) || isNaN(parcelasRestantes) || parcelasRestantes < 1) return;

    const novaCompra = {
      id: gerarId(),
      descricao,
      valorTotal: Math.round(valorParcela * parcelasRestantes * 100) / 100,
      parcelas: parcelasRestantes,
      valorParcela,
      cartaoId: cartao.id,
      categoria,
      dataCompra: new Date().toISOString(),
    };

    contexto.compras = [novaCompra, ...contexto.compras];
    await inserirLinha("compras_cartao", {
      id: novaCompra.id, user_id: usuarioId, cartao_id: novaCompra.cartaoId, descricao: novaCompra.descricao,
      valor_total: novaCompra.valorTotal, parcelas: novaCompra.parcelas, valor_parcela: novaCompra.valorParcela,
      categoria: novaCompra.categoria, data_compra: novaCompra.dataCompra,
    });

    atualizarTudo();
    formCompraAntiga.reset();
  });

  // marcar fatura como paga
  document.getElementById("botaoPagarFatura").addEventListener("click", async () => {
    const cartao = contexto.cartoes.find((c) => c.id === cartaoAtualId);
    if (!cartao) return;

    const mesAno = mesAnoFaturaVisualizada || mesAnoDe(new Date());
    if (faturaEstaPaga(cartao.id, mesAno, contexto.pagamentosFaturas)) return;

    const total = totalFatura(cartao.id, mesAno, contexto.compras, cartao);
    if (total <= 0) return;

    await pagarFatura(cartao, mesAno, total, contexto);
    atualizarTudo();
  });

  // definir/atualizar limite de orçamento
  const formOrcamento = document.getElementById("formOrcamento");
  const categoriaOrcamento = document.getElementById("categoriaOrcamento");
  const limiteOrcamento = document.getElementById("limiteOrcamento");

  formOrcamento.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const categoria = categoriaOrcamento.value;
    const limite = parseFloat(limiteOrcamento.value);
    if (!categoria || isNaN(limite)) return;

    const existente = contexto.orcamentos.find((o) => o.categoria === categoria);
    if (existente) {
      existente.limite = limite;
      await atualizarLinha("orcamentos", existente.id, { limite });
    } else {
      const novoOrcamento = { id: gerarId(), categoria, limite };
      contexto.orcamentos = [...contexto.orcamentos, novoOrcamento];
      await inserirLinha("orcamentos", { id: novoOrcamento.id, user_id: usuarioId, categoria: novoOrcamento.categoria, limite: novoOrcamento.limite });
    }

    atualizarTudo();
    limiteOrcamento.value = "";
  });

  // mostrar mais/menos no histórico
  document.getElementById("toggleHistorico").addEventListener("click", () => {
    historicoExpandido = !historicoExpandido;
    renderHistorico(contexto);
  });

  // apagar uma movimentação ou transferência do histórico
  document.getElementById("listaHistorico").addEventListener("click", async (evento) => {
    const botaoTransferencia = evento.target.closest("[data-excluir-transferencia]");
    if (botaoTransferencia) {
      const id = botaoTransferencia.dataset.excluirTransferencia;
      contexto.transferencias = contexto.transferencias.filter((t) => t.id !== id);
      await supabaseClient.from("transferencias").delete().eq("id", id);
      atualizarTudo();
      return;
    }

    const botao = evento.target.closest("[data-excluir]");
    if (!botao) return;

    const id = botao.dataset.excluir;

    contexto.movimentacoes = contexto.movimentacoes.filter((m) => m.id !== id);
    contexto.pagamentos = contexto.pagamentos.filter((p) => p.movimentacaoId !== id);
    contexto.pagamentosFaturas = contexto.pagamentosFaturas.filter((p) => p.movimentacaoId !== id);

    await Promise.all([
      supabaseClient.from("movimentacoes").delete().eq("id", id),
      supabaseClient.from("pagamentos_fixas").delete().eq("movimentacao_id", id),
      supabaseClient.from("pagamentos_faturas").delete().eq("movimentacao_id", id),
    ]);

    atualizarTudo();
  });

  // nova meta
  const formNovaMeta = document.getElementById("formNovaMeta");
  const nomeMeta = document.getElementById("nomeMeta");
  const valorAlvoMeta = document.getElementById("valorAlvoMeta");
  const contaMeta = document.getElementById("contaMeta");
  const prazoMeta = document.getElementById("prazoMeta");

  formNovaMeta.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeMeta.value.trim();
    const valorAlvo = parseFloat(valorAlvoMeta.value);
    if (!nome || isNaN(valorAlvo)) return;

    const novaMeta = {
      id: gerarId(), nome, valorAlvo, valorAtual: 0,
      prazo: prazoMeta.value || "",
      contaId: contaMeta.value || null,
    };
    contexto.metas = [...contexto.metas, novaMeta];
    await inserirLinha("metas", {
      id: novaMeta.id, user_id: usuarioId, nome: novaMeta.nome, valor_alvo: novaMeta.valorAlvo,
      valor_atual: novaMeta.valorAtual, prazo: novaMeta.prazo || null, conta_id: novaMeta.contaId,
    });

    atualizarTudo();
    nomeMeta.value = "";
    valorAlvoMeta.value = "";
    prazoMeta.value = "";
    nomeMeta.focus();
  });

  // guardar valor numa meta (formulário inline dentro de cada card)
  document.getElementById("listaMetas").addEventListener("submit", async (evento) => {
    const form = evento.target.closest("[data-guardar]");
    if (!form) return;
    evento.preventDefault();

    const meta = contexto.metas.find((m) => m.id === form.dataset.guardar);
    if (!meta) return;

    const input = form.querySelector("input");
    const valor = parseFloat(input.value);
    if (isNaN(valor) || valor <= 0) return;

    await registrarContribuicaoMeta(meta, valor, contexto);
    atualizarTudo();
  });

  document.getElementById("listaMetas").addEventListener("click", async (evento) => {
    const botaoExcluir = evento.target.closest("[data-excluir-meta]");
    if (!botaoExcluir) return;

    const id = botaoExcluir.dataset.excluirMeta;
    contexto.metas = contexto.metas.filter((m) => m.id !== id);
    contexto.contribuicoesMetas = contexto.contribuicoesMetas.filter((c) => c.metaId !== id);
    await supabaseClient.from("metas").delete().eq("id", id);
    atualizarTudo();
  });

  // resetar todos os dados (zona de risco, em Contas)
  const botaoResetar = document.getElementById("botaoResetar");
  const confirmarReset = document.getElementById("confirmarReset");

  botaoResetar.addEventListener("click", () => {
    confirmarReset.hidden = false;
  });

  document.getElementById("confirmarResetNao").addEventListener("click", () => {
    confirmarReset.hidden = true;
  });

  document.getElementById("confirmarResetSim").addEventListener("click", async () => {
    const botaoSim = document.getElementById("confirmarResetSim");
    botaoSim.disabled = true;
    botaoSim.textContent = "Apagando...";

    const tabelas = [
      "pagamentos_faturas", "pagamentos_fixas", "compras_cartao", "contribuicoes_metas", "transferencias", "recebimentos_fixos",
      "movimentacoes", "contas_fixas", "receitas_fixas", "contas_variaveis", "cartoes", "orcamentos", "metas", "contas",
    ];
    for (const tabela of tabelas) {
      await supabaseClient.from(tabela).delete().eq("user_id", usuarioId);
    }

    const dadosZerados = await carregarDadosDoUsuario();
    contexto.contas = dadosZerados.contas;
    contexto.movimentacoes = dadosZerados.movimentacoes;
    contexto.contasFixas = dadosZerados.contasFixas;
    contexto.pagamentos = dadosZerados.pagamentos;
    contexto.cartoes = dadosZerados.cartoes;
    contexto.compras = dadosZerados.compras;
    contexto.pagamentosFaturas = dadosZerados.pagamentosFaturas;
    contexto.orcamentos = dadosZerados.orcamentos;
    contexto.metas = dadosZerados.metas;
    contexto.contribuicoesMetas = dadosZerados.contribuicoesMetas;
    contexto.transferencias = dadosZerados.transferencias;
    contexto.receitasFixas = dadosZerados.receitasFixas;
    contexto.recebimentos = dadosZerados.recebimentos;
    contexto.contasVariaveis = dadosZerados.contasVariaveis;

    historicoExpandido = false;
    diaSelecionado = null;
    mesVisualizado = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    cartaoAtualId = null;

    atualizarTudo();
    confirmarReset.hidden = true;
    botaoSim.disabled = false;
    botaoSim.textContent = "Sim, apagar tudo";
    irPara("inicio");
  });

  // histórico completo: busca, filtros e ordenação
  document.getElementById("buscaHistorico").addEventListener("input", (evento) => {
    filtrosHistorico.busca = evento.target.value;
    renderHistoricoCompleto(contexto);
  });

  ["filtroPeriodo", "filtroTipo", "filtroCategoria", "filtroConta", "filtroCartao"].forEach((idFiltro) => {
    const campo = { filtroPeriodo: "periodo", filtroTipo: "tipo", filtroCategoria: "categoria", filtroConta: "contaId", filtroCartao: "cartaoId" }[idFiltro];
    document.getElementById(idFiltro).addEventListener("change", (evento) => {
      filtrosHistorico[campo] = evento.target.value;
      renderHistoricoCompleto(contexto);
    });
  });

  document.getElementById("botaoOrdemHistorico").addEventListener("click", () => {
    ordemHistoricoDesc = !ordemHistoricoDesc;
    document.getElementById("botaoOrdemHistorico").textContent = ordemHistoricoDesc ? "↓ mais recentes primeiro" : "↑ mais antigos primeiro";
    renderHistoricoCompleto(contexto);
  });

  // histórico completo: editar, salvar, cancelar e apagar
  document.getElementById("listaHistoricoCompleto").addEventListener("click", async (evento) => {
    const botaoEditarMov = evento.target.closest("[data-editar-movimentacao]");
    const botaoEditarTransf = evento.target.closest("[data-editar-transferencia]");
    const botaoCancelar = evento.target.closest("[data-cancelar-edicao]");
    const botaoSalvarMov = evento.target.closest("[data-salvar-movimentacao]");
    const botaoSalvarTransf = evento.target.closest("[data-salvar-transferencia]");
    const botaoExcluirTransf = evento.target.closest("[data-excluir-transferencia]");
    const botaoExcluirMov = evento.target.closest("[data-excluir]");

    if (botaoEditarMov) {
      itemEmEdicaoId = botaoEditarMov.dataset.editarMovimentacao;
      renderHistoricoCompleto(contexto);
      return;
    }
    if (botaoEditarTransf) {
      itemEmEdicaoId = botaoEditarTransf.dataset.editarTransferencia;
      renderHistoricoCompleto(contexto);
      return;
    }
    if (botaoCancelar) {
      itemEmEdicaoId = null;
      renderHistoricoCompleto(contexto);
      return;
    }

    if (botaoSalvarMov) {
      const id = botaoSalvarMov.dataset.salvarMovimentacao;
      const form = botaoSalvarMov.closest("[data-editando]");
      const descricao = form.querySelector('[data-campo="descricao"]').value.trim();
      const categoria = form.querySelector('[data-campo="categoria"]').value.trim();
      const contaId = form.querySelector('[data-campo="contaId"]').value;
      const valor = parseFloat(form.querySelector('[data-campo="valor"]').value);
      const data = new Date(form.querySelector('[data-campo="data"]').value).toISOString();
      if (!descricao || !categoria || isNaN(valor) || valor <= 0) return;

      const mov = contexto.movimentacoes.find((m) => m.id === id);
      if (mov) {
        Object.assign(mov, { descricao, categoria, contaId, valor, data });
        await atualizarLinha("movimentacoes", id, { descricao, categoria, conta_id: contaId, valor, data });
      }
      itemEmEdicaoId = null;
      atualizarTudo();
      return;
    }

    if (botaoSalvarTransf) {
      const id = botaoSalvarTransf.dataset.salvarTransferencia;
      const form = botaoSalvarTransf.closest("[data-editando]");
      const descricao = form.querySelector('[data-campo="descricao"]').value.trim();
      const contaOrigemId = form.querySelector('[data-campo="contaOrigemId"]').value;
      const contaDestinoId = form.querySelector('[data-campo="contaDestinoId"]').value;
      const valor = parseFloat(form.querySelector('[data-campo="valor"]').value);
      const data = new Date(form.querySelector('[data-campo="data"]').value).toISOString();
      if (isNaN(valor) || valor <= 0 || contaOrigemId === contaDestinoId) return;

      const transf = contexto.transferencias.find((t) => t.id === id);
      if (transf) {
        Object.assign(transf, { descricao, contaOrigemId, contaDestinoId, valor, data });
        await atualizarLinha("transferencias", id, { descricao, conta_origem_id: contaOrigemId, conta_destino_id: contaDestinoId, valor, data });
      }
      itemEmEdicaoId = null;
      atualizarTudo();
      return;
    }

    if (botaoExcluirTransf) {
      const id = botaoExcluirTransf.dataset.excluirTransferencia;
      contexto.transferencias = contexto.transferencias.filter((t) => t.id !== id);
      await supabaseClient.from("transferencias").delete().eq("id", id);
      atualizarTudo();
      return;
    }

    if (botaoExcluirMov) {
      const id = botaoExcluirMov.dataset.excluir;
      contexto.movimentacoes = contexto.movimentacoes.filter((m) => m.id !== id);
      contexto.pagamentos = contexto.pagamentos.filter((p) => p.movimentacaoId !== id);
      contexto.pagamentosFaturas = contexto.pagamentosFaturas.filter((p) => p.movimentacaoId !== id);
      await Promise.all([
        supabaseClient.from("movimentacoes").delete().eq("id", id),
        supabaseClient.from("pagamentos_fixas").delete().eq("movimentacao_id", id),
        supabaseClient.from("pagamentos_faturas").delete().eq("movimentacao_id", id),
      ]);
      atualizarTudo();
    }
  });

  // projeção detalhada — troca de período
  document.querySelectorAll("[data-periodo-projecao]").forEach((botao) => {
    botao.addEventListener("click", () => {
      periodoProjecaoDetalhada = botao.dataset.periodoProjecao;
      document.querySelectorAll("[data-periodo-projecao]").forEach((b) => b.classList.toggle("ativo", b === botao));
      renderProjecaoDetalhada(contexto);
    });
  });

  // navegação entre telas
  document.querySelectorAll("[data-ir]").forEach((el) => {
    el.addEventListener("click", () => irPara(el.dataset.ir));
  });
}

document.addEventListener("DOMContentLoaded", iniciar);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
