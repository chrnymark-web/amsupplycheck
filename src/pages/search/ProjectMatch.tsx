import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Package, MapPin, Award, Target, Loader2, ExternalLink, CheckCircle2, Factory, Cog, Paintbrush, Ruler, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useTriggerSupplierMatch } from '@/hooks/use-trigger-supplier-match';
import { SearchProgress } from '@/components/search/SearchProgress';
import type { ProjectRequirements, MatchResult } from '@/hooks/use-supplier-matching';
import SupplierLogo from '@/components/ui/supplier-logo';
import {
  APPLICATION_TYPES,
  INDUSTRIES,
  MECHANICAL_REQUIREMENTS,
  SURFACE_REQUIREMENTS,
  PART_SIZES,
  CERTIFICATIONS,
} from '@/lib/requirementsTechnologyMapping';

const REGIONS = [
  { value: '', label: 'No preference' },
  { value: 'Scandinavia', label: 'Scandinavia' },
  { value: 'Western Europe', label: 'Western Europe' },
  { value: 'Central Europe', label: 'Central Europe' },
  { value: 'UK & Ireland', label: 'UK & Ireland' },
  { value: 'North America', label: 'North America' },
  { value: 'Asia Pacific', label: 'Asia Pacific' },
  { value: 'Global', label: 'Global' },
];

const QUANTITIES = [
  { value: '', label: 'Select quantity' },
  { value: '1-10', label: '1-10 pcs (Prototype)' },
  { value: '10-100', label: '10-100 pcs (Small batch)' },
  { value: '100-1000', label: '100-1,000 pcs (Production)' },
  { value: '1000+', label: '1,000+ pcs (Large production)' },
];

