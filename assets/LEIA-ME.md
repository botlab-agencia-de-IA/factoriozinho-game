# 🎨 Pasta de arte — como entregar os desenhos do Piskel

**Regra de ouro: 1 tile do mundo = 32×32 pixels.**
O jogo desenha com zoom 2× por padrão, então um sprite de 32px aparece com 64px na
tela — nítido, sem borrar.

> **Você não precisa mexer em código.** Salve o PNG com o nome exato da tabela, na
> pasta certa, e recarregue o jogo (F5). O desenho provisório é trocado pelo seu
> automaticamente. Se o arquivo não existir, o jogo continua com o desenho provisório.

---

## 📏 Entendendo a proporção (a dúvida da espada)

A grade **não é o tamanho do desenho** — é a **moldura**. O que decide se a coisa
parece grande ou pequena é **quanto da moldura você preenche**:

```
    32×32 = 1 TILE = "um passo do personagem"

┌─────── 32×32 ───────┐     ┌─────── 32×32 ───────┐
│ ░░░░░░░░░░░░░░░░░░░ │     │                     │
│ ░ ███████████████ ░ │     │      ██████████     │
│ ░ █             █ ░ │     │      █        █     │
│ ░ █   ~28×28    █ ░ │     │      █ ~22×22 █     │
│ ░ █             █ ░ │     │      █        █     │
│ ░ ███████████████ ░ │     │      ██████████     │
│ ░░░░░░░░░░░░░░░░░░░ │     │                     │
└─────────────────────┘     └─────────────────────┘
  OBJETO GRANDE               OBJETO DE MÃO
  forno, baú, pedregulho      picareta, espada, engrenagem
  preenche quase tudo         preenche ~2/3
```

- Deixe **2px de respiro** nas bordas dos objetos grandes (senão eles encostam uns
  nos outros e o desenho fica "colado").
- Objeto de mão na **diagonal** aproveita melhor a moldura quadrada.
- **Fundo transparente sempre.** No Piskel: `Export → PNG → Download`.
- Contorno escuro (1px) em volta ajuda muito a leitura em cima do chão.

---

## 📋 Tabela de tamanhos

| O que é | Grade no Piskel | Onde salvar |
|---|---|---|
| Chão / terreno | `32×32` (tileável) | `assets/tiles/` |
| Jazida de minério (por cima do chão) | `32×32` | `assets/tiles/` |
| Pedregulho | `32×32` | `assets/world/` |
| **Árvore** | `32×48` | `assets/world/` |
| Ícone de item | `32×32` | `assets/items/` |
| Máquina **1×1** | `32×32` | `assets/buildings/` |
| Máquina **2×2** | `64×64` | `assets/buildings/` |
| Máquina **3×3** | `96×96` | `assets/buildings/` |
| Personagem | folha `128×128` (4×4 quadros de 32×32) | `assets/player/` |
| Esteira animada | folha `256×32` (8 quadros de 32×32) | `assets/buildings/` |
| Ícone de interface | `16×16` ou `24×24` | `assets/ui/` |

### Sobre a árvore (32×48)
A árvore é o único caso "alto". Pense assim: os **32×32 de baixo** são o tronco e a
sombra, que ficam dentro do tile. Os **16px de cima** são a copa, que passa por cima
do tile de trás — é isso que dá profundidade.

```
┌──── 32 ────┐
│            │ ← 16px: copa (passa por cima do que está atrás)
│    copa    │
├────────────┤ ← daqui pra baixo é o tile de 32×32
│   tronco   │
│   sombra   │
└────────────┘
     48px de altura no total
```

### Sobre o personagem (folha 128×128)
4 linhas (uma por direção) × 4 colunas (quadros da animação de andar):

```
        quadro1  quadro2  quadro3  quadro4
linha 1 [ baixo ][ baixo ][ baixo ][ baixo ]   ← andando pra baixo (de frente)
linha 2 [ esq.  ][ esq.  ][ esq.  ][ esq.  ]   ← andando pra esquerda
linha 3 [ dir.  ][ dir.  ][ dir.  ][ dir.  ]   ← andando pra direita
linha 4 [ cima  ][ cima  ][ cima  ][ cima  ]   ← andando pra cima (de costas)
```
No Piskel: crie o sprite em 32×32 com 16 quadros e exporte como **spritesheet**
com 4 colunas. O quadro 1 de cada linha é a pose parada.

---

## 📁 Lista de arquivos que o jogo procura

