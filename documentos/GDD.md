# Factoriozinho — Documento de Design (GDD)

> **Documento vivo.** É a fonte da verdade do projeto. Pode editar, cortar e
> reescrever à vontade — eu leio este arquivo antes de mexer no código. Se algo
> aqui estiver diferente do jogo, o arquivo ganha.
>
> Última atualização: 08/09/2026 · Versão do doc: **0.9.1** · Jogo: **v0.9.1**
>
> 📦 Código no GitHub: **botlab-agencia-de-IA/factoriozinho-game** (privado)
> 🧪 Para testar sem abrir o jogo: duplo clique no `testar.bat`
>
> 🔢 Os números do jogo (o que cada máquina produz e come) estão no `MATEMATICA.md`

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
  Escolhe-se pelo **número (1–8) ou clicando no slot** — a roda do mouse **não**
  troca de slot, ela é só do zoom.
- Pegar/soltar pilha com o mouse (clique esquerdo pega tudo, direito pega metade).
- **Dá para construir com a estrutura presa no cursor**, direto da mochila, sem
  precisar passar pela barra rápida: pega a estrutura no inventário, fecha, e vai
  clicando. O fantasma aparece igual. Botão direito devolve para a mochila.
- **Não dá para construir em cima do próprio personagem** — o aviso diz "Você está
  em cima". E se por algum motivo ele ficar preso dentro de coisa sólida (um save
  antigo, por exemplo), é empurrado para o lugar livre mais perto no quadro
  seguinte, em vez de ficar travado ou sair atravessando parede.

**As manhas de inventário** (copiadas do Factorio e do Minecraft, a pedido dele):

| Gesto | O que faz | De onde veio |
|---|---|---|
| Botão **direito** numa pilha | pega **metade** dela no cursor | Factorio |
| **Fechar a mochila** com algo no cursor | a pilha **continua na mão** | Factorio |
| **Clique esquerdo numa máquina** com a pilha na mão | enfia **tudo que couber** no slot certo (combustível vai para o combustível, minério para a entrada) | Factorio |
| **Clique direito numa máquina** com a pilha na mão | enfia **um** | Factorio |
| Clique esquerdo **no chão** com a pilha na mão | devolve para a mochila | — |
| **Arrastar** a pilha por vários slots | divide **igual** entre eles; o resto fica no cursor | Minecraft |
| **Arrastar com o direito** | deixa **um** em cada slot | Minecraft |
| **Dois cliques** no mesmo slot com a pilha na mão | junta **todo aquele item** na mão, começando pelos montes menores | Minecraft |
| **Shift + clique** | manda aquela pilha para o outro lado | Factorio/Minecraft |
| **Shift + dois cliques** no mesmo slot | manda **todo aquele item** para o outro lado, nos dois sentidos | Minecraft |

O clique duplo só vale no **mesmo slot** e dentro de 350 ms — senão clicar
depressa em dois lugares com o mesmo item já contaria como duplo.

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
   separadas em **seções: Ferramentas, Estruturas e Itens**, e a tela mostra **uma
   seção por vez** — clica no botão da seção e a lista troca. A seção de cada
   receita é o campo `cat` em `data.js`.
2. **Forno** — funde minério em placa, queimando combustível.
3. **Montadora** (futuro) — recebe ingredientes por esteira/inseridor e produz sozinha.

**Pilha (stack): 100 para tudo.** Vale para a mochila, para o baú e para os slots
internos das máquinas — o forno para de produzir quando a saída chega em 100.

### 5.9 Automação (o coração)

**Dá para andar por cima da esteira.** Ela é a única construção atravessável
(`atravessavel: true` em `data.js`) — atravessar a própria linha faz parte de
andar pela fábrica. Todo o resto barra o jogador.

**A mineradora cospe sempre no lado DIREITO da frente dela** — direita de quem está
dentro da máquina olhando para fora:

| Ela aponta para | O item sai em |
|---|---|
| norte | canto de cima, à **direita** (leste) |
| leste | canto da frente, **embaixo** (sul) |
| sul | canto de baixo, à **esquerda** na tela (oeste) |
| oeste | canto da frente, **em cima** (norte) |

Antes o lado mudava conforme a direção — a mesma mineradora girada entregava ora de
um lado ora do outro, e não dava para montar duas linhas iguais. Isso vale para
qualquer máquina maior que um tile; nas de 1×1 (esteira, inseridor) frente e lado
são o mesmo tile, então nada muda.

