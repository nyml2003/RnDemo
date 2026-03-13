package com.rndemo

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    Log.d(TAG, "[Android] 4. MainActivity.onCreate() 开始")
    super.onCreate(savedInstanceState)
    Log.d(TAG, "[Android] 5. MainActivity.onCreate() 完成，ReactRootView 已挂载")
  }

  override fun onResume() {
    Log.d(TAG, "[Android] 6. MainActivity.onResume()")
    super.onResume()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String {
    Log.d(TAG, "[Android] getMainComponentName() => RnDemo")
    return "RnDemo"
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    Log.d(TAG, "[Android] createReactActivityDelegate() 创建 React 代理")
    return DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
  }

  companion object {
    private const val TAG = "RnDemoStartup"
  }
}
