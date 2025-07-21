// src/api.js

// API модуль для интеграции с n8n webhook
const API_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-webhook-url.com'

export const fetchContacts = async () => {
  try {
    // Вызов к n8n webhook для получения данных из Airtable
    const response = await fetch(`${API_BASE_URL}/airtable`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Преобразуем данные из формата n8n в формат приложения
    return data.map(item => ({
      id: item["№"] || item.id || Math.random().toString(36).substr(2, 9),
      Name: item["Имя"] || item.Name || '',
      Email: item.Email || '',
      Phone: item["Телефон"] || item.Phone || '',
      City: item["Город"] || item.City || '',
      Date: item["Дата"] || item.Date || '',
      Value: parseFloat(item["Сумма(USD)"] || item.Value || 0),
      Notes: item.Notes || item["Заметки"] || '',
      "Contact Summary": item["Contact Summary"] || `${item["Имя"] || item.Name} из ${item["Город"] || item.City}`,
      "City Insights": item["City Insights"] || `Информация о городе ${item["Город"] || item.City}`
    }))
  } catch (error) {
    console.error('Ошибка при загрузке контактов:', error)
    
    // Fallback к тестовым данным если API недоступен
    console.warn('Используются тестовые данные из-за ошибки API')
    return [
      {
        id: "1",
        Name: "Alice Johnson",
        Email: "alice.johnson@examplec3cc.com",
        Phone: "+123456789",
        City: "San Francisco",
        Date: "18.7.2025",
        Value: 1500,
        Notes: "Met at tech conference, interested in collaboration on AI projects.",
        "Contact Summary": "Alice Johnson from San Francisco, interested in AI projects.",
        "City Insights": "San Francisco is a tech hub with growing opportunities."
      },
      {
        id: "2",
        Name: "Bob Smith",
        Email: "bob.smith@techcorpb8c0.com",
        Phone: "+987654321",
        City: "New York",
        Date: "15.1.2025",
        Value: 2000,
        Notes: "Potential client, follow up with proposal next week.",
        "Contact Summary": "Bob Smith from New York, potential client for IT services.",
        "City Insights": "New York is a major business center with diverse industries."
      },
      {
        id: "3",
        Name: "Catherine Lee",
        Email: "catherine.lee@learnhubefbe.com",
        Phone: "+192837465",
        City: "Los Angeles",
        Date: "10.2.2025",
        Value: 2500,
        Notes: "Discussed partnership for online learning platform.",
        "Contact Summary": "Catherine Lee from Los Angeles, interested in online learning collaboration.",
        "City Insights": "Los Angeles has a vibrant tech and education sector."
      },
      {
        id: "4",
        Name: "David Kim",
        Email: "david.kim@cloudnetdf05.com",
        Phone: "+564738291",
        City: "Seattle",
        Date: "2.6.2025",
        Value: 3000,
        Notes: "Interested in cloud solutions, send details by end of month.",
        "Contact Summary": "David Kim from Seattle, interested in cloud solutions.",
        "City Insights": "Seattle is known for its tech innovation and cloud services."
      },
      {
        id: "5",
        Name: "Eva Martinez",
        Email: "eva.martinez@startuplab1477.com",
        Phone: "+135792468",
        City: "Austin",
        Date: "12.7.2025",
        Value: 1800,
        Notes: "Looking for IT support services for her startup.",
        "Contact Summary": "Eva Martinez from Austin, seeking IT support for her startup.",
        "City Insights": "Austin is a growing hub for startups and tech companies."
      }
    ]
  }
}

export const exportContacts = (contacts) => {
  // Функция экспорта в CSV
  const headers = ['Имя', 'Email', 'Телефон', 'Город', 'Сумма', 'Дата']
  const csvContent = [
    headers.join(','),
    ...contacts.map(contact => [
      contact.Name,
      contact.Email,
      contact.Phone,
      contact.City,
      contact.Value,
      contact.Date
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'contacts.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Функция для обновления данных в реальном времени
export const setupAutoRefresh = (callback, intervalMs = 30000) => {
  const interval = setInterval(async () => {
    try {
      const contacts = await fetchContacts()
      callback(contacts)
    } catch (error) {
      console.error('Ошибка автообновления:', error)
    }
  }, intervalMs)
  
  return () => clearInterval(interval)
}

