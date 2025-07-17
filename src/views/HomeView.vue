<script setup lang="ts">
// No additional logic needed for now
</script>

<template>
  <div class="home-view">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Rosie App Admin Panel</h1>
        <p class="hero-subtitle">Reproductive Health Support Platform Administration</p>
        <div class="hero-actions">
          <RouterLink to="/dashboard" class="btn btn-primary">
            <i class="fas fa-chart-bar"></i>
            Go to Dashboard
          </RouterLink>
          <RouterLink to="/user-management" class="btn btn-secondary">
            <i class="fas fa-users"></i>
            Manage Users
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2>Admin Features</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-users-medical"></i>
            </div>
            <h3>User Management</h3>
            <p>Manage clients, counselors, and admin users across the platform</p>
            <RouterLink to="/user-management" class="feature-link">
              Manage Users <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-briefcase-medical"></i>
            </div>
            <h3>Case Management</h3>
            <p>Oversee and coordinate client cases and counselor assignments</p>
            <RouterLink to="/case-management" class="feature-link">
              View Cases <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Crisis Alerts</h3>
            <p>Monitor and respond to urgent situations requiring immediate attention</p>
            <RouterLink to="/crisis-alerts" class="feature-link">
              View Alerts <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-people-group"></i>
            </div>
            <h3>Support Groups</h3>
            <p>Manage community support groups and their members</p>
            <RouterLink to="/support-groups" class="feature-link">
              Manage Groups <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-book-medical"></i>
            </div>
            <h3>Resources</h3>
            <p>Manage educational resources and support materials</p>
            <RouterLink to="/resources" class="feature-link">
              Manage Resources <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <h3>Analytics</h3>
            <p>View platform usage statistics and performance metrics</p>
            <RouterLink to="/analytics" class="feature-link">
              View Analytics <i class="fas fa-arrow-right"></i>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--rosie-background) 0%, white 100%);
}

.hero-section {
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.25rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition-normal);
}

.btn-primary {
  background: white;
  color: var(--rosie-primary);
}

.btn-primary:hover {
  background: var(--rosie-background);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: var(--rosie-primary);
  transform: translateY(-2px);
}

.features-section {
  padding: 4rem 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.features-section h2 {
  text-align: center;
  font-size: 2.5rem;
  color: var(--rosie-primary);
  margin: 0 0 3rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--rosie-secondary);
  transition: var(--transition-normal);
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  font-size: 2rem;
}

.feature-card h3 {
  color: var(--rosie-primary);
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
}

.feature-card p {
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--rosie-primary);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition-normal);
}

.feature-link:hover {
  color: var(--rosie-primary-dark);
  gap: 0.75rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero-section {
    padding: 3rem 1rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
  
  .features-section {
    padding: 3rem 1rem;
  }
  
  .features-section h2 {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .features-section h2 {
    font-size: 1.75rem;
  }
}
</style>
