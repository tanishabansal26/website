/* ===========================================================
   SETTINGS: paste your Google Analytics 4 Measurement ID below
   (looks like G-ABC123XYZ9). Leave as is until you have one.
   =========================================================== */
var GA_ID = "G-XXXXXXXXXX";

(function () {
  // ---------- Google Analytics 4 ----------
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  if (GA_ID && GA_ID.indexOf("XXXX") === -1) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  var KEY = "mizu_cart_v1";
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function money(n) { return "\u20B9" + n.toLocaleString("en-IN"); }
  function el(id) { return document.getElementById(id); }

  function render() {
    var box = el("cartItems"), total = 0, count = 0;
    box.innerHTML = "";
    if (!cart.length) {
      box.innerHTML = '<p class="empty">Your cart is empty. Add a product to get started.</p>';
    }
    cart.forEach(function (it) {
      total += it.price * it.qty; count += it.qty;
      var d = document.createElement("div");
      d.className = "line";
      d.innerHTML =
        "<div><b></b><div class='qty'><button aria-label='Decrease quantity'>&minus;</button><span></span><button aria-label='Increase quantity'>+</button><button class='rm'>Remove</button></div></div><div></div>";
      d.querySelector("b").textContent = it.name;
      d.querySelector(".qty span").textContent = it.qty;
      d.lastChild.textContent = money(it.price * it.qty);
      var b = d.querySelectorAll("button");
      b[0].onclick = function () { change(it.id, -1); };
      b[1].onclick = function () { change(it.id, 1); };
      b[2].onclick = function () { remove(it.id); };
      box.appendChild(d);
    });
    el("cartTotal").textContent = money(total);
    el("cartCount").textContent = count;
  }

  function change(id, d) {
    cart.forEach(function (it) { if (it.id === id) it.qty += d; });
    cart = cart.filter(function (it) { return it.qty > 0; });
    save(); render();
  }
  function remove(id) { cart = cart.filter(function (it) { return it.id !== id; }); save(); render(); }

  function add(card) {
    var id = card.dataset.id, name = card.dataset.name, price = Number(card.dataset.price);
    var found = cart.filter(function (it) { return it.id === id; })[0];
    if (found) found.qty++; else cart.push({ id: id, name: name, price: price, qty: 1 });
    save(); render();
    gtag("event", "add_to_cart", {
      currency: "INR", value: price,
      items: [{ item_id: id, item_name: name, price: price, quantity: 1 }]
    });
  }

  var lastFocus;
  function openCart() {
    lastFocus = document.activeElement;
    el("drawer").classList.add("open");
    el("drawer").setAttribute("aria-hidden", "false");
    el("overlay").hidden = false;
    el("orderMsg").textContent = "";
    el("cartClose").focus();
  }
  function closeCart() {
    el("drawer").classList.remove("open");
    el("drawer").setAttribute("aria-hidden", "true");
    el("overlay").hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var card = t.closest && t.closest(".product");
    if (t.classList.contains("js-add") && card) {
      add(card);
      t.textContent = "Added";
      setTimeout(function () { t.textContent = "Add to Cart"; }, 1200);
    } else if (t.classList.contains("js-buy") && card) {
      add(card); openCart();
      gtag("event", "buy_now_click", { item_id: card.dataset.id, item_name: card.dataset.name });
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    el("cartOpen").onclick = openCart;
    el("cartClose").onclick = closeCart;
    el("overlay").onclick = closeCart;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });

    el("checkoutBtn").onclick = function () {
      var msg = el("orderMsg");
      if (!cart.length) { msg.className = "order-msg err"; msg.textContent = "Add a product before placing an order."; return; }
      var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
      gtag("event", "purchase", {
        transaction_id: "T" + Date.now(), currency: "INR", value: total,
        items: cart.map(function (i) { return { item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty }; })
      });
      cart = []; save(); render();
      msg.className = "order-msg";
      msg.textContent = "Thank you! Your order is placed (demo). We will email you the details.";
    };

    // mobile menu
    var mb = document.querySelector(".menu-btn"), nav = el("nav");
    mb.onclick = function () {
      var open = nav.classList.toggle("open");
      mb.setAttribute("aria-expanded", open);
    };

    // enquiry form
    var f = el("enquiry");
    if (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = el("formMsg"), ok = true;
        ["name", "email", "message"].forEach(function (n) {
          var field = f.elements[n];
          var bad = !field.value.trim() || (n === "email" && !/^\S+@\S+\.\S+$/.test(field.value));
          field.classList.toggle("bad", bad);
          if (bad) ok = false;
        });
        if (!ok) { m.className = "order-msg err"; m.textContent = "Please fill in your name, a valid email and a message."; return; }
        gtag("event", "generate_lead", { form_id: "enquiry", interest: f.elements.interest.value });
        var body = "Name: " + f.elements.name.value + "\nEmail: " + f.elements.email.value +
          "\nPhone: " + f.elements.phone.value + "\nInterested in: " + f.elements.interest.value +
          "\n\n" + f.elements.message.value;
        window.location.href = "mailto:hello@mizuskin.example?subject=" +
          encodeURIComponent("Website enquiry from " + f.elements.name.value) + "&body=" + encodeURIComponent(body);
        m.className = "order-msg";
        m.textContent = "Thank you! Your email app should open with your enquiry ready to send.";
        f.reset();
      });
    }
    render();
  });
})();
