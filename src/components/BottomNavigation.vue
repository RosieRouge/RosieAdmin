<template>
  <nav class="bottom-navigation" :class="{ 'sidebar-collapsed': isMainSidebarCollapsed }">
    <RouterLink 
      to="/chats" 
      class="nav-item"
      :class="{ active: $route.name === 'chats' || $route.name === 'direct-chat' }"
    >
      <div class="nav-icon">
        <i class="fas fa-comments"></i>
        <span v-if="unreadChatsCount > 0" class="badge">{{ unreadChatsCount }}</span>
      </div>
      <span class="nav-label">Chats</span>
    </RouterLink>

    <RouterLink 
      to="/cases" 
      class="nav-item"
      :class="{ active: $route.name === 'cases' }"
    >
      <div class="nav-icon">
        <i class="fas fa-briefcase"></i>
        <span v-if="urgentCasesCount > 0" class="badge urgent">{{ urgentCasesCount }}</span>
      </div>
      <span class="nav-label">My Cases</span>
    </RouterLink>



    <RouterLink 
      to="/profile" 
      class="nav-item"
      :class="{ active: $route.name === 'profile' || $route.name === 'edit-profile' }"
    >
      <div class="nav-icon">
        <img 
          v-if="userAvatar"
          :src="userAvatar" 
          :alt="userName"
          class="profile-avatar"
        />
        <i v-else class="fas fa-user"></i>
      </div>
      <span class="nav-label">Profile</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Get user info
const userName = computed(() => authStore.profile?.name || 'User')
const userAvatar = computed(() => authStore.profile?.avatar)

// Mock counts - replace with actual store data when available
const unreadChatsCount = computed(() => 0) // TODO: Connect to actual unread count
const urgentCasesCount = computed(() => 0) // TODO: Connect to actual urgent cases count

// Detect if main app sidebar is collapsed by checking if we can find the collapsed class
const isMainSidebarCollapsed = ref(false)

const checkMainSidebarState = () => {
  const adminSidebar = document.querySelector('.sidebar')
  if (adminSidebar) {
    isMainSidebarCollapsed.value = adminSidebar.classList.contains('collapsed')
  }
}

onMounted(() => {
  // Check main sidebar state
  checkMainSidebarState()
  
  // Watch for sidebar changes using MutationObserver
  const observer = new MutationObserver(() => {
    checkMainSidebarState()
  })
  
  const adminSidebar = document.querySelector('.sidebar')
  if (adminSidebar) {
    observer.observe(adminSidebar, { attributes: true, attributeFilter: ['class'] })
  }
  
  // Store observer for cleanup
  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>

<style scoped>
.bottom-navigation {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(220, 107, 172, 0.2);
  padding: 0.5rem 0;
  position: fixed;
  bottom: 0;
  left: 280px; /* Account for admin sidebar */
  right: 0;
  z-index: 1000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  safe-area-inset-bottom: env(safe-area-inset-bottom);
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  transition: left 0.3s ease;
}

.bottom-navigation.sidebar-collapsed {
  left: 70px; /* Account for collapsed admin sidebar */
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.25rem;
  text-decoration: none;
  color: #666;
  transition: all 0.2s ease;
  position: relative;
  min-height: 60px;
  justify-content: center;
}

.nav-item:hover {
  color: #B91C1C;
  background: rgba(185, 28, 28, 0.05);
  border-radius: 12px;
}

.nav-item.active {
  color: #B91C1C;
  background: rgba(185, 28, 28, 0.1);
  border-radius: 12px;
}

.nav-icon {
  position: relative;
  margin-bottom: 0.25rem;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 500;
  text-align: center;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #B91C1C;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  border: 2px solid white;
  min-width: 18px;
}

.badge.urgent {
  background: #FF3B30;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.profile-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(185, 28, 28, 0.2);
}

.nav-item.active .profile-avatar {
  border-color: #B91C1C;
}

/* Mobile optimizations */
@media (max-width: 1024px) {
  .bottom-navigation,
  .bottom-navigation.sidebar-collapsed {
    left: 0; /* Full width on mobile/tablet */
  }
}

@media (max-width: 480px) {
  .nav-icon {
    font-size: 1.2rem;
    width: 28px;
    height: 28px;
  }
  
  .nav-label {
    font-size: 0.65rem;
  }
  
  .profile-avatar {
    width: 24px;
    height: 24px;
  }
  
  .badge {
    width: 16px;
    height: 16px;
    font-size: 0.55rem;
    min-width: 16px;
  }
}

/* Landscape phone adjustments */
@media (max-width: 768px) and (orientation: landscape) {
  .bottom-navigation {
    padding: 0.25rem 0;
  }
  
  .nav-item {
    min-height: 50px;
    padding: 0.25rem;
  }
  
  .nav-icon {
    margin-bottom: 0.125rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bottom-navigation {
    background: rgba(28, 28, 30, 0.95);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  .nav-item {
    color: #ffffff;
  }
  
  .nav-item:hover,
  .nav-item.active {
    background: rgba(185, 28, 28, 0.2);
  }
}

/* Mobile touch optimizations */
@media (max-width: 768px) {
  .bottom-navigation {
    padding: 0.75rem 0;
    min-height: 80px;
  }
  
  .nav-item {
    min-width: 70px;
    min-height: 60px;
    padding: 0.75rem 0.25rem;
    border-radius: 12px;
  }
  
  .nav-icon {
    font-size: 1.4rem;
    margin-bottom: 0.25rem;
    width: 36px;
    height: 36px;
  }
  
  .nav-label {
    font-size: 0.7rem;
    line-height: 1.1;
  }
  
  .profile-avatar {
    width: 32px;
    height: 32px;
  }
  
  .badge {
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    font-size: 0.7rem;
    border-width: 2px;
  }
}

@media (max-width: 480px) {
  .bottom-navigation {
    padding: 0.5rem 0;
    min-height: 70px;
  }
  
  .nav-item {
    min-width: 60px;
    min-height: 50px;
    padding: 0.5rem 0.125rem;
  }
  
  .nav-icon {
    font-size: 1.3rem;
    width: 32px;
    height: 32px;
  }
  
  .nav-label {
    font-size: 0.65rem;
  }
  
  .profile-avatar {
    width: 28px;
    height: 28px;
  }
}
</style> 