**O inseridor pensa antes de pegar.** Ele olha o que a máquina da frente precisa
**agora** e só pega isso. Numa esteira que leva carvão e minério junto, ele enche a
fornalha de carvão até o limite e depois passa a levar minério, sozinho. Se nada do
que está passando serve, ele espera de braço parado e o painel diz "Nada que sirva
na frente".

**Limite de combustível na entrega automática:** `FUEL_AUTOMATICO` = **3**
(`data.js`). Inseridor e mineradora só repõem combustível numa máquina até esse
tanto — senão entopem a fornalha de carvão e não sobra braço para o minério. **Na
mão o jogador enche o quanto quiser**, até 100.

**O inseridor a carvão se serve sozinho.** Sem combustível ele não trabalharia, e
portanto nunca se reabasteceria. Como no Factorio, ele tem esse direito: se houver
combustível ao alcance atrás dele, pega para si mesmo e volta a funcionar. É o que
faz uma linha de carvão se auto-sustentar.
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
| Barra rápida | `1`–`8` **ou clicar no slot** (a roda não troca de slot) |
| Abastecer máquina | pegar a pilha na mochila e **clicar na máquina** (direito enfia 1) |
| Zoom | **roda do mouse**, ou `+` / `-` |
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
├── README.md
├── documentos/          # GDD.md, CORES.md, MATEMATICA.md
├── memoria/             # o diário do projeto, uma conversa por arquivo
├── assets/              # a arte entra aqui (ver assets/LEIA-ME.md)
│   ├── tiles/  items/  buildings/  player/
│   ├── _piskel/         # os originais do Piskel (fonte da arte)
│   └── _referencia/     # rascunhos meus, ponto de partida para desenhar
└── src/
    ├── css/
    └── js/
        ├── core/        # settings, saves
        ├── ui/          # menu, hud, fundo animado
        └── game/        # data, rng, world, player, render, input, game
```

---

## 8.3 ⚡ Desempenho do desenho

O chão (terreno + jazida) é desenhado **por chunk, de um canvas guardado**: cada
chunk de 32×32 tiles é pintado uma vez numa imagem de 32 px por tile, e o quadro
faz **um `drawImage` por chunk**. Antes era um por tile, e no zoom mais aberto
passavam de dois mil por quadro — era isso que travava o jogo quando se tirava o
zoom. Medido pelo teste `13-desempenho-e-secoes.js`, numa tela de 1400×730:

| zoom | desenhos por quadro | como era |
|---|---|---|
| 4 | 27 | ~90 |
| 2 | 36 | ~300 |
| 1 | 43 | ~2000 |

E numa **mata fechada**, que era o caso ruim de verdade, no zoom 1: **16 desenhos
por quadro**, contra ~362 antes.

**As árvores e os pedregulhos vão no mesmo desenho guardado.** Eram eles o
verdadeiro peso: numa mata fechada davam ~360 desenhos por quadro, um por árvore
— por isso o jogo ficava liso perto da base (já desmatada) e travava no mato. Com
elas dentro do chunk guardado, o mesmo lugar caiu para **16 desenhos por quadro**.
Duas coisas que isso exige:
- o canvas do chunk tem **um tile de margem em cima**, senão a copa da árvore da
  primeira linha sairia cortada bem na emenda entre dois chunks;
- como a árvore vem pintada junto com o chão, ela ficaria sempre atrás do jogador
  — então as poucas árvores **à frente dele** (uma janela de ~20 tiles em volta)
  são repintadas por cima depois.

Regras da coisa:
- **Guarda no máximo 14 chunks** (cada um pesa ~4 MB); os que saem de vista são
  descartados pelo menos usado.
- O chunk do lado para onde a câmera está indo é pintado **antes de aparecer**, um
  por quadro, para a pintura não cair no mesmo quadro em que ele entra na tela.
- Minerar **suja** o chunk, que é repintado no quadro seguinte — no máximo 2
  repinturas por quadro, para uma fábrica grande não engasgar tudo de uma vez.
- Trocar de mundo ou carregar a arte de verdade (PNGs) **limpa o cache inteiro**.
- Como o zoom é sempre inteiro, esticar essa imagem cai certinho em cima do pixel.

Junto disso, `World.idx()` **lembra do último chunk lido** (o desenho anda de tile
em tile, então quase toda leitura cai no mesmo chunk da anterior) e o render varre
a **lista de entidades** em vez de perguntar tile a tile se tem máquina ali. Só
essas duas coisas cortaram o custo de leitura de 2,9 ms para 0,9 ms por quadro no
pior caso.

**Na tela tem um contador de fps** no canto de cima à esquerda, com o zoom do lado
— é por ele que dá para dizer "travou" com número junto.

---

## 8.4 ⚠️ Ao entregar: subir a versão no `index.html`

O jogo abre por duplo clique (`file://`), e nesse modo o navegador **guarda o js e
o css antigos em cache** — o Vandré abre o jogo e vê a versão de ontem, sem erro
nenhum na tela. Por isso todo `<script>` e `<link>` do `index.html` termina em
`?v=0.8.3`. **A cada entrega, subir esse número em todos eles** (o teste
`12-painel-no-jogo.js` cobra que estejam todos na mesma versão). Em último caso,
`Ctrl`+`F5` no navegador resolve na hora.

