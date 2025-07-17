<template>
  <div class="analytics-view">
    <!-- Header with Actions -->
    <div class="header-section">
      <div class="header-left">
        <h2>Analytics Dashboard</h2>
        <p>Abortion support platform insights and metrics</p>
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
          <i class="fas fa-arrows-rotate" :class="{ 'fa-spin': loading }"></i>
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
          <i class="fas fa-tower-broadcast"></i>
          Live Support Metrics
        </h3>
        <span class="last-updated">
          Last updated: {{ formatTime(lastUpdated) }}
          <i class="fas fa-circle live-indicator"></i>
        </span>
      </div>
      
      <div class="realtime-grid">
        <div class="metric-card clients">
          <div class="metric-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="metric-info">
            <h4>{{ newClientsToday }}</h4>
            <p>New Clients Today</p>
            <span class="metric-change" :class="getClientsChangeClass()">
              {{ formatChange(clientsChangePercent) }}% vs yesterday
            </span>
          </div>
          <div class="metric-chart">
            <div class="mini-chart">
              <div v-for="(value, index) in clientsChartData" :key="index" 
                   class="chart-bar" 
                   :style="{ height: `${(value / Math.max(...clientsChartData)) * 100}%` }">
              </div>
            </div>
          </div>
        </div>

        <div class="metric-card active">
          <div class="metric-icon">
            <i class="fas fa-user-md"></i>
          </div>
          <div class="metric-info">
            <h4>{{ activeCounselors }}</h4>
            <p>Active Counselors</p>
            <span class="metric-change positive">
              {{ totalCounselors }} total available
            </span>
          </div>
          <div class="metric-pulse">
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
          </div>
        </div>

        <div class="metric-card crisis">
          <div class="metric-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="metric-info">
            <h4>{{ crisisAlertsToday }}</h4>
            <p>Crisis Alerts Today</p>
            <span class="metric-change" :class="getCrisisChangeClass()">
              {{ activeCrisisAlerts }} active now
            </span>
          </div>
          <div class="metric-trend">
            <i class="fas" :class="getCrisisTrendIcon()"></i>
            <span>{{ crisisTrend }}</span>
          </div>
        </div>

        <div class="metric-card resources">
          <div class="metric-icon">
            <i class="fas fa-book-medical"></i>
          </div>
          <div class="metric-info">
            <h4>{{ resourcesAccessedToday }}</h4>
            <p>Resources Accessed</p>
            <span class="metric-change">
              {{ totalResources }} total available
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
            <h4>Support Groups</h4>
            <div class="card-icon">
              <i class="fas fa-heart-pulse"></i>
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
            <h4>Resources Available</h4>
            <div class="card-icon">
              <i class="fas fa-book-medical"></i>
            </div>
          </div>
          <div class="card-value">{{ totalResources.toLocaleString() }}</div>
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
          <i class="fas fa-newspaper"></i>
          Content Analytics
        </button>
        <button @click="activeTab = 'performance'" :class="{ active: activeTab === 'performance' }" class="tab-btn">
          <i class="fas fa-gauge"></i>
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
                  <i class="fas fa-chart-line"></i>
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
              <h4>Most Active Support Groups</h4>
              <div class="community-list">
                <div v-for="(community, index) in topCommunities" :key="community.id" class="community-item">
                  <div class="rank">{{ index + 1 }}</div>
                  <div class="community-info">
                    <div class="community-name">{{ community.name }}</div>
                    <div class="community-stats">{{ community.member_count }} members</div>
                  </div>
                  <div class="activity-indicator">
                    <div class="activity-bar" :style="{ width: (community.member_count / (topCommunities[0]?.member_count || 1)) * 100 + '%' }"></div>
                  </div>
                </div>
                <div v-if="topCommunities.length === 0" class="empty-state">
                  <i class="fas fa-heart-pulse"></i>
                  <p>No support groups found</p>
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
const newClientsToday = ref(0)
const activeCounselors = ref(0)
const totalCounselors = ref(0)
const crisisAlertsToday = ref(0)
const activeCrisisAlerts = ref(0)
const resourcesAccessedToday = ref(0)
const totalResources = ref(0)

// Overview stats
const totalUsers = ref(0)
const totalCommunities = ref(0)
const totalEvents = ref(0)
const totalMessages = ref(0)
const totalTopics = ref(0)
const flaggedContent = ref(0)

// Growth percentages
const clientsChangePercent = ref(0)
const crisisChangePercent = ref(0)
const userGrowthPercent = ref(0)
const communityGrowthPercent = ref(0)
const eventGrowthPercent = ref(0)
const engagementRate = ref(0)
const engagementGrowth = ref(0)

