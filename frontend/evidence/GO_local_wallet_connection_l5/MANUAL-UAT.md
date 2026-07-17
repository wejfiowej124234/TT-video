# Manual UAT · L5 Wallet Connection Center（①）

**执行环境：** 本地或 Staging（测试 ETH）。**禁止**主网真资。  
**签收人：** Owner / Solo maintainer。  
**日期：** 2026-07-14  
**最新签收文件：** [SIGNOFF-LATEST.md](./SIGNOFF-LATEST.md)（当前 **BLOCKED** · 缺 WC Project ID）  


## A. 未连接与 Sheet

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| A1 | 顶栏见「连接钱包 ▾」（EN: Connect wallet） | 暖金玻璃胶囊 · 无裸露品牌条 | ✅ |
| A2 | 点击打开 Sheet | 右侧/底部面板 · 非浏览器小下拉 | ✅ |
| A3 | 阅读顶部三行 | 连接钱包 / 选择已有钱包 / 不保存私钥助记词 | ✅ |
| A4 | 推荐钱包组 | MetaMask Rabby OKX **Bitget** Coinbase Trust · 简称 + Logo | ✅ |
| A5 | 未安装点「安装」 | 新开**对应品牌**官方下载页；装完回站后**自动 reload 重检**，行应变「已安装」可点连 | ☐ Owner |
| A6 | 已连接品牌 | Sheet 显示「当前」 | ☐ |

## B. 浏览器扩展（EIP-6963）

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| B1 | 安装 MetaMask（或 Rabby）后刷新 | 对应行「已安装」 | ☐ |
| B2 | 点击已安装钱包并确认 | 顶栏变为 ● 0x… ▾ | ☐ |
| B3 | 钱包内拒绝连接 | Sheet 提示「你取消了连接请求」 | ☐ |
| B4 | 多扩展并存 | 能点选具体品牌，而非单一「Injected」 | ☐ |

## C. WalletConnect / 移动 Deep Link

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| C0 | 配置 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Sheet 出现 WalletConnect | ☐ |
| C1 | 桌面点 WalletConnect | QR 模态 · 提示扫码文案 | ☐ |
| C2 | 手机浏览器点 WalletConnect | Deep Link 打开钱包 App · 确认后回站已连接 | ☐ |
| C3 | 未配置 Project ID | 提示 WC 未配置 · 其余方式可用 | ✅ |

## D. 已连接账户菜单

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| D1 | 点击 ● 地址 | 账户菜单：地址 · 网络 · 品牌 | ☐ |
| D2 | 复制地址 | 成功反馈 | ☐ |
| D3 | 区块浏览器 | 新开正确链浏览器 | ☐ |
| D4 | 切换钱包 | 再开 Sheet | ☐ |
| D5 | 断开 | 仅在菜单末尾 · 顶栏不再裸露「断开」 | ☐ |
| D6 | 钱包内切换账户 | 出现「账户已切换」类提示 / 地址刷新 | ☐ |

## E. 切链

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| E1 | 钱包切到非目标链 | 顶栏错链提示 · 黄点 | ☐ |
| E2 | 菜单「切换到目标网络」并确认 | 回到正确网络 | ☐ |
| E3 | 拒绝切链 | 「未切换网络，不能继续该操作」 | ☐ |
| E4 | 错链时发起写操作入口（若页面有） | 应被拦 / 不可用（`assertWalletCanWrite`） | ☐ |

## F. 观察模式

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| F1 | 「仅查看地址」输入合法 0x | 顶栏「观察中 · 0x…」 | ☐ |
| F2 | 不得显示「已连接」绿点会话 | 视觉与文案区分 | ☐ |
| F3 | 尝试签名/写操作 | 不可用 | ☐ |
| F4 | 再真实连接钱包 | 观察态清除 | ☐ |

## G. Safe（可选）

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| G1 | 普通浏览器 | Sheet **不**突出 Safe（或不可见） | ✅ |
| G2 | Safe App iframe | Safe 入口可见并可连 | ☐ |

## H. Hero 统一入口

| # | 步骤 | 期望 | Pass |
|---|------|------|------|
| H1 | `/traveltrust` Hero「连接钱包」 | 打开同一 L5 Sheet（非第二套列表） | ☐ |

## 签收

| 项 | 值 |
|----|-----|
| 结果 | **BLOCKED**（见 SIGNOFF-LATEST） |
| 阻塞项 | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` + 扩展/手机真机 B·C1·C2 |
| Owner | 待补 Project ID 后复验 |
| 备注 | ① 本地 UAT 通过 ≠ Production GO；Staging 按「通过后部署」暂缓 |
