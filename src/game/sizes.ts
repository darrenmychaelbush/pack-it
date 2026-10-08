import type { Shape } from "./types";
import jeans from "@/assets/items/jeans.png";
import shirt from "@/assets/items/shirt.png";
import aloha from "@/assets/items/aloha.png";
import cowboyboots from "@/assets/items/cowboyboots.png";
import cowboyhat from "@/assets/items/cowboyhat.png";
import guitar from "@/assets/items/guitar.png";
import trunks from "@/assets/items/trunks.png";
import swimsuit from "@/assets/items/swimsuit.png";
import sandals from "@/assets/items/sandals.png";
import sunglasses from "@/assets/items/sunglasses.png";
import sunscreen from "@/assets/items/sunscreen.png";
import towel from "@/assets/items/towel.png";
import shorts from "@/assets/items/shorts.png";
import sneakers from "@/assets/items/sneakers.png";
import camera from "@/assets/items/camera.png";
import jacket from "@/assets/items/jacket.png";
import dressshoes from "@/assets/items/dressshoes.png";
import toiletry from "@/assets/items/toiletry.png";
import charger from "@/assets/items/charger.png";
import snorkel from "@/assets/items/snorkel.png";
import sunhat from "@/assets/items/sunhat.png";
import umbrella from "@/assets/items/umbrella.png";
import scarf from "@/assets/items/scarf.png";
import sweater from "@/assets/items/sweater.png";
import gloves from "@/assets/items/gloves.png";
import raincoat from "@/assets/items/raincoat.png";
import boots from "@/assets/items/boots.png";
import hikingpants from "@/assets/items/hikingpants.png";
import trench from "@/assets/items/trench.png";
import daybag from "@/assets/items/daybag.png";
import powerbank from "@/assets/items/powerbank.png";
import adapter from "@/assets/items/adapter.png";
import adapterkit from "@/assets/items/adapterkit.png";
import dress from "@/assets/items/dress.png";
import accessory from "@/assets/items/accessory.png";
import camerabag from "@/assets/items/camerabag.png";

export interface PackedSize { shape: Shape; art?: string }
const rect = (w: number, h: number): Shape => Array.from({ length: h }, () => Array(w).fill(1));

export const PACKED_SIZES: Record<string, PackedSize> = {
  sunglasses: { shape: rect(2, 1), art: sunglasses }, sunscreen: { shape: rect(1, 2), art: sunscreen },
  adapter: { shape: rect(1, 2), art: adapter }, powerbank: { shape: rect(1, 2), art: powerbank }, charger: { shape: rect(1, 2), art: charger },
  accessory: { shape: rect(2, 1), art: accessory }, gloves: { shape: rect(2, 1), art: gloves },
  tee: { shape: rect(2, 2) }, shirt: { shape: rect(2, 2), art: shirt }, aloha: { shape: rect(2, 2), art: aloha },
  linen: { shape: rect(2, 2) }, shorts: { shape: rect(2, 2), art: shorts }, trunks: { shape: rect(2, 2), art: trunks },
  swimsuit: { shape: rect(2, 2), art: swimsuit }, sandals: { shape: rect(2, 2), art: sandals }, sneakers: { shape: rect(2, 2), art: sneakers },
  dressshoes: { shape: rect(2, 2), art: dressshoes }, camera: { shape: rect(2, 2), art: camera }, camerabag: { shape: rect(2, 2), art: camerabag },
  toiletry: { shape: rect(2, 2), art: toiletry }, sweater: { shape: rect(2, 2), art: sweater }, adapterkit: { shape: rect(2, 2), art: adapterkit },
  jeans: { shape: rect(2, 3), art: jeans }, hikingpants: { shape: rect(2, 3), art: hikingpants }, jacket: { shape: rect(2, 3), art: jacket },
  dress: { shape: rect(2, 3), art: dress }, daybag: { shape: rect(2, 3), art: daybag },
  cowboyboots: { shape: rect(3, 2), art: cowboyboots }, boots: { shape: rect(3, 2), art: boots },
  sunhat: { shape: [[0, 1, 0], [1, 1, 1]], art: sunhat }, cowboyhat: { shape: [[0, 1, 0], [1, 1, 1]], art: cowboyhat },
  raincoat: { shape: rect(3, 3), art: raincoat }, trench: { shape: rect(3, 3), art: trench },
  umbrella: { shape: rect(1, 4), art: umbrella }, guitar: { shape: rect(1, 4), art: guitar }, towel: { shape: rect(1, 4), art: towel },
  scarf: { shape: rect(1, 3), art: scarf }, snorkel: { shape: rect(1, 3), art: snorkel },
};

export const packedArea = (id: string) => PACKED_SIZES[id].shape.flat().filter(Boolean).length;
export const SIZE_CHECKED_LEVELS = ["nashville", "miami", "san-diego", "new-york", "honolulu", "mexico-city", "vancouver", "london", "tokyo", "paris"];
