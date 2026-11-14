import {BookOpen, Bike, BriefcaseBusiness, Building2, Clock, HeartHandshake, House, KeyRound, Landmark, MessageCircle, Music, Pill, Scale, Stethoscope, TrainFront, Trees, Users, Utensils, Wallet, type LucideIcon} from 'lucide-react';

// Theme icons by the Lucide names used in learning-model.js; a fallback for themes added by forks.
const icons: Record<string, LucideIcon> = {
  'book-open': BookOpen, bike: Bike, 'briefcase-business': BriefcaseBusiness, 'building-2': Building2, clock: Clock,
  'heart-handshake': HeartHandshake, house: House, 'key-round': KeyRound, landmark: Landmark, 'message-circle': MessageCircle,
  music: Music, pill: Pill, scale: Scale, stethoscope: Stethoscope, 'train-front': TrainFront, trees: Trees, users: Users,
  utensils: Utensils, wallet: Wallet,
};
export const themeIcon = (name: string): LucideIcon => icons[name] ?? BookOpen;
