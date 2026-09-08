const fs=require('fs'), path=require('path');
const RAIZ = require('path').join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ,D=FZ.Data,World=FZ.World,Inv=FZ.Inv,E=FZ.Entities;
let falhas=0; const ok=(c,m)=>{console.log((c?'  OK  ':'  XX  ')+m); if(!c)falhas++;};
const rodar=(seg,passo=1/60)=>{for(let i=0;i<seg/passo;i++) E.update(passo);};

console.log('\n=== ESTEIRA: transporte basico ===');
World.init('BELT',null);
const belts=[];
for(let x=0;x<5;x++) belts.push(World.criarEntidade('transport_belt',x,0,1));  // dir 1 = leste
const bau=World.criarEntidade('wooden_chest',5,0,0);

ok(E.porNaEsteira(belts[0],'iron_ore'),'da para por um item na esteira');
rodar(0.1);
ok(E.itensNaEsteira(belts[0])===1 && belts[0].faixas[0][0].pos>0,'o item comecou a andar (pos='+belts[0].faixas[0][0].pos.toFixed(2)+')');

rodar(3);   // 5 tiles a 2 tiles/s = 2,5s
ok(Inv.conta(bau.inv.geral,'iron_ore')===1,'o item atravessou 5 esteiras e caiu no bau');
ok(belts.every(b=>E.itensNaEsteira(b)===0),'nenhuma esteira ficou com item preso');

console.log('\n=== ESTEIRA: capacidade e fila ===');
World.init('BELT',null);
const b1=World.criarEntidade('transport_belt',0,0,1);
let postos=0;
for(let i=0;i<20;i++) if(E.porNaEsteira(b1,'coal')) postos++;
ok(postos===2,'de uma vez so entram 2 (um por faixa) — entraram '+postos);
rodar(2);
ok(b1.faixas[0][0].pos===1,'sem nada na frente, o item para no fim da esteira');
for(let i=0;i<20;i++){ E.porNaEsteira(b1,'coal'); rodar(0.13); }
console.log('  itens que couberam em 1 tile:',E.itensNaEsteira(b1),'(esq '+b1.faixas[0].length+' + dir '+b1.faixas[1].length+')');
ok(E.itensNaEsteira(b1)===D.BUILDINGS.transport_belt.capacidade*2,
   'cabem '+(D.BUILDINGS.transport_belt.capacidade*2)+' itens em 1 tile (4 por faixa)');
ok(!E.porNaEsteira(b1,'coal',0) && !E.porNaEsteira(b1,'coal',1),'esteira cheia recusa mais itens nas duas faixas');
ok(E.estado(b1).indexOf('Entupida')===0,'estado avisa que entupiu: '+E.estado(b1));

let ordenado=true;
for(const fx of b1.faixas) for(let i=1;i<fx.length;i++) if(fx[i].pos>=fx[i-1].pos) ordenado=false;
ok(ordenado,'os itens ficam em fila, um atras do outro, sem se atropelar');

console.log('\n=== ESTEIRA: curva (muda de direcao) ===');
World.init('BELT',null);
const c1=World.criarEntidade('transport_belt',0,0,1);   // leste
World.criarEntidade('transport_belt',1,0,2);            // vira para o sul
World.criarEntidade('transport_belt',1,1,2);            // sul
const bauC=World.criarEntidade('wooden_chest',1,2,0);
E.porNaEsteira(c1,'stone');
rodar(4);
ok(Inv.conta(bauC.inv.geral,'stone')===1,'o item fez a curva e chegou ao destino');

console.log('\n=== INSERIDOR: bau -> bau ===');
World.init('INS',null);
const origem=World.criarEntidade('wooden_chest',0,0,0);
const ins=World.criarEntidade('inserter',1,0,1);        // leste: pega do oeste, poe no leste
const destino=World.criarEntidade('wooden_chest',2,0,0);
Inv.add(origem.inv.geral,'iron_plate',10);
Inv.add(ins.inv.fuel,'coal',1);

const tras=E.tileEntrada(ins), frente=E.tileSaida(ins);
ok(tras.x===0 && tras.y===0,'pega do tile de TRAS (0,0)');
ok(frente.x===2 && frente.y===0,'poe no tile da FRENTE (2,0)');

rodar(10);
const movidos=Inv.conta(destino.inv.geral,'iron_plate');
console.log('  movidos em 10s:',movidos,'| sobrou na origem:',Inv.conta(origem.inv.geral,'iron_plate'),'| estado:',E.estado(ins));
ok(movidos>=8 && movidos<=12,'moveu ~10 itens em 10s (1 por segundo) — moveu '+movidos);
ok(movidos+Inv.conta(origem.inv.geral,'iron_plate')+(ins.segurando?1:0)===10,'nenhum item sumiu nem duplicou');

console.log('\n=== INSERIDOR: casos de parada ===');
World.init('INS',null);
const o2=World.criarEntidade('wooden_chest',0,0,0);
const i2=World.criarEntidade('inserter',1,0,1);
const d2=World.criarEntidade('wooden_chest',2,0,0);
Inv.add(o2.inv.geral,'stone',10);
rodar(10);
ok(Inv.conta(d2.inv.geral,'stone')===0,'sem combustivel nao move nada');
ok(E.estado(i2)==='Sem combustível','avisa: '+E.estado(i2));

World.init('INS',null);
const o3=World.criarEntidade('wooden_chest',0,0,0);
const i3=World.criarEntidade('inserter',1,0,1);
Inv.add(o3.inv.geral,'stone',10);
Inv.add(i3.inv.fuel,'coal',1);
rodar(3);
ok(Inv.conta(o3.inv.geral,'stone')===10,'nao tira nada se nao ha onde por');
ok(E.estado(i3).indexOf('Sem nada na frente')>=0,'avisa: '+E.estado(i3));

