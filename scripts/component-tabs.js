class TabElement extends HTMLElement {
  constructor() {
    super()

    this.tabs = [...this.querySelectorAll('.js-tab')]
    this.tabList = this.querySelector('.js-tablist')
    this.tabPanels = [...this.querySelectorAll('.js-tabpanel')]
    this.mobileOnly = this.dataset.mobileOnly

    this.tabs.forEach((tab) => {
      tab.addEventListener(
        'click',
        ((event) => {
          this.showTabPanel(event, tab)
        }).bind(this)
      )
    })

    this.tabList.addEventListener('keydown', (e) => {
      this.onKeydown(e)
    })

    if (this.mobileOnly) {
      this.resizeFunction()
      window.addEventListener('resize', this.resizeFunction)
    }
  }

  get autofocus() {
    return this.getAttribute('autofocus')
  }

  showTabPanel = (event, button) => {
    event.preventDefault()

    // close any open tabs and reset tab button
    this.tabPanels.forEach((tabPanel) => {
      tabPanel.classList.add('hidden')
      tabPanel.removeAttribute('tabindex')
      tabPanel.setAttribute('aria-hidden', true)
    })

    this.tabs.forEach((tab) => {
      tab.setAttribute('aria-selected', 'false')
      tab.classList.remove('active')
    })

    // find panel to open through the aria-controls of the clicked tab button
    var tabPanelToOpen = document.getElementById(
      button.getAttribute('aria-controls')
    )
    // open selected tab and set focus on content so user bypasses other tabs
    tabPanelToOpen.classList.remove('hidden')
    tabPanelToOpen.setAttribute('tabindex', -1)
    tabPanelToOpen.setAttribute('aria-hidden', false)
    if (!this.autofocus) {
      tabPanelToOpen.focus()
    }

    // highlight open tab button and update aria
    button.setAttribute('aria-selected', 'true')
    button.classList.add('active')
  }

  onKeydown = (e) => {
    if (e.keyCode === 39 || e.keyCode === 37) {
      var selected = document.activeElement

      // move right on right arrow
      if (e.keyCode === 39) {
        if (selected.nextElementSibling) {
          selected.nextElementSibling.click()
          selected.nextElementSibling.focus()
        }

        // move left on left arrow
      } else if (e.keyCode === 37) {
        if (selected.previousElementSibling) {
          selected.previousElementSibling.click()
          selected.previousElementSibling.focus()
        }
      }
    }
  }

  resizeFunction = () => {
    const mobile = window.matchMedia('(max-width: 429px)').matches

    // On desktop, hide the tab triggers, since they're redundant - all tab panels are visible. On mobile, add the event trigger
    mobile
      ? (this.tabList.classList.remove('hidden'),
        this.tabList.setAttribute('aria-hidden', false))
      : (this.tabList.classList.add('hidden'),
        this.tabList.setAttribute('aria-hidden', true))

    // On desktop, show all tab panels and remove aria attributes. On mobile, hide all tab panels and then show the first one, and add back aria attributes
    this.tabPanels.forEach((tabPanel, i) => {
      const tabId = tabPanel.id.split('-')[0]
      mobile
        ? (tabPanel.classList.add('hidden'),
          tabPanel.setAttribute('aria-hidden', true),
          i == 0 && tabPanel.classList.remove('hidden'),
          i == 0 && tabPanel.setAttribute('aria-hidden', false),
          tabPanel.setAttribute('role', 'tabpanel'),
          tabPanel.setAttribute('aria-labelledby', `${tabId}-tab`))
        : (tabPanel.classList.remove('hidden'),
          tabPanel.setAttribute('aria-hidden', false),
          tabPanel.removeAttribute('role'),
          tabPanel.removeAttribute('aria-labelledby'))
    })

    // The tab triggers are hidden on desktop, so nothing needs to happen. On mobile, hide all tab triggers and then show the first one
    this.tabs.forEach((tab, i) => {
      if (mobile) {
        tab.classList.remove('active')
        i == 0 && tab.classList.add('active')
      }
    })
  }
}

customElements.define('tab-element', TabElement)
