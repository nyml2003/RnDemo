/**
 * @format
 * 启动流程日志：此处为 JS Bundle 入口，在 RN 加载完 Bundle 后执行
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('[JS] 7. index.js 执行：Bundle 已加载，准备注册根组件');

AppRegistry.registerComponent(appName, () => App);

console.log('[JS] 8. AppRegistry.registerComponent 完成，等待原生挂载并渲染');
