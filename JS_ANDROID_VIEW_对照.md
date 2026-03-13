## RN 扁平化算法简要说明（为什么有的“该合并的没合并”）

- **谁会被合并**：只有 **Layout-Only** 节点才会被合并——即“只影响布局、不单独绘制内容”的节点，例如无 `backgroundColor`、无 `nativeID`、无事件、纯 `View` 且只有 margin/padding 等布局属性（或完全无样式）。
- **合并到哪**：算法会把 Layout-Only 节点的样式合并进**父节点**，从而少建一层宿主视图。但实现上是按**整棵子树**做 diff，连续多段 Layout-Only 可能先被合并成**一个**宿主视图，再视父/子是否为“非 Layout-Only”决定是否继续往上/下合并。
- **谁一定不合并**：下面任一成立则**保留**为独立原生节点，不参与合并：
  - `collapsable={false}`
  - 有 `onLayout`（需要真实节点才能回传 layout）
  - 有 `backgroundColor`、透明度 &lt; 1、无障碍、`nativeID`、触摸等“非纯布局”能力
- **为什么 A/D 里还多一层**：block 和 inner 都带了样式，属于“非 Layout-Only”；中间的若干空 View 是 Layout-Only，会被合并，但合并结果往往是**中间保留 1 个**宿主 View（即“打平后的中间层”），而不会把 block 和 inner 合成一个。也就是说：**不会把“有样式的父”和“有样式的子”之间的唯一一层也删掉**，否则父子关系会变成 block 直接包 inner，需要把中间所有布局信息合并到 block 或 inner 上，实现上通常选择保留这一层，所以你看到的是 3 层 ViewGroup + Text，而不是 2 层 ViewGroup + Text。

**合并顺序（谁合并谁、按什么顺序）：**

- **方向：子 → 父**  
  是**子节点被合并进父节点**，不是父合并进子。具体来说：当某个子节点是 Layout-Only（或整棵子树可被“提升”到父节点）时，渲染器会**不创建**该子节点对应的宿主视图，而是把该子节点的布局/样式信息**合并进父节点**，并把该子节点的子节点变成父节点的直接子节点（即“跳过”中间这一层）。

- **时机：在 diff 阶段、自底向上**  
  扁平化嵌在 Fabric 的 **diff 阶段**里做，不单独扫一遍树。处理顺序一般是**自底向上**（先处理叶子，再处理父节点）：这样在判断某一层要不要保留时，已经知道其子节点是否被合并过，从而能正确决定“当前节点 + 子节点”能否再一起被合并到更上层。

- **一句话**：**自底向上遍历，遇到 Layout-Only 的子就把它合并进父（父吸收子的样式和子节点列表），该子不建宿主视图。**

---

## 区 A：可打平（5 层空 View）

**JS 结构：**

```tsx
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

**真实 Android 视图：**（每行末尾标注对应 TSX）

```
                    com.facebook.react.views.scroll.ReactScrollView{89601c8 ...}   ← 外层 <ScrollView>
                      com.facebook.react.views.view.ReactViewGroup{519e261 ...}   ← <View style={styles.block}>
                        com.facebook.react.views.view.ReactViewGroup{7052186 ...} ← 打平后的中间层（原 4 层空 View 合并）
                        com.facebook.react.views.view.ReactViewGroup{10a4a47 ...} ← <View style={styles.inner}>
                        com.facebook.react.views.text.ReactTextView{ded7274 ...}   ← <Text>A：嵌套 5 层空 View</Text>
```

**分析（为什么真实视图是这样）：**  
React Native 的 **View 扁平化（View Flattening）** 会合并 Layout-Only 的中间层（见上文算法说明）。区 A 里 4 层空 `View` 无样式、无 `collapsable={false}` / `onLayout`，会被合并；但 block 和 inner 都带样式，算法在两者之间**仍保留 1 层**宿主 View（即“打平后的中间层”），不会把 block 和 inner 挤成直接父子，所以最终是 3 层 `ReactViewGroup` + 1 个 `ReactTextView`，而不是 2 层 + Text。

---

## 区 B：不可打平（中间层 collapsable=false）

**JS 结构：**

```tsx
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

**真实 Android 视图：**（每行末尾标注对应 TSX）

```
                    com.facebook.react.views.scroll.ReactScrollView{77c6fc3 ...}   ← 外层 <ScrollView>
                      com.facebook.react.views.view.ReactViewGroup{ddb3040 ...}   ← <View style={styles.block}>
                        com.facebook.react.views.view.ReactViewGroup{873b79 ...}   ← 空 <View>（可打平部分）
                        com.facebook.react.views.view.ReactViewGroup{64960be ...} ← <View collapsable={false}>
                          com.facebook.react.views.view.ReactViewGroup{9ac451f ...} ← <View style={styles.inner}>
                          com.facebook.react.views.text.ReactTextView{63106c ...}   ← <Text>B：中间一层...</Text>
```

