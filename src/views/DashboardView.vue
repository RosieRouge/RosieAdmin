<template>
  <AdminLayout>
    <div class="dashboard" :class="dashboardClasses">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1>Welcome to Rosie App Admin</h1>
          <p>Reproductive Health Support Platform Dashboard</p>
          <div class="quick-stats">
            <div class="stat">
              <span class="stat-number">{{ stats.totalCases }}</span>
              <span class="stat-label">Total Cases</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ stats.activeCounselors }}</span>
              <span class="stat-label">Active Counselors</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ stats.dailyUsers }}</span>
              <span class="stat-label">Daily Active Users</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Crisis Alerts -->
      <div v-if="crisisAlerts.length > 0" class="crisis-section">
        <h2>
          <i class="fas fa-exclamation-triangle"></i>
          Crisis Alerts
        </h2>
        <div class="crisis-grid">
          <div v-for="alert in crisisAlerts" :key="alert.id" class="crisis-card">
            <div class="crisis-header">
              <span class="crisis-badge">CRISIS</span>
              <span class="crisis-time">{{ formatTimeAgo(alert.created_at) }}</span>
            </div>
            <h4>{{ alert.title }}</h4>
            <p>{{ alert.description }}</p>
            <div class="crisis-actions">
              <button class="btn btn-sm btn-danger" @click="handleCrisis(alert)">
                Respond Now
              </button>
              <button class="btn btn-sm btn-outline" @click="assignCrisis(alert)">
                Assign Counselor
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Support Cases Overview -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Support Cases</h3>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="refreshCases">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <div class="cases-overview">
            <div class="case-stat crisis">
              <div class="case-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="case-info">
                <span class="case-number">{{ caseStats.crisis }}</span>
                <span class="case-label">Crisis Cases</span>
              </div>
            </div>
            <div class="case-stat pending">
              <div class="case-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="case-info">
                <span class="case-number">{{ caseStats.pending }}</span>
                <span class="case-label">Pending</span>
              </div>
            </div>
            <div class="case-stat active">
              <div class="case-icon">
                <i class="fas fa-tasks"></i>
              </div>
              <div class="case-info">
                <span class="case-number">{{ caseStats.active }}</span>
                <span class="case-label">Active</span>
              </div>
            </div>
            <div class="case-stat resolved">
              <div class="case-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="case-info">
                <span class="case-number">{{ caseStats.resolvedToday }}</span>
                <span class="case-label">Resolved Today</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="$router.push('/case-management')">
              View All Cases
            </button>
          </div>
        </div>

        <!-- Counselor Status -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Counselor Status</h3>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="refreshCounselors">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <div class="counselor-stats">
            <div class="counselor-list">
              <div v-for="counselor in topCounselors" :key="counselor.id" class="counselor-item">
                <div class="counselor-avatar">
                  <img :src="counselor.avatar || getDefaultAvatar(counselor.name)" :alt="counselor.name" />
                  <div class="status-dot" :class="counselor.status"></div>
                </div>
                <div class="counselor-info">
                  <span class="counselor-name">{{ counselor.name }}</span>
                  <span class="counselor-cases">{{ counselor.active_cases || 0 }} active cases</span>
                </div>
                <div class="counselor-rating">
                  <i class="fas fa-star"></i>
                  {{ counselor.rating || '5.0' }}
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="$router.push('/counselors')">
              Manage Counselors
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Recent Activity</h3>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="refreshActivity">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <div class="activity-list">
            <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="activity.type">
                <i class="fas" :class="getActivityIcon(activity.type)"></i>
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.description }}</p>
                <span class="activity-time">{{ formatTimeAgo(activity.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-outline" @click="$router.push('/analytics')">
              View Analytics
            </button>
          </div>
        </div>

        <!-- Resource Library Status -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Resource Library</h3>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="refreshResources">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <div class="resource-stats">
            <div class="resource-categories">
              <div class="resource-category">
                <i class="fas fa-heart-pulse"></i>
                <span>{{ resourceStats.abortion_support || 0 }} Abortion Support</span>
              </div>
              <div class="resource-category">
                <i class="fas fa-pills"></i>
                <span>{{ resourceStats.contraception || 0 }} Contraception</span>
              </div>
              <div class="resource-category">
                <i class="fas fa-baby"></i>
                <span>{{ resourceStats.pregnancy_options || 0 }} Pregnancy Options</span>
              </div>
              <div class="resource-category">
                <i class="fas fa-scale-balanced"></i>
                <span>{{ resourceStats.legal_support || 0 }} Legal Support</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="$router.push('/resources')">
              Manage Resources
            </button>
          </div>
        </div>

        <!-- Support Groups -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Support Groups</h3>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="refreshGroups">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <div class="groups-overview">
            <div class="group-stat">
              <span class="stat-number">{{ groupStats.total || 0 }}</span>
              <span class="stat-label">Total Groups</span>
            </div>
            <div class="group-stat">
              <span class="stat-number">{{ groupStats.active || 0 }}</span>
              <span class="stat-label">Active Groups</span>
            </div>
            <div class="group-stat">
              <span class="stat-number">{{ groupStats.members || 0 }}</span>
              <span class="stat-label">Total Members</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="$router.push('/support-groups')">
              Manage Groups
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { supabase } from '@/lib/supabase'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

interface CrisisAlert {
  id: string
  title: string
  description: string
  created_at: string
}

interface ActivityItem {
  id: number
  type: string
  description: string
  created_at: string
}

interface Counselor {
  id: string
  name: string
  avatar?: string
  status: string
  active_cases: number
  rating: string
}

// Component state
const loading = ref(false)

// Responsive layout
const { viewClasses: dashboardClasses, setupResponsiveLayout } = useResponsiveLayout()
const stats = ref({
  totalCases: 0,
  activeCounselors: 0,
  dailyUsers: 0
})
const caseStats = ref({
  crisis: 0,
  pending: 0,
  active: 0,
  resolvedToday: 0
})
const topCounselors = ref<(Counselor & { status: string; active_cases: number; rating: string })[]>([])
const recentActivity = ref<ActivityItem[]>([])
const crisisAlerts = ref<CrisisAlert[]>([])
const resourceStats = ref<Record<string, number>>({})
const groupStats = ref<Record<string, number>>({})

// Methods
const loadDashboardData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadCaseStats(),
      loadCounselors(),
      loadRecentActivity(),
      loadCrisisAlerts(),
      loadResourceStats(),
      loadGroupStats()
    ])
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    // For now, use mock data since tables might not have the expected structure
    stats.value = {
      totalCases: 0,
      activeCounselors: 0,
      dailyUsers: 0
    }
  } catch (error) {
    console.error('Error loading stats:', error)
    stats.value = {
      totalCases: 0,
      activeCounselors: 0,
      dailyUsers: 0
    }
  }
}

