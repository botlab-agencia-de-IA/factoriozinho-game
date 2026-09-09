# 🎨 Cores do Factoriozinho

> **Como funciona:** as cores daqui já estão no jogo (`src/js/game/paleta.js`).
> Para mudar alguma, é só trocar o código aqui e me avisar que eu passo pro jogo.
> Para preencher uma que falta, escreva no lugar do `#______`.

---

## Os 5 tons de cada material

Você usa 5 tons, e o jogo usa todos:

```
   BRILHO           ← reflexo pontual, em poucos pixels
   LUZ              ← planos de cima, o lado voltado pra luz
   COR PILOTO       ← o corpo do objeto (a cor que "é" o material)
   SOMBRA           ← volume, parte de baixo, regiões internas
   SOMBRA PROFUNDA  ← frestas, quinas, separação de camadas
```

**O contorno de tudo no jogo é `#000000`.**

---

## Regra de uso (vale pra todos os materiais)

| O quê | Usa principalmente |
|---|---|
| **Minério bruto** | Sombra e sombra profunda, com poucos pixels de cor piloto |
| **Barra, placa, item refinado** | Cor piloto e luz, com reflexos curtos de brilho |
| **Ferramenta e máquina** | A mesma família da barra/placa correspondente |
| **Terreno** | Cor piloto como massa, luzes e sombras em texturas pequenas |
| **Líquido** | Cor piloto na massa, sombra profunda no interior, brilhos horizontais curtos |

Por isso você só precisa me dar **uma paleta por material** — eu derivo o minério
(versão escura) e a placa (versão clara) a partir dela.

---
---

# ✅ Prontas e já no jogo

## 🟫 MADEIRA

| Tom | Código |
|---|---|
| Brilho | `#F0C27A` |
| Luz | `#D69A58` |
| **Cor piloto** | `#A86532` |
| Sombra | `#784321` |
| Sombra profunda | `#51301E` |

**Onde aparece:** madeira, tronco das árvores, baú de madeira, cabo das picaretas.

## ⬜ PEDRA

| Tom | Código |
|---|---|
| Brilho | `#D2DADF` |
| Luz | `#A7B2B8` |
| **Cor piloto** | `#78838C` |
| Sombra | `#515D66` |
| Sombra profunda | `#35404A` |

**Onde aparece:** pedra, pedregulho, jazida de pedra, tijolo, forno, esteira, chão de pedra.

## ⬛ CARVÃO

| Tom | Código |
|---|---|
| Reflexo discreto | `#788388` |
| Luz | `#505B60` |
| **Cor piloto** | `#30383D` |
| Sombra | `#22292E` |
| Sombra profunda | `#151A1E` |

## ⚙️ FERRO

| Tom | Código |
|---|---|
| Brilho metálico | `#F2FAF8` |
| Luz | `#D4E3E7` |
| **Cor piloto** | `#A9BEC7` |
| Sombra | `#788F99` |
| Sombra profunda | `#526873` |

**Como o jogo divide:** minério de ferro fica com `#788F99` de cor principal
(o tom "sombra"); placa, engrenagem, picareta de ferro e mineradora ficam com
`#A9BEC7` (a cor piloto).

## 🟧 COBRE

| Tom | Código |
|---|---|
| Brilho metálico | `#FFC184` |
| Luz | `#E69A60` |
| **Cor piloto** | `#C66A3D` |
| Sombra | `#913E2C` |
| Sombra profunda | `#612D24` |

**Como o jogo divide:** minério com `#913E2C`, placa com `#C66A3D`.

## 🟡 OURO

| Tom | Código |
|---|---|
| Brilho metálico | `#FFF8CF` |
| Luz | `#FFE38A` |
| **Cor piloto** | `#F2CB55` |
| Sombra | `#C99A2D` |
| Sombra profunda | `#8A651E` |

**Como o jogo divide:** minério com `#C99A2D`, placa e picareta de ouro com `#F2CB55`.
O inseridor também usa essa família.

## 🟢 URÂNIO

| Tom | Código |
|---|---|
| Brilho | `#E8FFC9` |
| Luz | `#B5ED75` |
| **Cor piloto** | `#73C94B` |
| Sombra | `#3F8B35` |
| Sombra profunda | `#215427` |

**Direção visual:** verde radioativo controlado, vivo e reconhecível sem ficar
excessivamente fluorescente.
**Aplicação:** o minério é predominantemente `#3F8B35`, com detalhes em `#73C94B`.
Barras, células e componentes refinados usam mais `#73C94B`, `#B5ED75` e reflexos
curtos de `#E8FFC9`.

## 💎 DIAMANTE

| Tom | Código |
|---|---|
| Brilho | `#F1FFFF` |
| Luz | `#AEEFFF` |
| **Cor piloto** | `#56C5E6` |
| Sombra | `#2786B4` |
| Sombra profunda | `#19506F` |

**Direção visual:** cristal azul-ciano frio, com contraste alto para destacar a raridade.
**Aplicação:** brilho em quinas e cortes diagonais. A sombra profunda aparece em
rachaduras, facetas internas e regiões enterradas da jazida.

> ⚠️ O diamante **ainda não existe no jogo** — não há item, jazida nem receita.
> A cor já fica guardada aqui para quando ele entrar.

## 🟨 AREIA (o recurso)

| Tom | Código |
|---|---|
| Brilho | `#FFF0BD` |
| Luz | `#ECD18B` |
| **Cor piloto** | `#C9A45D` |
| Sombra | `#95723D` |
| Sombra profunda | `#624827` |

**Direção visual:** areia quente e concentrada, diferente da areia do terreno.
**Aplicação:** montes de areia, ícones de inventário e esteiras usam a **sombra**
como base, com pequenos grupos de luz para formar grãos e volume.

## 🔷 VIDRO

| Tom | Código |
|---|---|
| Brilho | `#F4FFFF` |
| Luz | `#B6E8ED` |
| **Cor piloto** | `#6FBCC6` |
| Sombra | `#41818F` |
| Sombra profunda | `#28525E` |

**Direção visual:** vidro azul-esverdeado, frio e translúcido, mesmo em pixel art
com cores sólidas.
**Aplicação:** bordas e reflexos em `#F4FFFF`; a superfície principal em `#6FBCC6`.
A transparência pode ser sugerida com áreas vazias, padrões leves ou pixels do
fundo visíveis dentro do objeto.

## 🟤 ARGILA

| Tom | Código |
|---|---|
| Brilho | `#F6C49C` |
| Luz | `#D9956A` |
| **Cor piloto** | `#B96949` |
| Sombra | `#823F32` |
| Sombra profunda | `#552B28` |

**Direção visual:** terracota quente, distinta da madeira e da terra comum.
**Aplicação:** blocos de argila usam a **cor piloto** com luz nas partes superiores.
Tijolos, cerâmicas e materiais queimados podem ter mais `#823F32` e `#552B28`.

## 🟫 TERRA (o recurso)

| Tom | Código |
|---|---|
| Brilho | `#F1C487` |
| Luz | `#C58A51` |
| **Cor piloto** | `#965A34` |
| Sombra | `#643A29` |
| Sombra profunda | `#43281F` |

**Direção visual:** terra fértil e orgânica, mais densa e escura que o tile de chão.
**Aplicação:** o recurso usa `#643A29` como tom dominante, com poucos pixels em
`#C58A51` para indicar pedrinhas, partículas claras ou solo seco.

## ⚫ PETRÓLEO

| Tom | Código |
|---|---|
| Brilho | `#71879B` |
| Luz | `#485D72` |
| **Cor piloto** | `#2C3E54` |
| Sombra | `#19283D` |
| Sombra profunda | `#0D1526` |

