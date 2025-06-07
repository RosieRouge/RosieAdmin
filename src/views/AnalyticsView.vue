<template>
  <div class="analytics-view">
    <!-- Header with Actions -->
    <div class="header-section">
      <div class="header-left">
        <h2>Analytics Dashboard</h2>
        <p>Real-time insights and platform metrics</p>
      </div>
      <div class="header-actions">
        <div class="time-range-selector">
          <select v-model="selectedTimeRange" @change="loadAnalytics">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <button @click="refreshData" class="btn secondary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          <span class="btn-text">Refresh</span>
        </button>
        <button @click="exportAnalytics" class="btn secondary">
          <i class="fas fa-download"></i>
          <span class="btn-text">Export</span>
        </button>
      </div>
    </div>

    <!-- Real-time Stats Grid -->
    <div class="realtime-section">
      <div class="section-header">
        <h3>
          <i class="fas fa-broadcast-tower"></i>
          Live Metrics
        </h3>
        <span class="last-updated">
          Last updated: {{ formatTime(lastUpdated) }}
          <i class="fas fa-circle live-indicator"></i>
        </span>
      </div>
      
      <div class="realtime-grid">
        <div class="metric-card users">
          <div class="metric-icon">
            <i class="fas fa-user-plus"></i>
          </div>
          <div class="metric-info">
            <h4>{{ newUsersToday }}</h4>
            <p>New Users Today</p>
            <span class="metric-change" :class="getUsersChangeClass()">
              {{ formatChange(usersChangePercent) }}% vs yesterday
            </span>
          </div>
          <div class="metric-chart">
            <div class="mini-chart">
              <div v-for="(value, index) in usersChartData" :key="index" 
                   class="chart-bar" 
                   :style="{ height: `${(value / Math.max(...usersChartData)) * 100}%` }">
              </div>
            </div>
          </div>
        </div>

        <div class="metric-card active">
          <div class="metric-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="metric-info">
            <h4>{{ activeUsersOnline }}</h4>
            <p>Active Users Online</p>
            <span class="metric-change positive">
              Peak: {{ peakActiveUsers }} today
            </span>
          </div>
          <div class="metric-pulse">
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
          </div>
        </div>

        <div class="metric-card messages">
          <div class="metric-icon">
            <i class="fas fa-envelope"></i>
          </div>
          <div class="metric-info">
            <h4>{{ messagesSentToday }}</h4>
            <p>Messages Sent Today</p>
            <span class="metric-change" :class="getMessagesChangeClass()">
              {{ formatChange(messagesChangePercent) }}% vs yesterday
            </span>
          </div>
          <div class="metric-trend">
            <i class="fas" :class="getMessagesTrendIcon()"></i>
            <span>{{ messagesTrend }}</span>
          </div>
        </div>

        <div class="metric-card events">
          <div class="metric-icon">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="metric-info">
            <h4>{{ eventsCreatedToday }}</h4>
            <p>Events Created Today</p>
            <span class="metric-change">
              {{ upcomingEvents }} upcoming
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="overview-section">
      <div class="section-header">
        <h3>
          <i class="fas fa-chart-line"></i>
          Platform Overview
        </h3>
        <div class="view-toggle">
          <button @click="chartView = 'daily'" :class="{ active: chartView === 'daily' }" class="toggle-btn">Daily</button>
          <button @click="chartView = 'weekly'" :class="{ active: chartView === 'weekly' }" class="toggle-btn">Weekly</button>
          <button @click="chartView = 'monthly'" :class="{ active: chartView === 'monthly' }" class="toggle-btn">Monthly</button>
        </div>
      </div>
      
      <div class="overview-grid">
        <div class="overview-card total-users">
          <div class="card-header">
            <h4>Total Users</h4>
            <div class="card-icon">
              <i class="fas fa-users"></i>
            </div>
          </div>
          <div class="card-value">{{ totalUsers.toLocaleString() }}</div>
          <div class="card-growth" :class="getGrowthClass(userGrowthPercent)">
            <i class="fas" :class="getGrowthIcon(userGrowthPercent)"></i>
            {{ formatGrowth(userGrowthPercent) }}% this {{ selectedTimeRange }}
          </div>
          <div class="card-chart">
            <div class="growth-line" :style="{ width: Math.abs(userGrowthPercent) * 2 + '%' }"></div>
          </div>
        </div>

        <div class="overview-card total-communities">
          <div class="card-header">
            <h4>Total Communities</h4>
            <div class="card-icon">
              <i class="fas fa-layer-group"></i>
            </div>
          </div>
          <div class="card-value">{{ totalCommunities.toLocaleString() }}</div>
          <div class="card-growth" :class="getGrowthClass(communityGrowthPercent)">
            <i class="fas" :class="getGrowthIcon(communityGrowthPercent)"></i>
            {{ formatGrowth(communityGrowthPercent) }}% this {{ selectedTimeRange }}
          </div>
          <div class="card-chart">
            <div class="growth-line" :style="{ width: Math.abs(communityGrowthPercent) * 2 + '%' }"></div>
          </div>
        </div>

        <div class="overview-card total-events">
          <div class="card-header">
            <h4>Total Events</h4>
            <div class="card-icon">
              <i class="fas fa-calendar"></i>
            </div>
          </div>
          <div class="card-value">{{ totalEvents.toLocaleString() }}</div>
          <div class="card-growth" :class="getGrowthClass(eventGrowthPercent)">
            <i class="fas" :class="getGrowthIcon(eventGrowthPercent)"></i>
            {{ formatGrowth(eventGrowthPercent) }}% this {{ selectedTimeRange }}
          </div>
          <div class="card-chart">
            <div class="growth-line" :style="{ width: Math.abs(eventGrowthPercent) * 2 + '%' }"></div>
          </div>
        </div>

        <div class="overview-card engagement">
          <div class="card-header">
            <h4>Engagement Rate</h4>
            <div class="card-icon">
              <i class="fas fa-heart"></i>
            </div>
          </div>
          <div class="card-value">{{ engagementRate }}%</div>
          <div class="card-growth" :class="getGrowthClass(engagementGrowth)">
            <i class="fas" :class="getGrowthIcon(engagementGrowth)"></i>
            {{ formatGrowth(engagementGrowth) }}% this {{ selectedTimeRange }}
          </div>
          <div class="card-chart">
            <div class="engagement-ring">
              <div class="ring-fill" :style="{ strokeDasharray: `${engagementRate * 2.51}, 251` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Analytics -->
    <div class="details-section">
      <div class="analytics-tabs">
        <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }" class="tab-btn">
          <i class="fas fa-users"></i>
          User Analytics
        </button>
        <button @click="activeTab = 'content'" :class="{ active: activeTab === 'content' }" class="tab-btn">
          <i class="fas fa-content"></i>
          Content Analytics
        </button>
        <button @click="activeTab = 'performance'" :class="{ active: activeTab === 'performance' }" class="tab-btn">
          <i class="fas fa-tachometer-alt"></i>
          Performance
        </button>
      </div>

      <div class="tab-content">
        <!-- User Analytics Tab -->
        <div v-if="activeTab === 'users'" class="analytics-panel">
          <div class="panel-grid">
            <div class="analytics-chart">
              <h4>User Growth Trend</h4>
              <div class="chart-container">
                <div class="chart-placeholder">
                  <i class="fas fa-chart-area"></i>
                  <p>User growth chart would be rendered here</p>
                  <small>Shows new user registrations over time</small>
                </div>
              </div>
            </div>
            
            <div class="analytics-breakdown">
              <h4>User Demographics</h4>
              <div class="breakdown-list">
                <div class="breakdown-item">
                  <span class="label">Active Users</span>
                  <span class="value">{{ activeUsers.toLocaleString() }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (activeUsers / totalUsers) * 100 + '%' }"></div>
                  </div>
                </div>
                <div class="breakdown-item">
                  <span class="label">Dormant Users</span>
                  <span class="value">{{ dormantUsers.toLocaleString() }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill dormant" :style="{ width: (dormantUsers / totalUsers) * 100 + '%' }"></div>
                  </div>
                </div>
                <div class="breakdown-item">
                  <span class="label">New This Week</span>
                  <span class="value">{{ newUsersThisWeek.toLocaleString() }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill new" :style="{ width: (newUsersThisWeek / totalUsers) * 100 + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Analytics Tab -->
        <div v-if="activeTab === 'content'" class="analytics-panel">
          <div class="panel-grid">
            <div class="content-metrics">
              <h4>Content Distribution</h4>
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-icon">
                    <i class="fas fa-comments"></i>
                  </div>
                  <div class="metric-data">
                    <span class="metric-number">{{ totalMessages.toLocaleString() }}</span>
                    <span class="metric-label">Total Messages</span>
                  </div>
                </div>
                <div class="metric-item">
                  <div class="metric-icon">
                    <i class="fas fa-layer-group"></i>
                  </div>
                  <div class="metric-data">
                    <span class="metric-number">{{ totalTopics.toLocaleString() }}</span>
                    <span class="metric-label">Total Topics</span>
                  </div>
                </div>
                <div class="metric-item">
                  <div class="metric-icon">
                    <i class="fas fa-flag"></i>
                  </div>
                  <div class="metric-data">
                    <span class="metric-number">{{ flaggedContent }}</span>
                    <span class="metric-label">Flagged Content</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="top-communities">
              <h4>Most Active Communities</h4>
              <div class="community-list">
                <div v-for="(community, index) in topCommunities" :key="community.id" class="community-item">
                  <div class="rank">{{ index + 1 }}</div>
                  <div class="community-info">
                    <div class="community-name">{{ community.name }}</div>
                    <div class="community-stats">{{ community.message_count }} messages</div>
                  </div>
                  <div class="activity-indicator">
                    <div class="activity-bar" :style="{ width: (community.message_count / topCommunities[0].message_count) * 100 + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Tab -->
        <div v-if="activeTab === 'performance'" class="analytics-panel">
          <div class="performance-metrics">
            <h4>System Performance</h4>
            <div class="performance-grid">
              <div class="performance-card">
                <div class="perf-header">
                  <span class="perf-title">Response Time</span>
                  <span class="perf-status good">Good</span>
                </div>
                <div class="perf-value">{{ avgResponseTime }}ms</div>
                <div class="perf-chart">
                  <div class="perf-bar" :style="{ width: Math.min((avgResponseTime / 1000) * 100, 100) + '%' }"></div>
                </div>
              </div>
              
              <div class="performance-card">
                <div class="perf-header">
                  <span class="perf-title">Uptime</span>
                  <span class="perf-status excellent">Excellent</span>
                </div>
                <div class="perf-value">{{ uptime }}%</div>
                <div class="perf-chart">
                  <div class="perf-bar uptime" :style="{ width: uptime + '%' }"></div>
                </div>
              </div>
              
              <div class="performance-card">
                <div class="perf-header">
                  <span class="perf-title">Error Rate</span>
                  <span class="perf-status" :class="errorRate > 1 ? 'warning' : 'good'">{{ errorRate > 1 ? 'Warning' : 'Good' }}</span>
                </div>
                <div class="perf-value">{{ errorRate }}%</div>
                <div class="perf-chart">
                  <div class="perf-bar error" :style="{ width: Math.min(errorRate * 10, 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

// Component state
const loading = ref(false)
const selectedTimeRange = ref('today')
const chartView = ref('daily')
const activeTab = ref('users')
const lastUpdated = ref(new Date())

// Real-time metrics
const newUsersToday = ref(0)
const activeUsersOnline = ref(0)
const messagesSentToday = ref(0)
const eventsCreatedToday = ref(0)
const peakActiveUsers = ref(0)
const upcomingEvents = ref(0)

// Overview stats
const totalUsers = ref(0)
const totalCommunities = ref(0)
const totalEvents = ref(0)
const totalMessages = ref(0)
const totalTopics = ref(0)
const flaggedContent = ref(0)

// Growth percentages
const usersChangePercent = ref(0)
const messagesChangePercent = ref(0)
const userGrowthPercent = ref(0)
const communityGrowthPercent = ref(0)
const eventGrowthPercent = ref(0)
const engagementRate = ref(0)
const engagementGrowth = ref(0)

// Chart data
const usersChartData = ref([45, 52, 48, 61, 58, 69, 73])
const messagesTrend = ref('Increasing')

// User analytics
const activeUsers = ref(0)
const dormantUsers = ref(0)
const newUsersThisWeek = ref(0)

// Top communities
const topCommunities = ref<any[]>([])

// Performance metrics
const avgResponseTime = ref(245)
const uptime = ref(99.9)
const errorRate = ref(0.3)

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await loadAnalytics()
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

const startAutoRefresh = () => {
  // Refresh real-time metrics every 30 seconds
  refreshInterval = setInterval(async () => {
    await loadRealTimeMetrics()
    lastUpdated.value = new Date()
  }, 30000)
}

const loadAnalytics = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadRealTimeMetrics(),
      loadOverviewStats(),
      loadUserAnalytics(),
      loadTopCommunities()
    ])
  } catch (error) {
    console.error('Error loading analytics:', error)
  } finally {
    loading.value = false
    lastUpdated.value = new Date()
  }
}

