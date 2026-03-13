# JS/TSX 与 Android 真实视图层级对照

把 `App.tsx` 里 `ACTIVE_REGION` 设为 `'A'` / `'B'` / `'C'` / `'D'` 后分别运行，用 Layout Inspector 或 `uiautomator dump` 拿到对应区的原生 View 树，粘贴到下面「真实 Android 视图」的代码块里即可对照。

---

## 公共外层（各区共用）

当前入口渲染的是：`SafeAreaProvider` → `AppContent`（`View` + `ScrollView` + 若干子节点），再根据 `ACTIVE_REGION` 只渲染其中一个区块。

**JS 结构（公共部分）：**

```tsx
<SafeAreaProvider>
  <StatusBar />
  <AppContent>   {/* 即下面的 View + ScrollView + ... */}
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Fabric 调试用例aaaaa</Text>
        <Text style={styles.hint}>Layout Inspector → ...</Text>
        {/* 下面仅渲染 ACTIVE_REGION 对应的一块 */}
        {renderRegion()}
        <Text style={styles.footer}>对照 FABRIC_DEBUG_LEARNING.md...</Text>
      </ScrollView>
    </View>
  </AppContent>
</SafeAreaProvider>
```

**真实 Android 视图（从 ReactSurfaceView 往下，公共部分可只贴一次）：**

```
（此处粘贴：SafeAreaProvider / ReactScrollView 等公共节点的原生层级，可选）
```

---

## 区 A：可打平（5 层空 View）

**JS 结构：**

```tsx
<Text style={styles.regionLabel}>A. 可打平（5 层空 View）</Text>
<View style={styles.block}>
  <View>
    <View>
      <View>
        <View>
          <View style={styles.inner}>
            <Text>A：嵌套 5 层空 View</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
</View>
```

**真实 Android 视图：**

```
（此处粘贴 Layout Inspector / uiautomator 中区 A 对应的 View 层级）
```

**分析（为什么真实视图是这样）：**  
JS 里是 1 个带样式的 block View + 4 层「空」View（无 style、无事件、无 collapsable=false）+ 1 个带样式的 inner View + Text。Fabric 的视图打平会把「仅做布局、无绘制/无交互」的中间层合并掉，只保留有样式的节点和叶子（如 Text）。因此原生树里通常只会看到：对应 block 的 ReactViewGroup、对应 inner 的 ReactViewGroup、以及 ReactTextView，中间 4 层空 View 不会一一对应成 4 个原生 View，层级更扁、节点更少。

---

## 区 B：不可打平（中间层 collapsable=false）

**JS 结构：**

```tsx
<Text style={styles.regionLabel}>B. 不可打平（中间层 collapsable=false）</Text>
<View style={styles.block}>
  <View>
    <View collapsable={false}>
      <View>
        <View style={styles.inner}>
          <Text>B：中间一层 collapsable=false 1111</Text>
        </View>
      </View>
    </View>
  </View>
</View>
```

**真实 Android 视图：**

```
（此处粘贴区 B 对应的 View 层级）
```

**分析（为什么真实视图是这样）：**  
中间有一层显式写了 `collapsable={false}`，告诉 Fabric「这一层必须保留为独立原生 View」。打平算法会跳过这一节点，不把它和子节点合并，所以你在原生树里会多出一个 ReactViewGroup 对应这一层，整条链的深度比区 A 更深、节点更多。适合用来验证「显式不折叠」对层级的影响。

---

## 区 C：不可打平（带 onLayout）

**JS 结构：**

```tsx
<Text style={styles.regionLabel}>C. 不可打平（带 onLayout）</Text>
<View style={styles.block}>
  <View>
    <View onLayout={() => {}}>
      <View>
        <View style={styles.inner}>
          <Text>C：某一层有 onLayout</Text>
        </View>
      </View>
    </View>
  </View>
</View>
```

**真实 Android 视图：**

```
（此处粘贴区 C 对应的 View 层级）
```

**分析（为什么真实视图是这样）：**  
某一层挂了 `onLayout`，Fabric 需要把 layout 结果回传给 JS，就必须为这一层保留一个原生 View（以便拿到其 bounds 并回调）。因此该层不会被打平掉，原生树里会多出一个对应的 ReactViewGroup，层级比「同样结构但无 onLayout」的区 A/D 更深。这是「事件/回调导致不能折叠」的典型情况。

---

## 区 D：可打平（3 层空 View + 样式）

**JS 结构：**

```tsx
<Text style={styles.regionLabel}>D. 可打平（3 层空 View + 样式）</Text>
<View style={styles.block}>
  <View>
    <View>
      <View style={styles.inner}>
        <Text>D：3 层空 View</Text>
      </View>
    </View>
  </View>
</View>
```

**真实 Android 视图：**

```
（此处粘贴区 D 对应的 View 层级）
```

**分析（为什么真实视图是这样）：**  
结构是 1 个 block + 2 层空 View + 1 个 inner + Text，没有 collapsable=false、没有 onLayout。和区 A 一样，中间两层空 View 会被打平掉，原生树里只保留有样式的 block、inner 以及 Text，所以看起来和区 A 类似——层级少、节点少。和区 A 对比可以确认「空层数不同但都可打平时，最终原生结构都很扁」。

---

## 对照小结（填空用）

| 区 | 预期：打平后原生 View 层数 | 实际贴图/层级说明 |
|----|----------------------------|--------------------|
| A  | 少（block + inner + Text 等） |  |
| B  | 多（collapsable=false 那层保留） |  |
| C  | 多（onLayout 那层保留） |  |
| D  | 少（同 A） |  |
