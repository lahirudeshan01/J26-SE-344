import type { LucideIcon } from 'lucide-react';
import { Atom, FlaskConical } from 'lucide-react';
import type { LabStringKey } from '../../../shared/i18n/skillsTrainerStrings';
import type { Language } from '../../../shared/types/index';

export type LabSubject = 'physics' | 'chemistry';

export interface PracticalDef {
  id: string;
  subject: LabSubject;
  title: Record<Language, string>;
  available: boolean;
}

export const subjects: { id: LabSubject; labelKey: LabStringKey; icon: LucideIcon }[] = [
{ id: 'physics', labelKey: 'physics', icon: Atom },
{ id: 'chemistry', labelKey: 'chemistry', icon: FlaskConical }];

const p = (id: string, subject: LabSubject, en: string, si: string, available = false): PracticalDef => ({
  id,
  subject,
  title: { en, si },
  available
});

export const practicals: PracticalDef[] = [
p('moments', 'physics', 'Determination of the mass of a body using the principle of moments', 'සූර්ණ පිළිබඳ මූලධර්මය භාවිතයෙන් වස්තුවක ස්කන්ධය නිර්ණය කිරීම', true),
p('vernier', 'physics', 'Measurements using the Vernier calipers', 'වර්නියර් කැලිපරයක් භාවිතයෙන් මිනුම් ලබා ගැනීම'),
p('micrometer', 'physics', 'Measurements using the micrometer screw-gauge', 'මයික්‍රමීටර ස්කුරුප්පු ඇබිනීමක් භාවිතයෙන් මිනුම් ලබා ගැනීම'),
p('refractive-index', 'physics', 'Determination of the refractive index of glass using a traveling microscope', 'සංචාරක අන්වීක්ෂයක් භාවිතයෙන් වීදුරු තැටියක වර්තනාංකය නිර්ණය කිරීම'),
p('latent-heat', 'physics', 'Determination of the specific latent heat of fusion of ice by the method of mixtures', 'මිශ්‍රණ ක්‍රමයෙන් අයිස් ද්‍රාව්‍ය වීමේ විශිෂ්ට ගුප්ත තාපය නිර්ණය කිරීම'),
p('internal-resistance', 'physics', 'Determination of the internal resistance and the electromotive force of a dry cell', 'වියළි කෝෂයක විද්‍යුත් ගාමක බලය සහ අභ්‍යන්තර ප්‍රතිරෝධය නිර්ණය කිරීම'),
p('metre-bridge', 'physics', 'Determination of two resistances using the metre bridge', 'මීටර පාලම භාවිතයෙන් ප්‍රතිරෝධ දෙකක් නිර්ණය කිරීම'),
p('potentiometer', 'physics', 'Comparison of electromotive forces using the potentiometer', 'විභවමාපියක් භාවිතයෙන් විද්‍යුත් ගාමක බල සංසන්දනය කිරීම'),
p('resonance-tube', 'physics', 'Determination of the velocity of sound in air using a closed resonance tube', 'සංවෘත අනුනාද නළයක් භාවිතයෙන් වාතයේ ශබ්දයේ ප්‍රවේගය නිර්ණය කිරීම'),
p('diode-iv', 'physics', 'Construction of the I-V characteristic curve of a semiconductor diode', 'අර්ධ සන්නායක ඩයෝඩයක I-V ලක්ෂණ වක්‍රය ඇඳීම'),
p('logic-gates', 'physics', 'Investigation of the truth tables of simple logic gates', 'සරල තර්ක දොරටුවල සත්‍යතා වගු පරීක්ෂා කිරීම'),

p('standard-solution', 'chemistry', 'Preparation of a standard solution', 'ප්‍රමිති ද්‍රාවණයක් සකස් කිරීම'),
p('acid-base', 'chemistry', 'Acid-base titrations', 'අම්ල-භෂ්ම පරිමාමිතික විශ්ලේෂණය'),
p('redox', 'chemistry', 'Redox titrations (Permanganate/Iodometric titrations)', 'රෙඩොක්ස් පරිමාමිතික විශ්ලේෂණය (පර්මැන්ගනේට් / අයඩොමිතික පරීක්ෂණ)'),
p('salt-analysis', 'chemistry', 'Qualitative analysis of inorganic salts (Identification of cations and anions)', 'අකාබනික ලවණවල ගුණාත්මක විශ්ලේෂණය (කැටායන සහ ඇනායන හඳුනාගැනීම)'),
p('neutralization', 'chemistry', 'Determination of enthalpy change of neutralization', 'උදාසීනීකරණ එන්තල්පි වෙනස්වීම නිර්ණය කිරීම'),
p('reaction-rate', 'chemistry', 'Determination of the rate of a chemical reaction', 'රසායනික ප්‍රතික්‍රියාවක වේගය නිර්ණය කිරීම'),
p('functional-groups', 'chemistry', 'Detection of functional groups in organic compounds', 'කාබනික සංයෝගවල ක්‍රියාකාරී කාණ්ඩ හඳුනාගැනීමේ පරීක්ෂණ')];