// Chart data
const clientsChartData = ref([45, 52, 48, 61, 58, 69, 73])
const crisisTrend = ref('Stable')

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
    const today = new Date().toISOString().split('T')[0]
    
    // Get new clients today
    const { count: newClientsCount, error: clientsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('created_at', today)

    // Get total counselors
    const { count: counselorCount, error: counselorError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'counselor')

    // Get active counselors
    const { count: activeCounselorCount, error: activeCounselorError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'counselor')
      .eq('is_active', true)

    // Get crisis alerts today
    const { count: crisisCount, error: crisisError } = await supabase
      .from('crisis_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    // Get active crisis alerts
    const { count: activeCrisisCount, error: activeCrisisError } = await supabase
      .from('crisis_alerts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'assigned', 'in_progress'])

    // Get total resources
    const { count: resourceCount, error: resourceError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Set values with error handling
    newClientsToday.value = clientsError ? 0 : (newClientsCount || 0)
    totalCounselors.value = counselorError ? 0 : (counselorCount || 0)
    activeCounselors.value = activeCounselorError ? 0 : (activeCounselorCount || 0)
    crisisAlertsToday.value = crisisError ? 0 : (crisisCount || 0)
    activeCrisisAlerts.value = activeCrisisError ? 0 : (activeCrisisCount || 0)
    totalResources.value = resourceError ? 0 : (resourceCount || 0)
    resourcesAccessedToday.value = 0 // Will implement when tracking is added
    clientsChangePercent.value = 0 // Will implement when historical tracking is added
    crisisChangePercent.value = 0 // Will implement when historical tracking is added

    console.log('Real-time metrics loaded:', {
      newClientsToday: newClientsToday.value,
      totalCounselors: totalCounselors.value,
      activeCounselors: activeCounselors.value,
      crisisAlertsToday: crisisAlertsToday.value,
      activeCrisisAlerts: activeCrisisAlerts.value,
      totalResources: totalResources.value
    })
  } catch (error) {
    console.error('Error loading real-time metrics:', error)
    // Set all to 0 on error
    newClientsToday.value = 0
    crisisAlertsToday.value = 0
    resourcesAccessedToday.value = 0
    activeCounselors.value = 0
    totalCounselors.value = 0
    totalResources.value = 0
    activeCrisisAlerts.value = 0
    clientsChangePercent.value = 0
    crisisChangePercent.value = 0
  }
}

const loadOverviewStats = async () => {
  try {
    // Get total users
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total support groups
    const { count: communitiesCount, error: communitiesError } = await supabase
      .from('support_groups')
      .select('*', { count: 'exact', head: true })

    // Get total direct messages
    const { count: messageCount, error: messageError } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })

    // Get total topics (if table exists)
    const { count: topicCount, error: topicError } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })

    // Set values with error handling
    totalUsers.value = usersError ? 0 : (usersCount || 0)
    totalCommunities.value = communitiesError ? 0 : (communitiesCount || 0)
    totalMessages.value = messageError ? 0 : (messageCount || 0)
    totalTopics.value = topicError ? 0 : (topicCount || 0)
    totalEvents.value = 0 // Set to 0 until events table exists
    flaggedContent.value = 0 // Set to 0 until flagging system exists
    
    // Set growth percentages to 0 until historical tracking is implemented
    userGrowthPercent.value = 0
    communityGrowthPercent.value = 0
    eventGrowthPercent.value = 0
    engagementRate.value = 0
    engagementGrowth.value = 0

    console.log('Overview stats loaded:', {
      totalUsers: totalUsers.value,
      totalCommunities: totalCommunities.value,
      totalMessages: totalMessages.value,
      totalTopics: totalTopics.value
    })
  } catch (error) {
    console.error('Error loading overview stats:', error)
    // Set all to 0 on error
    totalUsers.value = 0
    totalCommunities.value = 0
    totalMessages.value = 0
    totalTopics.value = 0
    totalEvents.value = 0
    flaggedContent.value = 0
  }
}

