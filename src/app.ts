import './style.css';
import 'codemirror/lib/codemirror.css';
import DragAndDrop from './drag-and-drop';
import SidePanel from './side-panel';

interface ApiResponse {
  text?: string;
  map?: string;
  error?: {
    name: string;
    reason: string;
  };
}

interface State {
  text: string;
  filename: string;
  preset: string;
}

class App {
  state: State = {
    text: '',
    filename: '',
    preset: 'default',
  };
  dragAndDrop: DragAndDrop;
  panel: SidePanel;
  editor: any;
  clipboard: any;

  constructor() {
    document.getElementById('preset').addEventListener('change', this._handlePresetChange.bind(this));
    document.getElementById('paste-input').addEventListener('input', this._handlePasteInputChange.bind(this));

    this.dragAndDrop = new DragAndDrop();
    this.dragAndDrop.on('droppedfile', this._handleDrop.bind(this));
    this.panel = new SidePanel();

    const outputEditor: HTMLTextAreaElement = document.querySelector('.output textarea');

    import(/* webpackChunkName: 'codemirror' */ './codemirror').then(({ default: CodeMirror }) => {
      this.editor = CodeMirror.fromTextArea(outputEditor, {
        mode: 'text/css',
        lineNumbers: true,
        lineWrapping: true,
        viewportMargin: Infinity,
        dragDrop: false,
      });
    });

    import(/* webpackChunkName: 'clipboard' */ 'clipboard').then(({ default: ClipboardJS }) => {
      const _this = this;
      this.clipboard = new ClipboardJS('.copy-code', {
        text() {
          return _this.editor.getValue();
        },
      });
    });
  }

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      // Resolve promise when the reader finishes.
      reader.onload = () => {
        resolve(reader.result as string);
      };

      // Start reader.
      reader.readAsText(file);
    });
  }

  getOptions(): { preset: string } {
    const select = document.getElementById('preset') as HTMLSelectElement;
    return {
      preset: select.value,
    };
  }

  async getMinifiedCss(data?: State): Promise<ApiResponse> {
    const response = await fetch('/api/minify', {
      method: 'post',
      body: JSON.stringify(data || this.state),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    });

    // Handle "payload too large" response which is not json.
    if (response.status === 413) {
      return {
        error: {
          name: 'Error',
          reason: response.statusText,
        },
      };
    }

    return response.json();
  }

  setOutput(json: ApiResponse): void {
    const content = json.error ? `${json.error.name}: ${json.error.reason}` : json.text;
    this.editor.setValue(content);
  }

  async setMinifiedOutputFromState(): Promise<void> {
    return this.setOutput(await this.getMinifiedCss());
  }

  async send(file: File): Promise<void> {
    const { preset } = this.getOptions();
    const text = await this.readFileAsText(file);
    this.state.text = text;
    this.state.filename = file.name;
    this.setMinifiedOutputFromState();
  }

  // When the preset option changes, send another request to the server to get new css.
  _handlePresetChange(evt: Event): void {
    this.state.preset = (evt.currentTarget as HTMLSelectElement).value;
    if (this.state.text) {
      this.setMinifiedOutputFromState();
    }
  }

  _handleDrop(data: { file: File }) {
    this.send(data.file);
    this.panel.toggle(false);
  }

  _handlePasteInputChange(evt: KeyboardEvent) {
    const input = evt.target as HTMLInputElement;
    this.state.text = input.value.trim();
    this.state.filename = 'pasted-css.css';
    input.blur();
    if (this.state.text) {
      input.value = '';
      this.setMinifiedOutputFromState();
      this.panel.toggle(false);
    }
  }
}

new App();
