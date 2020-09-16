import { h, withDirectives } from 'vue'
import type { ComputedRef, VNode } from 'vue'
import { ClickOutside } from '@element-plus/directives'

interface IRenderMaskProps {
  onHide: () => void
}

export default function renderMask(popper: VNode, { onHide }: IRenderMaskProps): VNode {
  return withDirectives(
    h('div', {
      class: 'el-popper__mask',
    }, popper),
    // marking excludes as any due to the current version of Vue's definition file
    // DOES NOT support types other than string as arguments
    [[ClickOutside, onHide]],
  )
}
