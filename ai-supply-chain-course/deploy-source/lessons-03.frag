
need leading-edge fabrication equipment

↓

ASML

↓

needs specialized optics, lasers, materials, precision components and thousands of suppliers

We are currently learning this chain from the bottom upward.

6. One technical term to learn today: resolution

Resolution in lithography means roughly how small a feature or how closely spaced a pattern the lithography system can reliably print.

You do not need the equation yet.

For now remember:

shorter wavelength → potentially finer resolution → smaller, denser chip features.

Later in the curriculum we will return to the actual lithography resolution equation and learn why numerical aperture (NA) matters. That is the key concept behind ASML’s newest High-NA EUV machines.

7. The investment takeaway

It is tempting to think ASML’s moat is simply: “ASML has an EUV monopoly.”

That is true but incomplete.

The deeper moat is that semiconductor scaling created a physical problem—printing ever-smaller features—and solving it required decades of coordinated advances across optics, lasers, plasma physics, precision mechanics, vacuum systems, materials and software.

ASML sits at the point where all of those technologies have to work together reliably inside a semiconductor fab.

That is why another company cannot easily spend a few billion dollars and build a competing EUV scanner.

Remember these 4 things

- Wavelength = the physical length of a light wave.

- Shorter-wavelength light helps lithography systems resolve smaller features.

- DUV uses roughly 193nm light; EUV uses 13.5nm light.

- EUV’s value is economic as well as technical: it can reduce the number and complexity of patterning steps needed at advanced nodes.

Quick check

If an EUV scanner costs far more than a DUV scanner, why might TSMC still save money by using EUV?

Answer: because the machine’s purchase price is only one component of manufacturing cost. If EUV replaces several DUV patterning steps, reduces complexity, improves throughput or yield, and enables a process that would otherwise be impractical, the total cost per successful advanced chip can be better.

Next lesson

Lesson 003: What is actually being printed? — From a circuit design to a photomask to silicon.

We will connect lithography to the actual transistor patterns that ultimately become an AI chip.`,
  },
  {
    number: 3,
    module: moduleName,
    title: "What a Process Node Actually Means",
    date: "2026-08-09",
    body: `Yesterday we learned why shorter-wavelength light helps print smaller features. Today: what people mean when they say 3nm, 2nm, or 7nm chips.

The simple answer

A process node is the name for a generation of semiconductor manufacturing technology.

When you hear TSMC 3nm, think:

“TSMC’s 3nm-generation manufacturing process.”

Do not think every transistor feature literally measures exactly 3 nanometers. Decades ago, node names were more closely tied to a physical transistor dimension. Today, they are largely generation labels.

Why smaller nodes matter

Moving to a newer node generally lets a chip designer fit more transistors into the same area while improving some combination of performance and power efficiency.

That matters enormously for AI.

A GPU is essentially an enormous collection of transistors arranged to perform computation. More useful transistors can mean more compute, larger caches, better efficiency, or additional specialized functions.

So the rough chain is:

better manufacturing → denser/more efficient transistors → more capable chips → more AI compute

Who actually creates a node?

The foundry does.

The key companies are:

- TSMC — leading pure-play foundry and manufacturer of many advanced AI chips, including NVIDIA designs.

- Samsung — both a foundry and a major memory manufacturer.

- Intel — manufactures its own chips and is trying to build a major external foundry business.

Companies such as NVIDIA and Broadcom generally design advanced chips but do not own the leading-edge fabs that manufacture them.

This distinction is fundamental:

NVIDIA designs the blueprint. TSMC owns the factory and manufacturing process that turns that blueprint into silicon.

Where ASML fits

A new process node is not one machine.

TSMC combines equipment from many suppliers into an extraordinarily complicated manufacturing recipe.

Examples:

- ASML — lithography

- Applied Materials — deposition and other wafer-processing equipment

- Lam Research — etch and deposition
