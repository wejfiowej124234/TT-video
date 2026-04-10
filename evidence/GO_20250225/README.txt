本目录为 P13 示例 evidence bundle（GO_20250225），供过门/发版时复用或替换。
过门时请：
  1. 编辑 manifest.json：填写 gate、date、artifacts（真实产物 path+sha256）、sign_off
  2. 在本目录生成 manifest.sha256：从仓库根执行 node scripts/gen_evidence_manifest_sha256.js evidence/GO_20250225；或 Linux/macOS：sha256sum -b manifest.json | awk '{print $1}' > manifest.sha256
  3. 在 08-2 对应工单 Evidence 列填写 evidence/GO_20250225/ 或 manifest hash

未生成 manifest.sha256 前本 bundle 仅作示例目录；生成后即可作为门禁证据。详见 evidence/README.md。
