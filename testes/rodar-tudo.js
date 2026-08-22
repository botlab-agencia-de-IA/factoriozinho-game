/* ============================================================
   Roda todos os testes do Factoriozinho de uma vez.

   No terminal, dentro da pasta do projeto:
        node testes/rodar-tudo.js

   Ou dê duplo clique no arquivo  testar.bat  na pasta principal.
   ============================================================ */

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var pasta = __dirname;
var arquivos = fs.readdirSync(pasta)
  .filter(function (f) { return /^\d\d-.*\.js$/.test(f); })
  .sort();

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║        FACTORIOZINHO — bateria de testes     ║');
console.log('╚══════════════════════════════════════════════╝\n');

var falhou = [];

arquivos.forEach(function (f) {
  var nome = f.replace(/^\d\d-/, '').replace(/\.js$/, '').replace(/-/g, ' ');
  process.stdout.write('  ' + nome.padEnd(34));

  var r = cp.spawnSync(process.execPath, [path.join(pasta, f)], { encoding: 'utf8' });
  if (r.status === 0) {
    console.log('PASSOU');
  } else {
    console.log('FALHOU');
    falhou.push({ arquivo: f, saida: (r.stdout || '') + (r.stderr || '') });
  }
});

console.log('');
if (!falhou.length) {
  console.log('  Tudo certo: ' + arquivos.length + '/' + arquivos.length + ' passaram.\n');
  process.exit(0);
}

console.log('  ' + falhou.length + ' de ' + arquivos.length + ' falharam. Detalhes:\n');
falhou.forEach(function (f) {
  console.log('──────── ' + f.arquivo + ' ────────');
  // mostra só as linhas de falha e o final
  var linhas = f.saida.split('\n');
  linhas.forEach(function (l) {
    if (l.indexOf('XX') >= 0 || l.indexOf('✘') >= 0 || l.indexOf('Error') >= 0) console.log(l);
  });
  console.log(linhas.slice(-6).join('\n'));
});
process.exit(1);
