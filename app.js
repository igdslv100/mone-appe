// MONE — Fase 1 a 8 (front-end) + Fase Final (Supabase: dados de verdade + login)

const CHAVE_ULTIMA_CONTA = "mone_ultima_conta";
const CHAVE_ULTIMO_CARTAO = "mone_ultimo_cartao";

const PALAVRAS_PAGAMENTO = ["paguei", "pago", "quitei"];
const PALAVRAS_META = ["guardei", "depositei", "poupei"];
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
  const [contas, movimentacoes, contasFixas, pagamentos, cartoes, compras, pagamentosFaturas, orcamentos, metas] = await Promise.all([
    supabaseClient.from("contas").select("*"),
    supabaseClient.from("movimentacoes").select("*"),
    supabaseClient.from("contas_fixas").select("*"),
    supabaseClient.from("pagamentos_fixas").select("*"),
    supabaseClient.from("cartoes").select("*"),
    supabaseClient.from("compras_cartao").select("*"),
    supabaseClient.from("pagamentos_faturas").select("*"),
    supabaseClient.from("orcamentos").select("*"),
    supabaseClient.from("metas").select("*"),
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
      id: r.id, contaId: r.conta_id, valor: Number(r.valor), tipo: r.tipo, categoria: r.categoria, data: r.data, descricao: r.descricao,
    })),
    contasFixas: (contasFixas.data || []).map((r) => ({
      id: r.id, nome: r.nome, valor: Number(r.valor), dia: r.dia, categoria: r.categoria, contaId: r.conta_id, repeticao: r.repeticao,
    })),
    pagamentos: (pagamentos.data || []).map((r) => ({ contaFixaId: r.conta_fixa_id, mesAno: r.mes_ano, movimentacaoId: r.movimentacao_id })),
    cartoes: (cartoes.data || []).map((r) => ({
      id: r.id, nome: r.nome, limite: Number(r.limite), diaFechamento: r.dia_fechamento, diaVencimento: r.dia_vencimento, contaId: r.conta_id,
    })),
    compras: (compras.data || []).map((r) => ({
      id: r.id, cartaoId: r.cartao_id, descricao: r.descricao, valorTotal: Number(r.valor_total), parcelas: r.parcelas,
      valorParcela: Number(r.valor_parcela), categoria: r.categoria, dataCompra: r.data_compra,
    })),
    pagamentosFaturas: (pagamentosFaturas.data || []).map((r) => ({ cartaoId: r.cartao_id, mesAno: r.mes_ano, movimentacaoId: r.movimentacao_id })),
    orcamentos: (orcamentos.data || []).map((r) => ({ id: r.id, categoria: r.categoria, limite: Number(r.limite) })),
    metas: (metas.data || []).map((r) => ({ id: r.id, nome: r.nome, valorAlvo: Number(r.valor_alvo), valorAtual: Number(r.valor_atual), prazo: r.prazo })),
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

function saldoDaConta(contaId, movimentacoes) {
  return movimentacoes
    .filter((m) => m.contaId === contaId)
    .reduce((soma, m) => soma + (m.tipo === "entrada" ? m.valor : -m.valor), 0);
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
  };

  contexto.movimentacoes = [nova, ...contexto.movimentacoes];
  await inserirLinha("movimentacoes", {
    id: nova.id, user_id: usuarioId, conta_id: nova.contaId, valor: nova.valor, tipo: nova.tipo,
    categoria: nova.categoria, data: nova.data, descricao: nova.descricao,
  });

  const pagamento = { cartaoId: cartao.id, mesAno, movimentacaoId: nova.id };
  contexto.pagamentosFaturas = [...contexto.pagamentosFaturas, pagamento];
  await inserirLinha("pagamentos_faturas", {
    user_id: usuarioId, cartao_id: pagamento.cartaoId, mes_ano: pagamento.mesAno, movimentacao_id: pagamento.movimentacaoId,
  });
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