**分析（为什么真实视图是这样）：**  
中间某一层显式设置了 **`collapsable={false}`**，等于告诉 RN：“这一层必须保留为真实原生节点”。扁平化算法会跳过该节点，不再把它和子节点合并。因此从 ScrollView 往下会多出一层 `ReactViewGroup`（对应那层 `collapsable={false}` 的 View），并且该层在布局上表现为独立的一层（例如 bounds 为 `0,0-933,96`，和兄弟 `ReactTextView` 并列）。所以真实视图比区 A 多一层，且该层在层级树里稳定存在，适合用来挂原生能力或做测量。

**为什么「空 View」和「collapsable={false} 那层」这两层没合并？**  
1. **不能合并成一层**：`collapsable={false}` 明确要求该节点单独保留，不能和任何节点“合成一个”，所以空 View 和 collapsable=false 不会变成同一个宿主视图。  
2. **空 View 为什么没被合并进 block？** 扁平化一般是把 Layout-Only 的**子**合并进**父**。这里父是带样式的 `block`（非 Layout-Only），不少实现里会选择不把 layout-only 子节点合并进“带样式的父”，以免影响父的布局/测量语义，于是这层空 View 仍保留为一个独立的宿主视图。所以你会看到 block 下先有一层空 View，再下一层才是 collapsable=false。

---

## 区 C：不可打平（带 onLayout）

**JS 结构：**

```tsx
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

**真实 Android 视图：**（每行末尾标注对应 TSX）

```
                    com.facebook.react.views.scroll.ReactScrollView{422caf6 ...}   ← 外层 <ScrollView>
                      com.facebook.react.views.view.ReactViewGroup{ceb8ef7 ...}   ← <View style={styles.block}>
                        com.facebook.react.views.view.ReactViewGroup{fe55164 ...} ← 空 <View>（打平）
                        com.facebook.react.views.view.ReactViewGroup{ac84fcd ...} ← <View onLayout={() => {}}>（保留）
                        com.facebook.react.views.text.ReactTextView{528a082 ...}   ← <Text>C：某一层有 onLayout</Text>
```

**分析（为什么真实视图是这样）：**  
某一层挂了 **`onLayout`** 回调，RN 需要在布局完成后把该 View 的尺寸、位置等信息回传给 JS。这就要求该节点在原生侧必须真实存在，否则无法拿到正确的 layout 数据并触发回调。因此带 `onLayout` 的那层 **不会被扁平化**，会保留为一个独立的 `ReactViewGroup`。对比区 A（全空、可打平），区 C 的真实视图会多出这一层；但若该层上下还有可合并的空 View，它们仍会被打平，所以最终层级数介于“全打平”和“全部保留”之间。

**为什么 onLayout 下面的「空 View + inner + Text」这三层在原生侧合并了？**  
扁平化是**自底向上**把子节点合并进父节点：  
1. **空 View**（onLayout 的直接子节点）无样式、无特殊 props，是 Layout-Only，被合并进父节点（带 onLayout 的那层），所以不再单独占一层。  
2. **inner**（`styles.inner` 有 padding、backgroundColor）本来不是“纯 Layout-Only”，但作为 onLayout 那层的**唯一有样式的子分支**，渲染器可以把它的样式（padding、backgroundColor 等）**提升到父节点**上，让带 onLayout 的那层宿主 View 直接带上这些样式，然后把 **Text 提成该层的直接子节点**。这样 onLayout 节点仍然存在（便于回传 layout），但下面不再为 empty 和 inner 各建一层，只保留一层宿主 View + Text。  
所以“这三层”在原生树里变成：**一个** ReactViewGroup（onLayout，且带上原 inner 的样式）+ 一个 ReactTextView。

---

## 区 D：可打平（3 层空 View + 样式）

**JS 结构：**

```tsx
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

**真实 Android 视图：**（每行末尾标注对应 TSX）

```
                    com.facebook.react.views.scroll.ReactScrollView{d7f02bf ...}   ← 外层 <ScrollView>
                      com.facebook.react.views.view.ReactViewGroup{a48d8c ...}   ← <View style={styles.block}>
                        com.facebook.react.views.view.ReactViewGroup{f791cd5 ...} ← 打平后的中间层（原 2 层空 View 合并）
                        com.facebook.react.views.view.ReactViewGroup{f185cea ...} ← <View style={styles.inner}>
                        com.facebook.react.views.text.ReactTextView{ab0bdb ...}   ← <Text>D：3 层空 View</Text>
```

**分析（为什么真实视图是这样）：**  
区 D 只有 2 层空 View（block → 空 → 空 → inner → Text），中间层都无样式、无 `collapsable={false}` / `onLayout`，满足 **可打平** 条件。与区 A 同理：中间空 View 被合并成 1 层，但 block 与 inner 之间仍保留这 1 层（见上文算法说明），所以真实视图仍是 3 层 `ReactViewGroup` + 1 个 `ReactTextView`，和区 A 一致。

---

## 对照小结（填空用）

| 区 | 预期：打平后原生 View 层数 | 实际贴图/层级说明 |
|----|----------------------------|--------------------|
| A  | 少（block + inner + Text 等） |  |
| B  | 多（collapsable=false 那层保留） |  |
| C  | 多（onLayout 那层保留） |  |
| D  | 少（同 A） |  |
