import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Layers, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getLevelDisplay } from '@/lib/technologyGlossary';

// Technology comparison data
const technologyComparisonData = [
  { tech: 'FDM', category: 'Polymer', strength: 3, detail: 2, speed: 3, price: '€', priceValue: 1, materials: 'Many' },
  { tech: 'SLA', category: 'Resin', strength: 2, detail: 5, speed: 2, price: '€€', priceValue: 2, materials: 'Resin' },
  { tech: 'DLP', category: 'Resin', strength: 2, detail: 5, speed: 3, price: '€€', priceValue: 2, materials: 'Resin' },
  { tech: 'SLS', category: 'Polymer', strength: 4, detail: 3, speed: 3, price: '€€', priceValue: 2, materials: 'Nylon' },
  { tech: 'MJF', category: 'Polymer', strength: 4, detail: 3, speed: 4, price: '€€', priceValue: 2, materials: 'Nylon' },
  { tech: 'SAF', category: 'Polymer', strength: 4, detail: 3, speed: 4, price: '€€', priceValue: 2, materials: 'Nylon' },
  { tech: 'PolyJet', category: 'Resin', strength: 2, detail: 5, speed: 2, price: '€€€', priceValue: 3, materials: 'Multi' },
  { tech: 'DMLS', category: 'Metal', strength: 5, detail: 3, speed: 1, price: '€€€€', priceValue: 4, materials: 'Metal' },
  { tech: 'SLM', category: 'Metal', strength: 5, detail: 3, speed: 1, price: '€€€€', priceValue: 4, materials: 'Metal' },
  { tech: 'EBM', category: 'Metal', strength: 5, detail: 2, speed: 2, price: '€€€€', priceValue: 4, materials: 'Metal' },
];

type SortField = 'tech' | 'category' | 'strength' | 'detail' | 'speed' | 'priceValue';
type SortDirection = 'asc' | 'desc';

const categories = [...new Set(technologyComparisonData.map(t => t.category))];

const sortFieldLabels: Record<SortField, string> = {
  tech: 'Technology',
  category: 'Category',
  strength: 'Strength',
  detail: 'Detail',
  speed: 'Speed',
  priceValue: 'Price',
};

export function TechnologyComparisonTable() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('tech');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [minDetail, setMinDetail] = useState<number>(0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...technologyComparisonData];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(t => 
        t.tech.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.materials.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      data = data.filter(t => t.category === categoryFilter);
    }

    // Apply minimum detail filter
    if (minDetail > 0) {
      data = data.filter(t => t.detail >= minDetail);
    }

    // Apply sorting
    data.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return data;
  }, [searchQuery, categoryFilter, sortField, sortDirection, minDetail]);

  const SortHeader = ({ field, children, align = 'center' }: { field: SortField; children: React.ReactNode; align?: 'left' | 'center' }) => (
    <th 
      className={`py-3 px-2 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none ${align === 'left' ? 'text-left' : 'text-center'}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );

  const hasActiveFilters = searchQuery.trim() !== '' || categoryFilter !== 'all' || minDetail > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMinDetail(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Technology Comparison
        </CardTitle>
        <CardDescription>
          Compare printing technologies side by side - click column headers to sort
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minDetail.toString()} onValueChange={(v) => setMinDetail(parseInt(v))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Min. detail" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All detail levels</SelectItem>
              <SelectItem value="3">Detail ≥ 3</SelectItem>
              <SelectItem value="4">Detail ≥ 4</SelectItem>
              <SelectItem value="5">Detail = 5</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredAndSortedData.length} of {technologyComparisonData.length} technologies
          </div>
        </div>

        {/* Active sort indicator */}
        {sortField !== 'tech' && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-muted-foreground">Sorted by:</span>
            <Badge variant="secondary" className="gap-1">
              {sortFieldLabels[sortField]}
              {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </Badge>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <SortHeader field="tech" align="left">Technology</SortHeader>
                <SortHeader field="category" align="left">Category</SortHeader>
                <SortHeader field="strength">Strength</SortHeader>
                <SortHeader field="detail">Detail</SortHeader>
                <SortHeader field="speed">Speed</SortHeader>
                <SortHeader field="priceValue">Price</SortHeader>
                <th className="text-center py-3 px-2 font-medium">Materials</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No technologies match your filters
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((row) => (
                  <tr key={row.tech} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{row.tech}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-xs">
                        {row.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.strength)}</td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.detail)}</td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.speed)}</td>
                    <td className="py-3 px-2 text-center">{row.price}</td>
                    <td className="py-3 px-2 text-center text-muted-foreground">{row.materials}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
