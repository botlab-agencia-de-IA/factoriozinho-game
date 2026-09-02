/* ============================================================
   Testa o inspetor do mapa: passar o mouse por um lugar do mapa
   e ver ali do lado o que tem naquele quadrado.

   O que monta o painel é a função lerLugar do hud, que só devolve
   texto — não mexe na tela. Então dá para conferir tudo aqui, sem
   abrir o navegador.
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js',
                'src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js','src/js/ui/hud.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ, D=FZ.Data, World=FZ.World, Inv=FZ.Inv, E=FZ.Entities, Hud=FZ.Hud, C=D.CONFIG;
const rodar=(s,p=1/60)=>{for(let i=0;i<s/p;i++) E.update(p);};
let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};
const ler=(x,y)=>Hud.lerLugarDoMapa(x,y);
const tem=(d,t)=>d.html.indexOf(t)>=0;

function acharCarvao(){
  for(let y=-60;y<60;y++) for(let x=-60;x<60;x++){
    if(World.resAt(x,y)===D.RES.COAL && World.podeConstruir('burner_drill',x,y)) return {x,y};
  }
  throw new Error('nao achei carvao com espaco para a mineradora');
}
function acharLivre(){
  for(let y=-60;y<60;y++) for(let x=-60;x<60;x++){
    if(World.podeConstruir('stone_furnace',x,y) && !World.resAt(x,y)) return {x,y};
  }
  throw new Error('nao achei espaco livre');
}

console.log('\n=== JAZIDA: quanto tem neste quadrado e na jazida inteira ===');
World.init('INSP1',null);
let jz=null;
for(let y=-60;y<60 && !jz;y++) for(let x=-60;x<60 && !jz;x++)
  if(World.resAt(x,y)===D.RES.IRON) jz={x,y};

const dJaz=ler(jz.x,jz.y);
console.log('  tile ('+jz.x+','+jz.y+') tem '+World.amountAt(jz.x,jz.y)+' de ferro');
ok(tem(dJaz,'Jazida de ferro'),'diz o nome da jazida');
ok(tem(dJaz,'Neste quadrado'),'mostra o quanto tem no quadrado');
ok(tem(dJaz,'A jazida inteira'),'mostra o total da jazida inteira');
ok(tem(dJaz,'data-item="iron_ore"'),'traz o ícone do minério que ela rende');

// o total da jazida inteira tem que bater com a soma da mancha ligada
function somaDaMancha(x0,y0,res){
  const fila=[[x0,y0]], vistos={[x0+','+y0]:1};
  let soma=0;
  while(fila.length){
    const [x,y]=fila.pop();
    if(World.resAt(x,y)!==res) continue;
    soma+=World.amountAt(x,y);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const k=(x+dx)+','+(y+dy);
      if(vistos[k]||!World.dentroDoMundo(x+dx,y+dy)) continue;
      vistos[k]=1; fila.push([x+dx,y+dy]);
    }
  }
  return soma;
}
const somaReal=somaDaMancha(jz.x,jz.y,D.RES.IRON);
const mostrado=dJaz.html.match(/A jazida inteira<\/span><b>([^<]+)</)[1];
console.log('  a jazida inteira soma '+somaReal+' — o painel mostra "'+mostrado+'"');
function desformatar(t){
  if(t.endsWith('M')) return Math.round(parseFloat(t)*1000000);
  if(t.endsWith('k')) return Math.round(parseFloat(t)*1000);
  return +t;
}
const erro=Math.abs(desformatar(mostrado)-somaReal)/somaReal;
ok(erro<0.06,'o total da jazida bate com a soma real (diferença de '+(erro*100).toFixed(1)+'%, só o arredondamento)');

// dois tiles da mesma jazida dão o mesmo total
let vizinho=null;
for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]])
  if(!vizinho && World.resAt(jz.x+dx,jz.y+dy)===D.RES.IRON) vizinho={x:jz.x+dx,y:jz.y+dy};
if(vizinho){
  const d2=ler(vizinho.x,vizinho.y);
  const m2=d2.html.match(/A jazida inteira<\/span><b>([^<]+)</)[1];
  ok(m2===mostrado,'outro quadrado da mesma jazida mostra o mesmo total');
}

console.log('\n=== FORNO: o processo que está rolando dentro ===');
World.init('INSP2',null);
const lf=acharLivre();
const forno=World.criarEntidade('stone_furnace',lf.x,lf.y,0);
Inv.add(forno.inv.fuel,'coal',10);
Inv.add(forno.inv.input,'iron_ore',20);
rodar(2);
const dF=ler(lf.x,lf.y);
console.log('  estado: '+E.estado(forno)+' | progresso '+(forno.progresso*100).toFixed(0)+'%');
ok(tem(dF,'Forno de pedra'),'diz que é o forno');
ok(tem(dF,'Fundindo'),'mostra o que está fundindo');
ok(tem(dF,'data-item="iron_ore"'),'com o ícone do minério que entrou');
ok(tem(dF,'Placa de ferro'),'diz no que vai virar');
ok(tem(dF,'Combustível'),'mostra o combustível');
ok(dF.prog>0 && dF.prog<1,'entrega a progressão da fundição ('+(dF.prog*100).toFixed(0)+'%)');
ok(dF.chama>0,'entrega o quanto ainda falta queimar ('+(dF.chama*100).toFixed(0)+'%)');
ok(dF.html.indexOf('undefined')<0,'não sobrou nenhum "undefined" no painel');

// a progressão anda
const prog1=dF.prog;
rodar(1);
const prog2=ler(lf.x,lf.y).prog;
ok(prog2!==prog1,'a progressão anda sozinha enquanto o forno trabalha');

// o forno ocupa 2x2: o painel responde em qualquer um dos 4 quadrados
ok(ler(lf.x+1,lf.y+1).assinatura===ler(lf.x,lf.y).assinatura,'os 4 quadrados do forno mostram a mesma coisa');

console.log('\n=== MINERADORA: o total que ainda dá para tirar + a progressão ===');
World.init('INSP3',null);
const lc=acharCarvao();
const drill=World.criarEntidade('burner_drill',lc.x,lc.y,1);
Inv.add(drill.inv.fuel,'coal',10);
rodar(3);
const dM=ler(lc.x,lc.y);
let sob=0;
for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++){
  const r=World.resAt(lc.x+dx,lc.y+dy);
  if(r && D.resInfo(r).emCima) sob+=World.amountAt(lc.x+dx,lc.y+dy);
}
console.log('  embaixo da mineradora ainda há '+sob+' de minério');
ok(tem(dM,'Mineradora'),'diz que é a mineradora');
ok(tem(dM,'Tirando'),'diz o que ela está tirando');
ok(tem(dM,'Ainda dá para tirar'),'mostra o total que ainda vai ser minerado');
ok(tem(dM,'até acabar embaixo dela'),'estima em quanto tempo acaba');
ok(dM.prog!==null,'entrega a progressão da mineração');
ok(dM.chama>0,'entrega a queima do combustível');
ok(dM.html.indexOf('undefined')<0,'não sobrou nenhum "undefined" no painel');

console.log('\n=== BAÚ, ESTEIRA E INSERIDOR ===');
World.init('INSP4',null);
const lb=acharLivre();
const bau=World.criarEntidade('wooden_chest',lb.x,lb.y,0);
Inv.add(bau.inv.geral,'iron_plate',37);
Inv.add(bau.inv.geral,'coal',5);
const dB=ler(lb.x,lb.y);
ok(tem(dB,'Placa de ferro') && tem(dB,'37'),'o baú lista o que tem dentro, com quantidade');
ok(tem(dB,'data-item="coal"'),'com o ícone de cada item');

const belt=World.criarEntidade('transport_belt',lb.x+2,lb.y,1);
E.porNaEsteira(belt,'copper_plate',0);
E.porNaEsteira(belt,'copper_plate',0);
const dE=ler(lb.x+2,lb.y);
ok(tem(dE,'Faixa esquerda') && tem(dE,'Faixa direita'),'a esteira mostra as duas faixas');
ok(tem(dE,'Placa de cobre'),'e o que está passando nelas');

const ins=World.criarEntidade('inserter',lb.x+4,lb.y,1);
Inv.add(ins.inv.fuel,'coal',3);
const dI=ler(lb.x+4,lb.y);
ok(tem(dI,'Inseridor'),'o inseridor aparece pelo nome');
ok(tem(dI,'Pega do'),'e explica de onde ele pega e onde põe');
ok(dI.html.indexOf('undefined')<0,'não sobrou nenhum "undefined" no painel');

console.log('\n=== CHÃO E FORA DO MUNDO ===');
World.init('INSP5',null);
const lv=acharLivre();
const dC=ler(lv.x,lv.y);
ok(tem(dC,'Dá para construir aqui'),'chão livre diz que dá para construir');
const dFora=ler(C.MUNDO_MAX+10,0);
ok(dFora.assinatura==='fora' && tem(dFora,'Fora do mundo'),'fora do mundo avisa que é fora do mundo');

let agua=null;
for(let y=-60;y<60 && !agua;y++) for(let x=-60;x<60 && !agua;x++)
  if(World.terrainAt(x,y)===D.TERRAIN.WATER) agua={x,y};
if(agua){
  const dA=ler(agua.x,agua.y);
  ok(tem(dA,'Água') && tem(dA,'Não dá para passar'),'a água avisa que não dá para passar');
}

console.log('\n=== O PAINEL SÓ SE REMONTA QUANDO MUDA ===');
World.init('INSP6',null);
const lf2=acharLivre();
const f2=World.criarEntidade('stone_furnace',lf2.x,lf2.y,0);
const a1=ler(lf2.x,lf2.y).assinatura;
const a2=ler(lf2.x,lf2.y).assinatura;
ok(a1===a2,'ler duas vezes o mesmo lugar parado dá a mesma assinatura');
Inv.add(f2.inv.fuel,'coal',5);
Inv.add(f2.inv.input,'iron_ore',3);
rodar(0.5);
ok(ler(lf2.x,lf2.y).assinatura!==a1,'pôr minério e carvão dentro muda a assinatura');

console.log(falhas ? '\n'+falhas+' falha(s).\n' : '\nTudo certo.\n');
process.exit(falhas?1:0);
