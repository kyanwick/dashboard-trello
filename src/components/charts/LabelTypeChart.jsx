import { defineComponent, watch, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default defineComponent({
    name: 'LabelTypeChart',
    props: {
        data: {
            type: Object,
            required: true,
        },
    },
    setup(props) {
        const chartData = ref({
            labels: [],
            datasets: [],
        })

        watch(
            () => props.data,
            (newVal) => {
              const labelColors = {
                'Content Work': '#f59e0b',     // amber-500
                'Outreach': '#f87171',         // red-400
                'Deep Work': '#34d399',        // emerald-400
                'School Tasks': '#60a5fa',     // blue-400
                'Maintenance': '#a78bfa',      // purple-400
              }
          
              chartData.value = {
                labels: Object.keys(newVal),
                datasets: [
                  {
                    label: 'Tasks Completed',
                    data: Object.values(newVal),
                    backgroundColor: Object.keys(newVal).map(
                      (label) => labelColors[label] || '#facc15' // fallback to yellow
                    ),
                  },
                ],
              }
            },
            { immediate: true }
          )
          

        return () => (
            <div class="h-[300px]">
                <Bar
                    data={chartData.value}
                    options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: {
                                    color: '#ccc',
                                    font: { size: 18 },
                                },
                                grid: { color: '#333' },
                            },
                            y: {
                                ticks: {
                                    color: '#fff',
                                    font: { size: 20, weight: 'bold' },
                                },
                                grid: { color: '#333' },
                            },
                        },
                        plugins: {
                            legend: { display: false },
                            title: {
                                display: true,
                                text: 'Most Frequent Task Types This Week',
                                color: '#facc15',
                                font: {
                                    size: 24,
                                    weight: 'bold',
                                },
                                padding: {
                                    bottom: 16,
                                },
                            },
                        },
                    }}
                />

            </div>
        )

    },
})
