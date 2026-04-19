# 环境记录（脱敏）

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | `postgres://traveltrust:***@localhost:5432/traveltrust`（与 `.env` 一致；密码已脱敏） |
| `PORT` | `8080` |
| `SEED_TEST_ACCOUNTS` | `1` |
| `API_BASE_URL` / 烟测目标 | `http://127.0.0.1:8080` |

**备注**：smoke 脚本在**已设置** `DATABASE_URL` 时执行第 10 步 DB 抽检（本机无 `psql` 时使用 `docker exec traveltrust-postgres psql`）。
