/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == 'undefined') {
  window.Shopify = {}
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments)
  }
}

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i]
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i
      return i
    }
  }
}

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent('on' + eventName, callback)
}

Shopify.postLink = function (path, options) {
  options = options || {}
  var method = options['method'] || 'post'
  var params = options['parameters'] || {}

  var form = document.createElement('form')
  form.setAttribute('method', method)
  form.setAttribute('action', path)

  for (var key in params) {
    var hiddenField = document.createElement('input')
    hiddenField.setAttribute('type', 'hidden')
    hiddenField.setAttribute('name', key)
    hiddenField.setAttribute('value', params[key])
    form.appendChild(hiddenField)
  }
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid)
  this.provinceEl = document.getElementById(province_domid)
  this.provinceContainer = document.getElementById(
    options['hideElement'] || province_domid
  )

  Shopify.addListener(
    this.countryEl,
    'change',
    Shopify.bind(this.countryHandler, this)
  )

  this.initCountry()
  this.initProvince()
}

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute('data-default')
    Shopify.setSelectorByValue(this.countryEl, value)
    this.countryHandler()
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute('data-default')
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value)
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex]
    var raw = opt.getAttribute('data-provinces')
    var provinces = JSON.parse(raw)

    this.clearOptions(this.provinceEl)
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none'
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option')
        opt.value = provinces[i][0]
        opt.innerHTML = provinces[i][1]
        this.provinceEl.appendChild(opt)
      }

      this.provinceContainer.style.display = ''
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild)
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option')
      opt.value = values[i]
      opt.innerHTML = values[i]
      selector.appendChild(opt)
    }
  },
}

Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
     return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (!this.querySelector('slideshow-component') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.grid__item')) {
            this.classList.add('product-recommendations--loaded');
          }
        })
        .catch(e => {
          console.error(e);
        });
    }

    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class DeferredMedia extends HTMLElement {
  constructor() {
    super()
    this.querySelector('[id^="Deferred-Poster-"]')?.addEventListener(
      'click',
      this.loadContent.bind(this)
    )
  }

  loadContent() {
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div')
      content.appendChild(
        this.querySelector('template').content.firstElementChild.cloneNode(true)
      )

      this.setAttribute('loaded', true)
      //window.pauseAllMedia()
      this.appendChild(
        content.querySelector('video, model-viewer, iframe')
      ).focus()

      setTimeout(() => {
        const video = this.querySelector('template').nextElementSibling
        video.muted = video.dataset.muted === 'true'
        video.play()
      })
    }
  }
}

customElements.define('deferred-media', DeferredMedia)

class VideoHover extends HTMLElement {
  constructor() {
    super();
    this.video = this.querySelector('.js-video')

    this.resizeFunction();
    window.addEventListener('resize', this.resizeFunction.bind(this));
  }

  onClick() {
    this.classList.contains('open')
      ? this.close()
      : this.open();
  }

  close() {
    this.classList.remove('open')
    this.video.pause()
  }

  open() {
    this.classList.add('open')
    this.video.play()
  }

  resizeFunction() {
    let mobile = window.matchMedia('(max-width: 990px)').matches;
    if (mobile) {
      this.addEventListener(
        'click',
        this.onClick.bind(this)
      )
    } else {
      this.addEventListener(
        'mouseover',
        this.open.bind(this)
      )
      this.addEventListener(
        'mouseout',
        this.close.bind(this)
      )
    }
  }
}

customElements.define('video-hover', VideoHover);

class VariantSelects extends HTMLElement {
  constructor() {
    super();

    this.swatchFirst = this.querySelector('.js-swatch-first')
    this.swatchSecond = this.querySelector('.js-swatch-second')
    this.swatchThird = this.querySelector('.js-swatch-third')
    this.swatchElement = this.querySelectorAll('.js-swatch-element')

    this.swatchLvlFirst = false
    this.swatchLvlSecond = false
    this.swatchLvlThird = false

    this.getVariantList = {}
    
    this.initSwatch()
    
  }


