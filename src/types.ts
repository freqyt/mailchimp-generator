export interface Product {
  id: string;
  name: string;
  description: string;
  useIcon?: boolean;
  iconName?: string;
  imageUrl: string;
  price: string;
  link: string;
  buttonText?: string;
}

export interface EmailData {
  title: string;
  intro: string;
  headerImageUrl: string;
  products: Product[];
  footerText: string;
  transparentCards?: boolean;
}
