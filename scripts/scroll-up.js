class ScrollUp extends HTMLElement {
  constructor() {
    super()
    this.addEventListener(
      'click',
      this.scrollWindow.bind(this)
    )
    window.addEventListener(
      'scroll',
      this.scrollBtnDisplay.bind(this)
    )
  }

  scrollBtnDisplay() {
    let rootElement = document.documentElement
    let scrollTotal = rootElement.scrollHeight - rootElement.clientHeight
    if ((rootElement.scrollTop / scrollTotal ) > 0.30 ) {
      this.classList.add("show")
    } else {
      this.classList.remove("show")
    }
  }

  scrollWindow() {
    document.body.scrollIntoView({
      top: 0,
      behavior: "smooth",
    });
  }
}

customElements.define('scroll-up', ScrollUp)
