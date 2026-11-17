import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  Bolt,
  BookOpen,
  Briefcase,
  EyeOff,
  Footprints,
  ForkKnife,
  Globe,
  Grid3x3,
  Heart,
  House,
  Leaf,
  Lightbulb,
  MessageCircle,
  Paintbrush,
  Quote,
  Scale,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";

/**
 * Map SF Symbol names from the seed / mobile app onto Lucide icons.
 * Unknown icons fall back to BookOpen.
 */
const SF_TO_LUCIDE: Record<string, LucideIcon> = {
  "book.fill": BookOpen,
  "scalemass.fill": Scale,
  "heart.fill": Heart,
  "person.fill": User,
  "bubble.left.fill": MessageCircle,
  "arrow.2.squarepath": ArrowLeftRight,
  "lightbulb.fill": Lightbulb,
  "leaf.fill": Leaf,
  "fork.knife": ForkKnife,
  "heart.text.square.fill": Heart,
  "house.fill": House,
  "briefcase.fill": Briefcase,
  "paintbrush.fill": Paintbrush,
  "figure.walk": Footprints,
  "person.2.fill": Users,
  "banknote.fill": Banknote,
  "shield.fill": Shield,
  "globe.americas.fill": Globe,
  "eye.slash.fill": EyeOff,
  sparkles: Sparkles,
  "text.quote": Quote,
  "bolt.fill": Bolt,
  "square.grid.3x3.fill": Grid3x3,
  // Lucide ids used by the web create flow
  book: BookOpen,
  scale: Scale,
  heart: Heart,
  user: User,
  message: MessageCircle,
  leaf: Leaf,
  house: House,
  briefcase: Briefcase,
  bolt: Bolt,
  globe: Globe,
  shield: Shield,
};

export const CREATE_ICONS = [
  "book",
  "scale",
  "heart",
  "user",
  "message",
  "leaf",
  "house",
  "briefcase",
  "sparkles",
  "bolt",
  "globe",
  "shield",
] as const;

export type CreateIconId = (typeof CREATE_ICONS)[number];

export function resolveListIcon(icon: string): LucideIcon {
  return SF_TO_LUCIDE[icon] ?? BookOpen;
}
