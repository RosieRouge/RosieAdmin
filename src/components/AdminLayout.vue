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
          <i class="fas fa-users-cog"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Admin Panel</span>
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
          to="/users" 
          class="nav-item" 
          :class="{ active: route.name === 'users' }"
          @click="handleNavClick"
        >
          <i class="fas fa-users"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Users</span>
        </RouterLink>

        <RouterLink 
          to="/communities" 
          class="nav-item" 
          :class="{ active: route.name === 'communities' }"
          @click="handleNavClick"
        >
          <i class="fas fa-layer-group"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Communities</span>
        </RouterLink>



        <RouterLink 
          to="/events" 
          class="nav-item" 
          :class="{ active: route.name === 'events' }"
          @click="handleNavClick"
        >
          <i class="fas fa-calendar-alt"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Events</span>
        </RouterLink>

        <RouterLink 
          to="/messages" 
          class="nav-item" 
          :class="{ active: route.name === 'messages' }"
          @click="handleNavClick"
        >
          <i class="fas fa-envelope"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Messages</span>
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
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          </button>
          <div class="user-menu">
            <img 
              :src="adminUser?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'" 
              :alt="adminUser?.name || 'Admin'" 
              class="user-avatar"
            >
            <span class="user-name">{{ adminUser?.name || 'Admin' }}</span>
            <button @click="logout" class="logout-btn" title="Logout">
              <i class="fas fa-sign-out-alt"></i>
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

const pageTitle = computed(() => {
  const routeNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    communities: 'Community Management',

    events: 'Event Management',
    messages: 'Message Moderation',
    analytics: 'Analytics',
    settings: 'Settings'
  }
  return routeNameMap[route.name as string] || 'Admin Panel'
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (!error && data) {
      adminUser.value = data
    }
  }
}

onMounted(() => {
  loadAdminUser()
  checkMobile()
  window.addEventListener('resize', checkMobile)
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
  background-color: #f8f9fa;
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
  width: 250px;
  background-color: #2c3e50;
  color: white;
  transition: all 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #34495e;
  min-height: 70px;
  box-sizing: border-box;
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
  color: #3498db;
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
  background-color: #34495e;
}

.sidebar-nav {
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  min-height: 56px;
  box-sizing: border-box;
  white-space: nowrap;
}

.nav-item:hover {
  background-color: #34495e;
  color: white;
}

.nav-item.active {
  background-color: #3498db;
  color: white;
  border-left-color: #2980b9;
}

.nav-item i {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  margin-left: 250px;
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
  background-color: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 70px;
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
  color: #6c757d;
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
  background-color: #f8f9fa;
}

.header-left h1 {
  color: #2c3e50;
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
  border: 1px solid #dee2e6;
  color: #6c757d;
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
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  max-width: 200px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #495057;
  font-size: 0.9rem;
}

.logout-btn {
  background: none;
  border: none;
  color: #7f8c8d;
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
  background-color: #e74c3c;
  color: white;
}

.content {
  flex: 1;
  padding: 2rem;
  padding-top: 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
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
    background-color: #34495e;
  }
  
  .refresh-btn:hover,
  .logout-btn:hover,
  .sidebar-toggle:hover,
  .mobile-menu-btn:hover {
    background-color: inherit;
  }
  
  .refresh-btn:active {
    background-color: #f8f9fa;
  }
  
  .logout-btn:active {
    background-color: #e74c3c;
    color: white;
  }
  
  .sidebar-toggle:active,
  .mobile-menu-btn:active {
    background-color: #34495e;
  }
}
</style> 