export default class SidePanel {
  element: HTMLElement;
  button: HTMLButtonElement;
  underlay: HTMLElement;

  constructor() {
    this.element = document.getElementById('side-panel');
    this.underlay = document.querySelector('.underlay');
    this.button = document.querySelector('.toggle-panel');
    this.handleClick = this.handleClick.bind(this);
    this.underlay.addEventListener('click', this.handleClick)
    this.button.addEventListener('click', this.handleClick);
  }

  handleClick(evt: MouseEvent) {
    this.toggle();
  }

  toggle(willShow = document.body.classList.contains('panel-hidden')): void {
    this.button.textContent = willShow ? this.button.dataset.hideContent : this.button.dataset.showContent;
    document.body.classList.toggle('panel-hidden', !willShow);
    this.button.setAttribute('aria-expanded', willShow.toString());
    this.element.setAttribute('aria-hidden', (!willShow).toString());
  }
}
