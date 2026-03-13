# 通过调试学习 Fabric — 实操指南

每个步骤都配有**可直接运行的 TSX 和日志**：在 `App.tsx` 里设 `USE_FABRIC_LEARNING_DEMO = true`，在 `FabricLearningDemo.tsx` 里把 `FABRIC_LEARNING_STEP` 改成对应数字（1~7）即可跑该步；也可按下面「本步代码」复制到自己的组件里用。

---

## 前置条件

- 已启用 New Architecture（Fabric）。
- 能跑 Android：`npx react-native run-android`。
- 可选：Android Studio（Layout Inspector、Logcat）、Chrome/Hermes 调试。

---

## 步骤 1：三棵树与渲染管线

**要学什么**：React Element Tree（JS）→ Shadow Tree（C++）→ Host View Tree（原生）；Render → Commit → Mount。

**调试目标**：在 JS 看到「一次渲染」时机；用 Layout Inspector 看到最终 Host View Tree。

### 本步代码（已写在 FabricLearningDemo Step 1）

```tsx
function Step1Demo() {
  useEffect(() => {
    console.log('[Fabric学习-1] React Render 已完成 → 即将生成 C++ Shadow Tree → Commit → Mount 成 Host View Tree');
    console.log('[Fabric学习-1] 现在打开 Layout Inspector，Component Tree 里看到的就是 Host View Tree');
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>步骤 1：三棵树</Text>
      <View><Text>这个 View 对应 Host View Tree 里的节点</Text></View>
    </View>
  );
}
```

### 要加的日志

| 位置 | 日志 |
|------|------|
| **JS** | 上面两行 `console.log` 即可，跑起来看 Metro 或 Chrome 控制台。 |
| **Android** | 无需必加；可选在 `MainApplication.onCreate` 里 `Log.d("Fabric", "onCreate")` 确认启动顺序。 |

### 操作

1. `USE_FABRIC_LEARNING_DEMO = true`，`FABRIC_LEARNING_STEP = 1`，运行 App。
2. 看终端/Metro 或 Chrome 控制台，应有两条 `[Fabric学习-1]` 日志。
3. 打开 **Layout Inspector**，选 RnDemo 进程，看 **Component Tree** = Host View Tree。

---

## 步骤 2：启动与惰性初始化

**要学什么**：宿主组件默认惰性初始化，减少启动时创建大量 View。

**调试目标**：看 Application 启动顺序，以及 `reactHost` 首次访问时才初始化。

### 本步代码（无额外 TSX，看原生即可）

Step 2 只是看 Android 日志，`FabricLearningDemo` 里有一屏说明。如需自己在 `MainApplication.kt` 加日志，可参考下面。

### 要加的日志（Android）

在 `MainApplication.kt` 里：

```kotlin
override fun onCreate() {
  Log.d("Fabric学习-2", "[Android] 1. Application.onCreate 开始")
  super.onCreate()
  Log.d("Fabric学习-2", "[Android] 2. 即将 loadReactNative")
  loadReactNative(this)
  Log.d("Fabric学习-2", "[Android] 3. loadReactNative 完成")
}

override val reactHost: ReactHost by lazy {
  Log.d("Fabric学习-2", "[Android] 4. reactHost 首次访问，惰性初始化")
  getDefaultReactHost(...)
}
```

### 操作

1. 加上面 Log，运行 App，Logcat 过滤 `Fabric学习-2`。
2. 确认顺序：1 → 2 → 3，然后当 RN 真正需要时才出现 4。

---

## 步骤 3：JSI（JS 与 C++ 直接通信）

**要学什么**：Fabric 下 JS 调原生走 JSI，不再 JSON 序列化过桥。

**调试目标**：在 JS 调一次原生方法，在 Android 对应实现里加 Log 看调用栈。

### 本步代码（已写在 FabricLearningDemo Step 3）

```tsx
import { NativeModules } from 'react-native';

function Step3Demo() {
  const handleCall = () => {
    console.log('[Fabric学习-3] JS 即将调用原生（走 JSI/TurboModule）');
    const constants = NativeModules.PlatformConstants?.getConstants?.() ?? {};
    console.log('[Fabric学习-3] 原生返回:', Object.keys(constants).slice(0, 5));
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>步骤 3：JSI</Text>
      <Pressable onPress={handleCall}><Text>点我调用原生 getConstants</Text></Pressable>
    </View>
  );
}
```

