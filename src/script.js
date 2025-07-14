document.addEventListener('DOMContentLoaded', () => {
  const fromCurrency = document.getElementById('fromCurrency');
  const toCurrency = document.getElementById('toCurrency');
  const amountInput = document.getElementById('amount');
  const rateDisplay = document.getElementById('rateDisplay');
  const loading = document.getElementById('loading');
  const refreshBtn = document.getElementById('refreshBtn');
  const swapBtn = document.getElementById('swapBtn');
  const themeToggle = document.getElementById('themeToggle');
  const ctx = document.getElementById('rateChart').getContext('2d');

  const API_KEY = import.meta.env.VITE_API_KEY;
  const BASE_URL = 'https://api.apilayer.com/fixer';
  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

  let chart;

  function populateCurrencySelectors() {
    const flags = {
      USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CAD: '🇨🇦', AUD: '🇦🇺'
    };

    currencyOptions.forEach(curr => {
      const label = `${flags[curr]} ${curr}`;
      fromCurrency.add(new Option(label, curr));
      toCurrency.add(new Option(label, curr));
    });

    fromCurrency.value = 'USD';
    toCurrency.value = 'EUR';
  }

  function showLoading(isLoading) {
    loading.style.display = isLoading ? 'block' : 'none';
  }

  async function getExchangeRate() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const amount = parseFloat(amountInput.value) || 1;

    if (!API_KEY) {
      rateDisplay.innerText = 'Missing API Key!';
      return;
    }

    showLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/latest?base=${from}&symbols=${to}`, {
        headers: { apikey: API_KEY }
      });
      const data = await res.json();
      const rate = data.rates[to];

      const converted = (rate * amount).toFixed(2);
      rateDisplay.innerText = `Exchange Rate: ${amount} ${from} = ${converted} ${to}`;
    } catch (error) {
      rateDisplay.innerText = 'Error fetching data';
      console.error(error);
    } finally {
      showLoading(false);
    }
  }

  function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    getExchangeRate();
    getHistoricalData();
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark');
  }

  async function getHistoricalData() {
    const from = fromCurrency.value;
    const to = toCurrency.value;

    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 6);
    const startDate = pastDate.toISOString().split('T')[0];

    try {
      const res = await fetch(`${BASE_URL}/timeseries?start_date=${startDate}&end_date=${endDate}&base=${from}&symbols=${to}`, {
        headers: { apikey: API_KEY }
      });
      const data = await res.json();
      const labels = Object.keys(data.rates);
      const values = labels.map(date => data.rates[date][to]);

      drawChart(labels, values, `${from} to ${to}`);
    } catch (error) {
      console.error('Error fetching historical data', error);
    }
  }

  function drawChart(labels, data, label) {
    if (chart) chart.destroy();
    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#ffffff' : '#000000';
    const gridColor = isDark ? '#444' : '#ccc';

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: '#007bff',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: textColor }
          },
          tooltip: {
            bodyColor: textColor,
            titleColor: textColor,
            backgroundColor: isDark ? '#333' : '#fff'
          }
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  // Initialize everything
  populateCurrencySelectors();
  getExchangeRate();
  getHistoricalData();

  // Event listeners
  themeToggle.addEventListener('change', () => {
    toggleDarkMode();
    getHistoricalData();
  });
  fromCurrency.addEventListener('change', () => {
    getExchangeRate();
    getHistoricalData();
  });
  toCurrency.addEventListener('change', () => {
    getExchangeRate();
    getHistoricalData();
  });
  amountInput.addEventListener('input', getExchangeRate);
  swapBtn.addEventListener('click', swapCurrencies);
  refreshBtn.addEventListener('click', () => {
    getExchangeRate();
    getHistoricalData();
  });
});
