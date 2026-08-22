/* ============================================================
   Factoriozinho — servidor local simples
   Só serve os arquivos da pasta. Use quando o navegador
   implicar em carregar as imagens direto do disco (file://).

   Uso:  node servidor.js      → abre em http://localhost:8080
   ============================================================ */

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORTA = process.env.PORT || 8080;
var RAIZ = __dirname;

var TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

http.createServer(function (req, res) {
  var url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  var arquivo = path.join(RAIZ, path.normalize(url));

  // não deixa sair da pasta do projeto
  if (arquivo.indexOf(RAIZ) !== 0) {
    res.writeHead(403);
    res.end('403');
    return;
  }

  fs.readFile(arquivo, function (err, dados) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — não achei: ' + url);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(dados);
  });
}).listen(PORTA, function () {
  console.log('');
  console.log('  Factoriozinho rodando em:  http://localhost:' + PORTA);
  console.log('  (Ctrl+C para parar)');
  console.log('');
});
