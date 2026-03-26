import { useState, useCallback, useEffect, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suppliers?: any[];
  supplierDetail?: any;
  projectMatches?: { matches: any[]; requirements: any };
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  sessionId: string;
}

// Generate a unique session ID
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID from localStorage
function getSessionId(): string {
  const stored = localStorage.getItem('supplycheck_chat_session');
  if (stored) {
    return stored;
  }
  const newId = generateSessionId();
  localStorage.setItem('supplycheck_chat_session', newId);
  return newId;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(getSessionId);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`supplycheck_chat_messages_${sessionId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        console.error('Error loading chat messages:', e);
      }
    }
  }, [sessionId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        `supplycheck_chat_messages_${sessionId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Create assistant message placeholder
    const assistantId = `msg_${Date.now()}_assistant`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supplier-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: content.trim(),
            sessionId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let suppliers: any[] = [];
      let supplierDetail: any = null;
      let projectMatches: { matches: any[]; requirements: any } | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.type === 'content' && parsed.content) {
              accumulatedContent += parsed.content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: accumulatedContent, suppliers, supplierDetail, projectMatches }
                  : m
              ));
            } else if (parsed.type === 'suppliers' && parsed.suppliers) {
              suppliers = parsed.suppliers;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: accumulatedContent, suppliers, supplierDetail, projectMatches }
                  : m
              ));
            } else if (parsed.type === 'supplier_detail' && parsed.supplier) {
              supplierDetail = parsed.supplier;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: accumulatedContent, suppliers, supplierDetail, projectMatches }
                  : m
              ));
            } else if (parsed.type === 'project_matches' && parsed.matches) {
              projectMatches = { matches: parsed.matches, requirements: parsed.requirements };
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: accumulatedContent, suppliers, supplierDetail, projectMatches }
                  : m
              ));
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Update assistant message with error
      setMessages(prev => prev.map(m => 
        m.id === `msg_${Date.now()}_assistant`
          ? { ...m, content: `Sorry, an error occurred: ${errorMessage}` }
          : m
      ));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    
    // Generate new session ID
    const newSessionId = generateSessionId();
    localStorage.setItem('supplycheck_chat_session', newSessionId);
    localStorage.removeItem(`supplycheck_chat_messages_${sessionId}`);
    
    // Reload to get new session
    window.location.reload();
  }, [sessionId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    sessionId,
  };
}