function MatchCard({ match, rank }: { match: MatchResult; rank: number }) {
  const { supplier, score, matchDetails } = match;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      {/* Rank badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rank === 1 ? 'bg-yellow-400 text-yellow-900' :
          rank === 2 ? 'bg-gray-300 text-gray-700' :
          rank === 3 ? 'bg-orange-400 text-orange-900' :
          'bg-muted text-muted-foreground'
        }`}>
          {rank}
        </div>
      </div>

      {/* Score badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant={score >= 70 ? 'default' : score >= 50 ? 'secondary' : 'outline'} className="text-sm font-semibold">
          {score}% match
        </Badge>
      </div>

      <CardHeader className="pt-12">
        <div className="flex items-start gap-4">
          <SupplierLogo 
            logoUrl={supplier.logo_url} 
            name={supplier.name} 
            size="md"
          />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{supplier.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {supplier.location_city && `${supplier.location_city}, `}
              {supplier.location_country || supplier.region}
            </CardDescription>
          </div>
        </div>

        {/* Verification badges */}
        <div className="flex gap-2 mt-3">
          {supplier.verified && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {supplier.premium && (
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
              <Award className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Explanation */}
        {matchDetails.overallExplanation && (
          <p className="text-sm text-muted-foreground italic">
            "{matchDetails.overallExplanation}"
          </p>
        )}

        {/* Score breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Technology</span>
            <span className="font-medium">{matchDetails.technologyScore}%</span>
          </div>
          <Progress value={matchDetails.technologyScore} className="h-1.5" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Material</span>
            <span className="font-medium">{matchDetails.materialScore}%</span>
          </div>
          <Progress value={matchDetails.materialScore} className="h-1.5" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">{matchDetails.locationScore}%</span>
          </div>
          <Progress value={matchDetails.locationScore} className="h-1.5" />

          {matchDetails.certificationScore !== undefined && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Certification</span>
                <span className="font-medium">{matchDetails.certificationScore}%</span>
              </div>
              <Progress value={matchDetails.certificationScore} className="h-1.5" />
            </>
          )}
        </div>

        {/* Matched capabilities */}
        <div className="space-y-2">
          {matchDetails.matchedTechnologies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchDetails.matchedTechnologies.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
          {matchDetails.matchedMaterials.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchDetails.matchedMaterials.slice(0, 3).map((mat) => (
                <Badge key={mat} variant="outline" className="text-xs">
                  {mat}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`/suppliers/${supplier.supplier_id}`}>
              View profile
            </a>
          </Button>
          {supplier.website && (
            <Button size="sm" className="flex-1" asChild>
              <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                Visit <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Multi-select chip component
function ChipSelect({ 
  options, 
  selected, 
  onChange, 
  label,
  icon: Icon
}: { 
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
  icon?: React.ElementType;
}) {
  const toggleValue = (value: string) => {
    if (value === 'none') {
      onChange(['none']);
    } else if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected.filter(v => v !== 'none'), value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selected.includes(option.value)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProjectMatch() {
  const navigate = useNavigate();
  const { isLoading, error, result, triggerMatch, status, reset } = useTriggerSupplierMatch();
  
  const [formData, setFormData] = useState<ProjectRequirements>({
    description: '',
    quantity: '',
    preferredRegion: '',
    applicationType: '',
    industry: '',
    mechanicalRequirements: [],
    surfaceFinish: '',
    partSize: '',
    certificationsNeeded: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;
    await triggerMatch(formData);
  };

  const handleReset = () => {
    reset();
    setFormData({
      description: '',
      quantity: '',
      preferredRegion: '',
      applicationType: '',
      industry: '',
      mechanicalRequirements: [],
      surfaceFinish: '',
      partSize: '',
      certificationsNeeded: [],
    });
  };

  return (
    <>
      <Helmet>
        <title>Project Matching | AMSupplyCheck</title>
        <meta name="description" content="Describe your 3D printing project and get supplier recommendations tailored to your specific requirements." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://amsupplycheck.com/match" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Project Matching
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tell us about your needs — we'll find the right suppliers
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {!result ? (
            /* Form */
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Describe your project
                  </CardTitle>
                  <CardDescription>
                    You don't need to know technologies — just describe what you need and we'll find the right match
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Project description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Project description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what you need, e.g.: 'I need a durable enclosure for outdoor electronics that can withstand heat and rain. The part should have a smooth finish and be produced in quantities of around 500 units.'"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    {/* Application type & Industry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="application" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Application type
                        </Label>
                        <Select
                          value={formData.applicationType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, applicationType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="What is this part for?" />
                          </SelectTrigger>
                          <SelectContent>
                            {APPLICATION_TYPES.map((a) => (
                              <SelectItem key={a.value} value={a.value}>
                                {a.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry" className="flex items-center gap-2">
                          <Factory className="h-4 w-4" />
                          Industry
                        </Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map((i) => (
                              <SelectItem key={i.value} value={i.value}>
                                {i.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Mechanical requirements (multi-select chips) */}
                    <ChipSelect
                      options={MECHANICAL_REQUIREMENTS}
                      selected={formData.mechanicalRequirements || []}
                      onChange={(values) => setFormData(prev => ({ ...prev, mechanicalRequirements: values }))}
                      label="Mechanical requirements"
                      icon={Cog}
                    />

                    {/* Surface finish & Part size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="surface" className="flex items-center gap-2">
                          <Paintbrush className="h-4 w-4" />
                          Surface finish
                        </Label>
                        <Select
                          value={formData.surfaceFinish}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, surfaceFinish: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select finish level" />
                          </SelectTrigger>
                          <SelectContent>
                            {SURFACE_REQUIREMENTS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="size" className="flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          Part size
                        </Label>
                        <Select
                          value={formData.partSize}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, partSize: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select approximate size" />
                          </SelectTrigger>
                          <SelectContent>
                            {PART_SIZES.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quantity & Region */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Quantity
                        </Label>
                        <Select
                          value={formData.quantity}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select quantity" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUANTITIES.map((q) => (
                              <SelectItem key={q.value} value={q.value || 'none'}>
                                {q.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Preferred region
                        </Label>
                        <Select
                          value={formData.preferredRegion}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, preferredRegion: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value || 'none'}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Required certifications (multi-select chips) */}
                    <ChipSelect
                      options={CERTIFICATIONS}
                      selected={formData.certificationsNeeded || []}
                      onChange={(values) => setFormData(prev => ({ ...prev, certificationsNeeded: values }))}
                      label="Required certifications"
                      icon={Shield}
                    />

                    {error && (
                      <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                        {error}
                      </div>
                    )}

                    {isLoading && <SearchProgress status={status} />}

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading || !formData.description.trim()}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Find suppliers
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Results */
            <div className="space-y-8">
              {/* AI Technology Rationale - NEW */}
              {result.technologyRationale && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  <div>
                      <h3 className="font-semibold text-lg">Recommended technology</h3>
                      <p className="text-sm text-muted-foreground">Based on your requirements, we recommend:</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground mb-4 italic">
                    "{result.technologyRationale.whyTheseTechnologies}"
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recommended technologies:</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {result.technologyRationale.recommendedTechnologies?.map((tech) => (
                          <Badge key={tech} variant="secondary">{tech}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{result.technologyRationale.technologyExplanation}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recommended materials:</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {result.technologyRationale.recommendedMaterials?.map((mat) => (
                          <Badge key={mat} variant="outline">{mat}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{result.technologyRationale.materialExplanation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">
                      {result.matches.length} suppliers match your project
                    </h2>
                    <p className="text-muted-foreground">
                      {result.requirements.projectSummary}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {result.requirements.requiredTechnologies?.map((tech) => (
                        <Badge key={tech} variant="secondary">{tech}</Badge>
                      ))}
                      {result.requirements.requiredMaterials?.map((mat) => (
                        <Badge key={mat} variant="outline">{mat}</Badge>
                      ))}
                      {result.requirements.preferredRegions?.map((region) => (
                        <Badge key={region} variant="outline" className="bg-primary/5">
                          <MapPin className="h-3 w-3 mr-1" />
                          {region}
                        </Badge>
                      ))}
                      {result.requirements.requiredCertifications?.map((cert) => (
                        <Badge key={cert} variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          <Shield className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleReset}>
                    New search
                  </Button>
                </div>
              </div>

              {/* Match cards */}
              {result.matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {result.matches.map((match, index) => (
                    <MatchCard key={match.supplier.supplier_id} match={match} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border rounded-xl">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No matches found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your requirements or describe the project differently
                  </p>
                  <Button variant="outline" onClick={handleReset}>
                    Try again
                  </Button>
                </div>
              )}

              {/* Stats */}
              <div className="text-center text-sm text-muted-foreground">
                Analyzed {result.totalSuppliersAnalyzed} suppliers
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
