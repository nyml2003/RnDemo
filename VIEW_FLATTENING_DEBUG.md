# RN 视图打平（View Flattening）调试指南

视图打平是 Fabric 的优化：把「只起包裹作用、无样式/无事件」的中间 `View` 从**原生视图树**里去掉，减少层级、提升性能。  
调试目标：看**最终原生层有多少个 View**，对比「可打平」和「不可打平」的写法。

---

## Fabric 原理简要（想学 Fabric 可从这里入手）

**Fabric** 是 React Native 的**新渲染架构**（New Architecture），核心在 C++，和旧架构（Paper）的主要区别包括：

| 概念 | 说明 |
|------|------|
| **C++ 渲染核心** | 布局、打平等逻辑在 C++ 里统一实现，iOS/Android 共用，行为一致。 |
| **JSI（JavaScript Interface）** | JS 和原生直接通过 JSI 访问对象，不再用 JSON 序列化，通信更高效。 |
| **视图打平** | 在 **diff 阶段**就做：把「仅影响布局、无可见内容」的节点合并，样式上提到父节点，少建原生 View。 |
| **同步布局** | 可以同步测量、渲染，嵌入到原生容器时避免布局「跳动」。 |

视图打平是 Fabric 自带的优化：算法在渲染器的 **diff** 阶段执行，不额外跑一遍；只做布局的 View（如只有 margin/padding/backgroundColor/opacity）会被合并，子节点样式合并到父节点，从而减少宿主视图层级。

**学习资源（建议顺序）：**

1. **官方架构总览**  
   [Fabric · React Native](https://reactnative.dev/architecture/fabric-renderer) — 动机、收益、渲染管线概览（无代码）。

2. **视图打平专项**  
   [View Flattening · React Native](https://react-native.netlify.app/architecture/view-flattening) — 打平规则与示例。

3. **Fabric 深挖（讨论 + 源码）**  
   [Fabric Deep Dive · reactwg/react-native-new-architecture](https://github.com/reactwg/react-native-new-architecture/discussions/1) — 社区讨论，配合 RN 源码看 C++ 实现。

4. **源码里看打平**  
   在 `node_modules/react-native` 中可搜：  
   - **C++/Fabric**：`ReactAndroid/src/main/jni/react/fabric/`、`ReactCommon/react/renderer/` 下的 `view`、`core` 等，搜索 `flatten`、`collapsable` 相关逻辑。  
   - **JS 层**：`Libraries/Components/View/ViewPropTypes` 里的 `collapsable`、`collapsableChildren` 定义。

5. **新架构「坑」与注意点**  
   [React Native's New Architecture: The Tricky Parts | Software Mansion](https://blog.swmansion.com/react-natives-new-architecture-the-tricky-parts-1-2-bb0c16950f2d) — 实际开发中的差异和注意点。

---

## 方法一：Android Layout Inspector（看真实原生层级）

1. 用 Android Studio 打开项目：`RnDemo/android`
2. 运行应用：`npx react-native run-android`
3. 菜单 **View → Tool Windows → App Inspection**，或 **Tools → Layout Inspector**
4. 选择当前运行中的 **RnDemo** 进程，点 **Live** 或拍一张快照
5. 在 **Component Tree** 里看的是**原生 Android View 层级**（不是 React 组件树）
   - 打平成功：中间很多 `ReactViewGroup` 会消失，只剩真正有样式的节点
   - 打平被禁用：会看到一层层 `ReactViewGroup` 和 React 组件一一对应

**对比方式**：在 App 里切「可打平」和「不可打平」两种 demo（见下），分别打开 Layout Inspector，数一数根下面同一区域的 View 数量，数量少的那边就是打平生效了。

---

## 方法二：用 `collapsable={false}` 做对比

- 默认：只起包裹作用的 `View` 会被打平（不生成原生 View）
- 给某个 `View` 加上 **`collapsable={false}`**：强制保留这一层，不打平

所以可以：
- **A 区域**：多写几层「空」View（无 style、无 onTouch 等），跑一遍，用 Layout Inspector 看原生节点数
- **B 区域**：同样的结构，但在某一层加 `collapsable={false}`，再跑一遍，看原生节点数是否变多

这样就能直观看到「打平」在原生侧的效果。

---

## 方法三：什么会阻止打平（心里有数即可）

下面这些会让该 View **不能**被打平，从而在 Layout Inspector 里多出一层：

- 设置了 `collapsable={false}` 或 `collapsableChildren={false}`
- 有事件：`onTouchStart` / `onTouchEnd` / `onLayout` 等
- 有 `overflow: 'visible'`（Android 上）
- 某些无障碍 / 原生相关属性

调试时可以有意识地加/减这些属性，再看 Layout Inspector 里层级变化。

---

## 本仓库的 Demo 用法

`App.tsx` 里通过 `SHOW_FLATTENING_DEMO` 可以切到「视图打平对比」页：

- **上半部分**：多层「空」View，可被打平，原生 View 少
- **下半部分**：同样结构但加了 `collapsable={false}`，原生 View 多

用 Layout Inspector 分别看上下两块的原生子树，就能验证打平效果。

---

## 延伸：通过调试系统学 Fabric

若想**把 Fabric 的主要内容（三棵树、管线、JSI、打平、Codegen、同步布局、并发等）都通过调试过一遍**，可参见 **[FABRIC_DEBUG_LEARNING.md](./FABRIC_DEBUG_LEARNING.md)**，里面有按概念拆分的「调试目标 + 具体步骤 + 源码位置」。
