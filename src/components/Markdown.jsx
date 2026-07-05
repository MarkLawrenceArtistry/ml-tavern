// ============================================================
// FILE: src/components/Markdown.jsx
// ============================================================
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

export default function Markdown({ content }) {
  const cleanContent = DOMPurify.sanitize(content);

  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-extrabold text-white mt-8 mb-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white mt-6 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-white mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold text-white mt-4 mb-1.5">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-white/80 mb-4 last:mb-0 leading-relaxed">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-tavern-accent hover:underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="text-white font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-white/70 italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-white/80">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-white/80">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-white/80 leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-tavern-accent pl-4 my-4 text-white/60 italic">{children}</blockquote>
          ),
          hr: () => <hr className="border-white/10 my-8" />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ''} className="max-w-full rounded-lg my-4 border border-white/10" />
          ),
          // Code blocks: pre wraps code. Style the pre, let code inherit.
          pre: ({ children }) => (
            <pre className="bg-black/60 border border-white/10 rounded-lg p-4 mb-4 overflow-x-auto">
              {children}
            </pre>
          ),
          // code: if it has a language class it's inside a pre (code block).
          // If no language class, it's inline code.
          code: ({ className, children, ...props }) => {
            const hasLang = /language-/.test(className || '');
            if (hasLang) {
              return (
                <code className={`${className || ''} text-xs font-mono text-white/80`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="text-tavern-accent bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 border border-white/10 rounded-lg">
              <table className="w-full text-sm text-left">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider border-b border-white/10">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-white/80 border-b border-white/5">{children}</td>
          ),
          // Task list items (GFM checkboxes)
          input: ({ checked, disabled, type }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  className="mr-2 accent-tavern-accent"
                  readOnly
                />
              );
            }
            return <input type={type} disabled={disabled} />;
          },
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}