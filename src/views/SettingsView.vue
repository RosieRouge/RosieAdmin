<template>
  <div class="settings-view">
    <!-- Header -->
    <div class="header-section">
      <div class="header-left">
        <h2>Platform Settings</h2>
        <p>Configure and manage platform-wide settings</p>
      </div>
      <div class="header-actions">
        <button @click="resetToDefaults" class="btn secondary" :disabled="!hasChanges">
          <i class="fas fa-undo"></i>
          <span class="btn-text">Reset to Defaults</span>
        </button>
        <button @click="saveSettings" class="btn primary" :disabled="saving || !hasChanges">
          <i class="fas fa-save" :class="{ 'fa-spin': saving }"></i>
          <span class="btn-text">{{ saving ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>
    </div>

    <!-- Settings Navigation -->
    <div class="settings-nav">
      <button 
        v-for="section in settingSections" 
        :key="section.id"
        @click="activeSection = section.id"
        :class="{ active: activeSection === section.id }"
        class="nav-btn"
      >
        <i :class="section.icon"></i>
        <span>{{ section.name }}</span>
        <span v-if="sectionHasChanges(section.id)" class="change-indicator"></span>
      </button>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <!-- General Settings -->
      <div v-if="activeSection === 'general'" class="settings-section">
        <div class="section-header">
          <h3>General Settings</h3>
          <p>Basic platform configuration and branding</p>
        </div>
        
        <div class="settings-grid">
          <div class="setting-group">
            <h4>Platform Identity</h4>
            <div class="form-group">
              <label for="platformName">Platform Name</label>
              <input 
                id="platformName"
                v-model="settings.general.platform_name" 
                type="text"
                placeholder="Community Connect"
              >
            </div>
            
            <div class="form-group">
              <label for="platformTagline">Tagline</label>
              <input 
                id="platformTagline"
                v-model="settings.general.platform_tagline" 
                type="text"
                placeholder="Connect with your community"
              >
            </div>
            
            <div class="form-group">
              <label for="platformDescription">Description</label>
              <textarea 
                id="platformDescription"
                v-model="settings.general.platform_description" 
                placeholder="A platform for community engagement..."
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div class="setting-group">
            <h4>Contact Information</h4>
            <div class="form-group">
              <label for="supportEmail">Support Email</label>
              <input 
                id="supportEmail"
                v-model="settings.general.support_email" 
                type="email"
                placeholder="support@example.com"
              >
            </div>
            
            <div class="form-group">
              <label for="contactPhone">Contact Phone</label>
              <input 
                id="contactPhone"
                v-model="settings.general.contact_phone" 
                type="tel"
                placeholder="+1 (555) 123-4567"
              >
            </div>
            
            <div class="form-group">
              <label for="businessAddress">Business Address</label>
              <textarea 
                id="businessAddress"
                v-model="settings.general.business_address" 
                placeholder="123 Main St, City, State 12345"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div v-if="activeSection === 'security'" class="settings-section">
        <div class="section-header">
          <h3>Security Settings</h3>
          <p>Authentication, authorization, and security policies</p>
        </div>
        
        <div class="settings-grid">
          <div class="setting-group">
            <h4>Authentication</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.security.require_email_verification">
                <span class="checkmark"></span>
                Require email verification for new accounts
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.security.enable_two_factor">
                <span class="checkmark"></span>
                Enable two-factor authentication
              </label>
            </div>
            
            <div class="form-group">
              <label for="passwordMinLength">Minimum Password Length</label>
              <input 
                id="passwordMinLength"
                v-model.number="settings.security.password_min_length" 
                type="number"
                min="6"
                max="50"
              >
            </div>
            
            <div class="form-group">
              <label for="sessionTimeout">Session Timeout (minutes)</label>
              <input 
                id="sessionTimeout"
                v-model.number="settings.security.session_timeout_minutes" 
                type="number"
                min="5"
                max="1440"
              >
            </div>
          </div>
          
          <div class="setting-group">
            <h4>Account Security</h4>
            <div class="form-group">
              <label for="maxLoginAttempts">Max Login Attempts</label>
              <input 
                id="maxLoginAttempts"
                v-model.number="settings.security.max_login_attempts" 
                type="number"
                min="3"
                max="10"
              >
            </div>
            
            <div class="form-group">
              <label for="lockoutDuration">Account Lockout Duration (minutes)</label>
              <input 
                id="lockoutDuration"
                v-model.number="settings.security.lockout_duration_minutes" 
                type="number"
                min="5"
                max="1440"
              >
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.security.enable_captcha">
                <span class="checkmark"></span>
                Enable CAPTCHA for sensitive actions
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div v-if="activeSection === 'notifications'" class="settings-section">
        <div class="section-header">
          <h3>Notification Settings</h3>
          <p>Configure email and in-app notification preferences</p>
        </div>
        
        <div class="settings-grid">
          <div class="setting-group">
            <h4>Email Notifications</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.notifications.email_new_user">
                <span class="checkmark"></span>
                New user registrations
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.notifications.email_new_community">
                <span class="checkmark"></span>
                New community applications
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.notifications.email_flagged_content">
                <span class="checkmark"></span>
                Flagged content reports
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.notifications.email_system_alerts">
                <span class="checkmark"></span>
                System alerts and errors
              </label>
            </div>
          </div>
          
          <div class="setting-group">
            <h4>Push Notifications</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.notifications.push_new_messages">
                <span class="checkmark"></span>
                New messages in subscribed communities
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.notifications.push_event_reminders">
                <span class="checkmark"></span>
                Event reminders
              </label>
            </div>
            
            <div class="form-group">
              <label for="notificationFreq">Digest Frequency</label>
              <select id="notificationFreq" v-model="settings.notifications.digest_frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Moderation -->
      <div v-if="activeSection === 'moderation'" class="settings-section">
        <div class="section-header">
          <h3>Content Moderation</h3>
          <p>Auto-moderation rules and content policies</p>
        </div>
        
        <div class="settings-grid">
          <div class="setting-group">
            <h4>Auto-Moderation</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.moderation.enable_auto_moderation">
                <span class="checkmark"></span>
                Enable automatic content moderation
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.moderation.enable_spam_detection">
                <span class="checkmark"></span>
                Enable spam detection
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.moderation.enable_profanity_filter">
                <span class="checkmark"></span>
                Enable profanity filter
              </label>
            </div>
            
            <div class="form-group">
              <label for="autoModThreshold">Auto-moderation threshold (0-100)</label>
              <input 
                id="autoModThreshold"
                v-model.number="settings.moderation.auto_mod_threshold" 
                type="range"
                min="0"
                max="100"
              >
              <div class="range-value">{{ settings.moderation.auto_mod_threshold }}%</div>
            </div>
          </div>
          
          <div class="setting-group">
            <h4>Content Policies</h4>
            <div class="form-group">
              <label for="maxMessageLength">Max Message Length</label>
              <input 
                id="maxMessageLength"
                v-model.number="settings.moderation.max_message_length" 
                type="number"
                min="50"
                max="10000"
              >
            </div>
            
            <div class="form-group">
              <label for="maxAttachments">Max Attachments per Message</label>
              <input 
                id="maxAttachments"
                v-model.number="settings.moderation.max_attachments" 
                type="number"
                min="0"
                max="10"
              >
            </div>
            
            <div class="form-group">
              <label for="allowedFileTypes">Allowed File Types</label>
              <input 
                id="allowedFileTypes"
                v-model="settings.moderation.allowed_file_types" 
                type="text"
                placeholder="jpg,png,gif,pdf,doc"
              >
            </div>
            
            <div class="form-group">
              <label for="maxFileSize">Max File Size (MB)</label>
              <input 
                id="maxFileSize"
                v-model.number="settings.moderation.max_file_size_mb" 
                type="number"
                min="1"
                max="100"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div v-if="activeSection === 'users'" class="settings-section">
        <div class="section-header">
          <h3>User Management</h3>
          <p>User registration and account management policies</p>
        </div>
        
        <div class="settings-grid">
          <div class="setting-group">
            <h4>Registration</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.users.allow_public_registration">
                <span class="checkmark"></span>
                Allow public registration
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.users.require_admin_approval">
                <span class="checkmark"></span>
                Require admin approval for new accounts
              </label>
            </div>
            
            <div class="form-group">
              <label for="defaultUserRole">Default User Role</label>
              <select id="defaultUserRole" v-model="settings.users.default_user_role">
                <option value="member">Member</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>
          
          <div class="setting-group">
            <h4>Profile Settings</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.users.allow_profile_images">
                <span class="checkmark"></span>
                Allow profile images
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.users.allow_display_name_change">
                <span class="checkmark"></span>
                Allow display name changes
              </label>
            </div>
            
            <div class="form-group">
              <label for="profileImageMaxSize">Profile Image Max Size (MB)</label>
              <input 
                id="profileImageMaxSize"
                v-model.number="settings.users.profile_image_max_size_mb" 
                type="number"
                min="1"
                max="10"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- System Settings -->
      <div v-if="activeSection === 'system'" class="settings-section">
        <div class="section-header">
          <h3>System Settings</h3>
          <p>Performance, maintenance, and technical configuration</p>
        </div>
        
        <div class="settings-grid">
          <div class="setting-group">
            <h4>Performance</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.system.enable_caching">
                <span class="checkmark"></span>
                Enable response caching
              </label>
            </div>
            
            <div class="form-group">
              <label for="cacheExpiry">Cache Expiry (minutes)</label>
              <input 
                id="cacheExpiry"
                v-model.number="settings.system.cache_expiry_minutes" 
                type="number"
                min="1"
                max="1440"
              >
            </div>
            
            <div class="form-group">
              <label for="maxConcurrentUsers">Max Concurrent Users</label>
              <input 
                id="maxConcurrentUsers"
                v-model.number="settings.system.max_concurrent_users" 
                type="number"
                min="100"
                max="10000"
              >
            </div>
          </div>
          
          <div class="setting-group">
            <h4>Maintenance</h4>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.system.maintenance_mode">
                <span class="checkmark"></span>
                Maintenance mode
              </label>
            </div>
            
            <div class="form-group">
              <label for="maintenanceMessage">Maintenance Message</label>
              <textarea 
                id="maintenanceMessage"
                v-model="settings.system.maintenance_message" 
                placeholder="System is temporarily unavailable for maintenance..."
                rows="2"
                :disabled="!settings.system.maintenance_mode"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="logRetention">Log Retention (days)</label>
              <input 
                id="logRetention"
                v-model.number="settings.system.log_retention_days" 
                type="number"
                min="7"
                max="365"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Confirmation Modal -->
    <div v-if="showSaveConfirmation" class="modal-overlay" @click="showSaveConfirmation = false">
      <div class="modal-content save-confirmation" @click.stop>
        <div class="modal-header">
          <h3>Settings Saved Successfully</h3>
        </div>
        <div class="modal-body">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <p>Your platform settings have been updated and are now active.</p>
        </div>
        <div class="modal-footer">
          <button @click="showSaveConfirmation = false" class="btn primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

// Component state
const saving = ref(false)
const activeSection = ref('general')
const showSaveConfirmation = ref(false)

// Settings sections
const settingSections = ref([
  { id: 'general', name: 'General', icon: 'fas fa-cog' },
  { id: 'security', name: 'Security', icon: 'fas fa-shield-alt' },
  { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
  { id: 'moderation', name: 'Moderation', icon: 'fas fa-gavel' },
  { id: 'users', name: 'Users', icon: 'fas fa-users' },
  { id: 'system', name: 'System', icon: 'fas fa-server' }
])

// Original settings for comparison
const originalSettings = ref<any>({})

// Settings data
const settings = ref({
  general: {
    platform_name: 'Community Connect',
    platform_tagline: 'Connect with your community',
    platform_description: 'A platform for meaningful community engagement and connection.',
    support_email: 'support@communityconnect.com',
    contact_phone: '+1 (555) 123-4567',
    business_address: '123 Community St\nCity, State 12345'
  },
  security: {
    require_email_verification: true,
    enable_two_factor: false,
    password_min_length: 8,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    enable_captcha: true
  },
  notifications: {
    email_new_user: true,
    email_new_community: true,
    email_flagged_content: true,
    email_system_alerts: true,
    push_new_messages: true,
    push_event_reminders: true,
    digest_frequency: 'daily'
  },
  moderation: {
    enable_auto_moderation: true,
    enable_spam_detection: true,
    enable_profanity_filter: true,
    auto_mod_threshold: 75,
    max_message_length: 2000,
    max_attachments: 3,
    allowed_file_types: 'jpg,jpeg,png,gif,pdf,doc,docx',
    max_file_size_mb: 10
  },
  users: {
    allow_public_registration: true,
    require_admin_approval: false,
    default_user_role: 'member',
    allow_profile_images: true,
    allow_display_name_change: true,
    profile_image_max_size_mb: 5
  },
  system: {
    enable_caching: true,
    cache_expiry_minutes: 60,
    max_concurrent_users: 1000,
    maintenance_mode: false,
    maintenance_message: 'System is temporarily unavailable for maintenance. Please check back soon.',
    log_retention_days: 30
  }
})

onMounted(async () => {
  await loadSettings()
  // Store original settings for comparison
  originalSettings.value = JSON.parse(JSON.stringify(settings.value))
})

const loadSettings = async () => {
  try {
    // In a real implementation, load settings from database
    // For now, we'll use the default values
    console.log('Loading platform settings...')
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    // In a real implementation, save to database
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    // Update original settings
    originalSettings.value = JSON.parse(JSON.stringify(settings.value))
    
    showSaveConfirmation.value = true
    console.log('Settings saved successfully')
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Failed to save settings. Please try again.')
  } finally {
    saving.value = false
  }
}

const resetToDefaults = () => {
  if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
    // Reset to original values
    settings.value = JSON.parse(JSON.stringify(originalSettings.value))
  }
}

// Computed properties
const hasChanges = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value)
})

const sectionHasChanges = (sectionId: string) => {
  if (!originalSettings.value[sectionId]) return false
  return JSON.stringify(settings.value[sectionId]) !== JSON.stringify(originalSettings.value[sectionId])
}
</script>

<style scoped>
.settings-view {
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
  .settings-view {
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
  .settings-view {
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