  initSwatch() {
    this.getVariantData()
    this.createNewListVariant(this.variantData)

    // Event handler for product option buttons
    const handleClick = (event) => {
      if (event.target.tagName === "INPUT") {
        const firstElement = event.target.closest('.js-swatch-first');
        const secondElement = event.target.closest('.js-swatch-second');
        const thirdElement = event.target.closest('.js-swatch-third');

        let firstValue, secondValue, thirdValue

        if (firstElement) {
          firstValue = event.target.value;
          secondValue = undefined;
          thirdValue = undefined;
        }

        if (secondElement) {
          firstValue = this.getActiveSwatchValue(this.swatchFirst);
          secondValue = event.target.value;
          thirdValue = undefined;
        }

        if (thirdElement) {
          firstValue = this.getActiveSwatchValue(this.swatchFirst);
          secondValue = this.getActiveSwatchValue(this.swatchSecond);
          thirdValue = event.target.value;
        }

        if (this.swatchLvlFirst && !this.swatchLvlSecond) {
          this.updateSwatchLvlFirst(firstValue)
          this.getAvailableVariant()
        }

        if (this.swatchLvlFirst && this.swatchLvlSecond && !this.swatchLvlThird) {
          this.updateSwatchLvlSecond(firstValue, secondValue)
          this.getAvailableVariant()
        }

        if (this.swatchLvlFirst && this.swatchLvlSecond && this.swatchLvlThird) {
          this.updateSwatchLvlThird(firstValue, secondValue, thirdValue)
          this.getAvailableVariant()
        }
      }
    }

    // Installing event handlers on product option buttons
    this.swatchElement.forEach((element) => {
      element.addEventListener('click', handleClick);
    })

    //Check the level First of available buttons
    if (this.swatchLvlFirst && !this.swatchLvlSecond) {
      this.updateSwatchLvlFirst();
    }

    //Check the level Second of available buttons
    if (this.swatchLvlFirst && this.swatchLvlSecond && !this.swatchLvlThird) {
      this.updateSwatchLvlSecond();
    }

    //Check the level Third of available buttons
    if (this.swatchLvlFirst && this.swatchLvlSecond && this.swatchLvlThird) {
      this.updateSwatchLvlThird();
    }

  }

  getActiveSwatchValue(swatch) {
    const activeElement = swatch.querySelector('.js-swatch-element.active')
    return activeElement ? activeElement.firstElementChild.value : undefined
  }

  updateSwatchLvlFirst(firstValue) {
    const availableFirst = Object.keys(this.getVariantList).filter(item => this.getVariantList[item].available)
    const firstSelected = firstValue !== undefined ? firstValue : availableFirst[0]

    this.availableSwatchFirst(availableFirst, firstSelected)
  }

  updateSwatchLvlSecond(firstValue,secondValue) {
    const availableFirst = Object.keys(this.getVariantList).filter((first) => {
      const second = this.getVariantList[first]
      return Object.keys(second).some((item) => second[item].available)
    })
    const firstSelected = firstValue !== undefined ? firstValue : availableFirst[0]
    
    this.availableSwatchFirst(availableFirst, firstSelected)

    this.availableHiddenButtonSwatchSecond(firstSelected)

    const availableSecond = Object.keys(this.getVariantList[firstSelected]).filter((item) => {
      return this.getVariantList[firstSelected][item].available
    })
    const secondSelected = secondValue !== undefined ? secondValue : availableSecond[0]

    this.availableSwatchSecond(availableSecond, secondSelected)
  }

  updateSwatchLvlThird(firstValue,secondValue,thirdValue) {
    const availableFirst = Object.keys(this.getVariantList).filter(first => {
      return Object.values(this.getVariantList[first]).some(second => {
        return Object.values(second).some(third => third.available)
      })
    })
    const firstSelected = firstValue !== undefined ? firstValue : availableFirst[0]

    this.availableSwatchFirst(availableFirst, firstSelected)

    

    this.availableHiddenButtonSwatchSecond(firstSelected)

    const availableSecond = Object.keys(this.getVariantList[firstSelected]).filter((item) => {
      const third = this.getVariantList[firstSelected][item]
      return Object.keys(third).some((item) => third[item].available)
    })
    const secondSelected = secondValue !== undefined ? secondValue : availableSecond[0]

    this.availableSwatchSecond(availableSecond, secondSelected)

    this.availableHiddenButtonSwatchThird(firstSelected,secondSelected)

    const availableThird = Object.keys(this.getVariantList[firstSelected][secondSelected]).filter((item) => {
      return this.getVariantList[firstSelected][secondSelected][item].available
    })
    const thirdSelected = thirdValue !== undefined ? thirdValue : availableThird[0]

    this.availableSwatchThird(availableThird, thirdSelected)
    
  }

