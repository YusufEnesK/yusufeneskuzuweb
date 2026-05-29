// Bu dosya tüm sayfalarda kullanılacak JavaScript mantığını içerir.

// ================================================================
// SEPET DEPOLAMA - localStorage, file:// protokolunde bloklanirsa
// otomatik olarak hafiza ici (in-memory) yedege gecer
// ================================================================
var _memoryCart = [];
var _useLocalStorage = false;

try {
  localStorage.setItem('_test', '1');
  localStorage.removeItem('_test');
  _useLocalStorage = true;
} catch (e) {
  _useLocalStorage = false;
}

function getCartItems() {
  if (_useLocalStorage) {
    try {
      var stored = localStorage.getItem('cartItems');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return _memoryCart;
    }
  }
  return _memoryCart;
}

function saveCartItems(items) {
  _memoryCart = items;
  if (_useLocalStorage) {
    try {
      localStorage.setItem('cartItems', JSON.stringify(items));
    } catch (e) { /* sessizce devam et */ }
  }
}

// ================================================================
// SEPET BADGE - navbar'daki urun sayaci
// ================================================================
function updateCartBadge() {
  var items = getCartItems();
  var totalCount = 0;
  for (var i = 0; i < items.length; i++) {
    totalCount += items[i].quantity;
  }
  var badge = document.getElementById('cartBadge');
  if (badge) {
    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.style.display = 'inline-block';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }
}

// ================================================================
// TOAST BILDIRIMI - alert() yerine kosede cikan bildirim
// ================================================================
function showToast(message) {
  var toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 2500);
}

// ================================================================
// SEPETE EKLE
// ================================================================
function addToCart(productName, price) {
  var cartItems = getCartItems();
  var found = false;
  for (var i = 0; i < cartItems.length; i++) {
    if (cartItems[i].name === productName) {
      cartItems[i].quantity += 1;
      found = true;
      break;
    }
  }
  if (!found) {
    cartItems.push({ name: productName, price: price, quantity: 1 });
  }
  saveCartItems(cartItems);
  updateCartDisplay();
  updateCartBadge();
  showToast(productName + ' sepete eklendi!');
}

// ================================================================
// SEPETTEN KALDIR
// ================================================================
function removeFromCart(productName) {
  var cartItems = getCartItems();
  var newCart = [];
  for (var i = 0; i < cartItems.length; i++) {
    if (cartItems[i].name !== productName) {
      newCart.push(cartItems[i]);
    }
  }
  saveCartItems(newCart);
  updateCartDisplay();
  updateCartBadge();
}

// ================================================================
// MIKTAR DEGISTIR
// ================================================================
function changeQuantity(productName, delta) {
  var cartItems = getCartItems();
  for (var i = 0; i < cartItems.length; i++) {
    if (cartItems[i].name === productName) {
      cartItems[i].quantity += delta;
      if (cartItems[i].quantity <= 0) {
        removeFromCart(productName);
        return;
      }
      break;
    }
  }
  saveCartItems(cartItems);
  updateCartDisplay();
  updateCartBadge();
}

// ================================================================
// SEPET GORUNTUSUNU GUNCELLE (sadece sepet.html'de calisir)
// ================================================================
function updateCartDisplay() {
  var container = document.getElementById('cartItems');
  if (!container) return;

  var cartItems = getCartItems();
  container.innerHTML = '';

  if (cartItems.length === 0) {
    var emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="5" style="text-align:center;color:#888;padding:28px;">Sepetiniz bos. <a href="urunler.html" style="color:#3b82f6;">Urunlere goz at</a></td>';
    container.appendChild(emptyRow);
    var s = document.getElementById('cartTotal');
    if (s) s.textContent = '0 TL';
    return;
  }

  var total = 0;
  for (var i = 0; i < cartItems.length; i++) {
    var item = cartItems[i];
    var itemTotal = item.price * item.quantity;
    total += itemTotal;

    var row = document.createElement('tr');
    // Ozel karakterleri kacat
    var safeName = item.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    row.innerHTML =
      '<td>' + item.name + '</td>' +
      '<td>' +
        '<div class="quantity-controls">' +
          '<button class="qty-btn" onclick="changeQuantity(\'' + safeName + '\', -1)">&#8722;</button>' +
          '<span>' + item.quantity + '</span>' +
          '<button class="qty-btn" onclick="changeQuantity(\'' + safeName + '\', 1)">+</button>' +
        '</div>' +
      '</td>' +
      '<td>' + item.price + ' TL</td>' +
      '<td>' + itemTotal + ' TL</td>' +
      '<td><button class="remove-btn" onclick="removeFromCart(\'' + safeName + '\')">Kaldir</button></td>';
    container.appendChild(row);
  }

  var cartTotalSpan = document.getElementById('cartTotal');
  if (cartTotalSpan) cartTotalSpan.textContent = total + ' TL';
}

