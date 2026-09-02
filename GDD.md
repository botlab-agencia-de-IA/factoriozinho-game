# Factoriozinho — Documento de Design (GDD)

> **Documento vivo.** É a fonte da verdade do projeto. Pode editar, cortar e
> reescrever à vontade — eu leio este arquivo antes de mexer no código. Se algo
> aqui estiver diferente do jogo, o arquivo ganha.
>
> Última atualização: 02/09/2026 · Versão do doc: **0.8.3** · Jogo: **v0.8.3**
>
> 📦 Código no GitHub: **botlab-agencia-de-IA/factoriozinho-game** (privado)
> 🧪 Para testar sem abrir o jogo: duplo clique no `testar.bat`

---

## 1. Visão geral

**Factoriozinho** é um jogo 2D de **visão de cima (top-down)**, single-player, em que
você controla um personagem que **coleta recursos → fabrica itens → automatiza a
produção**, até a fábrica trabalhar sozinha.

### 🎯 Objetivo central do jogo: **SAIR DO PLANETA.**

Todo o resto do jogo é o caminho até lá. É uma corrida longa: da picareta na mão
até uma fábrica capaz de construir a nave/foguete que te tira daqui.

### Peso das referências

| Jogo | Peso | O que fica |
|---|---|---|
| **Factorio** | 🔥 **A base, de verdade** | Automação, cadeias de produção, esteiras, inseridores, mineradoras, energia, pesquisa, blueprints. É o esqueleto do jogo. |
| **Forager** | 🟢 Só o tempero | O **ritmo gostoso da coleta** e a **variedade de recursos**. Nada mais. |
| **Autonauts** | 🔵 Só uma fase futura | Os **robôs que você ensina**. Entra bem depois, junto com os robôs logísticos do Factorio. |

**Frase-resumo:** *"Um Factorio pequeno e leve, com a coleta gostosa do Forager, e
robôs ensináveis lá na frente."*

---

## 2. ✂️ O que foi **cortado** (decisões fechadas)

Estas coisas apareceram nas referências e **não entram**:

| Cortado | Origem | Motivo |
|---|---|---|
| ❌ **Árvore de habilidades** | Forager | Não queremos. O progresso vem da **pesquisa**, não de pontinhos de nível. |
| ❌ **Recursos que renascem sozinhos** | Forager | **Recurso é finito.** Árvore derrubada não volta. Jazida esgota conforme se extrai. Isso é o que dá sentido a expandir o mapa. |
| ❌ **Mundo em ilhas separadas** | Forager | O mundo é **contínuo**. (Exceção possível: um *modo difícil* futuro pode usar ilhas para tornar a expansão mais dura.) |
| ❌ **Economia / moedas / mercador** | Forager | Fora por enquanto. Talvez volte muito depois, se fizer sentido. |
| ❌ **NPCs** | Forager | Não queremos. No máximo aparecem na introdução/história. |
| ❌ **Frascos de ciência** | Factorio | Pesquisa existe, mas **não vai ser cópia**. O consumível da pesquisa será outra coisa (ver §5.9). |

---

## 3. ⏳ O que fica para depois (ordem aproximada)

Confirmado que **entra**, mas não agora:

1. **⛏️ Progressão de ferramentas** — a mais importante. Ver §3.1 abaixo.
2. **📊 A matemática do jogo** — ver §3.2.
3. **💎 Diamante** — mais um minério, com jazidas **bem menores** que as outras.
4. **🍖 Sobrevivência** — vida, fome e sede, com formas de conseguir comida e água.
5. **Blueprints** — copiar e colar pedaços da fábrica. *Tem que ter.*
6. **Pesquisa** — o laboratório e o que ele consome.
7. **Trens** e **robôs logísticos**.
8. **Robôs ensináveis** (a parte do Autonauts).
9. **Inimigos**, e depois **PvP**.
10. **XP / nível** — a ideia não é ruim, fica guardada.
11. **Modos de jogo** na criação do mundo (fácil / normal / difícil, com escassez e talvez ilhas).

### 3.1 ⛏️ Progressão de ferramentas (decidido, falta implementar)

Hoje dá para arrancar urânio com a mão. Isso vai mudar: **cada recurso vai exigir
um nível mínimo de picareta**, e a picareta seguinte só se faz com o material que
a anterior liberou. É o "gancho" que o Forager tem — o item começa fraquinho e vai
melhorando junto com o jogo.

| Nível | Picareta | Feita de | Libera |
|---|---|---|---|
| 0 | *(mão)* | — | madeira |
| 1 | **Madeira** ✅ arte pronta | madeira | pedra, carvão |
| 2 | **Pedra** ✅ arte pronta | madeira + pedra | ferro, cobre, areia, argila, terra |
| 3 | **Ferro** ✅ arte pronta | madeira + placa de ferro | ouro |
| 4 | **Ouro** ✅ arte pronta | madeira + placa de ouro | diamante |
| 5 | **Nuclear** (a desenhar) | urânio + ? | urânio, e o que vier depois |

