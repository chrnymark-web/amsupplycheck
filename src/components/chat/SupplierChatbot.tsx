import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, RotateCcw, Minimize2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { useChat } from '@/hooks/use-chat';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';

export function SupplierChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
  const { isListening, isSupported, transcript, audioLevel, startListening, stopListening, error: speechError } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking: ttsIsSpeaking } = useTextToSpeech({ lang: 'en-US' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeak = (text: string, messageId: string) => {
    setSpeakingMessageId(messageId);
    speak(text);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
  };

  // Reset speaking message when TTS stops
  useEffect(() => {
    if (!ttsIsSpeaking && speakingMessageId) {
      setSpeakingMessageId(null);
    }
  }, [ttsIsSpeaking, speakingMessageId]);

  // Don't render anything if closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium text-sm">Need help?</span>
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
        {messages.length > 0 && (
          <span className="bg-white text-primary text-xs font-bold px-1.5 rounded-full">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AMSupplyCheck Assistant</h3>
            <p className="text-xs text-primary-foreground/70">Find the right supplier</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20"
            onClick={clearMessages}
            title="New conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        <div className="space-y-4">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                Hi! 👋
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                I can help you find the right 3D printing supplier. 
                Tell me about your project!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'I need a prototype',
                  'Metal 3D printing in Europe',
                  'High-volume production'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message}
              onSpeak={(text) => handleSpeak(text, message.id)}
              isSpeaking={speakingMessageId === message.id && ttsIsSpeaking}
              onStopSpeaking={handleStopSpeaking}
            />
          ))}

          {/* Error message */}
          {error && (
            <div className="text-center py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-muted/30">
        {(speechError) && (
          <p className="text-xs text-destructive mb-2">{speechError}</p>
        )}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            disabled={isLoading}
            className="flex-1 bg-background"
          />
          {isSupported && (
            <div className="relative flex-shrink-0">
              {isListening && (
                <>
                  {/* Audio level rings */}
                  <span 
                    className="absolute inset-0 rounded-md bg-destructive/30 transition-transform duration-75"
                    style={{ 
                      transform: `scale(${1 + audioLevel * 0.5})`,
                      opacity: 0.3 + audioLevel * 0.4
                    }} 
                  />
                  <span 
                    className="absolute inset-0 rounded-md bg-destructive/20 transition-transform duration-75"
                    style={{ 
                      transform: `scale(${1 + audioLevel * 0.8})`,
                      opacity: 0.2 + audioLevel * 0.3
                    }} 
                  />
                </>
              )}
              <Button
                type="button"
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleListening}
                disabled={isLoading}
                className="relative"
                title={isListening ? "Stop recording" : "Speak instead of typing"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              {/* Audio level bar */}
              {isListening && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive transition-all duration-75 rounded-full"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
          <Button 
            type="submit" 
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
