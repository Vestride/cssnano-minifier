let css;
let filename;
let currentPreset = 'default';

function readFileAsText(file) {
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

function getOptions() {
  return {
    preset: document.getElementById('preset').value,
  };
}

function getMinifiedCss(data = {
  preset: currentPreset,
  text: css,
  name: filename,
}) {
  return fetch('/api', {
    method: 'post',
    body: JSON.stringify(data),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  }).then((response) => {
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
  });
}

function setOutput(json) {
  document.querySelector('output').textContent = json.error ?
    `${json.error.name}: ${json.error.reason}` :
    json.text;
}

/**
 * @param {File} file
 */
async function send(file) {
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

function handleDragOver(evt) {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
  document.body.classList.add('can-drop');
}

function handleDragCancel(evt) {
  evt.preventDefault();
  document.body.classList.remove('can-drop');
}

function handleDrop(evt) {
  evt.preventDefault();
  document.body.classList.remove('can-drop');
  const file = evt.dataTransfer.files[0];
  send(file);
}

document.getElementById('the-file').addEventListener('change', (evt) => {
  const file = evt.target.files[0];
  send(file);
});

// When the preset option changes, send another request to the server to get new css.
document.getElementById('preset').addEventListener('change', async (evt) => {
  currentPreset = evt.currentTarget.value;
  if (css) {
    setOutput(await getMinifiedCss());
  }
});

document.body.addEventListener('dragover', handleDragOver);
document.body.addEventListener('dragleave', handleDragCancel);
document.body.addEventListener('drop', handleDrop);

document.querySelector('.show-options').addEventListener('click', (evt) => {
  const willShow = !document.body.classList.contains('options-visible');
  const button = evt.currentTarget;
  const optionsPanel = document.getElementById('options-panel');
  button.textContent = willShow ? button.dataset.hideContent : button.dataset.showContent;
  document.body.classList.toggle('options-visible');
  button.setAttribute('aria-expanded', willShow);
  optionsPanel.setAttribute('aria-hidden', !willShow);
});
