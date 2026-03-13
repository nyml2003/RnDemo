/**
 * Fabric 学习 Demo：配合 FABRIC_DEBUG_LEARNING.md 使用。
 * 在 App.tsx 里设置 FABRIC_LEARNING_STEP = 1~7 切换每一步的示例与日志。
 */
import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  NativeModules,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const FABRIC_LEARNING_STEP = 1; // 改成 1~7 对应文档中的步骤

// ========== Step 1: 三棵树与渲染管线 ==========
function Step1ThreeTrees() {
  useEffect(() => {
    console.log('[Fabric学习-1] React Render 已完成 → 即将生成 C++ Shadow Tree → Commit → Mount 成 Host View Tree');
    console.log('[Fabric学习-1] 现在打开 Layout Inspector，Component Tree 里看到的就是 Host View Tree');
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 1：三棵树与渲染管线</Text>
      <Text style={styles.hint}>看 Metro/终端或 Chrome 控制台，应有上面两条日志</Text>
      <View style={styles.block}>
        <View>
          <Text style={styles.inner}>这个 View 对应 Host View Tree 里的节点</Text>
        </View>
      </View>
      <Text style={styles.action}>→ 打开 Layout Inspector，选 RnDemo 进程，看 Component Tree</Text>
    </View>
  );
}

// ========== Step 2: 启动与惰性初始化 ==========
function Step2LazyInit() {
  useEffect(() => {
    console.log('[Fabric学习-2] 本屏已挂载。惰性初始化发生在原生侧：看 Logcat 里 MainApplication / reactHost 的打印顺序');
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 2：启动与惰性初始化</Text>
      <Text style={styles.hint}>没有额外 JS 代码要跑，看 Android 日志即可</Text>
      <Text style={styles.code}>Logcat 过滤：RnDemoStartup 或 MainApplication</Text>
      <Text style={styles.action}>→ 确认：onCreate → loadReactNative → reactHost 首次访问时才初始化</Text>
    </View>
  );
}

// ========== Step 3: JSI ==========
function Step3JSI() {
  const handleCallNative = useCallback(() => {
    console.log('[Fabric学习-3] JS 即将调用原生（走 JSI/TurboModule）');
    try {
      const constants = NativeModules.PlatformConstants?.getConstants?.() ?? {};
      console.log('[Fabric学习-3] 原生返回:', Object.keys(constants).slice(0, 5));
    } catch (e) {
      console.log('[Fabric学习-3] 调用结果:', (e as Error).message);
    }
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 3：JSI（JS → 原生）</Text>
      <Text style={styles.hint}>点下面按钮会从 JS 调原生，看控制台日志；在 Android 对应 Module 里加 Log.d 可看调用栈</Text>
      <Pressable style={styles.buttonWrap} onPress={handleCallNative}>
        <Text style={styles.button}>点我调用原生 getConstants</Text>
      </Pressable>
      <Text style={styles.action}>→ 在 node_modules/react-native 搜 PlatformConstants，Android 实现里加 Log.d 观察 JSI 调用</Text>
    </View>
  );
}

// ========== Step 4: 视图打平 ==========
function Step4ViewFlattening() {
  useEffect(() => {
    console.log('[Fabric学习-4] 下面 A/D 可打平（原生节点少），B/C 不可打平（多）。用 Layout Inspector 数各块子节点数');
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 4：视图打平</Text>
      <Text style={styles.hint}>Layout Inspector 里对比四块：A/D 子树节点少，B/C 多</Text>

      <Text style={styles.regionLabel}>A. 可打平（5 层空 View）</Text>
      <View style={styles.block}>
        <View><View><View><View><View style={styles.inner}><Text>A</Text></View></View></View></View></View>
      </View>

      <Text style={styles.regionLabel}>B. 不可打平（collapsable=false）</Text>
      <View style={styles.block}>
        <View><View collapsable={false}><View><View style={styles.inner}><Text>B</Text></View></View></View></View>
      </View>

      <Text style={styles.regionLabel}>C. 不可打平（onLayout）</Text>
      <View style={styles.block}>
        <View><View onLayout={() => {}}><View style={styles.inner}><Text>C</Text></View></View></View>
      </View>

      <Text style={styles.regionLabel}>D. 可打平（3 层空 View）</Text>
      <View style={styles.block}>
        <View><View><View style={styles.inner}><Text>D</Text></View></View></View>
      </View>
    </View>
  );
}

// ========== Step 5: 同步布局与测量 ==========
function Step5SyncLayout() {
  const ref = useRef<View>(null);

  const handleMeasure = useCallback(() => {
    if (ref.current == null) return;
    ref.current.measure((x, y, w, h) => {
      console.log('[Fabric学习-5] measure 回调（Fabric 下可为同步）:', { x, y, width: w, height: h });
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 5：同步布局与测量</Text>
      <Text style={styles.hint}>点按钮触发 measure，看控制台；Fabric 下可在 UI 线程同步拿到结果</Text>
      <View ref={ref} style={[styles.block, styles.measureBlock]} collapsable={false}>
        <Text>被测量的 View</Text>
      </View>
      <Pressable style={styles.buttonWrap} onPress={handleMeasure}>
        <Text style={styles.button}>measure 这个 View</Text>
      </Pressable>
      <Text style={styles.action}>→ 断点打在 measure 的 native 实现可看是否同步</Text>
    </View>
  );
}

// ========== Step 6: Codegen ==========
function Step6Codegen() {
  useEffect(() => {
    console.log('[Fabric学习-6] Codegen 无运行时 Demo，请按文档找生成目录：android/app/build/generated 或 node_modules 下 -generated');
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 6：Codegen 与类型安全</Text>
      <Text style={styles.hint}>到工程里找生成代码即可，无需本屏交互</Text>
      <Text style={styles.code}>android/app/build/generated/source/codegen{'\n'}node_modules/react-native/Libraries/ReactNative/ReactNativeViewConfigProvider.js</Text>
      <Text style={styles.action}>→ 打开任意 *Spec 或 ViewConfig 看 props 如何从 JS 到 C++</Text>
    </View>
  );
}

// ========== Step 7: 并发渲染 ==========
function Step7Concurrent() {
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleSlowUpdate = useCallback(() => {
    console.log('[Fabric学习-7] startTransition 触发，React 可能推迟更新');
    startTransition(() => {
      for (let i = 0; i < 3; i++) {
        setCount((c) => c + 1);
      }
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>步骤 7：并发渲染（useTransition）</Text>
      <Text style={styles.hint}>点按钮用 startTransition 更新状态，UI 保持可交互</Text>
      <Text style={styles.bigText}>{count}</Text>
      <Pressable style={styles.buttonWrap} onPress={handleSlowUpdate}>
        <Text style={styles.button}>startTransition 增加</Text>
      </Pressable>
      {isPending && <Text style={styles.pending}>更新中…</Text>}
      <Text style={styles.action}>→ 观察：点击后先能继续操作，再看到数字变</Text>
    </View>
  );
}

// ========== 入口 ==========
export function FabricLearningDemo() {
  const step = FABRIC_LEARNING_STEP;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>Fabric 学习 Demo · 步骤 {step}</Text>
      {step === 1 && <Step1ThreeTrees />}
      {step === 2 && <Step2LazyInit />}
      {step === 3 && <Step3JSI />}
      {step === 4 && <Step4ViewFlattening />}
      {step === 5 && <Step5SyncLayout />}
      {step === 6 && <Step6Codegen />}
      {step === 7 && <Step7Concurrent />}
      {step < 1 || step > 7 ? (
        <Text style={styles.hint}>把本文件顶部 FABRIC_LEARNING_STEP 改为 1~7</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  pageTitle: { fontSize: 18, fontWeight: '600', margin: 16 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  hint: { fontSize: 12, color: '#666', marginBottom: 12 },
  code: { fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: 8, marginBottom: 8 },
  regionLabel: { fontSize: 14, fontWeight: '500', marginTop: 12, marginBottom: 4 },
  block: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 },
  measureBlock: { minHeight: 60 },
  inner: { padding: 8, backgroundColor: '#e0e0e0' },
  buttonWrap: { padding: 12, marginVertical: 8 },
  button: { fontSize: 14, color: '#0066cc' },
  action: { fontSize: 11, color: '#999', marginTop: 8 },
  bigText: { fontSize: 48, marginVertical: 16 },
  pending: { color: '#666', marginTop: 8 },
});
