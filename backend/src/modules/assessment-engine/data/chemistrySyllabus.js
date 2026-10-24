/**
 * Official Sri Lankan G.C.E. Advanced Level (A/L) Chemistry Syllabus Hierarchy
 * Organised into 3 Main Categories:
 * A. Physical Chemistry
 * B. Inorganic Chemistry
 * C. Organic Chemistry
 */

const CHEMISTRY_SYLLABUS = [
  {
    id: 'physical-chemistry',
    name: 'Physical Chemistry',
    code: 'A',
    description: 'Fundamental principles of atomic structure, chemical bonding, stoichiometry, thermodynamics, kinetics, equilibrium, and electrochemistry.',
    topics: [
      {
        id: 'atomic-structure',
        name: 'Atomic Structure',
        number: 1,
        subtopics: [
          { id: 'fundamental-particles-models', name: 'Fundamental particles and atomic models: Thomson, Rutherford, and Bohr' },
          { id: 'electromagnetic-radiation-photoelectric', name: 'Electromagnetic radiation, wave-particle duality, and the photoelectric effect' },
          { id: 'hydrogen-spectrum-energy-levels', name: 'Hydrogen atomic spectrum and energy-level quantization' },
          { id: 'quantum-numbers', name: 'Quantum numbers: n, l, ml, and ms' },
          { id: 'orbital-shapes', name: 'Orbital shapes: s, p, d, and f' },
          { id: 'aufbau-pauli-hund-configurations', name: "Aufbau principle, Pauli exclusion principle, Hund's rule, and electronic configurations" },
          { id: 'periodic-trends-atomic-radii-ionization', name: 'Periodic trends: atomic and ionic radii, ionization energy, electron-gain energy, and electronegativity' }
        ]
      },
      {
        id: 'structure-and-bonding',
        name: 'Structure and Bonding',
        number: 2,
        subtopics: [
          { id: 'bonding-types', name: 'Ionic, covalent, dative/coordinate, and metallic bonding' },
          { id: 'lewis-structures-resonance', name: 'Lewis dot-dash structures and resonance' },
          { id: 'vsepr-geometries-hybridization', name: 'VSEPR theory, molecular geometries, hybridization, and bond angles' },
          { id: 'intermolecular-forces', name: 'Intermolecular forces: dipole-dipole, hydrogen bonding, and dispersion forces' },
          { id: 'physical-properties-boiling-solubility', name: 'Physical properties: boiling points and solubility' },
          { id: 'fajans-rules', name: "Fajan's rules, including polarizing power of cations and polarizability of anions" }
        ]
      },
      {
        id: 'chemical-calculations-stoichiometry',
        name: 'Chemical Calculations and Stoichiometry',
        number: 3,
        subtopics: [
          { id: 'mole-concept-molar-masses', name: 'Mole concept and molar masses' },
          { id: 'empirical-molecular-formulae', name: 'Empirical and molecular formulae' },
          { id: 'solution-concentrations', name: 'Solution concentrations: molarity, molality, mole fractions, and mass percentages' },
          { id: 'balancing-redox-ionic-equations', name: 'Balancing complex redox and ionic equations' },
          { id: 'limiting-reagents-percentage-yields', name: 'Limiting reagents and percentage yields' },
          { id: 'stoichiometric-calculations', name: 'Stoichiometric calculations' }
        ]
      },
      {
        id: 'energetics-thermodynamics',
        name: 'Energetics / Thermodynamics',
        number: 4,
        subtopics: [
          { id: 'system-surroundings-processes', name: 'System, surroundings, exothermic and endothermic processes' },
          { id: 'standard-enthalpy-changes', name: 'Standard enthalpy changes: formation, combustion, neutralization, atomization, solution, and hydration' },
          { id: 'hess-law-energy-cycles', name: "Hess's law and energy-cycle diagrams" },
          { id: 'born-haber-cycles-lattice-enthalpy', name: 'Born-Haber cycles and ionic lattice enthalpy' },
          { id: 'spontaneity-entropy-changes', name: 'Spontaneity and entropy changes' },
          { id: 'gibbs-free-energy', name: 'Gibbs free energy' }
        ]
      },
      {
        id: 'chemical-kinetics',
        name: 'Chemical Kinetics',
        number: 5,
        subtopics: [
          { id: 'rate-of-reaction-equations-order', name: 'Rate of reaction, rate equations, rate constants, and reaction order' },
          { id: 'experimental-rate-determination-iodine-clock', name: 'Experimental determination of reaction rates, including iodine-clock experiments' },
          { id: 'temperature-catalysts-surface-area', name: 'Effects of temperature, catalysts, surface area, and concentration' },
          { id: 'maxwell-boltzmann-distribution', name: 'Maxwell-Boltzmann distribution of molecular kinetic energies' },
          { id: 'arrhenius-equation', name: 'Arrhenius equation' }
        ]
      },
      {
        id: 'equilibrium',
        name: 'Equilibrium',
        number: 6,
        subtopics: [
          { id: 'dynamic-equilibrium-le-chatelier', name: "Dynamic chemical equilibrium and Le Chatelier's principle" },
          { id: 'equilibrium-constants-kc-kp', name: 'Equilibrium constants Kc and Kp' },
          { id: 'reaction-quotient-qc', name: 'Reaction quotient Qc' },
          { id: 'acid-base-theories', name: 'Brønsted-Lowry and Lewis acid-base theories' },
          { id: 'ph-calculations', name: 'pH calculations' },
          { id: 'strong-weak-acids-bases', name: 'Strong and weak acids and bases' },
          { id: 'buffer-solutions-indicators', name: 'Buffer solutions and acid-base indicators' },
          { id: 'solubility-product-ksp', name: 'Solubility product Ksp' },
          { id: 'common-ion-selective-precipitation', name: 'Common-ion effect and selective precipitation' }
        ]
      },
      {
        id: 'phase-equilibria',
        name: 'Phase Equilibria',
        number: 7,
        subtopics: [
          { id: 'phase-diagrams-single-component', name: 'Phase diagrams of single-component systems, including water and carbon dioxide' },
          { id: 'liquid-liquid-solid-liquid-distribution', name: 'Liquid-liquid and solid-liquid distribution' },
          { id: 'partition-coefficient-extraction', name: 'Partition coefficient and extraction calculations' }
        ]
      },
      {
        id: 'electrochemistry',
        name: 'Electrochemistry',
        number: 8,
        subtopics: [
          { id: 'electrochemical-cells-electrode-potentials', name: 'Electrochemical cells and standard electrode potentials' },
          { id: 'cell-notation', name: 'Cell notation' },
          { id: 'nernst-equation-applications', name: 'Nernst equation and applications' },
          { id: 'electrolysis-faraday-laws', name: "Electrolysis and Faraday's laws" },
          { id: 'industrial-applications-metal-extraction', name: 'Industrial applications, including extraction of reactive metals such as magnesium' }
        ]
      }
    ]
  },
  {
    id: 'inorganic-chemistry',
    name: 'Inorganic Chemistry',
    code: 'B',
    description: 'Periodic patterns, chemistry of s-, p-, and d-block elements, and laboratory qualitative identification of ions.',
    topics: [
      {
        id: 'block-elements',
        name: 'Chemistry of s-, p-, and d-Block Elements',
        number: 1,
        subtopics: [
          { id: 's-block-properties-trends', name: 's-block: Groups 1 and 2 trends, stability of carbonates/nitrates, and anomalous Li/Be' },
          { id: 'p-block-properties-hydrides-oxides', name: 'p-block: Groups 13 to 18 trends, hydrides, oxides, oxoacids, N and S chemistry, Contact/Haber processes, halogens and noble gases' },
          { id: 'd-block-transition-elements-complexes', name: 'd-block / Transition Elements: variable oxidation states, coloured ions, catalysts, complexes, nomenclature, and isomerism' }
        ]
      },
      {
        id: 'qualitative-analysis',
        name: 'Qualitative Analysis of Cations and Anions',
        number: 2,
        subtopics: [
          { id: 'dry-wet-lab-identification', name: 'Systematic dry and wet laboratory identification and group reagents' },
          { id: 'characteristic-precipitates-colours', name: 'Characteristic precipitates, colours, and colour changes' },
          { id: 'cation-anion-confirmatory-tests', name: 'Confirmatory tests and identification schemes for specified cations (Cu2+, Cr3+, Mn2+, Ca2+) and relevant anions' }
        ]
      }
    ]
  },
  {
    id: 'organic-chemistry',
    name: 'Organic Chemistry',
    code: 'C',
    description: 'Carbon chemistry: nomenclature, isomerism, mechanism of reactions, functional groups, polymers, and environmental applications.',
    topics: [
      {
        id: 'basic-concepts-organic',
        name: 'Basic Concepts of Organic Chemistry',
        number: 1,
        subtopics: [
          { id: 'structural-representations-iupac', name: 'Structural representations and IUPAC nomenclature' },
          { id: 'isomerism-structural-geometric-optical', name: 'Structural, geometric, and optical isomerism; chiral centres' },
          { id: 'reaction-intermediates-carbocations', name: 'Reaction intermediates: carbocations, carbanions, and free radicals' },
          { id: 'electronic-effects-inductive-resonance', name: 'Inductive effect, resonance/delocalization, and hyperconjugation' },
          { id: 'reaction-types-substitution-addition-elimination', name: 'Electrophiles, nucleophiles, substitution, addition, and elimination reactions' }
        ]
      },
      {
        id: 'hydrocarbons-halohydrocarbons',
        name: 'Hydrocarbons and Halohydrocarbons',
        number: 2,
        subtopics: [
          { id: 'alkanes-alkenes-alkynes', name: 'Alkanes, alkenes, and alkynes' },
          { id: 'benzene-aromaticity-substitution', name: 'Benzene, aromaticity, and electrophilic substitution mechanisms' },
          { id: 'haloalkanes-sn1-sn2-e1-e2', name: 'Haloalkanes: SN1, SN2, E1, and E2 mechanisms and stereochemical outcomes' }
        ]
      },
      {
        id: 'oxygen-containing-compounds',
        name: 'Oxygen-Containing Organic Compounds',
        number: 3,
        subtopics: [
          { id: 'alcohols-phenols-ethers', name: 'Alcohols, phenols, and ethers' },
          { id: 'aldehydes-ketones-nucleophilic-addition', name: "Aldehydes and ketones; nucleophilic addition; tests (2,4-DNP, Tollens', Fehling's)" },
          { id: 'carboxylic-acids-derivatives', name: 'Carboxylic acids and derivatives: acyl chlorides, esters, and amides' }
        ]
      },
      {
        id: 'nitrogen-containing-compounds',
        name: 'Nitrogen-Containing Organic Compounds',
        number: 4,
        subtopics: [
          { id: 'aliphatic-aromatic-amines', name: 'Aliphatic and aromatic amines' },
          { id: 'diazonium-salts-azo-coupling', name: 'Diazonium salts and azo-dye coupling reactions' }
        ]
      },
      {
        id: 'polymers',
        name: 'Polymers',
        number: 5,
        subtopics: [
          { id: 'addition-condensation-polymerization', name: 'Addition and condensation polymerization' },
          { id: 'thermoplastics-thermosets-rubbers', name: 'Thermoplastics, thermosetting polymers, and synthetic/natural rubbers' }
        ]
      },
      {
        id: 'applied-industrial-environmental-chemistry',
        name: 'Applied / Industrial Chemistry and Environmental Pollution',
        number: 6,
        subtopics: [
          { id: 'industrial-processes-solvay-acids-metals', name: 'Solvay process, manufacture of sulfuric/nitric acids, and extraction of metals' },
          { id: 'natural-vinegar-essential-oils-distillation', name: 'Natural vinegar production, extraction of essential oils, steam distillation, and Dalton’s law' },
          { id: 'environmental-pollution-greenhouse-ozone-smog-water', name: 'Greenhouse effect, global warming, ozone-layer depletion, photochemical smog, and water pollution' }
        ]
      }
    ]
  }
];

