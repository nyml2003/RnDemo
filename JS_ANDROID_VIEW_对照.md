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
React Native 的 **View 扁平化（View Flattening）** 会合并“无实际作用”的中间层。区 A 里 5 层嵌套的 `View` 既没有 `style`、也没有 `collapsable={false}` 或 `onLayout`，对布局/测量没有影响，因此被当作可折叠节点。打平后只保留“有样式”的容器：最外层 `styles.block` 对应一个 `ReactViewGroup`，内层 `styles.inner` 再对应一层，中间 4 层空 View 被合并，最终只剩 3 层 `ReactViewGroup` + 1 个 `ReactTextView`。这样层级更少，测量和绘制更省。

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
区 D 只有 3 层空 View（block → 两个空 View → inner → Text），且中间层都没有 `collapsable={false}` 或 `onLayout`，因此同样满足 **可打平** 条件。扁平化后与区 A 类似：只保留“有样式”的 block 和 inner 对应的原生 View，中间 2 层空 View 被合并，真实 Android 视图仍是 3 层 `ReactViewGroup` + 1 个 `ReactTextView`。层数比区 A 少是因为 JS 侧本身嵌套就少，打平规则一致，所以最终原生层级与区 A 相同。

---

## 对照小结（填空用）

| 区 | 预期：打平后原生 View 层数 | 实际贴图/层级说明 |
|----|----------------------------|--------------------|
| A  | 少（block + inner + Text 等） |  |
| B  | 多（collapsable=false 那层保留） |  |
| C  | 多（onLayout 那层保留） |  |
| D  | 少（同 A） |  |
