const storeSection = document.getElementById("store");
const startButton = document.getElementById("start-shopping");
const productGrid = document.getElementById("product-grid");
const cartList = document.getElementById("cart-items");
const checkoutButton = document.getElementById("checkout");
const statusBox = document.getElementById("status");
const totalHtEl = document.getElementById("total-ht");
const totalTvaEl = document.getElementById("total-tva");
const totalTtcEl = document.getElementById("total-ttc");
const searchInput = document.getElementById("search-product");
const scanButton = document.getElementById("scan-button");
const cashierSelect = document.getElementById("cashier");
const customerInput = document.getElementById("customer");

const cart = new Map();

function animateStore() {
  if (!storeSection) return;
  storeSection.classList.remove("hidden");
  requestAnimationFrame(() => storeSection.classList.add("visible"));
}

startButton?.addEventListener("click", animateStore);

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function updateTotals() {
  let totalHt = 0;
  let totalTva = 0;

  cart.forEach((item) => {
    totalHt += item.price_ht * item.quantity;
    totalTva += item.price_ht * item.quantity * item.vat_rate;
  });

  const totalTtc = totalHt + totalTva;
  totalHtEl.textContent = formatCurrency(totalHt);
  totalTvaEl.textContent = formatCurrency(totalTva);
  totalTtcEl.textContent = formatCurrency(totalTtc);
  checkoutButton.disabled = cart.size === 0;
}

function renderCart() {
  cartList.innerHTML = "";
  cart.forEach((item, key) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.dataset.productId = key;
    li.innerHTML = `
      <div>
        <div class="name">${item.name}</div>
        <div class="meta">${item.unit_quantity} ${item.unit} · TVA ${(item.vat_rate * 100).toFixed(1)}%</div>
      </div>
      <div class="quantity">
        <label>Qté</label>
        <input type="number" min="0.1" step="0.1" value="${item.quantity}" />
        <button type="button">Retirer</button>
      </div>
      <div class="price">${formatCurrency(item.price_ht * (1 + item.vat_rate))}</div>
    `;

    const quantityInput = li.querySelector("input");
    quantityInput.addEventListener("input", () => {
      const value = parseFloat(quantityInput.value);
      if (Number.isFinite(value) && value > 0) {
        cart.get(key).quantity = value;
        updateTotals();
      }
    });

    const removeButton = li.querySelector("button");
    removeButton.addEventListener("click", () => {
      cart.delete(key);
      renderCart();
      updateTotals();
    });

    cartList.appendChild(li);
  });
}

function addToCart(product, quantity) {
  const key = product.id;
  const current = cart.get(key);
  if (current) {
    current.quantity += quantity;
  } else {
    cart.set(key, { ...product, quantity });
  }
  renderCart();
  updateTotals();
  showStatus(`${product.name} ajouté au panier`, "success");
}

function getCardData(card) {
  return {
    id: Number(card.dataset.productId),
    name: card.querySelector("h3").textContent,
    code: card.querySelector(".code").textContent,
    price_ht: parseFloat(card.querySelector(".price").textContent),
    vat_rate: parseFloat(card.querySelector(".vat").textContent.replace(/[^0-9.,]/g, "")) / 100,
    unit: card.querySelector(".unit").textContent.split(" ").pop(),
    unit_quantity: parseFloat(card.querySelector(".unit").textContent),
    origin: card.querySelector(".origin").textContent.replace("Origine : ", ""),
  };
}

productGrid?.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  const card = button.closest(".product-card");
  const quantityInput = card.querySelector("input[type='number']");
  const quantity = parseFloat(quantityInput.value) || 1;
  const product = getCardData(card);
  addToCart(product, quantity);
  quantityInput.value = "1";
});

async function lookupProduct(query) {
  const response = await fetch("/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Impossible d'ajouter cet article");
  }

  const payload = await response.json();
  if (payload.created) {
    await refreshCatalog();
  }
  return payload.product;
}

async function refreshCatalog() {
  const response = await fetch("/api/products");
  const products = await response.json();
  productGrid.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;
    card.innerHTML = `
      <header>
        <h3>${product.name}</h3>
        <span class="code">${product.code}</span>
      </header>
      <div class="details">
        <p class="price">${product.price_ht.toFixed(2)} € HT</p>
        <p class="vat">TVA ${(product.vat_rate * 100).toFixed(1)}%</p>
        <p class="unit">${product.unit_quantity} ${product.unit}</p>
        <p class="origin">Origine : ${product.origin}</p>
      </div>
      <footer>
        <label>Quantité</label>
        <input type="number" step="0.1" min="0.1" value="1" />
        <button class="add-to-cart">Ajouter</button>
      </footer>
    `;
    productGrid.appendChild(card);
  });
}

async function handleScan() {
  const query = searchInput.value.trim();
  if (!query) {
    showStatus("Saisissez un nom de produit.", "error");
    return;
  }
  try {
    const product = await lookupProduct(query);
    addToCart(product, 1);
    searchInput.value = "";
  } catch (error) {
    showStatus(error.message, "error");
  }
}

scanButton?.addEventListener("click", handleScan);
searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleScan();
  }
});

function showStatus(message, type = "info") {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  if (message) {
    setTimeout(() => {
      if (statusBox.textContent === message) {
        statusBox.textContent = "";
        statusBox.className = "status";
      }
    }, 4000);
  }
}

checkoutButton?.addEventListener("click", async () => {
  if (cart.size === 0) return;
  const items = Array.from(cart.entries()).map(([productId, item]) => ({
    productId,
    quantity: item.quantity,
    name: item.name,
  }));

  const payload = {
    customer: customerInput?.value || "",
    cashierId: Number(cashierSelect?.value),
    items,
  };

  try {
    checkoutButton.disabled = true;
    checkoutButton.textContent = "Encaissement...";
    const response = await fetch("/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Impossible de finaliser la commande");
    }

    const data = await response.json();
    window.location.href = data.redirect;
  } catch (error) {
    showStatus(error.message, "error");
    checkoutButton.disabled = false;
    checkoutButton.textContent = "Encaisser";
  }
});

const showTextButton = document.getElementById("show-text");
const textTicket = document.getElementById("text-ticket");
showTextButton?.addEventListener("click", () => {
  if (!textTicket) return;
  textTicket.classList.toggle("hidden");
  showTextButton.textContent = textTicket.classList.contains("hidden")
    ? "Voir le ticket texte"
    : "Masquer le ticket texte";
});