console.log('\n=== INSERIDOR: destinos certos ===');
World.init('INS',null);
const bcarv=World.criarEntidade('wooden_chest',0,0,0);
const iF=World.criarEntidade('inserter',1,0,1);
const forno=World.criarEntidade('stone_furnace',2,0,0);
Inv.add(bcarv.inv.geral,'iron_ore',5);
Inv.add(iF.inv.fuel,'coal',2);
rodar(6);
ok(Inv.conta(forno.inv.input,'iron_ore')>0,'inseridor poe minerio na ENTRADA do forno');

World.init('INS',null);
const bcarv2=World.criarEntidade('wooden_chest',0,0,0);
const iF2=World.criarEntidade('inserter',1,0,1);
const forno2=World.criarEntidade('stone_furnace',2,0,0);
Inv.add(bcarv2.inv.geral,'coal',5);
Inv.add(iF2.inv.fuel,'coal',2);
rodar(6);
ok(Inv.conta(forno2.inv.fuel,'coal')>0,'inseridor poe carvao no COMBUSTIVEL do forno');

console.log('\n=== LINHA COMPLETA (mineradora -> esteira -> inseridor -> forno -> inseridor -> esteira -> bau) ===');
World.init('LINHA',null);
let loc=null;
for(let y=-60;y<60 && !loc;y++) for(let x=-60;x<60 && !loc;x++){
  if(World.resAt(x,y)===D.RES.IRON && World.podeConstruir('burner_drill',x,y)){
    let livre=true;
    for(let k=2;k<=9;k++) if(!World.podeConstruir('transport_belt',x+k,y+1)) livre=false;
    if(!World.podeConstruir('stone_furnace',x+5,y+1)) livre=false;
    if(livre) loc={x,y};
  }
}
console.log('  montando a linha em',loc);
// a linha corre na altura da SAÍDA da mineradora: o canto de baixo da frente
const ly=loc.y+1;
const dr=World.criarEntidade('burner_drill',loc.x,loc.y,1);
Inv.add(dr.inv.fuel,'coal',20);
const be1=World.criarEntidade('transport_belt',loc.x+2,ly,1);
World.criarEntidade('transport_belt',loc.x+3,ly,1);
const ins2=World.criarEntidade('inserter',loc.x+4,ly,1);
Inv.add(ins2.inv.fuel,'coal',20);
const fo=World.criarEntidade('stone_furnace',loc.x+5,ly,0);
Inv.add(fo.inv.fuel,'coal',20);
const ins3=World.criarEntidade('inserter',loc.x+7,ly,1);
Inv.add(ins3.inv.fuel,'coal',20);
const be3=World.criarEntidade('transport_belt',loc.x+8,ly,1);
const bauF=World.criarEntidade('wooden_chest',loc.x+9,ly,0);

rodar(60);
const placas=Inv.conta(bauF.inv.geral,'iron_plate');
console.log('  depois de 60s: '+placas+' placas de ferro no bau final');
console.log('  esteira 1:',E.itensNaEsteira(be1),'itens | esteira 3:',E.itensNaEsteira(be3),'itens');
console.log('  forno:',E.estado(fo),'| inseridor 1:',E.estado(ins2),'| inseridor 2:',E.estado(ins3));
ok(placas>0,'A LINHA INTEIRA FUNCIONOU SOZINHA: minerio virou placa e chegou no bau');

console.log('\n=== REMOVER devolve o que estava em cima ===');
World.init('REM',null);
const br=World.criarEntidade('transport_belt',0,0,1);
E.porNaEsteira(br,'coal'); rodar(0.2); E.porNaEsteira(br,'coal');
const cont=E.conteudo(br);
ok(cont.length===2 && cont.every(c=>c.item==='coal'),'os itens em cima da esteira voltam ao remover');

const ir=World.criarEntidade('inserter',5,5,1);
Inv.add(ir.inv.fuel,'coal',3);
ir.segurando='iron_plate';
const cont2=E.conteudo(ir);
ok(cont2.some(c=>c.item==='iron_plate') && cont2.some(c=>c.item==='coal'),
   'o inseridor devolve o combustivel E o que estava na mao');

console.log('\n=== SAVE preserva a esteira carregada ===');
World.init('SAVE',null);
const bs=World.criarEntidade('transport_belt',3,3,1);
E.porNaEsteira(bs,'gold_ore'); rodar(0.15); E.porNaEsteira(bs,'coal');
const salvo=JSON.parse(JSON.stringify(World.serialize()));
World.init('SAVE',salvo);
const bs2=World.entityAt(3,3);
ok(bs2 && E.itensNaEsteira(bs2)===2,'a esteira volta do save com os 2 itens em cima');
ok(bs2.faixas[0][0].item==='gold_ore','na mesma faixa e ordem');

console.log('\n=== RECEITAS NOVAS ===');
const r=D.HAND_RECIPES;
ok(r.some(x=>x.saida==='transport_belt' && x.qtd===2),'esteira: rende 2 por receita');
const ri=r.find(x=>x.saida==='inserter');
ok(!!ri,'inseridor tem receita');
ok(!!ri.custo.copper_plate,'o inseridor exige placa de cobre (obriga a fundir cobre)');
let receitasOk=true;
r.forEach(x=>{ if(!D.ITEMS[x.saida]) receitasOk=false; for(const i in x.custo) if(!D.ITEMS[i]) receitasOk=false; });
ok(receitasOk,'todas as receitas apontam para itens que existem');

console.log('\n'+(falhas===0?'TUDO PASSOU':falhas+' FALHA(S)'));
process.exit(falhas?1:0);
