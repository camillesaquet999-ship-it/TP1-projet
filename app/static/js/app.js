const bootstrap = window.storeBootstrap || { products: [], cashiers: [] };
let products = bootstrap.products || [];
const cashiers = bootstrap.cashiers || [];

const TILE_SIZE = 64;
const MAP_LAYOUT = [
  "########################",
  "#....FFFF....BBBB....C.#",
  "#....FFFF....BBBB....C.#",
  "#......................#",
  "#..GGGG....SSSS....DD..#",
  "#..GGGG....SSSS....DD..#",
  "#......................#",
  "#..TTTT....P...........#",
  "#...................E..#",
  "########################",
];

const storeMapEl = document.getElementById("store-map");
const entityLayerEl = document.getElementById("entity-layer");
const playerEl = document.getElementById("player");
const cartList = document.getElementById("cart-items");
const totalHtEl = document.getElementById("total-ht");
const totalTvaEl = document.getElementById("total-tva");
const totalTtcEl = document.getElementById("total-ttc");
const checkoutButton = document.getElementById("checkout");
const statusBox = document.getElementById("status");
const customerInput = document.getElementById("customer");

const shelfModal = document.getElementById("shelf-modal");
const shelfTitleEl = document.getElementById("shelf-title");
const shelfDescriptionEl = document.getElementById("shelf-description");
const shelfProductsEl = document.getElementById("shelf-products");
const shelfSearchInput = document.getElementById("shelf-search");

const chatModal = document.getElementById("chat-modal");
const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const checkoutModal = document.getElementById("checkout-modal");
const checkoutCaption = document.getElementById("checkout-caption");
const checkoutItemsEl = document.getElementById("checkout-items");
const modalTotalHtEl = document.getElementById("modal-total-ht");
const modalTotalTvaEl = document.getElementById("modal-total-tva");
const modalTotalTtcEl = document.getElementById("modal-total-ttc");
const modalCustomerInput = document.getElementById("modal-customer");
const confirmCheckoutButton = document.getElementById("confirm-checkout");
const checkoutStatus = document.getElementById("checkout-status");

const charPositions = new Map();
const blockedChars = new Set(["#", "F", "B", "G", "S", "D", "T", "C", "P"]);

const shelfDefinitions = [
  {
    char: "F",
    title: "Fruits & légumes",
    description: "Des étals colorés et croquants, parfaits pour des salades vitaminées.",
    keywords: ["pomme", "banane", "tomate", "salade", "carotte", "fruits", "légumes", "poire", "kiwi", "ananas"],
  },
  {
    char: "B",
    title: "Boulangerie & douceurs",
    description: "Pain doré, pâtisseries et biscuits croustillants tout juste sortis du four.",
    keywords: ["pain", "baguette", "brioche", "gâteau", "biscuit", "viennoiserie", "croissant", "madeleine"],
  },
  {
    char: "G",
    title: "Épicerie fine",
    description: "Conserves, pâtes, sauces et ingrédients pour sublimer vos plats maison.",
    keywords: ["pâte", "riz", "sauce", "huile", "épice", "conserve", "pois", "lentille", "haricot"],
  },
  {
    char: "S",
    title: "Snacking & plaisirs sucrés",
    description: "Chocolats, biscuits et gourmandises pour une pause bien méritée.",
    keywords: ["chocolat", "bonbon", "snack", "biscuits", "barre", "sucré", "dessert", "cookies"],
  },
  {
    char: "D",
    title: "Frais & crèmerie",
    description: "Produits laitiers, fromages et œufs pour des recettes fondantes.",
    keywords: ["fromage", "yaourt", "beurre", "lait", "crème", "oeuf", "œuf"],
  },
  {
    char: "T",
    title: "Boissons & rafraîchissements",
    description: "Sodas, jus pressés et boissons chaudes pour toutes les envies.",
    keywords: ["jus", "soda", "cola", "limonade", "thé", "café", "boisson", "eau"],
  },
];

const state = {
  cart: new Map(),
  player: { x: 1, y: 1 },
  selectedCashier: null,
  activeModal: null,
};

