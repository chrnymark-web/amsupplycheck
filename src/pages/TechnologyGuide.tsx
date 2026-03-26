import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Zap, 
  DollarSign,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TECHNOLOGY_GLOSSARY, 
  MATERIAL_GLOSSARY,
  TechnologyInfo, 
  MaterialInfo,
  getPriceDisplay, 
  getLevelDisplay,
  getMaterialInfo
} from '@/lib/technologyGlossary';
import { TechnologyTooltip } from '@/components/TechnologyTooltip';
import { MaterialComparisonTable } from '@/components/MaterialComparisonTable';
import { TechnologyComparisonTable } from '@/components/TechnologyComparisonTable';
import Navbar from '@/components/ui/navbar';
import { Beaker } from 'lucide-react';

// Group technologies by category
const groupedTechnologies = Object.entries(TECHNOLOGY_GLOSSARY).reduce((acc, [key, tech]) => {
  const category = tech.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push({ key, ...tech });
  return acc;
}, {} as Record<string, (TechnologyInfo & { key: string })[]>);

const categoryLabels: Record<string, { label: string; description: string; icon: string }> = {
  resin: { 
    label: 'Resin', 
    description: 'UV-curing liquid materials for high detail',
    icon: '💧'
  },
  polymer: { 
    label: 'Polymer (Powder/Filament)', 
    description: 'Plastic-based technologies for functional parts',
    icon: '🧱'
  },
  metal: { 
    label: 'Metal', 
    description: 'Metal printing for industrial applications',
    icon: '⚙️'
  },
  composite: { 
    label: 'Composite', 
    description: 'Reinforced materials for high strength',
    icon: '🔩'
  },
};

// Group materials by category
const groupedMaterials = Object.entries(MATERIAL_GLOSSARY).reduce((acc, [key, mat]) => {
  const category = mat.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push({ key, ...mat });
  return acc;
}, {} as Record<string, (MaterialInfo & { key: string })[]>);

const materialCategoryLabels: Record<string, { label: string; description: string; icon: string }> = {
  'Polymer': { 
    label: 'Polymers', 
    description: 'Standard plastic materials for FDM and SLS',
    icon: '🧱'
  },
  'High-Performance Polymer': { 
    label: 'High-Performance Polymers', 
    description: 'Advanced plastic materials for demanding applications',
    icon: '⚡'
  },
  'Elastomer': { 
    label: 'Elastomers', 
    description: 'Flexible rubber-like materials',
    icon: '🔄'
  },
  'Photopolymer': { 
    label: 'Photopolymers (Resin)', 
    description: 'UV-curing materials for SLA, DLP and PolyJet',
    icon: '💧'
  },
  'Metal': { 
    label: 'Metals', 
    description: 'Metal printing for industry and medical',
    icon: '⚙️'
  },
  'Superalloy': { 
    label: 'Superalloys', 
    description: 'Extreme alloys for high temperatures',
    icon: '🔥'
  },
  'Composite': { 
    label: 'Composites', 
    description: 'Reinforced materials for high strength',
    icon: '🔩'
  },
};

