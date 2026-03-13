package com.rndemo

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    Log.d(TAG, "[Android] MainApplication.reactHost lazy 初始化")
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    Log.d(TAG, "[Android] 1. Application.onCreate() 开始")
    super.onCreate()
    Log.d(TAG, "[Android] 2. super.onCreate() 完成，准备 loadReactNative")
    loadReactNative(this)
    Log.d(TAG, "[Android] 3. loadReactNative() 完成，RN 运行时已加载")
  }

  companion object {
    private const val TAG = "RnDemoStartup"
  }
}
