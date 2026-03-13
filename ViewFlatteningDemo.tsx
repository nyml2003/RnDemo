/**
 * 视图打平调试 Demo
 * 用 Android Layout Inspector 看「可打平」与「不可打平」两块的原生 View 数量差异
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function ViewFlatteningDemo() {
  return (
    <ScrollView style={styles.scroll}>
      <Text style={styles.title}>视图打平调试</Text>
      <Text style={styles.hint}>
        用 Layout Inspector 连接应用，看下面两块的 Component Tree 里 View 数量
      </Text>

      {/* 可打平：多层「空」View，无 style/无事件，Fabric 会合并成更少原生节点 */}
      <Text style={styles.sectionLabel}>A. 可打平（无 collapsable）</Text>
      <View style={styles.block}>
        <View>
          <View>
            <View>
              <View style={styles.inner}>
                <Text>嵌套 4 层 View，无 collapsable</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 不可打平：中间某一层 collapsable={false}，该层会保留在原生树里 */}
      <Text style={styles.sectionLabel}>B. 不可打平（中间层 collapsable=false）</Text>
      <View style={styles.block}>
        <View>
          <View collapsable={false}>
            <View>
              <View style={styles.inner}>
                <Text>中间一层 collapsable=false</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Layout Inspector → 选 RnDemo 进程 → 对比 A/B 两块的子 View 数量
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600', margin: 16 },
  hint: { fontSize: 12, color: '#666', marginHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '500', marginHorizontal: 16, marginTop: 8 },
  block: { margin: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
  inner: { padding: 8, backgroundColor: '#e0e0e0' },
  footer: { fontSize: 11, color: '#999', margin: 16 },
});
