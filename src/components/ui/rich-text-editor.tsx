import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxCharacters?: number;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '150px',
  maxCharacters,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const characterCount = editor?.storage.characterCount?.characters() || 
    (editor?.getText().length || 0);

  if (!editor) {
    return (
      <div 
        className={cn(
          "border rounded-md bg-muted/30 animate-pulse",
          className
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('underline') && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 2 }) && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 3 }) && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') && "bg-accent text-accent-foreground"
          )}
          disabled={disabled}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          className="h-8 w-8 p-0"
          disabled={disabled || !editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          className="h-8 w-8 p-0"
          disabled={disabled || !editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>

        {maxCharacters && (
          <div className="ml-auto text-xs text-muted-foreground">
            {characterCount} / {maxCharacters}
          </div>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-sm max-w-none p-3",
          "focus-within:outline-none",
          "[&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
