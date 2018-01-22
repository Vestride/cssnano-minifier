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

/**
 * @param {File} file
 */
async function send(file) {
  const result = await readFileAsText(file);

  const data = {
    name: file.name,
    text: result,
  };

  const json = await fetch('/api', {
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

  const text = json.error ? `${json.error.name}: ${json.error.reason}` : json.text;

  document.querySelector('output').textContent = text;
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

document.body.addEventListener('dragover', handleDragOver);
document.body.addEventListener('dragleave', handleDragCancel);
document.body.addEventListener('drop', handleDrop);

/*
document.querySelector('.show-options').addEventListener('click', (evt) => {
  const willShow = !document.body.classList.contains('options-visible');
  const button = evt.currentTarget;
  const optionsPanel = document.querySelector('.options-panel');
  button.textContent = willShow ? button.dataset.hideContent : button.dataset.showContent;
  document.body.classList.toggle('options-visible');
  button.setAttribute('aria-expanded', willShow);
  optionsPanel.setAttribute('aria-hidden', !willShow);
});
*/
