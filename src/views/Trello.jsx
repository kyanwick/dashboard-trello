import { defineComponent, ref, onMounted } from 'vue'
import XpPieChart from '../components/charts/XpPieChart'
import BarChart from '../components/charts/BarChart'
import { format, startOfWeek, addDays, isWithinInterval, parseISO } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

export default defineComponent({
    name: 'Trello',

    setup() {
        const trelloData = ref({})
        const labelTotals = ref({})
        const archivedStats = ref({
            labels: [],
            data: [],
        })

        const key = import.meta.env.VITE_TRELLO_KEY
        const token = import.meta.env.VITE_TRELLO_TOKEN

        const boardIds = {
            oberas: import.meta.env.VITE_TRELLO_BOARD_OBERAS,
            fanshawe: import.meta.env.VITE_TRELLO_BOARD_FANSHAWE,
            client: import.meta.env.VITE_TRELLO_BOARD_CLIENT,
            life: import.meta.env.VITE_TRELLO_BOARD_LIFE,
        }

        const labelXP = {
            'xp: deep': 50,
            'xp: outreach': 40,
            'xp: school': 30,
            'xp: maintenance': 20,
        }

        const fetchCards = async (listId) => {
            const url = `https://api.trello.com/1/lists/${listId}/cards?key=${key}&token=${token}`
            const res = await fetch(url)
            if (!res.ok) return []
            return await res.json()
        }

        const fetchArchivedCards = async (boardId) => {
            const url = `https://api.trello.com/1/boards/${boardId}/cards/closed?key=${key}&token=${token}`
            const res = await fetch(url)
            if (!res.ok) return []
            return await res.json()
        }

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

        const calculateWeeklyArchivedStats = async () => {
            const tz = 'America/Toronto'
            const now = new Date()
            const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday
            const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
            const dayLabels = days.map((d) => format(d, 'EEE, MMM d'))

            const boardMeta = {
                oberas: {
                    id: import.meta.env.VITE_TRELLO_BOARD_OBERAS,
                    label: 'Oberas Co',
                    color: '#facc15', // yellow
                },
                fanshawe: {
                    id: import.meta.env.VITE_TRELLO_BOARD_FANSHAWE,
                    label: 'Fanshawe',
                    color: '#ef4444', // red
                },
                life: {
                    id: import.meta.env.VITE_TRELLO_BOARD_LIFE,
                    label: 'Life',
                    color: '#a78bfa', // purple
                },
            }

            const datasets = []

            for (const [key, { id, label, color }] of Object.entries(boardMeta)) {
                const boardArchived = await fetchArchivedCards(id)
                const dayCounts = Array(7).fill(0)

                for (const card of boardArchived) {
                    if (!card.dateLastActivity) continue
                    const archivedDate = zonedTimeToUtc(parseISO(card.dateLastActivity), tz)

                    days.forEach((day, i) => {
                        const dayEnd = addDays(day, 1)
                        const inDay = isWithinInterval(archivedDate, { start: day, end: dayEnd })
                        if (inDay) dayCounts[i]++
                    })
                }

                datasets.push({
                    label,
                    data: dayCounts,
                    backgroundColor: color,
                })
            }

            archivedStats.value = {
                labels: dayLabels,
                datasets,
            }
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

            calculateLabelXP(trelloData.value)
            await calculateWeeklyArchivedStats()
        })

        return () => (
            <main class="p-5">
              <div class="flex flex-col items-start justify-between pb-6 space-y-4 border-b lg:items-center lg:space-y-0 lg:flex-row">
                <h1 class="text-2xl font-semibold whitespace-nowrap text-yellow-400">📋 Trello Dashboard</h1>
              </div>
          
              {/* Trello Stats + XP */}
              <div class="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                <div class="bg-[#1c1c1c] p-4 rounded-lg shadow-md">
                  <h2 class="text-yellow-400 font-semibold mb-4">XP by Label</h2>
                  <XpPieChart data={labelTotals.value} />
                </div>
          
                {Object.entries(trelloData.value).map(([group, lists]) => (
                  <div class="bg-[#1c1c1c] p-4 rounded-lg shadow-md" key={group}>
                    <h2 class="text-lg font-semibold text-yellow-400 mb-2">{group}</h2>
                    <div class="space-y-2">
                      {Object.entries(lists).map(([listName, cards]) => (
                        <div class="flex justify-between items-center border-b border-gray-700 py-2" key={listName}>
                          <span class="text-gray-300">{listName}</span>
                          <span class="text-sm text-gray-400">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
          
              {/* Weekly Archived Chart */}
              <div class="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-3">
              <div class="bg-[#1c1c1c] p-6 rounded-lg shadow-md col-span-1 lg:col-span-3 h-[360px]">
              <h2 class="text-yellow-400 font-semibold mb-4 text-lg">🗃️ Weekly Archived Cards</h2>
                  <BarChart chartId="archived" chartData={archivedStats.value} />
                </div>
              </div>
            </main>
          )
          
    },
})
