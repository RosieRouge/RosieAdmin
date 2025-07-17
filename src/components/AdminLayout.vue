<template>
  <div class="admin-layout">
    <!-- Mobile Overlay -->
    <div 
      v-if="showMobileOverlay" 
      class="mobile-overlay" 
      @click="closeMobileSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 
      collapsed: sidebarCollapsed,
      'mobile-open': mobileMenuOpen 
    }">
      <div class="sidebar-header">
        <div class="logo">
          <i class="fas fa-heart-pulse"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Rosie App Admin</span>
        </div>
        <button @click="toggleSidebar" class="sidebar-toggle">
          <i class="fas" :class="mobileMenuOpen ? 'fa-times' : 'fa-bars'"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <RouterLink 
          to="/" 
          class="nav-item" 
          :class="{ active: route.name === 'dashboard' }"
          @click="handleNavClick"
        >
          <i class="fas fa-chart-bar"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Dashboard</span>
        </RouterLink>

        <RouterLink 
          to="/case-management" 
          class="nav-item" 
          :class="{ active: route.name === 'case-management' }"
          @click="handleNavClick"
        >
          <i class="fas fa-briefcase-medical"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Case Management</span>
        </RouterLink>

        <RouterLink 
          to="/user-management" 
          class="nav-item" 
          :class="{ active: route.name === 'user-management' }"
          @click="handleNavClick"
        >
          <i class="fas fa-users-medical"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">User Management</span>
        </RouterLink>

        <RouterLink 
          to="/counselors" 
          class="nav-item" 
          :class="{ active: route.name === 'counselors' }"
          @click="handleNavClick"
        >
          <i class="fas fa-user-doctor"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Counselors</span>
        </RouterLink>

        <RouterLink 
          to="/support-groups" 
          class="nav-item" 
          :class="{ active: route.name === 'support-groups' }"
          @click="handleNavClick"
        >
          <i class="fas fa-people-group"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Support Groups</span>
        </RouterLink>



        <RouterLink 
          to="/resources" 
          class="nav-item" 
          :class="{ active: route.name === 'resources' }"
          @click="handleNavClick"
        >
          <i class="fas fa-book-medical"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Resources</span>
        </RouterLink>

        <RouterLink 
          to="/crisis-alerts" 
          class="nav-item crisis" 
          :class="{ active: route.name === 'crisis-alerts' }"
          @click="handleNavClick"
        >
          <i class="fas fa-triangle-exclamation"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Crisis Alerts</span>
          <span v-if="crisisCount > 0" class="crisis-badge">{{ crisisCount }}</span>
        </RouterLink>

        <RouterLink 
          to="/analytics" 
          class="nav-item" 
          :class="{ active: route.name === 'analytics' }"
          @click="handleNavClick"
        >
          <i class="fas fa-chart-line"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Analytics</span>
        </RouterLink>

        <RouterLink 
          to="/settings" 
          class="nav-item" 
          :class="{ active: route.name === 'settings' }"
          @click="handleNavClick"
        >
          <i class="fas fa-cog"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Settings</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <i class="fas fa-bars"></i>
          </button>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <button class="refresh-btn" @click="refreshData" :title="'Refresh Data'">
            <i class="fas fa-arrows-rotate" :class="{ 'fa-spin': loading }"></i>
          </button>
          <div class="crisis-indicator" v-if="crisisCount > 0" title="Active Crisis Cases">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ crisisCount }}</span>
          </div>
          <div class="user-menu">
            <img 
              :src="adminUser?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'" 
              :alt="adminUser?.name || 'Admin'" 
              class="user-avatar"
            >
            <span class="user-name">{{ adminUser?.name || 'Admin' }}</span>
            <button @click="logout" class="logout-btn" title="Logout">
              <i class="fas fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const loading = ref(false)
const adminUser = ref<User | null>(null)
const isMobile = ref(false)
const crisisCount = ref(0)

const pageTitle = computed(() => {
  const routeNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    'case-management': 'Case Management',
    'user-management': 'User Management',
    counselors: 'Counselor Management',
    'support-groups': 'Support Groups',
    resources: 'Resource Management',
    'crisis-alerts': 'Crisis Alerts',
    analytics: 'Analytics',
    settings: 'Settings'
  }
  return routeNameMap[route.name as string] || 'Rosie App Admin'
})

const showMobileOverlay = computed(() => {
  return isMobile.value && mobileMenuOpen.value
})

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

