import { defineComponent, h } from 'vue'
import { Popper as ElPopper } from '@element-plus/popper'
import { UPDATE_MODEL_EVENT } from '@element-plus/utils/constants'
import throwError from '@element-plus/utils/error'

import type { PropType } from 'vue'
import type {
  Effect,
  Placement,
  Options,
} from '@element-plus/popper/src/popper'

/**
 * ElTooltip
 * Tooltip is essentially an upper layer for Popper, due to popper has already implemented so many functionalities and Popper is essentially a component shared internally
 * Tooltip also does the API translation work for popper.
 * Tooltip shares the exact same API which v2 has, so that the user should be able to
 */
export default defineComponent({
  name: 'ElTooltip',
  components: {
    ElPopper,
  },
  props: {
    effect: {
      type: String as PropType<Effect>,
      default: 'dark' as Effect,
    },
    class: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    enterable: {
      type: Boolean,
      default: true,
    },
    hideAfter: {
      type: Number,
      default: 0,
    },
    manual: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Boolean,
      validator: val => typeof val === 'boolean',
      default: undefined,
    },
    offset: {
      type: Number,
      default: 12,
    },
    // This API should be decaprecate since it's confusing with close-delay
    openDelay: {
      type: Number,
      default: 0,
    },
    placement: {
      type: String as PropType<Placement>,
      default: 'bottom' as Placement,
    },
    // Once this option were given, the entire popper is under the users' control, top priority
    popperOptions: {
      type: Object as PropType<Options>,
      default: () => null,
    },
    // Alias for open-delay, which controls the popper's appearing time
    showAfter: {
      type: Number,
      default: 0,
    },
    tabindex: {
      type: [Number, String],
      default: 0,
    },
    transition: {
      type: String,
      default: 'el-fade-in-linear',
    },
    trigger: {
      type: [String, Array] as PropType<string | string[]>,
      default: () => ['hover'],
    },
    visibleArrow: {
      type: Boolean,
      default: true,
    },
  },
  emits: [UPDATE_MODEL_EVENT],
  setup(props, ctx) {
    // init here

    // when manual mode is true, v-model must be passed down
    if (props.manual && typeof props.modelValue === 'undefined') {
      throwError('[ElTooltip]', 'You need to pass a v-model to el-tooltip when `manual` is true')
    }

    const onUpdateVisible = val => {
      ctx.emit(UPDATE_MODEL_EVENT, val)
    }

    return {
      onUpdateVisible,
    }
  },
  render() {
    const {
      $slots,
      content,
      disabled,
      effect,
      enterable,
      hideAfter,
      manual,
      offset,
      openDelay,
      onUpdateVisible,
      placement,
      popperOptions,
      showAfter,
      tabindex,
      transition,
      trigger,
      visibleArrow,
    } = this
    const popper = h(
      ElPopper,
      {
        class: this.class,
        disabled,
        effect,
        enterable,
        hideAfter,
        manualMode: manual,
        offset,
        placement,
        showAfter: openDelay || showAfter, // this is for mapping API due to we decided to rename the current openDelay API to showAfter for better readability,
        showArrow: visibleArrow,
        tabIndex: String(tabindex),
        transition,
        trigger,
        popperOptions, // Breakings!: Once popperOptions is provided, the whole popper is under user's control, ElPopper nolonger generates the default options for popper, this is by design if the user wants the full contorl on @PopperJS, read the doc @https://popper.js.org/docs/v2/
        visible: this.modelValue,
        'onUpdate:visible': onUpdateVisible,
      },
      {
        default: () => ($slots.content ? $slots.content() : content),
        trigger: () => $slots.default(),
      },
    )
    return popper
  },
})
