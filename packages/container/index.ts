import { App } from 'vue'
import Container from './src/container.vue'
import Aside from './src/aside.vue'
import Main from './src/main.vue'
import Fotter from './src/footer.vue'
import Header from './src/header.vue'

export default (app: App): void => {
  app.component(Container.name, Container)
  app.component(Aside.name, Aside)
  app.component(Main.name, Main)
  app.component(Fotter.name, Fotter)
  app.component(Header.name, Header)
}
