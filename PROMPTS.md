# 🧩 MONE — Prompts prontos por fase

Cada prompt abaixo é pra copiar e colar numa conversa nova com o Claude (ou usar como ponto de retorno se você parar e voltar depois). Sempre um de cada vez, na ordem.

---

## Prompt — Fase 0: Setup + preview duplo

Leia o arquivo PLANO.md. Estou construindo o app MONE: um assistente financeiro pessoal onde registro entradas e gastos por conversa, com contas, cartões, orçamento, metas e uma árvore que reflete minha saúde financeira.

Agora vamos construir SÓ a Fase 0: o setup do projeto.

Nesta fase:
- Crie o projeto (mobile-first, rodando no navegador)
- Aplique a identidade visual do MONE: paleta Verde profundo #173B32 (principal), Verde médio #4F8068 (crescimento), Verde claro #B8D8C0 (estados positivos), Creme #F7F5EF (fundo), Grafite #202522 (textos), Dourado #D5A84B (conquistas/detalhes premium). Escolha uma fonte que combine com "confiança + leveza"
- Crie uma tela de preview (`preview.html`) com dois `<iframe>` lado a lado apontando pra URL do app rodando (localhost do projeto): à esquerda dentro de uma moldura de celular (~390px de largura, com cara de telefone), à direita em largura de computador. Os dois iframes devem carregar o app real e clicável — não cópias estáticas — então cliques funcionam nos dois e qualquer mudança no app aparece automaticamente nos dois lados
- Uma tela inicial simples só com o nome MONE e a identidade visual aplicada, pra eu já ver a cara do app

Não faça ainda: nenhuma funcionalidade de registro, contas, cartões ou qualquer outra fase futura. Não instale banco de dados nem login.

Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Abro o preview e vejo o app duas vezes ao mesmo tempo: numa moldura de celular à esquerda e em tamanho de computador à direita
- [ ] Consigo clicar em qualquer um dos dois e funciona normalmente
- [ ] A tela já está com a paleta e a fonte do MONE aplicadas
- [ ] Se eu mudar algo no app, as duas telas do preview atualizam sozinhas

---

## Prompt — Fase 1: Registro por conversa

Leia o arquivo PLANO.md. Estou construindo o app MONE: um assistente financeiro pessoal onde registro entradas e gastos por conversa.
Já concluí a Fase 0 (setup + preview duplo + identidade visual). Agora vamos construir SÓ a Fase 1: o registro por conversa, que é o coração do app.

Nesta fase:
- Uma tela onde eu escrevo frases naturais, tipo "Gastei R$80 no mercado hoje", "Recebi R$1000 de um freela", "Paguei minha conta de luz"
- O app deve reconhecer, usando regras de texto (sem IA externa paga): o valor, se é entrada ou saída, uma categoria aproximada (mercado, freela, luz, lazer etc.), e a data (hoje, ontem ou uma data escrita)
- Cada frase registrada vira uma "movimentação" guardada no histórico (localStorage)
- Uma lista de histórico mostrando todas as movimentações registradas, mais recentes primeiro
- Um Dashboard inicial simples: saldo total (soma de entradas menos saídas) e as últimas movimentações

Identidade visual: paleta e fonte do MONE já definidas na Fase 0, mobile-first.
Não faça ainda: contas separadas, cartões, contas fixas, orçamento, metas, árvore ou qualquer fase futura. Não adicione banco de dados nem login — tudo salva local (localStorage).
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Escrevo "gastei R$50 com uber" e ele aparece corretamente no histórico como saída, R$50, categoria transporte
- [ ] Escrevo "recebi R$500 de salário" e ele aparece como entrada
- [ ] O saldo total no Dashboard reflete a soma certa
- [ ] Fecho o app e abro de novo — o histórico continua lá

---

## Prompt — Fase 2: Contas e receitas

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0 e 1 (setup e registro por conversa). Agora vamos construir SÓ a Fase 2: contas e receitas.

