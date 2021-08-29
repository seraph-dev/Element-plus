import {
  computed,
  watch,
  ref,
  reactive,
  nextTick,
  inject,
  onMounted,
  onBeforeMount,
} from 'vue'
import {
  isArray,
  isFunction,
  isObject,
} from '@vue/shared'
import isEqual from 'lodash/isEqual'
import lodashDebounce from 'lodash/debounce'
import { elFormKey, elFormItemKey } from '@element-plus/tokens'
import { useLocaleInject } from '@element-plus/hooks'
import { UPDATE_MODEL_EVENT, CHANGE_EVENT } from '@element-plus/utils/constants'
import { addResizeListener, removeResizeListener } from '@element-plus/utils/resize-event'
import {
  getValueByPath,
  useGlobalConfig,
} from '@element-plus/utils/util'

import { useAllowCreate } from './useAllowCreate'

import { SelectProps } from './defaults'
import { flattenOptions } from './util'


import type { ExtractPropTypes, CSSProperties } from 'vue'
import type { ElFormContext, ElFormItemContext } from '@element-plus/tokens'
import type { OptionType, Option } from './select.types'
import { useInput } from './useInput'

const DEFAULT_INPUT_PLACEHOLDER = ''
const MINIMUM_INPUT_WIDTH = 11

