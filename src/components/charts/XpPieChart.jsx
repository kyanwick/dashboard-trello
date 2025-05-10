import { defineComponent, watch, ref } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

export default defineComponent({
  name: 'XpPieChart',
  props: {
    data: Object,
  },
  setup(props) {
    const chartData = ref({
      labels: [],
      datasets: [
        {
          label: 'XP by Label',
          data: [],
          backgroundColor: [],
        },
      ],
    })

    const defaultColors = [
      '#f87171', // red
      '#60a5fa', // blue
      '#34d399', // green
      '#facc15', // yellow
      '#a78bfa', // purple
      '#fb923c', // orange
      '#4ade80', // lime
      '#818cf8', // indigo
    ]

    watch(
      () => props.data,
      (newData) => {
        chartData.value = {
          labels: Object.keys(newData),
          datasets: [
            {
              label: 'XP by Label',
              data: Object.values(newData),
              backgroundColor: defaultColors.slice(0, Object.keys(newData).length),
            },
          ],
        }
      },
      { immediate: true }
    )

    return () => <Pie data={chartData.value} />
  },
})
