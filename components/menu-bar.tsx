"use client";

import { useState, useEffect } from "react";
import { Clock, Globe, Rocket } from "lucide-react";

export function MenuBar() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [earthInfo, setEarthInfo] = useState<string>("");
  const [scienceFact, setScienceFact] = useState<string>("");

  // Update time and earth info every second
  useEffect(() => {
    const updateTimeAndEarth = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());

      // Calculate Earth's rotation - one full rotation every 24 hours
      // Convert to degrees of rotation (0-360°)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const rotationDegrees = Math.round((totalSeconds / 86400) * 360);

      setEarthInfo(`Earth rotation: ${rotationDegrees}°`);
    };

    updateTimeAndEarth(); // Initial call
    const interval = setInterval(updateTimeAndEarth, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update science fact every 30 seconds
  useEffect(() => {
    const updateScienceFact = () => {
      const facts = [
        // Physics facts
        "The holographic principle suggests our 3D universe may be encoded on a 2D boundary",
        "Quantum tunneling allows particles to pass through energy barriers that classical physics forbids",
        "Loop quantum gravity proposes that space itself consists of finite loops or networks",
        "The Casimir effect demonstrates that quantum vacuum fluctuations can generate measurable forces",
        "Quantum decoherence explains how quantum systems transition to classical behavior through environmental interaction",
        "The Unruh effect predicts that an accelerating observer will detect particles in what an inertial observer perceives as vacuum",
        "String theory requires 10 or 11 dimensions to be mathematically consistent",
        "The Chandrasekhar limit (~1.4 solar masses) determines when electron degeneracy pressure fails to prevent stellar collapse",
        "Baryogenesis theories attempt to explain the observed matter-antimatter asymmetry in the universe",
        "The Bekenstein-Hawking entropy formula relates a black hole's entropy to its event horizon area",
        "Quantum chromodynamics describes the strong nuclear force through color charge interactions",
        "The Pauli exclusion principle prevents identical fermions from occupying the same quantum state",
        "Inflation theory resolves the horizon, flatness, and magnetic monopole problems in cosmology",

        // Chemistry facts
        "Molecular orbital theory explains chemical bonding through quantum mechanical orbital interactions",
        "Chirality in molecules can dramatically affect their biological activity and optical properties",
        "Supramolecular chemistry studies interactions beyond covalent bonds, like hydrogen bonding and π-π stacking",
        "Density functional theory revolutionized computational chemistry by modeling electron density distributions",
        "Organometallic compounds feature direct metal-carbon bonds with unique catalytic properties",
        "Lanthanide contraction explains why elements after lanthanum have similar atomic radii",
        "Hypervalent molecules violate the octet rule through expanded valence shells",
        "Coordination complexes exhibit diverse geometries based on d-orbital splitting and ligand field theory",
        "Zwitterions contain both positive and negative charges in different locations within the same molecule",
        "Frustrated Lewis pairs combine steric hindrance with Lewis acid-base properties for small molecule activation",

        // Biology facts
        "Epigenetic modifications regulate gene expression without altering DNA sequence",
        "Quorum sensing allows bacteria to coordinate behavior based on population density",
        "Alternative splicing enables a single gene to code for multiple proteins through exon rearrangement",
        "The endosymbiotic theory explains how mitochondria and chloroplasts evolved from free-living bacteria",
        "Horizontal gene transfer allows organisms to acquire genetic material from non-ancestral sources",
        "RNA interference regulates gene expression through small interfering RNAs that target specific mRNAs",
        "Protein folding is guided by hydrophobic interactions, hydrogen bonding, and chaperone proteins",
        "CRISPR-Cas systems provide adaptive immunity in prokaryotes against viral and plasmid DNA",
        "Neuroplasticity allows the brain to reorganize neural pathways based on experience and learning",
        "Telomere shortening during cell division contributes to cellular senescence and aging",
        "The microbiome influences host metabolism, immunity, and even behavior through complex interactions",
        "Prions propagate by inducing normal proteins to misfold, causing neurodegenerative diseases",
        "Convergent evolution produces similar traits in unrelated species due to similar selective pressures",
        "Transposable elements or 'jumping genes' can move within a genome, affecting gene expression",
        "Autophagy recycles cellular components through lysosomal degradation, essential for cellular homeostasis"
      ];

      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      setScienceFact(randomFact);
    };

    updateScienceFact(); // Initial call
    const interval = setInterval(updateScienceFact, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm border-b border-white/10 px-6 py-3 h-16 flex items-center">
      <div className="w-full mx-auto grid grid-cols-3 items-center h-10">
        <div className="flex items-center space-x-3 ml-6">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="text-base font-mono leading-none">{currentTime}</span>
        </div>

        <div className="flex items-center space-x-3 justify-self-center">
          <Globe className="h-5 w-5 text-blue-400 animate-pulse" />
          <span className="text-base font-mono leading-none">{earthInfo}</span>
        </div>

        <div className="flex items-center space-x-3 justify-self-end mr-6">
          <Rocket className="h-5 w-5 text-blue-400" />
          <div className="relative group">
            <span
              className="text-base font-mono text-blue-300 w-96 truncate hidden sm:inline-block leading-none"
            >
              {scienceFact}
            </span>
            <div className="absolute right-0 top-7 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <div className="bg-black/90 border border-blue-500/30 text-blue-300 p-4 text-base font-mono rounded shadow-lg max-w-lg whitespace-normal">
                {scienceFact}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
