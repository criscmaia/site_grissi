/**
 * Historia.js - Chapter-Based Storytelling Interactions
 * Enhanced JavaScript for reading progress and smooth animations
 */

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smooth scroll to element
 * @param {HTMLElement} element - Target element
 * @param {number} offset - Offset from top (default: 100px for header)
 */
function smoothScrollTo(element, offset = 100) {
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  });
}

// ========================================
// READING PROGRESS INDICATOR
// ========================================

class ReadingProgressIndicator {
  constructor() {
    this.progressBar = document.getElementById('progress-bar');
    this.storyContainer = document.querySelector('.story-container');
    
    if (!this.progressBar || !this.storyContainer) {
      console.warn('Reading progress elements not found');
      return;
    }
    
    this.init();
  }
  
  init() {
    // Throttled scroll handler for performance
    const handleScroll = throttle(() => {
      this.updateProgress();
    }, 10);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial progress calculation
    this.updateProgress();
  }
  
  updateProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate progress as percentage
    const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    // Update progress bar width with smooth transition
    this.progressBar.style.width = `${clampedProgress}%`;
    
    // Add subtle glow effect when nearing completion
    if (clampedProgress > 90) {
      this.progressBar.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
    } else {
      this.progressBar.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
    }
  }
}

// ========================================
// CHAPTER NAVIGATION SYSTEM
// ========================================

class ChapterNavigation {
  constructor() {
    this.navItems = document.querySelectorAll('.chapter-nav-item');
    this.chapters = document.querySelectorAll('.chapter');
    this.activeChapter = null;
    
    if (!this.navItems.length || !this.chapters.length) {
      console.warn('Chapter navigation elements not found');
      return;
    }
    
    this.init();
  }
  
  init() {
    // Add click handlers to navigation items
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.dataset.target;
        const targetChapter = document.getElementById(targetId);
        
        if (targetChapter) {
          smoothScrollTo(targetChapter, 120);
          
          // Add feedback animation
          if (!prefersReducedMotion()) {
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
              item.style.transform = '';
            }, 150);
          }
        }
      });
      
      // Add hover sound effect (visual feedback only)
      item.addEventListener('mouseenter', () => {
        if (!prefersReducedMotion()) {
          item.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        }
      });
    });
    
    // Set up intersection observer for active chapter tracking
    this.setupChapterObserver();
  }
  
  setupChapterObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0% -70% 0%', // Trigger when chapter is in the middle area
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveChapter(entry.target);
        }
      });
    }, observerOptions);
    
    this.chapters.forEach(chapter => {
      observer.observe(chapter);
    });
  }
  
  setActiveChapter(chapter) {
    if (this.activeChapter === chapter) return;
    
    this.activeChapter = chapter;
    const chapterId = chapter.id;
    
    // Update navigation item states
    this.navItems.forEach(item => {
      const isActive = item.dataset.target === chapterId;
      item.classList.toggle('active', isActive);
      
      if (isActive && !prefersReducedMotion()) {
        // Subtle pulse animation for active item
        item.style.animation = 'pulse 2s ease-in-out infinite';
      } else {
        item.style.animation = '';
      }
    });
    
    // Trigger chapter entrance animations
    this.animateChapterEntrance(chapter);
  }
  
  animateChapterEntrance(chapter) {
    if (prefersReducedMotion()) return;
    
    // Add entrance animation class
    chapter.classList.add('animate-fadeInUp');
    
    // Animate child elements with stagger effect
    const animatableElements = chapter.querySelectorAll(
      '.key-moment, .character-card, .family-tree, .pull-quote, .legacy-stat'
    );
    
    animatableElements.forEach((element, index) => {
      element.style.animationDelay = `${index * 0.1}s`;
      element.classList.add('animate-fadeInUp');
    });
    
    // Remove classes after animation completes
    setTimeout(() => {
      chapter.classList.remove('animate-fadeInUp');
      animatableElements.forEach(element => {
        element.classList.remove('animate-fadeInUp');
        element.style.animationDelay = '';
      });
    }, 1000);
  }
}