### 要加的日志

| 位置 | 说明 |
|------|------|
| **JS** | 上面 `console.log` 已有；点按钮后看控制台。 |
| **Android** | 在 `node_modules/react-native/ReactAndroid/...` 里找到 PlatformConstants 的 Android 实现（或任意你调用的 Native Module），在对应方法里加 `Log.d("Fabric学习-3", "native 被调用", Thread.currentThread().stackTraceToString())`，看调用栈里是否经过 JSI/JNI。 |

### 操作

1. `FABRIC_LEARNING_STEP = 3`，运行，点「点我调用原生 getConstants」。
2. 看 JS 控制台两条日志。
3. 在 Android 对应 Module 里加 Log，断点或 Log 看 JSI → JNI → Java 路径。

---

## 步骤 4：视图打平（View Flattening）

**要学什么**：Commit/diff 阶段合并「只做布局、无事件」的中间 View，减少原生层级。

**调试目标**：Layout Inspector 里 A/D 块原生节点少，B/C 块多。

### 本步代码（已写在 FabricLearningDemo Step 4）

```tsx
// A. 可打平：多层空 View
<View style={styles.block}>
  <View><View><View><View><View style={styles.inner}><Text>A</Text></View></View></View></View></View>
</View>

// B. 不可打平：中间一层 collapsable={false}
<View style={styles.block}>
  <View><View collapsable={false}><View><View style={styles.inner}><Text>B</Text></View></View></View></View>
</View>

// C. 不可打平：有 onLayout
<View style={styles.block}>
  <View><View onLayout={() => {}}><View style={styles.inner}><Text>C</Text></View></View></View>
</View>

// D. 可打平：3 层空 View
<View style={styles.block}>
  <View><View><View style={styles.inner}><Text>D</Text></View></View></View>
</View>
```

### 要加的日志

| 位置 | 说明 |
|------|------|
| **JS** | `console.log('[Fabric学习-4] A/D 可打平，B/C 不可打平；用 Layout Inspector 数各块子节点数');` 已在 Step 4 里。 |

### 操作

1. `FABRIC_LEARNING_STEP = 4`，运行，打开 Layout Inspector。
2. 找到 A、B、C、D 四块，分别数每块在 Component Tree 下的子节点数；A、D 少，B、C 多。

详见 [VIEW_FLATTENING_DEBUG.md](./VIEW_FLATTENING_DEBUG.md)。

---

## 步骤 5：同步布局与测量

**要学什么**：Fabric 支持在原生侧同步做 measure，嵌 RN 到原生容器时可避免布局跳动。

**调试目标**：在 JS 里调 `ref.measure()`，看回调里拿到的尺寸；理解「可同步」的含义。

### 本步代码（已写在 FabricLearningDemo Step 5）

```tsx
const ref = useRef<View>(null);

const handleMeasure = () => {
  ref.current?.measure((x, y, w, h) => {
    console.log('[Fabric学习-5] measure 回调:', { x, y, width: w, height: h });
  });
};

return (
  <View>
    <View ref={ref} style={{ padding: 12, backgroundColor: '#f0f0f0' }} collapsable={false}>
      <Text>被测量的 View</Text>
    </View>
    <Pressable onPress={handleMeasure}><Text>measure 这个 View</Text></Pressable>
  </View>
);
```

### 要加的日志

| 位置 | 说明 |
|------|------|
| **JS** | 上面 `console.log` 即可；点按钮后看控制台输出的 x,y,width,height。 |

### 操作

1. `FABRIC_LEARNING_STEP = 5`，运行，点「measure 这个 View」。
2. 看控制台打印的布局值；可选在原生 `measure` 实现里断点看是否同步返回。

---

## 步骤 6：Codegen 与类型安全

**要学什么**：Codegen 用 JS 声明生成 C++/原生 props，类型不一致会编译报错。

**调试目标**：找到生成目录，打开一个 Spec/ViewConfig 看 props 如何从 JS 到 C++。