async function tentarRegistrarMeta(textoMinusculo, contexto) {
  if (contexto.metas.length === 0) return null;

  const contemGuardar = PALAVRAS_META.some((p) => textoMinusculo.includes(p)) || textoMinusculo.includes("meta");
  if (!contemGuardar) return null;

  const meta = contexto.metas.find((m) => textoMinusculo.includes(m.nome.toLowerCase()));
  if (!meta) return null;

  const valor = extrairValor(textoMinusculo);
  if (valor === null) return null;

  meta.valorAtual += valor;
  await atualizarLinha("metas", meta.id, { valor_atual: meta.valorAtual });

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

function renderProjecao(contexto) {
  const { saldoDisponivel } = calcularSaldoDisponivel(contexto);
  const pendentes = contasFixasPendentesDoMes(contexto);
  const somaPendentes = pendentes.reduce((soma, item) => soma + item.cf.valor, 0);
  const projecao = saldoDisponivel - somaPendentes;

  document.getElementById("projecaoValor").textContent = formatarMoeda(projecao);

  const alerta = document.getElementById("alertaProjecao");

  if (projecao >= 0 || pendentes.length === 0) {
    alerta.hidden = true;
    return;
  }

  const falta = Math.abs(projecao);
  const prioridades = pendentes
    .slice(0, 3)
    .map((item) => `<li>${escapeHtml(item.cf.nome)} — dia ${item.cf.dia} · ${formatarMoeda(item.cf.valor)}${item.status === "atrasada" ? " (atrasada)" : ""}</li>`)
    .join("");

  alerta.hidden = false;
  alerta.innerHTML = `
    <div class="alertaProjecaoTitulo">⚠️ Atenção: pode faltar ${formatarMoeda(falta)} até o fim do mês</div>
    <div class="alertaProjecaoTexto">Suas contas ainda pendentes somam mais do que você tem disponível. Prioridades:</div>
    <ul class="alertaProjecaoLista">${prioridades}</ul>
  `;
}

function renderSaldoPorConta(contas, movimentacoes) {
  const lista = document.getElementById("listaSaldoContas");
  lista.innerHTML = contas
    .map((conta) => {
      const saldo = saldoDaConta(conta.id, movimentacoes);
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

function renderHistorico(movimentacoes, contas) {
  const lista = document.getElementById("listaHistorico");
  const botaoMais = document.getElementById("toggleHistorico");

  if (movimentacoes.length === 0) {
    lista.innerHTML = '<p class="vazio">Nada por aqui ainda — registre sua primeira movimentação acima 👆</p>';
    botaoMais.hidden = true;
    return;
  }

  const ordenadas = [...movimentacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
  const visiveis = historicoExpandido ? ordenadas : ordenadas.slice(0, LIMITE_HISTORICO_INICIAL);

  lista.innerHTML = visiveis
    .map((m) => {
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

// ---------- render: Contas ----------

function renderContas(contas, movimentacoes) {
  const lista = document.getElementById("listaContas");
  lista.innerHTML = contas
    .map((conta) => {
      const saldo = saldoDaConta(conta.id, movimentacoes);
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
            <div class="cardContaTag status-${status}">${ROTULO_STATUS[status]}</div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(cf.valor)}</div>
          <div class="itemMeta">dia ${cf.dia} · ${escapeHtml(nomeDaConta(cf.contaId, contas))}</div>
          ${botao}
        </div>
      `;
    })
    .join("");
}

function popularSelectContas(contas) {
  const select = document.getElementById("contaPagamentoFixa");
  select.innerHTML = contas.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  const selectCartao = document.getElementById("contaPagamentoCartao");
  if (selectCartao) {
    selectCartao.innerHTML = contas.map((c) => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  }
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
      return `
        <button type="button" class="cardConta cardCartaoClicavel" data-fatura="${cartao.id}">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(cartao.nome)}</div>
            <div class="cardContaTag status-${status}">${ROTULO_STATUS[status]}</div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(total)}</div>
          <div class="itemMeta">limite ${formatarMoeda(cartao.limite)} · fecha dia ${cartao.diaFechamento} · vence dia ${cartao.diaVencimento}</div>
        </button>
      `;
    })
    .join("");
}

function renderFatura(contexto) {
  if (!cartaoAtualId) return;
  const cartao = contexto.cartoes.find((c) => c.id === cartaoAtualId);
  if (!cartao) return;

  const mesAno = mesAnoDe(new Date());
  const itens = comprasDaFatura(cartao.id, mesAno, contexto.compras, cartao);
  const total = itens.reduce((soma, item) => soma + item.compra.valorParcela, 0);
  const status = statusFatura(cartao, mesAno, contexto.pagamentosFaturas, new Date());

  document.getElementById("tituloFatura").textContent = `Fatura · ${cartao.nome}`;
  document.getElementById("totalFatura").textContent = formatarMoeda(total);
  document.getElementById("statusFaturaTexto").textContent = `${ROTULO_STATUS[status]} · vence dia ${cartao.diaVencimento}`;

  const botaoPagar = document.getElementById("botaoPagarFatura");
  botaoPagar.hidden = status === "paga" || total <= 0;

  const listaCompras = document.getElementById("listaComprasFatura");
  if (itens.length === 0) {
    listaCompras.innerHTML = '<p class="vazio">Nenhuma compra nessa fatura ainda.</p>';
    return;
  }

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

function eventosDoDia(data, movimentacoes, contasFixas, pagamentos) {
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();
  const totalDias = diasNoMes(ano, mes);
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
      const status = statusContaFixa(cf, mesAnoDe(data), pagamentos, new Date());
      eventos.push({ tipo: "vencimento", label: cf.nome, valor: cf.valor, status });
    }
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

  const fixasPorDia = {};
  contasFixas.forEach((cf) => {
    const diaLimite = Math.min(cf.dia, totalDias);
    if (!fixasPorDia[diaLimite]) fixasPorDia[diaLimite] = [];
    fixasPorDia[diaLimite].push(cf);
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
    const eventos = eventosDoDia(diaSelecionado, movimentacoes, contasFixas, pagamentos);
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
    const eventos = eventosDoDia(data, movimentacoes, contasFixas, pagamentos);
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

function gastoPorCategoriaMes(categoria, contexto) {
  const mesAno = mesAnoDe(new Date());
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
  const alertasCategorias = contexto.orcamentos
    .map((o) => ({ o, gasto: gastoPorCategoriaMes(o.categoria, contexto) }))
    .filter((item) => item.o.limite > 0 && item.gasto / item.o.limite >= 0.8);

  if (alertasCategorias.length === 0) {
    sugestoes.innerHTML = '<p class="vazio">Nenhum alerta por enquanto — seus gastos estão dentro do combinado 🌿</p>';
    return;
  }

  sugestoes.innerHTML = alertasCategorias
    .map(({ o, gasto }) => {
      const pct = Math.round((gasto / o.limite) * 100);
      const estourou = gasto > o.limite;
      const texto = estourou
        ? `Você já passou do limite de ${escapeHtml(o.categoria)} este mês (${pct}% usado). Bom momento pra segurar os gastos nessa categoria.`
        : `Você já usou ${pct}% do limite de ${escapeHtml(o.categoria)} este mês — fique de olho.`;
      return `
        <div class="itemHistorico itemAgenda">
          <div class="itemIcone">${estourou ? "🚨" : "💡"}</div>
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

function renderMetas(contexto) {
  const alvo = document.getElementById("listaMetas");
  if (contexto.metas.length === 0) {
    alvo.innerHTML = '<p class="vazio">Nenhuma meta criada ainda — adicione abaixo.</p>';
    return;
  }

  alvo.innerHTML = contexto.metas
    .map((meta) => {
      const pct = progressoMeta(meta);
      const concluida = meta.valorAtual >= meta.valorAlvo;
      return `
        <div class="cardConta">
          <div class="cardContaTopo">
            <div class="cardContaNome">${escapeHtml(meta.nome)}${concluida ? " · concluída 🎉" : ""}</div>
            <div class="cardContaTag">${pct}%</div>
          </div>
          <div class="cardContaSaldo">${formatarMoeda(meta.valorAtual)} <span class="itemMeta">de ${formatarMoeda(meta.valorAlvo)}</span></div>
          <div class="barraProgresso"><div class="barraProgressoPreenchimento" style="width:${pct}%"></div></div>
          ${meta.prazo ? `<div class="itemMeta">prazo: ${escapeHtml(meta.prazo)}</div>` : ""}
          <form class="formGuardarMeta" data-guardar="${meta.id}">
            <input type="number" step="0.01" min="0" placeholder="Guardar valor" required />
            <button type="submit">Guardar</button>
          </form>
        </div>
      `;
    })
    .join("");
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
  const { saldoDisponivel } = calcularSaldoDisponivel(contexto);
  const pendentes = contasFixasPendentesDoMes(contexto);
  const atrasadas = pendentes.filter((p) => p.status === "atrasada");
  const somaPendentes = pendentes.reduce((soma, p) => soma + p.cf.valor, 0);
  const projecao = saldoDisponivel - somaPendentes;

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

// ---------- render: Receitas ----------

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
    const { contas, movimentacoes, contasFixas, pagamentos } = contexto;
    renderResumo(contexto);
    renderProjecao(contexto);
    renderSaldoPorConta(contas, movimentacoes);
    renderHistorico(movimentacoes, contas);
    renderContas(contas, movimentacoes);
    renderReceitas(movimentacoes, contas);
    renderProximasFixas(contasFixas, pagamentos);
    renderContasFixas(contasFixas, pagamentos, contas);
    popularSelectContas(contas);
    renderCalendario(contexto);
    renderResumoCartoes(contexto);
    renderCartoes(contexto);
    renderFatura(contexto);
    renderResumoOrcamento(contexto);
    renderOrcamento(contexto);
    renderAnalise(contexto);
    renderResumoMetas(contexto);
    renderMetas(contexto);
    renderArvore(contexto);
  }

  popularSelectCategoriaOrcamento();
  atualizarTudo();

  // registrar movimentação por conversa
  const formConversa = document.getElementById("formConversa");
  const inputConversa = document.getElementById("inputConversa");

  formConversa.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const texto = inputConversa.value.trim();
    if (!texto) return;

    const textoMinusculo = texto.toLowerCase();
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

  // marcar conta fixa como paga (clique no botão)
  document.getElementById("listaContasFixas").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-pagar]");
    if (!botao) return;

    const contaFixa = contexto.contasFixas.find((cf) => cf.id === botao.dataset.pagar);
    if (!contaFixa) return;

    const mesAno = mesAnoDe(new Date());
    if (estaPaga(contaFixa.id, mesAno, contexto.pagamentos)) return;

    pagarContaFixa(contaFixa, mesAno, contexto);
    atualizarTudo();
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
      limite,
      diaFechamento,
      diaVencimento,
      contaId: contaPagamentoCartao.value || contexto.contas[0].id,
    };

    contexto.cartoes = [...contexto.cartoes, novoCartao];
    await inserirLinha("cartoes", {
      id: novoCartao.id, user_id: usuarioId, nome: novoCartao.nome, limite: novoCartao.limite,
      dia_fechamento: novoCartao.diaFechamento, dia_vencimento: novoCartao.diaVencimento, conta_id: novoCartao.contaId,
    });

    atualizarTudo();
    nomeCartao.value = "";
    limiteCartao.value = "";
    fechamentoCartao.value = "";
    vencimentoCartao.value = "";
    nomeCartao.focus();
  });

  // abrir a fatura de um cartão
  document.getElementById("listaCartoes").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-fatura]");
    if (!botao) return;
    cartaoAtualId = botao.dataset.fatura;
    renderFatura(contexto);
    irPara("fatura");
  });

  // marcar fatura como paga
  document.getElementById("botaoPagarFatura").addEventListener("click", async () => {
    const cartao = contexto.cartoes.find((c) => c.id === cartaoAtualId);
    if (!cartao) return;

    const mesAno = mesAnoDe(new Date());
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
    renderHistorico(contexto.movimentacoes, contexto.contas);
  });

  // nova meta
  const formNovaMeta = document.getElementById("formNovaMeta");
  const nomeMeta = document.getElementById("nomeMeta");
  const valorAlvoMeta = document.getElementById("valorAlvoMeta");
  const prazoMeta = document.getElementById("prazoMeta");

  formNovaMeta.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = nomeMeta.value.trim();
    const valorAlvo = parseFloat(valorAlvoMeta.value);
    if (!nome || isNaN(valorAlvo)) return;

    const novaMeta = { id: gerarId(), nome, valorAlvo, valorAtual: 0, prazo: prazoMeta.value.trim() };
    contexto.metas = [...contexto.metas, novaMeta];
    await inserirLinha("metas", {
      id: novaMeta.id, user_id: usuarioId, nome: novaMeta.nome, valor_alvo: novaMeta.valorAlvo,
      valor_atual: novaMeta.valorAtual, prazo: novaMeta.prazo || null,
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

    meta.valorAtual += valor;
    await atualizarLinha("metas", meta.id, { valor_atual: meta.valorAtual });
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
      "pagamentos_faturas", "pagamentos_fixas", "compras_cartao",
      "movimentacoes", "contas_fixas", "cartoes", "orcamentos", "metas", "contas",
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
