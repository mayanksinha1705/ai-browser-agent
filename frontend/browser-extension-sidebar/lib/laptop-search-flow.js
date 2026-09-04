export const LAPTOP_SEARCH_FLOW = {
  id: 'laptop-search',
  name: 'Laptop Search',
  userMessage: 'Find the best laptop under ₹70,000 for gaming',
  steps: [
    { id: '1', label: 'Understanding your request' },
    { id: '2', label: 'Opening Google Search' },
    { id: '3', label: 'Searching "best gaming laptop under 70000 INR"' },
    { id: '4', label: 'Opening shopping results' },
    { id: '5', label: 'Analyzing laptop options' },
    { id: '6', label: 'Comparing specifications' },
    { id: '7', label: 'Checking RTX 4060 models' },
    { id: '8', label: 'Extracting price data' },
    { id: '9', label: 'Reading reviews' },
    { id: '10', label: 'Preparing recommendation' },
  ],
  result: {
    type: 'laptop-comparison',
    data: [
      {
        name: 'ASUS TUF Gaming A15',
        price: '₹68,990',
        specs: 'RTX 4060 • Ryzen 7 • 16GB RAM • 512GB SSD',
        rating: 4.5,
        link: '#'
      },
      {
        name: 'Lenovo LOQ 15',
        price: '₹69,490',
        specs: 'RTX 4060 • i5-12450H • 16GB RAM • 512GB SSD',
        rating: 4.3,
        link: '#'
      },
      {
        name: 'Acer Nitro 5',
        price: '₹67,999',
        specs: 'RTX 4050 • Ryzen 5 • 16GB RAM • 512GB SSD',
        rating: 4.4,
        link: '#'
      }
    ]
  }
};
