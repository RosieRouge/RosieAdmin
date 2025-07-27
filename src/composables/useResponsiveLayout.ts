import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useResponsiveLayout() {
  const isMobile = ref(window.innerWidth <= 1023)
  const isMainSidebarCollapsed = ref(false)

  // Computed for view classes
  const viewClasses = computed(() => ({
    'sidebar-collapsed': isMainSidebarCollapsed.value && !isMobile.value
  }))

  // Detect sidebar state
  const checkMainSidebarState = () => {
    const adminSidebar = document.querySelector('.sidebar')
    if (adminSidebar) {
      isMainSidebarCollapsed.value = adminSidebar.classList.contains('collapsed')
    }
  }

  // Handle window resize
  const handleResize = () => {
    isMobile.value = window.innerWidth <= 1023
  }

  // Setup function to be called in onMounted
  const setupResponsiveLayout = () => {
    // Add resize listener
    window.addEventListener('resize', handleResize)
    
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
    
    // Return cleanup function
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }

  return {
    isMobile,
    isMainSidebarCollapsed,
    viewClasses,
    setupResponsiveLayout
  }
} 