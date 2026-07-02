import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

export default function Markdown({ content }) {
  // Strictly sanitize the input to prevent XSS
  const cleanContent = DOMPurify.sanitize(content);

  return (
    <div className="prose prose-invert prose-sm max-w-none 
                    prose-p:text-white/80 prose-headings:text-white 
                    prose-strong:text-white prose-li:text-white/80 
                    prose-a:text-tavern-accent prose-code:text-tavern-accent 
                    prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}