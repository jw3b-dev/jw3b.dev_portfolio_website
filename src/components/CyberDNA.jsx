import { useEffect, useRef } from 'react';

const CyberDNA = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const scrollRef = useRef({ lastY: 0, velocity: 0, currentSpeed: 0.015 });
    const isVisible = useRef(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;



        // Configuration
        const HELIX_PARTICLES = 100; // Reduced from 200
        const ATMOSPHERE_PARTICLES = 50; // Reduced from 100
        const CONNECTION_DISTANCE = 90; // Reduced from 100
        const HELIX_RADIUS = 60;
        const BASE_SPEED = 0.015;

        let width = 0;
        let height = 0;

        // Brand Colors
        const COLORS = [
            { r: 168, g: 85, b: 247 }, // Purple
            { r: 6, g: 182, b: 212 }, // Cyan
            { r: 34, g: 197, b: 94 },  // Green
            { r: 59, g: 130, b: 246 }, // Blue
            { r: 249, g: 115, b: 22 }   // Orange
        ];

        class Particle {
            constructor(y, isAtmosphere = false) {
                this.y = y;
                this.isAtmosphere = isAtmosphere;

                if (isAtmosphere) {
                    this.xBase = Math.random();
                    this.angle = 0;
                    this.speed = (Math.random() * 0.005) + 0.002;
                    this.radius = Math.random() * 2;
                    this.zOffset = Math.random() * 1000 - 500;
                } else {
                    this.angle = (y * 0.05);
                    this.speed = BASE_SPEED;
                    this.strand = Math.random() > 0.5 ? 0 : Math.PI;
                    this.radius = Math.random() * 1.5 + 1;
                    this.driftX = (Math.random() - 0.5) * 8;
                    this.driftY = (Math.random() - 0.5) * 8;
                }

                this.phase = Math.random() * Math.PI * 2;
                this.projected = { x: 0, y: 0, z: 0, alpha: 0 };
            }

            update(time, velocityFactor) {
                if (!this.isAtmosphere) {
                    this.angle += this.speed * velocityFactor;
                    this.currentRadius = this.radius + Math.sin(time * 0.002 + this.phase) * 0.5;
                } else {
                    this.y += this.speed * (velocityFactor * 10);
                    if (this.y > height) this.y = 0;
                    if (this.y < 0) this.y = height;
                }
            }

            calculateProjected() {
                const colorIndexRaw = (this.y / height) * (COLORS.length - 1);
                const safeIndex = Math.max(0, Math.min(COLORS.length - 1, Math.floor(colorIndexRaw)));
                const nextIndex = Math.min(safeIndex + 1, COLORS.length - 1);
                const t = Math.max(0, Math.min(1, colorIndexRaw - safeIndex));

                const c1 = COLORS[safeIndex] || COLORS[0];
                const c2 = COLORS[nextIndex] || COLORS[COLORS.length - 1];

                const r = Math.round(c1.r + (c2.r - c1.r) * t);
                const g = Math.round(c1.g + (c2.g - c1.g) * t);
                const b = Math.round(c1.b + (c2.b - c1.b) * t);

                if (this.isAtmosphere) {
                    const x3d = (this.xBase * width) - (width / 2);
                    const z3d = this.zOffset;
                    const scale = (800 + z3d) / 800;

                    this.projected = {
                        x: width / 2 + x3d,
                        y: this.y,
                        r: this.radius * scale,
                        color: `rgba(${r},${g},${b}, ${0.25 * scale})`,
                        alpha: 0.25 * scale,
                        z: z3d - 200
                    };

                } else {
                    const currentAngle = this.angle + this.strand;
                    const x3d = Math.cos(currentAngle) * HELIX_RADIUS + this.driftX;
                    const z3d = Math.sin(currentAngle) * HELIX_RADIUS + this.driftY;
                    const scale = (800 + z3d) / 800;

                    this.projected = {
                        x: width / 2 + x3d,
                        y: this.y,
                        r: Math.max(0.1, this.currentRadius * scale),
                        color: `rgb(${r},${g},${b})`,
                        alpha: 0.3 + (z3d + HELIX_RADIUS) / (HELIX_RADIUS * 2) * 0.7,
                        z: z3d
                    };
                }
            }
        }

        let particles = [];
        let signals = [];

        const init = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            scrollRef.current.lastY = window.scrollY;

            particles = [];
            signals = [];

            for (let i = 0; i < HELIX_PARTICLES; i++) {
                particles.push(new Particle(Math.random() * height, false));
            }
            for (let i = 0; i < ATMOSPHERE_PARTICLES; i++) {
                particles.push(new Particle(Math.random() * height, true));
            }
        };

        const draw = (time) => {
            if (!isVisible.current) return;

            const currentY = window.scrollY;
            const deltaY = currentY - scrollRef.current.lastY;
            scrollRef.current.lastY = currentY;

            const targetVelocityFactor = 1 + Math.abs(deltaY) * 0.08;
            scrollRef.current.currentSpeed += (targetVelocityFactor - scrollRef.current.currentSpeed) * 0.1;

            const velocityFactor = scrollRef.current.currentSpeed;
            const stretch = Math.max(1, velocityFactor * 0.4);

            ctx.clearRect(0, 0, width, height);

            // Draw Central Beam (Optimized)
            const gradient = ctx.createLinearGradient(width / 2, 0, width / 2, height);
            gradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
            gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(width / 2 - 1, 0, 2, height);

            particles.forEach(p => {
                p.update(time, velocityFactor);
                p.calculateProjected();
            });

            const drawList = [...particles];
            drawList.sort((a, b) => a.projected.z - b.projected.z);

            ctx.lineWidth = 0.5;
            for (let i = 0; i < drawList.length; i++) {
                const p1 = drawList[i];
                if (p1.isAtmosphere) continue;

                // Optimization: only connect to a few subsequent particles
                const maxConnections = 12;
                let connectionsFound = 0;

                for (let j = i + 1; j < drawList.length && connectionsFound < maxConnections; j++) {
                    const p2 = drawList[j];
                    if (p2.isAtmosphere) continue;

                    const dx = p1.projected.x - p2.projected.x;
                    const dy = p1.projected.y - p2.projected.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
                        connectionsFound++;
                        const dist = Math.sqrt(distSq);
                        const alpha = (1 - dist / CONNECTION_DISTANCE) * p1.projected.alpha;
                        if (alpha > 0.1) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                            ctx.moveTo(p1.projected.x, p1.projected.y);
                            ctx.lineTo(p2.projected.x, p2.projected.y);
                            ctx.stroke();

                            if (alpha > 0.4 && Math.random() < 0.0005 * velocityFactor) {
                                signals.push({
                                    p1: p1,
                                    p2: p2,
                                    t: 0,
                                    speed: (0.02 + Math.random() * 0.03) * velocityFactor,
                                    color: '#06b6d4'
                                });
                            }
                        }
                    }
                }
            }

            drawList.forEach(p => {
                const proj = p.projected;
                ctx.beginPath();
                ctx.ellipse(proj.x, proj.y, proj.r, proj.r * stretch, 0, 0, Math.PI * 2);
                ctx.fillStyle = proj.color;
                ctx.fill();
            });

            ctx.globalCompositeOperation = 'lighter';
            for (let i = signals.length - 1; i >= 0; i--) {
                const s = signals[i];
                s.t += s.speed;

                if (s.t >= 1) {
                    signals.splice(i, 1);
                    continue;
                }

                const start = s.p1.projected;
                const end = s.p2.projected;
                const curX = start.x + (end.x - start.x) * s.t;
                const curY = start.y + (end.y - start.y) * s.t;

                ctx.beginPath();
                ctx.arc(curX, curY, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.fill();

                const trailLen = 0.12 * stretch;
                const trailT = Math.max(0, s.t - trailLen);
                const trailX = start.x + (end.x - start.x) * trailT;
                const trailY = start.y + (end.y - start.y) * trailT;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
                ctx.lineWidth = 1;
                ctx.moveTo(trailX, trailY);
                ctx.lineTo(curX, curY);
                ctx.stroke();
            }
            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(draw);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible.current = entry.isIntersecting;
                if (isVisible.current) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = requestAnimationFrame(draw);
                }
            },
            { threshold: 0.05 }
        );
        if (containerRef.current) observer.observe(containerRef.current);

        init();
        if (isVisible.current) animationFrameId = requestAnimationFrame(draw);

        const handleResize = () => init();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };

    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
            <canvas ref={canvasRef} className="block w-full h-full" style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default CyberDNA;
