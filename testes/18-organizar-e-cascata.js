/* Duas coisas novas do inventário:
   1. organizar a mochila por nome ou por quantidade, sem mexer na barra rápida;
   2. fabricar em cascata — clicou na mineradora, o jogo faz as engrenagens e o
      forno sozinho, e os pedaços NÃO passam pela mochila. */
const fs=require('fs'), path=require('path');
const RAIZ = require('path').join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js','src/js/game/player.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ,D=FZ.Data,World=FZ.World,Inv=FZ.Inv,P=FZ.Player;
let f=0; const ok=(c,m)=>{console.log((c?'  OK  ':'  XX  ')+m); if(!c)f++;};
const HOT=D.CONFIG.HOTBAR_SIZE;
const receita=id=>D.HAND_RECIPES.find(r=>r.saida===id);
const mostrar=inv=>inv.map(s=>s?s.item+'×'+s.count:'-');

console.log('=== ORGANIZAR: junta o que esta espalhado ===');
World.init('ORG',null);
let p=P.criar(0,0);
// bagunca de proposito, com o mesmo item em varios slots
Inv.addFaixa(p.inv,'stone',20,HOT,p.inv.length);
p.inv[20]={item:'wood',count:7};
p.inv[25]={item:'stone',count:13};
p.inv[30]={item:'coal',count:40};
p.inv[35]={item:'wood',count:3};
const antesTotal=['stone','wood','coal'].map(i=>Inv.conta(p.inv,i));
Inv.organizar(p.inv,'nome',HOT,p.inv.length);
console.log('  '+mostrar(p.inv).slice(HOT,HOT+6).join(' '));
ok(Inv.conta(p.inv,'stone')===antesTotal[0]&&Inv.conta(p.inv,'wood')===antesTotal[1]
   &&Inv.conta(p.inv,'coal')===antesTotal[2],'nada sumiu nem apareceu do nada');
ok(Inv.slotsUsados(p.inv)===3,'as pilhas espalhadas viraram 3 slots: '+Inv.slotsUsados(p.inv));
const nomes=p.inv.slice(HOT).filter(Boolean).map(s=>D.itemNome(s.item));
ok(nomes.join('|')===[...nomes].sort((a,b)=>a.localeCompare(b,'pt-BR')).join('|'),
   'ficou em ordem de nome: '+nomes.join(', '));

console.log('\n=== ORGANIZAR: a barra rapida nao se mexe ===');
World.init('ORG2',null);
p=P.criar(0,0);
p.inv[0]={item:'wood_pickaxe',count:1};
p.inv[2]={item:'transport_belt',count:9};
p.inv[15]={item:'coal',count:5};
p.inv[19]={item:'coal',count:5};
const barraAntes=JSON.stringify(p.inv.slice(0,HOT));
Inv.organizar(p.inv,'nome',HOT,p.inv.length);
ok(JSON.stringify(p.inv.slice(0,HOT))===barraAntes,'a picareta no 1 e a esteira no 3 continuam onde estavam');
ok(Inv.conta(p.inv,'coal')===10 && p.inv[HOT].item==='coal','o carvao solto virou uma pilha so, fora da barra');

console.log('\n=== ORGANIZAR por quantidade: do que ele tem mais para o que tem menos ===');
World.init('ORG3',null);
p=P.criar(0,0);
Inv.addFaixa(p.inv,'wood',3,HOT,p.inv.length);
Inv.addFaixa(p.inv,'coal',150,HOT,p.inv.length);
Inv.addFaixa(p.inv,'stone',40,HOT,p.inv.length);
Inv.organizar(p.inv,'quantidade',HOT,p.inv.length);
const seq=p.inv.slice(HOT).filter(Boolean).map(s=>s.item);
console.log('  '+mostrar(p.inv).slice(HOT,HOT+5).join(' '));
ok(seq[0]==='coal','o carvao (150) vem primeiro');
ok(seq[seq.length-1]==='wood','a madeira (3) vem por ultimo');

console.log('\n=== CASCATA: a mineradora sai de chapa e pedra ===');
// mineradora = 3 engrenagens + 3 chapas + 1 forno
// engrenagem  = 2 chapas       | forno = 5 pedras
// total bruto = 3*2 + 3 = 9 chapas, e 5 pedras
World.init('CAS',null);
p=P.criar(0,0);
Inv.add(p.inv,'iron_plate',9); Inv.add(p.inv,'stone',5);
const rDrill=receita('burner_drill');
ok(!P.podeFabricar(p,rDrill),'direto ela nao da (falta engrenagem e forno)');
ok(P.podeFabricarEmCascata(p,rDrill),'mas em cascata da');
const passos=P.passosAntesDe(p,rDrill);
console.log('  antes dela: '+passos.map(x=>D.itemNome(x.item)+'×'+x.n).join(', '));
ok(passos.length===2,'sao dois pedacos antes: engrenagem e forno');

