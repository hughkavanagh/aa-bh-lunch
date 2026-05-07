"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Matter from "matter-js";

interface FoodRainProps {
  imageUrls: string[];
  active: boolean;
  onDone: () => void;
  count?: number;
}

export default function FoodRain({
  imageUrls,
  active,
  onDone,
  count = 25,
}: FoodRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<{ runner: Matter.Runner; stop: () => void } | null>(null);
  const [dropping, setDropping] = useState(false);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const wallsRef = useRef<{ floor: Matter.Body; left: Matter.Body; right: Matter.Body } | null>(null);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const animFrameRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (renderRef.current) {
      Matter.Runner.stop(renderRef.current.runner);
      renderRef.current.stop();
      renderRef.current = null;
    }
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }
    bodiesRef.current = [];
    wallsRef.current = null;
    imagesRef.current.clear();
  }, []);

  // Build the list of URLs, repeating to fill count
  const getUrls = useCallback(() => {
    if (imageUrls.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      urls.push(imageUrls[i % imageUrls.length]);
    }
    return urls;
  }, [imageUrls, count]);

  // Preload images
  const preloadImages = useCallback(
    (urls: string[]): Promise<Map<number, HTMLImageElement>> => {
      const map = new Map<number, HTMLImageElement>();
      const promises = urls.map(
        (url, i) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              map.set(i, img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = url;
          })
      );
      return Promise.all(promises).then(() => map);
    },
    []
  );

  // Start the rain
  useEffect(() => {
    if (!active || dropping) return;
    if (imageUrls.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const urls = getUrls();
    if (urls.length === 0) return;

    setDropping(true);

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.5 } });
    engineRef.current = engine;

    // Walls
    const wallThickness = 60;
    const floor = Matter.Bodies.rectangle(w / 2, h + wallThickness / 2, w * 2, wallThickness, {
      isStatic: true,
      friction: 0.8,
      restitution: 0.3,
    });
    const left = Matter.Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h * 3, {
      isStatic: true,
    });
    const right = Matter.Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h * 3, {
      isStatic: true,
    });

    Matter.Composite.add(engine.world, [floor, left, right]);
    wallsRef.current = { floor, left, right };

    // Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Preload then spawn
    preloadImages(urls).then((imgMap) => {
      imagesRef.current = imgMap;

      const size = Math.min(w, h) * 0.117;
      const radius = size / 2;

      // Stagger spawning
      urls.forEach((_, i) => {
        setTimeout(() => {
          if (!engineRef.current) return;
          const x = Math.random() * (w - size * 2) + size;
          const y = -size - Math.random() * 400;

          const body = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.4,
            friction: 0.3,
            density: 0.002,
            inertia: Infinity,
            label: `food-${i}`,
          });

          bodiesRef.current.push(body);
          Matter.Composite.add(engineRef.current!.world, body);
        }, i * 120);
      });
    });

    // Custom render loop
    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      if (!engineRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const body of bodiesRef.current) {
        const idx = parseInt(body.label.replace("food-", ""), 10);
        const img = imagesRef.current.get(idx);
        if (!img) continue;

        const { x, y } = body.position;
        const size = (body as { circleRadius?: number }).circleRadius
          ? (body as { circleRadius: number }).circleRadius * 2
          : 60;

        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    renderRef.current = {
      runner,
      stop: () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      },
    };

    // Handle resize
    const handleResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      canvas.width = nw;
      canvas.height = nh;

      if (wallsRef.current) {
        Matter.Body.setPosition(wallsRef.current.floor, {
          x: nw / 2,
          y: nh + wallThickness / 2,
        });
        Matter.Body.setPosition(wallsRef.current.left, {
          x: -wallThickness / 2,
          y: nh / 2,
        });
        Matter.Body.setPosition(wallsRef.current.right, {
          x: nw + wallThickness / 2,
          y: nh / 2,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [active, dropping, imageUrls, getUrls, preloadImages, cleanup]);

  // Drop the floor when deactivated
  useEffect(() => {
    if (!active && dropping && wallsRef.current && engineRef.current) {
      // Remove the floor so everything falls out
      Matter.Composite.remove(engineRef.current.world, wallsRef.current.floor);

      // Wait for bodies to fall off screen, then clean up
      setTimeout(() => {
        cleanup();
        setDropping(false);
        onDone();
      }, 2000);
    }
  }, [active, dropping, cleanup, onDone]);

  if (!active && !dropping) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
