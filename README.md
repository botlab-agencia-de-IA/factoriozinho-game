# 🏭 Factoriozinho

Jogo 2D de visão de cima onde você **coleta recursos → fabrica itens → automatiza a
produção**, até a fábrica trabalhar sozinha. Projeto de hobby.

**🎯 Objetivo do jogo: sair do planeta.**

Mistura três jogos, com pesos bem diferentes: **Factorio** é a base de verdade
(esteiras, inseridores, cadeias de produção), do **Forager** fica o ritmo gostoso da
coleta e a variedade de recursos, e do **Autonauts** virão os robôs ensináveis, numa
fase futura.

---

## ▶️ Como jogar

**Dê duplo clique no `index.html`.** Só isso — não precisa instalar nada.

Se em algum navegador as imagens não carregarem, rode o `jogar.bat` (ele sobe um
servidor local com o Node e abre o jogo em `http://localhost:8080`).

### Controles

| Ação | Tecla |
|---|---|
| Andar | `W A S D` |
| Coletar / construir | segurar **botão esquerdo** |
| Remover construção | **botão direito** |
| Girar (esteira, inseridor, mineradora) | `R` com o mouse em cima |
| Pegar na mão o que está sob o cursor | `Q` |
| Transferir a pilha inteira | `Shift` + clique |
| Mochila e fabricação | `E` |
| Mapa | `M` (ou clicar no minimapa) |
| Barra rápida | `1`–`8` ou clicar no slot |
| Pegar metade da pilha | botão **direito** nela, dentro da mochila |
| Abastecer uma máquina | com a pilha na mão, **clicar na máquina** (direito enfia 1) |
| Dividir entre slots | **arrastar** a pilha por eles |
| Juntar tudo de um item | **dois cliques** no slot |
| Mandar tudo para o baú | **Shift + dois cliques** no slot |
| Zoom | roda do mouse (ou `+` e `-`) |
| Pausa / menu | `Esc` |

---

## 📁 O que é cada coisa

| Arquivo / pasta | Para que serve |
|---|---|
| **`GDD.md`** | **O documento de design — a fonte da verdade do projeto.** Tudo que foi decidido, cortado e o que falta fazer está aqui. |
| **`CORES.md`** | A paleta de cores do jogo, preenchida à mão. As cores daqui vão para o `paleta.js`. |
| **`assets/LEIA-ME.md`** | Como desenhar a arte: tamanho de cada grade, nome de cada arquivo. |
| `index.html` | O jogo. Abre com duplo clique. |
| `assets/` | As artes em PNG. O que não existir aqui é desenhado por código. |
| `src/js/game/` | O motor: mundo, entidades, render, dados. |
| `src/js/ui/` | Menu, HUD, inventário, mapa. |
| `src/js/core/` | Configurações e sistema de save. |
| `servidor.js` · `jogar.bat` | Servidor local opcional. |
| `testes/` · `testar.bat` | Bateria de testes que roda a lógica do jogo sem abrir o navegador. |

---

## 🧪 Testes

Duplo clique no **`testar.bat`** (ou `node testes/rodar-tudo.js`). Ele roda 14
conjuntos de testes que verificam o mundo, os recursos finitos, o inventário, o
forno, a mineradora, as esteiras de duas faixas, os inseridores, as curvas, o
desenho das regiões de minério e o inspetor do mapa — tudo sem precisar abrir o jogo.

---

## 🔧 Stack

HTML5 + Canvas 2D + JavaScript puro. **Sem dependências, sem build, sem instalação.**
O mundo é gerado por semente e o save guarda só o que mudou, então fica leve.

---

## ✅ Estado atual

Funcionando: mundo finito de 320×320 tiles gerado por semente, personagem, coleta
manual, recursos finitos que somem do mapa, inventário e fabricação, construção,
**forno**, **mineradora**, **baú**, **esteiras de duas faixas com curva automática**,
**inseridores**, minimapa e mapa completo, e save em 5 slots. As regiões de minério
nascem separadas, em fronteiras tortas e sem o quadriculado dos chunks. Apontar o
cursor para qualquer coisa — no jogo ou no mapa — mostra num painel no canto direito
o que tem ali: o conteúdo da jazida, o que o forno está fundindo e em que ponto está,
o quanto a mineradora ainda tem para tirar.

O roadmap completo, com o que já foi feito e o que vem a seguir, está no
[`GDD.md`](GDD.md).