- **Carvão também não deve sair na mão** (hoje sai).
- A mesma lógica vale para outras ferramentas depois (machado, espada…).
- Ferramenta melhor também **minera mais rápido**.
- Falta decidir: durabilidade (a picareta gasta e quebra?) — provavelmente sim.

> **Estado atual:** as 4 picaretas já existem como item, com receita e com a arte do
> Vandré funcionando no jogo. O que falta é a **regra** de exigir a picareta.

### 3.2 📊 A matemática do jogo (a definir junto)

Uma passada de balanceamento em cima de tudo, com números pensados em vez de
chutados:

- **Combustíveis**: quanto cada um rende. Tronco de madeira **não pode** valer o
  mesmo que carvão. A escala já começa em §5.7, mas precisa de conta de verdade.
- **Esteiras**: velocidade, vazão (itens por segundo), e quanto cada máquina
  consome/produz — para saber quantas mineradoras uma esteira aguenta, quantos
  fornos uma mineradora alimenta, etc.
- **Jazidas**: proporção de cada minério no mundo e tamanho das manchas
  (o diamante entra aqui, com manchas bem pequenas).
- **Tempos de produção** de cada receita.

---

## 4. Loop de jogo

```
   ┌────────────────────────────────────────────────────┐
   │                                                    │
   ▼                                                    │
COLETAR ──► FABRICAR ──► AUTOMATIZAR ──► PRODUZIR MAIS ─┘
(na mão)    (na mão /    (mineradora,      (e o recurso
             forno)       forno, esteira)   perto acaba)
   ▲                                                    │
   │                                                    ▼
   └──────────  EXPANDIR o mapa atrás de recurso novo ◄──┘
                              │
                              ▼
                     🚀 CONSTRUIR A NAVE
```

1. Você chega num mapa vazio, sem nada.
2. Bate em **árvore** e **pedra** com a mão.
3. Fabrica na mão: **forno de pedra**, **mineradora a carvão**.
4. Coloca a mineradora em cima da jazida; ela alimenta o forno; o forno vira **placa**.
5. Com placas você fabrica coisa melhor, e automatiza mais.
6. **O recurso perto de você acaba** → precisa ir mais longe, e transportar de volta.
7. Escala tudo, pesquisa, e no fim monta a nave e vai embora.

---

## 5. Sistemas

### 5.1 Personagem
- Visão de cima, anda em 8 direções (`WASD` / setas), movimento livre (não é em grade).
- Alcance de interação limitado (~4 tiles): só coleta e constrói perto.
- Colide com árvore, pedra, água e construções.
- **Sem vida, sem fome, sem morte** por enquanto.

### 5.2 Inventário
- Grade de slots (40), cada slot com item + quantidade (pilha).
- **Barra rápida (hotbar)** = os 8 primeiros slots, sempre visíveis na tela.
- Pegar/soltar pilha com o mouse (clique esquerdo pega tudo, direito pega metade).

### 5.3 Mundo e mapa
- **Contínuo** (sem ilhas) e **FINITO**, gerado por **semente** — mesma semente, mesmo mapa.
- **Tamanho atual: 10×10 chunks de 32×32 tiles = 320×320 tiles.**
  É um valor de partida, escolhido para a gente testar as coisas; aumenta depois
  mexendo em `MUNDO_CHUNKS` no `src/js/game/data.js`.
- O mundo inteiro é gerado de uma vez ao entrar (leva ~50–90 ms, ~0,6 MB de memória).
- Fora do limite existe uma **barreira** — o personagem não passa, e o mapa mostra
  uma linha vermelha tracejada marcando onde acaba.
- Terreno: grama, mato, terra, areia, chão de pedra e água (água bloqueia e serve
  para bomba depois).

**Distribuição dos minérios:** o mundo é dividido em **regiões**, uma por chunk, e
cada região tem um **minério dominante** sorteado da semente com proporções fixas
(22% ferro, 20% carvão, 18% cobre, 18% pedra, 10% ouro, 7% petróleo, 5% urânio).
Um ruído separado decide o formato das manchas. Isso cria zonas de ferro, zonas de
cobre etc. e garante que **todo minério existe em qualquer semente**.

A região **não é o quadrado do chunk**: cada uma tem um centro sorteado dentro do
seu chunk e fica com o pedaço de mapa mais perto dele (estilo Voronoi), e o ponto
consultado ainda passa por duas ondas de ruído antes — uma grande, que entorta a
fronteira, e uma miúda, que solta ilhotas de um minério dentro do vizinho. Sem isso
as jazidas paravam em linha reta na borda do chunk e dava para ver o quadriculado
no mapa.

