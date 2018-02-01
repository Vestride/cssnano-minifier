import TinyEmitter from 'tiny-emitter';

export default class DragAndDrop extends TinyEmitter {
  constructor(public dropTarget: HTMLElement = document.body) {
    super();
    const filePicker = this.dropTarget.querySelector('#the-file');
    filePicker.addEventListener('change', this.handleFileChange.bind(this));
    this.dropTarget.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropTarget.addEventListener('dragleave', this.handleDragCancel.bind(this));
    this.dropTarget.addEventListener('drop', this.handleDrop.bind(this));
  }

  handleDragOver(evt: DragEvent): void {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
    this.dropTarget.classList.add('can-drop');
  }

  handleDragCancel(evt: DragEvent): void {
    evt.preventDefault();
    this.dropTarget.classList.remove('can-drop');
  }

  handleDrop(evt: DragEvent): void {
    evt.preventDefault();
    this.dropTarget.classList.remove('can-drop');
    this.emit('droppedfile', {
      file: evt.dataTransfer.files[0],
    });
  }

  handleFileChange(evt: Event): void {
    this.emit('droppedfile', {
      file: (evt.target as HTMLInputElement).files[0],
    });
  }
}