---

## 8.45 🔢 A matemática

Os números do jogo — quanto cada máquina produz, come e queima, e as proporções que
saem disso — moram no **`MATEMATICA.md`**. A regra que o Vandré fechou:

> Tudo por minuto. **1 mineradora a carvão alimenta 1,5 fornalhas**; a elétrica
> (Fase 4) vai alimentar 2,5. **Um carvão vale 30 segundos de máquina**, a madeira
> vale 10 — três madeiras por carvão.

Disso saem: fornalha 20 peças/min (3 s cada), mineradora a carvão 30 minérios/min,
inseridor 60 itens/min (dá conta de duas mineradoras), e a conta de bolso
`carvão/min = 2 × (mineradoras + fornalhas) + 0,6 × inseridores`. Eles não são conta de papel: o teste `16-matematica.js` monta cada máquina
num mundo de teste, roda um minuto de jogo e conta o que entrou e o que saiu. Se
alguém mexer numa velocidade sem querer, a bateria avisa.

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

**08/09/2026 — v0.9.1, a eletricidade começou (Fase 4 antecipada).**

Funcionando: mundo finito por semente, coleta manual, inventário e fabricação,
construção, forno, mineradora, baú, **esteiras de duas faixas com side-load e curva
automática**, **inseridores**, minimapa e mapa, save em 5 slots. As 4 picaretas
existem como item com a arte pronta, mas ainda **não fazem nada**.

O mapa não mostra mais o quadriculado dos chunks e as jazidas não nascem mais
coladas umas nas outras (§5.3). O **inspetor** (§5.4) mostra, no canto direito da
tela do jogo e também na janela do mapa, o que tem debaixo do cursor — o processo
dentro do forno, o que a mineradora ainda tem para tirar, o conteúdo da jazida. A
fabricação foi dividida em seções, uma por vez (§5.8).

A **roda do mouse agora é só do zoom** (a barra rápida vai por número ou clique), o
chão passou a ser desenhado por chunk guardado — o que resolveu o travamento no zoom
aberto (§8.3) — e há um **contador de fps** no canto de cima à esquerda.

O inventário ganhou as manhas do Factorio e do Minecraft (§5.2): pegar metade com
o direito, sair com a pilha na mão e abastecer a máquina clicando nela, arrastar
dividindo entre slots, clique duplo juntando tudo e Shift + clique duplo mandando
todo um item para o baú.

O inseridor passou a entender o que a máquina da frente precisa, existe limite de
combustível na entrega automática, o inseridor a carvão se abastece sozinho, não dá
mais para construir em cima do personagem e dá para construir com a estrutura presa
no cursor (§5.2 e §5.9).

A **matemática está aplicada** (`MATEMATICA.md`): 1 mineradora a carvão = 1,5
fornalhas, 1 carvão = 30 s de máquina, 3 madeiras = 1 carvão. **Dá para andar por
cima das esteiras** e a **mineradora cospe sempre no lado direito da frente**
(§5.9) — isso mexe nas linhas já montadas: a esteira que recebia a mineradora
precisa descer um tile.

