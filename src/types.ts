export interface Product {
  id: string;
  name: string;
  description: string;
  useIcon?: boolean;
  iconName?: string;
  iconColor?: string;
  imageUrl: string;
  price: string;
  link: string;
  buttonText?: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  date: string;
}

export interface EmailData {
  title: string;
  intro: string;
  headerImageUrl: string;
  headerImageSize?: number;
  products: Product[];
  footerText: string;
  transparentCards?: boolean;
  hideIconCircle?: boolean;
  socialLinks?: SocialLink[];
}
