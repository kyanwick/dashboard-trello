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
  name: 'BarChart',
  props: {
    chartId: {
      type: String,
      required: true,
    },
    chartData: {
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
      () => props.chartData,
      (newVal) => {
        if (!newVal || !Array.isArray(newVal.datasets)) {
          console.warn('🚨 Invalid chart data:', newVal)
          return
        }
    
        chartData.value = {
          labels: [...newVal.labels],
          datasets: newVal.datasets.map(ds => ({
            ...ds,
            data: [...ds.data],
          })),
        }
      },
      { immediate: true }
    )
    

    return () => (
      <Bar
        id={props.chartId}
        data={chartData.value}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              labels: {
                color: '#fff',
              },
            },
            title: {
              display: true,
              text: '🗃️ Weekly Archived Cards',
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
          scales: {
            x: {
              stacked: false,
              ticks: {
                color: '#ccc',
              },
              grid: {
                color: '#333',
              },
            },
            y: {
              beginAtZero: true,
              stacked: false,
              ticks: {
                color: '#ccc',
              },
              grid: {
                color: '#333',
              },
            },
          },
        }}
        height="320"
        class="h-full"
      />
    )
  },
})
