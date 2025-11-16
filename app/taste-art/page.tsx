"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Palette,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface TasteArtData {
  genres: Array<{ name: string; count: number; color: string }>;
  personality: {
    mainstream: number;
    diversity: number;
    enthusiasm: number;
  };
  patterns: {
    primary_color: string;
    secondary_color: string;
    tertiary_color: string;
    shape: string;
  };
}

export default function TasteArtPage() {
  const { data: session, status } = useSession();
  const [artData, setArtData] = useState<TasteArtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [artStyle, setArtStyle] = useState<
    "dna" | "constellation" | "waveform" | "spiral"
  >("dna");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchArtData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (artData && canvasRef.current) {
      drawArt();
    }
  }, [artData, artStyle]);

  const fetchArtData = async () => {
    try {
      const res = await fetch("/api/taste-art/generate");
      if (res.ok) {
        const data = await res.json();
        setArtData(data);
      }
    } catch (error) {
      console.error("Error fetching art data:", error);
    } finally {
      setLoading(false);
    }
  };

  const drawArt = () => {
    const canvas = canvasRef.current;
    if (!canvas || !artData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, artData.patterns.primary_color + "20");
    gradient.addColorStop(0.5, artData.patterns.secondary_color + "20");
    gradient.addColorStop(1, artData.patterns.tertiary_color + "20");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw based on style
    switch (artStyle) {
      case "dna":
        drawDNAHelix(ctx, width, height, artData);
        break;
      case "constellation":
        drawConstellation(ctx, width, height, artData);
        break;
      case "waveform":
        drawWaveform(ctx, width, height, artData);
        break;
      case "spiral":
        drawSpiral(ctx, width, height, artData);
        break;
    }
  };

  const drawDNAHelix = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: TasteArtData
  ) => {
    const centerX = width / 2;
    const amplitude = width / 4;
    const wavelength = height / 4;
    const numPoints = 50;

    for (let i = 0; i < numPoints; i++) {
      const y = (i / numPoints) * height;
      const offset1 = Math.sin((i / numPoints) * Math.PI * 4) * amplitude;
      const offset2 = Math.sin((i / numPoints) * Math.PI * 4 + Math.PI) * amplitude;

      const genreIndex = i % data.genres.length;
      const color = data.genres[genreIndex].color;

      // Left helix
      ctx.beginPath();
      ctx.arc(centerX + offset1, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Right helix
      ctx.beginPath();
      ctx.arc(centerX + offset2, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Connecting line
      ctx.beginPath();
      ctx.moveTo(centerX + offset1, y);
      ctx.lineTo(centerX + offset2, y);
      ctx.strokeStyle = color + "40";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawConstellation = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: TasteArtData
  ) => {
    const stars: Array<{ x: number; y: number; size: number; color: string }> = [];

    // Create stars based on genres
    data.genres.forEach((genre, index) => {
      const numStars = Math.max(3, Math.floor(genre.count / 2));
      for (let i = 0; i < numStars; i++) {
        const angle = ((index + i) / data.genres.length) * Math.PI * 2;
        const distance = 100 + (genre.count * 5);
        const x = width / 2 + Math.cos(angle) * distance;
        const y = height / 2 + Math.sin(angle) * distance;

        stars.push({
          x,
          y,
          size: 4 + genre.count / 5,
          color: genre.color,
        });
      }
    });

    // Draw connections
    stars.forEach((star1, i) => {
      stars.forEach((star2, j) => {
        if (i < j) {
          const dist = Math.hypot(star2.x - star1.x, star2.y - star1.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.strokeStyle = star1.color + "20";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    });

    // Draw stars
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        star.size * 2
      );
      glow.addColorStop(0, star.color + "40");
      glow.addColorStop(1, star.color + "00");
      ctx.fillStyle = glow;
      ctx.fill();
    });
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: TasteArtData
  ) => {
    const centerY = height / 2;
    const numWaves = data.genres.length;

    data.genres.forEach((genre, index) => {
      const amplitude = (genre.count / 10) * 50;
      const frequency = 0.02 + index * 0.005;
      const verticalOffset = ((index - numWaves / 2) * height) / (numWaves + 1);

      ctx.beginPath();
      ctx.moveTo(0, centerY + verticalOffset);

      for (let x = 0; x <= width; x += 5) {
        const y =
          centerY +
          verticalOffset +
          Math.sin(x * frequency) * amplitude +
          Math.cos(x * frequency * 1.5) * (amplitude / 2);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = genre.color;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  };

  const drawSpiral = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: TasteArtData
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;
    const numPoints = 200;

    data.genres.forEach((genre, genreIndex) => {
      ctx.beginPath();

      const startAngle = (genreIndex / data.genres.length) * Math.PI * 2;

      for (let i = 0; i < numPoints; i++) {
        const progress = i / numPoints;
        const angle = startAngle + progress * Math.PI * 6;
        const radius = progress * maxRadius * (genre.count / 20);

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = genre.color;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  };

  const downloadArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `kindred-taste-art-${artStyle}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareArt = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "my-taste-art.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "My Kindred Taste Art",
            text: "Check out my unique taste visualization!",
            files: [file],
          });
        } catch (err) {
          console.error("Share failed:", err);
        }
      } else {
        downloadArt();
      }
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Palette className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Generating your art...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Palette className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Taste DNA Art
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Transform your unique taste profile into beautiful, shareable art
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="paper-card p-6">
              <h3 className="font-semibold mb-2">DNA Helix</h3>
              <p className="text-sm text-muted-foreground">
                Your taste as intertwined genetic code
              </p>
            </div>
            <div className="paper-card p-6">
              <h3 className="font-semibold mb-2">Constellation</h3>
              <p className="text-sm text-muted-foreground">
                Star map of your favorite genres
              </p>
            </div>
            <div className="paper-card p-6">
              <h3 className="font-semibold mb-2">Waveform</h3>
              <p className="text-sm text-muted-foreground">
                Musical visualization of your preferences
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Generate Art
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!artData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Not Enough Data</h1>
          <p className="text-muted-foreground mb-6">
            Rate more items to generate your taste art!
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Palette className="w-4 h-4" />
          Generative Art
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Your Taste DNA Art
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A unique visual representation of your taste profile, generated from your library
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Art Canvas */}
        <div className="md:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="paper-card p-6"
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={800}
              className="w-full h-auto rounded-lg border border-border"
            />

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={downloadArt}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={shareArt}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={fetchArtData}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div>
          <div className="paper-card p-6 sticky top-6">
            <h3 className="font-display text-xl font-bold mb-6">Art Style</h3>

            <div className="space-y-3 mb-8">
              {[
                { value: "dna", label: "DNA Helix", icon: "🧬" },
                { value: "constellation", label: "Constellation", icon: "⭐" },
                { value: "waveform", label: "Waveform", icon: "🌊" },
                { value: "spiral", label: "Spiral", icon: "🌀" },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setArtStyle(style.value as any)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    artStyle === style.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{style.icon}</span>
                    <span className="font-semibold">{style.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-lg mb-4">Your Palette</h3>
              <div className="space-y-2">
                {artData.genres.slice(0, 5).map((genre, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: genre.color }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{genre.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {genre.count} items
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
