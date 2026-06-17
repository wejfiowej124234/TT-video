# §6.1 site theme V1 vitest slice (same file set as scripts/gates/site-theme-v1-d10-machine.sh Step 1).
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location (Join-Path $Root "frontend")

Write-Host "site-theme-v1-vitest: §6.1 contract bundle..."
npm run test -- --run `
  lib/uiSystem.test.ts lib/marketingUi.test.ts `
  components/market/marketTheme.contract.test.ts `
  components/market/marketDetailDrawerClasses.contract.test.ts `
  components/did-rank/didRankTheme.contract.test.ts `
  components/community/communityShellTheme.contract.test.ts `
  components/community/communityPageTheme.contract.test.ts `
  components/community/communityFeedActionTheme.contract.test.ts `
  components/community/communityDrawerTheme.contract.test.ts `
  components/community/postDetailVideoFeedNav.test.ts `
  components/community/postDetailMediaWheelPolicy.test.ts `
  components/community/communityMainPathRg.contract.test.ts `
  components/guides/guidesTheme.contract.test.ts `
  components/auth/authHelpBridgeTheme.contract.test.ts `
  app/traveltrust/traveltrustErrorTheme.contract.test.ts `
  components/shell/marketDarkRouteScene.contract.test.ts `
  "app/(home)/homeMarketing.contract.test.ts" `
  lib/siteThemeV1StateFamily.contract.test.ts `
  lib/siteThemeV1PostRoutes.contract.test.ts `
  components/market/marketModalsG4.contract.test.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "site-theme-v1-vitest: FAIL" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "site-theme-v1-vitest: exit 0"
exit 0
