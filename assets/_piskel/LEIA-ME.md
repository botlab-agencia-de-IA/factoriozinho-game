# 🎨 Arquivos originais do Piskel

Aqui ficam os **fontes** da arte — os `.piskel` que o Vandré desenha.
O jogo **não** lê esta pasta; ele lê os PNGs em `assets/items/`, `assets/tiles/` etc.

Guardar o `.piskel` vale a pena porque ele mantém camadas e quadros. O PNG é
o resultado achatado: dá para editar, mas não dá para "desachatar".

| Arquivo do Piskel | Vira, no jogo |
|---|---|
| `TORA DE MADEIRA.piskel` | `assets/items/wood.png` |
| `ENGRENAGEM.piskel` | `assets/items/iron_gear.png` |
| `PEDREGULHO.piskel` | `assets/world/rock.png` |
| `INGOT FERRO com brilho.piskel` | `assets/items/iron_plate.png` |
| `INGOT FERRO.piskel` | (versão antiga, sem o tom de brilho — guardada só como histórico) |

As placas de **cobre** e **ouro** não têm `.piskel`: são o mesmo desenho do ferro
com a paleta trocada, geradas por código.

## Como salvar daqui

No Piskel: ícone do disquete → `Download .piskel file` (o fonte, vem pra cá) e
`Export → PNG → Download` com `Scale 1.0x` e `Resolution 32 x 32` (o que entra no jogo).