**Direção visual:** azul-noturno quase preto, separado do carvão e do contorno global.
**Aplicação:** a superfície tem pequenos reflexos em `#71879B` e `#485D72`. A massa
principal usa `#2C3E54`; poços, profundidade e bordas internas usam `#19283D` e `#0D1526`.

---
---

# 🌱 O CHÃO (terreno)

Esse é o que mais aparece na tela.

## Grama

| Tom | Código |
|---|---|
| Brilho | `#BDEB83` |
| Luz | `#8FCE61` |
| **Cor piloto** | `#5EAA4B` |
| Sombra | `#397A3B` |
| Sombra profunda | `#244D31` |

**Direção visual:** verde natural e vivo para o terreno principal.
**Aplicação:** `#5EAA4B` preenche a maior parte do tile. Luzes em tufos pequenos;
a sombra profunda aparece entre moitas, pedras, árvores e bordas de relevo.

## Mato (grama escura)

| Tom | Código |
|---|---|
| Brilho | `#8EBE62` |
| Luz | `#618F45` |
| **Cor piloto** | `#426D38` |
| Sombra | `#2D4D31` |
| Sombra profunda | `#1F3527` |

**Direção visual:** vegetação densa, mais fechada e menos saturada que a grama normal.
**Aplicação:** bordas de floresta, biomas escuros e áreas menos exploradas. A diferença
de luminosidade em relação à grama deve ser clara para leitura imediata no mapa.

## Terra (chão)

| Tom | Código |
|---|---|
| Brilho | `#E2B978` |
| Luz | `#BD894F` |
| **Cor piloto** | `#8F5D38` |
| Sombra | `#603A29` |
| Sombra profunda | `#42271F` |

**Direção visual:** solo exposto, seco e industrial, com contraste mais discreto que
recursos e máquinas.
**Aplicação:** caminhos, áreas desmatadas, entorno de minas e terrenos industriais.
Pequenos pixels de luz criam irregularidade, sem transformar o tile em um elemento
visualmente chamativo.

## Areia (chão)

| Tom | Código |
|---|---|
| Brilho | `#FFF2C5` |
| Luz | `#EED99B` |
| **Cor piloto** | `#D7B96E` |
| Sombra | `#AD884C` |
| Sombra profunda | `#735B34` |

**Direção visual:** areia clara para praias, desertos e margens de água.
**Aplicação:** a cor piloto ocupa a maior parte do terreno. Brilhos devem ser raros,
usados só em grãos expostos e pequenas elevações, evitando excesso de luminosidade no mapa.

## Água

| Tom | Código |
|---|---|
| Brilho | `#D5F7FF` |
| Luz | `#87D5E6` |
| **Cor piloto** | `#3E9BBD` |
| Sombra | `#23668B` |
| Sombra profunda | `#173C61` |

**Direção visual:** azul limpo e legível, com profundidade suficiente para margens,
rios, lagos e regiões profundas.
**Aplicação:** `#3E9BBD` é a massa principal. Ondas e reflexos horizontais curtos usam
`#87D5E6` e, em menor quantidade, `#D5F7FF`. Áreas profundas concentram `#23668B` e `#173C61`.

## ⬛ CONTORNO

| | Código |
|---|---|
| Contorno de tudo | `#000000` |

> O **chão de pedra** usa a paleta da pedra e o **fim do mundo** é preto —
> esses dois não precisam de paleta própria.

---
---

# ⏳ Ainda falta

## 🌳 ÁRVORE (a folhagem)

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

Hoje a árvore usa um verde provisório meu, mais escuro que o mato. O tronco já usa
a paleta da madeira. Vale ser um verde **diferente da grama e do mato**, senão a
árvore some no chão.

---

## 💬 Recado livre

Se quiser me falar alguma coisa sobre as cores ("o verde tá muito forte", "usa
esse tom só nas máquinas", etc.), escreve aqui embaixo:

