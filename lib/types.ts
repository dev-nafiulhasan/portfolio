export type Link = { label: string; url: string };

export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  cover: string;
  gallery: string[];
  year: string;
  client: string;
  role: string;
  liveUrl: string;
  body: string;
  published: boolean;
};

export type Review = { id: string; quote: string; author: string; company: string };
export type Fact = { label: string; value: string };
export type Point = { title: string; text: string };
export type Skill = { name: string; note: string };
export type Service = { name: string; line: string; price: string; duration: string };

export type Settings = {
  firstName: string;
  lastName: string;
  role: string;
  note: string;
  status: string;
  accent: string;
  email: string;
  location: string;
  ctaLabel: string;
  ctaUrl: string;
  socials: Link[];
  seoTitle: string;
  seoDescription: string;
  showPreloader: boolean;
};

export type SiteContent = {
  settings: Settings;
  projects: Project[];
  skillsIntro: string;
  skills: Skill[];
  reviewsIntro: string;
  reviews: Review[];
  about: { body: string; portrait: string; facts: Fact[] };
  approachIntro: string;
  approach: Point[];
  servicesIntro: string;
  services: Service[];
  contact: { heading: string; text: string; reply: string };
};