const useSelect = (props: ExtractPropTypes<typeof SelectProps>, emit) => {

  // inject
  const { t } = useLocaleInject()
  const elForm = inject(elFormKey, {} as ElFormContext)
  const elFormItem = inject(elFormItemKey, {} as ElFormItemContext)
  const $ELEMENT = useGlobalConfig()

  const states = reactive({
    inputValue: DEFAULT_INPUT_PLACEHOLDER,
    displayInputValue: DEFAULT_INPUT_PLACEHOLDER,
    calculatedWidth: 0,
    cachedPlaceholder: '',
    cachedOptions: [] as Option[],
    createdOptions: [] as Option[],
    createdLabel: '',
    createdSelected: false,
    currentPlaceholder: '',
    hoveringIndex: -1,
    comboBoxHovering: false,
    isOnComposition: false,
    isSilentBlur: false,
    isComposing: false,
    inputLength: 20,
    inputWidth: 240,
    initialInputHeight: 0,
    previousQuery: null,
    previousValue: '',
    query: '',
    selectedLabel: '',
    softFocus: false,
    tagInMultiLine: false,
  })

  // data refs
  const selectedIndex = ref(-1)
  const popperSize = ref(-1)

  // DOM & Component refs
  const controlRef = ref(null)
  const inputRef = ref(null) // el-input ref
  const menuRef = ref(null)
  const popper = ref(null)
  const selectRef = ref(null)
  const selectionRef = ref(null) // tags ref
  const calculatorRef = ref<HTMLElement>(null)

  // the controller of the expanded popup
  const expanded = ref(false)

  const selectDisabled = computed(() => props.disabled || elForm.disabled)

  const popupHeight = computed(() => {
    const totalHeight = filteredOptions.value.length * 34
    return totalHeight > props.height ? props.height : totalHeight
  })

  const showClearBtn = computed(() => {
    const hasValue = props.multiple
      ? Array.isArray(props.modelValue) && props.modelValue.length > 0
      : props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== ''

    const criteria =
      props.clearable &&
      !selectDisabled.value &&
      states.comboBoxHovering &&
      hasValue
    return criteria
  })

  const iconClass = computed(() => props.remote && props.filterable ? '' : (expanded.value ? 'arrow-up is-reverse' : 'arrow-up'))

  const debounce = computed(() => props.remote ? 300 : 0)

  // filteredOptions includes flatten the data into one dimensional array.
  const emptyText = computed(() => {
    const options = filteredOptions.value
    if (props.loading) {
      return props.loadingText || t('el.select.loading')
    } else {
      if (props.remote && states.inputValue === '' && options.length === 0) return false
      if (props.filterable && states.inputValue && options.length > 0) {
        return props.noMatchText || t('el.select.noMatch')
      }
      if (options.length === 0) {
        return props.noDataText || t('el.select.noData')
      }
    }
    return null
  })

  const filteredOptions = computed(() => {
    const isValidOption = (o: Option): boolean => {
      // fill the conditions here.
      const query = states.inputValue
      // when query was given, we should test on the label see whether the label contains the given query
      const containsQueryString = query ? o.label.includes(query) : true
      return containsQueryString
    }
    if (props.loading) {
      return []
    }
    return flattenOptions((props.options as OptionType[]).concat(states.createdOptions).map(v => {
      if (isArray(v.options)) {
        const filtered = v.options.filter(isValidOption)
        if (filtered.length > 0) {
          return {
            ...v,
            options: filtered,
          }
        }
      } else {
        if (props.remote || isValidOption(v as Option)) {
          return v
        }
      }
      return null
    }).filter(v => v !== null))
  })

  const selectSize = computed(() => props.size || elFormItem.size || $ELEMENT.size)

  const collapseTagSize = computed(() => ['small', 'mini'].indexOf(selectSize.value) > -1 ? 'mini' : 'small')

  const calculatePopperSize = () => {
    popperSize.value = selectRef.value?.getBoundingClientRect?.()?.width || 200
  }

  const inputWrapperStyle = computed(() => {

    return {
      width: `${
        states.calculatedWidth === 0
          ? MINIMUM_INPUT_WIDTH
          : Math.ceil(states.calculatedWidth) + MINIMUM_INPUT_WIDTH
      }px`,
    } as CSSProperties
  })

  const shouldShowPlaceholder = computed(() => {
    if (isArray(props.modelValue)) {
      return props.modelValue.length === 0 && !states.displayInputValue
    }

    // when it's not multiple mode, we only determine this flag based on filterable and expanded
    // when filterable flag is true, which means we have input box on the screen
    return props.filterable ? states.displayInputValue.length === 0 : true
  })

  const currentPlaceholder = computed(() => {
    const _placeholder = props.placeholder || t('el.select.placeholder')
    return props.multiple
      ? _placeholder
      : states.selectedLabel || _placeholder
  })

  // this obtains the actual popper DOM element.
  const popperRef = computed(() => popper.value?.popperRef)

  // the index with current value in options
  const indexRef = computed<number>(() => {
    if (props.multiple) {
      if ((props.modelValue as Array<any>).length > 0) {
        return filteredOptions.value.findIndex(o => o.value === props.modelValue[0])
      }
    } else {
      if (props.modelValue) {
        return filteredOptions.value.findIndex(o => o.value === props.modelValue)
      }
    }
    return -1
  })

  const dropdownMenuVisible = computed(() => expanded.value && emptyText.value !== false)

  // hooks
  const { createNewOption, removeNewOption, selectNewOption, clearAllNewOption } = useAllowCreate(props, states)
  const { handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useInput(e => onInput(e))

  // methods
  const focusAndUpdatePopup = () => {
    inputRef.value.focus?.()
    popper.value.update?.()
  }

  const toggleMenu = () => {
    if (props.automaticDropdown) return
    if (!selectDisabled.value) {
      if (states.isComposing) states.softFocus = true
      expanded.value = !expanded.value
      inputRef.value?.focus?.()
    }
  }

  const onInputChange = () => {
    if (props.filterable && states.inputValue !== states.selectedLabel) {
      states.query = states.selectedLabel
    }
    handleQueryChange(states.inputValue)
    return nextTick(() => {
      createNewOption(states.inputValue)
    })
  }

  const debouncedOnInputChange = lodashDebounce(onInputChange, debounce.value)

  const handleQueryChange = (val: string) => {
    if (states.previousQuery === val) {
      return
    }
    states.previousQuery = val
    if (props.filterable && isFunction(props.filterMethod)) {
      props.filterMethod(val)
    } else if (props.filterable && props.remote && isFunction(props.remoteMethod)) {
      props.remoteMethod(val)
    }
  }

  const emitChange = (val: any | any[]) => {
    if (!isEqual(props.modelValue, val)) {
      emit(CHANGE_EVENT, val)
    }
  }

  const update = (val: any) => {
    emit(UPDATE_MODEL_EVENT, val)
    emitChange(val)
    states.previousValue = val.toString()
  }

  const getValueIndex = (arr = [], value: unknown) => {
    if (!isObject(value)) return arr.indexOf(value)

    const valueKey = props.valueKey
    let index = -1
    arr.some((item, i) => {
      if (getValueByPath(item, valueKey) === getValueByPath(value, valueKey)) {
        index = i
        return true
      }
      return false
    })
    return index
  }

  const getValueKey = (item: unknown) => {
    return isObject(item)
      ? getValueByPath(item, props.valueKey)
      : item
  }

  // if the selected item is item then we get label via indexing
  // otherwise it should be string we simply return the item itself.
  const getLabel = (item: unknown) => {
    return isObject(item)
      ? item.label
      : item
  }

  const resetInputHeight = () => {
    if (props.collapseTags && !props.filterable) return
    nextTick(() => {
      if (!inputRef.value) return
      const selection = selectionRef.value

      selectRef.value.height = selection.offsetHeight
      if (expanded.value && emptyText.value !== false) {
        popper.value?.update?.()
      }
    })
  }

  const handleResize = () => {
    resetInputWidth()
    calculatePopperSize()
    popper.value?.update?.()
    if (props.multiple) resetInputHeight()
  }

  const resetInputWidth = () => {
    if (inputRef.value) {
      states.inputWidth = inputRef.value.getBoundingClientRect().width
    }
  }

  const onSelect = (option: Option, idx: number, byClick = true) => {
    if (props.multiple) {
      let selectedOptions = (props.modelValue as any[]).slice()

      const index = getValueIndex(selectedOptions, option.value)
      if (index > -1) {
        selectedOptions = [
          ...selectedOptions.slice(0, index),
          ...selectedOptions.slice(index + 1),
        ]
        states.cachedOptions.splice(index, 1)
        removeNewOption(option)
      } else if (props.multipleLimit <= 0 || selectedOptions.length < props.multipleLimit) {
        selectedOptions = [...selectedOptions, option.value]
        states.cachedOptions.push(option)
        selectNewOption(option)
      }
      update(selectedOptions)
      if (option.created) {
        states.query = ''
        handleQueryChange('')
        states.inputLength = 20
      }
      if (props.filterable) {
        inputRef.value.focus?.()
        onUpdateInputValue('')
      }
      if (props.filterable) {
        states.calculatedWidth = calculatorRef.value.getBoundingClientRect().width
      }
      resetInputHeight()
    } else {
      selectedIndex.value = idx
      states.selectedLabel = option.label
      update(option.value)
      expanded.value = false
      states.isComposing = false
      states.isSilentBlur = byClick
      selectNewOption(option)
      if (!option.created) {
        clearAllNewOption()
      }
    }
  }

  const deleteTag = (event: MouseEvent, tag: Option) => {

    const index = (props.modelValue as Array<any>).indexOf(tag.value)

    if (index > -1 && !selectDisabled.value) {
      const value = [
        ...(props.modelValue as Array<unknown>).slice(0, index),
        ...(props.modelValue as Array<unknown>).slice(index + 1),
      ]
      states.cachedOptions.splice(index, 1)
      update(value)
      emit('remove-tag', tag.value)
      states.softFocus = true
      nextTick(focusAndUpdatePopup)
      removeNewOption(tag)
    }
    event.stopPropagation()
  }

  const handleFocus = (event: FocusEvent) => {
    const focused = states.isComposing
    states.isComposing = true
    if (!states.softFocus) {
      if (props.automaticDropdown || props.filterable) {
        expanded.value = true
      }
      // If already in the focus state, shouldn't trigger event
      if (!focused) emit('focus', event)
    } else {
      states.softFocus = false
    }
  }

  const handleBlur = () => {
    states.softFocus = false

    // reset input value when blurred
    // https://github.com/ElemeFE/element/pull/10822
    nextTick(() => {
      inputRef.value?.blur?.()
      if (calculatorRef.value) {
        states.calculatedWidth = calculatorRef.value.getBoundingClientRect().width
      }
      if (states.isSilentBlur) {
        states.isSilentBlur = false
      } else {
        if (states.isComposing) {
          emit('blur')
        }
      }
      states.isComposing = false
    })

  }

  // keyboard handlers
  const handleEsc = () => {
    if (states.displayInputValue.length > 0) {
      onUpdateInputValue('')
    } else {
      expanded.value = false
    }
  }

  const handleDel = (e: KeyboardEvent) => {
    if (states.displayInputValue.length === 0) {
      e.preventDefault()
      const selected = (props.modelValue as Array<any>).slice()
      selected.pop()
      removeNewOption(states.cachedOptions.pop())
      update(selected)
    }
  }

  const handleClear = () => {
    let emptyValue: string | any[]
    if (isArray(props.modelValue)) {
      emptyValue = []
    } else {
      emptyValue = ''
    }

    states.softFocus = true
    if (props.multiple) {
      states.cachedOptions = []
    } else {
      states.selectedLabel = ''
    }
    expanded.value = false
    update(emptyValue)
    emit('clear')
    clearAllNewOption()
    nextTick(focusAndUpdatePopup)
  }

  const onUpdateInputValue = (val: string) => {
    states.displayInputValue = val
    states.inputValue = val
  }

  const onKeyboardNavigate = (direction: 'forward' | 'backward') => {
    if (selectDisabled.value) return

    if (props.multiple) {
      expanded.value = true
      return
    }

    let newIndex: number

    if (props.options.length === 0 || filteredOptions.value.length === 0) return

    if (filteredOptions.value.length > 0) {
      // only two ways: forward or backward
      if (direction === 'forward') {
        newIndex = selectedIndex.value + 1

        if (newIndex > filteredOptions.value.length - 1) {
          newIndex = 0
        }
        // states.hoveringIndex++
        // if (states.hoveringIndex === props.options.length) {
        //   states.hoveringIndex = 0
        // }
      } else {
        newIndex = selectedIndex.value - 1

        if (newIndex < 0) {
          newIndex = filteredOptions.value.length - 1
        }
      }

      selectedIndex.value = newIndex
      const option = filteredOptions.value[newIndex]
      if (option.disabled || option.type === 'Group') {
        onKeyboardNavigate(direction)
        // prevent dispatching multiple nextTick callbacks.
        return
      }

      emit(UPDATE_MODEL_EVENT, filteredOptions.value[newIndex])
      emitChange(filteredOptions.value[newIndex])
    }
  }

  const onKeyboardSelect = () => {
    if (!expanded.value) {
      toggleMenu()
    } else {
      onSelect(filteredOptions.value[states.hoveringIndex], states.hoveringIndex, false)
    }
  }

  const onInput = event => {
    const value = event.target.value
    onUpdateInputValue(value)
    if (states.displayInputValue.length > 0 && !expanded.value) {
      expanded.value = true
    }

    states.calculatedWidth = calculatorRef.value.getBoundingClientRect().width
    if (props.multiple) {
      resetInputHeight()
    }
    if (props.remote) {
      debouncedOnInputChange()
    } else {
      return onInputChange()
    }
  }

  const handleClickOutside = () => {
    expanded.value = false
    handleBlur()
  }

  const handleMenuEnter = () => {
    states.inputValue = states.displayInputValue
    return nextTick(() => {
      if (~indexRef.value) {
        scrollToItem(indexRef.value)
      }
    })
  }

  const scrollToItem = (index: number) => {
    menuRef.value.scrollToItem(index)
  }

  const initStates = () => {
    if (props.multiple) {
      if ((props.modelValue as Array<any>).length > 0) {
        states.cachedOptions.length = 0;
        (props.modelValue as Array<any>).map(selected => {
          const item = filteredOptions.value.find(option => option.value === selected)
          if (item) {
            states.cachedOptions.push(item as Option)
          }
        })
      }
    } else {
      if (props.modelValue) {
        const selectedItem = filteredOptions.value.find(o => o.value === props.modelValue)
        if (selectedItem) {
          states.selectedLabel = selectedItem.label
        } else {
          states.selectedLabel = `${props.modelValue}`
        }
      } else {
        states.selectedLabel = ''
      }
    }
    calculatePopperSize()
  }

  // in order to track these individually, we need to turn them into refs instead of watching the entire
  // reactive object which could cause perf penalty when unnecessary field gets changed the watch method will
  // be invoked.

  watch(expanded, val => {
    emit('visible-change', val)
    if (val) {
      popper.value.update?.()
      // the purpose of this function is to differ the blur event trigger mechanism
    } else {
      states.displayInputValue = ''
      createNewOption('')
    }
  })

  watch(() => props.modelValue, val => {
    if (!val || val.toString() !== states.previousValue) {
      initStates()
    }
  }, {
    deep: true,
  })

  watch(() => props.options, () => {
    const input = inputRef.value
    // filter or remote-search scenarios are not initialized
    if (!input || (input && document.activeElement !== input)) {
      initStates()
    }
  }, {
    deep: true,
  })

  // fix the problem that scrollTop is not reset in filterable mode
  watch(filteredOptions, () => {
    return nextTick(menuRef.value.resetScrollTop)
  })

  onMounted(() => {
    initStates()
    addResizeListener(selectRef.value, handleResize)
  })

  onBeforeMount(() => {
    removeResizeListener(selectRef.value, handleResize)
  })

  return {
    // data exports
    collapseTagSize,
    currentPlaceholder,
    expanded,
    emptyText,
    popupHeight,
    debounce,
    filteredOptions,
    iconClass,
    inputWrapperStyle,
    popperSize,
    dropdownMenuVisible,
    // readonly,
    shouldShowPlaceholder,
    selectDisabled,
    selectSize,
    showClearBtn,
    states,

    // refs items exports
    calculatorRef,
    controlRef,
    inputRef,
    menuRef,
    popper,
    selectRef,
    selectionRef,

    popperRef,

    // methods exports
    debouncedOnInputChange,
    deleteTag,
    getLabel,
    getValueKey,
    handleBlur,
    handleClear,
    handleClickOutside,
    handleDel,
    handleEsc,
    handleFocus,
    handleMenuEnter,
    toggleMenu,
    scrollTo: scrollToItem,
    onInput,
    onKeyboardNavigate,
    onKeyboardSelect,
    onSelect,
    onUpdateInputValue,
    handleCompositionStart,
    handleCompositionEnd,
    handleCompositionUpdate,
  }
}

export default useSelect
