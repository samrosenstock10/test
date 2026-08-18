That is the basic ASML thesis.

Remember these 5 things

- Lithography = printing microscopic circuit patterns onto silicon.

- EUV enables the most advanced chip manufacturing.

- ASML is the only EUV equipment supplier.

- ZEISS, TRUMPF and Cymer are important pieces of the ASML ecosystem.

- Lithography is expensive and somewhat cyclical, but technological scarcity gives ASML unusually strong economics.

Tomorrow

Lesson 002: Why does shorter-wavelength light let you make smaller transistors?

We will explain the basic physics behind DUV vs. EUV without assuming any engineering background.`,
  },
  {
    number: 2,
    module: moduleName,
    title: "Why EUV Uses Shorter-Wavelength Light",
    date: "2026-08-08",
    body: `Yesterday: lithography is the process of printing tiny circuit patterns onto a silicon wafer. Today we answer the next question: why does changing the light let us print smaller features?

1. The simple intuition: a thick marker vs. a fine pen

Imagine trying to draw a tiny line with a thick marker. At some point, the marker tip itself is too large to make the detail you want.

Light has a similar constraint. Light behaves as a wave, and the size of that wave—its wavelength—helps determine how finely a lithography system can resolve a pattern.

A shorter wavelength is like switching from a thick marker to a much finer pen.

This is not the complete physics, but it is the right mental model.

2. DUV vs. EUV

The key numbers:

- DUV lithography: typically uses 193-nanometer light for advanced manufacturing.

- EUV lithography: uses 13.5-nanometer light.

A nanometer is one-billionth of a meter.

So EUV’s wavelength is roughly 14× shorter than 193nm DUV light.

That does not mean EUV automatically prints features 14× smaller. The real resolution also depends on the optics and process engineering. But the much shorter wavelength gives chipmakers a fundamentally better starting point for printing extremely small structures.

3. Why couldn’t the industry just keep using DUV?

It tried—and still does.

Engineers became extraordinarily clever at extending DUV. One major technique is multiple patterning.

Suppose DUV cannot print a dense pattern in one exposure. Instead, the manufacturer breaks the pattern into multiple simpler patterns and prints them separately.

Think of painting alternating black stripes in one pass and then returning to paint the stripes in between.

This works, but every extra step creates problems:

- more equipment time;

- more chemicals and processing steps;

- longer manufacturing cycle times;

- greater chance of defects;

- more difficulty aligning one pattern perfectly with another;

- higher cost per wafer.

EUV can often create a pattern with fewer lithography steps than an equivalent DUV-based process.

4. This is an economics story, not just a physics story

This point is important for investing.

An EUV scanner is extraordinarily expensive. Why would TSMC, Samsung, or Intel buy one instead of squeezing more life from existing DUV tools?

Because the correct comparison is not simply:

price of one EUV machine vs. price of one DUV machine.

It is closer to:

total cost and complexity of producing a working advanced wafer using EUV vs. total cost using many DUV patterning steps.

If EUV eliminates multiple process steps, reduces complexity, and improves the economics of manufacturing advanced chips, an expensive machine can still lower the effective cost of producing the chip.

This is a recurring theme in semiconductor equipment: customers will pay enormous prices for tools that improve yield, throughput, or process complexity.

We will define yield and throughput carefully in later lessons.

5. Why ASML’s position became so powerful

Once leading-edge semiconductor manufacturing depended on EUV, the lithography market changed.

ASML became the only commercial supplier of EUV scanners.

That means a company such as TSMC cannot simply decide to buy an equivalent EUV system from another supplier if ASML’s price is too high.

Nikon and Canon remain important lithography companies, particularly outside leading-edge EUV, but neither currently offers a commercial EUV alternative to ASML.

This creates an unusual supply-chain structure:

NVIDIA / AMD / Apple / custom AI-chip designers

↓

need advanced chips

↓

TSMC / Samsung / Intel

↓