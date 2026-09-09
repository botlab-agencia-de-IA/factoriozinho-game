# 🔢 A matemática do Factoriozinho

> **Documento vivo.** Os números que o jogo tem — medidos rodando a simulação, não
> calculados no papel. Mexer aqui é mexer em `data.js`, e o teste
> `16-matematica.js` cobra que a tabela abaixo continue verdadeira.
>
> Última medição: 02/09/2026, **v0.8.7** — a equação do Vandré aplicada.

---

## 1. A regra

**Tudo é pensado por minuto.** E a base é uma só:

> **1 mineradora a carvão alimenta 1,5 fornalhas.**
> **1 mineradora elétrica** (Fase 4, ainda não existe) **alimenta 2,5 fornalhas.**

Disso sai todo o resto. Como a fornalha faz **20 peças por minuto** (uma a cada 3
segundos), a mineradora a carvão tem que tirar **30 por minuto** — e a elétrica,
quando chegar, **50 por minuto**.

---

## 2. O que cada máquina faz

| Máquina | Produz | Queima | 1 carvão rende |
|---|---|---|---|
| **Mineradora a carvão** | **30** minérios/min (0,5/s) | 2 carvões/min | 15 minérios |
| **Fornalha de pedra** | **20** peças/min (1 a cada 3 s) | 2 carvões/min | 10 peças |
| **Inseridor a carvão** | move **60** itens/min (1/s) | 0,6 carvão/min | ~2 minutos de trabalho |
| **Esteira** | leva 858 itens/min (14,3/s) | nada | — |
| *Mineradora elétrica* | *50 minérios/min* | *eletricidade* | *— (Fase 4)* |

O ouro é o único que foge: demora **4,5 s** em vez de 3 s, então a fornalha faz
13 placas de ouro por minuto.

---

## 3. O combustível

**Um carvão vale 30 segundos de máquina.** Sempre, em qualquer máquina — é o que
faz a conta ser simples.

| Combustível | Vale | Comparação |
|---|---|---|
| **Carvão** | 30 s | a medida do jogo |
| **Madeira** | 10 s | **três madeiras = um carvão** |
| Petróleo bruto | 60 s | dois carvões (quando a bomba existir) |

A madeira serve para começar e para apagar incêndio, mas some rápido: uma fornalha
come **6 madeiras por minuto** contra **2 carvões**.

O inseridor é a exceção sensata: ele é pequeno e gasta pouco, então **um carvão
dura uns dois minutos** nele. Inseridor não é para te fazer correr atrás de carvão.

---

## 4. A conta que você faz enquanto joga

**Quanto carvão por minuto a sua fábrica come:**

```
carvão/min  =  2 × (mineradoras + fornalhas)  +  0,6 × inseridores
```

**Quantas mineradoras de carvão para sustentar isso:**

```
mineradoras de carvão  =  carvão/min ÷ 28
```

(28 e não 30 porque cada mineradora de carvão queima 2 do que ela mesma tira.)

### Exemplo: a linha completa

Uma mineradora de ferro → esteira → inseridor → fornalha → inseridor → baú:

- come `2 + 2 + 0,6×2` = **5,2 carvões por minuto**
- entrega **19 placas por minuto** (a fornalha é o gargalo, como tem de ser)
- **uma mineradora de carvão sustenta 5 linhas dessas** (28 ÷ 5,2)

### A tabela de bolso

| Você quer | Precisa de |
|---|---|
| 20 placas/min | 1 fornalha + 0,7 mineradora de ferro |
| 60 placas/min | 3 fornalhas + 2 mineradoras de ferro |
| 100 placas/min | 5 fornalhas + 3,5 mineradoras de ferro |
| cada 5 máquinas a combustível | ~0,4 mineradora de carvão |

---

## 5. Por que estes números e não outros

- **A fornalha em 3 s** é o eixo: é dela que sai o "1,5" que você pediu.
- **A mineradora em 0,5/s** deixa a proporção exata e é um número que dá para
  fazer de cabeça: um item a cada dois segundos.
