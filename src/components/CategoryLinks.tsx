import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface CategoryLink {
  slug: string;
  label: string;
  type?: string;
}

interface CategoryLinksProps {
  links: CategoryLink[];
  title?: string;
  className?: string;
}

const CategoryLinks: React.FC<CategoryLinksProps> = ({ links, title = 'Related Categories', className = '' }) => {
  if (!links.length) return null;

  return (
    <section className={`py-8 ${className}`}>
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map(({ slug, label, type }) => (
          <Link key={slug} to={`/suppliers/${slug}`}>
            <Badge
              variant={type === 'technology' ? 'secondary' : type === 'material' ? 'outline' : 'default'}
              className="text-sm px-3 py-1.5 hover:scale-105 transition-transform cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryLinks;
