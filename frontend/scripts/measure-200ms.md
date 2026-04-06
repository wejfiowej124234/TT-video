# 53-S24 200ms 测量脚本说明

与 [53-200ms验收说明](../../docs/spec/53-200ms验收说明.md) 对应，用于验收时「点击到首帧/骨架」≤200ms 的测量。

## 使用方式

1. **Chrome DevTools Performance**  
   - 打开应用（如 http://localhost:3012），F12 → Performance。  
   - 点击 Record → 在页面执行路由跳转（如 /market → /escrow/1）或 Tab 切换、抽屉打开。  
   - 停止录制，查看「FCP / 首次绘制」或「LCP」与点击时间差，应 ≤200ms。

2. **performance.measure（控制台）**  
   - 在目标页打开控制台，执行：
   ```js
   performance.mark("nav-end");
   performance.measure("click-to-view", "navigationStart", "nav-end");
   console.log(performance.getEntriesByName("click-to-view")[0].duration);
   ```
   - 或在 Next 路由切换前 `performance.mark("route-start")`，切换后 `performance.mark("route-end")` 再 measure。

3. **Lighthouse**  
   - `npm run lighthouse`（需先 `npm run dev`），查看 Performance 面板 FCP/LCP。

## 样本与结果

- 样本：路由跳转、Tab 切换、抽屉/弹窗打开，每类 3～5 次。  
- 达标：骨架/首帧 200ms 内必现（§4.4.7）；中位数或 P95 ≤200ms。  
- 留痕：结果填 [53-200ms验收说明](../../docs/spec/53-200ms验收说明.md) 五、留痕表，执行日期 YYYY-MM-DD。
