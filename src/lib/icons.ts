import {BookOpen, Bike, CloudSun, FileText, GraduationCap, Heart, Languages, Mail, PartyPopper, School, Shirt, ShoppingCart, Siren, Sparkles, BriefcaseBusiness, Building2, Clock, HeartHandshake, House, KeyRound, Landmark, MessageCircle, Music, Pill, Scale, Stethoscope, TrainFront, Trees, Users, Utensils, Wallet, type LucideIcon} from 'lucide-react';

// Theme icons by the Lucide names used in learning-model.js; a fallback for themes added by forks.
const icons: Record<string, LucideIcon> = {
  'book-open': BookOpen, bike: Bike, 'briefcase-business': BriefcaseBusiness, 'building-2': Building2, clock: Clock,
  'heart-handshake': HeartHandshake, house: House, 'key-round': KeyRound, landmark: Landmark, 'message-circle': MessageCircle,
  music: Music, pill: Pill, scale: Scale, stethoscope: Stethoscope, 'train-front': TrainFront, trees: Trees, users: Users,
  utensils: Utensils, wallet: Wallet,
  'shopping-cart': ShoppingCart, school: School, 'cloud-sun': CloudSun, shirt: Shirt, 'party-popper': PartyPopper, mail: Mail,
  'file-text': FileText, sparkles: Sparkles, siren: Siren, heart: Heart, languages: Languages, 'graduation-cap': GraduationCap,
};
export const themeIcon = (name: string): LucideIcon => icons[name] ?? BookOpen;