- **O inseridor em 1 item/s** dá conta de **duas mineradoras**, então ele nunca é
  o gargalo escondido. Antes ele fazia meio item por segundo — a configuração dizia
  1,0, mas cada item gasta dois ciclos (um para pegar, outro para entregar), e isso
  enganava até quem escreveu. Agora o número escrito é o número real.
- **A esteira aguenta 30 mineradoras.** Nunca vai ser gargalo, e é assim no
  Factorio também. Se um dia você quiser que a esteira seja uma decisão, é aqui
  que se mexe.

---

## 6. A eletricidade — decidido e a decidir

Decidido por ele em **08/09/2026**, junto com o pedido da era da eletricidade:

- **As duas linhas convivem.** O forno de pedra, a mineradora a carvão e o inseridor
  a combustível **continuam existindo**. A eletricidade traz as versões elétricas ao
  lado deles — forno elétrico, inseridor elétrico, montadora — como no Factorio.
- **Gerador a combustão**: uma estrutura só, que aceita **carvão e madeira**, usando
  a tabela de queima da §3 (1 carvão = 30 s, 1 madeira = 10 s).
- **Base para começar: o gerador a combustão produz 100.** É um número redondo só
  para ter de onde partir; o consumo de cada máquina sai depois, a partir dele.

### A rede, em números (decidido)

| Coisa | Número |
|---|---|
| **Zona de atuação do poste** | **5×5**, com o poste no quadrado do meio |
| **Alcance de fio entre dois postes** | **7 quadrados**, de centro a centro |
| De onde saem os 7 | 5 da zona de um + **2 de vão** + 5 da zona do outro = **12 quadrados** de ponta a ponta. Do centro de um ao centro do outro dá 7 |
| Mais perto que isso | vale — dois postes podem até ficar colados |
| Ligação | todo poste dentro do alcance se liga, e a rede segue de poste em poste |
| **Fio de cobre** | 1 chapa de cobre → **2 fios** (a mesma proporção da engrenagem) |
| **Poste elétrico** | **2 madeiras + 1 fio de cobre** |
| Máquina ligada | quando estiver **dentro da zona 5×5** de algum poste da rede |
| Energia da água | fica para quando houver fluidos |

```
        zona do poste A          vão         zona do poste B
     ┌───────────────────┐    ┌───────┐   ┌───────────────────┐
     │  ·   ·   ·   ·   ·│    │   ·   │   │·   ·   ·   ·   ·  │
     │  ·   ·   A   ·   ·│    │   ·   │   │·   ·   B   ·   ·  │
     │  ·   ·   ·   ·   ·│    │   ·   │   │·   ·   ·   ·   ·  │
     └───────────────────┘    └───────┘   └───────────────────┘
        5 quadrados             2              5 quadrados
     └──────────────────── 12 de ponta a ponta ──────────────────┘
                    de A até B: 7 quadrados
```

### O que falta decidir

1. **A unidade de energia.** Watt, megawatt, ou um nome próprio do jogo? Muda só o
   texto na tela, mas é melhor escolher antes de escrever em dez lugares.
2. **Quanto cada máquina consome.** A partir dos 100 do gerador: quantas fornalhas
   elétricas um gerador sustenta? E quantos inseridores? É a mesma pergunta que a
   §1 respondeu para o carvão ("1 mineradora = 1,5 fornalhas"), agora para a energia.
3. **A mineradora elétrica** já está definida em 50/min = 2,5 fornalhas (§2), mas
   falta o consumo dela.
4. **A montadora** (Fase 3) ainda não tem tempo definido. A pergunta é quantas
   engrenagens por minuto ela faz — e daí sai quantas fornalhas ela consome.
5. **Madeira como combustível de emergência**: hoje três madeiras valem um carvão.
   Se quiser que a madeira seja só para o comecinho, é só baixar para 5 s.

---

## 7. Como estes números são conferidos

O teste `16-matematica.js` monta cada máquina num mundo de teste, roda um minuto de
jogo e conta o que entrou e o que saiu — e reclama se algum número sair da faixa
combinada. Rodar é duplo clique no `testar.bat`.