// ================================================================
// INDIRIM KODU
// ================================================================
function applyCouponCode() {
  var couponInput = document.getElementById('couponCode');
  var couponMessage = document.getElementById('couponMessage');
  var cartTotalSpan = document.getElementById('cartTotal');
  if (!couponInput || !couponMessage || !cartTotalSpan) return;

  var code = couponInput.value.trim().toUpperCase();
  var currentTotal = parseInt(cartTotalSpan.textContent);

  if (isNaN(currentTotal) || currentTotal === 0) {
    couponMessage.textContent = 'Sepetiniz bos, once urun ekleyin.';
    couponMessage.style.color = '#d97706';
    return;
  }

  if (code === 'ETICARET10') {
    var discount = 10;
    var newTotal = currentTotal - discount;
    if (newTotal < 0) newTotal = 0;
    cartTotalSpan.textContent = newTotal + ' TL';
    couponMessage.textContent = '10 TL indirim uygulandi! Yeni toplam: ' + newTotal + ' TL';
    couponMessage.style.color = 'green';
    couponInput.disabled = true;
    var btn = document.getElementById('applyCoupon');
    if (btn) btn.disabled = true;
  } else if (code === '') {
    couponMessage.textContent = 'Lutfen indirim kodunu giriniz.';
    couponMessage.style.color = '#d97706';
  } else {
    couponMessage.textContent = 'Gecersiz kod. Ipucu: Iletisim sayfasindaki quizi coz!';
    couponMessage.style.color = '#dc2626';
  }
}

// ================================================================
// QUIZ KONTROLU (iletisim.html)
// ================================================================
function checkQuizAnswer() {
  var quizInput = document.getElementById('quizAnswer');
  var quizResult = document.getElementById('quizResult');
  if (!quizInput || !quizResult) return;

  var answer = quizInput.value.trim().toLowerCase();
  if (answer === 'h1' || answer === '<h1>') {
    quizResult.textContent = 'Tebrikler! Dogru cevap. Indirim kodun: ETICARET10';
    quizResult.style.color = 'green';
  } else if (answer === '') {
    quizResult.textContent = 'Lutfen bir cevap giriniz.';
    quizResult.style.color = '#d97706';
  } else {
    quizResult.textContent = 'Yanlis cevap. Tekrar deneyin.';
    quizResult.style.color = '#dc2626';
  }
}

// ================================================================
// SAYFA YUKLENINCE CALIS
// ================================================================
document.addEventListener('DOMContentLoaded', function () {
  // Her sayfada badge guncelle
  updateCartBadge();

  // Sepet sayfasindaysa icerigi goster
  updateCartDisplay();

  // Indirim kodu butonu
  var applyBtn = document.getElementById('applyCoupon');
  if (applyBtn) {
    applyBtn.addEventListener('click', applyCouponCode);
  }

  // Quiz butonu
  var quizBtn = document.getElementById('checkQuiz');
  if (quizBtn) {
    quizBtn.addEventListener('click', checkQuizAnswer);
  }

  // Iletisim formu
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      showToast('Mesajiniz gonderildi! En kisa surede size donecegiz.');
      contactForm.reset();
    });
  }

  // Sepeti temizle butonu
  var clearBtn = document.getElementById('clearCart');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      saveCartItems([]);
      updateCartDisplay();
      updateCartBadge();
      showToast('Sepet temizlendi.');
    });
  }

  // Siparişi onayla butonu
  var confirmBtn = document.getElementById('confirmOrder');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      var cartItems = getCartItems();
      if (cartItems.length === 0) {
        showToast('Sepetiniz boş, onaylanacak sipariş yok.');
        return;
      }
      alert('Sipariş verme işlemi şu anlık gerçekleştirilememektedir.');
    });
  }
});

// ================================================================
// SEPETE EKLE BUTONLARI - event delegation (butun sayfalarda calisir)
// ================================================================
document.addEventListener('click', function (e) {
  var target = e.target;
  if (target && target.classList && target.classList.contains('add-to-cart-btn')) {
    e.preventDefault();
    e.stopPropagation();
    var productName = target.getAttribute('data-product-name');
    var price = parseInt(target.getAttribute('data-price'));
    if (productName && !isNaN(price)) {
      addToCart(productName, price);
    }
  }
}, true);
