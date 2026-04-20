'use client';
import { Compressor } from '@/lib/compressor';
import Editor from 'react-monaco-editor';
import { languageDef, configuration, theme } from '@/lib/editor-config';
import { useEffect, useState } from 'react';
import Publish from './Publish';
import Save from './Save';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import CCSFlowView from './flow/CCSFlowView';
import CCSFlowWrapper from './flow/CCSFlowWrapper';

const CCSEditor = ({ defaultCode }: { defaultCode: string | null }) => {
  const defaultSnippet = `// @anonymous\ndef module custom-module\ndef desc "Custom Scripted Module"\non module_enable {\n}\non module_disable {\n}`;

  const compressor = new Compressor();
  const [code, setCode] = useState(
    defaultCode === null ? defaultSnippet : defaultCode,
  );
  // liveCode mirrors the editor in real-time for the flow view
  const [liveCode, setLiveCode] = useState(code);
  const [editor, setEditor] = useState<any>();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateCodeState = () => {
    const val = editor.getValue();
    setCode(val);
    setLiveCode(val);
    return val;
  };

  useEffect(() => {
    return () => {
      const error = searchParams.get('error');
      if (error === 'exception') {
        toast({
          title: 'Failed to load snippet',
          description:
            'There was some server-side error during loading of snippet. Please try again later.',
          variant: 'destructive',
        });
        router.push('/editor');
      } else if (error === 'not_found') {
        toast({
          title: 'Snippet does not exist',
          description:
            'The snippet you are trying to load does not exist in our database.',
          variant: 'destructive',
        });
        router.push('/editor');
      }
    };
  }, [searchParams, router, toast]);

  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(true);

  const editorWillMount = (monaco: any) => {
    if (!monaco.languages.getLanguages().some(({ id }: any) => id === 'ccs')) {
      monaco.languages.register({ id: 'ccs' });
      monaco.languages.setMonarchTokensProvider('ccs', languageDef);
      monaco.languages.setLanguageConfiguration('ccs', configuration);
      monaco.editor.defineTheme('ccs', theme);
    }
  };

  const editorDidMount = (editor: any) => {
    editor.focus();
    setEditor(editor);
    setLoading(false);

    // update flow view on every keystroke
    editor.onDidChangeModelContent(() => {
      setLiveCode(editor.getValue());
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-row bg-white dark:bg-[#1e1e1e] gap-2 md:gap-4 pt-4 mx-8 justify-between">
        <div className="block md:flex md:flex-row md:gap-4 md:mx-4">
          <button
            onClick={() => {
              const val = editor?.getValue() ?? '';
              const compressor = new Compressor();
              // reuse your existing decompress for "Format"
              setLiveCode(compressor.decompress(val));
            }}
            className="btn border-transparent focus:ring-[#ac8929] shadow-none bg-[#ac8929] hover:bg-[#725915] font-semibold px-6 py-2.5 text-white text-sm w-full mb-4 lg:w-auto"
          >
            Format
          </button>
          <button
            onClick={() => {
              const val = editor?.getValue() ?? '';
              setLiveCode(val);
            }}
            className="btn border-transparent focus:ring-[#ac8929] shadow-none bg-[#ac8929] hover:bg-[#725915] font-semibold px-6 py-2.5 text-white text-sm w-full mb-4 lg:w-auto"
          >
            Refresh Graph
          </button>
        </div>
        <div className="block md:flex md:flex-row md:gap-4 md:mx-4">
          <Publish onOpen={updateCodeState} code={code} disabled={false} />
          <Save receiveCode={updateCodeState} disabled={false} />
        </div>
      </div>

      {/* Editor + Flow split */}
      <div
        className={`flex flex-col lg:flex-row h-screen bg-[#ffffff] text-black dark:bg-[#1e1e1e] dark:text-white ${loading && 'opacity-0'}`}
      >
        {/* Left: Monaco editor */}
        <div className="flex-1 h-full">
          <Editor
            language="ccs"
            editorWillMount={editorWillMount}
            editorDidMount={editorDidMount}
            className="h-screen"
            value={code}
            theme={dark ? 'ccs' : 'light'}
            options={{
              wordWrap: 'on',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoIndent: 'brackets',
              quickSuggestions: true,
              quickSuggestionsDelay: 1,
              wordBasedSuggestions: 'allDocuments',
              acceptSuggestionOnCommitCharacter: true,
              tabSize: 2,
              readOnly: false,
            }}
          />
        </div>

        {/* Right: XYFlow graph */}
        <div className="flex-1 h-full">
          <CCSFlowWrapper code={code} />
        </div>
      </div>
    </div>
  );
};

export default CCSEditor;