  availableSwatchFirst(availableFirst, firstSelected) {
    this.swatchFirst.querySelectorAll('[data-lvl-first]').forEach(element => {
      const item = element.dataset.lvlFirst
      element.classList.toggle('available', availableFirst.includes(item))
      element.classList.toggle('unavailable', !availableFirst.includes(item))
    })

    availableFirst.forEach((item) => {
      const button = this.swatchFirst.querySelector(`[data-lvl-first="${item}"]`)
      const details = this.swatchFirst.querySelector('.js-swatch-header em')

      button.classList.remove('active')

      if (item === firstSelected) {
        button.classList.add("active")
        button.firstElementChild.checked = true
        details.textContent = item
      }
    })
  }

  availableSwatchSecond(availableSecond, secondSelected) {
    this.swatchSecond.querySelectorAll('[data-lvl-second]').forEach(element => {
      const item = element.dataset.lvlSecond
      element.classList.toggle('available', availableSecond.includes(item))
      element.classList.toggle('unavailable', !availableSecond.includes(item))
    })

    availableSecond.forEach((item) => {
      const button = this.swatchSecond.querySelector(`[data-lvl-second="${item}"]`)
      const details = this.swatchSecond.querySelector('.js-swatch-header em')

      if (item === secondSelected) {
        button.classList.add('active')
        button.firstElementChild.checked = true
        details.textContent = item
      } 
    })
  }

  availableSwatchThird(availableThird, thirdSelected) {
    this.swatchThird.querySelectorAll('[data-lvl-third]').forEach(element => {
      const item = element.dataset.lvlThird
      element.classList.toggle('available', availableThird.includes(item))
      element.classList.toggle('unavailable', !availableThird.includes(item))
    })

    availableThird.forEach((item) => {
      const button = this.swatchThird.querySelector(`[data-lvl-third="${item}"]`)
      const details = this.swatchThird.querySelector('.js-swatch-header em')

      button.classList.add('active')
        if (item === thirdSelected) {
          button.classList.add('active')
          button.firstElementChild.checked = true
          details.textContent = item
        } 
    })
  }

  availableHiddenButtonSwatchSecond(firstSelected) {
    this.swatchSecond.querySelectorAll('.js-swatch-element').forEach(element => {
      let value = element.getAttribute('data-value')
      element.classList.remove('hidden')
      element.classList.remove('active')
      if(!this.getVariantList[firstSelected].hasOwnProperty(value)) {
        element.classList.add('hidden')
      }
    })
  }

  availableHiddenButtonSwatchThird(firstSelected,secondSelected) {
    this.swatchThird.querySelectorAll('.js-swatch-element').forEach(element => {
      let value = element.getAttribute('data-value')
      element.classList.remove('hidden')
      element.classList.remove('active')

      if(!this.getVariantList[firstSelected][secondSelected].hasOwnProperty(value)) {
        element.classList.add('hidden')
      }
    })
  }

  createNewListVariant(variantData) {
    for (let i = 0; i < variantData.length; i++) {
      let option1 = variantData[i].option1;
      let option2 = variantData[i].option2;
      let option3 = variantData[i].option3;
      let available = variantData[i].available;
      
      if (option1) {
        this.swatchLvlFirst = true
      }
      if (option2) {
        this.swatchLvlSecond = true
      }
      if (option3) {
        this.swatchLvlThird = true
      }
    
      const lvlFirst = this.getVariantList[option1] || {}
      const lvlSecond = lvlFirst[option2] || {}
      const lvlThird = lvlSecond[option3] || {}
      
      if (option3) {
        //check availability level 3
        lvlSecond[option3] = {
          ...lvlThird,
          available: available,
        }
        lvlFirst[option2] = lvlSecond;
        this.getVariantList[option1] = lvlFirst;
      } else if (option2) {
        //check availability level 2
        lvlFirst[option2] = {
          ...lvlSecond,
          available: available,
        }
        this.getVariantList[option1] = lvlFirst;
      } else {
        //check availability level 1
        this.getVariantList[option1] = {
          ...lvlFirst,
          available: available,
        }
      }
    }
  }

  
  getAvailableVariant() {
    const selectedOptions = []
    const products = this.variantData
    this.swatchElement.forEach(element => {
      let radio = element.firstElementChild
      if (radio.checked) {
        selectedOptions.push(radio.value);
      }
    })

    // Filtering the data array by the selected options
    this.availableVariant = products.filter(product => {
      return selectedOptions.every((option, index) => {
        return product.options[index] === option;
      });
    });

    console.log(this.availableVariant);
  }

  updateURL() {
    if (!this.currentVariant) return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);