ok(P.fabricar(p,rDrill,1)===1,'entrou na fila');
console.log('  fila: '+p.fila.map(j=>j.receita.saida+(j.entrega?'':'(interno)')).join(' -> '));
ok(p.fila.length===5,'5 trabalhos: 3 engrenagens + 1 forno + a mineradora ('+p.fila.length+')');
ok(Inv.conta(p.inv,'iron_plate')===0 && Inv.conta(p.inv,'stone')===0,'os brutos sairam da mochila na hora');

for(let i=0;i<60*20;i++) P.updateFila(p,1/60);
console.log('  no fim: '+mostrar(p.inv).filter(x=>x!=='-').join(' '));
ok(Inv.conta(p.inv,'burner_drill')===1,'a mineradora ficou pronta');
ok(Inv.conta(p.inv,'iron_gear')===0,'as engrenagens nao sobraram na mochila — foram para dentro dela');
ok(Inv.conta(p.inv,'stone_furnace')===0,'nem o forno sobrou');
ok(p.fila.length===0,'a fila esvaziou');

console.log('\n=== CASCATA: falta material bruto ===');
World.init('CAS2',null);
p=P.criar(0,0);
Inv.add(p.inv,'iron_plate',9);          // sem pedra: o forno nao sai
ok(!P.podeFabricarEmCascata(p,rDrill),'sem pedra nao da, e o jogo diz isso antes de mexer na mochila');
ok(P.fabricar(p,rDrill,1)===0,'nao enfileirou nada');
ok(Inv.conta(p.inv,'iron_plate')===9,'e nao comeu as chapas dele');

console.log('\n=== CANCELAR devolve o que foi pago, a escada inteira ===');
World.init('CAS3',null);
p=P.criar(0,0);
Inv.add(p.inv,'iron_plate',9); Inv.add(p.inv,'stone',5);
P.fabricar(p,rDrill,1);
P.updateFila(p,0.2);                     // ninguem terminou ainda
P.cancelarFabricacao(p);
ok(p.fila.length===0,'a escada toda saiu da fila');
ok(Inv.conta(p.inv,'iron_plate')===9 && Inv.conta(p.inv,'stone')===5,
   'os 9 de ferro e as 5 pedras voltaram inteiros: '+Inv.conta(p.inv,'iron_plate')+' e '+Inv.conta(p.inv,'stone'));

console.log('\n=== CANCELAR no meio: o que ja ficou pronto volta como peca ===');
World.init('CAS3b',null);
p=P.criar(0,0);
Inv.add(p.inv,'iron_plate',9); Inv.add(p.inv,'stone',5);
P.fabricar(p,rDrill,1);
for(let i=0;i<60;i++) P.updateFila(p,1/60);   // 1 s: a primeira engrenagem (0,5 s) fica pronta
P.cancelarFabricacao(p);
const ferro=Inv.conta(p.inv,'iron_plate'), gear=Inv.conta(p.inv,'iron_gear');
console.log('  voltou: '+ferro+' chapas, '+gear+' engrenagem(ns), '+Inv.conta(p.inv,'stone')+' pedras');
ok(gear>=1,'a engrenagem que ja estava pronta voltou como engrenagem');
ok(ferro+gear*2===9,'nada se perdeu: '+ferro+' chapas + '+gear+'x2 = 9 equivalentes');
ok(Inv.conta(p.inv,'stone')===5,'as pedras do forno voltaram');

console.log('\n=== SOBRA de arredondamento vai para a mochila ===');
// esteira: 1 engrenagem + 1 chapa -> 2 esteiras. Pedir 1 esteira faz 2.
World.init('CAS4',null);
p=P.criar(0,0);
Inv.add(p.inv,'iron_plate',3);
P.fabricar(p,receita('transport_belt'),1);
for(let i=0;i<60*10;i++) P.updateFila(p,1/60);
ok(Inv.conta(p.inv,'transport_belt')===2,'a receita faz 2 de cada vez, e as 2 chegaram: '+Inv.conta(p.inv,'transport_belt'));

console.log('\n=== O que ja da para fazer direto continua igual ===');
World.init('CAS5',null);
p=P.criar(0,0);
Inv.add(p.inv,'stone',5);
ok(P.fabricar(p,receita('stone_furnace'),1)===1,'forno direto entra na fila');
ok(p.fila.length===1,'um trabalho so, sem escada');
for(let i=0;i<60*3;i++) P.updateFila(p,1/60);
ok(Inv.conta(p.inv,'stone_furnace')===1,'e o forno chegou na mochila');

console.log('\n'+(f===0?'TUDO PASSOU':f+' FALHA(S)'));
process.exit(f?1:0);
