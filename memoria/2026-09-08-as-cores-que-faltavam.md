# 08/09/2026 — As cores que faltavam

O Vandré trouxe, de uma conversa com outra IA, as paletas dos materiais que ainda
estavam com `#______` no `CORES.md`. Chegaram prontas: os 5 tons de cada um, mais
uma **direção visual** e uma **aplicação** por material.

## O que foi decidido

**A direção visual e a aplicação valem tanto quanto o hex.** O hex diz *qual* cor;
a aplicação diz *onde ela vai* no desenho — "o minério é predominantemente `#3F8B35`",
"os ícones de inventário da areia usam a sombra como base". Isso é instrução de
desenho e agora fica guardado junto da tabela no `CORES.md`. Sem ela, o hex sozinho
não diz como o item deve ficar.

**A base da paleta nem sempre é a cor piloto.** No `paleta.js` o primeiro valor do
vetor é a cor que preenche o objeto. Para três materiais ela virou a **sombra**,
seguindo o que ele escreveu:

| Material | Base | Por quê |
|---|---|---|
| Urânio | `#3F8B35` (sombra) | é minério bruto |
| Areia (recurso) | `#95723D` (sombra) | ele pediu explicitamente, até para o ícone |
| Terra (recurso) | `#643A29` (sombra) | senão fica idêntica ao chão de terra |
| Argila, vidro, petróleo | cor piloto | ele pediu assim |

O caso da terra é o mais claro: terra-recurso `#965A34` e terra-chão `#8F5D38` são
quase a mesma cor. Se o depósito usasse a cor piloto, ele sumiria no chão. A sombra
resolve — e foi por isso que ele escreveu a regra.

**O diamante entrou só no papel.** A cor está escolhida (`#56C5E6` e família), mas
não existe item, jazida nem receita de diamante no jogo. Ficou registrada no
`CORES.md` com o aviso, e como comentário no `paleta.js`, para não procurar depois.

## O que foi feito

- `documentos/CORES.md` — reescrito. Todos os materiais saíram de "Faltam" e foram
  para "Prontas", cada um com tabela + direção visual + aplicação. Ganhou uma seção
  própria para o terreno e a tabela geral de regra de uso (minério / placa /
  ferramenta / terreno / líquido).
- `src/js/game/paleta.js` — urânio, areia, vidro, terra, argila e petróleo em `ITENS`;
  água, areia, grama, mato e terra em `TERRENO`; as mesmas em `JAZIDAS`.
- `src/js/game/data.js` — as cores de reserva (`cor`, `cor2`), usadas no desenho
  provisório enquanto não há PNG, alinhadas com a paleta.
- `assets/LEIA-ME.md` — a tabela de "sugestão de paleta" foi apagada. Era anterior
  ao `CORES.md`, tinha o contorno errado (`#1a1a20` em vez de `#000000`) e concorria
  com o arquivo oficial. No lugar ficou um ponteiro para o `CORES.md`.
- Versão para **0.9.3** (`index.html`, `src/js/main.js`, `GDD.md`).
- Testes: 19/19 passaram.

## Uma armadilha que apareceu

Ao trocar as cores com `sed`, o padrão `^    sand:` acertou **três** lugares —
`ITENS.sand`, `TERRENO.sand` e `JAZIDAS.sand`. O terreno levou a paleta da areia de
**recurso** (escura) no lugar da areia de **chão** (clara). Passou despercebido no
comando e só apareceu na conferida da saída.

A lição: no `paleta.js` a mesma chave existe em três tabelas com significados
diferentes. Trocar por nome de chave é perigoso ali — ou se mira a linha, ou se
confere a saída tabela por tabela.

## O que ficou pendente

- **A folhagem da árvore** é a única paleta que ainda falta. Hoje usa um verde
  provisório meu, mais escuro que o mato. O tronco já usa a madeira.
