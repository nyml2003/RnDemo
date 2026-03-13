/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * 启动流程日志：根组件挂载与首屏渲染
 */

import { useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FabricLearningDemo } from './FabricLearningDemo';
import { ViewFlatteningDemo } from './ViewFlatteningDemo';


// 改为 true 进入「Fabric 学习 Demo」：在 FabricLearningDemo.tsx 里改 FABRIC_LEARNING_STEP = 1~7 切换步骤
const USE_FABRIC_LEARNING_DEMO = false;
// 改为 true 进入「共享 ViewFlattening Demo」：RnDemo / RnDemoV2 均可共用，用于跨版本对比组件树
const USE_SHARED_FLATTENING_DEMO = false;
// 改为 true 可调试「视图打平」：用 Layout Inspector 看原生 View 层级
const SHOW_FLATTENING_DEMO = false;
type FlatteningRegion = 'A' | 'B' | 'C' | 'D';

// 只改这里：一次只展示一个实验区。
const ACTIVE_REGION: FlatteningRegion = 'C';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    console.log('[JS] 9. App 根组件已挂载，首屏即将渲染');
    return () => console.log('[JS] App 根组件卸载');
  }, []);

  if (USE_FABRIC_LEARNING_DEMO) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <FabricLearningDemo />
      </SafeAreaProvider>
    );
  }
  if (USE_SHARED_FLATTENING_DEMO) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      </SafeAreaProvider>
    );
  }
  if (SHOW_FLATTENING_DEMO) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ViewFlatteningDemo />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

/**
 * Fabric 调试用布局：结构稍复杂，便于配合 FABRIC_DEBUG_LEARNING.md 操作。
 * 用 Layout Inspector 连接后，在 Component Tree 里对比各区的原生 View 数量。
 */
function AppContent() {
  const renderRegion = () => {
    if (ACTIVE_REGION === 'A') {
      return (
        <>
          {/* 区 A：可打平 — 多层「空」View，无 style/无事件，Fabric 会合并 */}
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
        </>
      );
    }

    if (ACTIVE_REGION === 'B') {
      return (
        <>
          {/* 区 B：不可打平 — 中间一层 collapsable={false}，该层会保留 */}
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
        </>
      );
    }

    if (ACTIVE_REGION === 'C') {
      return (
        <>
          {/* 区 C：不可打平 — 有 onLayout，该 View 会保留 */}
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
        </>
      );
    }

    return (
      <>
        {/* 区 D：可打平 — 只有样式无事件，同 A */}
        <View style={styles.block}>
          <View>
            <View>
              <View style={styles.inner}>
                <Text>D：3 层空 View</Text>
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderRegion()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  pageTitle: { fontSize: 18, fontWeight: '600', margin: 16 },
  hint: { fontSize: 12, color: '#666', marginHorizontal: 16, marginBottom: 12 },
  regionLabel: { fontSize: 14, fontWeight: '500', marginHorizontal: 16, marginTop: 16 },
  block: { margin: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
  inner: { padding: 8, backgroundColor: '#e0e0e0' },
  footer: { fontSize: 11, color: '#999', margin: 16 },
});

export default App;