// ========================================
// SCROLL ANIMATIONS CONTROLLER
// ========================================

class ScrollAnimationsController {
  constructor() {
    this.animatedElements = new Set();
    this.observer = null;
    
    this.init();
  }
  
  init() {
    if (prefersReducedMotion()) {
      console.log('Reduced motion preferred - skipping scroll animations');
      return;
    }
    
    this.setupIntersectionObserver();
    this.observeElements();
  }
  
  setupIntersectionObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
        }
      });
    }, observerOptions);
  }
  
  observeElements() {
    // Select elements for scroll animations
    const elementsToAnimate = document.querySelectorAll(`
      .key-moment,
      .character-card,
      .family-tree,
      .legacy-stat,
      .official-document,
      .pull-quote,
      .chapter-transition
    `);
    
    elementsToAnimate.forEach(element => {
      // Initially hide elements
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      
      this.observer.observe(element);
    });
  }
  
  animateElement(element) {
    // Determine animation direction based on element position
    const rect = element.getBoundingClientRect();
    const isFromLeft = rect.left < window.innerWidth * 0.5;
    
    // Apply entrance animation
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
    
    // Add subtle side movement for variety
    if (isFromLeft) {
      element.style.transform = 'translateY(0) translateX(10px)';
      setTimeout(() => {
        element.style.transform = 'translateY(0) translateX(0)';
      }, 100);
    }
    
    // Special animations for specific element types
    if (element.classList.contains('legacy-stat')) {
      this.animateStatCounter(element);
    }
  }
  
  animateStatCounter(statElement) {
    const numberElement = statElement.querySelector('.stat-number');
    if (!numberElement) return;
    
    const finalValue = numberElement.textContent.replace(/[^\d]/g, '');
    if (!finalValue) return;
    
    const target = parseInt(finalValue);
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        numberElement.textContent = Math.floor(current) + (numberElement.textContent.includes('+') ? '+' : '');
        requestAnimationFrame(updateCounter);
      } else {
        numberElement.textContent = target + (numberElement.textContent.includes('+') ? '+' : '');
      }
    };
    
    // Start counter animation after a brief delay
    setTimeout(updateCounter, 200);
  }
}

// ========================================
// CHAPTER BACKGROUND ANIMATIONS
// ========================================

class ChapterBackgroundAnimations {
  constructor() {
    this.chapters = document.querySelectorAll('.chapter');
    this.animationFrameId = null;
    
    if (prefersReducedMotion()) {
      console.log('Reduced motion preferred - skipping background animations');
      return;
    }
    
    this.init();
  }
  
  init() {
    this.chapters.forEach(chapter => {
      this.setupChapterAnimation(chapter);
    });
  }
  
  setupChapterAnimation(chapter) {
    const chapterNumber = chapter.dataset.chapter;
    
    switch(chapterNumber) {
      case '1':
        this.setupItalianCountrysideAnimation(chapter);
        break;
      case '2':
        this.setupUnionAnimation(chapter);
        break;
      case '3':
        this.setupOceanAnimation(chapter);
        break;
      case '4':
        this.setupBrazilAnimation(chapter);
        break;
      case '5':
        this.setupLegacyAnimation(chapter);
        break;
    }
  }
  
  setupItalianCountrysideAnimation(chapter) {
    const background = chapter.querySelector('.chapter-background');
    if (!background) return;
    
    let opacity = 0.03;
    let direction = 1;
    
    const animate = () => {
      opacity += direction * 0.0005;
      if (opacity >= 0.08) direction = -1;
      if (opacity <= 0.02) direction = 1;
      
      background.style.opacity = opacity;
      
      if (this.isChapterVisible(chapter)) {
        requestAnimationFrame(animate);
      }
    };
    
    // Start animation when chapter is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(chapter);
  }
  
  setupUnionAnimation(chapter) {
    const background = chapter.querySelector('.chapter-background');
    if (!background) return;
    
    let rotation = 0;
    
    const animate = () => {
      rotation += 0.5;
      background.style.transform = `rotate(${rotation}deg)`;
      
      if (this.isChapterVisible(chapter)) {
        requestAnimationFrame(animate);
      }
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(chapter);
  }
  
  setupOceanAnimation(chapter) {
    // Wave animation is handled by CSS, just ensure it's active when visible
    const background = chapter.querySelector('.chapter-background');
    if (!background) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          background.style.animationPlayState = 'running';
        } else {
          background.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(chapter);
  }
  
  setupBrazilAnimation(chapter) {
    const background = chapter.querySelector('.chapter-background');
    if (!background) return;
    
    let scale = 1;
    let direction = 1;
    
    const animate = () => {
      scale += direction * 0.001;
      if (scale >= 1.1) direction = -1;
      if (scale <= 0.9) direction = 1;
      
      background.style.transform = `scale(${scale})`;
      
      if (this.isChapterVisible(chapter)) {
        requestAnimationFrame(animate);
      }
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(chapter);
  }
  
  setupLegacyAnimation(chapter) {
    // Rotation animation is handled by CSS, just ensure performance
    const background = chapter.querySelector('.chapter-background');
    if (!background) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          background.style.animationPlayState = 'running';
        } else {
          background.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(chapter);
  }
  
  isChapterVisible(chapter) {
    const rect = chapter.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
}

// ========================================
// INTERACTIVE ELEMENTS CONTROLLER
// ========================================

class InteractiveElementsController {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupCharacterCardInteractions();
    this.setupTimelineInteractions();
    this.setupDocumentInteractions();
    this.setupFamilyTreeInteractions();
  }
  
  setupCharacterCardInteractions() {
    const characterCards = document.querySelectorAll('.character-card');
    
    characterCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (prefersReducedMotion()) return;
        
        card.style.transform = 'translateX(15px) scale(1.02)';
        card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
      });
      
      card.addEventListener('mouseleave', () => {
        if (prefersReducedMotion()) return;
        
        card.style.transform = 'translateX(0) scale(1)';
        card.style.boxShadow = '';
      });
    });
  }
  
  setupTimelineInteractions() {
    const timelineEvents = document.querySelectorAll('.timeline-event');
    
    timelineEvents.forEach(event => {
      event.addEventListener('mouseenter', () => {
        if (prefersReducedMotion()) return;
        
        const eventDot = event.querySelector('::before');
        event.style.transform = 'translateX(10px)';
        event.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        event.style.borderRadius = '8px';
        event.style.padding = '1rem';
      });
      
      event.addEventListener('mouseleave', () => {
        if (prefersReducedMotion()) return;
        
        event.style.transform = '';
        event.style.backgroundColor = '';
        event.style.borderRadius = '';
        event.style.padding = '';
      });
    });
  }
  
  setupDocumentInteractions() {
    const documents = document.querySelectorAll('.official-document');
    
    documents.forEach(doc => {
      doc.addEventListener('click', () => {
        // Toggle expanded state
        doc.classList.toggle('expanded');
        
        if (doc.classList.contains('expanded')) {
          doc.style.transform = 'scale(1.02)';
          doc.style.zIndex = '10';
          doc.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.2)';
        } else {
          doc.style.transform = '';
          doc.style.zIndex = '';
          doc.style.boxShadow = '';
        }
      });
    });
  }
  
  setupFamilyTreeInteractions() {
    const familyTrees = document.querySelectorAll('.family-tree');
    
    familyTrees.forEach(tree => {
      const children = tree.querySelectorAll('.child');
      
      children.forEach(child => {
        child.addEventListener('mouseenter', () => {
          if (prefersReducedMotion()) return;
          
          child.style.transform = 'translateY(-5px) scale(1.05)';
          child.style.zIndex = '5';
        });
        
        child.addEventListener('mouseleave', () => {
          if (prefersReducedMotion()) return;
          
          child.style.transform = '';
          child.style.zIndex = '';
        });
      });
    });
  }
}

// ========================================
// PERFORMANCE MONITOR
// ========================================

