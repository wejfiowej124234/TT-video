# ① 本机 API 烟测（非 ② staging）

**日期：** 2026-05-26  
**API_BASE_URL:** `http://127.0.0.1:8080`（本机 `/health` 200）

## 命令

```bash
API_BASE_URL=http://127.0.0.1:8080 bash scripts/gates/smoke-api-public-routes.sh
```

## 结果

**exit 1** — `/meta` 校验失败：

`product_roles.strict_db_write must be false (748), got ""`

## 口径

此文件 **仅作本机排障参考**，**不**计入 ② 测试网验收，**不**替代 `R003_API_BASE` staging 上的 `run_r003_staging_evidence_chain`。