const loadRealTimeMetrics = async () => {
  try {
    // Get analytics from the realtime view
    const { data: realtimeData } = await supabase
      .from('analytics_realtime')
      .select('*')
      .single()
    
    if (realtimeData) {
      newUsersToday.value = realtimeData.new_users_today || 0
      messagesSentToday.value = realtimeData.messages_sent_today || 0
      eventsCreatedToday.value = realtimeData.events_created_today || 0
      activeUsersOnline.value = realtimeData.active_users_24h || 0
    }
    
    // Mock some additional real-time data
    peakActiveUsers.value = Math.floor(activeUsersOnline.value * 1.5)
    upcomingEvents.value = Math.floor(eventsCreatedToday.value * 2.3)
    
    // Calculate change percentages (mock data for now)
    usersChangePercent.value = Math.random() * 20 - 5 // -5% to +15%
    messagesChangePercent.value = Math.random() * 30 - 10 // -10% to +20%
  } catch (error) {
    console.error('Error loading real-time metrics:', error)
  }
}

const loadOverviewStats = async () => {
  try {
    const { data: realtimeData } = await supabase
      .from('analytics_realtime')
      .select('*')
      .single()
    
    if (realtimeData) {
      totalUsers.value = realtimeData.total_users || 0
      totalCommunities.value = realtimeData.total_communities || 0
      totalEvents.value = realtimeData.total_events || 0
    }
    
    // Get message and topic counts
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
    
    const { count: topicCount } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
    
    const { count: flaggedCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'flagged')
    
    totalMessages.value = messageCount || 0
    totalTopics.value = topicCount || 0
    flaggedContent.value = flaggedCount || 0
    
    // Mock growth percentages
    userGrowthPercent.value = 12.5
    communityGrowthPercent.value = 8.3
    eventGrowthPercent.value = 15.7
    engagementRate.value = 73
    engagementGrowth.value = 5.2
  } catch (error) {
    console.error('Error loading overview stats:', error)
  }
}