**Entre duas regiões vizinhas fica uma faixa sem jazida nenhuma** (`BORDA_MORTA`,
7 tiles de folga entre uma região e a outra). Ela serve para duas coisas: minérios
diferentes **não nascem colados** um no outro, e a divisa entre as regiões — que é
uma reta, porque é fronteira de Voronoi — some do mapa em vez de aparecer desenhada
em minério. O preço é cobertura: a jazida ocupa ~12% do mapa em vez de ~19%, e por
isso o limiar de riqueza foi afrouxado junto (de 0,628 para 0,610). Como as regiões saem de tamanhos diferentes, as proporções são repartidas
por **área** e não por contagem de região. O teste `10-regioes.js` mede isso: conta
as trocas de minério coluna a coluna e compara as colunas que caem na borda de chunk
com as do meio — se a borda não tiver mais troca que o resto, não há quadriculado.

### 5.4 Mapa (tecla `M`)
- **Minimapa** fixo no canto superior direito, mostrando ~72 tiles ao redor de você.
- **`M` (ou clicar no minimapa)** abre o mapa do mundo inteiro, com:
  - todos os recursos por cor, as construções em laranja e você marcado com um anel
  - uma **legenda com quanto ainda existe de cada recurso no mundo inteiro** — quando
    algo acaba, aparece "acabou" em vermelho
  - um **inspetor na coluna da direita, embaixo da legenda**: passa o mouse por
    qualquer lugar do mapa e ele mostra ali, com o ícone, o que tem naquele quadrado
- O mapa é atualizado na hora: minerou, mudou.

**O inspetor** existe em dois lugares, com o mesmo conteúdo:

1. **Na tela do jogo** — painel fixo no **canto direito, embaixo do minimapa**.
   Aponte o cursor para qualquer coisa e ele mostra o que é. Some sozinho quando
   não há nada para dizer, para não sujar a tela. Foi ele que substituiu a tarja
   que ficava no meio do topo.
2. **Na janela do mapa** (`M`) — na coluna da direita, embaixo da legenda.

Ele mostra, conforme o que está sob o cursor:

| Onde o mouse está | O que aparece |
|---|---|
| **Jazida** | ícone do minério que ela rende, quanto ainda tem **neste quadrado** e quanto tem **a jazida inteira** (a mancha ligada) |
| **Forno** | o que está fundindo, no que vai virar, o que já está pronto, o combustível, a **barra de progresso** e o quanto falta queimar |
| **Mineradora** | o minério que está tirando, o **total que ainda dá para tirar** embaixo dela, quanto tempo até acabar, o buffer, a progressão e a queima |
| **Baú** | a lista do que tem dentro, com ícone e quantidade |
| **Esteira** | quantos itens em cada faixa e o que está passando |
| **Inseridor** | o que está na mão dele, o combustível, de onde pega e onde põe |
| **Chão** | o tipo de terreno e se dá para construir ali |

As barras andam sozinhas com o cursor parado: dá para ficar olhando o forno
trabalhar sem abrir o painel dele. **A barra de progresso saiu de baixo das
estruturas no mundo** — a progressão agora mora só no painel.

### 5.5 Recursos — **todos finitos**
| Recurso | Onde vem | Observação |
|---|---|---|
| Madeira | Árvore | 4 por árvore; a árvore some |
| Pedra | Pedregulho | 8 por pedregulho; ele some |
| Pedra | Jazida de pedra | centenas por tile |
| Carvão | Jazida | combustível básico |
| Minério de ferro | Jazida | → placa de ferro |
| Minério de cobre | Jazida | → placa de cobre |
| **Minério de ouro** | Jazida (raro) | → placa de ouro |
| **Minério de urânio** | Jazida (muito raro) | uso definido depois (nuclear) |
| **Argila** | Depósito perto da água | uso definido depois |
| **Areia** | Depósito em praia/deserto | → vidro |
| **Terra** | Depósito em área de terra | uso definido depois |
| **Petróleo** | Poço | ⚠️ **não sai na mão** — vai precisar de bomba |

Quando um tile chega a zero ele **desaparece do mapa**. É assim que o jogo empurra
você a expandir. Nada renasce.

> Os recursos novos (ouro, urânio, argila, areia, terra, petróleo) já existem no
> mundo, já aparecem no mapa e já podem ser coletados e guardados. **O que cada um
> faz ainda vai ser definido** — por enquanto só ouro (→ placa) e areia (→ vidro)
> têm receita.

**⏳ Areia, argila e terra vão deixar de ser jazida (decisão de 02/09/2026).** Hoje
elas são depósitos iguais aos de minério: uma mancha com quantidade por tile, que
acaba e some. O Vandré decidiu que **não vão ser assim — nem vão ser jazidas.**
Como elas vão funcionar ainda vai ser definido com ele; até lá, o que está no jogo
é provisório. Isso mexe na geração do mundo (§5.3), na tabela acima e na legenda do
mapa.

### 5.6 Coleta manual
- Segurar o **botão esquerdo do mouse** em cima do recurso, dentro do alcance.
- Barra de progresso; cada ciclo entrega 1 item e continua enquanto segurar.
- Recurso mais duro demora mais (árvore 0,65 s · pedra 0,9 s · ferro 1,2 s ·
  ouro 1,6 s · urânio 2,2 s).

