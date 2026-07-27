import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "./button";
import { ArrowRight } from "lucide-react";

function FloodFlowGraphic({ layer }: { layer: number }) {
  const paths = Array.from({ length: 24 }, (_, i) => {
    const yBase = 150 + layer * 100 + i * 12;
    const controlY1 = yBase - 150 + i * 8;
    const controlY2 = yBase + 150 - i * 8;

    const d = `M -200 ${yBase} C 300 ${controlY1}, 700 ${controlY2}, 1200 ${yBase} C 1700 ${controlY1}, 2100 ${controlY2}, 2600 ${yBase}`;

    return {
      id: i,
      d,
      width: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.2,
      duration: 12 + Math.random() * 15,
      delay: Math.random() * -20, // negative delay so it starts mid-animation
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none opacity-60">
      <svg
        className="w-full h-full"
        viewBox="0 0 1600 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient
            id={`flow-grad-${layer}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
            <stop offset="20%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="80%" stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="100%" stopColor="#cffafe" stopOpacity="0" />
          </linearGradient>
        </defs>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke={`url(#flow-grad-${layer})`}
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathOffset: 0, pathLength: path.width * 0.2 + 0.1 }}
            animate={{
              pathOffset: [0, -1],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
              delay: Math.abs(path.delay) % 5,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({
  title = "FLOOD FLOW",
  onEnterHud,
}: {
  title?: string;
  onEnterHud: () => void;
}) {
  const words = title.split(" ");

  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 800], [1, 1.2]);
  const rotateX = useTransform(scrollY, [0, 800], [0, 25]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);
  const y = useTransform(scrollY, [0, 800], [0, 400]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f4f1eb] [perspective:1200px]">
      <motion.div
        className="w-full h-full flex items-center justify-center relative"
        style={{
          scale,
          rotateX,
          opacity,
          y,
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
        }}
      >
        <div className="absolute inset-0">
          <FloodFlowGraphic layer={0} />
          <FloodFlowGraphic layer={1} />
          <FloodFlowGraphic layer={2} />
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold mb-8 tracking-tighter">
              {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                  {word.split("").map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                        type: "spring",
                        stiffness: 150,
                        damping: 25,
                      }}
                      className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-stone-900 to-stone-600"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>

            <p className="text-stone-600 text-sm md:text-base font-medium max-w-lg mx-auto mb-10 tracking-wide uppercase">
              Jakarta Deterministic Spatial Hazard Ranking
            </p>

            <div
              className="inline-block group relative bg-gradient-to-b from-stone-900/10 to-white/10 
                        p-px rounded-2xl backdrop-blur-lg 
                        overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <Button
                variant="ghost"
                onClick={onEnterHud}
                className="rounded-[1.15rem] px-8 py-6 text-sm font-bold tracking-widest backdrop-blur-md 
                            bg-brand-cyan hover:bg-cyan-600
                            text-white transition-all duration-300 
                            group-hover:-translate-y-0.5 border border-brand-cyan/20
                            hover:shadow-md hover:shadow-brand-cyan/20"
              >
                <span className="opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  INITIALIZE WORKSPACE <ArrowRight size={16} />
                </span>
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
