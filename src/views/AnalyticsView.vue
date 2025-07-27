<template>
  <div class="analytics-view">
    <!-- Header with Disclaimer -->
    <div class="header-section">
      <div class="header-left">
        <h2>
          <i class="fas fa-chart-line"></i>
          Analytics Dashboard
        </h2>
        <p>Comprehensive insights into your reproductive health support platform</p>
        <div class="disclaimer">
          <i class="fas fa-info-circle"></i>
          <span>This data is just to show future features and is not real data</span>
        </div>
      </div>
      <div class="header-actions">
        <div class="time-range-selector">
          <select v-model="selectedTimeRange">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <button class="btn primary">
          <i class="fas fa-download"></i>
          <span>Export Report</span>
        </button>
      </div>
    </div>



    <!-- Platform Growth -->
    <div class="growth-section">
      <div class="section-header">
        <h3>
          <i class="fas fa-chart-area"></i>
          Platform Growth & Engagement
        </h3>
        <div class="view-toggle">
          <button @click="chartView = 'daily'" :class="{ active: chartView === 'daily' }" class="toggle-btn">
            Daily
          </button>
          <button @click="chartView = 'weekly'" :class="{ active: chartView === 'weekly' }" class="toggle-btn">
            Weekly
          </button>
          <button @click="chartView = 'monthly'" :class="{ active: chartView === 'monthly' }" class="toggle-btn">
            Monthly
          </button>
        </div>
      </div>
      
      <div class="growth-grid">
        <div class="growth-chart">
          <div class="chart-header">
            <h4>User Growth Trajectory</h4>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color primary"></span>
                New Users
              </div>
              <div class="legend-item">
                <span class="legend-color success"></span>
                Active Users
              </div>
            </div>
          </div>
          <div class="chart-container">
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div v-for="(value, index) in chartData.users" :key="index" class="chart-bar">
                  <div class="bar primary" :style="{ height: `${value}%` }"></div>
                  <div class="bar-label">{{ getDayLabel(index) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="growth-stats">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Total Platform Users</span>
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-value">{{ formatNumber(platformStats.totalUsers) }}</div>
            <div class="stat-growth positive">
              <i class="fas fa-arrow-up"></i>
              +{{ platformStats.userGrowth }}% this month
            </div>
            <div class="stat-bar">
              <div class="bar-fill" :style="{ width: '78%' }"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Support Communities</span>
              <i class="fas fa-heart-circle"></i>
            </div>
            <div class="stat-value">{{ formatNumber(platformStats.communities) }}</div>
            <div class="stat-growth positive">
              <i class="fas fa-arrow-up"></i>
              +{{ platformStats.communityGrowth }}% this month
            </div>
            <div class="stat-bar">
              <div class="bar-fill community" :style="{ width: '92%' }"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-title">Success Rate</span>
              <i class="fas fa-trophy"></i>
            </div>
            <div class="stat-value">{{ platformStats.successRate }}%</div>
            <div class="stat-growth positive">
              <i class="fas fa-arrow-up"></i>
              +{{ platformStats.successGrowth }}% this month
            </div>
            <div class="stat-bar">
              <div class="bar-fill success" :style="{ width: '96%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Insights -->
    <div class="insights-section">
      <div class="analytics-tabs">
        <button @click="activeTab = 'support'" :class="{ active: activeTab === 'support' }" class="tab-btn">
          <i class="fas fa-hand-holding-heart"></i>
          Support Services
        </button>
        <button @click="activeTab = 'geographic'" :class="{ active: activeTab === 'geographic' }" class="tab-btn">
          <i class="fas fa-globe-americas"></i>
          Geographic Reach
        </button>
        <button @click="activeTab = 'outcomes'" :class="{ active: activeTab === 'outcomes' }" class="tab-btn">
          <i class="fas fa-chart-pie"></i>
          Impact Outcomes
        </button>
      </div>

      <div class="tab-content">
        <!-- Support Services Tab -->
        <div v-if="activeTab === 'support'" class="analytics-panel">
          <div class="services-grid">
            <div class="service-breakdown">
              <h4>Support Service Distribution</h4>
              <div class="service-list">
                <div v-for="service in serviceData" :key="service.name" class="service-item">
                  <div class="service-info">
                    <div class="service-icon" :class="service.color">
                      <i :class="service.icon"></i>
                    </div>
                    <div class="service-details">
                      <div class="service-name">{{ service.name }}</div>
                      <div class="service-count">{{ formatNumber(service.count) }} requests</div>
                    </div>
                  </div>
                  <div class="service-percentage">{{ service.percentage }}%</div>
                  <div class="service-bar">
                    <div class="service-progress" :class="service.color" :style="{ width: service.percentage + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="response-metrics">
              <h4>Response Time Excellence</h4>
              <div class="metrics-showcase">
                <div class="metric-highlight">
                  <div class="metric-icon">
                    <i class="fas fa-bolt"></i>
                  </div>
                  <div class="metric-data">
                    <div class="metric-number">{{ responseMetrics.avgResponse }}</div>
                    <div class="metric-label">Average Response Time</div>
                  </div>
                </div>
                
                <div class="metric-highlight">
                  <div class="metric-icon">
                    <i class="fas fa-clock"></i>
                  </div>
                  <div class="metric-data">
                    <div class="metric-number">{{ responseMetrics.criticalResponse }}</div>
                    <div class="metric-label">Critical Cases Response</div>
                  </div>
                </div>

                <div class="metric-highlight">
                  <div class="metric-icon">
                    <i class="fas fa-percentage"></i>
                  </div>
                  <div class="metric-data">
                    <div class="metric-number">{{ responseMetrics.satisfaction }}%</div>
                    <div class="metric-label">User Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Geographic Reach Tab -->
        <div v-if="activeTab === 'geographic'" class="analytics-panel">
          <div class="geographic-grid">
            <div class="geographic-map">
              <h4>National Coverage Impact</h4>
              <div class="map-placeholder">
                <i class="fas fa-map-marked-alt"></i>
                <p>Interactive map showing service coverage</p>
                <div class="coverage-stats">
                  <div class="coverage-item">
                    <span class="coverage-number">{{ geographicData.statesCovered }}</span>
                    <span class="coverage-label">States Covered</span>
                  </div>
                  <div class="coverage-item">
                    <span class="coverage-number">{{ geographicData.citiesCovered }}</span>
                    <span class="coverage-label">Cities Reached</span>
                  </div>
                  <div class="coverage-item">
                    <span class="coverage-number">{{ geographicData.ruralReach }}%</span>
                    <span class="coverage-label">Rural Access</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="regional-breakdown">
              <h4>Regional Service Distribution</h4>
              <div class="region-list">
                <div v-for="region in regionalData" :key="region.name" class="region-item">
                  <div class="region-header">
                    <span class="region-name">{{ region.name }}</span>
                    <span class="region-percentage">{{ region.percentage }}%</span>
                  </div>
                  <div class="region-metrics">
                    <div class="region-stat">
                      <i class="fas fa-users"></i>
                      {{ formatNumber(region.users) }} users
                    </div>
                    <div class="region-stat">
                      <i class="fas fa-hand-holding-heart"></i>
                      {{ formatNumber(region.cases) }} cases
                    </div>
                  </div>
                  <div class="region-bar">
                    <div class="region-progress" :style="{ width: region.percentage + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Impact Outcomes Tab -->
        <div v-if="activeTab === 'outcomes'" class="analytics-panel">
          <div class="outcomes-grid">
            <div class="impact-summary">
              <h4>Life-Changing Impact</h4>
              <div class="impact-highlights">
                <div class="highlight-card">
                  <div class="highlight-icon">
                    <i class="fas fa-heart"></i>
                  </div>
                  <div class="highlight-content">
                    <div class="highlight-number">{{ formatNumber(outcomeData.livesSupported) }}</div>
                    <div class="highlight-label">Lives Directly Supported</div>
                    <div class="highlight-description">Women who received critical reproductive health support</div>
                  </div>
                </div>

                <div class="highlight-card">
                  <div class="highlight-icon">
                    <i class="fas fa-shield-heart"></i>
                  </div>
                  <div class="highlight-content">
                    <div class="highlight-number">{{ formatNumber(outcomeData.crisisPrevented) }}</div>
                    <div class="highlight-label">Crisis Situations Prevented</div>
                    <div class="highlight-description">Immediate interventions that prevented harm</div>
                  </div>
                </div>

                <div class="highlight-card">
                  <div class="highlight-icon">
                    <i class="fas fa-graduation-cap"></i>
                  </div>
                  <div class="highlight-content">
                    <div class="highlight-number">{{ formatNumber(outcomeData.educated) }}</div>
                    <div class="highlight-label">Individuals Educated</div>
                    <div class="highlight-description">People who received reproductive health education</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="success-stories">
              <h4>Success Metrics</h4>
              <div class="success-grid">
                <div class="success-metric">
                  <div class="success-chart">
                    <div class="chart-circle">
                      <span class="chart-percentage">{{ outcomeData.successRate }}%</span>
                    </div>
                  </div>
                  <div class="success-label">Overall Success Rate</div>
                </div>

                <div class="success-breakdown">
                  <div class="success-item">
                    <span class="success-type">Information Access</span>
                    <span class="success-rate">{{ outcomeData.informationSuccess }}%</span>
                  </div>
                  <div class="success-item">
                    <span class="success-type">Crisis Support</span>
                    <span class="success-rate">{{ outcomeData.crisisSuccess }}%</span>
                  </div>
                  <div class="success-item">
                    <span class="success-type">Ongoing Care</span>
                    <span class="success-rate">{{ outcomeData.careSuccess }}%</span>
                  </div>
                  <div class="success-item">
                    <span class="success-type">Community Connection</span>
                    <span class="success-rate">{{ outcomeData.communitySuccess }}%</span>
                  </div>
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
import { ref, computed } from 'vue'

// Component state
const selectedTimeRange = ref('month')
const chartView = ref('daily')
const activeTab = ref('support')

// Compelling placeholder data that showcases platform potential
const stats = ref({
  clientsHelped: 2847,
  clientsGrowth: 23,
  crisisPrevented: 156,
  responseTime: 3.2,
  activeCounselors: 89,
  totalCounselors: 127,
  resourcesShared: 15420,
  resourceGrowth: 34
})

const platformStats = ref({
  totalUsers: 45280,
  userGrowth: 28,
  communities: 342,
  communityGrowth: 19,
  successRate: 94.7,
  successGrowth: 5.2
})

const chartData = ref({
  users: [65, 72, 78, 85, 91, 88, 95] // Weekly growth data
})

const serviceData = ref([
  {
    name: 'Crisis Support',
    count: 1247,
    percentage: 34,
    icon: 'fas fa-phone',
    color: 'crisis'
  },
  {
    name: 'Information Access',
    count: 2103,
    percentage: 28,
    icon: 'fas fa-book-open',
    color: 'info'
  },
  {
    name: 'Emotional Support',
    count: 1856,
    percentage: 22,
    icon: 'fas fa-heart',
    color: 'emotional'
  },
  {
    name: 'Legal Assistance',
    count: 892,
    percentage: 16,
    icon: 'fas fa-gavel',
    color: 'legal'
  }
])

const responseMetrics = ref({
  avgResponse: '4.2 min',
  criticalResponse: '47 sec',
  satisfaction: 96.8
})

const geographicData = ref({
  statesCovered: 48,
  citiesCovered: 1247,
  ruralReach: 73
})

const regionalData = ref([
  { name: 'Southwest', percentage: 28, users: 12450, cases: 2847 },
  { name: 'Southeast', percentage: 24, users: 10890, cases: 2156 },
  { name: 'Northeast', percentage: 21, users: 9520, cases: 1923 },
  { name: 'Midwest', percentage: 15, users: 6780, cases: 1245 },
  { name: 'Northwest', percentage: 12, users: 5640, cases: 967 }
])

const outcomeData = ref({
  livesSupported: 38420,
  crisisPrevented: 2847,
  educated: 156730,
  successRate: 94.7,
  informationSuccess: 98.2,
  crisisSuccess: 96.4,
  careSuccess: 91.8,
  communitySuccess: 89.3
})

// Helper methods
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getDayLabel = (index: number) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days[index]
}

const progressRing = (percentage: number) => {
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
  return strokeDasharray
}
</script>

<style scoped>
/* CSS Variables */
:root {
  --rosie-primary: #B91C1C;
  --rosie-success: #10B981;
  --rosie-info: #3B82F6;
  --rosie-warning: #F59E0B;
  --rosie-pink: #FDF2F8;
  --rosie-gray: #6B7280;
  --gradient-primary: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
  --gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);
  --gradient-info: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  --gradient-warning: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.analytics-view {
  padding: 2rem;
  background: #FDE2E2;
  min-height: 100vh;
  position: fixed;
  top: 60px;
  left: 280px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  transition: left 0.3s ease, padding 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .analytics-view {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .analytics-view.sidebar-collapsed {
    left: 70px;
  }
}

/* Header Section */
.header-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(185, 28, 28, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  color: var(--rosie-primary);
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left p {
  margin: 0 0 1rem 0;
  color: var(--rosie-gray);
  font-size: 1.1rem;
}

.disclaimer {
  background: #FEF3C7;
  color: #92400E;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #FCD34D;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.time-range-selector select {
  padding: 0.75rem 1rem;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s;
}

.time-range-selector select:focus {
  outline: none;
  border-color: var(--rosie-primary);
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background: var(--gradient-primary);
  color: white;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(185, 28, 28, 0.3);
}

/* Impact Section */
.impact-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(185, 28, 28, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h3 {
  margin: 0;
  color: var(--rosie-primary);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.live-badge {
  background: #DCFCE7;
  color: #166534;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-badge i {
  color: #10B981;
  animation: pulse 2s infinite;
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.impact-card {
  padding: 2rem;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  color: white;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.impact-card.primary {
  background: var(--gradient-primary);
}

.impact-card.success {
  background: var(--gradient-success);
}

.impact-card.info {
  background: var(--gradient-info);
}

.impact-card.warning {
  background: var(--gradient-warning);
}

.impact-visual {
  position: relative;
}

.impact-icon {
  font-size: 3rem;
  opacity: 0.9;
}

.impact-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

.impact-content {
  flex: 1;
}

.impact-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.impact-label {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.impact-change {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.8;
}

/* Growth Section */
.growth-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(185, 28, 28, 0.1);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #E5E7EB;
  background: white;
  color: var(--rosie-gray);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--rosie-primary);
  color: white;
  border-color: var(--rosie-primary);
}

.growth-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.growth-chart {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h4 {
  margin: 0;
  color: #374151;
  font-size: 1.1rem;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--rosie-gray);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.primary {
  background: var(--rosie-primary);
}

.legend-color.success {
  background: var(--rosie-success);
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: end;
  justify-content: center;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 1rem;
  height: 100%;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
}

.bar {
  width: 24px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.bar.primary {
  background: var(--gradient-primary);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--rosie-gray);
  font-weight: 500;
}

.growth-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-card {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-title {
  font-size: 0.9rem;
  color: var(--rosie-gray);
  font-weight: 500;
}

.stat-header i {
  color: var(--rosie-primary);
  font-size: 1.2rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.5rem;
}

.stat-growth {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.stat-growth.positive {
  color: var(--rosie-success);
}

.stat-bar {
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--rosie-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.bar-fill.community {
  background: var(--rosie-success);
}

.bar-fill.success {
  background: var(--rosie-info);
}

/* Insights Section */
.insights-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(185, 28, 28, 0.1);
  overflow: hidden;
}

.analytics-tabs {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
}

.tab-btn {
  flex: 1;
  padding: 1.5rem;
  border: none;
  background: white;
  color: var(--rosie-gray);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
}

.tab-btn.active {
  background: #F9FAFB;
  color: var(--rosie-primary);
  border-bottom: 3px solid var(--rosie-primary);
}

.tab-content {
  padding: 2rem;
}

.analytics-panel {
  min-height: 400px;
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.service-breakdown,
.response-metrics {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.service-breakdown h4,
.response-metrics h4 {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
}

.service-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.service-icon.crisis {
  background: var(--gradient-primary);
}

.service-icon.info {
  background: var(--gradient-info);
}

.service-icon.emotional {
  background: var(--gradient-success);
}

.service-icon.legal {
  background: var(--gradient-warning);
}

.service-details {
  flex: 1;
}

.service-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.service-count {
  color: var(--rosie-gray);
  font-size: 0.85rem;
}

.service-percentage {
  font-weight: 700;
  color: var(--rosie-primary);
  font-size: 1.1rem;
}

.service-bar {
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.service-progress {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.service-progress.crisis {
  background: var(--rosie-primary);
}

.service-progress.info {
  background: var(--rosie-info);
}

.service-progress.emotional {
  background: var(--rosie-success);
}

.service-progress.legal {
  background: var(--rosie-warning);
}

.metrics-showcase {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metric-highlight {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-highlight .metric-icon {
  width: 50px;
  height: 50px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.metric-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.25rem;
}

.metric-label {
  color: var(--rosie-gray);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Geographic Grid */
.geographic-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.geographic-map {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.geographic-map h4 {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.map-placeholder {
  text-align: center;
  padding: 2rem;
  color: var(--rosie-gray);
}

.map-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.coverage-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.coverage-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #E5E7EB;
}

.coverage-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--rosie-primary);
  margin-bottom: 0.25rem;
}

.coverage-label {
  font-size: 0.8rem;
  color: var(--rosie-gray);
  font-weight: 500;
}

.regional-breakdown {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.regional-breakdown h4 {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.region-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.region-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.region-name {
  font-weight: 600;
  color: #374151;
}

.region-percentage {
  font-weight: 700;
  color: var(--rosie-primary);
}

.region-metrics {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.region-stat {
  font-size: 0.8rem;
  color: var(--rosie-gray);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.region-bar {
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  overflow: hidden;
}

.region-progress {
  height: 100%;
  background: var(--rosie-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Outcomes Grid */
.outcomes-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.impact-summary {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.impact-summary h4 {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.impact-highlights {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.highlight-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.highlight-icon {
  width: 50px;
  height: 50px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.highlight-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.25rem;
}

.highlight-label {
  font-weight: 600;
  color: var(--rosie-primary);
  margin-bottom: 0.5rem;
}

.highlight-description {
  font-size: 0.85rem;
  color: var(--rosie-gray);
  line-height: 1.4;
}

.success-stories {
  background: #F9FAFB;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.success-stories h4 {
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
}

.success-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.success-metric {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  text-align: center;
}

.success-chart {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.chart-circle {
  width: 80px;
  height: 80px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.success-label {
  color: var(--rosie-gray);
  font-weight: 500;
}

.success-breakdown {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #F3F4F6;
}

.success-item:last-child {
  border-bottom: none;
}

.success-type {
  color: #374151;
  font-weight: 500;
}

.success-rate {
  color: var(--rosie-primary);
  font-weight: 700;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse-ring {
  0% { 
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% { 
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* Mobile Responsive */
@media screen and (max-width: 1024px) {
  .growth-grid,
  .services-grid,
  .geographic-grid,
  .outcomes-grid {
    grid-template-columns: 1fr;
  }
  
  .header-section {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media screen and (max-width: 768px) {
  .analytics-view {
    padding: 0.5rem;
    gap: 1.5rem;
  }
  
  .header-section,
  .impact-section,
  .growth-section,
  .tab-content {
    padding: 1.5rem;
  }
  
  .impact-grid {
    grid-template-columns: 1fr;
  }
  
  .impact-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .analytics-tabs {
    flex-direction: column;
  }
  
  .coverage-stats {
    grid-template-columns: 1fr;
  }
  
  .chart-bars {
    gap: 0.5rem;
  }
  
  .bar {
    width: 16px;
  }
}

@media screen and (max-width: 480px) {
  .header-left h2 {
    font-size: 1.5rem;
  }
  
  .impact-number {
    font-size: 2rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .disclaimer {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}
</style> 