const toggleSidebar = () => {
  if (isMobile.value) {
    toggleMobileMenu()
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileSidebar = () => {
  mobileMenuOpen.value = false
}

const handleNavClick = () => {
  if (isMobile.value) {
    mobileMenuOpen.value = false
  }
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

const loadAdminUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    // For development, use mock admin user data
    adminUser.value = {
      id: session.user.id,
      email: session.user.email || 'admin@rosie.com',
      name: 'Super Admin',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar: undefined
    }
  }
}

const loadCrisisCount = async () => {
  try {
    // For development, set crisis count to 0 to avoid database errors
    crisisCount.value = 0
  } catch (error) {
    console.error('Error loading crisis count:', error)
  }
}

onMounted(() => {
  loadAdminUser()
  loadCrisisCount()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Check for crisis cases every 30 seconds
  const crisisInterval = setInterval(loadCrisisCount, 30000)
  
  // Cleanup interval on unmount
  onUnmounted(() => {
    clearInterval(crisisInterval)
    window.removeEventListener('resize', checkMobile)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #FDE2E2;
  position: relative;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
  color: white;
  transition: all 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: 2px 0 10px rgba(185, 28, 28, 0.2);
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 80px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.2rem;
  font-weight: bold;
  overflow: hidden;
}

.logo i {
  font-size: 1.5rem;
  color: #F8C9C9;
  flex-shrink: 0;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  min-height: 56px;
  box-sizing: border-box;
  white-space: nowrap;
  position: relative;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background-color: rgba(248, 201, 201, 0.2);
  color: white;
  border-left-color: #F8C9C9;
}

.nav-item.crisis {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 0.5rem;
  padding-top: 1.5rem;
}

.nav-item.crisis.active {
  background-color: rgba(255, 0, 0, 0.2);
  border-left-color: #ff4444;
}

.nav-item i {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  font-family: "Font Awesome 6 Free", "FontAwesome", sans-serif !important;
  font-weight: 900 !important;
  font-style: normal !important;
  display: inline-block;
  line-height: 1;
  margin-right: 0.75rem;
  font-size: 1.1rem;
}

.nav-item i::before {
  font-family: "Font Awesome 6 Free", "FontAwesome", sans-serif !important;
  font-weight: 900 !important;
}

.crisis-badge {
  position: absolute;
  right: 1rem;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
  }
}

.main-content {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.sidebar.collapsed + .main-content {
  margin-left: 70px;
}

.header {
  background: linear-gradient(135deg, white 0%, #FDE2E2 100%);
  padding: 1rem 2rem;
  border-bottom: 1px solid #F8C9C9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  min-height: 80px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.mobile-menu-btn {
  background: none;
  border: none;
  color: #B91C1C;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  min-width: 44px;
  min-height: 44px;
  display: none;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn:hover {
  background-color: #F8C9C9;
}

.header-left h1 {
  color: #B91C1C;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.refresh-btn {
  background: none;
  border: 1px solid #F8C9C9;
  color: #B91C1C;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background-color: #F8C9C9;
}

.crisis-indicator {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  animation: pulse 2s infinite;
}

.crisis-indicator i {
  font-size: 1rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(248, 201, 201, 0.3);
  border-radius: 8px;
  max-width: 200px;
  border: 1px solid #F8C9C9;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #B91C1C;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #B91C1C;
  font-size: 0.9rem;
  font-weight: 600;
}

.logout-btn {
  background: none;
  border: none;
  color: #B91C1C;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logout-btn:hover {
  background-color: #B91C1C;
  color: white;
}

.content {
  flex: 1;
  padding: 2rem;
  padding-top: 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
  background: #FDE2E2;
}

/* Mobile Styles */
@media screen and (max-width: 768px) {
  .sidebar {
    width: 280px;
    transform: translateX(-100%);
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .sidebar.collapsed {
    width: 280px;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .sidebar.collapsed + .main-content {
    margin-left: 0;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .sidebar-toggle {
    display: none;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header-left h1 {
    font-size: 1.25rem;
  }
  
  .user-menu {
    padding: 0.5rem;
    max-width: 120px;
  }
  
  .user-name {
    display: none;
  }
  
  .content {
    padding: 1rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .sidebar {
    width: 100vw;
  }
  
  .header {
    padding: 0.75rem;
  }
  
  .header-left h1 {
    font-size: 1.1rem;
  }
  
  .user-menu {
    gap: 0.5rem;
    padding: 0.25rem;
  }
  
  .content {
    padding: 0.75rem;
  }
}

/* Tablet */
@media screen and (min-width: 769px) and (max-width: 1024px) {
  .content {
    padding: 1.5rem;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .nav-item:hover {
    background-color: inherit;
  }
  
  .nav-item:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .refresh-btn:hover,
  .logout-btn:hover,
  .sidebar-toggle:hover,
  .mobile-menu-btn:hover {
    background-color: inherit;
  }
  
  .refresh-btn:active {
    background-color: #F8C9C9;
  }
  
  .logout-btn:active {
    background-color: #B91C1C;
    color: white;
  }
  
  .sidebar-toggle:active,
  .mobile-menu-btn:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style> 
