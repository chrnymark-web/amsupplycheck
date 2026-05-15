"use client";

import {
  Award,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Package,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SupplierLogo from "@/components/ui/supplier-logo";
import type { MatchResult, MatchingResult } from "@/lib/supplier-matching-types";

interface MatchResultViewProps {
  result: MatchingResult;
  technology: string;
  material: string;
  quantity: number;
  preferredRegion?: string;
  onReset: () => void;
}

export function MatchResultView({
  result,
  technology,
  material,
  quantity,
  preferredRegion,
  onReset,
}: MatchResultViewProps) {
  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground/70 italic">
        Map view coming soon — supplier locations will render on an interactive map in a later release.
      </p>

      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {result.matches.length} suppliers match your part
            </h2>
            {result.requirements?.projectSummary && (
              <p className="text-muted-foreground">{result.requirements.projectSummary}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {technology && <Badge variant="secondary">{technology}</Badge>}
              {material && <Badge variant="outline">{material}</Badge>}
              <Badge variant="outline">
                <Package className="h-3 w-3 mr-1" />
                {quantity} pcs
              </Badge>
              {preferredRegion && (
                <Badge variant="outline" className="bg-primary/5">
                  <MapPin className="h-3 w-3 mr-1" />
                  {preferredRegion}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={onReset}>
            New search
          </Button>
        </div>
      </div>

      {result.matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {result.matches.map((match, index) => (
            <StlMatchCard
              key={match.supplier.supplier_id}
              match={match}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border rounded-xl">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No matches found</h3>
          <p className="text-muted-foreground mb-4">
            Try a different technology or material
          </p>
          <Button variant="outline" onClick={onReset}>
            Try again
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Analyzed {result.totalSuppliersAnalyzed} suppliers
      </div>
    </div>
  );
}

function StlMatchCard({ match, rank }: { match: MatchResult; rank: number }) {
  const { supplier, score, matchDetails } = match;
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className="absolute top-3 left-3 z-10">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            rank === 1
              ? "bg-yellow-400 text-yellow-900"
              : rank === 2
                ? "bg-gray-300 text-gray-700"
                : rank === 3
                  ? "bg-orange-400 text-orange-900"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {rank}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Badge
          variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "outline"}
          className="text-sm font-semibold"
        >
          {score}% match
        </Badge>
      </div>
      <CardHeader className="pt-12">
        <div className="flex items-start gap-4">
          <SupplierLogo logoUrl={supplier.logo_url} name={supplier.name} size="md" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{supplier.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {supplier.location_city && `${supplier.location_city}, `}
              {supplier.location_country || supplier.region}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {supplier.is_partner && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 border-amber-300 text-amber-800"
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              Partner
            </Badge>
          )}
          {supplier.verified && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {supplier.premium && (
            <Badge
              variant="outline"
              className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700"
            >
              <Award className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {matchDetails.overallExplanation && (
          <p className="text-sm text-muted-foreground italic">
            &quot;{matchDetails.overallExplanation}&quot;
          </p>
        )}
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
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/suppliers/${supplier.supplier_id}`}>View profile</Link>
          </Button>
          {supplier.is_partner && supplier.instant_quote_url ? (
            <Button
              size="sm"
              className="flex-1 bg-amber-400 text-black hover:bg-amber-400/90"
              asChild
            >
              <a
                href={supplier.instant_quote_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Star className="h-3 w-3 mr-1 fill-current" />
                Get instant quote
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ) : supplier.website ? (
            <Button size="sm" className="flex-1" asChild>
              <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                Visit
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
