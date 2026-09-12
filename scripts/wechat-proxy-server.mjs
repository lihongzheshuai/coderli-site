/**
 * OneCoder 微信公众号固定 IP 代理网关 (WeChat Proxy Gateway)
 * 部署环境: 腾讯云轻量应用服务器 (Tencent Cloud Lighthouse)
 * 依赖: Node.js 18+ (零外部依赖，直接 node 即可运行)
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = process.env.PORT || 8080;
const PROXY_TOKEN = process.env.PROXY_TOKEN || 'onecoder-wechat-proxy-secret';

// In-memory token cache: { token, expiresAt }
let tokenCache = null;

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-proxy-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Health check (public)
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() }));
    return;
  }

  // 2. Authentication check
  const clientToken = req.headers['x-proxy-token'] || reqUrl.searchParams.get('token');
  if (clientToken !== PROXY_TOKEN) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ errcode: 401, errmsg: 'Unauthorized: Invalid x-proxy-token' }));
    return;
  }

  // 3. Cached Access Token Provider
  if (pathname === '/token') {
    const appid = reqUrl.searchParams.get('appid');
    const secret = reqUrl.searchParams.get('secret');

    if (!appid || !secret) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ errcode: 400, errmsg: 'Missing appid or secret' }));
      return;
    }

    // Check memory cache
    if (tokenCache && tokenCache.appid === appid && tokenCache.expiresAt > Date.now()) {
      console.log(`[Token] Cache HIT for AppID ${appid.slice(0, 6)}...`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        access_token: tokenCache.token,
        expires_in: Math.floor((tokenCache.expiresAt - Date.now()) / 1000),
        cached: true,
      }));
      return;
    }

    // Fetch from WeChat API via this Tencent Cloud fixed IP
    console.log(`[Token] Cache MISS, requesting fresh token from WeChat API...`);
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;

    https.get(tokenUrl, (wxRes) => {
      let data = '';
      wxRes.on('data', chunk => { data += chunk; });
      wxRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            tokenCache = {
              appid,
              token: json.access_token,
              // Cache for expires_in minus 5 minutes safety buffer
              expiresAt: Date.now() + (json.expires_in - 300) * 1000,
            };
            console.log(`[Token] Successfully fetched and cached token. Expires in ${json.expires_in}s`);
          } else {
            console.error(`[Token] WeChat API error:`, data);
          }
          res.writeHead(wxRes.statusCode || 200, { 'Content-Type': 'application/json' });
          res.end(data);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ errcode: 500, errmsg: e.message, raw: data }));
        }
      });
    }).on('error', err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ errcode: 500, errmsg: err.message }));
    });
    return;
  }

  // 4. Reverse Proxy Gateway for WeChat API requests
  // Path format: /wechat/api/cgi-bin/draft/add?access_token=...
  if (pathname.startsWith('/wechat/api/')) {
    const targetPath = pathname.replace(/^\/wechat\/api/, '') + reqUrl.search;
    console.log(`[Proxy] ${req.method} https://api.weixin.qq.com${targetPath.split('?')[0]}`);

    const options = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: 'api.weixin.qq.com',
      },
    };
    delete options.headers['x-proxy-token'];

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error]`, err);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ errcode: 502, errmsg: `Proxy forwarding error: ${err.message}` }));
      }
    });

    req.pipe(proxyReq);
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ errcode: 404, errmsg: 'Not found. Use /health, /token, or /wechat/api/*' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`OneCoder WeChat Proxy Gateway is running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Proxy Token Auth: Enabled (Header: x-proxy-token)`);
  console.log(`====================================================`);
});