**⏳ Linha de progressão de ferramentas (a fazer):** hoje dá para minerar tudo com a
mão. O plano é: **mão → picareta de madeira → picareta de pedra → picareta de ferro →
picareta de aço**, e cada minério vai exigir um nível mínimo de picareta (pedra só
com picareta, ferro só com picareta de pedra, e assim por diante). Ferramenta melhor
também minera mais rápido.

### 5.7 Combustíveis
Cada combustível vale um tanto de **segundos de queima**. A ideia é uma escala clara,
onde o combustível melhor vem depois na progressão:

| Combustível | Queima | Situação |
|---|---|---|
| Madeira | 4 s | ✅ funcionando |
| Carvão | 8 s | ✅ funcionando |
| Petróleo bruto | 20 s | ⏳ existe no mundo, falta a bomba para extrair |
| Óleo refinado | a definir | ⏳ futuro |
| Combustível nuclear (urânio) | a definir | ⏳ futuro |

> A conta exata de cada um (e quanto cada máquina consome) fica para quando as
> máquinas seguintes existirem.

### 5.8 Fabricação
1. **Na mão** — painel de fabricação, com fila e tempo por item. As receitas ficam
   separadas em **seções: Ferramentas, Estruturas e Itens** — picareta não fica no
   meio de forno e baú. A seção de cada receita é o campo `cat` em `data.js`.
2. **Forno** — funde minério em placa, queimando combustível.
3. **Montadora** (futuro) — recebe ingredientes por esteira/inseridor e produz sozinha.

**Pilha (stack): 100 para tudo.** Vale para a mochila, para o baú e para os slots
internos das máquinas — o forno para de produzir quando a saída chega em 100.

### 5.9 Automação (o coração)
- **Mineradora a carvão**: fica em cima da jazida, queima combustível e **cospe o
  minério na coisa que estiver na frente dela** (forno, baú ou esteira). É o primeiro
  gostinho de automação e funciona mesmo sem esteira.
- **Forno**: combustível + minério → placa, sozinho.
- **Baú**: guarda coisas.
- **Esteira** ✅: leva os itens sozinha na direção da seta, **sem combustível**.
  Anda a 2 tiles/s.
  **Tem dois lados (faixas), igual ao Factorio**: esquerda e direita, cada uma com
  sua própria fila de até 4 itens — **8 por tile no total**. Assim dá para levar
  dois materiais diferentes na mesma esteira.

  **As regras de qual faixa o item usa** (sempre UMA só — se ela encher, a máquina
  espera; nunca invade a outra):
  1. **Mineradora**: ela só *empurra* o minério para fora, então ele cai na faixa
     **do lado dela** — a que fica bem na frente da saída.
  2. **Inseridor**: o braço é comprido e alcança a faixa **do lado oposto**.
  3. **Máquina alinhada exatamente atrás** (esteira saindo reta da máquina):
     faixa da **direita**.
  4. **Esteira reto na outra**: o item **mantém a faixa** em que estava.
  5. **Esteira entrando pela lateral** (side-load): **tudo** que entra por um lado
     cai na faixa daquele lado, venha da faixa que vier. Entrou pela direita, vai
     para a faixa da direita.

  > Como mineradora e inseridor usam faixas contrárias, dá para ter uma mineradora
  > de um lado e um inseridor do outro alimentando a **mesma esteira**, cada um na
  > sua faixa, sem um atrapalhar o outro.

  **Curva automática:** se só uma esteira alimenta esta e vem de lado, ela **vira
  sozinha** — não precisa colocar mais nada na frente. Na curva as faixas são
  preservadas (cada uma continua na sua). Com duas entradas ela fica reta e a
  lateral vira side-load.

  Um inseridor tirando da esteira pega das duas faixas.
  Se o que está na frente não aceita, a fila trava para trás — é assim que dá para
  **ver o gargalo** na tela.
  Para fazer uma curva, é só apontar a esteira seguinte para outro lado.
  Dá para jogar um item na esteira à mão: pegue o item na barra rápida e clique nela.
- **Inseridor** ✅: o braço mecânico, e **"o robô" desta etapa do projeto**.
  Pega 1 item do que está **ATRÁS** e põe no que está **NA FRENTE** (a seta mostra
  a frente). Funciona entre qualquer par: esteira→forno, forno→baú, baú→esteira…
  Move ~1 item/s e **queima combustível**, mas devagar: 1 carvão dura ~50 s.
  Ele é esperto quanto ao destino — minério vai para a entrada do forno, carvão vai
  para o combustível.

> **Por que o inseridor gasta combustível e a esteira não?** Porque estamos na era
> do combustível: tudo que tem motor queima algo. A esteira é movida pelo próprio
> peso/mola. Quando a energia elétrica chegar (Fase 4), entra o inseridor elétrico.

### 5.10 Energia
- Fase 1: máquinas **a combustível** (queimam madeira ou carvão direto). ✅ implementado
- Fase 2: água → caldeira → gerador a vapor → **poste elétrico** com raio de alcance.
- Fase 3: solar + acumulador.

