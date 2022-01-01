import { inject, ref, computed, unref, provide, getCurrentInstance } from 'vue'
import { configProviderContextKey } from '@element-plus/tokens'
import { hasOwn, isObject, merge } from '@element-plus/utils/util'
import { debugWarn } from '@element-plus/utils/error'
import type { MaybeRef } from '@vueuse/core'
import type { Ref, App } from 'vue'
import type { ConfigProviderContext } from '@element-plus/tokens'

const fallback = ref<ConfigProviderContext>({})

export function useGlobalConfig<K extends keyof ConfigProviderContext>(
  key: K
): Ref<ConfigProviderContext[K]>
export function useGlobalConfig(): Ref<ConfigProviderContext>
export function useGlobalConfig(key?: keyof ConfigProviderContext) {
  const config = inject(configProviderContextKey, fallback)
  if (key) {
    return isObject(config.value) && hasOwn(config.value, key)
      ? computed(() => config.value[key])
      : ref(undefined)
  } else {
    return config
  }
}

export const provideGlobalConfig = (
  config: MaybeRef<ConfigProviderContext>,
  app?: App
) => {
  const inSetup = !!getCurrentInstance()
  const oldConfig = inSetup ? useGlobalConfig() : undefined

  const provideFn = app?.provide ?? (inSetup ? provide : undefined)
  if (!provideFn) {
    debugWarn(
      'provideGlobalConfig',
      'provideGlobalConfig() can only be used inside setup().'
    )
    return
  }

  const context = computed(() => {
    const cfg = unref(config)
    if (!oldConfig) return cfg
    return merge(oldConfig.value, cfg)
  })
  provideFn(configProviderContextKey, context)
  return context
}
