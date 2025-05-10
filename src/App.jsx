import { computed, defineComponent, h } from 'vue'
import { RouterView, useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const { currentRoute } = useRouter()

    const Layout = computed(() => {
      return currentRoute.value.meta.layout
    })

    return () => {
      const LayoutComponent = Layout.value || ((_, { slots }) => h('div', slots.default?.()))
      return (
        <LayoutComponent>
          <RouterView />
        </LayoutComponent>
      )
    }
  },
})
