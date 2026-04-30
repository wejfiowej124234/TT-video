# Admin finance / indexer — Lighthouse capture (port 3012)

Captured with `lighthouse@11.6.0` against a local Next server on **http://127.0.0.1:3012**. Unauthenticated requests redirect to `/auth/login?returnUrl=…` (same pattern as `/pay` / `/market` captures).

## Routes / artifacts

| Requested URL | Lighthouse JSON | Metrics snippet | Final screenshot (post-redirect) |
| --- | --- | --- | --- |
| `/admin/finance` | `admin_finance_3012.lighthouse.json` | `admin_finance_3012.metrics-snippet.json` | `screenshots/admin_finance_3012_final.jpg` |
| `/admin/indexer` | `admin_indexer_3012.lighthouse.json` | `admin_indexer_3012.metrics-snippet.json` | `screenshots/admin_indexer_3012_final.jpg` |

## 96-13 scope (same case IDs)

- **96-13-route-admin-finance**: `/admin/finance`, `/admin/finance-reconciliation` (read-only hub + summary mapping).
- **96-13-route-admin-indexer**: `/admin/indexer`, `/admin/indexer/reconcile-reports` (health + reconcile list / export UX).

## Notes

- Chrome emitted optional `RootCauses` / `TraceElements` warnings; category scores still generated.
- Re-run: `cd frontend && npx lighthouse@11.6.0 http://127.0.0.1:3012/admin/finance --only-categories=performance,accessibility --output=json --output-path=../evidence/GO_96_ux_20260425/admin_finance_3012.lighthouse.json --chrome-flags="--headless --no-sandbox"`
