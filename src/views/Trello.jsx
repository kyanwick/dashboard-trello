import { defineComponent, ref, onMounted } from 'vue'
import BarChart from '../components/charts/BarChart'
import LabelTypeChart from '../components/charts/LabelTypeChart'
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

        const labelDisplayNames = {
            'xp: deep': 'Deep Work',
            'xp: creative': 'Creative Tasks',
            'xp: outreach': 'Outreach',
            'xp: content': 'Content Work',
            'xp: maintenance': 'Maintenance',
            'xp: life': 'Life Tasks',
            'xp: school': 'School Tasks',
        }

        const labelColors = {
            'Content Work': '#eab308',     // Yellow
            'Outreach': '#f87171',         // Red
            'Deep Work': '#34d399',        // Green
            'School Tasks': '#60a5fa',     // Blue
            'Maintenance': '#a78bfa',      // Purple
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

        const labelCounts = ref({})

        const calculateLabelCounts = (allCards) => {
            const counts = {}
            const excludedLabels = ['priority: high', 'priority: medium', 'priority: low']

            for (const group of Object.values(allCards)) {
                for (const list of Object.values(group)) {
                    for (const card of list) {
                        for (const label of card.labels || []) {
                            const raw = label.name.toLowerCase()
                            if (excludedLabels.includes(raw)) continue

                            const display = labelDisplayNames[raw] || label.name
                            counts[display] = (counts[display] || 0) + 1
                        }
                    }
                }
            }

            labelCounts.value = counts
        }


        const timeNow = ref('')
        const dateNow = ref('')

        const updateClock = () => {
            const now = new Date()
            timeNow.value = now.toLocaleTimeString('en-CA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            })

            dateNow.value = now.toLocaleDateString('en-CA', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            })
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


        const refreshTrelloData = async () => {
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

            calculateLabelCounts(trelloData.value)
            await calculateWeeklyArchivedStats()
        }

        onMounted(async () => {
            updateClock()
            setInterval(updateClock, 1000)


            await refreshTrelloData()

            setInterval(() => {
                refreshTrelloData()
            }, 30000) // every 30 seconds
        })


        return () => (
            <main class="p-6 bg-[#121212] min-h-screen text-white">

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left side (2/3 width) */}
                    <div class="col-span-1 lg:col-span-2 space-y-6">
                        {/* Horizontal chart*/}
                        <div class="bg-[#1c1c1c] p-4 rounded-xl shadow-md">
                            <LabelTypeChart data={labelCounts.value} />
                        </div>

                        {/* Weekly Archived Chart — 1.5 card tall */}
                        <div class="bg-[#1c1c1c] p-4 rounded-xl shadow-md">
                            <BarChart chartId="archived" chartData={archivedStats.value} />
                        </div>
                    </div>

                    {/* Right side — KPI cards */}
                    <div class="space-y-4">
                        <div class="bg-[#1c1c1c] p-6 rounded-xl shadow-md text-center">
                            <div class="text-yellow-400 text-5xl font-bold">{timeNow.value}</div>
                            <div class="text-gray-300 text-lg mt-2">{dateNow.value}</div>
                        </div>

                        {Object.entries(trelloData.value).flatMap(([group, lists]) =>
                            Object.entries(lists)
                                .filter(([listName]) => listName !== 'On Hold')
                                .map(([listName, cards]) => ({
                                    title: `${group} — ${listName}`,
                                    count: cards.length,
                                }))
                        ).map(({ title, count }) => (
                            <div class="bg-[#1c1c1c] p-6 rounded-xl shadow-md flex flex-col items-center text-center" key={title}>
                                <h2 class="text-yellow-400 font-bold text-2xl mb-2 leading-snug">{title}</h2>
                                <div class="text-5xl font-bold text-white">{count}</div>
                                <div class="text-sm text-gray-400 mt-1">task{count !== 1 ? 's' : ''}</div>
                            </div>
                        ))}

                        {/* All On Hold Combined */}
                        <div class="bg-[#1c1c1c] p-6 rounded-xl shadow-md flex flex-col items-center text-center">
                            <h2 class="text-yellow-400 font-semibold text-lg mb-2">All On Hold</h2>
                            <div class="text-5xl font-bold text-white">
                                {
                                    Object.values(trelloData.value)
                                        .flatMap(lists => Object.entries(lists))
                                        .filter(([name]) => name === 'On Hold')
                                        .reduce((sum, [, cards]) => sum + cards.length, 0)
                                }
                            </div>
                            <div class="text-sm text-gray-400 mt-1">tasks</div>
                        </div>
                    </div>


                </div>
            </main>

        )

    },
})