const loadUserAnalytics = async () => {
  try {
    // Mock user analytics data
    activeUsers.value = Math.floor(totalUsers.value * 0.65)
    dormantUsers.value = Math.floor(totalUsers.value * 0.25)
    newUsersThisWeek.value = Math.floor(totalUsers.value * 0.1)
  } catch (error) {
    console.error('Error loading user analytics:', error)
  }
}

const loadTopCommunities = async () => {
  try {
    // Get top communities by message count (simplified)
    const { data } = await supabase
      .from('communities')
      .select('id, name')
      .eq('status', 'active')
      .limit(5)
    
    if (data) {
      topCommunities.value = data.map((community, index) => ({
        ...community,
        message_count: Math.floor(Math.random() * 1000) + 100 - (index * 50)
      })).sort((a, b) => b.message_count - a.message_count)
    }
  } catch (error) {
    console.error('Error loading top communities:', error)
  }
}

const refreshData = async () => {
  await loadAnalytics()
}

const exportAnalytics = () => {
  console.log('Export analytics data')
  // Implement export functionality
}

// Helper methods
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

const formatChange = (value: number) => {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
}

const formatGrowth = (value: number) => {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
}

const getUsersChangeClass = () => {
  return usersChangePercent.value > 0 ? 'positive' : usersChangePercent.value < 0 ? 'negative' : 'neutral'
}

