// Mock AI responses used by services/chatService.ts and seeded chats.
// Replace with real RAG output once the backend is connected.

export const mockResponses = {
  titration: `## ආම්ල-භස්ම අනුමාපනය (Acid–Base Titration)

අනුමාපනය යනු **සාන්ද්‍රණය දන්නා** ද්‍රාවණයක් (standard solution) භාවිතයෙන් සාන්ද්‍රණය නොදන්නා ද්‍රාවණයක සාන්ද්‍රණය නිර්ණය කරන ප්‍රමාණාත්මක ක්‍රමයකි.

**ප්‍රධාන ප්‍රතික්‍රියාව**

$$HCl_{(aq)} + NaOH_{(aq)} \\rightarrow NaCl_{(aq)} + H_2O_{(l)}$$

### පියවර
1. බියුරෙට්ටුව සම්මත NaOH ද්‍රාවණයෙන් සෝදා පුරවන්න.
2. පිපෙට්ටුවෙන් HCl 25.00 cm³ ක් කේතුකාකාර ප්ලාස්කුවකට ගන්න.
3. Phenolphthalein දර්ශකය බිංදු 2–3 ක් එක් කරන්න.
4. ලා රෝස පැහැය තත්පර 30 ක් ස්ථිරව පවතින තෙක් අනුමාපනය කරන්න.

### දර්ශක තෝරා ගැනීම

| දර්ශකය | pH පරාසය | වර්ණ වෙනස | සුදුසු අවස්ථාව |
|---|---|---|---|
| Phenolphthalein | 8.2 – 10.0 | අවර්ණ → රෝස | ප්‍රබල භස්ම |
| Methyl orange | 3.1 – 4.4 | රතු → කහ | ප්‍රබල අම්ල |

### ගණනය

ප්‍රතික්‍රියාව 1 : 1 නිසා $n_{acid} = n_{base}$ වේ. එබැවින්,

$$C_{acid} = \\frac{C_{base} \\times V_{base}}{V_{acid}}$$

> Exam tip: දුබල භස්මයක් සමඟ ප්‍රබල අම්ලයක් අනුමාපනය කිරීමේදී **methyl orange** භාවිතා කරන්න — phenolphthalein නොවේ.`,

  newton: `## Newton's Laws of Motion — Summary

නිව්ටන්ගේ චලිත නියම තුන A/L Physics යාන්ත්‍ර විද්‍යාවේ පදනමයි.

| Law | Statement | Key idea |
|---|---|---|
| 1st | බාහිර බලයක් නොමැති නම් වස්තුවක් නිශ්චලව හෝ ඒකාකාර ප්‍රවේගයෙන් පවතී | Inertia |
| 2nd | ගම්‍යතාවයේ වෙනස් වීමේ ශීඝ්‍රතාව යෙදූ බලයට සමානුපාතික වේ | $F = ma$ |
| 3rd | සෑම ක්‍රියාවකටම සමාන හා ප්‍රතිවිරුද්ධ ප්‍රතික්‍රියාවක් ඇත | Action–reaction pairs |

### Second law in full

$$F = \\frac{\\Delta p}{\\Delta t} = \\frac{m(v - u)}{t} = ma$$

### Worked example

\`\`\`text
Given:  m = 2.0 kg,  u = 0,  v = 6.0 m s^-1,  t = 3.0 s
a = (v - u) / t = (6.0 - 0) / 3.0 = 2.0 m s^-2
F = m × a = 2.0 × 2.0 = 4.0 N
\`\`\`

> Common mistake: ක්‍රියාව සහ ප්‍රතික්‍රියාව එකම වස්තුව මත ක්‍රියා නොකරයි — ඒවා **වෙනස් වස්තු දෙකක්** මත ක්‍රියා කරයි.`,

  photosynthesis: `## ප්‍රභාසංශ්ලේෂණය — කෙටි සටහන් (Photosynthesis)

ප්‍රභාසංශ්ලේෂණය යනු හරිත ශාක ආලෝක ශක්තිය භාවිතයෙන් $CO_2$ සහ $H_2O$ වලින් ග්ලූකෝස් නිපදවන ක්‍රියාවලියයි.

$$6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2$$

### අදියර දෙක

| අදියර | ස්ථානය | ප්‍රධාන ප්‍රතිඵල |
|---|---|---|
| ආලෝක ප්‍රතික්‍රියා (Light-dependent) | තයිලකොයිඩ පටල | ATP, NADPH, $O_2$ |
| කැල්වින් චක්‍රය (Light-independent) | ස්ට්‍රෝමාව | ග්ලූකෝස් ($C_6H_{12}O_6$) |

### මතක තබා ගන්න
- ක්ලෝරෝෆිල් **රතු සහ නිල්** ආලෝකය වැඩිපුරම අවශෝෂණය කරයි
- $O_2$ පැමිණෙන්නේ ජලයේ ප්‍රභා විච්ඡේදනයෙනි (photolysis), $CO_2$ වලින් නොවේ
- Limiting factors: ආලෝක තීව්‍රතාව, $CO_2$ සාන්ද්‍රණය, උෂ්ණත්වය

> Exam tip: Structured questions වල "photolysis of water" යන පදය අනිවාර්යයෙන් ලියන්න — ලකුණු ලැබෙන්නේ එයටයි.`,

  practice: `## Mole concept — Practice questions

Here are 3 exam-style questions with answers. Try each one before reading the answer.

**1.** ජලය 9.0 g ක ඇති මවුල ගණන කීයද? ($H_2O$ = 18 g mol⁻¹)

- (1) 0.25 mol
- (2) 0.50 mol
- (3) 1.0 mol
- (4) 2.0 mol

**පිළිතුර: (2)** — $n = \\frac{m}{M} = \\frac{9.0}{18} = 0.50$ mol

**2.** 0.10 mol dm⁻³ NaOH 25.0 cm³ ක් උදාසීන කිරීමට අවශ්‍ය 0.050 mol dm⁻³ $H_2SO_4$ පරිමාව කොපමණද?

$$H_2SO_4 + 2NaOH \\rightarrow Na_2SO_4 + 2H_2O$$

- (1) 12.5 cm³
- (2) 25.0 cm³
- (3) 50.0 cm³
- (4) 100 cm³

**පිළිතුර: (2)** — $n(NaOH) = 2.5 \\times 10^{-3}$ mol, so $n(H_2SO_4) = 1.25 \\times 10^{-3}$ mol and $V = 25.0$ cm³

### Structured question

**3.** Avogadro නියතය ($N_A$) අර්ථ දක්වා, $CO_2$ 4.4 g ක ඇති ඔක්සිජන් පරමාණු ගණන ගණනය කරන්න.

> Marking scheme: definition (2 marks), $n = 0.10$ mol (1 mark), $2 \\times 0.10 \\times 6.022 \\times 10^{23} = 1.2 \\times 10^{23}$ atoms (2 marks)`,

  general: `Great question. Here's how I'd break this topic down for A/L revision.

### 1. මූලික අදහස (Core idea)
පළමුව සංකල්පය සරල සිංහලෙන් තේරුම් ගන්න — එදිනෙදා උදාහරණයක් සමඟ. ඉන්පසු විභාගයේ භාවිතා වන **English technical terms** එයට සම්බන්ධ කරන්න.

### 2. Key definitions
- Structured questions සඳහා නිර්වචන **වචනයෙන් වචනය** මතක තබා ගන්න
- එක් එක් රාශියේ SI ඒකක සහ මාන ලියා තබන්න

### 3. Practice
1. පසුගිය විභාග ප්‍රශ්න 3–5 ක් කාලය මැන කරන්න
2. Marking scheme සමඟ ඔබේ පිළිතුරු සසඳන්න
3. වැරදුණු කොටස් **My Learning Twin** වෙත සටහන් කරන්න

> Tip: Choose a subject above the message box and ask about a specific lesson — for example "Le Chatelier's principle" — for a detailed, syllabus-aligned explanation.`
};

export type MockResponseKey = keyof typeof mockResponses;