- O **ícone da pedra** (`assets/items/stone.png`), que ele disse que ia desenhar.

## O histórico teve de ser costurado

Enquanto eu mexia nas cores, **outra sessão minha rodava na mesma pasta** e deu
`git add -A`. As cores foram varridas para o commit dela — `44bdc64`, "v0.9.2 — o
gerador aceita combustível" —, um commit cuja mensagem não fala de cor nenhuma. E
isso contra o pedido dele de não commitar sem ordem.

Ele mandou arrumar. Como nada tinha sido enviado ao GitHub (`origin/main` estava 18
commits atrás), dava para reescrever com segurança. A separação era limpa por
arquivo — nenhum arquivo tinha as duas coisas misturadas dentro:

| Arquivo | De quem |
|---|---|
| `CORES.md`, `paleta.js`, `data.js`, `assets/LEIA-ME.md` | cores |
| `GDD.md`, `index.html`, `main.js`, `game.css`, `player.js`, `hud.js` | v0.9.2 |

Virou `4374c51` (v0.9.2, mensagem original preservada) e `fb0dce1` (v0.9.3, as cores).
Conferido que o resultado bate com o original: a única diferença é o que eu escrevi
depois. Ficou o galho `backup-antes-da-cirurgia` apontando para o commit velho.

**A lição:** "não commitar" não garante que nada seja commitado, porque outra sessão
pode varrer meu trabalho. Ao terminar, conferir `git log` e `git status` — se o que
editei não aparece como modificado, alguém já commitou.

---

# 09/09/2026 — o carvão, e o jogo finalmente subiu

## O carvão

Chegou quase limpo: 32×32, margens 2/2/3/3, nenhum pixel semitransparente, e das
7 cores **6 eram exatamente a paleta do carvão**. Sobrou um `#5A6A65` esverdeado
em (28,7) — resto da imagem de referência por baixo. Puxado para `#505B60`.

Vale registrar a curva: a engrenagem chegou com **26 cores e 31 pixels** fora da
paleta; o pedregulho, com 2; o carvão, com 1. Ele pegou o jeito de conferir no
"Current colors" do Piskel antes de mandar.

Virou `assets/items/coal.png`, e o `.piskel` foi para `assets/_piskel/`.

## O jogo subiu — 20 commits de uma vez

Ele perguntou se, chegando em outro computador e pegando o que está no GitHub,
conseguiria continuar de onde paramos. A resposta tinha duas partes, e as duas
importam:

**1. `commit` não manda nada para a nuvem.** Commit guarda neste computador;
quem envia é o `push`. Como a regra dele é "só quando eu pedir", havia **20
commits parados** e o GitHub estava em `61f7ab4`, de **22/08** — sem
eletricidade, sem as cores e sem nenhuma arte dele.

**2. A partida não viaja, mesmo com o push.** Os saves ficam no `localStorage`
do navegador (5 slots, `src/js/core/saves.js`), não são arquivos da pasta. O Git
não os vê. Em outro computador ele teria o mesmo jogo com os **5 slots vazios**.
**Não existe exportar/importar save** — ficou de decidir se quer que eu faça.

Ele mandou enviar tudo, porque **o pai dele quer ver o jogo**. Push feito:
`61f7ab4..515ed9a`. E a regra ficou: quando ele pedir para enviar, sobe o jogo
inteiro, sem escolher pedaços.

## Uma correção: o repositório é público

A memória dizia "repositório privado" desde 22/08. Conferido com `gh api`:
`"private": false`. Está **público** — qualquer um com o link vê o código. Isso
ajuda no caso do pai dele, mas ele precisa saber que é assim.

O **GitHub Pages não está ligado** (`has_pages: false`). Como o jogo é HTML e JS
puros e já abre por duplo clique, ele funcionaria em Pages sem mudar nada — daria
um link para o pai dele clicar e jogar, em vez de baixar um ZIP. Não liguei:
publicar é decisão dele.
