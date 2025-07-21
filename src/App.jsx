import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Download, Users, DollarSign, MapPin, Calendar, TrendingUp, BarChart3, PieChart, Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Pie } from 'recharts'
import { fetchContacts, exportContacts, setupAutoRefresh } from './api.js'
import './App.css'

// Цвета для графиков
const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']

function App() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedContact, setSelectedContact] = useState(null)
  const [animatedStats, setAnimatedStats] = useState({
    totalContacts: 0,
    totalValue: 0,
    avgValue: 0,
    uniqueCities: 0
  })

  // Загрузка данных из n8n при монтировании компонента
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchContacts()
        setContacts(data)
      } catch (err) {
        setError('Ошибка загрузки данных: ' + err.message)
        console.error('Ошибка загрузки контактов:', err)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()

    // Настройка автообновления каждые 30 секунд
    const cleanup = setupAutoRefresh(setContacts, 30000)
    
    return cleanup
  }, [])

  // Функция ручного обновления
  const handleRefresh = async () => {
    try {
      setLoading(true)
      const data = await fetchContacts()
      setContacts(data)
    } catch (err) {
      setError('Ошибка обновления данных: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Функция экспорта
  const handleExport = () => {
    exportContacts(filteredAndSortedContacts)
  }

  // Получение уникальных городов для фильтра
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(contacts.map(contact => contact.City))]
    return uniqueCities.sort()
  }, [contacts])

  // Фильтрация и сортировка контактов
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = contact.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contact.City.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCity = cityFilter === 'all' || contact.City === cityFilter
      return matchesSearch && matchesCity
    })

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.Name.toLowerCase()
          bValue = b.Name.toLowerCase()
          break
        case 'value':
          aValue = a.Value
          bValue = b.Value
          break
        case 'date':
          aValue = new Date(a.Date.split('.').reverse().join('-'))
          bValue = new Date(b.Date.split('.').reverse().join('-'))
          break
        case 'city':
          aValue = a.City.toLowerCase()
          bValue = b.City.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [contacts, searchTerm, cityFilter, sortBy, sortOrder])

  // Статистика
  const stats = useMemo(() => {
    const totalContacts = filteredAndSortedContacts.length
    const totalValue = filteredAndSortedContacts.reduce((sum, contact) => sum + contact.Value, 0)
    const avgValue = totalContacts > 0 ? totalValue / totalContacts : 0
    const uniqueCities = new Set(filteredAndSortedContacts.map(c => c.City)).size

    return { totalContacts, totalValue, avgValue, uniqueCities }
  }, [filteredAndSortedContacts])

  // Данные для графиков
  const cityData = useMemo(() => {
    const cityStats = {}
    filteredAndSortedContacts.forEach(contact => {
      if (!cityStats[contact.City]) {
        cityStats[contact.City] = { name: contact.City, value: 0, count: 0 }
      }
      cityStats[contact.City].value += contact.Value
      cityStats[contact.City].count += 1
    })
    return Object.values(cityStats)
  }, [filteredAndSortedContacts])

  const monthlyData = useMemo(() => {
    const monthStats = {}
    filteredAndSortedContacts.forEach(contact => {
      const [day, month, year] = contact.Date.split('.')
      const monthKey = `${month}/${year}`
      if (!monthStats[monthKey]) {
        monthStats[monthKey] = { month: monthKey, value: 0, count: 0 }
      }
      monthStats[monthKey].value += contact.Value
      monthStats[monthKey].count += 1
    })
    return Object.values(monthStats).sort((a, b) => {
      const [monthA, yearA] = a.month.split('/')
      const [monthB, yearB] = b.month.split('/')
      return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1)
    })
  }, [filteredAndSortedContacts])

  // Анимация статистики
  useEffect(() => {
    const duration = 1000
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        totalContacts: Math.floor(stats.totalContacts * progress),
        totalValue: Math.floor(stats.totalValue * progress),
        avgValue: Math.floor(stats.avgValue * progress),
        uniqueCities: Math.floor(stats.uniqueCities * progress)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setAnimatedStats(stats)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [stats])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Дашборд контактов
              </h1>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button 
                onClick={handleExport}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading и Error состояния */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-white">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Загрузка данных из Airtable...</span>
            </div>
          </div>
        )}

        {error && (
          <Card className="backdrop-blur-md bg-red-500/10 border-red-500/20 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-300">
                <span className="text-red-400">⚠️</span>
                <span>{error}</span>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="ml-auto bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                >
                  Повторить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && contacts.length === 0 && !error && (
          <Card className="backdrop-blur-md bg-white/10 border-white/20 mb-8">
            <CardContent className="p-8 text-center">
              <div className="text-white/70">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Нет данных</h3>
                <p>Контакты не найдены. Проверьте подключение к Airtable через n8n.</p>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Всего контактов</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{animatedStats.totalContacts}</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% от прошлого месяца
              </div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Общая сумма</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatCurrency(animatedStats.totalValue)}</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% от прошлого месяца
              </div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Средняя сумма</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatCurrency(animatedStats.avgValue)}</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5% от прошлого месяца
              </div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Городов</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{animatedStats.uniqueCities}</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <Activity className="h-3 w-3 mr-1" />
                Активные регионы
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* City Distribution Chart */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <PieChart className="h-5 w-5" />
                Распределение по городам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={cityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {cityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Сумма']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trends Chart */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5" />
                Динамика по месяцам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Сумма']}
                  />
                  <Bar dataKey="value" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#764ba2" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5" />
              Фильтры и поиск
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                  <Input
                    placeholder="Поиск по имени, email или городу..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                  />
                </div>
              </div>
              
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="all">Все города</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Сортировать по" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="name">Имя</SelectItem>
                  <SelectItem value="value">Сумма</SelectItem>
                  <SelectItem value="date">Дата</SelectItem>
                  <SelectItem value="city">Город</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Контакты</CardTitle>
            <CardDescription className="text-white/70">
              Показано {filteredAndSortedContacts.length} из {contacts.length} контактов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead 
                      className="cursor-pointer hover:bg-white/10 text-white/80 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      Имя {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-white/80">Email</TableHead>
                    <TableHead className="text-white/80">Телефон</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-white/10 text-white/80 transition-colors"
                      onClick={() => handleSort('city')}
                    >
                      Город {sortBy === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-white/10 text-white/80 transition-colors"
                      onClick={() => handleSort('value')}
                    >
                      Сумма {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-white/10 text-white/80 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-white/80">Заметки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedContacts.map((contact) => (
                    <TableRow 
                      key={contact.id}
                      className="border-white/20 hover:bg-white/10 cursor-pointer transition-all duration-200 group"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <TableCell className="font-medium text-white group-hover:text-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {contact.Name.charAt(0)}
                          </div>
                          {contact.Name}
                        </div>
                      </TableCell>
                      <TableCell className="text-blue-300 group-hover:text-blue-200">{contact.Email}</TableCell>
                      <TableCell className="text-white/80">{contact.Phone}</TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30">
                          {contact.City}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-400">
                        {formatCurrency(contact.Value)}
                      </TableCell>
                      <TableCell className="text-white/80">{contact.Date}</TableCell>
                      <TableCell className="max-w-xs truncate text-white/70">
                        {contact.Notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details Modal */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {selectedContact.Name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{selectedContact.Name}</CardTitle>
                      <CardDescription className="text-white/70">{selectedContact["Contact Summary"]}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedContact(null)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white/60 mb-1">Email</h4>
                    <p className="text-blue-300 bg-white/5 p-3 rounded-lg">{selectedContact.Email}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white/60 mb-1">Телефон</h4>
                    <p className="text-white bg-white/5 p-3 rounded-lg">{selectedContact.Phone}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white/60 mb-1">Город</h4>
                    <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 p-3">
                      {selectedContact.City}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white/60 mb-1">Сумма</h4>
                    <p className="font-semibold text-green-400 bg-white/5 p-3 rounded-lg">{formatCurrency(selectedContact.Value)}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white/60 mb-1">Дата</h4>
                    <p className="flex items-center gap-2 text-white bg-white/5 p-3 rounded-lg">
                      <Calendar className="h-4 w-4" />
                      {selectedContact.Date}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-white/60">Заметки</h4>
                  <p className="text-white/90 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                    {selectedContact.Notes}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-white/60">Информация о городе</h4>
                  <p className="text-white/90 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                    {selectedContact["City Insights"]}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

