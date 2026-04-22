import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, RefreshCw, Sparkles, X, Plus, Check, AlertCircle, History } from 'lucide-react';
import { 
  VALID_MATERIALS, 
  VALID_TECHNOLOGIES,
  MATERIAL_DISPLAY_NAMES,
  TECHNOLOGY_DISPLAY_NAMES,
  MATERIAL_CATEGORIES
} from '@/lib/validMaterials';

interface Supplier {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  description: string | null;
  materials: string[];
  technologies: string[];
  location_city: string | null;
  location_country: string | null;
  location_address: string | null;
  verified: boolean | null;
  last_validated_at: string | null;
  last_validation_confidence: number | null;
}

interface ValidationResult {
  id: string;
  created_at: string;
  technologies_scraped: string[];
  materials_scraped: string[];
  location_scraped: string;
  overall_confidence: number;
  technologies_confidence: number;
  materials_confidence: number;
}

const AdminSupplierEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form state
  const [materials, setMaterials] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  
  // Validation history
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  
  // Search/filter state
  const [materialSearch, setMaterialSearch] = useState('');
  const [techSearch, setTechSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        toast({
          title: "Unauthorized",
          description: "Admin access required",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [navigate, toast]);

  // Load supplier data
  useEffect(() => {
    if (!id || !isAdmin) return;

    const loadSupplier = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to load supplier",
          variant: "destructive"
        });
        navigate('/admin/suppliers');
        return;
      }

      setSupplier(data);
      setMaterials(data.materials || []);
      setTechnologies(data.technologies || []);
      setDescription(data.description || '');
      setCity(data.location_city || '');
      setCountry(data.location_country || '');

      // Load validation history
      const { data: history } = await supabase
        .from('validation_results')
        .select('*')
        .eq('supplier_id', data.supplier_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (history) {
        setValidationHistory(history as ValidationResult[]);
      }

      setLoading(false);
    };

    loadSupplier();
  }, [id, isAdmin, navigate, toast]);

  const handleSave = async () => {
    if (!supplier) return;
    
    setSaving(true);

    const { error } = await supabase
      .from('suppliers')
      .update({
        materials,
        technologies,
        description,
        location_city: city,
        location_country: country,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplier.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Saved!",
      description: "Supplier data updated successfully",
    });
  };

  const toggleMaterial = (material: string) => {
    setMaterials(prev => 
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const toggleTechnology = (tech: string) => {
    setTechnologies(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const addQuickMaterials = (category: string) => {
    const categoryMaterials = MATERIAL_CATEGORIES[category] || [];
    setMaterials(prev => [...new Set([...prev, ...categoryMaterials])]);
    toast({
      title: "Added Materials",
      description: `Added ${categoryMaterials.length} ${category} materials`,
    });
  };

  const applyFromValidation = (validation: ValidationResult) => {
    if (validation.materials_scraped?.length) {
      setMaterials(prev => [...new Set([...prev, ...validation.materials_scraped])]);
    }
    if (validation.technologies_scraped?.length) {
      setTechnologies(prev => [...new Set([...prev, ...validation.technologies_scraped])]);
    }
    toast({
      title: "Applied Validation Data",
      description: "Merged scraped data with current selections",
    });
  };

  // Filter materials
  const filteredMaterials = VALID_MATERIALS.filter(m => {
    const matchesSearch = m.toLowerCase().includes(materialSearch.toLowerCase()) ||
                          (MATERIAL_DISPLAY_NAMES[m] || '').toLowerCase().includes(materialSearch.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    
    const categoryMaterials = MATERIAL_CATEGORIES[selectedCategory] || [];
    return matchesSearch && categoryMaterials.includes(m);
  });

  // Filter technologies
  const filteredTechnologies = VALID_TECHNOLOGIES.filter(t =>
    t.toLowerCase().includes(techSearch.toLowerCase()) ||
    (TECHNOLOGY_DISPLAY_NAMES[t] || '').toLowerCase().includes(techSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin/suppliers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <p className="text-muted-foreground text-sm">{supplier.website}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mb-6">
          <Badge variant={supplier.verified ? "default" : "secondary"}>
            {supplier.verified ? "Verified" : "Unverified"}
          </Badge>
          {supplier.last_validated_at && (
            <Badge variant="outline">
              Last validated: {new Date(supplier.last_validated_at).toLocaleDateString()}
            </Badge>
          )}
          {supplier.last_validation_confidence && (
            <Badge variant={supplier.last_validation_confidence > 70 ? "default" : "secondary"}>
              Confidence: {Math.round(supplier.last_validation_confidence)}%
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Company description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technologies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Technologies
                  <Badge variant="outline">{technologies.length} selected</Badge>
                </CardTitle>
                <CardDescription>
                  Select all 3D printing technologies this supplier offers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search technologies..."
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  className="mb-4"
                />
                
                {/* Selected technologies */}
                {technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg">
                    {technologies.map(tech => (
                      <Badge 
                        key={tech} 
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => toggleTechnology(tech)}
                      >
                        {TECHNOLOGY_DISPLAY_NAMES[tech] || tech}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredTechnologies.map(tech => (
                      <div
                        key={tech}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                          technologies.includes(tech) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => toggleTechnology(tech)}
                      >
                        <Checkbox checked={technologies.includes(tech)} />
                        <span className="text-sm">{TECHNOLOGY_DISPLAY_NAMES[tech] || tech}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Materials
                  <Badge variant="outline">{materials.length} selected</Badge>
                </CardTitle>
                <CardDescription>
                  Select all materials this supplier can work with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Quick add buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-muted-foreground mr-2">Quick add:</span>
                  {Object.keys(MATERIAL_CATEGORIES).map(category => (
                    <Button 
                      key={category}
                      variant="outline" 
                      size="sm"
                      onClick={() => addQuickMaterials(category)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      All {category}
                    </Button>
                  ))}
                </div>

                {/* Category filter and search */}
                <div className="flex gap-2 mb-4">
                  <select
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(MATERIAL_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Search materials..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {/* Selected materials */}
                {materials.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg">
                    {materials.slice(0, 20).map(mat => (
                      <Badge 
                        key={mat} 
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => toggleMaterial(mat)}
                      >
                        {MATERIAL_DISPLAY_NAMES[mat] || mat}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    {materials.length > 20 && (
                      <Badge variant="outline">+{materials.length - 20} more</Badge>
                    )}
                  </div>
                )}

                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredMaterials.map(mat => (
                      <div
                        key={mat}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                          materials.includes(mat) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => toggleMaterial(mat)}
                      >
                        <Checkbox checked={materials.includes(mat)} />
                        <span className="text-sm truncate">{MATERIAL_DISPLAY_NAMES[mat] || mat}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Validation History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Validation History
                </CardTitle>
                <CardDescription>
                  Recent scraped data you can apply
                </CardDescription>
              </CardHeader>
              <CardContent>
                {validationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No validation history yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {validationHistory.map(validation => (
                      <div 
                        key={validation.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(validation.created_at).toLocaleDateString()}
                          </span>
                          <Badge variant={validation.overall_confidence > 70 ? "default" : "secondary"}>
                            {Math.round(validation.overall_confidence)}%
                          </Badge>
                        </div>
                        
                        {validation.technologies_scraped?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium">Technologies:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {validation.technologies_scraped.slice(0, 5).map(t => (
                                <Badge key={t} variant="outline" className="text-xs">
                                  {t}
                                </Badge>
                              ))}
                              {validation.technologies_scraped.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{validation.technologies_scraped.length - 5}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {validation.materials_scraped?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium">Materials:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {validation.materials_scraped.slice(0, 5).map(m => (
                                <Badge key={m} variant="outline" className="text-xs">
                                  {m}
                                </Badge>
                              ))}
                              {validation.materials_scraped.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{validation.materials_scraped.length - 5}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => applyFromValidation(validation)}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Apply This Data
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Current Data Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Technologies</span>
                  <Badge variant="outline">{technologies.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Materials</span>
                  <Badge variant="outline">{materials.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm">{city && country ? `${city}, ${country}` : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="text-sm">{description ? `${description.length} chars` : 'Not set'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupplierEditor;
