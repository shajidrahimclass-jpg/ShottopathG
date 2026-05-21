import { HelmetProvider, Helmet } from "react-helmet-async";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import type { Product } from "@/types";

const PageMeta = ({
  title,
  description,
  image,
  product,
}: {
  title: string;
  description?: string;
  image?: string;
  product?: Product;
}) => {
  const { appSettings } = useAppSettings();
  
  // Use product meta if available, otherwise use provided values, then fallback to defaults
  const metaDescription = product?.meta_description || description || appSettings?.site_description || 'Shottopoth - Your trusted e-commerce platform';
  const metaImage = product?.meta_image || image || appSettings?.default_meta_image || '';
  const metaTitle = product ? `${product.name} - ${appSettings?.site_title || 'Shottopoth'}` : title;
  
  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={product ? 'product' : 'website'} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      {metaImage && <meta property="og:image" content={metaImage} />}
      {metaImage && <meta property="og:image:width" content="1200" />}
      {metaImage && <meta property="og:image:height" content="630" />}
      {product && <meta property="product:price:amount" content={product.price.toString()} />}
      {product && <meta property="product:price:currency" content="BDT" />}
      
      {/* Twitter */}
      <meta name="twitter:card" content={metaImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {metaImage && <meta name="twitter:image" content={metaImage} />}
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
