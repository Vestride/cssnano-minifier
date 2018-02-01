import CodeMirror from 'codemirror';
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

  constructor() {
    document.getElementById('preset').addEventListener('change', this.handlePresetChange.bind(this));
    document.querySelector('.show-options').addEventListener('click', this.handleOptionsToggle.bind(this));
    document.querySelector('.output').addEventListener('focus', this.selectOutputText.bind(this));
    this.dragAndDrop = new DragAndDrop();
    this.dragAndDrop.on('droppedfile', this._handleDrop.bind(this));
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

    console.log(response.bodyUsed);

    // Handle "payload too large" response which is not json.
    if (response.status === 413) {
      return {
        error: {
          name: 'Error',
          reason: response.statusText,
        },
      };
    }

    console.log(response.bodyUsed);

    return response.json();
  }

  setOutput(json: ApiResponse): void {
    const output = document.querySelector('.output') as HTMLTextAreaElement;
    output.value = json.error ?
      `${json.error.name}: ${json.error.reason}` :
      json.text;
  }

  async send(file: File) {
    const { preset } = this.getOptions();
    const text = await this.readFileAsText(file);
    this.state.text = text;
    this.state.filename = file.name;

    this.setOutput(await this.getMinifiedCss());
  }

  // When the preset option changes, send another request to the server to get new css.
  async handlePresetChange(evt: Event): Promise<void> {
    this.state.preset = (evt.currentTarget as HTMLSelectElement).value;
    if (this.state.text) {
      this.setOutput(await this.getMinifiedCss());
    }
  }

  handleOptionsToggle(evt: MouseEvent): void {
    const willShow = !document.body.classList.contains('options-visible');
    const button = evt.currentTarget as HTMLButtonElement;
    const optionsPanel = document.getElementById('options-panel');
    button.textContent = willShow ? button.dataset.hideContent : button.dataset.showContent;
    document.body.classList.toggle('options-visible');
    button.setAttribute('aria-expanded', willShow.toString());
    optionsPanel.setAttribute('aria-hidden', (!willShow).toString());
  }

  selectOutputText(evt: FocusEvent): void {
    setTimeout(() => {
      (evt.target as HTMLTextAreaElement).select();
    }, 0);
  }

  _handleDrop(data: { file: File }) {
    this.send(data.file);
  }
}

new App();
