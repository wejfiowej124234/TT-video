import { permanentRedirect } from "next/navigation";

/** 85 §路由约定：`/network` 为 `/traveltrust` 别名；与 04 §3.4、13-1 表 1 同批登记。 */
export default function NetworkAliasPage() {
  permanentRedirect("/traveltrust");
}