const loadCaseStats = async () => {
  try {
    // For now, use mock data since tables might not have the expected structure
    caseStats.value = {
      crisis: 0,
      pending: 0,
      active: 0,
      resolvedToday: 0
    }
  } catch (error) {
    console.error('Error loading case stats:', error)
    caseStats.value = {
      crisis: 0,
      pending: 0,
      active: 0,
      resolvedToday: 0
    }
  }
}

const loadCounselors = async () => {
  try {
    // For now, use empty data since tables might not have the expected structure
    topCounselors.value = []
  } catch (error) {
    console.error('Error loading counselors:', error)
    topCounselors.value = []
  }
}

const loadRecentActivity = async () => {
  try {
    // For now, use empty data since tables might not have the expected structure
    recentActivity.value = []
  } catch (error) {
    console.error('Error loading recent activity:', error)
    recentActivity.value = []
  }
}

const loadCrisisAlerts = async () => {
  try {
    // For now, use empty data since tables might not have the expected structure
    crisisAlerts.value = []
  } catch (error) {
    console.error('Error loading crisis alerts:', error)
    crisisAlerts.value = []
  }
}

const loadResourceStats = async () => {
  try {
    // For now, use empty data since tables might not have the expected structure
    resourceStats.value = {}
  } catch (error) {
    console.error('Error loading resource stats:', error)
    resourceStats.value = {}
  }
}

const loadGroupStats = async () => {
  try {
    // For now, use empty data since tables might not have the expected structure
    groupStats.value = {
      total: 0,
      active: 0,
      members: 0
    }
  } catch (error) {
    console.error('Error loading group stats:', error)
    groupStats.value = {
      total: 0,
      active: 0,
      members: 0
    }
  }
}

const refreshCases = () => loadCaseStats()
const refreshCounselors = () => loadCounselors()
const refreshActivity = () => loadRecentActivity()
const refreshResources = () => loadResourceStats()
const refreshGroups = () => loadGroupStats()

const handleCrisis = (alert: any) => {
  // Handle crisis case
  console.log('Handling crisis:', alert)
}

const assignCrisis = (alert: any) => {
  // Assign crisis to counselor
  console.log('Assigning crisis:', alert)
}