// Wizard questions
const wizardQuestions = [
  {
    id: 'purpose',
    question: 'What will the part be used for?',
    options: [
      { value: 'visual', label: 'Visual prototype / Model', technologies: ['SLA', 'DLP', 'Material Jetting', 'PolyJet'] },
      { value: 'functional', label: 'Functional prototype', technologies: ['SLS', 'Multi Jet Fusion', 'FDM'] },
      { value: 'production', label: 'End product / Production', technologies: ['SLS', 'Multi Jet Fusion', 'SAF', 'DMLS'] },
      { value: 'tooling', label: 'Tool / Fixture', technologies: ['FDM', 'SLS', 'Carbon Fiber'] },
    ]
  },
  {
    id: 'strength',
    question: 'How important is mechanical strength?',
    options: [
      { value: 'low', label: 'Not important - visual only', technologies: ['SLA', 'DLP', 'Material Jetting', 'PolyJet'] },
      { value: 'medium', label: 'Moderate - handling and testing', technologies: ['SLS', 'Multi Jet Fusion', 'FDM'] },
      { value: 'high', label: 'High - must withstand load', technologies: ['SLS', 'Multi Jet Fusion', 'Carbon Fiber', 'DMLS'] },
      { value: 'extreme', label: 'Extreme - structural / aerospace', technologies: ['DMLS', 'SLM', 'EBM', 'Carbon Fiber'] },
    ]
  },
  {
    id: 'detail',
    question: 'How important is surface quality and details?',
    options: [
      { value: 'low', label: 'Not important - functional part', technologies: ['FDM', 'SLS', 'Binder Jetting'] },
      { value: 'medium', label: 'Moderate - acceptable finish', technologies: ['SLS', 'Multi Jet Fusion', 'SAF'] },
      { value: 'high', label: 'High - smooth and precise', technologies: ['SLA', 'DLP', 'Material Jetting'] },
      { value: 'extreme', label: 'Extreme - photorealistic/dental', technologies: ['PolyJet', 'Material Jetting', 'SLA'] },
    ]
  },
  {
    id: 'material',
    question: 'What material do you need?',
    options: [
      { value: 'plastic', label: 'Standard plastic', technologies: ['FDM', 'SLS', 'Multi Jet Fusion', 'SLA'] },
      { value: 'flexible', label: 'Flexible / rubber', technologies: ['SLS', 'Multi Jet Fusion', 'PolyJet'] },
      { value: 'hightemp', label: 'High temperature resistance', technologies: ['FDM', 'SLS'] },
      { value: 'metal', label: 'Metal', technologies: ['DMLS', 'SLM', 'EBM', 'Binder Jetting'] },
    ]
  },
  {
    id: 'budget',
    question: 'What is your budget?',
    options: [
      { value: 'low', label: 'Low - best value for money', technologies: ['FDM', 'SLS', 'Multi Jet Fusion'] },
      { value: 'medium', label: 'Moderate - balanced quality/price', technologies: ['SLS', 'Multi Jet Fusion', 'SLA', 'SAF'] },
      { value: 'high', label: 'High - quality is most important', technologies: ['SLA', 'Material Jetting', 'PolyJet'] },
      { value: 'unlimited', label: 'No limit - best solution', technologies: ['DMLS', 'SLM', 'PolyJet', 'Carbon Fiber'] },
    ]
  },
];

