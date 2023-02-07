class Accordion extends HTMLElement {
  constructor() {
    super()
    
    this.toggle = this.querySelector('.js-accordion-toggle')
    this.content = this.querySelector('.js-accordion-content')
    
    this.toggle.addEventListener('click', this.onClick.bind(this))
    this.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  onClick(event) {
    event.preventDefault()

    event.target.classList.contains('open')
      ? this.close()
      : this.open()
  }

  open() {
    this.toggle.classList.add('open')
    this.content.classList.add('open')
    this.content.style.height = `${this.content.scrollHeight}px`
  }

  close() {
    this.toggle.classList.remove('open')
    this.content.classList.remove('open')
    this.content.style.height = '0'
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return
    if (event.target.classList.contains('js-accordion-toggle') && event.target.classList.contains('open')) {
      this.close()
    }
  }
}

customElements.define('accordion-element', Accordion)
