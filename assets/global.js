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

class VariantSelects extends HTMLElement {
  constructor() {
    super();

    this.swatchFirst = this.querySelector('.js-swatch-first')
    this.swatchSecond = this.querySelector('.js-swatch-second')
    this.swatchThird = this.querySelector('.js-swatch-third')
    this.swatchElement = this.querySelectorAll('.js-swatch-element')

    this.swatchColor = false
    this.swatchSize = false
    this.swatchFill = false

    this.getVariantList = {}
    
    this.initSwatch()
    
  }


  initSwatch() {
    this.getVariantData()

    this.createNewListVariant(this.variantData)

    if ((this.swatchColor && !this.swatchSize)) {
      console.log('lvl-1')
      const availableColors = Object.entries(this.getVariantList).filter(([color, data]) => data.available).map(([color, data]) => color)

      this.swatchFirst.querySelectorAll('[data-color]').forEach(element => {
        const color = element.dataset.color
        element.classList.toggle('available', availableColors.includes(color))
        element.classList.toggle('unavailable', !availableColors.includes(color))
      });
    }

    if (this.swatchColor && this.swatchSize && !this.swatchFill) {
      console.log('lvl-2')
      const availableColors = Object.keys(this.getVariantList).filter((color) => {
        const sizes = this.getVariantList[color];
        return Object.keys(sizes).some((size) => sizes[size].available);
      });

      this.swatchFirst.querySelectorAll('[data-color]').forEach(element => {
        const color = element.dataset.color
        element.classList.toggle('available', availableColors.includes(color))
        element.classList.toggle('unavailable', !availableColors.includes(color))
      });
      
      const firstColor = availableColors[0];
      console.log(firstColor)
      const availableSizes = Object.keys(this.getVariantList[firstColor]).filter((size) => {
        return this.getVariantList[firstColor][size].available
      })

      this.swatchSecond.querySelectorAll('[data-size]').forEach(element => {
        const size = element.dataset.size
        element.classList.toggle('available', availableSizes.includes(size))
        element.classList.toggle('unavailable', !availableSizes.includes(size))
      });
    }

    if (this.swatchColor && this.swatchSize && this.swatchFill) {
      console.log('lvl-3')
      const availableColors = Object.keys(this.getVariantList).filter(color => {
        return Object.values(this.getVariantList[color]).some(sizes => {
          return Object.values(sizes).some(materials => materials.available)
        })
      })

      this.swatchFirst.querySelectorAll('[data-color]').forEach(element => {
        const color = element.dataset.color
        element.classList.toggle('available', availableColors.includes(color))
        element.classList.toggle('unavailable', !availableColors.includes(color))
      });

      const firstColor = availableColors[0];
      const availableSizes = Object.keys(this.getVariantList[firstColor]).filter((size) => {
        const materials = this.getVariantList[firstColor][size]
        return Object.keys(materials).some((material) => materials[material].available)
      })

      this.swatchSecond.querySelectorAll('[data-size]').forEach(element => {
        const size = element.dataset.size
        element.classList.toggle('available', availableSizes.includes(size))
        element.classList.toggle('unavailable', !availableSizes.includes(size))
      });

      const firstSize = availableSizes[0];
      const availableMaterials = Object.keys(this.getVariantList[firstColor][firstSize]).filter((material) => {
        return this.getVariantList[firstColor][firstSize][material].available
      })

      this.swatchThird.querySelectorAll('[data-material]').forEach(element => {
        const material = element.dataset.material
        element.classList.toggle('available', availableMaterials.includes(material))
        element.classList.toggle('unavailable', !availableMaterials.includes(material))
      });
    }

    

    
  


    // Получить первый доступный цвет

   // const firstColor = Object.keys(this.getVariantList).find((color) => {
      //const sizes = this.getVariantList[color];
      //return Object.keys(sizes).some((size) => {
        //const materials = sizes[size];
        //return Object.keys(materials).some((material) => materials[material].available);
      //});
    //});

    // Получить список доступных размеров для первого доступного цвета

    //const availableSizes = Object.keys(this.getVariantList[firstColor]).filter((size) => {
      //const materials = this.getVariantList[firstColor][size];
      //return Object.keys(materials).some((material) => materials[material].available);
   // });

    // Получить список доступных материалов для первого доступного размера

    //const firstSize = availableSizes[0];
    //const availableMaterials = Object.keys(this.getVariantList[firstColor][firstSize]).filter((material) => {
      //return this.getVariantList[firstColor][firstSize][material].available;
    //});

    // Отметить кнопки на странице, соответствующие доступным свойствам

    //availableColors.forEach((color) => {
      //console.log(color)
      //const colorButton = this.swatchFirst.querySelector(`[data-color="${color}"]`)
      
      //if (color === firstColor) {
        //colorButton.classList.add("active");
        //colorButton.firstElementChild.checked = true;
      //} else {
        //colorButton.classList.add("visible");
      //}
    //});

   // console.log(availableSizes)

    //availableSizes.forEach((size) => {
      //const sizeButton = this.swatchSecond.querySelector(`[data-size="${size}"]`);

     // if (size === firstSize) {
        //sizeButton.classList.add("active");
        //sizeButton.firstElementChild.checked = true;
      //} else {
        //sizeButton.classList.add("visible");
      //}
    //});


    //const firstMaterials = availableMaterials[0];
    //availableMaterials.forEach((material) => {
     // const materialButton = this.swatchThird.querySelector(`[data-material="${material}"]`);

     // materialButton.classList.add("active");
     // if (material === firstMaterials) {
        //materialButton.classList.add("active");
        //materialButton.firstElementChild.checked = true;
     // } else {
       // materialButton.classList.add("visible");
     //}
   // });


    

    //console.log(this.getSecondList)
    //console.log(this.getThirdList)

    this.swatchElement.forEach((element) => { 
      element.addEventListener('click', (event) => {

        if (event.target.tagName === "INPUT") {
          let radio = event.target.value
          let details = event.target.closest('.swatch').querySelector('.js-swatch-header em')
          //console.log(event.target)
          details.textContent = radio
          
          if (event.target.closest('.js-swatch-color')) {
            
            //this.updateSwatchSize(event)
          }

          if (event.target.closest('.js-swatch-size')) {
            //this.updateSwatchFill()
          }

        }
      })
    })
  }

