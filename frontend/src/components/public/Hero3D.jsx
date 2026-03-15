import { SplineScene } from "../ui/splite";
import { Spotlight } from "../ui/spotlight";
import { TypingEffect } from "../ui/typing-effect";

export function Hero3D() {
  return (
    <div className="w-full min-h-[700px] bg-transparent relative overflow-hidden flex flex-col items-start justify-start pt-32 pb-20 px-8 lg:px-16">
      {/* Spotlight removed to check source of blue glow */}


      <div className="container mx-auto relative z-10 flex flex-col lg:flex-row items-start gap-12">
        {/* Left column: Text content */}
        <div className="w-full lg:w-1/2 text-left space-y-6 pt-10">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-black leading-none" style={{ color: 'black' }}>
            <TypingEffect 
              text="Intelligent Care" 
              speed={70} 
              className="block"
            />
          </h1>
          <p className="text-xl md:text-2xl text-black font-medium leading-relaxed max-w-xl" style={{ color: 'black' }}>
            <TypingEffect 
              text="Revolutionizing hospital resource management with real-time tracking and predictive AI." 
              speed={30} 
              delay={1500}
              className="inline-block"
            />
          </p>
          
        </div>

        {/* Right column: 3D Robot Container */}
        <div className="w-full lg:w-1/2 h-[500px] md:h-[600px] relative cursor-crosshair">
          <div className="relative z-10 w-full h-full">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