class PerformanceMonitor {
  constructor() {
    this.frameRate = 0;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    if (process.env.NODE_ENV === 'development') {
      this.init();
    }
  }
  
  init() {
    this.monitorFrameRate();
    this.monitorScrollPerformance();
  }
  
  monitorFrameRate() {
    const measureFrameRate = (currentTime) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        this.frameRate = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        if (this.frameRate < 50) {
          console.warn(`Low frame rate detected: ${this.frameRate} fps`);
          this.optimizeForPerformance();
        }
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }
  
  monitorScrollPerformance() {
    let scrollTimeout;
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        isScrolling = true;
        document.body.classList.add('is-scrolling');
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        document.body.classList.remove('is-scrolling');
      }, 100);
    }, { passive: true });
  }
  
  optimizeForPerformance() {
    // Reduce animation complexity if performance is poor
    document.body.classList.add('reduced-animations');
    
    const backgroundAnimations = document.querySelectorAll('.chapter-background');
    backgroundAnimations.forEach(bg => {
      bg.style.animationDuration = '30s'; // Slower animations
    });
    
    console.log('Performance optimizations applied');
  }
}

// ========================================
// KEYBOARD NAVIGATION
// ========================================

class KeyboardNavigation {
  constructor() {
    this.currentChapterIndex = 0;
    this.chapters = Array.from(document.querySelectorAll('.chapter'));
    
    this.init();
  }
  
  init() {
    document.addEventListener('keydown', (e) => {
      // Only handle navigation if no input is focused
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      
      switch(e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          this.navigateToNextChapter();
          break;
          
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          this.navigateToPreviousChapter();
          break;
          
        case 'Home':
          e.preventDefault();
          this.navigateToChapter(0);
          break;
          
        case 'End':
          e.preventDefault();
          this.navigateToChapter(this.chapters.length - 1);
          break;
          
        case 'Escape':
          // Return to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
      }
    });
  }
  
  navigateToNextChapter() {
    if (this.currentChapterIndex < this.chapters.length - 1) {
      this.currentChapterIndex++;
      this.navigateToChapter(this.currentChapterIndex);
    }
  }
  
  navigateToPreviousChapter() {
    if (this.currentChapterIndex > 0) {
      this.currentChapterIndex--;
      this.navigateToChapter(this.currentChapterIndex);
    }
  }
  
  navigateToChapter(index) {
    if (index >= 0 && index < this.chapters.length) {
      this.currentChapterIndex = index;
      smoothScrollTo(this.chapters[index], 120);
    }
  }
}

// ========================================
// MAIN APPLICATION INITIALIZATION
// ========================================

class HistoriaApp {
  constructor() {
    this.components = [];
    this.isInitialized = false;
  }
  
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Wait for DOM to be fully loaded
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Initialize all components
      this.components.push(new ReadingProgressIndicator());
      this.components.push(new ChapterNavigation());
      this.components.push(new ScrollAnimationsController());
      this.components.push(new ChapterBackgroundAnimations());
      this.components.push(new InteractiveElementsController());
      this.components.push(new KeyboardNavigation());
      
      // Initialize performance monitoring in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        this.components.push(new PerformanceMonitor());
      }
      
      this.isInitialized = true;
      console.log('Historia app initialized successfully');
      
      // Add loaded class for CSS animations
      document.body.classList.add('app-loaded');
      
    } catch (error) {
      console.error('Error initializing Historia app:', error);
    }
  }
  
  destroy() {
    // Cleanup method for SPA scenarios
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    
    this.components = [];
    this.isInitialized = false;
  }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

// Initialize the application
const app = new HistoriaApp();

// Start initialization immediately
app.init();

// Fallback initialization on window load
if (document.readyState === 'loading') {
  window.addEventListener('load', () => {
    if (!app.isInitialized) {
      app.init();
    }
  });
}

// Export for potential external use
window.HistoriaApp = HistoriaApp;

// Add some helpful global utilities
window.historiaUtils = {
  smoothScrollTo,
  throttle,
  debounce,
  prefersReducedMotion
};