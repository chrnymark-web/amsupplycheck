import { Bot, User, Volume2, VolumeX } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/use-chat';
import { ChatSupplierCard } from './ChatSupplierCard';
import { ChatProjectMatches } from './ChatProjectMatches';
import { Button } from './ui/button';

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export function ChatMessage({ message, onSpeak, isSpeaking, onStopSpeaking }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const canSpeak = !isUser && message.content && onSpeak;

  const handleSpeakClick = () => {
    if (isSpeaking) {
      onStopSpeaking?.();
    } else if (message.content) {
      onSpeak?.(message.content);
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="group relative">
          <div
            className={`rounded-2xl px-4 py-2.5 ${
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted text-foreground rounded-tl-sm'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content || (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </span>
              )}
            </p>
          </div>
          
          {/* Text-to-speech button */}
          {canSpeak && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                isSpeaking ? 'opacity-100 text-primary' : ''
              }`}
              onClick={handleSpeakClick}
              title={isSpeaking ? 'Stop reading' : 'Read aloud'}
            >
              {isSpeaking ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Show supplier cards if available */}
        {message.suppliers && message.suppliers.length > 0 && (
          <div className="w-full space-y-2 mt-1">
            {message.suppliers.map((supplier) => (
              <ChatSupplierCard key={supplier.supplier_id} supplier={supplier} />
            ))}
          </div>
        )}

        {/* Show detailed supplier info if available */}
        {message.supplierDetail && (
          <div className="w-full mt-1">
            <ChatSupplierCard supplier={message.supplierDetail} detailed />
          </div>
        )}

        {/* Show project matches if available */}
        {message.projectMatches && message.projectMatches.matches.length > 0 && (
          <div className="w-full mt-2">
            <ChatProjectMatches 
              matches={message.projectMatches.matches} 
              requirements={message.projectMatches.requirements}
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