function TechnologyCard({ tech }: { tech: TechnologyInfo & { key: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-all duration-300 ${expanded ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {tech.abbreviation}
              <Badge variant="outline" className="text-xs font-normal">
                {tech.category}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {tech.name}
            </CardDescription>
          </div>
          <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {tech.shortDescription}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Strength</p>
            <p className="text-xs">{getLevelDisplay(tech.strengthLevel)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Detail</p>
            <p className="text-xs">{getLevelDisplay(tech.detailLevel)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Speed</p>
            <p className="text-xs">{getLevelDisplay(tech.speedLevel)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Price</p>
            <p className="text-xs">{getPriceDisplay(tech.priceRange)}</p>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-3 border-t animate-fade-in">
            <p className="text-sm text-foreground">
              {tech.longDescription}
            </p>

            <div>
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Best for:
              </p>
              <div className="flex flex-wrap gap-1">
                {tech.bestFor.map((use) => (
                  <Badge key={use} variant="secondary" className="text-xs">
                    {use}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <Info className="h-3 w-3 text-orange-500" />
                Limitations:
              </p>
              <div className="flex flex-wrap gap-1">
                {tech.limitations.map((lim) => (
                  <Badge key={lim} variant="outline" className="text-xs">
                    {lim}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-2">Typical materials:</p>
              <div className="flex flex-wrap gap-1">
                {tech.typicalMaterials.map((material) => (
                  <TechnologyTooltip key={material} name={material} type="material">
                    <Badge variant="outline" className="text-xs cursor-help">
                      {material}
                    </Badge>
                  </TechnologyTooltip>
                ))}
              </div>
            </div>

            <Button 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = `/search?technologies=${tech.key}`}
            >
              Find suppliers with {tech.abbreviation}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaterialCard({ material }: { material: MaterialInfo & { key: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-all duration-300 ${expanded ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {material.key}
              <Badge variant="outline" className="text-xs font-normal">
                {material.category}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-1">
              {material.name}
            </CardDescription>
          </div>
          <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {material.shortDescription}
        </p>

        {/* Quick info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1">
            {material.properties.slice(0, 2).map((prop) => (
              <Badge key={prop} variant="secondary" className="text-[10px] px-1.5 py-0">
                {prop}
              </Badge>
            ))}
          </div>
          <span className="text-sm font-medium">{getPriceDisplay(material.priceRange)}</span>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-3 border-t animate-fade-in">
            <div>
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Properties:
              </p>
              <div className="flex flex-wrap gap-1">
                {material.properties.map((prop) => (
                  <Badge key={prop} variant="secondary" className="text-xs">
                    {prop}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <Info className="h-3 w-3 text-blue-500" />
                Applications:
              </p>
              <div className="flex flex-wrap gap-1">
                {material.applications.map((app) => (
                  <Badge key={app} variant="outline" className="text-xs">
                    {app}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = `/search?materials=${material.key}`}
            >
              Find suppliers with {material.key}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechnologyWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<string[] | null>(null);

  const handleAnswer = (questionId: string, value: string, technologies: string[]) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentStep < wizardQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate recommendations
      const allTechs: Record<string, number> = {};
      
      wizardQuestions.forEach((q) => {
        const answer = newAnswers[q.id];
        const option = q.options.find(o => o.value === answer);
        if (option) {
          option.technologies.forEach(tech => {
            allTechs[tech] = (allTechs[tech] || 0) + 1;
          });
        }
      });

      // Sort by frequency and get top 3
      const sorted = Object.entries(allTechs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tech]) => tech);

      setRecommendations(sorted);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendations(null);
  };

  if (recommendations) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your recommended technologies
          </CardTitle>
          <CardDescription>
            Based on your answers, we recommend these technologies:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((techKey, index) => {
            const tech = TECHNOLOGY_GLOSSARY[techKey];
            if (!tech) return null;
            
            return (
              <div 
                key={techKey}
                className={`p-4 rounded-lg bg-background/80 border ${index === 0 ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {index === 0 && <Badge className="bg-primary text-primary-foreground">Best choice</Badge>}
                      {tech.abbreviation} - {tech.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tech.shortDescription}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tech.bestFor.slice(0, 3).map((use) => (
                    <Badge key={use} variant="secondary" className="text-xs">
                      {use}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={resetWizard}>
              Start over
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate(`/search?technologies=${recommendations.join(',')}`)}
            >
              Find suppliers
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = wizardQuestions[currentStep];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            Question {currentStep + 1} of {wizardQuestions.length}
          </Badge>
          <div className="flex gap-1">
            {wizardQuestions.map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
        <CardTitle>{currentQuestion.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {currentQuestion.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleAnswer(currentQuestion.id, option.value, option.technologies)}
            className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <span className="font-medium">{option.label}</span>
          </button>
        ))}

        {currentStep > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            className="mt-4"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


export default function TechnologyGuide() {
  const navigate = useNavigate();

  // Add BreadcrumbList structured data for technology guide
  useEffect(() => {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://amsupplycheck.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Technology Guide",
          "item": "https://amsupplycheck.com/technology-guide"
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-jsonld';
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('breadcrumb-jsonld');
      if (el) el.remove();
    };
  }, []);
  return (
    <>
      <Helmet>
        <title>3D Printing Technology Guide | AMSupplyCheck</title>
        <meta name="description" content="Learn about all 3D printing technologies - SLA, SLS, FDM, DMLS and more. Find out which technology suits your project." />
         <link rel="canonical" href="https://amsupplycheck.com/technology-guide" />
        <meta property="og:title" content="3D Printing Technology Guide | AMSupplyCheck" />
        <meta property="og:description" content="Compare 3D printing technologies including SLA, SLS, FDM, DMLS. Find the right technology for your manufacturing needs." />
        <meta property="og:url" content="https://amsupplycheck.com/technology-guide" />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content="3D Printing Technology Guide | AMSupplyCheck" />
        <meta name="twitter:description" content="Compare 3D printing technologies including SLA, SLS, FDM, DMLS. Find the right technology for your manufacturing needs." />
      </Helmet>

      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/10 to-background border-b">
          <div className="container mx-auto px-4 py-12">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                3D Printing Technology Guide
              </h1>
              <p className="text-lg text-muted-foreground">
                Understand the differences between 3D printing technologies and find the right one for your project. 
                No prior knowledge required.
              </p>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="compare" className="space-y-8">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="compare" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Compare</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Technologies</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-1">
                <Beaker className="h-4 w-4" />
                <span className="hidden sm:inline">Materials</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {Object.entries(categoryLabels).map(([category, { label, description, icon }]) => {
                const techs = groupedTechnologies[category];
                if (!techs) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <h2 className="text-xl font-semibold">{label}</h2>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {techs.map((tech) => (
                        <TechnologyCard key={tech.key} tech={tech} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-8">
              {Object.entries(materialCategoryLabels).map(([category, { label, description, icon }]) => {
                const materials = groupedMaterials[category];
                if (!materials) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <h2 className="text-xl font-semibold">{label}</h2>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {materials.map((material) => (
                        <MaterialCard key={material.key} material={material} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare" className="space-y-8">
              <TechnologyComparisonTable />
              <MaterialComparisonTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
