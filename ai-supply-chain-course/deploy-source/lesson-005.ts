import type { Lesson } from "./lessons";

export const lesson005 = {
  number: 5,
  module: "Module 1: How a Chip Is Physically Made",
  title: "The Fabrication Loop: How a Blank Wafer Becomes a Chip",
  date: "2026-08-11",
  body: `Prior Lessons — 1-Sentence Recap

Lesson 001: Lithography prints microscopic circuit patterns onto silicon, and ASML’s production-EUV monopoly makes it a uniquely scarce leading-edge supplier.

Lesson 002: EUV’s 13.5nm wavelength enables finer patterning than 193nm DUV and can reduce the costly complexity of multiple-patterning steps.

Lesson 003: A process node such as 3nm is a manufacturing generation, and foundry economics depend heavily on process know-how and yield, not simply owning the same equipment.

Lesson 004: Chips begin on ultra-pure 300mm silicon wafers supplied by companies such as Shin-Etsu and SUMCO, showing that an input can be essential without having monopoly-like economics.

The big picture

A modern chip is not printed onto a wafer in one step. A fab repeatedly adds material, prints a pattern, removes selected material, changes electrical properties, cleans and measures the wafer, and repeats.

Think of building a microscopic city one layer at a time. Lithography provides the map for each layer, but many other machines actually construct what the map specifies.

1. Start with the blank wafer

The fab receives a polished silicon wafer from suppliers such as Shin-Etsu, SUMCO, GlobalWafers, Siltronic, or SK Siltron. It is the physical foundation on which billions of transistors and their wiring will be built.

The wafer can spend months moving through the fab and undergo hundreds to well over a thousand individual process steps, depending on how steps are counted. Semiconductor manufacturing is a long sequence, not a single transformation.

2. Deposition — put material down

Deposition = adding an extremely thin layer of material to the wafer.

Imagine painting a wall, except the coating may be only atoms or nanometers thick and must be extremely uniform across a 300mm wafer. Some deposited materials conduct electricity, others insulate, and others become parts of the transistor.

Companies to know: Applied Materials has a broad deposition franchise; Lam Research is important in deposition and etch; Tokyo Electron participates across multiple wafer-processing steps.

Later we will distinguish CVD, PVD and ALD. For now: deposition adds material.

3. Lithography — define where work should happen

A light-sensitive chemical called photoresist is applied. A lithography scanner exposes a microscopic pattern. After development, some areas are protected and others exposed.

Think of masking tape before painting: lithography defines where the next process is allowed to act. It generally does not create the finished transistor by itself.

4. Etch — remove material

Etching = removing selected material. If deposition adds a layer, etch carves parts of it away.

The lithography pattern acts like a stencil. The etch tool removes material from exposed regions while trying to leave protected regions untouched. This becomes extraordinarily difficult as structures become smaller and more three-dimensional.

Lam Research is a major leader in etch. Applied Materials and Tokyo Electron also participate in important etch markets.

This is why semiconductor equipment is not just an ASML story: more complex chips can require more deposition and etch intensity as well as better lithography.

5. Doping — change silicon’s electrical behavior

Transistors require regions of silicon with different electrical properties. Doping intentionally introduces tiny amounts of specific atoms into silicon to change how electrical charge moves through it.

One technique is ion implantation, where charged atoms are accelerated into selected wafer regions.

The simple idea: pure silicon is the base material; carefully added impurities help create the electrically different regions needed for a transistor to switch.

Axcelis is a notable public ion-implantation equipment company; Applied Materials also has implantation technology.

6. Clean, polish and measure — then repeat

The wafer frequently needs cleaning and sometimes CMP, or chemical mechanical planarization, which essentially polishes layers flat so later structures can be built accurately.

Measurement is critical. A fab cannot wait until a finished chip fails to discover something went wrong hundreds of steps earlier.

This is where KLA becomes important. Its process-control tools inspect wafers for defects and perform metrology, meaning extremely precise measurement.

Inspection asks: Is there a defect?

Metrology asks: Did we make this feature at the intended size, shape, thickness or alignment?

7. The fabrication loop

A simplified loop is:

Deposit → photoresist → lithography → develop → etch/modify → remove resist → clean → inspect/measure → repeat.

Real flows contain many additional steps and variations, but this is the basic map onto which most wafer-fabrication equipment companies fit.

Modern processors also require many metal-interconnect layers above the transistors so billions of switches can communicate. That is why the loop repeats again and again.

8. Why this matters economically

When TSMC builds a leading-edge process, it does not simply buy EUV scanners. It needs a fleet of lithography, deposition, etch, cleaning, implant, CMP, inspection and metrology tools.

This spending is part of wafer-fab equipment (WFE) capex.

When TSMC, Samsung, Intel, SK Hynix or Micron increase fab investment, equipment vendors benefit—but not equally.

- ASML: extraordinary scarcity in EUV.

- Lam: strong positions in difficult etch/deposition processes.

- Applied Materials: broad exposure across the fab.

- KLA: benefits as smaller tolerances make defect detection more valuable.

- Tokyo Electron: strong positions across several process categories.

The better investment question is not merely, “Will semiconductor capex grow?” It is: Which manufacturing steps become disproportionately harder and more valuable as chips advance?

That can drive more equipment content per wafer even without equivalent wafer-volume growth.

9. Cyclicality

Equipment is capital spending. If memory prices collapse and manufacturers cut expansion, equipment orders can fall sharply. If foundries race to add leading-edge AI capacity, demand can surge.

But technology can create structural growth through capital intensity.

Volume growth = more wafers processed.

Capital-intensity growth = more equipment dollars needed for each unit of manufacturing capacity.

A supplier can grow because either one rises.

The value-chain map so far

Wafer suppliers → Shin-Etsu / SUMCO / GlobalWafers / Siltronic / SK Siltron

↓

Fab equipment → ASML (lithography) / Applied Materials (broad + deposition) / Lam (etch + deposition) / Tokyo Electron (broad) / KLA (inspection + metrology) / Axcelis (implant)

↓

Manufacturers → TSMC / Samsung / Intel / memory makers

↓

Finished silicon dies → NVIDIA GPUs / Broadcom ASICs / CPUs / memory chips / etc.

We are still near the bottom of the AI supply chain. Packaging, HBM, networking, servers, power, data centers, training, inference and tokens all come later.

Remember these 6 things

- A chip is built through a repeated fabrication loop, not printed in one step.

- Deposition adds material; etch removes selected material.

- Lithography defines the microscopic pattern telling other steps where to act.

- Doping changes silicon’s electrical properties so transistors can function.

- KLA-style inspection/metrology catches defects and measures whether the process stays on target.

- Equipment economics depend both on semiconductor capex cycles and on how much equipment complexity is required per wafer.

Quick check

If wafer volumes barely grow, why could Lam Research or KLA still grow?

Answer: each wafer can require more difficult etch/deposition steps and more inspection as process complexity rises, increasing their equipment content per wafer.

Next lesson

Lesson 006: Deposition — How You Build Films Only Atoms Thick

We will zoom into why fabs need ultra-thin material layers, the major deposition methods, and where Applied Materials, Lam Research and Tokyo Electron compete.`,
} satisfies Lesson;
