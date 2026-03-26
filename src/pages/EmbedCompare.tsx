import { useSearchParams } from 'react-router-dom';
import { TECHNOLOGY_GLOSSARY } from '@/lib/technologyGlossary';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';

const priceLabels: Record<string, string> = {
  low: '€',
  medium: '€€',
  high: '€€€',
  'very-high': '€€€€',
};

export default function EmbedCompare() {
  const [params] = useSearchParams();
  const techKeys = (params.get('tech') || 'SLA,SLS,FDM').split(',').map(t => t.trim());

  const techs = techKeys
    .map(key => TECHNOLOGY_GLOSSARY[key])
    .filter(Boolean);

  if (techs.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No technologies found. Use ?tech=SLA,SLS</div>;
  }

  return (
    <div className="bg-background text-foreground p-4 max-w-full" style={{ maxHeight: 500, overflow: 'auto' }}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Technology</TableHead>
            <TableHead className="text-xs text-center">Strength</TableHead>
            <TableHead className="text-xs text-center">Detail</TableHead>
            <TableHead className="text-xs text-center">Speed</TableHead>
            <TableHead className="text-xs text-center">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {techs.map(tech => (
            <TableRow key={tech.abbreviation}>
              <TableCell>
                <div>
                  <span className="font-medium text-sm">{tech.abbreviation}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{tech.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <RatingDots value={tech.strengthLevel} />
              </TableCell>
              <TableCell className="text-center">
                <RatingDots value={tech.detailLevel} />
              </TableCell>
              <TableCell className="text-center">
                <RatingDots value={tech.speedLevel} />
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="text-xs">{priceLabels[tech.priceRange] || tech.priceRange}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Powered by AMSupplyCheck
        </span>
        <a
          href="https://amsupplycheck.com/search"
          target="_blank"
          rel="noopener"
          className="text-xs text-primary hover:underline"
        >
          Compare 200+ verified suppliers →
        </a>
      </div>
    </div>
  );
}

function RatingDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i <= value ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  );
}