Nesta fase:
- Uma tela "Contas" onde cadastro cada conta separadamente (nome, tipo: banco/dinheiro/poupança/investimento) e vejo o saldo de cada uma
- Ao registrar uma movimentação por conversa, o app deve identificar (ou perguntar, se não conseguir identificar) a qual conta ela pertence
- Uma tela "Receitas" mostrando só as entradas, agrupadas por origem (salário, freela, venda...)
- O Dashboard passa a mostrar o saldo por conta, além do saldo total

Identidade visual: paleta e fonte do MONE, mobile-first.
Não faça ainda: contas fixas, cartões, orçamento, metas, árvore. Continue salvando tudo local (localStorage), sem banco de dados nem login.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Consigo cadastrar uma conta nova (ex: "Nubank") e ela aparece na tela Contas
- [ ] Uma movimentação registrada por conversa fica vinculada à conta certa
- [ ] A tela Receitas mostra só as entradas, organizadas por origem
- [ ] O saldo de cada conta bate com as movimentações dela

---

## Prompt — Fase 3: Contas fixas + calendário

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0, 1 e 2. Agora vamos construir SÓ a Fase 3: contas fixas e calendário financeiro.

Nesta fase:
- Uma tela "Contas fixas" onde cadastro uma conta recorrente uma vez (nome, valor, dia de vencimento, categoria, conta de pagamento, repetição mensal) e ela passa a se repetir sozinha todo mês
- Ao chegar o vencimento, a conta fixa aparece como pendente até eu marcar como paga (posso marcar direto ou dizendo "paguei minha conta de luz" na tela de conversa)
- Uma tela "Calendário financeiro" mostrando, num calendário mensal, os dias com entradas, saídas e vencimentos de contas fixas

Identidade visual: paleta e fonte do MONE, mobile-first.
Não faça ainda: cartões, orçamento, metas, árvore. Continue local (localStorage), sem banco de dados nem login.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Cadastro uma conta fixa (ex: aluguel, dia 5) e ela aparece pendente no dia certo
- [ ] Marco como paga e ela vira uma movimentação no histórico
- [ ] No mês seguinte, a mesma conta fixa aparece de novo automaticamente
- [ ] O calendário mostra os vencimentos e movimentações do mês corretamente

---

## Prompt — Fase 4: Cartões e faturas

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0 a 3. Agora vamos construir SÓ a Fase 4: cartões de crédito, faturas e parcelas.

Nesta fase:
- Uma tela "Cartões" onde cadastro cada cartão (nome, dia de fechamento, dia de vencimento, limite)
- Ao registrar uma compra por conversa (ex: "comprei um fone de R$300 em 3x no cartão"), o app cria uma compra parcelada vinculada ao cartão certo
- Uma tela de fatura por cartão, mostrando o total do mês, as compras que entraram e o status (aberta/paga)
- O Dashboard passa a considerar as faturas em aberto no saldo disponível

Identidade visual: paleta e fonte do MONE, mobile-first.
Não faça ainda: orçamento, metas, árvore. Continue local (localStorage), sem banco de dados nem login.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Cadastro um cartão e ele aparece na tela Cartões
- [ ] Registro uma compra parcelada e ela aparece dividida certinho na fatura
- [ ] A fatura do mês mostra o total certo
- [ ] Marco uma fatura como paga e ela gera a movimentação correspondente

---

## Prompt — Fase 5: Projeção e alertas

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0 a 4. Agora vamos construir SÓ a Fase 5: projeção de saldo e alertas de risco.

Nesta fase:
- Uma tela/seção "Projeção" que calcula quanto vai sobrar de saldo até o fim do mês, considerando entradas previstas, contas fixas pendentes e faturas em aberto
- Um alerta visível no Dashboard quando a projeção indicar risco de saldo ficar negativo antes do próximo recebimento
- O alerta deve dizer, em linguagem simples, quanto falta e quais são as próximas contas prioritárias

Identidade visual: paleta e fonte do MONE, mobile-first.
Não faça ainda: orçamento, metas, árvore. Continue local (localStorage), sem banco de dados nem login.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] A projeção mostra um valor de saldo futuro coerente com as contas e faturas pendentes
- [ ] Se eu cadastrar uma conta fixa alta o suficiente pra estourar o saldo, o alerta aparece
- [ ] O alerta explica em texto simples o motivo e o que é prioridade
- [ ] Sem risco no mês, nenhum alerta aparece