// Utility functions
const getDefaultAvatar = (name?: string) => {
  if (!name) return 'https://randomuser.me/api/portraits/men/32.jpg'
  const initials = name.split(' ').map(n => n[0]).join('')
  return `https://ui-avatars.com/api/?name=${initials}&background=B91C1C&color=ffffff&size=128`
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    case_created: 'fa-plus-circle',
    counselor_assigned: 'fa-user-plus',
    case_resolved: 'fa-check-circle',
    resource_added: 'fa-book-medical',
    crisis_alert: 'fa-exclamation-triangle'
  }
  return icons[type] || 'fa-info-circle'
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / (1000 * 60))
  
  if (diffInMins < 1) return 'Just now'
  if (diffInMins < 60) return `${diffInMins}m ago`
  
  const diffInHours = Math.floor(diffInMins / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

onMounted(() => {
  loadDashboardData()
  
  // Setup responsive layout
  const cleanup = setupResponsiveLayout()
  
  // Store cleanup for unmounting
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  background: var(--rosie-background);
  min-height: 100vh;
  position: fixed;
  top: 60px;
  left: 280px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  transition: left 0.3s ease, padding 0.3s ease;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .dashboard {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .dashboard.sidebar-collapsed {
    left: 70px;
  }
}

.welcome-section {
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  color: white;
  padding: 3rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 8px 25px rgba(185, 28, 28, 0.3);
}

.welcome-content h1 {
  color: white;
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.welcome-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
}

.quick-stats {
  display: flex;
  gap: 3rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5rem;
}



.crisis-section {
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
}

.crisis-section h2 {
  color: white;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.crisis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.crisis-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.crisis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.crisis-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.crisis-time {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.crisis-card h4 {
  color: white;
  margin: 0 0 0.5rem 0;
}

.crisis-card p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
}

.crisis-actions {
  display: flex;
  gap: 1rem;
}

.crisis-actions .btn {
  flex: 1;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(185, 28, 28, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(185, 28, 28, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid var(--rosie-secondary);
}

.card-header h3 {
  color: var(--rosie-primary);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.cases-overview {
  padding: 1.5rem 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.case-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: var(--rosie-background);
}

.case-stat.crisis {
  background: rgba(220, 38, 38, 0.1);
}

.case-stat.pending {
  background: rgba(245, 158, 11, 0.1);
}

.case-stat.active {
  background: rgba(59, 130, 246, 0.1);
}

.case-stat.resolved {
  background: rgba(16, 185, 129, 0.1);
}

.case-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.case-stat.crisis .case-icon {
  background: #DC2626;
}

.case-stat.pending .case-icon {
  background: #F59E0B;
}

.case-stat.active .case-icon {
  background: #3B82F6;
}

.case-stat.resolved .case-icon {
  background: #10B981;
}

.case-info {
  display: flex;
  flex-direction: column;
}

.case-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--rosie-primary);
  line-height: 1;
}

.case-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.counselor-stats {
  padding: 1.5rem 2rem;
}

.counselor-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.counselor-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--rosie-background);
  border-radius: 8px;
}

.counselor-avatar {
  position: relative;
  flex-shrink: 0;
}

.counselor-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--rosie-secondary);
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-dot.available {
  background: #10B981;
}

.status-dot.busy {
  background: #F59E0B;
}

.counselor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.counselor-name {
  font-weight: 600;
  color: var(--rosie-primary);
  font-size: 0.9rem;
}

.counselor-cases {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.counselor-rating {
  color: #F59E0B;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.activity-list {
  padding: 1.5rem 2rem;
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--rosie-secondary);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.activity-icon.case_created {
  background: #10B981;
}

.activity-icon.counselor_assigned {
  background: #3B82F6;
}

.activity-icon.case_resolved {
  background: #10B981;
}

.activity-icon.resource_added {
  background: #8B5CF6;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.activity-time {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.resource-stats {
  padding: 1.5rem 2rem;
}

.resource-categories {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-category {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--rosie-background);
  border-radius: 8px;
}

.resource-category i {
  color: var(--rosie-primary);
  width: 20px;
}

.groups-overview {
  padding: 1.5rem 2rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.group-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--rosie-background);
  border-radius: 8px;
}

.card-footer {
  padding: 1rem 2rem 2rem 2rem;
}

.card-footer .btn {
  width: 100%;
  justify-content: center;
}

/* Mobile Responsive */
@media screen and (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .cases-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .groups-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .crisis-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }
}

@media screen and (max-width: 768px) {
  .dashboard {
    padding: 0;
  }
  
  .welcome-section {
    text-align: center;
    padding: 2rem 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .welcome-content h1 {
    font-size: 2rem;
  }
  
  .welcome-content p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }
  
  .quick-stats {
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
  }
  
  .stat {
    min-width: 100px;
  }
  
  .stat-number {
    font-size: 1.75rem;
  }
  
  .crisis-section {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .crisis-section h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .crisis-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .crisis-card {
    padding: 1.25rem;
  }
  
  .crisis-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .crisis-actions .btn {
    width: 100%;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .dashboard-card:hover {
    transform: none;
  }
  
  .card-header {
    padding: 1.25rem 1.5rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .card-header h3 {
    font-size: 1.125rem;
    text-align: center;
  }
  
  .card-actions {
    justify-content: center;
  }
  
  .cases-overview {
    padding: 1.5rem;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .case-stat {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .case-stat:hover {
    transform: none;
  }
  
  .case-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .case-number {
    font-size: 1.25rem;
  }
  
  .case-label {
    font-size: 0.8rem;
  }
  
  .counselor-stats {
    padding: 1.5rem;
  }
  
  .counselor-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .counselor-avatar img {
    width: 36px;
    height: 36px;
  }
  
  .counselor-name {
    font-size: 0.85rem;
  }
  
  .counselor-cases {
    font-size: 0.75rem;
  }
  
  .counselor-rating {
    font-size: 0.75rem;
  }
  
  .activity-list {
    padding: 1.5rem;
    max-height: 350px;
  }
  
  .activity-item {
    padding: 0.75rem 0;
    gap: 0.75rem;
  }
  
  .activity-icon {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .activity-text {
    font-size: 0.85rem;
  }
  
  .activity-time {
    font-size: 0.7rem;
  }
  
  .resource-stats {
    padding: 1.5rem;
  }
  
  .resource-category {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .resource-category i {
    font-size: 1rem;
  }
  
  .resource-category span {
    font-size: 0.85rem;
  }
  
  .groups-overview {
    padding: 1.5rem;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .group-stat {
    padding: 1rem;
  }
  
  .card-footer {
    padding: 1.25rem 1.5rem;
  }
  
  .card-footer .btn {
    width: 100%;
  }
}

@media screen and (max-width: 480px) {
  .welcome-section {
    padding: 1.5rem 1rem;
    border-radius: 8px;
  }
  
  .welcome-content h1 {
    font-size: 1.75rem;
  }
  
  .welcome-content p {
    font-size: 1rem;
  }
  
  .quick-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    min-width: 200px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.85rem;
  }
  

  
  .crisis-section {
    padding: 1.25rem;
    border-radius: 8px;
  }
  
  .crisis-card {
    padding: 1rem;
  }
  
  .crisis-card h4 {
    font-size: 1rem;
  }
  
  .crisis-card p {
    font-size: 0.85rem;
  }
  
  .dashboard-card {
    border-radius: 8px;
  }
  
  .card-header {
    padding: 1rem;
  }
  
  .card-header h3 {
    font-size: 1rem;
  }
  
  .cases-overview,
  .counselor-stats,
  .activity-list,
  .resource-stats,
  .groups-overview {
    padding: 1rem;
  }
  
  .case-stat {
    padding: 0.75rem;
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .case-icon {
    width: 36px;
    height: 36px;
  }
  
  .case-number {
    font-size: 1.125rem;
  }
  
  .counselor-item {
    padding: 0.75rem;
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .counselor-avatar img {
    width: 32px;
    height: 32px;
  }
  
  .counselor-rating {
    justify-content: center;
  }
  
  .activity-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .activity-icon {
    width: 28px;
    height: 28px;
    align-self: center;
  }
  
  .activity-content {
    align-items: center;
  }
  
  .resource-category {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .group-stat {
    padding: 0.75rem;
  }
  
  .card-footer {
    padding: 1rem;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .dashboard-card:hover,
  .case-stat:hover,
  .counselor-item:hover,
  .resource-category:hover,
  .group-stat:hover {
    transform: none;
  }
  
  .dashboard-card:active {
    transform: scale(0.98);
  }
  
  .case-stat:active,
  .counselor-item:active,
  .resource-category:active,
  .group-stat:active {
    transform: scale(0.95);
  }
  
  .btn:hover {
    background: inherit;
    color: inherit;
  }
  
  .btn:active {
    transform: scale(0.95);
  }
}

/* Landscape orientation on mobile */
@media screen and (max-width: 768px) and (orientation: landscape) {
  .welcome-section {
    padding: 1.5rem;
  }
  
  .quick-stats {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .welcome-actions {
    flex-direction: row;
  }
  
  .crisis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cases-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .groups-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Very small screens */
@media screen and (max-width: 320px) {
  .welcome-content h1 {
    font-size: 1.5rem;
  }
  
  .welcome-content p {
    font-size: 0.9rem;
  }
  
  .card-header h3 {
    font-size: 0.9rem;
  }
  
  .case-number {
    font-size: 1rem;
  }
  
  .case-label {
    font-size: 0.75rem;
  }
  
  .counselor-name {
    font-size: 0.8rem;
  }
  
  .counselor-cases {
    font-size: 0.7rem;
  }
  
  .activity-text {
    font-size: 0.8rem;
  }
  
  .activity-time {
    font-size: 0.65rem;
  }
  
  .resource-category span {
    font-size: 0.8rem;
  }
}
</style> 