<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const isLoginPage = computed(() => route.name === 'login')

// Initialize authentication on app start
onMounted(async () => {
  await authStore.initAuth()
  
  // Set viewport meta tag for better mobile experience
  const viewport = document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
  }
})
</script>

<template>
  <div id="app" :class="{ 'login-page': isLoginPage }">
    <AdminLayout v-if="!isLoginPage">
      <RouterView />
    </AdminLayout>
    <RouterView v-else />
  </div>
</template>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');

/* FontAwesome Fallback */
.fas, .far, .fab {
  font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 6 Brands", "FontAwesome", sans-serif !important;
  font-weight: 900;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.far {
  font-weight: 400;
}

.fab {
  font-weight: 400;
  font-family: "Font Awesome 6 Brands", "FontAwesome", sans-serif !important;
}

/* CSS Reset and Base Styles */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Force responsive behavior */
html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #333;
  background-color: #f8f9fa;
  line-height: 1.6;
  overflow-x: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

.login-page {
  background: transparent;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

/* Ensure all containers are responsive */
div, section, article, aside, header, footer, nav, main {
  box-sizing: border-box;
  max-width: 100%;
}

/* Mobile First Responsive Breakpoints */
@media screen and (max-width: 480px) {
  html {
    font-size: 14px;
  }
  
  #app {
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  
  body {
    font-size: 14px;
  }
}

@media screen and (min-width: 481px) and (max-width: 768px) {
  html {
    font-size: 15px;
  }
  
  body {
    font-size: 15px;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  html {
    font-size: 15px;
  }
}

@media screen and (min-width: 1025px) {
  html {
    font-size: 16px;
  }
}

/* Enhanced Mobile Responsive Utilities */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media screen and (max-width: 768px) {
  .container {
    padding: 0 0.75rem;
  }
}

@media screen and (max-width: 480px) {
  .container {
    padding: 0 0.5rem;
  }
}

/* Flexible Grid System */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media screen and (max-width: 1024px) {
  .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
}

@media screen and (max-width: 768px) {
  .grid-cols-4,
  .grid-cols-3,
  .grid-cols-2 { 
    grid-template-columns: 1fr; 
  }
}

/* Flexible Layout Classes */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.flex-wrap {
  flex-wrap: wrap;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-center {
  justify-content: center;
}

.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }

/* Responsive Text Sizes */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }

@media screen and (max-width: 768px) {
  .text-3xl { font-size: 1.5rem; }
  .text-2xl { font-size: 1.25rem; }
  .text-xl { font-size: 1.125rem; }
}

@media screen and (max-width: 480px) {
  .text-3xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.125rem; }
  .text-xl { font-size: 1rem; }
}

/* Responsive Spacing */
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }

.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-3 { margin: 0.75rem; }
.m-4 { margin: 1rem; }
.m-6 { margin: 1.5rem; }
.m-8 { margin: 2rem; }

@media screen and (max-width: 768px) {
  .p-8 { padding: 1.5rem; }
  .p-6 { padding: 1rem; }
  .m-8 { margin: 1.5rem; }
  .m-6 { margin: 1rem; }
}

@media screen and (max-width: 480px) {
  .p-8 { padding: 1rem; }
  .p-6 { padding: 0.75rem; }
  .p-4 { padding: 0.75rem; }
  .m-8 { margin: 1rem; }
  .m-6 { margin: 0.75rem; }
  .m-4 { margin: 0.75rem; }
}

/* Mobile-friendly buttons */
.btn-mobile {
  min-height: 44px; /* iOS recommended touch target */
  min-width: 44px;
  padding: 0.75rem 1rem;
}

@media screen and (max-width: 768px) {
  .btn-mobile {
    width: 100%;
    justify-content: center;
  }
}

/* Hide/Show utilities for responsive design */
.hidden { display: none; }

.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }

@media screen and (max-width: 768px) {
  .md\:hidden { display: none; }
  .md\:block { display: block; }
  .md\:flex { display: flex; }
}

@media screen and (max-width: 480px) {
  .sm\:hidden { display: none; }
  .sm\:block { display: block; }
  .sm\:flex { display: flex; }
}

@media screen and (min-width: 769px) {
  .lg\:block { display: block; }
  .lg\:flex { display: flex; }
  .lg\:hidden { display: none; }
}

/* Utility Classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Enhanced Focus Styles for Mobile */
*:focus {
  outline: 2px solid #007AFF;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #007AFF;
  outline-offset: 2px;
}

/* Touch-friendly focus for mobile */
@media (hover: none) and (pointer: coarse) {
  *:focus {
    outline: 3px solid #007AFF;
    outline-offset: 3px;
  }
}

/* Button Reset */
button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  min-height: 44px; /* Touch-friendly minimum */
}

/* Link Reset */
a {
  color: inherit;
  text-decoration: none;
  min-height: 44px; /* Touch-friendly minimum */
  display: inline-flex;
  align-items: center;
}

/* Form Element Improvements */
input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
  min-height: 44px; /* Touch-friendly minimum */
  padding: 0.75rem;
}

input[type="search"] {
  -webkit-appearance: none;
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  -webkit-appearance: none;
}

/* Enhanced Scrollbar Styling */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 2px solid #f1f1f1;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media screen and (max-width: 768px) {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-thumb {
    border: 1px solid #f1f1f1;
  }
}

/* High DPI Display Optimizations */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  body {
    font-weight: 400;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Enhanced Dark Mode Support */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  
  ::-webkit-scrollbar-track {
    background: #2d2d2d;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #555;
    border-color: #2d2d2d;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
}

/* Print Styles */
@media print {
  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  a,
  a:visited {
    text-decoration: underline;
  }
  
  abbr[title]:after {
    content: " (" attr(title) ")";
  }
  
  pre,
  blockquote {
    border: 1px solid #999;
    page-break-inside: avoid;
  }
  
  thead {
    display: table-header-group;
  }
  
  tr,
  img {
    page-break-inside: avoid;
  }
  
  img {
    max-width: 100% !important;
  }
  
  p,
  h2,
  h3 {
    orphans: 3;
    widows: 3;
  }
  
  h2,
  h3 {
    page-break-after: avoid;
  }
}

/* Loading States */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.loading * {
  cursor: wait !important;
}

/* Enhanced Animation Classes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* Error States */
.error {
  color: #dc3545;
  border-color: #dc3545;
}

.success {
  color: #28a745;
  border-color: #28a745;
}

.warning {
  color: #ffc107;
  border-color: #ffc107;
}

.info {
  color: #17a2b8;
  border-color: #17a2b8;
}

/* Mobile-specific improvements */
@media screen and (max-width: 768px) {
  /* Improve touch targets */
  button, a, input, select, textarea {
    min-height: 44px;
  }
  
  /* Better spacing for mobile */
  .mobile-spacing > * + * {
    margin-top: 1rem;
  }
  
  /* Stack elements vertically on mobile */
  .mobile-stack {
    flex-direction: column !important;
  }
  
  .mobile-stack > * {
    width: 100% !important;
  }
}

/* Tablet-specific improvements */
@media screen and (min-width: 769px) and (max-width: 1024px) {
  .tablet-cols-2 {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .tablet-stack {
    flex-direction: column !important;
  }
}

/* Landscape mobile improvements */
@media screen and (max-width: 768px) and (orientation: landscape) {
  #app {
    min-height: 100vh;
  }
  
  .landscape-row {
    flex-direction: row !important;
  }
}
</style>
