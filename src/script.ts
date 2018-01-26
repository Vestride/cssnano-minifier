interface ApiResponse {
  text ?: string;
  map ?: string;
  error ?: {
    name: string;
    reason: string;
  };
};

let css: string;
let filename: string;
let currentPreset = 'default';

function readFileAsText(file: File): Promise<string> {
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

function getOptions(): { preset: string } {
  const select = document.getElementById('preset') as HTMLSelectElement;
  return {
    preset: select.value,
  };
}

async function getMinifiedCss(data = {
  preset: currentPreset,
  text: css,
  name: filename,
}): Promise<ApiResponse> {
  const response = await fetch('/api', {
    method: 'post',
    body: JSON.stringify(data),
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

function setOutput(json: ApiResponse): void {
  document.querySelector('output').textContent = json.error ?
    `${json.error.name}: ${json.error.reason}` :
    json.text;
}

async function send(file: File) {
  const { preset } = getOptions();
  const text = await readFileAsText(file);
  css = text;
  filename = file.name;

  setOutput(await getMinifiedCss({
    preset,
    text,
    name: file.name,
  }));
}

function handleDragOver(evt: DragEvent): void {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
  document.body.classList.add('can-drop');
}

function handleDragCancel(evt: DragEvent): void {
  evt.preventDefault();
  document.body.classList.remove('can-drop');
}

function handleDrop(evt: DragEvent): void {
  evt.preventDefault();
  document.body.classList.remove('can-drop');
  send(evt.dataTransfer.files[0]);
}

function handleFileChange(evt: Event): void {
  const file = (evt.target as HTMLInputElement).files[0];
  send(file);
}

// When the preset option changes, send another request to the server to get new css.
async function handlePresetChange(evt: Event): Promise<void> {
  currentPreset = (evt.currentTarget as HTMLSelectElement).value;
  if (css) {
    setOutput(await getMinifiedCss());
  }
}

function handleOptionsToggle(evt: MouseEvent): void {
  const willShow = !document.body.classList.contains('options-visible');
  const button = evt.currentTarget as HTMLButtonElement;
  const optionsPanel = document.getElementById('options-panel');
  button.textContent = willShow ? button.dataset.hideContent : button.dataset.showContent;
  document.body.classList.toggle('options-visible');
  button.setAttribute('aria-expanded', willShow.toString());
  optionsPanel.setAttribute('aria-hidden', (!willShow).toString());
}

document.getElementById('the-file').addEventListener('change', handleFileChange);
document.getElementById('preset').addEventListener('change', handlePresetChange);
document.querySelector('.show-options').addEventListener('click', handleOptionsToggle);
document.body.addEventListener('dragover', handleDragOver);
document.body.addEventListener('dragleave', handleDragCancel);
document.body.addEventListener('drop', handleDrop);
