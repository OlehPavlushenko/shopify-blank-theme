if ( 'liquidAjaxCart' in window ) {
    var recommendProducts = {}
    
    liquidAjaxCart.subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {
      
        if ( requestState.requestType === 'add' ) {
          subscribeToResult( requestState => {
            if ( requestState.responseData?.ok ) {
              let product_key = requestState.responseData.body.id
              let product_id = String(requestState.responseData.body.product_id)

              if ( requestState.responseData.body.items?.length === 1 ) {
                productName = requestState.responseData.body.items[0].title
              }

              recommendProducts[product_key] = product_id
              setCookie('cart_recommend', recommendProducts)
            }
          });
          
        }
        
        if ( requestState.requestType === 'change' ) {
          subscribeToResult( requestState => {
            if ( requestState.responseData?.ok ) {
              let items = requestState.responseData.body.items
              let cartItems = []

              if (items.length === 0) {
                for (const key in recommendProducts) {
                  if (Object.hasOwnProperty.call(recommendProducts, key)) {
                    delete recommendProducts[key]
                  }
                }
                deleteCookie('cart_recommend')
              } else {
                items.forEach(element => {
                  cartItems.push(element.id)
                });

                for (const key in recommendProducts) {
                  if (Object.hasOwnProperty.call(recommendProducts, key)) {
                    if (!cartItems.includes(+key)) {
                     delete recommendProducts[key]
                    }
                  }
                }
              }
              setCookie('cart_recommend', recommendProducts)
            }
          });
        }
        
    })
    
    liquidAjaxCart.cartRequestUpdate()

    if (document.querySelector('.js-cart-drawer-shipping').isConnected) {
      liquidAjaxCart.subscribeToCartStateUpdate( async ( state ) => {
        const shippingTotal = document.querySelector('.js-cart-drawer-shipping').getAttribute('data-total')

        if ( state.status.cartStateSet && !state.status.requestInProgress ) { 
          let currentTotal = state.cart.total_price
          
          calculateProgress(currentTotal, shippingTotal)

          let getCookieValue = getCookie('cart_recommend')

          if (typeof getCookieValue !== 'undefined') {
            if ( (Object.keys(getCookieValue).length !== 0 && getCookieValue.constructor === Object)) {
              let cartIds = []
              for (const key in getCookieValue) {
                if (Object.hasOwnProperty.call(getCookieValue, key)) {
                  const id = getCookieValue[key];
                  cartIds.push(id)
                }
              }

              let handles =  getRecommendProducts(cartIds)
              
              handles.then((result) => {
                let strHandles = result.join('=')
                sentRecommendIds(strHandles)
              })
            } else {
              refreshCookie(state)
            }
          } else {
            refreshCookie(state)
          }
        }
      })
    }
}

async function getRecommendProducts(ids) {
  let productsItems = []
  
  const promise = new Promise(function(resolve) {
    ids.forEach(id => {
      fetch(window.Shopify.routes.root + "recommendations/products.json?product_id="+id+"&limit=4&intent=complementary")
      .then(response => response.json())
      .then(({ products }) => {
        if (products.length > 0) {
          for (const key in products) {
            if (Object.hasOwnProperty.call(products, key)) {
              let element = products[key]
              let handle = String(element.handle)
              if (productsItems.length === 0) {
                productsItems.push(handle)
              } else {
                if (!productsItems.includes(handle)) {
                  productsItems.push(handle)
                }
              }
            }
          }
        }
      });
    });
    setTimeout(() => resolve(productsItems), 1000)
  })
  let result = await promise
  return result
}

function sentRecommendIds(ids) {
  const cartRecommendREsults = document.querySelector('#cart-recommend')
  const imageSize = document.querySelector('#cart-recommend').getAttribute('data-size')

  fetch(window.Shopify.routes.root + "collections/all?section_id=cart-recommend&id="+encodeURIComponent(ids))
  .then(response => response.text())
  .then((text) => {
    const html = document.createElement('div')
    html.innerHTML = text;

    const cartRecommend = html.querySelector('.js-cart-recommend-block')
    
    if (cartRecommend && cartRecommend.innerHTML.trim().length) {
      cartRecommendREsults.innerHTML = cartRecommend.innerHTML

      let cartRecommendREsultsItem = cartRecommendREsults.querySelectorAll('.js-cart-recommend-item')

      cartRecommendREsultsItem.forEach(item => {
        item.querySelector('.card-product__media').classList.add('media__size--'+imageSize)
      });
    }
  })
}

function refreshCookie(state) {
  if ((Object.keys(state.cart).length !== 0 && state.cart.constructor === Object)) {
    state.cart.items.forEach(element => {
      let product_key = element.id
      let product_id = String(element.product_id)

      recommendProducts[product_key] = product_id
      setCookie('cart_recommend', recommendProducts)
    });
  }
}

function setCookie(name, json) {

  let cookieValue = '';
  let expire = '';
  let period = '';
  
  //Specify the cookie name and value
  cookieValue = name + '=' + JSON.stringify(json) + ';';
 
  //Specify the path to set the cookie
  cookieValue += 'path=/ ;';

  //Specify how long you want to keep cookie
  period = 30; //days to store
  expire = new Date();
  expire.setTime(expire.getTime() + 1000 * 3600 * 24 * period);
  expire.toString();
  cookieValue += 'expires=' + expire + ';';

  //console.log('set-'+cookieValue)
  //Set cookie
  document.cookie = cookieValue;
}

function deleteCookie(name) {
  document.cookie = name +"=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function getCookie(name) {
  let cookieValue = '';
  let cookieArray = new Array();

  //Get cookie
  cookieValue = document.cookie;
  
  //Divide the cookie into an array and convert them to JSON
  if(cookieValue){
    cookieArray = cookieValue.split(';');
    for (const iterator in cookieArray) {
      if (cookieArray[iterator].includes(name)) {
        let data = cookieArray[iterator].split('=');
        return  JSON.parse(data[1]);
      }
    }
  }
  ;
}

function calculateProgress(currentVal, targetVal) {
  let progressBar = document.querySelectorAll('.cart-drawer-shippingThreshold__progress')
  let progressNum = document.querySelectorAll('.cart-drawer-shipping__num')
  let progressOuter = document.querySelectorAll('.cart-drawer-shipping__numOuter')
  let successMsg = document.querySelectorAll('.cart-drawer-shipping__success')
  // calculate how far progress is from the total as a percentage
  let result = Math.round(100 * currentVal / targetVal)
  progressBar.forEach(function(el){
    el.setAttribute('style', "width: ".concat(result, "%"))
  })
    // Update the progess text. If threshold is met, show success message
  let newProgressNum = (targetVal - currentVal) / 100     
  if(newProgressNum <= 0){
    successMsg.forEach(function(el){
      el.style.display = 'block'
    });
    progressOuter.forEach(function(el){
      el.style.display = 'none'
    });
    progressNum.forEach(function(el){
      el.textContent = Shopify.formatMoney(newProgressNum * 100)
    });
  } else {
    successMsg.forEach(function(el){
      el.style.display = 'none'
    });
    progressOuter.forEach(function(el){
      el.style.display = 'block'
    });
    progressNum.forEach(function(el){
      el.textContent = Shopify.formatMoney(newProgressNum * 100)
    });
  }
}
