# 🎨 Cores do Factoriozinho

> **Como funciona:** as cores daqui já estão no jogo (`src/js/game/paleta.js`).
> Para mudar alguma, é só trocar o código aqui e me avisar que eu passo pro jogo.
> Para preencher uma que falta, escreva no lugar do `#______`.

---

## Os 5 tons de cada material

Você usa 5 tons, e o jogo usa todos:

```
   BRILHO           ← o pontinho de luz, o reflexo metálico
   LUZ              ← parte de cima, onde bate a luz
   COR PILOTO       ← o corpo do objeto (a cor que "é" o material)
   SOMBRA           ← parte de baixo
   SOMBRA PROFUNDA  ← a quina, o canto mais fundo
```

**Regra da família** (já valendo no jogo): o **minério** é o material sujo — usa
os tons escuros da paleta (a sombra vira a cor principal dele). A **barra/placa**
é o material limpo — usa os tons claros. A **ferramenta** daquele material tem a
mesma tonalidade da barra. Você só precisa dar UMA paleta por material; eu derivo
o minério e a placa a partir dela.

---
---

# ✅ Prontas e já no jogo

## 🟫 MADEIRA

| Tom | Código |
|---|---|
| Brilho pontual | `#F0C27A` |
| Luz | `#D69A58` |
| **Cor piloto** | `#A86532` |
| Sombra | `#784321` |
| Sombra profunda | `#51301E` |

**Onde aparece:** madeira, tronco das árvores, baú de madeira, cabo das picaretas.

## ⬜ PEDRA

| Tom | Código |
|---|---|
| Brilho pontual | `#D2DADF` |
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

## ⬛ CONTORNO

| | Código |
|---|---|
| Contorno de tudo | `#000000` |

---
---

# ⏳ Faltam — o jogo está usando uma cor provisória

Vai preenchendo conforme for fazendo. Enquanto estiver `#______`, o jogo usa um
tom aproximado que eu escolhi.

## 🟢 URÂNIO

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

## 💎 DIAMANTE

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

## 🟨 AREIA

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

## 🔷 VIDRO

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

## 🟤 ARGILA

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

## 🟫 TERRA (o recurso)

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

## ⚫ PETRÓLEO

| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

---

## 🌱 O CHÃO (terreno)

Esse é o que mais aparece na tela — vale a pena caprichar.

### Grama
| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

### Mato (grama escura)
| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

### Terra (chão)
| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

### Areia (chão)
| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

### Água
| Tom | Código |
|---|---|
| Brilho | `#______` |
| Luz | `#______` |
| **Cor piloto** | `#______` |
| Sombra | `#______` |
| Sombra profunda | `#______` |

> O **chão de pedra** já usa a paleta da pedra, e o **fim do mundo** é preto —
> não precisa preencher esses dois.

---

## 💬 Recado livre

Se quiser me falar alguma coisa sobre as cores ("o verde tá muito forte", "usa
esse tom só nas máquinas", etc.), escreve aqui embaixo:

