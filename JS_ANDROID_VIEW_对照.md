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

**真实 Android 视图：**

```
                    com.facebook.react.views.scroll.ReactScrollView{89601c8 VFED.V... ........ 0,0-1080,2400 #80}
                      com.facebook.react.views.view.ReactViewGroup{519e261 V.E...... ........ 0,0-1080,306 #7e}
                        com.facebook.react.views.view.ReactViewGroup{7052186 V.E...... ........ 42,42-1038,201 #7c}
                        com.facebook.react.views.view.ReactViewGroup{10a4a47 V.E...... ........ 74,74-1007,170 #72}
                        com.facebook.react.views.text.ReactTextView{ded7274 V.ED..... ........ 95,95-986,149 #70}
```

**分析（为什么真实视图是这样）：**  

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

**真实 Android 视图：**

```
                    com.facebook.react.views.scroll.ReactScrollView{77c6fc3 VFED.V... ........ 0,0-1080,2400 #94}
                      com.facebook.react.views.view.ReactViewGroup{ddb3040 V.E...... ........ 0,0-1080,306 #92}
                        com.facebook.react.views.view.ReactViewGroup{873b79 V.E...... ........ 42,42-1038,201 #90}
                        com.facebook.react.views.view.ReactViewGroup{64960be V.E...... ........ 74,74-1007,170 #8c}
                          com.facebook.react.views.view.ReactViewGroup{9ac451f V.E...... ........ 0,0-933,96 #88}
                          com.facebook.react.views.text.ReactTextView{63106c V.ED..... ........ 21,21-912,75 #86}
```

**分析（为什么真实视图是这样）：**  

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

**真实 Android 视图：**

```
                    com.facebook.react.views.scroll.ReactScrollView{422caf6 VFED.V... ........ 0,0-1080,2400 #a8}
                      com.facebook.react.views.view.ReactViewGroup{ceb8ef7 V.E...... ........ 0,0-1080,306 #a6}
                        com.facebook.react.views.view.ReactViewGroup{fe55164 V.E...... ........ 42,42-1038,201 #a4}
                        com.facebook.react.views.view.ReactViewGroup{ac84fcd V.E...... ........ 74,74-1007,170 #9c}
                        com.facebook.react.views.text.ReactTextView{528a082 V.ED..... ........ 95,95-986,149 #9a}
```

**分析（为什么真实视图是这样）：**  


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

**真实 Android 视图：**

```
                    com.facebook.react.views.scroll.ReactScrollView{d7f02bf VFED.V... ........ 0,0-1080,2400 #ba}
                      com.facebook.react.views.view.ReactViewGroup{a48d8c V.E...... ........ 0,0-1080,306 #b8}
                        com.facebook.react.views.view.ReactViewGroup{f791cd5 V.E...... ........ 42,42-1038,201 #b6}
                        com.facebook.react.views.view.ReactViewGroup{f185cea V.E...... ........ 74,74-1007,170 #b0}
                        com.facebook.react.views.text.ReactTextView{ab0bdb V.ED..... ........ 95,95-986,149 #ae}
```

**分析（为什么真实视图是这样）：**  


---

## 对照小结（填空用）

| 区 | 预期：打平后原生 View 层数 | 实际贴图/层级说明 |
|----|----------------------------|--------------------|
| A  | 少（block + inner + Text 等） |  |
| B  | 多（collapsable=false 那层保留） |  |
| C  | 多（onLayout 那层保留） |  |
| D  | 少（同 A） |  |