**Falta fazer no mapa (`M`), combinado com ele:** dar zoom no mapa com a roda,
para poder aproximar um canto e ver as estruturas daquele pedaço.

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
| 08/09/2026 | **v0.9.1** — **A eletricidade entrou**, com os números dele (`MATEMATICA.md` §6). A unidade é o **watt**. **Gerador a carvão** (2×2): queima carvão ou madeira e põe **100 W** na rede — e **só queima o que a rede usa**, então rede parada não come carvão; a plena carga são 2 carvões/min, a mesma medida de sempre. **Poste elétrico** (1×1, 2 madeiras + 1 fio de cobre): atende **5×5** com ele no meio e liga em outro poste a até **7 quadrados** de centro a centro — a conta dele: 5 + 2 de vão + 5 = 12 de ponta a ponta. A rede segue de poste em poste, e o **fio é desenhado** entre eles (amarelo com energia, cinza sem). Com o poste na mão aparecem a zona 5×5 e o risco até os postes que ele alcançaria dali. **Inseridor elétrico** (vermelho, escolha dele): 1 engrenagem + 1 circuito + 1 chapa, **bebe 5 W**, não come nada — e é **seis vezes mais barato em carvão** que o a combustível, que é o que paga a eletricidade. **Falta energia? Ninguém para**: todos andam mais devagar na mesma proporção, como no Factorio. Itens novos: **fio de cobre** (1 chapa de cobre → 2 fios) e **circuito eletrônico** (2 fios + 1 chapa de ferro). Novo módulo `src/js/game/energia.js` e o teste `19-energia.js`. |
| 08/09/2026 | **v0.9.0** — Pedidos dele antes da energia. **A mochila é a mesma em toda janela**: abrir um baú, um forno ou uma mineradora mostra a mochila de sempre embaixo — com o botão Organizar, a escolha de ordem e a barra rápida separada — e não mais uma grade solta de 40 slots. **Baú de ferro**: 5 placas de ferro, **24 pilhas** (oito a mais que o de madeira). E ficaram **registradas as decisões da eletricidade** (`MATEMATICA.md` §6), que é o que vem em seguida: gerador a combustão que aceita carvão e madeira, fio de cobre (1 chapa → 2 fios), poste de 2 madeiras + 1 fio, zona 5×5 com o poste no meio, **alcance de fio de 7 quadrados** (5 + 2 de vão + 5 = 12 de ponta a ponta), a rede seguindo de poste em poste, e as versões a combustão convivendo com as elétricas. |
| 08/09/2026 | **v0.8.9** — A mochila e a fabricação, do jeito dele. **Botão Organizar**, com escolha de ordem: **por nome** ou **por quantidade** (a escolha fica guardada nas configurações). **A roda do mouse em cima de qualquer slot organiza** — era o único botão livre ali dentro. Organizar **nunca mexe na barra rápida**: a picareta que está no 1 continua no 1. E a **barra rápida agora aparece separada** no fim da mochila, com as teclas 1 a 8 escritas, no jeito do Minecraft — antes eram os 8 primeiros slots da grade e nada dizia isso. **A janela da mochila tem tamanho travado** (620px de altura): antes ela crescia conforme a fila e a lista de receitas enchiam, e ficava pulando de tamanho no meio do jogo; agora o que passa rola por dentro. **A fila de fabricação saiu da janela e foi para o canto de baixo à direita da tela**, visível com a mochila aberta ou fechada, com ícone, barra de progresso do que está sendo feito e quantos estão esperando. **Fabricação em escada** (§5.8), como no Factorio: com chapa e pedra na mochila, clicar na mineradora faz as 3 engrenagens, o forno e só então a mineradora — e os pedaços não passam pela mochila, vão direto para o próximo degrau. A receita mostra na lista o que será feito antes. Cancelar cancela **o pedido inteiro** e devolve tudo; o que já ficou pronto volta como peça pronta em vez de evaporar. Novo teste `18-organizar-e-cascata.js`. |
| 08/09/2026 | **v0.8.8** — Correções do teste dele. **O FPS perto da base**: eram duas coisas somadas. Cada minério extraído mandava **repintar o chunk inteiro** (mil e poucos desenhos) — só que tirar um minério de 415 para 414 não muda nada na tela, então agora o chão só é repintado quando a jazida troca de desenho (medido: 45 repinturas em 10 s com 9 mineradoras viraram **zero**). E o **ícone de cada item em cima da esteira era redesenhado traço por traço, 60 vezes por segundo**; agora cada um é pintado uma vez e copiado — numa base cheia (2.700 itens na tela) o quadro caiu de **54 ms para 19 ms**. Junto: a forma da esteira (reta ou curva) deixou de ser recalculada a cada quadro, o desenho dos itens parou de criar lixo para o coletor e o canvas virou opaco. **A faixa em que a mineradora despeja** saía sempre a mesma: a conta comparava a posição da saída com a da esteira, e numa máquina 2×2 a saída **é** o tile da esteira, então dava zero sempre e caía na direita. Agora o lado sai da **face** de quem entrega — o minério cai na faixa do lado de onde veio, nas quatro direções (teste `17-lado-da-mineradora.js`). **O ícone do minério achatado no mapa**: o inspetor mora dentro de `.mapa-legenda`, e uma regra solta em `span` esticava o canvas dele (e uma em `i` esmagava as barrinhas de progresso); a legenda foi escopada na própria lista. **A prévia da mineradora** passou a somar os **quatro quadrados** que ela vai cobrir, com um item por linha e o tempo até esgotar — antes mostrava o quadradinho sob o cursor, um quarto da verdade. |
| 02/09/2026 | **v0.8.7** — **A matemática do jogo fechada com a equação dele** (`MATEMATICA.md`): tudo por minuto, 1 mineradora a carvão = 1,5 fornalhas (a elétrica da Fase 4 = 2,5), 1 carvão = 30 s de máquina e 3 madeiras = 1 carvão. Na prática: fornalha 20 peças/min, mineradora 30 minérios/min, inseridor 60 itens/min — e o número do inseridor na configuração passou a ser o real (cada item gasta dois ciclos). **Dá para andar por cima das esteiras** (`atravessavel` em `data.js`). **A mineradora cospe sempre no lado direito da frente**, nas quatro direções — antes o lado mudava conforme a direção. Isso mexe nas linhas já montadas: a esteira que recebia a mineradora desce um tile. |
| 02/09/2026 | **v0.8.6** — Correções do teste dele no mundo Clarita. **O inseridor ficou esperto**: olha o que a máquina da frente precisa agora e só pega isso — numa esteira com carvão e minério junto, enche a fornalha de carvão até o limite e depois passa a levar minério (§5.9). **Limite de combustível na entrega automática** (`FUEL_AUTOMATICO` = 3): máquina não empilha mais que isso em outra máquina, mas o jogador na mão enche até 100. **O inseridor a carvão se serve sozinho** do que passa atrás, senão nunca sairia do seco. **Não dá mais para construir em cima do personagem**, e quem ficou preso é empurrado para fora (era isso que dava a impressão de atravessar as esteiras — elas sempre barraram). **Dá para construir com a estrutura presa no cursor**, direto da mochila — isso tinha quebrado na v0.8.5, quando o clique com a mão cheia passou a abastecer máquina. Criado o **`MATEMATICA.md`** com os números do jogo medidos e uma proposta, e o teste `16-matematica.js` que os mede rodando a simulação. |
| 02/09/2026 | **v0.8.5** — **O travamento no mato acabou**: as árvores eram desenhadas uma a uma (~360 por quadro numa mata fechada) e foram para dentro do desenho guardado do chunk — 16 por quadro no mesmo lugar (§8.3). Por isso a base dele rodava lisa e o mato travava: perto da base já estava desmatado. **O inventário ganhou as manhas do Factorio e do Minecraft** (§5.2): botão direito pega metade, fechar a mochila não devolve o que está na mão, clicar na máquina abastece (direito enfia 1), arrastar a pilha divide igual entre os slots, dois cliques juntam todo o item na mão e Shift + dois cliques mandam todo o item para o baú e de volta. Novo teste `14-inventario-esperto.js`, com um DOM de mentira que responde a clique e a arrasto. |
| 02/09/2026 | **v0.8.4** — **A roda do mouse virou só zoom** (sem `Ctrl`), e a barra rápida passou a ser escolhida só por número ou clique. **Contador de fps** no canto de cima à esquerda, com o zoom do lado. **O travamento no zoom aberto acabou** (§8.3): o chão agora é desenhado por chunk de um canvas guardado — 43 desenhos por quadro no zoom 1, contra ~2000 antes; junto, `World.idx()` passou a lembrar do último chunk e o render varre a lista de entidades em vez de perguntar tile a tile. A **fabricação passou a mostrar uma seção por vez**, com botões de Ferramentas / Estruturas / Itens. Novo teste `13-desempenho-e-secoes.js`, que conta os desenhos de um quadro com um canvas de mentira. **Combinado para depois: zoom no mapa do `M`.** |
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