const loadUserAnalytics = async () => {
  try {
    // Calculate real user analytics from database
    const { count: activeCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { count: newUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    activeUsers.value = activeCount || 0
    dormantUsers.value = totalUsers.value - activeUsers.value
    newUsersThisWeek.value = newUsersCount || 0
  } catch (error) {
    console.error('Error loading user analytics:', error)
  }
}

const loadTopCommunities = async () => {
  try {
    // Get real support groups data with actual member counts
    const { data, error } = await supabase
      .from('support_groups')
      .select('id, name, member_count')
      .eq('status', 'active')
      .order('member_count', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log('Support groups table not available:', error)
      topCommunities.value = []
      return
    }
    
    if (data) {
      topCommunities.value = data.map(community => ({
        ...community,
        message_count: community.member_count || 0
      }))
    } else {
      topCommunities.value = []
    }

    console.log('Top communities loaded:', topCommunities.value)
  } catch (error) {
    console.error('Error loading top support groups:', error)
    topCommunities.value = []
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

const getClientsChangeClass = () => {
  return clientsChangePercent.value > 0 ? 'positive' : clientsChangePercent.value < 0 ? 'negative' : 'neutral'
}

const getCrisisChangeClass = () => {
  return crisisChangePercent.value > 0 ? 'negative' : crisisChangePercent.value < 0 ? 'positive' : 'neutral'
}

const getCrisisTrendIcon = () => {
  return crisisChangePercent.value > 0 ? 'fa-arrow-trend-up' : crisisChangePercent.value < 0 ? 'fa-arrow-trend-down' : 'fa-minus'
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

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.75rem;
}

.header-left p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.time-range-selector select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #2c3e50;
  font-size: 0.9rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn.secondary:hover {
  background: #e9ecef;
  color: #495057;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Real-time Section */
.realtime-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.last-updated {
  color: #7f8c8d;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-indicator {
  color: #27ae60;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.realtime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.metric-card.clients {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-card.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-card.crisis {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-card.resources {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.metric-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.metric-info p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  opacity: 0.9;
}

.metric-change {
  font-size: 0.85rem;
  opacity: 0.8;
}

.metric-change.positive {
  color: #a8e6cf;
}

.metric-change.negative {
  color: #ffaaa5;
}

.metric-change.neutral {
  color: #fff;
}

.mini-chart {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 40px;
  margin-top: 1rem;
}

.chart-bar {
  background: rgba(255, 255, 255, 0.3);
  width: 4px;
  border-radius: 2px;
  min-height: 4px;
}

.metric-pulse {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.pulse-ring {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 6px;
  left: 6px;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* Overview Section */
.overview-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  color: #6c757d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.overview-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h4 {
  margin: 0;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
}

.card-icon {
  color: #6c757d;
  font-size: 1.2rem;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.card-growth {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.card-growth.positive {
  color: #28a745;
}

.card-growth.negative {
  color: #dc3545;
}

.card-growth.neutral {
  color: #6c757d;
}

.growth-line {
  height: 3px;
  background: #007bff;
  border-radius: 2px;
  margin-top: 0.5rem;
  transition: width 0.3s ease;
}

/* Detailed Analytics */
.details-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.analytics-tabs {
  display: flex;
  border-bottom: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: white;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-btn.active {
  background: #f8f9fa;
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

.tab-content {
  padding: 2rem;
}

.analytics-panel {
  min-height: 400px;
}

.panel-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.analytics-chart {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.analytics-chart h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.chart-container {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #6c757d;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.analytics-breakdown {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.analytics-breakdown h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-item .label {
  font-size: 0.9rem;
  color: #6c757d;
}

.breakdown-item .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.progress-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.dormant {
  background: #6c757d;
}

.progress-fill.new {
  background: #28a745;
}

/* Content Analytics */
.content-metrics {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.content-metrics h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.metric-item .metric-icon {
  color: #007bff;
  font-size: 1.5rem;
}

.metric-data {
  display: flex;
  flex-direction: column;
}

.metric-number {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.metric-label {
  font-size: 0.8rem;
  color: #6c757d;
}

.community-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.community-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.rank {
  width: 24px;
  height: 24px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
}

.community-info {
  flex: 1;
}

.community-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.community-stats {
  font-size: 0.85rem;
  color: #6c757d;
}

.activity-indicator {
  width: 60px;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.activity-bar {
  height: 100%;
  background: #007bff;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

/* Performance Metrics */
.performance-metrics {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.performance-metrics h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.performance-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.perf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.perf-title {
  font-size: 0.9rem;
  color: #6c757d;
}

.perf-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.perf-status.good {
  background: #d4edda;
  color: #155724;
}

.perf-status.excellent {
  background: #d1ecf1;
  color: #0c5460;
}

.perf-status.warning {
  background: #fff3cd;
  color: #856404;
}

.perf-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.perf-chart {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.perf-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
  background: #007bff;
}

.perf-bar.uptime {
  background: #28a745;
}

.perf-bar.error {
  background: #dc3545;
}

/* Mobile Responsive */
@media screen and (max-width: 768px) {
  .analytics-view {
    gap: 1.5rem;
  }
  
  .header-section {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .realtime-grid,
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .panel-grid {
    grid-template-columns: 1fr;
  }
  
  .analytics-tabs {
    flex-direction: column;
  }
  
  .tab-content {
    padding: 1.5rem;
  }
  
  .metrics-grid,
  .performance-grid {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 480px) {
  .header-section,
  .realtime-section,
  .overview-section,
  .tab-content {
    padding: 1rem;
  }
  
  .metric-card {
    padding: 1rem;
  }
  
  .metric-info h4 {
    font-size: 2rem;
  }
  
  .card-value {
    font-size: 1.5rem;
  }
}
</style> 