Marque conforme for fazendo. **O nome tem que ser exatamente esse.**

### `assets/tiles/` — 32×32, tileável
| Arquivo | O que é |
|---|---|
| `grass.png` | Grama |
| `grass_dark.png` | Grama escura (mato alto) |
| `sand.png` | Areia |
| `dirt.png` | Terra |
| `stone_ground.png` | Chão de pedra |
| `water.png` | Água |
| `ore_coal.png` | Mancha de carvão no chão |
| `ore_iron.png` | Mancha de minério de ferro |
| `ore_copper.png` | Mancha de minério de cobre |
| `ore_stone.png` | Mancha de pedra |
| `ore_gold.png` | Mancha de ouro |
| `ore_uranium.png` | Mancha de urânio |
| `ore_clay.png` | Depósito de argila |
| `ore_sand.png` | Depósito de areia |
| `ore_soil.png` | Depósito de terra |
| `ore_oil.png` | Poço de petróleo |

### `assets/world/` — objetos do mundo
| Arquivo | Grade | O que é |
|---|---|---|
| `tree.png` | `32×48` | Árvore |
| `rock.png` | `32×32` | Pedregulho |

### `assets/items/` — 32×32, ícones
| Arquivo | O que é |
|---|---|
| `wood.png` | Madeira |
| `stone.png` | Pedra |
| `coal.png` | Carvão |
| `iron_ore.png` | Minério de ferro |
| `copper_ore.png` | Minério de cobre |
| `gold_ore.png` | Minério de ouro |
| `uranium_ore.png` | Minério de urânio |
| `clay.png` | Argila |
| `sand.png` | Areia |
| `soil.png` | Terra |
| `crude_oil.png` | Petróleo bruto |
| `iron_plate.png` | Placa de ferro |
| `copper_plate.png` | Placa de cobre |
| `gold_plate.png` | Placa de ouro |
| `glass.png` | Vidro |
| `stone_brick.png` | Tijolo de pedra |
| `iron_gear.png` | Engrenagem de ferro |
| `stone_furnace.png` | Ícone do forno de pedra |
| `burner_drill.png` | Ícone da mineradora a carvão |
| `wooden_chest.png` | Ícone do baú de madeira |
| `transport_belt.png` | Ícone da esteira |
| `inserter.png` | Ícone do inseridor |

### `assets/buildings/` — as estruturas no mundo
| Arquivo | Grade | O que é |
|---|---|---|
| `stone_furnace.png` | `64×64` | Forno de pedra (2×2) |
| `burner_drill.png` | `64×64` | Mineradora a carvão (2×2) |
| `wooden_chest.png` | `32×32` | Baú de madeira (1×1) |
| `transport_belt.png` | `32×32` | Esteira (1×1) — desenhe apontando **para cima**; o jogo gira sozinho |
| `inserter.png` | `32×32` | Inseridor (1×1) — só a **base**, sem o braço; o braço é desenhado por cima e se mexe |

### `assets/player/`
| Arquivo | Grade | O que é |
|---|---|---|
| `player.png` | `128×128` | Folha do personagem (4×4) |

---

## 🎨 Sugestão de paleta

Pixel art fica melhor com poucas cores. Uma paleta enxuta para o clima industrial:

| Cor | Hex | Onde usar |
|---|---|---|
| ⬛ Contorno | `#1a1a20` | contorno de tudo |
| 🟫 Madeira | `#8a5a34` / `#c07a4a` | troncos, baú |
| ⬜ Pedra | `#6b7280` / `#9aa3af` | pedregulho, tijolo |
| ⬛ Carvão | `#2b2f36` / `#454b55` | carvão |
| 🟧 Cobre | `#b3603f` / `#e08a5a` | cobre |
| ⬜ Ferro | `#7e8791` / `#b6bec8` | ferro |
| 🟩 Grama | `#4a7c3f` / `#5f9950` | chão |
| 🟨 Metal quente | `#ff9b2b` / `#ffc857` | fogo, brilho de máquina |

---

## ⚙️ Como o jogo carrega

O arquivo `src/js/game/sprites.js` guarda a lista acima. Ao abrir o jogo, ele tenta
carregar cada PNG; **o que não existir é desenhado por código** (as formas coloridas
provisórias que você vê agora). Não dá erro, não trava — só troca quando o arquivo
aparece.

Para conferir o que já foi carregado, abra o console do navegador (`F12`) e digite:

```js
FZ.Sprites.status()
```
