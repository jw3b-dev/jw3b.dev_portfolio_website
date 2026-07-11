
import React, { useEffect, useRef } from 'react';

const ParticleCanvas = () => {
    const canvasRef = useRef(null);
    const isVisible = useRef(true);

    // Accessibility: Disable entirely if reduced motion is preferred
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        // Skip all animation setup when reduced motion is preferred.
        // (Hooks must run unconditionally, so guard here rather than early-returning above.)
        if (prefersReducedMotion) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let width, height;

        // Configuration - Smart Tiered Rendering
        // Simple heuristic for low-power device (low cores)
        const isLowPower = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

        const particleCount = isLowPower ? 15 : 45; // 3x reduction for low-end
        const connectionDistance = isLowPower ? 100 : 140;
        const mouseDistance = 180;

        // Intersection Observer to pause animation when not visible
        const observer = new IntersectionObserver(
            ([entry]) => {
                const previouslyVisible = isVisible.current;
                isVisible.current = entry.isIntersecting;
                if (isVisible.current && !previouslyVisible) {
                    cancelAnimationFrame(animationFrameId);
                    animate();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(canvas);

        // Mouse state
        const mouse = { x: null, y: null };

        const handleResize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap for performance
            width = canvas.clientWidth;
            height = canvas.clientHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            initParticles();
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                // Increased base velocity for "always active" feel
                const baseSpeed = 3.2;
                this.vx = (Math.random() - 0.5) * baseSpeed;
                this.vy = (Math.random() - 0.5) * baseSpeed;
                this.size = Math.random() * 1.5 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interaction
                if (mouse.x != null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouseDistance - distance) / mouseDistance;
                        const directionX = forceDirectionX * force * 0.4;
                        const directionY = forceDirectionY * force * 0.4;

                        this.vx -= directionX;
                        this.vy -= directionY;
                    }
                }
            }

        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 6, g: 182, b: 212 };
        };

        const animate = () => {
            if (!isVisible.current) return;

            ctx.clearRect(0, 0, width, height);

            // 🎨 Read Mood and Amplitude (Phase 10 Wow Factor)
            const moodColor = (typeof window !== 'undefined' && window.ai_mood_color) || '#06b6d4';
            const amplitude = (typeof window !== 'undefined' && window.ai_voice_amplitude) || 0;
            const rgb = hexToRgb(moodColor);

            // 🌊 1. Draw Audio Frequency Equalizer Line ripple
            if (amplitude > 0) {
                ctx.beginPath();
                ctx.strokeStyle = moodColor;
                ctx.lineWidth = 1.8 * (amplitude + 0.3);
                ctx.shadowBlur = 20;
                ctx.shadowColor = moodColor;
                
                const midY = height / 2;
                ctx.moveTo(0, midY);
                
                for (let x = 0; x < width; x += 4) {
                    // Sine calculation shifted by index and time multipliers
                    const angle = (x * 0.04) + (Date.now() * 0.015);
                    const y = midY + Math.sin(angle) * (30 * amplitude);
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset glow for performance
            }

            // Draw particles
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
                ctx.beginPath();
                ctx.arc(particles[i].x, particles[i].y, particles[i].size, 0, Math.PI * 2);
                ctx.fill();

                // Connect particles
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connectionDistance * connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.6 * (1 - Math.sqrt(distSq) / connectionDistance)})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, [prefersReducedMotion]);

    if (prefersReducedMotion) return null;

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
};

export default ParticleCanvas;
