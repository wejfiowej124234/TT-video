#!/usr/bin/env bash
# 微型 health 端点 + 启动 cloud soak probe loop
set -euo pipefail
DATA="${SOAK_DATA_DIR:-/data/soak}"
mkdir -p "$DATA/job"
: >"$DATA/health.log"

# 后台 health 服务（Fly http_checks）
node -e "
const http=require('http');
const fs=require('fs');
const p=process.env.SOAK_DATA_DIR||'/data/soak';
http.createServer((req,res)=>{
  let body={ok:true,service:'tt-soak-watcher-staging',executor:'cloud'};
  try{
    const c=JSON.parse(fs.readFileSync(p+'/status.json','utf8'));
    body={...body,...c};
  }catch{}
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify(body));
}).listen(Number(process.env.PORT||8080),'0.0.0.0');
" &

exec ./soak-probe-loop.sh
