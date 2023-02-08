class HeaderSearch extends HTMLElement {
  constructor() {
    super()
    this.isOpen = false
    this.route = '/search/suggest'
    this.cachedResults = {}
    this.input = this.querySelector('.search_wrapper input[type="search"]')
    this.headerSearchResults = this.querySelector('.results')
    this.headerSearchSuggestions = this.querySelector('.suggestions')
    this.headerSearchFocusable = this.querySelector('.search-modal__focusable')
    this.suggestionButtons = this.querySelectorAll(
      '.search-modal__suggested button'
    )

    this.modal = this.closest('.search-modal')
    this.setupEventListeners()
  }

  setupEventListeners() {
    const form = this.querySelector('form.search')
    form.addEventListener('submit', this.onFormSubmit.bind(this))

    this.input.addEventListener(
      'input',
      this.debounce((event) => {
        this.onChange(event)
      }, 300).bind(this)
    )
    this.input.addEventListener('focus', this.onFocus.bind(this))

    this.suggestionButtons.forEach((button) => {
      button.addEventListener(
        'click',
        ((event) => {
          event.preventDefault()
          if (button.dataset.term.length) {
            this.input.value = button.dataset.term
            this.updateTermButtonState(button)
            this.onChange(event)
          }
        }).bind(this)
      )
    })

    document.addEventListener('details-closed', this.close.bind(this, true))
  }

  disconnectedCallback() {
    document.removeEventListener('details-closed', this.close)
  }

  getQuery() {
    return this.input.value.trim()
  }

  onChange() {
    const searchTerm = this.getQuery()

    if (!searchTerm.length) {
      this.close(true)
      return
    }

    if (searchTerm.length < 3) {
      this.close()
      return
    }

    this.resetSuggestions()
    this.getSearchResults(searchTerm)
  }

  resetSuggestions() {
    this.suggestionButtons.forEach((button) => {
      if (this.getQuery() !== button.dataset.term) {
        button.removeAttribute('disabled')
      }
    })
  }

  onFormSubmit(event) {
    if (!this.getQuery().length) event.preventDefault()
  }

  onFocus() {
    const searchTerm = this.getQuery()
    if (!searchTerm.length) return
    if (searchTerm.length < 3) return
    if (this.getAttribute('results') === 'true') {
      this.open()
    } else {
      this.getSearchResults(searchTerm)
    }
  }

  updateTermButtonState(button) {
    if (this.getQuery() === button.dataset.term) {
      button.setAttribute('disabled', true)
    }
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(' ', '-').toLowerCase()
    this.setLiveRegionLoadingState()

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey])
      return
    }

    fetch(
      `${this.route}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent(
        'resources[type]'
      )}=product,article,collection,page&${encodeURIComponent(
        'resources[options][fields]'
      )}=body,product_type,tag,title,variants.barcode,variants.sku,variants.title,vendor,author&section_id=header-search`
    )
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status)
          this.close()
          throw error
        }

        return response.text()
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-header-search').innerHTML
        this.cachedResults[queryKey] = resultsMarkup
        this.renderSearchResults(resultsMarkup)
      })
      .catch((error) => {
        this.close()
        throw error
      })
  }

  setLiveRegionLoadingState() {
    this.setAttribute('loading', true)
  }

  renderSearchResults(resultsMarkup) {
    this.headerSearchResults.innerHTML = resultsMarkup
    this.setAttribute('results', true)

    this.setLiveRegionResults()
    this.open()
  }

  setLiveRegionResults() {
    this.removeAttribute('loading')
  }

  open() {
    this.setAttribute('open', true)
    this.input.setAttribute('aria-expanded', true)
    this.isOpen = true
    this.modal.classList.add('search-modal__full')
    trapFocus(this.headerSearchFocusable, this.input)
  }

  close(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = ''
      this.cachedResults = {}
      this.removeAttribute('results')
      this.resetSuggestions()
    }

    this.input.setAttribute('aria-activedescendant', '')
    this.removeAttribute('open')
    this.input.setAttribute('aria-expanded', false)

    this.isOpen = false
    this.modal.classList.remove('search-modal__full')
  }

  debounce = (fn, wait) => {
    let t
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn.apply(this, args), wait)
    }
  }
}

customElements.define('header-search', HeaderSearch)