### 5.11 Pesquisa — **sem frascos** (a definir)
Pesquisa vai existir e será o eixo da progressão, mas **não copiando os frascos**.

**Proposta em aberto:** um **Analisador** que consome **os próprios produtos da
fábrica** ao longo do tempo. Ex.: para liberar *Automação*, ele consome 20 placas de
ferro + 10 engrenagens, puxadas por inseridor. Assim a pesquisa continua exigindo
uma cadeia de produção, mas sem o intermediário artificial do frasco.

> ⚠️ Ainda não decidido. Discutir antes de implementar.

### 5.12 Salvamento
- 5 slots. Guarda semente, o que você **alterou** no mundo (recursos gastos e
  construções), inventário e tempo jogado. O resto é regerado pela semente — save leve.
- Autosave configurável.

---

## 6. Controles

| Ação | Tecla |
|---|---|
| Andar | `W A S D` / setas |
| Coletar (segurar) | **Botão esquerdo** do mouse |
| Construir | **Botão esquerdo** com estrutura na mão |
| Abrir máquina / baú | **Botão esquerdo** na estrutura (com a mão vazia) |
| Remover construção | **Botão direito** |
| **Transferir a pilha inteira** | **`Shift` + botão esquerdo** no item |
| Girar construção | `R` |
| **Inventário** | **`E`** |
| **Mapa** | **`M`** (ou clicar no minimapa) |
| **Pegar na mão o que está sob o cursor** | **`Q`** |
| Fabricar | `C` (ou a aba dentro do inventário) |
| Barra rápida | `1`–`8`, roda do mouse, **ou clicar no slot** |
| Zoom | `Ctrl` + roda, ou `+` / `-` |
| Pausar / menu | `Esc` |

---

## 7. 🎨 Especificação de arte (para o Piskel)

**Regra base: 1 tile do mundo = 32×32 pixels.** O jogo desenha tudo com zoom 2× por
padrão, então um sprite de 32px aparece com 64px na tela, nítido, sem borrar.

### Tamanhos de grade

| O que é | Grade no Piskel | Observação |
|---|---|---|
| **Chão / terreno** | `32×32` | Precisa emendar nas bordas (tileável) |
| **Jazida de minério** (por cima do chão) | `32×32` | Faça 3 versões: cheia, média, quase vazia |
| **Pedregulho** | `32×32` | |
| **Árvore** | `32×48` | Os 32×32 **de baixo** são a base que fica no tile; os 16px de cima são a copa passando por cima |
| **Ícone de item** | `32×32` | Serve para o inventário **e** para o item caído no chão |
| **Máquina de 1×1** (baú, inseridor) | `32×32` | |
| **Máquina de 2×2** (forno, mineradora, montadora) | `64×64` | |
| **Máquina de 3×3** (laboratório, mineradora elétrica) | `96×96` | |
| **Personagem** | `32×32` por quadro | 4 direções × 4 quadros = folha de `128×128` |
| **Esteira** (animada) | `32×32` × 8 quadros | folha de `256×32` |
| **Ícone de interface** | `16×16` ou `24×24` | |

### 📏 Sobre a proporção (a dúvida da espada)

A grade **não é o tamanho do desenho** — é a moldura. O que define se a espada
aparece grande ou pequena é **quanto dessa moldura você preenche**:

```
┌──────────────── 32×32 ────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 2px de respiro (não encoste na borda)
│  ░░  ██████████████████████████  ░░  │
│  ░░  █                        █  ░░  │  Objeto GRANDE (forno, baú):
│  ░░  █   preenche ~28×28      █  ░░  │  ocupa quase tudo
│  ░░  ██████████████████████████  ░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└───────────────────────────────────────┘

┌──────────────── 32×32 ────────────────┐
│                                       │
│         ████████████████              │  Objeto de MÃO (picareta, espada):
│         █  ~22×22 no meio █           │  ocupa ~2/3 da moldura
│         ████████████████              │
│                                       │
└───────────────────────────────────────┘
```

Referência mental: **um tile de 32×32 é "um passo do personagem"**. Um forno ocupa
um tile inteiro. Uma espada é menor que um tile — então desenhe ela ocupando uns
22×22 dentro da grade de 32×32, na diagonal, e vai ficar na proporção certa.

### 🎨 O arquivo de cores — `src/js/game/paleta.js`

**Todas as cores do jogo estão num arquivo só.** Quando você pedir "cria tal coisa",
eu já uso as cores de lá — não invento cor nova.

Cada item tem **três cores**, sempre nesta ordem:

```
[ 'BASE' , 'LUZ' , 'SOMBRA' ]
   │        │       │
   │        │       └── parte de baixo / lado escuro
   │        └────────── parte de cima / onde bate a luz
   └─────────────────── a cor principal
```

Para trocar, muda só o texto entre aspas:

```
ANTES:   gold_plate: ['#f0c850', '#ffe08a', '#c19a2e'],
DEPOIS:  gold_plate: ['#FFD700', '#ffe08a', '#c19a2e'],
                       └── só isto
```

