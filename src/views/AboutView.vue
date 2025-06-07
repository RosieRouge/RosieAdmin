<template>
  <div class="about">
    <div class="about-content">
      <h1>About Admin Panel</h1>
      <p>Community Connect Admin Panel - Manage your platform with ease</p>
    </div>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.about-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.about-content h1 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 2rem;
}

.about-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .about {
    padding: 1.5rem;
    min-height: 50vh;
  }
  
  .about-content {
    padding: 2rem;
  }
  
  .about-content h1 {
    font-size: 1.5rem;
  }
  
  .about-content p {
    font-size: 1rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .about {
    padding: 1rem;
    min-height: 40vh;
  }
  
  .about-content {
    padding: 1.5rem;
  }
  
  .about-content h1 {
    font-size: 1.25rem;
  }
  
  .about-content p {
    font-size: 0.9rem;
  }
}

/* Tablet */
@media screen and (min-width: 769px) and (max-width: 1024px) {
  .about {
    min-height: 70vh;
  }
}

/* Desktop */
@media screen and (min-width: 1025px) {
  .about {
    min-height: 100vh;
  }
  
  .about-content h1 {
    font-size: 2.5rem;
  }
  
  .about-content p {
    font-size: 1.2rem;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .about-content {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style>
