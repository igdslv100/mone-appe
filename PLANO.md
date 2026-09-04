# 📱 MONE — Plano do MVP
> Um app que te ajuda a controlar, entender e melhorar sua vida financeira registrando entradas e gastos por conversa, com contas, cartões, orçamento, metas e uma árvore que reflete sua saúde financeira.

## 1. Decisões

| Tema | Decisão |
|---|---|
| Quem usa | Uso pessoal (você). Sem login nas fases iniciais |
| Dispositivo | Mobile-first, funcionando bem em celular e computador |
| Dados | Localstorage (no navegador) até a fase final; Supabase entra só na fase de Publicar |
| "Entendimento" das frases | Regras de reconhecimento de texto dentro do próprio app (sem IA externa paga por enquanto) — extrai valor, data, categoria, tipo e conta a partir de frases como "gastei R$80 no mercado" |
| Identidade visual | Nome: **MONE**. Paleta: Verde profundo #173B32 (principal), Verde médio #4F8068 (crescimento), Verde claro #B8D8C0 (estados positivos), Creme #F7F5EF (fundo), Grafite #202522 (textos), Dourado #D5A84B (conquistas/detalhes premium) |
| Referência de layout | Nenhuma referência específica — estilo proposto do zero com a paleta acima |

## 2. Telas do app

| Tela | O que você faz nela |
|---|---|
| 💬 Registro por conversa | Escreve frases naturais ("gastei R$80 no mercado") e o app identifica valor, categoria, data, tipo e conta sozinho |
| 🏠 Início / Dashboard | Visão geral: saldo disponível, entradas, saídas, contas próximas, projeção e situação da árvore |
| 🏦 Contas | Gerencia cada conta separadamente (Nubank, dinheiro, poupança, investimentos...) |
| 💰 Receitas | Visão das entradas e suas fontes (salário, freela, venda...) |
| 🔄 Contas fixas | Cadastra contas recorrentes (aluguel, luz...) que se repetem sozinhas |
| 📅 Calendário financeiro | Visualiza em um calendário quando entram e saem valores, vencimentos e faturas |
| 💳 Cartões e faturas | Cadastra cartões, lança compras parceladas, acompanha a fatura |
| 🔮 Projeção e alertas | Vê quanto vai sobrar até o fim do mês e recebe aviso se o dinheiro for apertar |
| 📋 Orçamento | Define quanto pretende gastar por categoria e acompanha se está dentro do limite |
| 📊 Análise | Vê pra onde o dinheiro está indo por categoria e recebe sugestões de economia |
| 🎯 Metas | Cria metas financeiras e acompanha o progresso |
| 🌱 Minha árvore | Árvore que cresce ou perde folhas conforme a saúde financeira |
| ⚙️ Perfil e configurações | Categorias, contas, cartões e preferências gerais |

## 3. O diferencial (detalhado)

**Registro por conversa** — o coração do MONE. Você escreve frases naturais, sem formulário:
- "Gastei R$80 no mercado hoje" → identifica valor (80), categoria (mercado), tipo (saída), data (hoje)
- "Recebi R$1000 de um freela" → identifica valor (1000), categoria (freela/renda extra), tipo (entrada)
- "Paguei minha conta de luz" → identifica que é uma conta fixa sendo quitada, marca como paga

O app reconhece palavras-chave de valor (R$, "reais"), de tipo ("gastei", "paguei" = saída; "recebi", "ganhei" = entrada), de categoria (mercado, luz, freela, lazer...) e de data ("hoje", "ontem", datas específicas). Tudo entra automaticamente no histórico, já com a conta certa vinculada.

## 4. O que o app guarda

```
Conta: nome, tipo (banco/dinheiro/poupança/investimento), saldo
Movimentação: valor, data, tipo (entrada/saída), categoria, conta, descrição
Categoria: nome, tipo (gasto/receita), limite de orçamento (opcional)
Conta fixa: nome, valor, dia de vencimento, categoria, conta de pagamento, repetição
Cartão: nome, dia de fechamento, dia de vencimento, limite
Fatura: cartão, mês, valor total, status (aberta/paga)
Compra parcelada: descrição, valor total, nº de parcelas, cartão
Meta: nome, valor alvo, valor atual, prazo
Árvore: nível de saúde financeira (calculado a partir do saldo, orçamento e metas)
```

Cada movimentação pertence a uma conta e a uma categoria. Contas fixas e faturas geram movimentações automaticamente nos vencimentos. A árvore "lê" o conjunto de tudo isso pra decidir se está florescendo ou murchando.

## 5. Fases de construção

- [x] **Fase 0 — Setup + preview duplo**: Projeto rodando, identidade visual do MONE (paleta + fonte), tela de preview lado a lado (celular + computador)
- [x] **Fase 1 — Registro por conversa**: Reconhecimento de texto, histórico de movimentações, Dashboard inicial com saldo e últimas movimentações
- [x] **Fase 2 — Contas e receitas**: Cadastro de contas, saldo por conta, tela de receitas com origem
- [x] **Fase 3 — Contas fixas + calendário**: Contas recorrentes, calendário de vencimentos
- [x] **Fase 4 — Cartões e faturas**: Cadastro de cartões, compras parceladas, acompanhamento de fatura
- [x] **Fase 5 — Projeção e alertas**: Projeção de saldo até o fim do mês, alertas de risco
- [x] **Fase 6 — Orçamento e análise**: Limite de gasto por categoria, gráfico de gastos, sugestões de economia
- [x] **Fase 7 — Metas**: Criação e acompanhamento de metas financeiras
- [x] **Fase 8 — Minha árvore**: Árvore que reflete a saúde financeira (cresce/murcha)
- [x] **Fase Final (parte 1) — Back-end**: Supabase conectado (9 tabelas + RLS + login por e-mail/senha)
- [ ] **Fase Final (parte 2) — Publicar**: deploy na Vercel, instalação como PWA no celular

## 6. Versão 2 (fica pra depois)

- IA conversacional avançada (perguntar coisas ao app e receber conselhos personalizados em resposta)
- Gráficos e relatórios mais completos
- Resumo de fechamento do mês (total gasto, total guardado, metas batidas)
- Notificações push de verdade