**Regra da família** (a que você descreveu): o **minério** é mais escuro e sujo; a
**barra/placa** do mesmo material é mais clara e brilhante; e a **ferramenta** feita
daquele material usa a mesma tonalidade da barra. Assim tudo do mesmo material se
reconhece de longe. Isso já está valendo — o minério de ouro está mais escuro que a
placa de ouro, e o mesmo para ferro e cobre.

O arquivo tem três tabelas: **ITENS** (o que vai na mochila), **TERRENO** (o chão) e
**JAZIDAS** (a manchinha em cima do chão, mais a árvore e o pedregulho).

> As cores valem para os desenhos provisórios **e para o mapa**. Quando você entregar
> o PNG de verdade, ele passa na frente — a cor daqui vira só referência de qual
> tonalidade usar no Piskel.

### 📥 Arte já entregue

| O que | Arquivo | Situação |
|---|---|---|
| Picareta de madeira | `assets/items/wood_pickaxe.png` | ✅ 32×32 RGBA, funcionando no jogo |
| Picareta de pedra | `assets/items/stone_pickaxe.png` | ✅ |
| Picareta de ferro | `assets/items/iron_pickaxe.png` | ✅ |
| Picareta de ouro | `assets/items/gold_pickaxe.png` | ✅ |

### Como entregar
- **PNG com fundo transparente** (no Piskel: *Export → PNG*).
- Nome do arquivo e pasta exatos estão em [`assets/LEIA-ME.md`](assets/LEIA-ME.md).
- **É só salvar o arquivo na pasta certa** — o jogo já procura por ele e troca o
  desenho provisório automaticamente. Não precisa mexer em código.

---

## 8. Stack técnica

- **HTML5 + Canvas 2D + JavaScript puro**, sem dependências e sem build.
- Abre com duplo clique no `index.html`.
- `imageSmoothingEnabled = false` e zoom inteiro, para pixel art nítida.
- Todo sprite tem **fallback desenhado por código**: enquanto a arte real não chega,
  o jogo desenha uma forma provisória no lugar.

### Estrutura de pastas
```
factoriozinho/
├── index.html
├── GDD.md
├── assets/              # a arte entra aqui (ver assets/LEIA-ME.md)
│   ├── tiles/  items/  buildings/  player/
└── src/
    ├── css/
    └── js/
        ├── core/        # settings, saves
        ├── ui/          # menu, hud, fundo animado
        └── game/        # data, rng, world, player, render, input, game
```

---

## 8.4 ⚠️ Ao entregar: subir a versão no `index.html`

O jogo abre por duplo clique (`file://`), e nesse modo o navegador **guarda o js e
o css antigos em cache** — o Vandré abre o jogo e vê a versão de ontem, sem erro
nenhum na tela. Por isso todo `<script>` e `<link>` do `index.html` termina em
`?v=0.8.3`. **A cada entrega, subir esse número em todos eles** (o teste
`12-painel-no-jogo.js` cobra que estejam todos na mesma versão). Em último caso,
`Ctrl`+`F5` no navegador resolve na hora.

---

## 8.5 🐛 Problemas conhecidos (a arrumar)

| O quê | Situação |
|---|---|
| Inventário pouco intuitivo | A **fabricação** já foi separada em seções (Ferramentas / Estruturas / Itens) em 02/09/2026. A **tela do inventário** em si ainda pede uma passada de organização. |
| Visual em geral | Tudo ainda é desenho provisório feito por código. A arte de verdade entra pelos PNGs (§7). |

**Já resolvido:** o quadriculado dos chunks no mapa (02/09/2026, v0.8.1) — as
regiões viraram células com centro sorteado e fronteira embaralhada por ruído (§5.3).

---

## 9. Roadmap

- [x] **Fase 0 — Menu**: título, novo jogo, carregar, configurações.
- [x] **Fase 1 — O jogo existe**: mundo por semente, personagem andando, câmera,
      colisão, coleta manual, recursos finitos, inventário, hotbar, fabricação na mão,
      construção, forno funcionando, mineradora funcionando, baú, save/load real.
- [x] **Fase 1.5 — Mundo fechado e mapa**: mundo finito de 10×10 chunks, minimapa,
      mapa completo no `M`, 6 recursos novos (ouro, urânio, argila, areia, terra,
      petróleo), pilha padronizada em 100, clique na barra rápida.
- [x] **Fase 1.6 — Paleta e atalhos**: arquivo único de cores (§7), `Shift`+clique
      para transferir a pilha inteira entre mochila e máquina.
- [x] **Fase 2 — Esteiras e inseridores**: o transporte de verdade. Esteira com fila
      e entupimento visível, inseridor a combustível que liga qualquer máquina a
      qualquer outra. A linha mineradora→esteira→inseridor→forno→inseridor→esteira→baú
      roda sozinha.