function initialiseMap() {
  if (!storeMapEl) return;
  const rows = MAP_LAYOUT.length;
  const cols = MAP_LAYOUT[0].length;
  storeMapEl.style.setProperty("--cols", cols);
  storeMapEl.style.setProperty("--rows", rows);
  entityLayerEl.style.width = `${cols * TILE_SIZE}px`;
  entityLayerEl.style.height = `${rows * TILE_SIZE}px`;

  MAP_LAYOUT.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      const tileType = mapCharToTile(char);
      tile.classList.add(tileType);
      storeMapEl.appendChild(tile);
      if (!charPositions.has(char)) {
        charPositions.set(char, []);
      }
      charPositions.get(char).push({ x, y });
    });
  });

  const exitPositions = charPositions.get("E") || [];
  if (exitPositions.length) {
    const exit = exitPositions[0];
    const startX = Math.max(1, exit.x - 1);
    state.player = { x: startX, y: exit.y };
  }

  positionElement(playerEl, state.player.x, state.player.y);
  createCashierCharacters();
  createChatbotCharacter();
}

function mapCharToTile(char) {
  switch (char) {
    case "#":
      return "tile-wall";
    case "F":
      return "tile-shelf";
    case "B":
      return "tile-bakery";
    case "G":
      return "tile-grocery";
    case "S":
      return "tile-snacks";
    case "D":
      return "tile-dairy";
    case "T":
      return "tile-drinks";
    case "C":
      return "tile-cashier";
    case "P":
      return "tile-chatbot";
    case "E":
      return "tile-exit";
    default:
      return "tile-floor";
  }
}

function positionElement(element, x, y) {
  if (!element) return;
  element.style.transform = `translate(${x * TILE_SIZE}px, ${y * TILE_SIZE}px)`;
}

function createCashierCharacters() {
  const positions = charPositions.get("C") || [];
  positions.forEach((pos, index) => {
    if (!cashiers.length) return;
    const cashier = cashiers[index % cashiers.length];
    const element = document.createElement("div");
    element.className = "character cashier";
    element.dataset.cashierId = String(cashier.id);
    element.dataset.index = String(index);

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = "💳";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = cashier.display_name;

    element.appendChild(bubble);
    element.appendChild(label);
    entityLayerEl.appendChild(element);
    positionElement(element, pos.x, pos.y);
  });
}

function createChatbotCharacter() {
  const positions = charPositions.get("P") || [];
  if (!positions.length) return;
  const pos = positions[0];
  const element = document.createElement("div");
  element.className = "character npc chatbot";
  element.dataset.role = "chatbot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = "🤖";

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = "Mia";

  element.appendChild(bubble);
  element.appendChild(label);
  entityLayerEl.appendChild(element);
  positionElement(element, pos.x, pos.y);
}

function attemptMove(dx, dy) {
  const target = { x: state.player.x + dx, y: state.player.y + dy };
  if (!isWalkable(target.x, target.y)) return;
  state.player = target;
  positionElement(playerEl, state.player.x, state.player.y);
}

function isWalkable(x, y) {
  if (y < 0 || y >= MAP_LAYOUT.length) return false;
  if (x < 0 || x >= MAP_LAYOUT[0].length) return false;
  const char = MAP_LAYOUT[y][x];
  return !blockedChars.has(char);
}

const MOVES = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  z: { dx: 0, dy: -1 },
  s: { dx: 0, dy: 1 },
  q: { dx: -1, dy: 0 },
  d: { dx: 1, dy: 0 },
};

function handleKeydown(event) {
  if (state.activeModal) return;
  const lower = event.key.toLowerCase();
  if (MOVES[event.key]) {
    event.preventDefault();
    const move = MOVES[event.key];
    attemptMove(move.dx, move.dy);
    return;
  }
  if (MOVES[lower]) {
    event.preventDefault();
    const move = MOVES[lower];
    attemptMove(move.dx, move.dy);
    return;
  }
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    handleInteraction();
  }
}

document.addEventListener("keydown", handleKeydown);

function handleInteraction() {
  if (tryShelfInteraction()) return;
  if (tryChatbotInteraction()) return;
  if (tryCashierInteraction()) return;
  if (tryExitInteraction()) return;
  showStatus("Rapproche-toi d'un rayon, d'un caissier ou de Mia pour interagir.", "info");
}

function isAdjacentTo(position) {
  const distance = Math.abs(state.player.x - position.x) + Math.abs(state.player.y - position.y);
  return distance <= 1;
}

function tryShelfInteraction() {
  for (const shelf of shelfDefinitions) {
    const positions = charPositions.get(shelf.char) || [];
    if (positions.some(isAdjacentTo)) {
      openShelfModal(shelf);
      return true;
    }
  }
  return false;
}

