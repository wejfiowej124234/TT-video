"use client";



import type { ReactNode } from "react";

import { motion, useReducedMotion } from "framer-motion";

import {
  TT_CINEMATIC_SHELL_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { TT_HERO_GLOBE_OPTICAL_FALLBACK } from "@/lib/traveltrustHeroGlobeAlign";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";



const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;



export function TravelTrustCinematicShell({ children }: { children: ReactNode }) {

  const reduceMotion = useReducedMotion();

  const shell = TT_CINEMATIC_SHELL_L5;



  return (

    <motion.div

      data-tt-traveltrust-cinematic-shell="1"

      data-tt-traveltrust-cinematic-shell-l5="1"

      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}

      style={

        UNIFIED_PAGE_3D

          ? ({

              ["--tt-hero-globe-optical-x" as string]: TT_HERO_GLOBE_OPTICAL_FALLBACK,

              ["--tt-hero-globe-optical-y" as string]: "52%",

            } as const)

          : undefined

      }

    >

      {children}

      {UNIFIED_PAGE_3D ? null : (
      <motion.div

        className={`pointer-events-none fixed inset-0 ${ttZClass(TT_Z.GRAIN)} mix-blend-soft-light motion-reduce:hidden opacity-[0.03] [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]`}

        aria-hidden

        data-tt-traveltrust-cinematic-grain="1"

        style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: "repeat" }}

        animate={

          reduceMotion

            ? undefined

            : { opacity: [shell.grainOpacityRange[0], shell.grainOpacityRange[1], shell.grainOpacityRange[0]] }

        }

        transition={{

          duration: shell.grainPulseDuration,

          repeat: shell.grainPulseRepeat,

          ease: "easeInOut",

        }}

      />
      )}

      {UNIFIED_PAGE_3D ? null : (
        <motion.div
          className={`pointer-events-none fixed inset-0 ${ttZClass(TT_Z.GRAIN)} motion-reduce:opacity-0 opacity-45`}
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 85% 70% at 50% 42%, transparent 42%, rgba(8,6,5,0.55) 100%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [
                    shell.vignetteOpacityRange[0],
                    shell.vignetteOpacityRange[1],
                    shell.vignetteOpacityRange[0],
                  ],
                }
          }
          transition={{
            duration: shell.vignettePulseDuration,
            repeat: shell.vignettePulseRepeat,
            ease: "easeInOut",
          }}
        />
      )}

    </motion.div>

  );

}


