import type { editor } from 'monaco-editor';
import { loadMonaco } from './monaco-loader.js';

export type MonacoEditor = {
	/** Set the language. */
	setModelLanguage: (language: string) => void;
	/** Sets the value text of the editor. */
	setValue: (value: string) => void;
	/** Gets the value text of the editor. */
	getValue: () => string;
	/** Set markers to the editor. */
	setMarkers: (markers: editor.IMarkerData[]) => void;
	/** Gets the editor. */
	getEditor: () => editor.IStandaloneCodeEditor;
	/** Dispose the editor. */
	disposeEditor: () => void;
};
export type MonacoDiffEditor = {
	/** Set the language. */
	setModelLanguage: (language: string) => void;
	/** Sets the value text of the original editor. */
	setLeftValue: (value: string) => void;
	/** Gets the value text of the original editor. */
	getLeftValue: () => string;
	/** Sets the value text of the modified editor. */
	setRightValue: (value: string) => void;
	/** Set markers to the original editor. */
	setLeftMarkers: (markers: editor.IMarkerData[]) => void;
	/** Set markers to the modified editor. */
	setRightMarkers: (markers: editor.IMarkerData[]) => void;
	/** Gets the original editor. */
	getLeftEditor: () => editor.IStandaloneCodeEditor;
	/** Gets the modified editor. */
	getRightEditor: () => editor.IStandaloneCodeEditor;
	/** Dispose the all editors. */
	disposeEditor: () => void;
};
export type BaseMonacoEditorOptions = {
	/** Specify a target element to set up the code editor. */
	element: HTMLElement;
	/** Specify the initial values. */
	init: {
		/** Code value. */
		value: string;
		/** Code language. */
		language: string;
	};
	/** Event listeners. */
	listeners?: {
		/** Notifies that the code value have changed. */
		onChangeValue?: (value: string) => void;
	};
};
export type MonacoEditorOptions = BaseMonacoEditorOptions & {
	useDiffEditor: false;
};
export type MonacoDiffEditorOptions = BaseMonacoEditorOptions & {
	useDiffEditor: true;
};

/** Setup editor */
export async function setupMonacoEditor(options: MonacoEditorOptions): Promise<MonacoEditor>;
export async function setupMonacoEditor(
	options: MonacoDiffEditorOptions,
): Promise<MonacoDiffEditor>;

export async function setupMonacoEditor({
	init,
	listeners,
	element,
	useDiffEditor,
}: MonacoEditorOptions | MonacoDiffEditorOptions): Promise<MonacoEditor | MonacoDiffEditor> {
	element.textContent = 'Loading...';
	element.style.padding = '1rem';
	element.style.fontFamily = 'monospace';
	const monaco = await loadMonaco();

	element.textContent = '';
	element.style.padding = '';
	const language = init.language;

	const options = {
		value: init.value,
		theme: 'vs',
		language,
		automaticLayout: true,
		tabSize: 2,
		fontSize: 12,
		minimap: {
			enabled: false,
		},
		quickSuggestions: false,
		colorDecorators: false,
		renderControlCharacters: false,
		renderIndentGuides: false,
		renderValidationDecorations: 'on' as const,
		renderWhitespace: 'boundary' as const,
		scrollBeyondLastLine: false,
		scrollbar: { alwaysConsumeMouseWheel: false },
	};

	if (useDiffEditor) {
		const diffEditor = monaco.editor.createDiffEditor(element, {
			originalEditable: true,
			...options,
		});
		const original = monaco.editor.createModel(init.value, language);
		const modified = monaco.editor.createModel(init.value, language);

		const leftEditor = diffEditor.getOriginalEditor();
		const rightEditor = diffEditor.getModifiedEditor();

		rightEditor.updateOptions({ readOnly: true });
		diffEditor.setModel({ original, modified });
		original.onDidChangeContent(() => {
			const value = original.getValue();

			listeners?.onChangeValue?.(value);
		});

		const result: MonacoDiffEditor = {
			setModelLanguage: (lang) => {
				for (const model of [original, modified]) {
					monaco.editor.setModelLanguage(model, lang);
				}
			},
			setLeftValue: (value) => {
				updateValue(leftEditor, value);
			},
			getLeftValue: () => original.getValue(),
			setRightValue: (value) => {
				updateValue(rightEditor, value);
			},
			setLeftMarkers: (markers) => {
				void updateMarkers(leftEditor, markers);
			},
			setRightMarkers: (markers) => {
				void updateMarkers(rightEditor, markers);
			},
			getLeftEditor: () => leftEditor,
			getRightEditor: () => rightEditor,

			disposeEditor: () => {
				leftEditor.getModel()?.dispose();
				rightEditor.getModel()?.dispose();
				leftEditor.dispose();
				rightEditor.dispose();
				diffEditor.dispose();
			},
		};

		return result;
	}

	const standaloneEditor = monaco.editor.create(element, options);

	standaloneEditor.onDidChangeModelContent(() => {
		const value = standaloneEditor.getValue();

		listeners?.onChangeValue?.(value);
	});

	const result: MonacoEditor = {
		setModelLanguage: (lang) => {
			const model = standaloneEditor.getModel();

			if (model) {
				monaco.editor.setModelLanguage(model, lang);
			}
		},
		setValue: (value) => {
			updateValue(standaloneEditor, value);
		},
		getValue: () => standaloneEditor.getValue(),
		setMarkers: (markers) => {
			void updateMarkers(standaloneEditor, markers);
		},
		getEditor: () => standaloneEditor,

		disposeEditor: () => {
			standaloneEditor.getModel()?.dispose();
			standaloneEditor.dispose();
		},
	};

	return result;

	/** Update value */
	function updateValue(editor: editor.IStandaloneCodeEditor, value: string) {
		const old = editor.getValue();

		if (old !== value) {
			editor.setValue(value);
		}
	}

	/** Update markers */
	function updateMarkers(editor: editor.IStandaloneCodeEditor, markers: editor.IMarkerData[]) {
		const model = editor.getModel()!;
		const id = editor.getId();

		monaco.editor.setModelMarkers(
			model,
			id,
			JSON.parse(JSON.stringify(markers)) as editor.IMarkerData[],
		);
	}
}