function tryChatbotInteraction() {
  const positions = charPositions.get("P") || [];
  if (positions.some(isAdjacentTo)) {
    openChatModal();
    return true;
  }
  return false;
}

function tryCashierInteraction() {
  const positions = charPositions.get("C") || [];
  for (let index = 0; index < positions.length; index += 1) {
    const pos = positions[index];
    if (isAdjacentTo(pos)) {
      const cashier = cashiers[index % cashiers.length];
      if (!cashier) continue;
      state.selectedCashier = cashier;
      updateCheckoutButton();
      openCheckoutModal();
      return true;
    }
  }
  return false;
}

function tryExitInteraction() {
  const positions = charPositions.get("E") || [];
  if (positions.some((pos) => pos.x === state.player.x && pos.y === state.player.y)) {
    showStatus("Bienvenue ! Remontez les rayons pour remplir votre panier.", "info");
    return true;
  }
  return false;
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  state.activeModal = modal;
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  if (state.activeModal === modal) {
    state.activeModal = null;
  }
}

function bindModalClose() {
  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.close;
      if (!target) return;
      closeModal(document.getElementById(target));
    });
  });

  [shelfModal, chatModal, checkoutModal].forEach((modal) => {
    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });
}

function openShelfModal(shelf) {
  if (!shelfModal) return;
  shelfTitleEl.textContent = shelf.title;
  shelfDescriptionEl.textContent = shelf.description;
  shelfSearchInput.value = "";
  renderShelfProducts(shelf, "");
  openModal(shelfModal);
}

function renderShelfProducts(shelf, query) {
  const lowerQuery = (query || "").trim().toLowerCase();
  let filtered = products.filter((product) => {
    const name = product.name.toLowerCase();
    const keywordsMatch = shelf.keywords.some((keyword) => name.includes(keyword));
    return keywordsMatch;
  });

  if (lowerQuery) {
    filtered = filtered.filter((product) => product.name.toLowerCase().includes(lowerQuery));
  }

  if (!filtered.length) {
    filtered = products
      .filter((product) => product.name.toLowerCase().includes(lowerQuery))
      .slice(0, 9);
  }

  shelfProductsEl.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent = "Rien de trouvé. Demande à Mia pour inventer cet article !";
    shelfProductsEl.appendChild(empty);
    return;
  }

  filtered.forEach((product) => {
    shelfProductsEl.appendChild(createProductTile(product));
  });
}

function createProductTile(product) {
  const article = document.createElement("article");
  article.className = "product-tile";
  article.innerHTML = `
    <h3>${product.name}</h3>
    <div class="price">${product.price_ht.toFixed(2)} € HT</div>
    <div class="meta">${product.unit_quantity} ${product.unit} · TVA ${(product.vat_rate * 100).toFixed(1)}%</div>
    <div class="origin">Origine : ${product.origin}</div>
  `;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Ajouter";
  button.addEventListener("click", () => {
    addToCart(product, 1);
  });
  article.appendChild(button);
  return article;
}

shelfSearchInput?.addEventListener("input", () => {
  const shelf = shelfDefinitions.find((definition) => definition.title === shelfTitleEl.textContent);
  if (!shelf) return;
  renderShelfProducts(shelf, shelfSearchInput.value);
});

function openChatModal() {
  if (!chatModal) return;
  if (!chatLog.hasChildNodes()) {
    appendChatMessage("bot", "👋 Salut ! Je suis Mia. Dis-moi ce qu'il te manque et je le créerai en rayon.");
  }
  openModal(chatModal);
  chatInput.focus();
}

function appendChatMessage(author, message) {
  const entry = document.createElement("div");
  entry.className = `chat-message ${author}`;
  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = author === "bot" ? "Mia" : "Vous";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = message;
  entry.appendChild(authorEl);
  entry.appendChild(bubble);
  chatLog.appendChild(entry);
  chatLog.scrollTop = chatLog.scrollHeight;
}

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = chatInput.value.trim();
  if (!query) return;
  appendChatMessage("user", query);
  chatInput.value = "";
  try {
    const product = await lookupProduct(query);
    addToCart(product, 1);
    const createdText = product.created ? "Je viens de l'inventer rien que pour toi !" : "Il était déjà rangé, je te l'ai mis de côté.";
    appendChatMessage(
      "bot",
      `${product.name} est prêt (${product.price_ht.toFixed(2)} € HT). ${createdText}`
    );
  } catch (error) {
    appendChatMessage("bot", error.message || "Oups, quelque chose s'est mal passé.");
  }
});