  createNewListVariant(variantData) {
    for (let i = 0; i < variantData.length; i++) {
      let color = variantData[i].option1;
      let size = variantData[i].option2;
      let material = variantData[i].option3;
      let available = variantData[i].available;
      if (color) {
        this.swatchColor = true
      }
      if (size) {
        this.swatchSize = true
      }
      if (material) {
        this.swatchFill = true
      }
            
      // если объект для этого цвета еще не создан, создаем его

      if (!this.getVariantList[color]) {
        if (size || material ) {
          this.getVariantList[color] = {}
        }else {
          this.getVariantList[color] = {
            available: available
          }
        }
        
      }
      
      // если массив для этого размера еще не создан, создаем его

      if (!this.getVariantList[color][size]) {
        if (material ) {
          this.getVariantList[color][size] = {}
        }else {
          this.getVariantList[color][size] = {
            available: available
          }
        }
      }
      
      // добавляем свойство для этого материала

      if (!this.getVariantList[color][size][material]) {
        if (material ) {
          this.getVariantList[color][size][material] = {
            available: available
          }
        }
      }
    }
  }

  updateSwatchSize(event) {
    this.getSizeList = JSON.parse(event.target.parentElement.getAttribute('data-variant-size'))
    this.getFillList = JSON.parse(event.target.parentElement.getAttribute('data-variant-fill'))

    if (this.getSizeList != null)  {
      this.swatchSize.querySelectorAll('.js-swatch-element').forEach((element) => { 
        element.classList.remove('hidden')
        let key = element.getAttribute('data-value')
        if (!this.getSizeList.includes(key)) {
          element.classList.add('hidden')
        }
      })
    }
  }

  updateSwatchFill() {
    if (this.getFillList != null)  {
      this.swatchFill.querySelectorAll('.js-swatch-element').forEach((element) => {
        element.classList.remove('hidden')
        let key = radio+':'+element.getAttribute('data-value')
        if (!this.getFillList.includes(key)) {
          element.classList.add('hidden')
        }
      })
    }
  }
  
  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateURL() {
    if (!this.currentVariant) return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);
