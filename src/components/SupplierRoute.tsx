import { lazy } from 'react';
import { useParams } from 'react-router-dom';
import { isCategorySlug } from '@/lib/seoSlugs';

const SupplierCategory = lazy(() => import('@/pages/SupplierCategory'));
const SupplierDetail = lazy(() => import('@/pages/SupplierDetail'));

/**
 * Router wrapper that checks if the slug is a known category slug
 * and renders either SupplierCategory or SupplierDetail accordingly.
 */
const SupplierRoute = () => {
  const { slug } = useParams<{ slug: string }>();

  if (slug && isCategorySlug(slug)) {
    return <SupplierCategory />;
  }

  return <SupplierDetail />;
};

export default SupplierRoute;