const cart = state.cart;

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

function renderCart() {
  if (!cartList) return;
  cartList.innerHTML = "";
  cart.forEach((item, key) => {
    const li = document.createElement("li");
    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${item.unit_quantity} ${item.unit} · TVA ${(item.vat_rate * 100).toFixed(1)}%`;
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "0.1";
    quantityInput.step = "0.1";
    quantityInput.value = item.quantity.toString();
    quantityInput.addEventListener("input", () => {
      const value = parseFloat(quantityInput.value);
      if (Number.isFinite(value) && value > 0) {
        cart.get(key).quantity = value;
        updateTotals();
      }
    });

    const removeButton = document.createElement("button");
    removeButton.className = "remove";
    removeButton.type = "button";
    removeButton.textContent = "Retirer";
    removeButton.addEventListener("click", () => {
      cart.delete(key);
      renderCart();
      updateTotals();
    });

    actions.appendChild(quantityInput);
    actions.appendChild(removeButton);
    li.appendChild(info);
    li.appendChild(actions);
    cartList.appendChild(li);
  });
  updateCheckoutButton();
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
  modalTotalHtEl.textContent = formatCurrency(totalHt);
  modalTotalTvaEl.textContent = formatCurrency(totalTva);
  modalTotalTtcEl.textContent = formatCurrency(totalTtc);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function updateCheckoutButton() {
  if (!checkoutButton) return;
  if (!state.selectedCashier) {
    checkoutButton.textContent = "Choisir une caisse";
    checkoutButton.disabled = true;
    return;
  }
  checkoutButton.textContent = `Voir ${state.selectedCashier.display_name}`;
  checkoutButton.disabled = cart.size === 0;
}

checkoutButton?.addEventListener("click", () => {
  if (!state.selectedCashier) {
    showStatus("Approchez-vous d'un caissier pour finaliser vos courses.", "info");
    return;
  }
  if (!cart.size) {
    showStatus("Votre panier est vide, remplissez-le avant de passer en caisse.", "error");
    return;
  }
  openCheckoutModal();
});

function openCheckoutModal() {
  if (!checkoutModal || !state.selectedCashier) return;
  checkoutCaption.textContent = `Vous êtes face à ${state.selectedCashier.display_name}.`; 
  renderCheckoutItems();
  syncCustomerFields();
  checkoutStatus.textContent = "";
  openModal(checkoutModal);
}

function renderCheckoutItems() {
  checkoutItemsEl.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.quantity.toFixed(2)} × ${item.name}</span><strong>${formatCurrency(
      item.quantity * item.price_ht * (1 + item.vat_rate)
    )}</strong>`;
    checkoutItemsEl.appendChild(li);
  });
}

function syncCustomerFields() {
  if (modalCustomerInput && customerInput) {
    modalCustomerInput.value = customerInput.value;
  }
}

customerInput?.addEventListener("input", () => {
  if (modalCustomerInput) {
    modalCustomerInput.value = customerInput.value;
  }
});

modalCustomerInput?.addEventListener("input", () => {
  if (customerInput) {
    customerInput.value = modalCustomerInput.value;
  }
});

confirmCheckoutButton?.addEventListener("click", async () => {
  if (!state.selectedCashier) {
    checkoutStatus.textContent = "Choisissez un caissier.";
    checkoutStatus.className = "status error";
    return;
  }
  if (!cart.size) {
    checkoutStatus.textContent = "Votre panier est vide.";
    checkoutStatus.className = "status error";
    return;
  }
  const items = Array.from(cart.entries()).map(([productId, item]) => ({
    productId,
    quantity: item.quantity,
    name: item.name,
  }));
  const payload = {
    customer: modalCustomerInput?.value || "",
    cashierId: state.selectedCashier.id,
    items,
  };
  try {
    confirmCheckoutButton.disabled = true;
    confirmCheckoutButton.textContent = "Impression...";
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
    checkoutStatus.textContent = error.message;
    checkoutStatus.className = "status error";
    confirmCheckoutButton.disabled = false;
    confirmCheckoutButton.textContent = "Imprimer le ticket";
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
  return { ...payload.product, created: payload.created };
}

async function refreshCatalog() {
  const response = await fetch("/api/products");
  products = await response.json();
}

initialiseMap();
bindModalClose();
renderCart();
updateTotals();
