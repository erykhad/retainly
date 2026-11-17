export type Language = "english" | "polish";

export type List = {
  slug: string;
  name: string;
  notes: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  /**
   * mapping to word slugs
   */
  words: string[];
};

export type Word = {
  slug: string;
  name: string;
  notes: string;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  /**
   * mapping to word slugs
   */
  translations: string[];
};
