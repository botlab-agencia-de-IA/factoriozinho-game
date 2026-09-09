# 08/09/2026 — A arte do Vandré entra no jogo

Primeira conversa em que a arte saiu do Piskel e entrou no jogo de verdade.
Antes disso, tudo era desenho provisório feito por código.

## O fluxo que ficou combinado

**O Vandré desenha, eu edito por código.** Ele desenha no Piskel e me entrega o
arquivo; eu leio, confiro, corrijo e ponho no lugar certo. Ele não precisa mexer
em código nem em pasta.

- **PNG basta.** Eu leio e escrevo PNG pixel a pixel (decodifico o arquivo direto,
  sem biblioteca nenhuma). Foi assim que confiri o lingote e gerei o cobre e o ouro.
- **O `.piskel` também serve, e é melhor quando tem camadas** — ele é um JSON com o
  PNG dentro, em base64. Eu abro, edito e devolvo um `.piskel` que ele abre no Piskel.
- **O `Export for PixiJS Movie` (PNG + JSON) não serve**: aquele JSON só guarda em
  que posição cada quadro está na folha, não guarda pixel nenhum.
- Na exportação: `Scale 1.0x` e `Resolution 32 x 32`.

## As regras de arte (o que eu confiro em todo desenho que ele manda)

| Confere | Regra |
|---|---|
| Tamanho | 32×32 para ícone de item (ver `assets/LEIA-ME.md` para as outras grades) |
| Fundo | transparente de verdade, sem pixel meio-transparente |
| Margem | 2px de respiro nas bordas |
| Cores | **exatamente 6**: os 5 tons do material (`documentos/CORES.md`) + preto do contorno |
| Nome | o que o jogo procura (`iron_plate.png`, não `INGOT FERRO.png`) |

**Por que a paleta fechada importa tanto:** é ela que me deixa derivar variação por
código. O cobre e o ouro saíram do lingote de ferro trocando cor por cor
(profunda→profunda, sombra→sombra, base→base, luz→luz, brilho→brilho). Um pixel fora
da paleta não está em tabela nenhuma — ele não seria trocado e apareceria como
sujeira no meio do lingote derivado.

## O que entrou no jogo

| Arquivo | De onde veio |
|---|---|
| `assets/items/wood.png` | tora do Vandré: diagonal, com galho cortado e anéis quadrados |
| `assets/items/iron_gear.png` | engrenagem do Vandré, com limpeza de paleta |
| `assets/items/iron_plate.png` | lingote do Vandré + 8 pixels de `#F2FAF8` na quina |
| `assets/items/copper_plate.png` | derivado do ferro por troca de cor |
| `assets/items/gold_plate.png` | derivado do ferro por troca de cor |

**O caso da engrenagem** (vale lembrar, porque vai se repetir): ela chegou com 26
cores. O Vandré tinha desenhado por cima de uma imagem de referência importada, e o
contorno preto que ele passou por cima não cobriu **31 pixels** da imagem de baixo —
quase-pretos (`#020403`, `#030301`…) e uns azulados (`#09273C`, `#00162A`), todos
escondidos dentro do contorno, invisíveis a olho nu. Cada um foi puxado para a cor
mais próxima da paleta; todos viraram preto de contorno e o desenho ficou idêntico.

> **Para ele conferir sozinho no Piskel:** painel de paletas → **"Current colors"**.
> Se aparecer mais de 6 cores, tem resto de referência escondido.

**Combinado depois disso:** antes de eu mexer em qualquer arquivo que ele desenhou,
eu guardo o original. Nessa vez eu sobrescrevi o `ENGRENAGEM.png` sem cópia — deu
para reconstruir, mas não devia ter acontecido.

## Organização que ficou

- `assets/_piskel/` — os `.piskel`, o **fonte** da arte, com um LEIA-ME dizendo qual
  arquivo vira qual PNG. O `.gitignore` passou a ignorar `.piskel` só na raiz, para
  que esses fiquem salvos no GitHub.
- `assets/_referencia/` — rascunhos meus, para ele importar no Piskel e desenhar por
  cima. Tem a madeira em três toras (que ele acabou melhorando por conta própria).
- `documentos/` — GDD, CORES e MATEMATICA saíram da raiz.
- `memoria/` — esta pasta.

## O que falta desenhar

Ícones de item que ainda estão com desenho provisório: `stone`, `coal`, `iron_ore`,
`copper_ore`, `gold_ore`, `uranium_ore`, `clay`, `sand`, `soil`, `crude_oil`,
`glass`, `stone_brick`, e os ícones das estruturas (`stone_furnace`, `burner_drill`,
`wooden_chest`, `transport_belt`, `inserter`).

Falta também o mundo (`tiles/`, `world/tree` em 32×48, `world/rock`), as estruturas
em `buildings/` e o personagem. A lista completa, com grade e nome de arquivo, está
em `assets/LEIA-ME.md`.

**Cores ainda não definidas** (`documentos/CORES.md` está com `#______`): urânio,
diamante, areia, vidro, argila, terra, petróleo e o terreno inteiro (grama, mato,
terra, areia, água). Enquanto não vierem, o jogo usa tons aproximados que eu chutei.