---

## Prompt — Fase 6: Orçamento e análise

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0 a 5. Agora vamos construir SÓ a Fase 6: orçamento por categoria e análise de gastos.

Nesta fase:
- Uma tela "Orçamento" onde defino um limite de gasto por categoria (ex: R$400 em mercado por mês)
- Acompanhamento visual de quanto já usei do limite de cada categoria (ex: barra de progresso)
- Uma tela "Análise" com um gráfico simples de gastos por categoria no mês
- Sugestões automáticas simples de economia quando alguma categoria estiver estourando o limite (ex: "você já gastou 90% do orçamento de lazer")

Identidade visual: paleta e fonte do MONE, mobile-first.
Não faça ainda: metas, árvore. Continue local (localStorage), sem banco de dados nem login.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Defino um limite pra uma categoria e vejo o quanto já gastei dela
- [ ] O gráfico de gastos por categoria reflete o histórico real
- [ ] Ao estourar um limite, recebo uma sugestão de economia sobre aquela categoria
- [ ] Os dados do orçamento continuam lá depois de fechar e abrir o app

---

## Prompt — Fase 7: Metas

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0 a 6. Agora vamos construir SÓ a Fase 7: metas financeiras.

Nesta fase:
- Uma tela "Metas" onde crio uma meta (nome, valor alvo, prazo)
- Consigo registrar um valor guardado pra uma meta (manualmente, ou dizendo algo como "guardei R$100 pra viagem" na tela de conversa)
- Uma barra de progresso mostrando quanto falta pra bater cada meta
- O Dashboard passa a mostrar um resumo das metas em andamento

Identidade visual: paleta e fonte do MONE, mobile-first.
Não faça ainda: a árvore. Continue local (localStorage), sem banco de dados nem login.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] Crio uma meta nova e ela aparece na tela Metas
- [ ] Registro um valor guardado e o progresso da barra atualiza
- [ ] Ao bater 100%, a meta é marcada como concluída
- [ ] O resumo de metas aparece certo no Dashboard

---

## Prompt — Fase 8: Minha árvore

Leia o arquivo PLANO.md. Estou construindo o app MONE.
Já concluí as Fases 0 a 7 — todas as funcionalidades financeiras já estão prontas. Agora vamos construir SÓ a Fase 8: a árvore da saúde financeira.

Nesta fase:
- Uma tela "Minha árvore" com uma árvore ilustrada (pode ser ilustração simples em CSS/SVG, com a paleta do MONE) que muda de estado
- A árvore cresce/floresce quando: o saldo está saudável, os orçamentos estão dentro do limite e as metas estão avançando
- A árvore perde folhas/murcha quando: há risco de saldo negativo, orçamentos estourados ou contas fixas em atraso
- Um resumo curto explicando por que a árvore está daquele jeito ("sua árvore está florescendo porque você ficou dentro do orçamento este mês!")
- Um mini indicador da árvore também aparece no Dashboard

Identidade visual: paleta e fonte do MONE (o dourado é ótimo pra "conquistas" da árvore), mobile-first.
Não faça ainda: banco de dados nem login — isso é só na fase final.
Vá me explicando o que está fazendo em linguagem simples e me avise quando eu puder testar.

Está pronto quando:
- [ ] A árvore muda de estado visual conforme eu mudo os dados (ex: estouro um orçamento e ela reage)
- [ ] O texto explicativo bate com o estado mostrado
- [ ] O indicador da árvore aparece certo no Dashboard
- [ ] Recarregando o app, o estado da árvore continua consistente com os dados salvos

---

## Prompt — Fase Final: Publicar

Estou construindo o app MONE e já concluí todas as fases do MVP (0 a 8) — o app está completo e funcionando com dados locais.

Agora quero ativar a skill "vamos construir o back-end do meu app" pra conectar o MONE a um banco de dados de verdade (Supabase), migrar os dados do localStorage, e depois fazer o deploy e instalar como app no celular.

(Depois de concluir o back-end, volte aqui e peça deploy na Vercel + instalação como PWA.)
