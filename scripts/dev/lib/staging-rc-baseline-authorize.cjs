/**
 * Staging 运行态 mutation 授权 · TT_STAGING_RC_BASELINE SSOT.
 * 未授权则禁止写入 Staging 公开展示面 / Admin Public Ops。
 */
function stagingBaselineMutationAuthorized() {
  return (
    process.env.STAGING_RC_BASELINE_ALIGNING === '1' ||
    process.env.STAGING_RC_BASELINE_AUTHORIZED === '1' ||
    process.env.TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE === '1'
  );
}

const CANONICAL_ADMISSION_POLICY =
  '任何新增 Public Surface、业务模块或公开展示能力，必须先完成 Baseline 注册、SSOT 建模、' +
  '统一 Gate、统一 Audit、统一 Evidence，并通过 TT_STAGING_RC_BASELINE 验证后，才允许进入 Staging；' +
  '任何未纳入 Baseline 的模块不得部署、不得公开展示、不得视为 Release Candidate。';

function assertStagingBaselineMutationAuthorized(context = 'staging_mutation') {
  if (stagingBaselineMutationAuthorized()) return;
  console.error(
    `TT_STAGING_RC_BASELINE: BLOCKED unauthorized ${context}\n` +
      `  Policy: ${CANONICAL_ADMISSION_POLICY}\n` +
      '  Run: bash scripts/dev/run-staging-rc-baseline-final-alignment.sh\n' +
      '  Or:  bash scripts/dev/run-staging-rc-baseline-enforcement-check.sh (read-only)\n' +
      '  SSOT: registry/staging-rc-baseline.v1.yaml#canonical_admission_policy\n' +
      '  Owner override: TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1'
  );
  process.exit(2);
}

module.exports = {
  stagingBaselineMutationAuthorized,
  assertStagingBaselineMutationAuthorized,
  CANONICAL_ADMISSION_POLICY,
};