### 本步代码（无运行时 TSX，只看文件）

Step 6 在 Demo 里是一屏说明 + 路径。没有需要复制到业务里的 TSX。

### 要看的路径

- `android/app/build/generated/source/codegen/`（构建后才有）
- `node_modules/react-native/Libraries/ReactNative/ReactNativeViewConfigProvider.js`
- `node_modules/react-native/ReactAndroid/.../viewmanagers/` 下生成的 ViewManager

### 操作

1. 先 `npm run android` 或 `yarn android` 构建一次。
2. 打开上面路径里任意 `*Spec` 或 ViewConfig 文件，看 props 结构。
3. 可选：改错一个 prop 类型，重新构建看是否报错。

---

## 步骤 7：并发渲染（useTransition）

**要学什么**：React 18 + Fabric 可在后台准备新 Shadow Tree，再挂载，不阻塞交互。

**调试目标**：用 `useTransition` 触发一次更新，观察 UI 先保持可操作，再看到数字变化。

### 本步代码（已写在 FabricLearningDemo Step 7）

```tsx
const [count, setCount] = useState(0);
const [isPending, startTransition] = useTransition();

const handleSlowUpdate = () => {
  console.log('[Fabric学习-7] startTransition 触发');
  startTransition(() => {
    setCount((c) => c + 1);
  });
};

return (
  <View style={{ padding: 16 }}>
    <Text style={{ fontSize: 48 }}>{count}</Text>
    <Pressable onPress={handleSlowUpdate}><Text>startTransition 增加</Text></Pressable>
    {isPending && <Text>更新中…</Text>}
  </View>
);
```

### 要加的日志

| 位置 | 说明 |
|------|------|
| **JS** | 上面 `console.log` 已有；点按钮后看「更新中」与数字变化的先后。 |

### 操作

1. `FABRIC_LEARNING_STEP = 7`，运行，多点几次「startTransition 增加」。
2. 观察：是否先出现「更新中」或先能继续点击，再看到数字变。

---

## 怎么用这份文档

**方式一（推荐）**：不复制代码，直接跑 Demo。

1. 在 `App.tsx` 里设 `USE_FABRIC_LEARNING_DEMO = true`。
2. 在 `FabricLearningDemo.tsx` 里设 `FABRIC_LEARNING_STEP = 1`，运行，做步骤 1 的操作。
3. 再改成 2、3…7，按文档每步做一遍。

**方式二**：把某一步的「本步代码」复制到自己新建的组件里，按「要加的日志」在 JS/Android 加上，然后按「操作」验证。

---

## 检查清单

- [ ] 步骤 1：看到 Render 日志 + Layout Inspector 里看到 Host View Tree。
- [ ] 步骤 2：Logcat 里看到 onCreate → loadReactNative → reactHost 惰性初始化顺序。
- [ ] 步骤 3：点按钮调原生，JS 有日志；Android 加 Log 看到 JSI 调用栈。
- [ ] 步骤 4：Layout Inspector 里 A/D 节点少、B/C 多。
- [ ] 步骤 5：点 measure 按钮，控制台有布局值。
- [ ] 步骤 6：打开 codegen 生成目录下的文件看过一遍。
- [ ] 步骤 7：useTransition 点击后先可交互再看到数字更新。

---

## 本仓库相关文件

| 文件 | 用途 |
|------|------|
| [FabricLearningDemo.tsx](./FabricLearningDemo.tsx) | 步骤 1~7 的完整示例与日志，改 `FABRIC_LEARNING_STEP` 切换。 |
| [App.tsx](./App.tsx) | `USE_FABRIC_LEARNING_DEMO` 为 true 时进入学习 Demo。 |
| [VIEW_FLATTENING_DEBUG.md](./VIEW_FLATTENING_DEBUG.md) | 视图打平专项说明。 |
| `android/.../MainApplication.kt` | 步骤 2 的 Log 加在这里。 |

---

## 延伸阅读

- [Fabric · React Native](https://reactnative.dev/architecture/fabric-renderer)
- [Render, Commit, and Mount](https://reactnative.dev/docs/next/render-pipeline)
- [Architecture Glossary](https://reactnative.dev/architecture/glossary)
