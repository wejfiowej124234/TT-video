-- DSAR 请求乐观锁版本列（500、04 §3.5）；供 Admin 更新 + 事件追加事务使用。

ALTER TABLE compliance_data_requests
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
