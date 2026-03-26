import { ExternalLink, MapPin, CheckCircle, Star, Trophy, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface MatchResult {
  supplier: {
    supplier_id: string;
    name: string;
    website?: string | null;
    description?: string | null;
    technologies?: string[] | null;
    materials?: string[] | null;
    region?: string | null;
    location_city?: string | null;
    location_country?: string | null;
    verified?: boolean;
    premium?: boolean;
    logo_url?: string | null;
  };
  score: number;
  matchDetails: {
    technologyScore: number;
    materialScore: number;
    locationScore: number;
    overallExplanation: string;
    matchedTechnologies: string[];
    matchedMaterials: string[];
  };
}

interface ChatProjectMatchCardProps {
  match: MatchResult;
  rank: number;
  animationDelay?: number;
}

export function ChatProjectMatchCard({ match, rank, animationDelay = 0 }: ChatProjectMatchCardProps) {
  const { supplier, score, matchDetails } = match;
  
  const location = [supplier.location_city, supplier.location_country]
    .filter(Boolean)
    .join(', ');

  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-4 w-4 text-orange-400" />;
    return <Target className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getScoreColor = () => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <div 
      className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-all hover:shadow-sm animate-fade-in opacity-0"
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Header with rank and score */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
            {getRankIcon()}
          </div>
          <span className="text-xs text-muted-foreground font-medium">#{rank}</span>
        </div>
        <Badge className={`text-xs font-semibold ${getScoreColor()}`}>
          {score}% match
        </Badge>
      </div>

      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {supplier.logo_url ? (
            <img 
              src={supplier.logo_url} 
              alt={supplier.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {supplier.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link 
              to={`/suppliers/${supplier.supplier_id}`}
              className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate"
            >
              {supplier.name}
            </Link>
            {supplier.verified && (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            )}
            {supplier.premium && (
              <Star className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 fill-yellow-500" />
            )}
          </div>

          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          )}

          {/* AI Explanation */}
          {matchDetails.overallExplanation && (
            <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">
              "{matchDetails.overallExplanation}"
            </p>
          )}

          {/* Score breakdown - compact */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Technology</span>
                <span>{matchDetails.technologyScore}%</span>
              </div>
              <Progress value={matchDetails.technologyScore} className="h-1" />
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Material</span>
                <span>{matchDetails.materialScore}%</span>
              </div>
              <Progress value={matchDetails.materialScore} className="h-1" />
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Location</span>
                <span>{matchDetails.locationScore}%</span>
              </div>
              <Progress value={matchDetails.locationScore} className="h-1" />
            </div>
          </div>

          {/* Matched capabilities */}
          {(matchDetails.matchedTechnologies.length > 0 || matchDetails.matchedMaterials.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {matchDetails.matchedTechnologies.slice(0, 2).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tech}
                </Badge>
              ))}
              {matchDetails.matchedMaterials.slice(0, 2).map((mat) => (
                <Badge key={mat} variant="outline" className="text-[10px] px-1.5 py-0">
                  {mat}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <Button 
            size="sm" 
            variant="default" 
            className="h-7 px-2 text-xs"
            asChild
          >
          <Link to={`/suppliers/${supplier.supplier_id}`}>
              View profile
            </Link>
          </Button>
          {supplier.website && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 px-2"
              asChild
            >
              <a 
                href={supplier.website} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatProjectMatchesProps {
  matches: MatchResult[];
  requirements?: {
    projectSummary?: string;
    requiredTechnologies?: string[];
    requiredMaterials?: string[];
  };
}

export function ChatProjectMatches({ matches, requirements }: ChatProjectMatchesProps) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {/* Summary header */}
      {requirements?.projectSummary && (
        <div 
          className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 animate-fade-in opacity-0"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Project Analysis</p>
              <p className="text-xs text-muted-foreground mt-0.5">{requirements.projectSummary}</p>
              {(requirements.requiredTechnologies?.length || requirements.requiredMaterials?.length) && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {requirements.requiredTechnologies?.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tech}
                    </Badge>
                  ))}
                  {requirements.requiredMaterials?.slice(0, 3).map((mat) => (
                    <Badge key={mat} variant="outline" className="text-[10px] px-1.5 py-0">
                      {mat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match cards with staggered animation */}
      <div className="space-y-2">
        {matches.slice(0, 5).map((match, index) => (
          <ChatProjectMatchCard 
            key={match.supplier.supplier_id} 
            match={match} 
            rank={index + 1}
            animationDelay={150 + (index * 100)}
          />
        ))}
      </div>

      {/* See more link */}
      {matches.length > 5 && (
        <div 
          className="text-center animate-fade-in opacity-0"
          style={{ 
            animationDelay: `${150 + (5 * 100)}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link to="/match">
              See all {matches.length} matches →
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
