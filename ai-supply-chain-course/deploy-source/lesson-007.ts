import type { Lesson } from "./lessons";

export const lesson007 = {
  number: 7,
  module: "Module 1: How a Chip Is Physically Made",
  title: "Etch — The Other Half of the Build-and-Carve Loop",
  date: "2026-08-13",
  body: `Prior Lessons — 1-Sentence Recap

Lesson 002: EUV’s 13.5nm wavelength enables finer patterning than 193nm DUV and can reduce the costly complexity of multiple-patterning steps.

Lesson 003: A process node such as 3nm is a manufacturing generation, and foundry economics depend heavily on process know-how and yield, not simply owning the same equipment.

Lesson 004: Chips begin on ultra-pure 300mm silicon wafers supplied by companies such as Shin-Etsu and SUMCO, showing that an input can be essential without having monopoly-like economics.

Lesson 005: A chip is built through a repeated loop of deposition, lithography, etch, doping, cleaning and inspection, so leading-edge complexity creates value for many equipment suppliers beyond ASML.

Lesson 006: Deposition adds ultra-thin films to a wafer, and increasingly three-dimensional chip structures raise the value of precise techniques such as ALD and the tools supplied by Applied Materials, Lam Research and Tokyo Electron.

The big idea

Yesterday we covered deposition: adding material to a wafer. Etch is the complementary step—removing selected material with extreme precision.

Think of semiconductor fabrication as microscopic sculpting. Deposition gives you a fresh block of material. Lithography draws the stencil. Etch carves away exactly what the stencil leaves exposed.

That sounds simple until you remember the dimensions involved. A modern fab may need to cut features only nanometers wide, create deep vertical holes through many stacked layers, stop at exactly the right material, and do all of that uniformly across a 300mm wafer.

1. The basic sequence

A simplified patterning cycle is:

Deposit material → coat with photoresist → lithography prints the pattern → develop the resist → etch exposed areas → strip the resist → clean and inspect.

Lithography tells the fab where to cut. Etch performs much of the actual cutting.

That distinction matters economically. ASML can be the bottleneck in printing the pattern, while companies such as Lam Research, Applied Materials and Tokyo Electron supply tools that physically transfer that pattern into the material underneath.

2. Wet etch versus dry etch

There are two broad families to know.

Wet etch uses liquid chemicals to dissolve selected material.

Imagine placing a material in a chemical bath that attacks one substance faster than another. Wet etch can be effective, inexpensive and high-throughput, but the chemistry may remove material in several directions at once.

Dry etch generally uses gases and plasma inside a vacuum chamber.

Plasma is an energized gas containing charged particles. In a dry-etch tool, engineers use carefully controlled chemistry and electric fields to direct reactive particles toward the wafer.

For advanced chips, dry plasma etch is especially important because it can create much more directional, precisely shaped features.

3. Why directionality matters

Suppose you want to cut a narrow vertical trench.

If the process removes material equally downward and sideways, the trench widens as it gets deeper. That is called isotropic behavior—roughly equal removal in multiple directions.

Advanced manufacturing often needs anisotropic etch, meaning the process removes material much more strongly in one direction than another.

The intuition is simple:

Isotropic = digging a hole while the walls also dissolve sideways.

Anisotropic = cutting almost straight down while keeping the sidewalls intact.

That ability is crucial for dense transistor structures, interconnects, DRAM capacitors and 3D NAND.

4. The hard problem: high-aspect-ratio etch

Aspect ratio = depth divided by width.

A hole that is 10 units deep and 1 unit wide has an aspect ratio of 10:1.

The higher the aspect ratio, the harder the manufacturing problem becomes.

Imagine trying to drill a perfectly straight, extremely deep hole that is much narrower than a human hair—then multiply that by billions of structures across a wafer.

The etch process has to get reactive particles all the way to the bottom while avoiding damage to the sidewalls, keeping the opening from collapsing, and making each feature nearly identical.

This is one reason 3D NAND has become such an important equipment market. NAND makers increase storage density by stacking more memory layers vertically. More layers can mean much deeper channel holes that must be etched through the stack.

As layer counts rise, the difficulty of the etch problem can increase faster than wafer volume itself.

That is another example of process intensity.

5. Selectivity — remove one material, preserve another

Etch is not simply “remove material.” A fab may want to remove material A while barely touching material B underneath or next to it.

Selectivity describes how much faster the process removes one material than another.

If an etch process removes the target film 20 times faster than the stop layer underneath, it has much more room for error than a process that attacks both materials at similar rates.

This matters because modern chips use many different materials packed together at tiny dimensions.

A good etch process must balance several goals at once:

- high selectivity;
- precise feature shape;
- uniformity across the wafer;
- low defect and damage rates;
- sufficient throughput for mass production.

Improving one can sometimes hurt another. That is why the process recipe and tool design matter so much.

6. Where Lam Research fits

Lam Research is one of the most important etch-equipment suppliers in the world and is particularly strong in plasma etch.

Its position matters because advanced logic and memory repeatedly require more difficult material-removal steps.

Lam is especially exposed to memory. In 3D NAND, manufacturers stack many layers and then perform extremely demanding high-aspect-ratio etches through those structures. That creates a direct link between increasing NAND complexity and demand for sophisticated etch equipment.

Lam also participates in deposition, which gives it exposure to both halves of the build-and-carve loop.

For an investor, this is useful because Lam does not need total semiconductor wafer volume to grow at the same rate as its opportunity. If each wafer requires more complex etch and deposition work, equipment content per wafer can rise.

7. Applied Materials and Tokyo Electron

Lam is not a monopoly like ASML in EUV.

Applied Materials also sells important etch systems and has a very broad portfolio across deposition, materials engineering and other process steps.

Tokyo Electron is another major competitor across etch and multiple wafer-processing categories.

The competitive structure therefore looks different from EUV lithography:

ASML in EUV: a highly concentrated technological bottleneck with no commercial peer.

Etch: several major suppliers, but leadership can be highly specialized by material, device type and process step.

That means the moat is less about owning the only machine and more about accumulated process knowledge, installed base, customer qualification, tool performance and the difficulty of replacing a proven process inside a high-volume fab.

8. Why switching equipment is hard

Suppose TSMC or Micron has spent months tuning an etch recipe around a specific tool and has finally achieved acceptable yield.

Switching vendors is not like replacing an office printer.

A new tool may alter feature shape, defect rates, wafer uniformity, throughput or interaction with the next process step. The customer may need substantial qualification work before trusting the replacement in high-volume manufacturing.

This creates switching costs and makes installed process positions valuable.

It does not make market share permanent, but it helps explain why semiconductor-equipment franchises can be durable despite intense competition.

9. The economic lens: complexity versus cyclicality

Etch has a strong structural tailwind: chips are becoming more three-dimensional and materials stacks are becoming more complicated.

That can increase etch intensity per wafer.

But Lam and peers still sell capital equipment. Their revenue can move sharply with customer spending cycles.

Memory is the clearest example. If NAND or DRAM prices collapse, manufacturers can cut capex, delay new fabs, or reuse existing equipment longer. Etch demand can fall even while the long-term technical need keeps rising.

So separate two questions:

Structural question: Is etch becoming more important per wafer over time?

Cycle question: Are customers spending aggressively on new equipment right now?

A company can score very well on the first and still have a volatile earnings cycle because of the second.

10. Why this matters for AI

AI demand pushes several parts of the etch opportunity.

Leading-edge logic: GPUs and custom accelerators use advanced process nodes with complex transistor and interconnect structures.

HBM and DRAM: AI systems require enormous memory bandwidth, which supports investment in advanced memory manufacturing where etch is essential.

NAND and storage: AI data centers also create large storage needs, although NAND demand is more cyclical and less directly tied to accelerator shipments than HBM.

Advanced packaging: packaging uses its own patterning and material-removal processes, giving equipment companies another path to benefit as AI packages become more complex.

The important point is that an AI chip is not simply “more NVIDIA demand.” More compute can pull capital spending through many upstream manufacturing steps.

The value-chain map today

Deposition adds material
↓
Lithography defines the pattern
↓
Etch transfers that pattern into the material
↓
Clean + inspect + measure
↓
Repeat hundreds of times to build transistors and interconnects

Remember these 6 things

1. Etch removes selected material from a wafer after lithography defines where the cut should happen.

2. Wet etch uses liquid chemistry; dry plasma etch is especially important for precise, directional advanced-chip structures.

3. High-aspect-ratio etch means cutting very deep, narrow structures and becomes increasingly difficult in technologies such as 3D NAND.

4. Selectivity means removing the target material much faster than surrounding materials.

5. Lam Research is a major leader in etch, while Applied Materials and Tokyo Electron are important competitors; unlike EUV, etch is not a single-vendor monopoly.

6. The long-term thesis is rising etch intensity per wafer, but near-term revenue remains exposed to semiconductor and especially memory capex cycles.

Quick check

Why could Lam Research’s etch opportunity grow even if the number of NAND wafers produced stays roughly flat?

Answer: if NAND manufacturers keep stacking more layers, each wafer can require deeper, more difficult high-aspect-ratio etches and more sophisticated equipment, increasing etch content per wafer.

Next lesson

Lesson 008: Process Control — How KLA Finds Defects Before They Destroy Yield

We will learn the difference between inspection and metrology, why shrinking tolerances make defects more expensive, and why process control can gain value as manufacturing complexity rises.`,
} satisfies Lesson;
