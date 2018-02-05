import CodeMirror from 'codemirror';
import 'codemirror/mode/css/css';
import DragAndDrop from './drag-and-drop';

interface ApiResponse {
  text?: string;
  map?: string;
  error?: {
    name: string;
    reason: string;
  };
};

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
  editor: CodeMirror;

  constructor() {
    document.getElementById('preset').addEventListener('change', this._handlePresetChange.bind(this));
    document.querySelector('.show-options').addEventListener('click', this._handleOptionsToggle.bind(this));
    document.querySelector('.output').addEventListener('focus', this._selectOutputText.bind(this));
    document.getElementById('paste-input').addEventListener('input', this._handlePasteInputChange.bind(this));

    this.dragAndDrop = new DragAndDrop();
    this.dragAndDrop.on('droppedfile', this._handleDrop.bind(this));

    const outputEditor = document.querySelector('.output textarea');
    this.editor = CodeMirror.fromTextArea(outputEditor, {
      mode: 'text/css',
      lineNumbers: true,
      lineWrapping: true,
      viewportMargin: Infinity,
    });
  }

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      // Resolve promise when the reader finishes.
      reader.onload = () => {
        resolve(reader.result);
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
    const response = await fetch('/api', {
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
    const content = json.error ?
      `${json.error.name}: ${json.error.reason}` :
      json.text
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

  _handleOptionsToggle(evt: MouseEvent): void {
    const willShow = !document.body.classList.contains('options-visible');
    const button = evt.currentTarget as HTMLButtonElement;
    const optionsPanel = document.getElementById('options-panel');
    button.textContent = willShow ? button.dataset.hideContent : button.dataset.showContent;
    document.body.classList.toggle('options-visible');
    button.setAttribute('aria-expanded', willShow.toString());
    optionsPanel.setAttribute('aria-hidden', (!willShow).toString());
  }

  _selectOutputText(evt: FocusEvent): void {
    setTimeout(() => {
      (evt.target as HTMLTextAreaElement).select();
    }, 0);
  }

  _handleDrop(data: { file: File }) {
    this.send(data.file);
  }

  _handlePasteInputChange(evt: KeyboardEvent) {
    const input = (evt.target as HTMLInputElement);
    this.state.text = input.value;
    this.state.filename = 'pasted-css.css';
    console.log('changed:', this.state.text);
    input.value = '';
    this.setMinifiedOutputFromState();
  }
}

new App();
