import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getLevelDisplay } from '@/lib/technologyGlossary';
import { Beaker } from 'lucide-react';

// Material comparison data
const materialComparisonData = [
  { material: 'PLA', category: 'Polymer', strength: 2, flexibility: 1, heatResist: 1, chemResist: 2, price: '€', priceValue: 1 },
  { material: 'ABS', category: 'Polymer', strength: 3, flexibility: 2, heatResist: 3, chemResist: 3, price: '€', priceValue: 1 },
  { material: 'PETG', category: 'Polymer', strength: 3, flexibility: 2, heatResist: 2, chemResist: 3, price: '€', priceValue: 1 },
  { material: 'Nylon PA-12', category: 'Polymer', strength: 4, flexibility: 3, heatResist: 3, chemResist: 4, price: '€€', priceValue: 2 },
  { material: 'TPU', category: 'Elastomer', strength: 2, flexibility: 5, heatResist: 2, chemResist: 3, price: '€€', priceValue: 2 },
  { material: 'PEEK', category: 'High-Performance', strength: 5, flexibility: 1, heatResist: 5, chemResist: 5, price: '€€€€', priceValue: 4 },
  { material: 'Standard Resin', category: 'Photopolymer', strength: 2, flexibility: 1, heatResist: 1, chemResist: 2, price: '€€', priceValue: 2 },
  { material: 'Tough Resin', category: 'Photopolymer', strength: 3, flexibility: 2, heatResist: 2, chemResist: 2, price: '€€', priceValue: 2 },
  { material: 'Titanium', category: 'Metal', strength: 5, flexibility: 1, heatResist: 5, chemResist: 5, price: '€€€€', priceValue: 4 },
  { material: 'Aluminum', category: 'Metal', strength: 4, flexibility: 1, heatResist: 4, chemResist: 3, price: '€€€', priceValue: 3 },
  { material: 'Stainless Steel', category: 'Metal', strength: 5, flexibility: 1, heatResist: 4, chemResist: 4, price: '€€€', priceValue: 3 },
  { material: 'Cobalt Chrome', category: 'Superalloy', strength: 5, flexibility: 1, heatResist: 5, chemResist: 5, price: '€€€€', priceValue: 4 },
];

type SortField = 'material' | 'category' | 'strength' | 'flexibility' | 'heatResist' | 'chemResist' | 'priceValue';
type SortDirection = 'asc' | 'desc';

const categories = [...new Set(materialComparisonData.map(m => m.category))];

const sortFieldLabels: Record<SortField, string> = {
  material: 'Material',
  category: 'Category',
  strength: 'Strength',
  flexibility: 'Flexibility',
  heatResist: 'Heat',
  chemResist: 'Chemical',
  priceValue: 'Price',
};

export function MaterialComparisonTable() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('material');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [minStrength, setMinStrength] = useState<number>(0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...materialComparisonData];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(m => 
        m.material.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      data = data.filter(m => m.category === categoryFilter);
    }

    // Apply minimum strength filter
    if (minStrength > 0) {
      data = data.filter(m => m.strength >= minStrength);
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
  }, [searchQuery, categoryFilter, sortField, sortDirection, minStrength]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="py-3 px-2 font-medium cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
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

  const hasActiveFilters = searchQuery.trim() !== '' || categoryFilter !== 'all' || minStrength > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMinStrength(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          Material Comparison
        </CardTitle>
        <CardDescription>
          Compare material properties side by side - click column headers to sort
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search material..."
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
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minStrength.toString()} onValueChange={(v) => setMinStrength(parseInt(v))}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Min. strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All strength levels</SelectItem>
              <SelectItem value="3">Strength ≥ 3</SelectItem>
              <SelectItem value="4">Strength ≥ 4</SelectItem>
              <SelectItem value="5">Strength = 5</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredAndSortedData.length} of {materialComparisonData.length} materials
          </div>
        </div>

        {/* Active sort indicator */}
        {sortField !== 'material' && (
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
                <th 
                  className="text-left py-3 px-2 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('material')}
                >
                  <div className="flex items-center gap-1">
                    Material
                    {sortField === 'material' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === 'category' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
                <SortHeader field="strength">Strength</SortHeader>
                <SortHeader field="flexibility">Flexibility</SortHeader>
                <SortHeader field="heatResist">Heat</SortHeader>
                <SortHeader field="chemResist">Chemical</SortHeader>
                <SortHeader field="priceValue">Price</SortHeader>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No materials match your filters
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((row) => (
                  <tr key={row.material} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{row.material}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-xs">
                        {row.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.strength)}</td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.flexibility)}</td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.heatResist)}</td>
                    <td className="py-3 px-2 text-center">{getLevelDisplay(row.chemResist)}</td>
                    <td className="py-3 px-2 text-center">{row.price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Strength:</span> Mechanical strength
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Flexibility:</span> Bendability
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Heat:</span> Temperature resistance
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Chemical:</span> Chemical resistance
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
