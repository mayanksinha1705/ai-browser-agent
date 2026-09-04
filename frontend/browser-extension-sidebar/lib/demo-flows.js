import { AGENT_STATUS, AGENT_EVENTS, STEP_STATUS } from '@/lib/constants';

// Demo Flow 1: Laptop Search
export const LAPTOP_SEARCH_FLOW = {
  id: 'laptop-search',
  name: 'Laptop Search',
  userMessage: 'Find the best laptop under ₹70,000 for gaming',
  steps: [
    { id: 1, label: 'Understanding request', duration: 1000 },
    { id: 2, label: 'Opening Google', duration: 1000, action: { type: 'navigate', url: 'google.com' } },
    { id: 3, label: 'Searching "best gaming laptop under 70000 INR"', duration: 2000, action: { type: 'search', query: 'best gaming laptop under 70000 INR' } },
    { id: 4, label: 'Navigating to shopping results', duration: 1500, action: { type: 'click', element: 'Shopping' } },
    { id: 5, label: 'Analyzing laptop options', duration: 2000 },
    { id: 6, label: 'Comparing specifications', duration: 2000 },
    { id: 7, label: 'Checking RTX 4060 models', duration: 1500 },
    { id: 8, label: 'Extracting price data', duration: 1000 },
    { id: 9, label: 'Reading reviews', duration: 1500 },
    { id: 10, label: 'Preparing recommendation', duration: 1500 },
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

// Demo Flow 2: Form Filling
export const FORM_FILLING_FLOW = {
  id: 'form-filling',
  name: 'Form Filling',
  userMessage: 'Help me fill out this job application form',
  steps: [
    { id: 1, label: 'Analyzing form structure', duration: 1500 },
    { id: 2, label: 'Reading required fields', duration: 1000 },
    { id: 3, label: 'Filling: Name field', duration: 1000, action: { type: 'type', field: 'name', value: 'John Doe' } },
    { id: 4, label: 'Filling: Email field', duration: 1000, action: { type: 'type', field: 'email', value: 'john.doe@email.com' } },
    { id: 5, label: 'Filling: Phone number', duration: 1000, action: { type: 'type', field: 'phone', value: '+91 98765 43210' } },
    { id: 6, label: 'Filling: Experience section', duration: 2000, action: { type: 'type', field: 'experience', value: '5 years in software development' } },
    { id: 7, label: 'Uploading resume', duration: 1500, action: { type: 'upload', file: 'resume.pdf' } },
    { id: 8, label: 'Ready to submit', duration: 500, requiresConfirmation: true },
  ],
  confirmation: {
    title: 'Confirmation required',
    message: 'Ready to submit this application to ABC Company.',
    details: [
      'Name: John Doe',
      'Email: john.doe@email.com',
      'Phone: +91 98765 43210',
      'Experience: 5 years in software development',
      'Resume: resume.pdf attached'
    ]
  },
  postConfirmationSteps: [
    { id: 9, label: 'Submitting form', duration: 1000 },
    { id: 10, label: 'Task completed', duration: 500 },
  ],
  result: {
    type: 'success',
    message: 'Application submitted successfully! You should receive a confirmation email within 24 hours.'
  }
};
