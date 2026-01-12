
import React, { useEffect, useRef } from 'react';

const ParticleCanvas = () => {
    const canvasRef = useRef(null);
    const isVisible = useRef(true);

    // Accessibility: Disable entirely if reduced motion is preferred
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return null;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let width, height;

        // Configuration - Smart Tiered Rendering
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Simple heuristic for low-power device (low cores)
        const isLowPower = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

        if (prefersReducedMotion) return; // Stop animation loop completely

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

            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!isVisible.current) return;

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Connect particles
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connectionDistance * connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - Math.sqrt(distSq) / connectionDistance)})`;
                        ctx.lineWidth = 0.8;
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
        if (isVisible.current) animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
};

export default ParticleCanvas;
