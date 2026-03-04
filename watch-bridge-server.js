#!/usr/bin/env node
'use strict';

const http = require('node:http');
const { randomBytes } = require('node:crypto');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = '1';
    }
  }
  return out;
}

const args = parseArgs(process.argv);
const host = args.host || '0.0.0.0';
const port = Number(args.port || 8765);
const token = args.token || randomBytes(8).toString('hex');

if (!Number.isFinite(port) || port < 1 || port > 65535) {
  console.error('[watch-bridge] invalid --port value');
  process.exit(1);
}

const clients = new Set();

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function validTokenFrom(urlObj) {
  return urlObj.searchParams.get('token') === token;
}

function broadcast(eventName, payload) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let active = 0;
  for (const res of clients) {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${body}\n\n`);
      active += 1;
    } catch (err) {
      // stale socket, close and drop
      try { res.end(); } catch (e) {}
      clients.delete(res);
    }
  }
  return active;
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (urlObj.pathname === '/') {
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(
      'ZOOMBIRD Watch Bridge is running.\\n' +
      `Open SSE: /events?token=${token}\\n` +
      `Send tap: /tap?token=${token}\\n`
    );
    return;
  }

  if (urlObj.pathname === '/status') {
    sendJson(res, 200, { ok: true, clients: clients.size, ts: Date.now() });
    return;
  }

  if (urlObj.pathname === '/events' && req.method === 'GET') {
    if (!validTokenFrom(urlObj)) {
      sendJson(res, 401, { ok: false, error: 'invalid token' });
      return;
    }

    setCorsHeaders(res);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });

    res.write(`event: hello\\n`);
    res.write(`data: ${JSON.stringify({ ok: true, ts: Date.now() })}\\n\\n`);

    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
      try { res.end(); } catch (e) {}
    });
    return;
  }

  if (urlObj.pathname === '/tap' && (req.method === 'GET' || req.method === 'POST')) {
    if (!validTokenFrom(urlObj)) {
      sendJson(res, 401, { ok: false, error: 'invalid token' });
      return;
    }

    const activeClients = broadcast('tap', { ts: Date.now() });
    sendJson(res, 200, { ok: true, activeClients });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
});

const keepAliveTimer = setInterval(() => {
  for (const res of clients) {
    try {
      res.write(': ping\\n\\n');
    } catch (err) {
      try { res.end(); } catch (e) {}
      clients.delete(res);
    }
  }
}, 15000);

server.listen(port, host, () => {
  console.log('[watch-bridge] listening');
  console.log(`[watch-bridge] host: ${host}`);
  console.log(`[watch-bridge] port: ${port}`);
  console.log(`[watch-bridge] token: ${token}`);
  console.log(`[watch-bridge] events URL: http://127.0.0.1:${port}/events?token=${token}`);
  console.log(`[watch-bridge] tap URL:    http://127.0.0.1:${port}/tap?token=${token}`);
});

function shutdown() {
  clearInterval(keepAliveTimer);
  for (const res of clients) {
    try { res.end(); } catch (e) {}
  }
  clients.clear();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
