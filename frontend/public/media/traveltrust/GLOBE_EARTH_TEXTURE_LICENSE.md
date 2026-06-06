# Hero globe earth texture — license & provenance

| Field | Value |
|-------|--------|
| **Asset** | `globe-earth-equirect-2k.jpg` · `globe-clouds-equirect-1k.png` |
| **Use** | TravelTrust marketing Hero decorative 3D globe (**phase ① local** only) |
| **Not** | Navigation, geodesy, flight planning, or live order / chain data |

## Provenance

- **Earth JPEG** is a copy of `earth_atmos_2048.jpg` from the [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) texture set (MIT-licensed project repository).
- **Cloud PNG** is a copy of `earth_clouds_1024.png` from the same examples set (decorative cloud shell only).
- **Imagery** is widely attributed to **NASA Visible Earth** / Blue Marble-style composite imagery. U.S. government works are generally **public domain**; retain this notice in-repo when redistributing the JPEG.

## Code reference

- Path constant: `TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH` in `frontend/lib/traveltrustGlobeEarthAsset.ts`
- Procedural fallback (no JPEG): `createTraveltrustGlobeEarthTextureProcedural()` when texture load fails or `prefers-reduced-motion` static path

## Replacement

To swap art: replace the JPEG (keep equirectangular 2:1), update this file, and re-run `npm run test -- traveltrustGlobeEarthAsset`.
