# RN + Android 启动流程与日志说明

本项目在 Android 原生和 JS 层加了编号日志，方便用 logcat 观察整体启动顺序。

## 日志顺序（预期）

| 序号 | 位置 | 说明 |
|------|------|------|
| 1 | Android | `Application.onCreate()` 开始 |
| 2 | Android | `super.onCreate()` 完成，准备 `loadReactNative` |
| 3 | Android | `loadReactNative()` 完成，RN 运行时已加载 |
| 4 | Android | `MainActivity.onCreate()` 开始 |
| 5 | Android | `MainActivity.onCreate()` 完成，ReactRootView 已挂载 |
| 6 | Android | `MainActivity.onResume()` |
| 7 | JS | `index.js` 执行，Bundle 已加载，注册根组件 |
| 8 | JS | `AppRegistry.registerComponent` 完成 |
| 9 | JS | App 根组件已挂载，首屏即将渲染 |

## 如何查看

### 1. 只看本应用启动日志（推荐）

```bash
adb logcat -s RnDemoStartup:* ReactNative:* ReactNativeJS:*
```

- **RnDemoStartup**：我们加的 Android 原生日志（MainApplication、MainActivity）
- **ReactNativeJS**：JS 的 `console.log` 会出现在这里

### 2. 按时间看全部 RN 相关

```bash
adb logcat | findstr /i "RnDemoStartup ReactNative ReactNativeJS"
```

### 3. 运行应用

```bash
cd RnDemo
npm start
```

另开终端：

```bash
cd RnDemo
npx react-native run-android
```

启动后观察 logcat，应能看到 1 → 9 的完整顺序。

## 项目结构

- **Android 入口**：`android/app/src/main/java/com/rndemo/`
  - `MainApplication.kt`：Application 生命周期、`loadReactNative`
  - `MainActivity.kt`：Activity 生命周期、React 根组件名与 Delegate
- **JS 入口**：`index.js`（注册根组件）→ `App.tsx`（根组件挂载）