/**
 * Deterministically maps a question from questions.json to the standard A/L Chemistry Syllabus Hierarchy.
 */
function mapQuestionToSyllabus(question) {
  const t = (question.subject_topic || '').toLowerCase();
  const st = (question.subtopic || '').toLowerCase();

  // 1. INORGANIC CHEMISTRY (Must check before organic)
  if (t.includes('inorganic')) {
    if (st.includes('qualitative') || st.includes('complex ion')) {
      return {
        main_topic_id: 'inorganic-chemistry',
        main_topic_name: 'Inorganic Chemistry',
        topic_id: 'qualitative-analysis',
        topic_name: 'Qualitative Analysis of Cations and Anions',
        subtopic_id: 'cation-anion-confirmatory-tests',
        subtopic_name: question.subtopic || 'Confirmatory tests for cations and anions'
      };
    }
    return {
      main_topic_id: 'inorganic-chemistry',
      main_topic_name: 'Inorganic Chemistry',
      topic_id: 'block-elements',
      topic_name: 'Chemistry of s-, p-, and d-Block Elements',
      subtopic_id: st.includes('d-block') ? 'd-block-transition-elements-complexes' : 'p-block-properties-hydrides-oxides',
      subtopic_name: question.subtopic || 'Chemistry of s-, p-, and d-Block Elements'
    };
  }

  // 2. ORGANIC CHEMISTRY
  if (t.includes('organic')) {
    if (st.includes('nomenclature') || st.includes('isomerism') || st.includes('stereochem')) {
      return {
        main_topic_id: 'organic-chemistry',
        main_topic_name: 'Organic Chemistry',
        topic_id: 'basic-concepts-organic',
        topic_name: 'Basic Concepts of Organic Chemistry',
        subtopic_id: st.includes('nomenclature') ? 'structural-representations-iupac' : 'isomerism-structural-geometric-optical',
        subtopic_name: question.subtopic || 'Basic Concepts of Organic Chemistry'
      };
    }
    if (st.includes('alkyne') || st.includes('alkene') || st.includes('aromatic') || st.includes('substitution') || st.includes('elimination')) {
      return {
        main_topic_id: 'organic-chemistry',
        main_topic_name: 'Organic Chemistry',
        topic_id: 'hydrocarbons-halohydrocarbons',
        topic_name: 'Hydrocarbons and Halohydrocarbons',
        subtopic_id: st.includes('aromatic') ? 'benzene-aromaticity-substitution' : (st.includes('substitution') || st.includes('elimination')) ? 'haloalkanes-sn1-sn2-e1-e2' : 'alkanes-alkenes-alkynes',
        subtopic_name: question.subtopic || 'Hydrocarbons and Halohydrocarbons'
      };
    }
    return {
      main_topic_id: 'organic-chemistry',
      main_topic_name: 'Organic Chemistry',
      topic_id: 'oxygen-containing-compounds',
      topic_name: 'Oxygen-Containing Organic Compounds',
      subtopic_id: st.includes('alcohol') ? 'alcohols-phenols-ethers' : 'aldehydes-ketones-nucleophilic-addition',
      subtopic_name: question.subtopic || 'Oxygen-Containing Organic Compounds'
    };
  }

  // 3. APPLIED, INDUSTRIAL & ENVIRONMENTAL CHEMISTRY & POLYMERS
  if (t.includes('environmental') || t.includes('industrial') || t.includes('applied') || t.includes('polymer')) {
    if (t.includes('polymer') || st.includes('polymer')) {
      return {
        main_topic_id: 'organic-chemistry',
        main_topic_name: 'Organic Chemistry',
        topic_id: 'polymers',
        topic_name: 'Polymers',
        subtopic_id: 'thermoplastics-thermosets-rubbers',
        subtopic_name: question.subtopic || 'Polymers'
      };
    }
    return {
      main_topic_id: 'organic-chemistry',
      main_topic_name: 'Organic Chemistry',
      topic_id: 'applied-industrial-environmental-chemistry',
      topic_name: 'Applied / Industrial Chemistry and Environmental Pollution',
      subtopic_id: t.includes('environmental') ? 'environmental-pollution-greenhouse-ozone-smog-water' : 'industrial-processes-solvay-acids-metals',
      subtopic_name: question.subtopic || 'Applied / Industrial Chemistry and Environmental Pollution'
    };
  }

  // 4. PHYSICAL CHEMISTRY
  if (t.includes('atomic')) {
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'atomic-structure',
      topic_name: 'Atomic Structure',
      subtopic_id: st.includes('quantum') ? 'quantum-numbers' : st.includes('broglie') ? 'electromagnetic-radiation-photoelectric' : 'aufbau-pauli-hund-configurations',
      subtopic_name: question.subtopic || 'Atomic Structure'
    };
  }
  if (t.includes('bonding')) {
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'structure-and-bonding',
      topic_name: 'Structure and Bonding',
      subtopic_id: st.includes('vsepr') || st.includes('shape') ? 'vsepr-geometries-hybridization' : st.includes('intermolecular') ? 'intermolecular-forces' : 'bonding-types',
      subtopic_name: question.subtopic || 'Structure and Bonding'
    };
  }
  if (t.includes('general') || t.includes('stoichiometry') || t.includes('redox') || st.includes('titration') || st.includes('stoichiometry')) {
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'chemical-calculations-stoichiometry',
      topic_name: 'Chemical Calculations and Stoichiometry',
      subtopic_id: st.includes('redox') ? 'balancing-redox-ionic-equations' : 'stoichiometric-calculations',
      subtopic_name: question.subtopic || 'Chemical Calculations and Stoichiometry'
    };
  }
  if (t.includes('energetic') || t.includes('thermodynamic')) {
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'energetics-thermodynamics',
      topic_name: 'Energetics / Thermodynamics',
      subtopic_id: st.includes('gibbs') || st.includes('spontaneity') ? 'gibbs-free-energy' : st.includes('hess') ? 'hess-law-energy-cycles' : 'standard-enthalpy-changes',
      subtopic_name: question.subtopic || 'Energetics / Thermodynamics'
    };
  }
  if (t.includes('kinetic') || t.includes('gaseous')) {
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'chemical-kinetics',
      topic_name: 'Chemical Kinetics',
      subtopic_id: st.includes('boltzmann') ? 'maxwell-boltzmann-distribution' : st.includes('catalyst') ? 'temperature-catalysts-surface-area' : 'rate-of-reaction-equations-order',
      subtopic_name: question.subtopic || 'Chemical Kinetics'
    };
  }
  if (t.includes('equilibrium')) {
    if (st.includes('phase')) {
      return {
        main_topic_id: 'physical-chemistry',
        main_topic_name: 'Physical Chemistry',
        topic_id: 'phase-equilibria',
        topic_name: 'Phase Equilibria',
        subtopic_id: 'phase-diagrams-single-component',
        subtopic_name: question.subtopic || 'Phase Equilibria'
      };
    }
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'equilibrium',
      topic_name: 'Equilibrium',
      subtopic_id: st.includes('solubility') ? 'solubility-product-ksp' : st.includes('acid') || st.includes('ph') ? 'ph-calculations' : 'dynamic-equilibrium-le-chatelier',
      subtopic_name: question.subtopic || 'Equilibrium'
    };
  }
  if (t.includes('electrochemistry')) {
    return {
      main_topic_id: 'physical-chemistry',
      main_topic_name: 'Physical Chemistry',
      topic_id: 'electrochemistry',
      topic_name: 'Electrochemistry',
      subtopic_id: 'electrochemical-cells-electrode-potentials',
      subtopic_name: question.subtopic || 'Electrochemistry'
    };
  }

  return {
    main_topic_id: 'physical-chemistry',
    main_topic_name: 'Physical Chemistry',
    topic_id: 'general-chemistry',
    topic_name: question.subject_topic || 'General Chemistry',
    subtopic_id: 'general-chemistry-subtopic',
    subtopic_name: question.subtopic || 'General Chemistry'
  };
}

module.exports = {
  CHEMISTRY_SYLLABUS,
  mapQuestionToSyllabus
};
