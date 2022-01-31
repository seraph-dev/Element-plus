import { h, nextTick } from 'vue'
import { PopupManager } from '@element-plus/utils/popup-manager'
import makeMount from '@element-plus/test-utils/make-mount'
import { rAF } from '@element-plus/test-utils/tick'
import { ElPopperTrigger } from '@element-plus/components/popper'
import Popover from '../src/index.vue'

const AXIOM = 'Rem is the best girl'
jest.useFakeTimers()
const mount = makeMount(Popover, {
  slots: {
    default: () => AXIOM,
    reference: () => h('button', 'click me'),
  },
  props: {
    appendToBody: false,
  },
  global: {
    attachTo: document.body,
  },
})
describe('Popover.vue', () => {
  let wrapper: ReturnType<typeof mount>
  const findContentComp = () =>
    wrapper.findComponent({
      name: 'ElPopperContent',
    })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  test('render test', () => {
    wrapper = mount()

    expect(findContentComp().text()).toEqual(AXIOM)
  })

  test('should render with title', () => {
    const title = 'test title'
    wrapper = mount({
      props: {
        title,
      },
    })

    expect(findContentComp().text()).toContain(title)
  })

  test("should modify popover's style with width", async () => {
    wrapper = mount({
      props: {
        width: 200,
      },
    })

    const popperContent = findContentComp()
    expect(getComputedStyle(popperContent.element).width).toBe('200px')

    await wrapper.setProps({
      width: '100vw',
    })

    expect(getComputedStyle(popperContent.element).width).toBe('100vw')
  })

  test('the content should be overrode by slots', () => {
    const content = 'test content'
    wrapper = mount({
      props: {
        content,
      },
    })
    expect(findContentComp().text()).toContain(AXIOM)
  })

  test('should render content when no slots were passed', () => {
    const content = 'test content'
    const virtualRef = document.createElement('button')
    wrapper = makeMount(Popover, {
      props: {
        content,
        appendToBody: false,
        virtualRef,
        virtualTriggering: true,
      },
    })()

    expect(findContentComp().text()).toBe(content)
  })

  test('popper z-index should be dynamical', () => {
    wrapper = mount()

    expect(
      Number.parseInt(window.getComputedStyle(findContentComp().element).zIndex)
    ).toBeLessThanOrEqual(
      PopupManager.zIndex + PopupManager.globalInitialZIndex
    )
  })

  test('defind hide method', async () => {
    wrapper = mount()
    const vm = wrapper.vm as any
    expect(vm.hide).toBeDefined()
  })

  test('should be able to emit after-enter and after-leave', async () => {
    const wrapper = mount({
      attrs: {
        trigger: 'click',
      },
    })
    await nextTick()
    const trigger$ = wrapper.findComponent(ElPopperTrigger)
    const triggerEl = trigger$.find('.el-tooltip__trigger')
    await triggerEl.trigger('click')
    jest.runAllTimers()
    await rAF()
    expect(wrapper.emitted()).toHaveProperty('after-enter')

    await triggerEl.trigger('click')
    jest.runAllTimers()
    await rAF()
    expect(wrapper.emitted()).toHaveProperty('after-leave')
  })
})
