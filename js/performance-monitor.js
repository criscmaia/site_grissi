/**
 * Performance Monitor - Track Core Web Vitals and performance metrics
 * Vanilla JavaScript implementation with no dependencies
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
        this.init();
    }

    /**
     * Initialize performance monitoring
     */
    init() {
        // Track Core Web Vitals
        this.trackLCP();
        this.trackFID();
        this.trackCLS();
        
        // Track custom metrics
        this.trackCustomMetrics();
        
        // Track resource loading
        this.trackResourceTiming();
        
        console.log('📊 Performance Monitor initialized');
    }

    /**
     * Track Largest Contentful Paint (LCP)
     */
    trackLCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                this.metrics.lcp = lastEntry.startTime;
                console.log('🎯 LCP:', Math.round(lastEntry.startTime) + 'ms');
                
                // Send to analytics
                this.sendMetric('lcp', Math.round(lastEntry.startTime));
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(observer);
        }
    }

    /**
     * Track First Input Delay (FID)
     */
    trackFID() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                    console.log('⚡ FID:', Math.round(this.metrics.fid) + 'ms');
                    
                    // Send to analytics
                    this.sendMetric('fid', Math.round(this.metrics.fid));
                });
            });
            
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.push(observer);
        }
    }

    /**
     * Track Cumulative Layout Shift (CLS)
     */
    trackCLS() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            let clsEntries = [];
            
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        clsEntries.push(entry);
                    }
                });
                
                this.metrics.cls = clsValue;
                console.log('📐 CLS:', clsValue.toFixed(4));
                
                // Send to analytics
                this.sendMetric('cls', clsValue);
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(observer);
        }
    }

    /**
     * Track custom performance metrics
     */
    trackCustomMetrics() {
        // Track DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            const timing = performance.getEntriesByType('navigation')[0];
            const domContentLoaded = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
            
            this.metrics.domContentLoaded = domContentLoaded;
            console.log('📄 DOM Content Loaded:', Math.round(domContentLoaded) + 'ms');
            this.sendMetric('dom_content_loaded', Math.round(domContentLoaded));
        });

        // Track page load time
        window.addEventListener('load', () => {
            const timing = performance.getEntriesByType('navigation')[0];
            const loadTime = timing.loadEventEnd - timing.loadEventStart;
            
            this.metrics.loadTime = loadTime;
            console.log('⏱️ Page Load Time:', Math.round(loadTime) + 'ms');
            this.sendMetric('load_time', Math.round(loadTime));
        });
    }

    /**
     * Track resource loading performance
     */
    trackResourceTiming() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    // Only track resources from our domain
                    if (entry.name.includes(window.location.origin)) {
                        const duration = entry.duration;
                        const size = entry.transferSize || 0;
                        
                        console.log(`📦 Resource: ${entry.name} - ${Math.round(duration)}ms (${Math.round(size / 1024)}KB)`);
                        
                        // Track slow resources
                        if (duration > 1000) {
                            console.warn(`🐌 Slow resource detected: ${entry.name} (${Math.round(duration)}ms)`);
                            this.sendMetric('slow_resource', {
                                url: entry.name,
                                duration: Math.round(duration),
                                size: Math.round(size / 1024)
                            });
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        }
    }

    /**
     * Send metric to analytics
     */
    sendMetric(name, value) {
        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metric', {
                metric_name: name,
                metric_value: value,
                page_url: window.location.href
            });
        }
        
        // Store locally for debugging
        if (!this.metrics[name]) {
            this.metrics[name] = [];
        }
        this.metrics[name].push({
            value: value,
            timestamp: Date.now()
        });
    }

    /**
     * Get all collected metrics
     */
    getMetrics() {
        return this.metrics;
    }

    /**
     * Get performance score based on Core Web Vitals
     */
    getPerformanceScore() {
        const score = {
            lcp: this.getScoreForMetric('lcp', [2500, 4000]), // Good: <2.5s, Needs improvement: <4s
            fid: this.getScoreForMetric('fid', [100, 300]), // Good: <100ms, Needs improvement: <300ms
            cls: this.getScoreForMetric('cls', [0.1, 0.25]) // Good: <0.1, Needs improvement: <0.25
        };
        
        const averageScore = (score.lcp + score.fid + score.cls) / 3;
        
        return {
            score: Math.round(averageScore * 100),
            details: score,
            metrics: this.metrics
        };
    }

    /**
     * Calculate score for a metric (0-1 scale)
     */
    getScoreForMetric(metricName, thresholds) {
        const metric = this.metrics[metricName];
        if (!metric || metric.length === 0) return 0;
        
        const value = metric[metric.length - 1];
        const [good, poor] = thresholds;
        
        if (value <= good) return 1;
        if (value <= poor) return 0.5;
        return 0;
    }

    /**
     * Cleanup observers
     */
    destroy() {
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers = [];
        console.log('🧹 Performance Monitor cleaned up');
    }
}

// Expose globally
window.PerformanceMonitor = PerformanceMonitor; 