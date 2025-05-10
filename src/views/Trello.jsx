import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'Trello',

  setup() {
    const trelloData = ref({})
    const key = import.meta.env.VITE_TRELLO_KEY
    const token = import.meta.env.VITE_TRELLO_TOKEN

    const fetchCards = async (listId) => {
        const url = `https://api.trello.com/1/lists/${listId}/cards?key=${key}&token=${token}`
        const res = await fetch(url)
      
        // 👇 check for error status before parsing
        if (!res.ok) {
          const errorText = await res.text()
          console.error(`Trello API error [${res.status}]:`, errorText)
          return []
        }
        console.log('API key check:', import.meta.env.VITE_TRELLO_KEY)

        return await res.json()
      }
      

    onMounted(async () => {
      trelloData.value = {
        'Oberas Co': {
          'Backlog': await fetchCards(import.meta.env.VITE_TRELLO_OBERAS_BACKLOG),
          'In Progress': await fetchCards(import.meta.env.VITE_TRELLO_OBERAS_IN_PROGRESS),
          'On Hold': await fetchCards(import.meta.env.VITE_TRELLO_OBERAS_ON_HOLD),
        },
        'Fanshawe': {
          'Backlog': await fetchCards(import.meta.env.VITE_TRELLO_FANSHAWE_BACKLOG),
          'In Progress': await fetchCards(import.meta.env.VITE_TRELLO_FANSHAWE_IN_PROGRESS),
          'On Hold': await fetchCards(import.meta.env.VITE_TRELLO_FANSHAWE_ON_HOLD),
        },
        'Client Work': {
          'Upcoming Shoots': await fetchCards(import.meta.env.VITE_TRELLO_CLIENT_UPCOMING_SHOOTS),
          'To Be Edited': await fetchCards(import.meta.env.VITE_TRELLO_CLIENT_TO_BE_EDITED),
        },
      }
    })

    // Calculate XP for each label
    const labelTotals = ref({})

    const calculateLabelXP = (allCards) => {
      const xp = {}
      for (const group of Object.values(allCards)) {
        for (const list of Object.values(group)) {
          for (const card of list) {
            for (const label of card.labels || []) {
              const labelName = label.name
              const value = labelXP[labelName] || 0
              xp[labelName] = (xp[labelName] || 0) + value
            }
          }
        }
      }
      labelTotals.value = xp
    }
    

    return () => (
      <div class="p-6 space-y-10">
        <h1 class="text-2xl font-bold">📋 Trello Overview</h1>

        {Object.entries(trelloData.value).map(([group, lists]) => (
          <div class="mb-8" key={group}>
            <h2 class="text-xl font-semibold text-gray-800 mb-3">{group}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(lists).map(([listName, cards]) => (
                <div class="bg-white border border-gray-200 rounded-lg shadow p-4" key={listName}>
                  <h3 class="font-semibold mb-2">{listName}</h3>
                  <ul class="space-y-2">
                    {cards.map((card) => (
                      <li key={card.id} class="text-sm bg-gray-100 rounded p-2 text-gray-800">
                        {card.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  },
})