- [ ] **Fase 3 — Montadora**: produção automática de itens compostos.
- [ ] **Fase 4 — Energia elétrica**: caldeira, gerador, postes.
- [ ] **Fase 5 — Pesquisa**: o Analisador e a árvore de tecnologia.
- [ ] **Fase 6 — Blueprints**.
- [ ] **Fase 7 — Trens e robôs logísticos**.
- [ ] **Fase 8 — Robôs ensináveis** (Autonauts).
- [ ] **Fase 9 — Inimigos**, e depois PvP.
- [ ] **Fase 10 — A nave**: a cadeia final e o fim do jogo.
- [ ] **Fase 11 — Polimento**: som, tutorial, modos de jogo, XP.

---

## 9.5 📍 Onde paramos

**02/09/2026 — v0.8.3, Fase 2 concluída + mapa e painéis arrumados.**

Funcionando: mundo finito por semente, coleta manual, inventário e fabricação,
construção, forno, mineradora, baú, **esteiras de duas faixas com side-load e curva
automática**, **inseridores**, minimapa e mapa, save em 5 slots. As 4 picaretas
existem como item com a arte pronta, mas ainda **não fazem nada**.

O mapa não mostra mais o quadriculado dos chunks e as jazidas não nascem mais
coladas umas nas outras (§5.3). O **inspetor** (§5.4) mostra, no canto direito da
tela do jogo e também na janela do mapa, o que tem debaixo do cursor — o processo
dentro do forno, o que a mineradora ainda tem para tirar, o conteúdo da jazida. A
fabricação foi dividida em seções (§5.8).

**Mundos antigos salvos continuam abrindo, mas o mapa deles muda**: o save guarda só
o que você mexeu, o resto é regerado — então as jazidas que você ainda não tocou
aparecem redistribuídas.

**Combinado sobre o git:** commit a cada entrega, mas o `push` só quando ele pedir.

**O próximo passo do roadmap é a Fase 3 (Montadora)** — mas confirmar com o Vandré
antes, porque ele costuma testar e trazer ajustes primeiro.

Na fila, na ordem que ele definiu: progressão de picaretas (§3.1) → matemática do
jogo (§3.2) → diamante → sobrevivência. Os problemas conhecidos estão em §8.5, e as
cores que faltam estão no `CORES.md`.

---

## 10. Histórico

