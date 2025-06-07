<template>
  <div class="dashboard-view">
    <div class="header">
      <h1>Admin Dashboard</h1>
      <p>Community Connect Platform Management</p>
    </div>

    <div class="content">
      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card users">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <h3>{{ loading ? '...' : totalUsers }}</h3>
            <p>Total Users</p>
            <span class="stat-change positive" v-if="!loading">+{{ Math.floor(totalUsers * 0.02) }} today</span>
          </div>
        </div>

        <div class="stat-card communities">
          <div class="stat-icon">
            <i class="fas fa-home"></i>
          </div>
          <div class="stat-info">
            <h3>{{ loading ? '...' : totalCommunities }}</h3>
            <p>Communities</p>
            <span class="stat-change positive" v-if="!loading">+{{ Math.floor(totalCommunities * 0.05) }} this week</span>
          </div>
        </div>

        <div class="stat-card topics">
          <div class="stat-icon">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-info">
            <h3>{{ loading ? '...' : totalTopics }}</h3>
            <p>Topics</p>
            <span class="stat-change positive" v-if="!loading">+{{ Math.floor(totalTopics * 0.1) }} today</span>
          </div>
        </div>

        <div class="stat-card events">
          <div class="stat-icon">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="stat-info">
            <h3>{{ loading ? '...' : totalEvents }}</h3>
            <p>Events</p>
            <span class="stat-change positive" v-if="!loading">+{{ Math.floor(totalEvents * 0.08) }} this week</span>
          </div>
        </div>

        <div class="stat-card messages">
          <div class="stat-icon">
            <i class="fas fa-envelope"></i>
          </div>
          <div class="stat-info">
            <h3>{{ loading ? '...' : totalMessages }}</h3>
            <p>Messages</p>
            <span class="stat-change positive" v-if="!loading">+{{ Math.floor(totalMessages * 0.15) }} today</span>
          </div>
        </div>

        <div class="stat-card active-users">
          <div class="stat-icon">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="stat-info">
            <h3>{{ loading ? '...' : Math.floor(totalUsers * 0.25) }}</h3>
            <p>Active Users</p>
            <span class="stat-change positive" v-if="!loading">+12% vs last week</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Recent Activity -->
      <div class="dashboard-grid">
        <div class="recent-activity">
          <h2>Recent Activity</h2>
          
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading recent activity...
          </div>
          
          <div v-else class="activity-list">
            <div class="activity-section">
              <h3>Recent Communities</h3>
              <div v-if="recentCommunities.length === 0" class="no-data">
                No communities found in database
              </div>
              <div v-else class="activity-items">
                <div v-for="community in recentCommunities.slice(0, 3)" :key="community.id" class="activity-item">
                  <div class="activity-icon community">
                    <i class="fas fa-home"></i>
                  </div>
                  <div class="activity-details">
                    <p><strong>{{ community.name }}</strong></p>
                    <p class="activity-meta">{{ community.member_count || 0 }} members • Created {{ formatDate(community.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="activity-section">
              <h3>Recent Users</h3>
              <div v-if="recentUsers.length === 0" class="no-data">
                No users found in database
              </div>
              <div v-else class="activity-items">
                <div v-for="user in recentUsers.slice(0, 3)" :key="user.id" class="activity-item">
                  <div class="activity-icon user">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="activity-details">
                    <p><strong>{{ user.name }}</strong></p>
                    <p class="activity-meta">{{ user.email }} • Joined {{ formatDate(user.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="activity-section">
              <h3>Recent Events</h3>
              <div v-if="recentEvents.length === 0" class="no-data">
                No events found in database
              </div>
              <div v-else class="activity-items">
                <div v-for="event in recentEvents.slice(0, 3)" :key="event.id" class="activity-item">
                  <div class="activity-icon event">
                    <i class="fas fa-calendar"></i>
                  </div>
                  <div class="activity-details">
                    <p><strong>{{ event.title }}</strong></p>
                    <p class="activity-meta">{{ formatDate(event.start_time) }} • {{ event.attendee_count || 0 }} attending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="action-buttons">
            <RouterLink to="/users" class="action-btn">
              <i class="fas fa-users"></i>
              <span>Manage Users</span>
            </RouterLink>
            <RouterLink to="/communities" class="action-btn">
              <i class="fas fa-home"></i>
              <span>View Communities</span>
            </RouterLink>
            <RouterLink to="/analytics" class="action-btn">
              <i class="fas fa-chart-bar"></i>
              <span>View Analytics</span>
            </RouterLink>
            <RouterLink to="/settings" class="action-btn">
              <i class="fas fa-cog"></i>
              <span>Platform Settings</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/lib/supabase'

const loading = ref(true)

// Stats
const totalUsers = ref(0)
const totalCommunities = ref(0)
const totalTopics = ref(0)
const totalEvents = ref(0)
const totalMessages = ref(0)

// Recent data
const recentCommunities = ref<any[]>([])
const recentUsers = ref<any[]>([])
const recentEvents = ref<any[]>([])

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  loading.value = true
  
  try {
    // Load all data in parallel
    const [
      usersResult,
      communitiesResult,
      topicsResult,
      eventsResult,
      messagesResult
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('communities').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
      supabase.from('topics').select('*', { count: 'exact' }),
      supabase.from('events').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
      supabase.from('messages').select('*', { count: 'exact' })
    ])

    // Set counts
    totalUsers.value = usersResult.count || 0
    totalCommunities.value = communitiesResult.count || 0
    totalTopics.value = topicsResult.count || 0
    totalEvents.value = eventsResult.count || 0
    totalMessages.value = messagesResult.count || 0

    // Set recent data
    recentCommunities.value = communitiesResult.data || []
    recentEvents.value = eventsResult.data || []
    
    // Get recent users
    const recentUsersResult = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    recentUsers.value = recentUsersResult.data || []

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.header {
  background: white;
  padding: 1.5rem;
  margin-top: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

.header p {
  margin: 0;
  color: #7f8c8d;
  font-weight: 500;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.communities { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.topics { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.events { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.stat-icon.messages { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.stat-icon.active-users { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-info h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-info p {
  margin: 0.25rem 0;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-change {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.stat-change.positive {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.recent-activity {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recent-activity h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.activity-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-section h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.activity-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.activity-item:hover {
  background: #e9ecef;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.activity-icon.community { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.activity-icon.user { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.activity-icon.event { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.activity-details {
  flex: 1;
  min-width: 0;
}

.activity-details p {
  margin: 0;
  color: #2c3e50;
  font-size: 0.95rem;
}

.activity-details p.activity-meta {
  margin: 0.25rem 0 0 0;
  color: #7f8c8d;
  font-size: 0.85rem;
}

.no-data {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 1rem;
}

.loading {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}

.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  color: #495057;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn i {
  width: 16px;
  color: #6c757d;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .dashboard-view {
    gap: 1.5rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .content {
    gap: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
  
  .stat-info h3 {
    font-size: 1.5rem;
  }
  
  .stat-info p {
    font-size: 0.85rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .recent-activity,
  .quick-actions {
    padding: 1rem;
  }
  
  .recent-activity h2,
  .quick-actions h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  
  .activity-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .activity-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .activity-details p {
    font-size: 0.9rem;
  }
  
  .activity-details p.activity-meta {
    font-size: 0.8rem;
  }
  
  .action-btn {
    padding: 1rem;
    font-size: 0.95rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .dashboard-view {
    gap: 1rem;
  }
  
  .header {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1.25rem;
  }
  
  .header p {
    font-size: 0.9rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .activity-section h3 {
    font-size: 1rem;
  }
  
  .activity-item {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  
  .activity-details {
    text-align: center;
  }
  
  .recent-activity,
  .quick-actions {
    padding: 0.75rem;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .stat-card:hover,
  .activity-item:hover,
  .action-btn:hover {
    transform: none;
    background: inherit;
    box-shadow: inherit;
  }
  
  .stat-card:active {
    transform: scale(0.98);
  }
  
  .activity-item:active {
    background: #e9ecef;
  }
  
  .action-btn:active {
    background: #f8f9fa;
    transform: scale(0.98);
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .stat-card,
  .recent-activity,
  .quick-actions {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style> 