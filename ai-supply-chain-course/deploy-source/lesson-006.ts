import type { Lesson } from "./lessons";

export const lesson006 = {
  number: 6,
  module: "Module 1: How a Chip Is Physically Made",
  title: "Deposition — Building Films Only Atoms Thick",
  date: "2026-08-12",
  body: `Prior Lessons — 1-Sentence Recap

Lesson 001: Lithography prints microscopic circuit patterns onto silicon, and ASML’s production-EUV monopoly makes it a uniquely scarce leading-edge supplier.

Lesson 002: EUV’s 13.5nm wavelength enables finer patterning than 193nm DUV and can reduce the costly complexity of multiple-patterning steps.

Lesson 003: A process node such as 3nm is a manufacturing generation, and foundry economics depend heavily on process know-how and yield, not simply owning the same equipment.

Lesson 004: Chips begin on ultra-pure 300mm silicon wafers supplied by companies such as Shin-Etsu and SUMCO, showing that an input can be essential without having monopoly-like economics.

Lesson 005: A chip is built through a repeated loop of deposition, lithography, etch, doping, cleaning and inspection, so leading-edge complexity creates value for many equipment suppliers beyond ASML.

The big idea

Yesterday we learned that semiconductor fabrication is a repeated construction loop. Today we zoom into one of its most important steps: deposition.

Deposition means putting an extremely thin film of material onto a wafer.

If a chip were a microscopic skyscraper, lithography would help draw each floor plan, etch would carve away selected material, and deposition would deliver the new layers from which the structure is built.

The remarkable part is the required precision. Some semiconductor films are only a few nanometers thick; some processes effectively build material one atomic layer at a time.

Why does a chip need so many different films?

A modern transistor is not simply a piece of silicon with a wire attached. It contains carefully engineered regions made from materials that perform different jobs.

Some layers conduct electricity. Others insulate one conductor from another. Others help control the transistor’s electrical behavior. Above the transistors, many additional layers create the microscopic metal wiring that connects billions of transistors together.

That means a fab repeatedly faces the same challenge: put exactly the right material, at exactly the right thickness, in exactly the right place, across an entire 300mm wafer.

A film that is slightly too thick, too thin, contaminated or non-uniform can reduce yield—the percentage of usable chips produced from the wafer.

Three deposition methods to know

You do not need to memorize the chemistry yet. The useful first-pass framework is CVD, PVD and ALD.

1. CVD — Chemical Vapor Deposition

CVD introduces gases containing the desired material into a process chamber. Chemical reactions occur at the wafer surface and leave behind a solid film.

Think of sending invisible chemical ingredients into an oven where they react only under the right conditions and create a coating on the wafer.

CVD is useful because it can deposit high-quality films across complex surfaces and is used extensively throughout semiconductor manufacturing.

Major equipment suppliers include Applied Materials, Lam Research and Tokyo Electron.

2. PVD — Physical Vapor Deposition

PVD deposits material through a more physical process rather than primarily relying on a chemical reaction at the wafer surface.

One common approach is sputtering: energetic particles knock atoms off a solid target, and those atoms travel through the chamber and settle onto the wafer.

A rough analogy is microscopic spray painting, although the real process occurs in a tightly controlled vacuum environment.

Applied Materials has historically been a major player in PVD equipment.

3. ALD — Atomic Layer Deposition

ALD is the easiest method to understand if you focus on precision rather than chemistry.

Instead of depositing a relatively continuous stream of material, ALD exposes the wafer to chemical precursors in separate, controlled steps. Each reaction is self-limiting: once available surface sites have reacted, that step essentially stops. The process then repeats.

The result is extraordinary control over film thickness and excellent coverage around complicated three-dimensional structures.

Think of painting an intricate object by adding one perfectly controlled molecular coat at a time rather than spraying on a thick layer all at once.

ALD is slower than many other deposition approaches, but its precision becomes increasingly valuable as chip structures become smaller and more three-dimensional.

Why 3D structures matter

Older simplified transistor diagrams often look flat. Modern leading-edge devices increasingly rely on three-dimensional geometries.

FinFET transistors raised the channel into a fin. Gate-all-around, or GAA, transistors go further by wrapping the gate around extremely small channels from multiple sides.

You do not need the transistor physics yet. The manufacturing implication is what matters today: coating a flat surface is easier than coating tiny three-dimensional structures evenly.

Imagine painting a flat sheet of paper versus coating every side of a microscopic maze with exactly the same film thickness.

As structures become more complex, highly conformal deposition—meaning a film coats different surfaces evenly—becomes more important. That tends to increase the value of techniques such as ALD.

This is a recurring AI-supply-chain pattern: architectural complexity at the chip level can create more equipment intensity upstream.

The major companies

Applied Materials (AMAT)

Applied Materials is the broadest major wafer-fabrication equipment vendor. Deposition is one of its core strengths, alongside other process categories.

Its strategic advantage is breadth: it participates in many steps inside the fab and can develop equipment around multiple materials and process changes.

Lam Research (LRCX)

Lam is especially associated with etch and deposition. These two steps are closely linked: fabs repeatedly add material and then selectively remove it.

Lam has particularly important exposure to memory manufacturing, where increasingly complex 3D NAND structures require enormous amounts of deposition and etch work.

Tokyo Electron (TEL)

Tokyo Electron is another broad semiconductor-equipment supplier with positions across deposition, etch, coating/develop tracks and other processes.

It is one of Japan’s most strategically important semiconductor-equipment companies.

ASML versus deposition vendors

This distinction matters for investing.

ASML owns a uniquely concentrated bottleneck: no alternative vendor currently sells production EUV scanners.

Deposition is more competitive. Applied Materials, Lam Research and Tokyo Electron can compete in overlapping categories, and leadership differs by process and application.

So the deposition investment thesis is generally not “one company owns the only machine.”

Instead, it is often: semiconductor structures are getting harder to manufacture, and that complexity can increase the number, precision and value of deposition steps required per wafer.

That is a different kind of moat.

The key economic concept: process intensity

Suppose a fab processes 1 million wafers this year and still processes roughly 1 million wafers several years from now.

At first glance, you might assume equipment demand cannot grow much.

But imagine the future process requires substantially more deposition steps, more sophisticated films and more expensive tools for each wafer.

Equipment spending per wafer can rise even if wafer volume barely changes.

This is process intensity.

For equipment investors, the useful equation is roughly:

Equipment opportunity = wafer volume × equipment intensity per wafer.

AI can push both sides. More AI chips can require more leading-edge wafer capacity, while more advanced transistor, memory and packaging structures can increase manufacturing complexity per wafer.

Where deposition becomes especially important

Three areas are worth remembering for later lessons:

Leading-edge logic: new transistor structures such as GAA require increasingly precise material engineering.

3D NAND: memory makers stack many layers vertically, creating major deposition and etch requirements.

Advanced packaging: building increasingly sophisticated packages also requires thin-film and materials processes, although the equipment mix differs from front-end wafer fabrication.

We will revisit all three rather than trying to learn them at once.

Cyclicality and the investment angle

Deposition equipment companies still sell capital equipment. Their customers can delay purchases when semiconductor demand weakens or when fabs have excess capacity.

Memory is especially cyclical because DRAM and NAND producers can sharply change capex when memory pricing rises or falls.

This creates an important distinction:

Structural growth tells you how the opportunity may expand over many years.

Cyclicality tells you how unevenly that growth may arrive.

A company can have excellent long-term structural exposure and still experience meaningful revenue declines during a semiconductor downcycle.

For an investor with a long horizon, the analytical job is therefore not merely to identify a growing technical need. You also need to understand market share, process leadership, customer concentration, capital intensity and where you are in the spending cycle.

The value-chain map today

Materials and gases
↓
Deposition equipment — Applied Materials / Lam Research / Tokyo Electron
↓
Ultra-thin films created on the wafer
↓
Lithography defines the pattern
↓
Etch selectively removes material
↓
The loop repeats to build transistors and wiring

Remember these 6 things

1. Deposition adds ultra-thin material films to a wafer.

2. CVD uses chemical reactions, PVD physically transfers material, and ALD provides exceptionally precise layer-by-layer control.

3. More three-dimensional chip structures make uniform deposition harder and can increase deposition intensity.

4. Applied Materials, Lam Research and Tokyo Electron are major deposition-equipment vendors; unlike ASML in EUV, deposition is not a single-vendor monopoly.

5. Equipment demand can grow even without equivalent wafer-volume growth because the amount and sophistication of equipment work per wafer can increase.

6. Structural semiconductor complexity can drive long-term growth while capex and memory cycles still create significant short-term volatility.

Quick check

Why might ALD become more valuable as transistors become more three-dimensional?

Answer: complex 3D structures need extremely thin, uniform films on multiple surfaces; ALD can control thickness with near-atomic precision and coat intricate geometries more evenly than less precise approaches.

Next lesson

Lesson 007: Etch — The Other Half of the Build-and-Carve Loop

We will learn how fabs selectively remove material, why high-aspect-ratio structures are so difficult to etch, and why Lam Research has become strategically important in advanced logic and memory manufacturing.`,
} satisfies Lesson;
