import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { sleep, defineGetter, makeScroll } from '@element-plus/test-utils'
import InfiniteScroll, { SCOPE, CHECK_INTERVAL, DEFAULT_DELAY } from '../src/index'

const CONTAINER_HEIGHT = 200
const ITEM_HEIGHT = 100
const CONTAINER_STYLE = `overflow-y: auto;`
const LIST_ITEM_CLASS = 'list-item'
const LIST_ITEM_STYLE = `height: ${ITEM_HEIGHT}px;`
const INITIAL_VALUE = 3
const CUSTOM_DELAY = 0
const CUSTOM_DISTANCE = 10

let clientHeightRestore = null
let scrollHeightRestore = null

const _mount = (options: Record<string, unknown>) => mount({
  ...options,
  template: `
    <ul v-infinite-scroll="load" ${options.extraAttrs}>
      <li
        v-for="i in count"
        :key="i"
        class="${LIST_ITEM_CLASS}"
        style="${LIST_ITEM_STYLE}"
      >{{ i }}</li>
    </ul>
  `,
  directives: {
    InfiniteScroll,
  },
}, { attachTo: document.body })

const setup = function () {
  const count = ref(0)
  const load = () => {
    count.value += 1
  }

  return { count, load }
}

const countListItem = (wrapper: any) => wrapper.findAll(`.${LIST_ITEM_CLASS}`).length

beforeAll(() => {
  clientHeightRestore = defineGetter(window.HTMLElement.prototype, 'clientHeight', CONTAINER_HEIGHT, 0)
  scrollHeightRestore = defineGetter(window.HTMLElement.prototype, 'scrollHeight', function () {
    return Array.from(this.getElementsByClassName(LIST_ITEM_CLASS)).length * ITEM_HEIGHT
  }, 0)
})

afterAll(() => {
  clientHeightRestore()
  scrollHeightRestore()
})

afterEach(() => {
  const app = document.querySelector('#app')
  document.body.removeChild(app)
})

describe('InfiniteScroll', () => {
  test('scrollable container is the element to which the directive is bound', async () => {
    const wrapper = _mount({
      extraAttrs: `style="${CONTAINER_STYLE}"`,
      setup,
    })

    const el = wrapper.element

    // wait longer to ensure no more items are loaded
    await sleep(CHECK_INTERVAL * (INITIAL_VALUE + 1))
    expect(el[SCOPE].container).toEqual(el)
    expect(el[SCOPE].containerEl).toEqual(el)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE)
    // ensure observer has been destroyed, otherwise will cause memory leak
    expect(el[SCOPE].observer).toBeUndefined()

    // won't trigger load when not reach the bottom distance
    await makeScroll(el, 'scrollTop', ITEM_HEIGHT - 1)
    await sleep(DEFAULT_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE)

    // won't trigger load repeatly when scroll event is triggered multiple times in debounce time
    await makeScroll(el, 'scrollTop', ITEM_HEIGHT)
    await sleep(DEFAULT_DELAY / 2)
    await makeScroll(el, 'scrollTop', ITEM_HEIGHT + 1)
    await sleep(DEFAULT_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)

    // won't trigger load when scroll back
    await makeScroll(el, 'scrollTop', 0)
    await sleep(DEFAULT_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)
  })

  test('custom scroll delay', async () => {
    const wrapper = _mount({
      extraAttrs: `infinite-scroll-delay="${CUSTOM_DELAY}" style="${CONTAINER_STYLE}"`,
      setup,
    })

    const el = wrapper.element

    // wait longer to ensure no more items are loaded
    await sleep(CHECK_INTERVAL * INITIAL_VALUE)
    await makeScroll(el, 'scrollTop', ITEM_HEIGHT)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)
  })

  test('custom scroll distance', async () => {
    const wrapper = _mount({
      extraAttrs: `
        infinite-scroll-delay="${CUSTOM_DELAY}"
        infinite-scroll-distance="${CUSTOM_DISTANCE}"
        style="${CONTAINER_STYLE}"
      `,
      setup,
    })

    const el = wrapper.element

    // wait longer to ensure no more items are loaded
    await sleep(CHECK_INTERVAL * INITIAL_VALUE)
    await makeScroll(el, 'scrollTop', ITEM_HEIGHT - CUSTOM_DISTANCE)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)
  })

  test('turn off immediate check', async () => {
    const wrapper = _mount({
      extraAttrs: `
        infinite-scroll-delay="${CUSTOM_DELAY}"
        infinite-scroll-immediate="false"
        style="${CONTAINER_STYLE}"
      `,
      setup,
    })

    await sleep(CHECK_INTERVAL)
    expect(countListItem(wrapper)).toBe(0)
  })

  test('limited scroll with `disabled` option', async () => {
    const wrapper = _mount({
      extraAttrs: `
        infinite-scroll-delay="${CUSTOM_DELAY}"
        infinite-scroll-disabled="disabled"
        style="${CONTAINER_STYLE}"
      `,
      setup() {
        const count = ref(0)
        const disabled = ref(false)
        const load = () => {
          count.value += 1
          disabled.value = count.value >= INITIAL_VALUE + 1
        }

        return { count, load, disabled }
      },
    })

    const el = wrapper.element

    // wait longer to ensure no more items are loaded
    await sleep(CHECK_INTERVAL * INITIAL_VALUE)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE)

    await makeScroll(el, 'scrollTop', ITEM_HEIGHT)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)

    // no more items are loaded since `disabled = true`
    await makeScroll(el, 'scrollTop', ITEM_HEIGHT + 1)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)
  })

  test('scrollable container is document.documentElement', async () => {
    const wrapper = _mount({
      extraAttrs: `infinite-scroll-delay="${CUSTOM_DELAY}"`,
      setup,
    })

    const el = wrapper.element
    const { documentElement } = document

    // wait longer to ensure no more items are loaded
    await sleep(CHECK_INTERVAL * INITIAL_VALUE)
    expect(el[SCOPE].container).toEqual(window)
    expect(el[SCOPE].containerEl).toEqual(documentElement)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE)

    // won't trigger load when not reach the bottom distance
    await makeScroll(documentElement, 'scrollTop', ITEM_HEIGHT - 1)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE)

    await makeScroll(documentElement, 'scrollTop', ITEM_HEIGHT)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)

    // won't trigger load when scroll back
    await makeScroll(documentElement, 'scrollTop', 0)
    await sleep(CUSTOM_DELAY)
    expect(countListItem(wrapper)).toBe(INITIAL_VALUE + 1)
  })

})
