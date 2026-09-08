# 🔢 A matemática do Factoriozinho

> **Documento vivo, para o Vandré decidir.** Aqui estão os números que o jogo tem
> hoje — medidos rodando a simulação, não calculados no papel — o que está torto
> neles, e uma proposta de como deixar tudo redondo.
>
> **Nada disto foi aplicado ainda.** É a folha em cima da mesa para você escolher.
> Medido em 02/09/2026, v0.8.6, pelo script de medição da bateria de testes.

---

## 1. O que cada máquina faz hoje

| Máquina | Produz | Come | Queima |
|---|---|---|---|
| **Mineradora a carvão** | 26 minérios/min (0,43/s) | a jazida embaixo dela | 8 carvões/min |
| **Fornalha de pedra** | 18 placas/min (1 a cada 3,3 s) | 18 minérios/min | 8 carvões/min |
| **Inseridor a carvão** | move 30 itens/min (0,5/s) | — | 2 carvões/min (1 carvão dura 30 s) |
| **Esteira** | leva 858 itens/min (14,3/s) | — | nada |

**Quanto rende um carvão:** 3,3 minérios na mineradora · 2,3 placas na fornalha.

**A linha inteira** que você monta no jogo — mineradora → esteira → inseridor →
fornalha → inseridor → baú — entrega **17,5 placas por minuto**.

---

## 2. As proporções que isso dá

- 1 mineradora dá para **1,44 fornalhas**
- 1 inseridor aguarda **1,2 mineradoras** (ele é mais lento do que parece — veja §3)
- 1 esteira cheia aguenta **33 mineradoras**
- Para manter **1 fornalha** rodando sem parar você precisa de **0,69 mineradora de
  ferro** + **0,52 mineradora de carvão** (para alimentar ela mesma e a de ferro)

---

## 3. O que está torto

**a) O inseridor é metade do que diz ser.** Na configuração está escrito
`velocidade: 1.0` — um item por segundo. Mas ele gasta um ciclo para **pegar** e
outro para **entregar**, então na prática move **0,5 item por segundo**. O número
escrito engana quem for mexer nele depois (inclusive eu).

**b) Nada é redondo.** 3,3 segundos por placa, 26 minérios por minuto, 0,43 por
segundo. Não dá para fazer conta de cabeça enquanto joga, e é isso que torna a
fábrica gostosa de planejar: "duas mineradoras alimentam três fornalhas".

**c) O carvão some rápido demais.** A fornalha queima 8 carvões por minuto para
fazer 18 placas — um carvão rende só 2,3 placas. Some com o fato de a mineradora
também queimar 8 por minuto, e boa parte da sua fábrica vira transporte de carvão.

**d) A esteira é grátis.** Aguenta 33 mineradoras. Nunca vai ser um gargalo, então
nunca vira uma decisão sua. (No Factorio a proporção é parecida, então isto talvez
esteja certo — é o único item desta lista que eu não mexeria sem você mandar.)

---

## 4. A proposta

A ideia é uma regra só, que dá para explicar em uma frase:

> **Um carvão faz quatro coisas.** Quatro minérios tirados, quatro placas fundidas.

E disso sai o resto:

| Máquina | Hoje | Proposta | Por quê |
|---|---|---|---|
| Mineradora | 0,43 item/s | **0,5 item/s** (30/min) | número redondo |
| Fornalha | 1 placa a cada 3,3 s | **1 placa a cada 2 s** (30/min) | **1 mineradora alimenta exatamente 1 fornalha** |
| Inseridor | 0,5 item/s | **1 item/s** (60/min) | 1 inseridor dá conta de 2 mineradoras, e o número escrito passa a ser o número real |
| Carvão na mineradora | 3,3 minérios | **4 minérios** | a regra do "um carvão faz quatro" |
| Carvão na fornalha | 2,3 placas | **4 placas** | idem |
| Carvão no inseridor | dura 30 s | **dura 60 s** | inseridor não deve ser o que te faz correr atrás de carvão |
| Esteira | 14,3 itens/s | **não mexer** | está na mesma proporção do Factorio |

**O que a fábrica vira com isso:**

- 1 mineradora de ferro → 1 fornalha → 30 placas por minuto
- 1 mineradora de carvão sustenta **4 máquinas** (30 carvões/min ÷ 7,5 de consumo)
- 1 inseridor no meio de qualquer par dá conta sem virar gargalo
- para 30 placas de ferro por minuto: **1 mineradora de ferro + 1 fornalha +
  0,5 mineradora de carvão** — dá para contar nos dedos

---

## 5. O que eu preciso que você decida

1. **Fecha a proposta do §4?** Se sim, aplico e a fábrica que você já montou passa
   a produzir ~70% mais placas com o mesmo desenho.

2. **Qual é o ritmo do jogo?** Isso muda tudo:
   - **Corrido** — 30 placas/min por fornalha (a proposta). Você vê a fábrica
     crescer rápido, chega logo na montadora.
   - **Médio** — 20 placas/min. Cada fornalha pesa mais, expandir importa mais.
   - **Devagar** — 12 placas/min, tipo Factorio de verdade. A automação vira
     necessidade cedo, mas o começo à mão é mais duro.

3. **O carvão deve ser um problema?** Na proposta, uma mineradora de carvão
   sustenta 4 máquinas. Se você quiser que o carvão aperte mais (e a eletricidade
   da Fase 4 seja um alívio de verdade), baixo para 2 máquinas.

4. **Quanto tempo até a primeira fornalha automática?** Hoje, na mão, você leva
   uns 4 minutos. Isso está bom ou quer mais curto?

---

## 6. Como estes números foram medidos

Não são conta de papel: um script monta cada máquina num mundo de teste, roda a
simulação por um minuto de jogo e conta o que entrou e o que saiu. Está no
`testes/` e volta a rodar sempre que a matemática mudar — se alguém mexer numa
velocidade sem querer, a bateria avisa.