const getMessagesChangeClass = () => {
  return messagesChangePercent.value > 0 ? 'positive' : messagesChangePercent.value < 0 ? 'negative' : 'neutral'
}

const getMessagesTrendIcon = () => {
  return messagesChangePercent.value > 0 ? 'fa-trending-up' : messagesChangePercent.value < 0 ? 'fa-trending-down' : 'fa-minus'
}

const getGrowthClass = (value: number) => {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
}

const getGrowthIcon = (value: number) => {
  return value > 0 ? 'fa-arrow-up' : value < 0 ? 'fa-arrow-down' : 'fa-minus'
}
</script>

<style scoped>
.analytics-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.header p {
  margin: 0;
  color: #7f8c8d;
}

.coming-soon {
  background: white;
  padding: 4rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.coming-soon i {
  font-size: 4rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.coming-soon h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.coming-soon p {
  color: #7f8c8d;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .analytics-view {
    gap: 1.5rem;
  }
  
  .header {
    padding: 1.5rem;
  }
  
  .header h2 {
    font-size: 1.25rem;
  }
  
  .header p {
    font-size: 0.9rem;
  }
  
  .coming-soon {
    padding: 3rem 1.5rem;
  }
  
  .coming-soon i {
    font-size: 3rem;
  }
  
  .coming-soon h3 {
    font-size: 1.25rem;
  }
  
  .coming-soon p {
    font-size: 0.9rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .analytics-view {
    gap: 1rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header h2 {
    font-size: 1.1rem;
  }
  
  .coming-soon {
    padding: 2rem 1rem;
  }
  
  .coming-soon i {
    font-size: 2.5rem;
  }
  
  .coming-soon h3 {
    font-size: 1.1rem;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .header,
  .coming-soon {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style> 