| Data | O que mudou |
|---|---|
| 02/09/2026 | **v0.8.3** — Correções do teste dele. O **inspetor foi para o lugar certo**: canto direito da **tela do jogo**, embaixo do minimapa (antes eu só tinha posto na janela do mapa). A **tarja do meio do topo saiu**, e a **barra de progresso saiu de baixo das estruturas** — a progressão agora só aparece no painel. Descoberto que o navegador servia js e css **em cache** quando o jogo abre por duplo clique: todo script e css do `index.html` agora leva `?v=` (ver §8.4). Nas jazidas, entrou uma **faixa sem minério entre regiões vizinhas** (§5.3): minérios diferentes não nascem mais colados (encosto caiu de 5,4% para 0,04%) e as retas que sobravam sumiram; a cobertura caiu de ~19% para ~12% do mapa, com ~89 jazidas de 40+ tiles por mundo. A **fabricação virou três seções** — Ferramentas, Estruturas e Itens (§5.8). Novo teste `12-painel-no-jogo.js`. |
| 02/09/2026 | **v0.8.2** — **Inspetor no mapa** (§5.4): passar o mouse por qualquer lugar do mapa mostra na coluna da direita, embaixo da legenda e com ícone, o que tem ali — a jazida com o quanto sobrou no quadrado e na mancha inteira, o forno com o que está fundindo e a barra de progresso, a mineradora com o total que ainda dá para tirar e quanto tempo falta, o baú com o conteúdo, a esteira com as duas faixas e o inseridor com o que está na mão. As barras andam sozinhas com o mouse parado. O texto de hover saiu do rodapé do mapa e virou esse painel. Novo teste `11-inspetor-do-mapa.js`. Registradas duas decisões dele: **areia, argila e terra vão deixar de ser jazidas** (§5.5, a definir) e o **`git push` passa a esperar a ordem dele**. |
| 02/09/2026 | **v0.8.1** — Acabou o **quadriculado dos chunks no mapa** (§8.5): a região de minério deixou de ser o quadrado do chunk e virou uma célula com centro sorteado (estilo Voronoi), com o ponto de consulta embaralhado por duas ondas de ruído — uma grande que entorta a fronteira e uma miúda que solta ilhotas. As proporções passaram a ser repartidas por **área** de região, porque agora as regiões têm tamanhos diferentes. Novo teste `10-regioes.js`, que mede o quadriculado em número em vez de olhar a tela. Corrigido um teste frágil no `08` (procurava carvão numa semente e usava a coordenada em outra). Efeito colateral bom: sementes com começo pobre praticamente sumiram (era ~1 em 40, agora 0 em 120). |
| 21/08/2026 | Doc criado com a pesquisa dos 3 jogos. Fase 0 (menu) implementada. |
| 21/08/2026 | **v0.2** — Correções do Vandré: objetivo = sair do planeta; recursos **finitos**; fora árvore de habilidades, respawn, ilhas, economia, NPCs e frascos de ciência; esteiras/blueprints/robôs/inimigos remarcados para fases futuras; `E` abre inventário; adicionada a especificação de arte (§7). **Fase 1 implementada.** |
| 22/08/2026 | **v0.8** — Mais correções do teste: a **mineradora** agora joga na faixa **do lado dela** (a que fica na frente da saída), enquanto o **inseridor** continua na faixa oposta — assim os dois podem alimentar a mesma esteira sem brigar. Corrigida a **animação da esteira, que corria ao contrário** do sentido dela. Refeita a **textura da curva**: o centro do arco estava no canto errado, por isso as curvas saíam tortas; o caminho do item virou um arco de verdade, com a faixa de dentro num raio menor. Nova tecla **Q**: aponta para algo no chão e pega na mão na hora (copiando inclusive a direção da máquina). |
| 22/08/2026 | **v0.7** — Corrigidas as regras de faixa que o Vandré pegou testando: o **inseridor e a mineradora usavam as duas faixas** (agora usam só a oposta ao lado delas e esperam se encher); **side-load** implementado (esteira entrando pela lateral joga tudo na faixa daquele lado); **curva automática** — a esteira vira sozinha quando só uma esteira lateral a alimenta, com as faixas preservadas. Corrigido o **bug visual dos itens cortados**: as esteiras agora são desenhadas em duas passadas (todas as bases, depois todos os itens), então nenhuma corta os itens da vizinha. O `CORES.md` foi reorganizado com as cores dele já nas tabelas. |
| 22/08/2026 | **v0.6.1** — Aplicadas as **cores reais do Vandré** (CORES.md) para madeira, pedra, carvão, ferro, cobre e ouro. A paleta passou de 3 para **5 tons por material** (base, luz, sombra, brilho, sombra profunda), acompanhando o jeito que ele desenha. A regra da família virou automática: o minério usa os tons escuros da paleta e a placa/ferramenta usa os claros. Contorno agora é preto puro. |
| 22/08/2026 | **v0.6** — **Esteira com dois lados** (faixa esquerda e direita, 4 itens cada = 8 por tile); quem entrega põe sempre na faixa oposta ao seu lado, e o item mantém a faixa de uma esteira para a outra. Corrigido: shift+clique não funcionava no inseridor (faltava o caso dele na regra de destino). Picaretas de madeira/pedra/ferro/ouro do Vandré entraram no jogo (item + receita + arte). Registradas as decisões de progressão de ferramentas (§3.1), matemática do jogo (§3.2), diamante e sobrevivência. |
| 22/08/2026 | **v0.5.1** — Correções do teste do Vandré: `R` com o mouse em cima **gira a máquina já construída** (antes só mudava a direção do próximo a construir); setas verde/laranja mostrando de onde o inseridor pega e para onde põe, tanto no fantasma quanto ao passar o mouse; seta fixa na base do inseridor; `E` fecha qualquer janela aberta; o painel da máquina fecha sozinho quando o jogador se afasta; nova construção nasce apontando para leste. |
| 22/08/2026 | **v0.5 — Fase 2** — **Esteiras e inseridores.** Esteira 1×1 girável, 2 tiles/s, 4 itens por tile, com fila que trava quando entope. Inseridor 1×1 girável que pega de trás e põe na frente, ~1 item/s, a combustível (1 carvão ≈ 50 s). Receitas: esteira (1 engrenagem + 1 placa de ferro → 2) e inseridor (1 engrenagem + 1 placa de ferro + 1 placa de cobre). Dá para jogar item na esteira clicando nela com o item na mão. |
| 22/08/2026 | **v0.4** — Criado o **arquivo único de cores** (`paleta.js`, §7), com base/luz/sombra por item e a regra da família (minério escuro → barra clara → ferramenta na cor da barra). `Shift`+clique transfere a pilha inteira entre mochila, baú e máquinas, sempre no primeiro lugar livre da esquerda para a direita. Registrado o quadriculado dos chunks no mapa como problema conhecido (§8.5). |
| 21/08/2026 | **v0.3** — Mundo agora é **finito** (10×10 chunks). Minimapa + mapa no `M` com legenda de recursos restantes. Novos recursos: ouro, urânio, argila, areia, terra e petróleo. Minérios distribuídos por região (um dominante por chunk). Pilha padronizada em 100 em tudo. Corrigido: clicar no slot da barra rápida agora seleciona. Anotadas a progressão de picaretas (§5.6) e a escala de combustíveis (§5.7). |

---

## 11. Fontes da pesquisa

- Factorio — [site oficial](https://www.factorio.com/game/content) · [wiki](https://wiki.factorio.com/Tutorial:Quick_start_guide)
- Autonauts — [Denki](https://denki.co.uk/games/autonauts/) · [wiki: Programação](https://autonauts.fandom.com/wiki/Programming)
- Forager — [wiki: Recursos](https://forager.fandom.com/wiki/Resources)
