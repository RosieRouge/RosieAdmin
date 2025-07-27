<template>
  <div class="admin-layout">
    <!-- Mobile Header Bar -->
    <header class="mobile-header">
      <button @click="toggleMobileMenu" class="mobile-menu-btn" title="Open Menu">
        <i class="fas fa-bars"></i>
        <span class="hamburger-fallback">☰</span>
      </button>
      <div class="mobile-logo">
        <i class="fas fa-heart-pulse"></i>
        <span>Rosie Admin</span>
      </div>
      <div class="mobile-user">
        <img 
          :src="adminUser?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'" 
          :alt="adminUser?.name || 'Admin'" 
          class="mobile-user-avatar"
        >
      </div>
    </header>

    <!-- Mobile Overlay -->
    <div 
      v-if="mobileMenuOpen" 
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
          <i class="fas fa-users-cog"></i>
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
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Group Chat Management</span>
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
          to="/analytics" 
          class="nav-item" 
          :class="{ active: route.name === 'analytics' }"
          @click="handleNavClick"
        >
          <i class="fas fa-chart-line"></i>
          <span v-show="!sidebarCollapsed || mobileMenuOpen">Analytics</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Page Content -->
      <main class="content">
        <slot></slot>
      </main>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import BottomNavigation from '@/components/BottomNavigation.vue'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const loading = ref(false)
const adminUser = ref<User | null>(null)
const isMobile = ref(false)
const crisisCount = ref(0)

// Removed pageTitle computed since we removed the main header

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

// Removed refreshData function since we removed the main header

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
      is_verified: true,
      last_active: new Date().toISOString(),
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

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
  color: white;
  z-index: 1001;
  padding: 0 1rem;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(185, 28, 28, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* Show mobile header on smaller screens */
@media (max-width: 1023px) {
  .mobile-header {
    display: flex !important;
  }
}

.mobile-menu-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.25rem;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 44px;
  min-height: 44px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-menu-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.mobile-menu-btn .hamburger-fallback {
  display: none;
  font-size: 1.5rem;
  line-height: 1;
}

.mobile-menu-btn .fas.fa-bars {
  display: block;
}

/* Fallback if Font Awesome doesn't load */
.mobile-menu-btn .fas.fa-bars:empty ~ .hamburger-fallback {
  display: block;
}

.mobile-menu-btn .fas.fa-bars:empty {
  display: none;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.mobile-logo i {
  font-size: 1.25rem;
}

.mobile-user {
  display: flex;
  align-items: center;
}

.mobile-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
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

/* Mobile sidebar behavior */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
    z-index: 1002;
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
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

/* Removed main header styles since we removed the main header */

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
  
  /* Mobile menu button now only exists in mobile header */
  
  .sidebar-toggle {
    display: none;
  }
  
  /* Removed mobile header styles since we removed the main header */
  
  .content {
    padding: 1rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .sidebar {
    width: 100vw;
  }
  
  /* Removed small mobile header styles since we removed the main header */
  
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
  
  .sidebar-toggle:hover,
  .mobile-menu-btn:hover {
    background-color: inherit;
  }
  
  .sidebar-toggle:active,
  .mobile-menu-btn:active {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* Mobile Responsive Styles */
@media (max-width: 1023px) {
  .mobile-header {
    display: flex !important;
  }
  
  /* Removed main-header reference since we removed the main header */
  
  .content {
    margin-left: 0 !important;
    padding-top: 80px !important; /* Account for mobile header */
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .sidebar-toggle {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .mobile-header {
    display: flex !important;
    padding: 0 0.75rem;
  }
  
  .mobile-logo span {
    display: none;
  }
  
  .content {
    padding: 0.75rem;
    padding-top: 80px;
  }
  
  .mobile-user-avatar {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .mobile-header {
    padding: 0 0.5rem;
    height: 56px;
  }
  
  .mobile-logo {
    font-size: 1rem;
  }
  
  .mobile-logo i {
    font-size: 1.1rem;
  }
  
  .content {
    padding: 0.5rem;
    padding-top: 76px;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .mobile-header {
    display: none;
  }
  
  .content {
    margin-left: 280px;
    padding-top: 0;
  }
  
  .admin-layout.sidebar-collapsed .content {
    margin-left: 70px;
  }
}
</style> 
