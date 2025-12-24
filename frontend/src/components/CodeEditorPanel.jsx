import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, EyeIcon, PencilIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

function CodeEditorPanel({
  selectedLanguage,
  code,
  isRunning,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  readOnly = false,
  isParticipantTyping = false,
}) {
  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-base-100 border-t border-base-300">
        <div className="flex items-center gap-3">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage].icon}
            alt={LANGUAGE_CONFIG[selectedLanguage].name}
            className="size-6"
          />
          <select
            className="select select-sm"
            value={selectedLanguage}
            onChange={onLanguageChange}
            disabled={readOnly}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
          {readOnly && (
            <div className="flex items-center gap-2 px-3 py-1 bg-warning/20 border border-warning/40 rounded-lg">
              <EyeIcon className="size-3.5 text-warning" />
              <span className="text-xs font-semibold text-warning">View Only Mode</span>
            </div>
          )}
          {!readOnly && (
            <div className="flex items-center gap-2 px-3 py-1 bg-success/20 border border-success/40 rounded-lg">
              <PencilIcon className="size-3.5 text-success" />
              <span className="text-xs font-semibold text-success">Edit Mode</span>
            </div>
          )}
          {readOnly && isParticipantTyping && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/40 rounded-lg animate-pulse">
              <div className="size-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-primary">Participant is coding...</span>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary btn-sm gap-2"
          disabled={isRunning || readOnly}
          onClick={onRunCode}
          title={readOnly ? "Only participants can run code" : "Run code"}
        >
          {isRunning ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayIcon className="size-4" />
              Run Code
            </>
          )}
        </button>
      </div>

      <div className="flex-1 relative">
        <Editor
          height={"100%"}
          language={LANGUAGE_CONFIG[selectedLanguage]?.monacoLang || "javascript"}
          value={code || ""}
          onChange={readOnly ? undefined : onCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 16,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            readOnly: readOnly,
            domReadOnly: readOnly, // Prevent any DOM manipulation
            contextmenu: !readOnly, // Disable right-click menu in read-only
            quickSuggestions: !readOnly, // Disable autocomplete in read-only
            wordWrap: "on",
            // Disable all editing capabilities for read-only
            ...(readOnly && {
              cursorStyle: "line-thin", // Show thin cursor instead of block
              cursorBlinking: "solid", // Solid cursor (no blinking)
              renderLineHighlight: "none", // No line highlight
              selectionHighlight: false, // No selection highlight
              occurrencesHighlight: false, // No occurrence highlighting
              links: false, // Disable links
              hover: {
                enabled: true, // Keep hover for info, but no editing
              },
            }),
          }}
        />
        {readOnly && (
          <div 
            className="absolute inset-0 pointer-events-none bg-transparent" 
            style={{ zIndex: 10 }}
            onKeyDown={(e) => {
              // Prevent all keyboard input for host
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyPress={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        )}
      </div>
    </div>
  );
}
export default CodeEditorPanel;
