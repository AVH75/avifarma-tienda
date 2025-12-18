// =========================
// ELEMENTOS DEL CARRITO
// =========================
const abrirCarrito       = document.getElementById("abrir-carrito");
const sidebar            = document.getElementById("carrito-sidebar");
const cerrarCarrito      = document.querySelector(".cerrar-carrito");
const carritoItems       = document.getElementById("carrito-items");

const subtotalEl         = document.getElementById("subtotal");
const totalEl            = document.getElementById("total");
const contadorCarrito    = document.getElementById("contador-carrito");

// Campos para descuentos y envío
const descuentoVolumenEl = document.getElementById("descuento-volumen");
const descuentoDirectoEl = document.getElementById("descuento-directo");
const ahorroTotalEl      = document.getElementById("ahorro-total");
const costoEnvioEl       = document.getElementById("costo-envio");

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Catálogo global
let catalogo = [];
if (window.catalogo && Array.isArray(window.catalogo)) catalogo = window.catalogo;

// Escucha evento si catálogo se carga después
document.addEventListener("catalogoListo", () => {
  if (window.catalogo && Array.isArray(window.catalogo)) catalogo = window.catalogo;
  mostrarCarrito();
});

// =========================
// CREAR OVERLAY
// =========================
let overlay = document.getElementById("overlay-carrito");
if (!overlay) {
  overlay = document.createElement("div");
  overlay.id = "overlay-carrito";
  document.body.appendChild(overlay);
}

// =========================
// RENDER PRODUCTOS
// =========================
const contenedorProductos = document.getElementById("productos-grid");
function renderProductos(lista) {
  if (!contenedorProductos) return;
  contenedorProductos.innerHTML = "";

  lista.forEach(producto => {
    const div = document.createElement("div");
    div.classList.add("producto");

    let precioHTML = "";
    if (producto.precio_con_descuento != null) {
      precioHTML = `
        <div class="precio">
          <span class="precio-regular tachado">S/ ${producto.precio.toFixed(2)}</span>
          <span class="precio-descuento">S/ ${producto.precio_con_descuento.toFixed(2)}</span>
        </div>
      `;
    } else {
      precioHTML = `<div class="precio"><span class="precio-regular">S/ ${producto.precio.toFixed(2)}</span></div>`;
    }

    div.innerHTML = `
      <img src="${producto.img}" alt="${producto.nombre}" style="width:120px;height:120px;object-fit:contain;">
      <h4>${producto.nombre}</h4>
      <p>${producto.descripcion || ""}</p>
      ${precioHTML}
      <div class="descuento">${producto.descuento || ""}</div>
      <div class="ahorro">${producto.ahorro ? `Ahorro: S/ ${producto.ahorro.toFixed(2)}` : ""}</div>
      <button class="btn-agregar-carrito" data-id="${producto.id}">Agregar al carrito</button>
    `;

    contenedorProductos.appendChild(div);
  });
}

// =========================
// CALCULAR TOTAL POR PRODUCTO
// =========================
function calcularTotalProducto(producto) {
  const cantidad = producto.cantidad;
  let total = 0;

  // Descuento por volumen
  if (producto.descuentoVolumen) {
    let promo = producto.descuentoVolumen;
    if (Array.isArray(promo)) promo = promo.find(d => d.activa) || null;

    if (promo) {
      const vecesPromo = Math.floor(cantidad / promo.aplicaA);
      const resto = cantidad % promo.aplicaA;
      total = vecesPromo * ((promo.compra * producto.precio) + ((promo.aplicaA - promo.compra) * producto.precio * (1 - promo.promo)));
      total += resto * producto.precio;
    } else {
      total = (producto.precio_con_descuento || producto.precio) * cantidad;
    }
  } else {
    total = (producto.precio_con_descuento || producto.precio) * cantidad;
  }

  return total;
}

// =========================
// ABRIR / CERRAR SIDEBAR
// =========================
function abrirSidebar() {
  if (!sidebar) return;
  sidebar.classList.add("activo");
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
  mostrarCarrito();
  history.pushState({ carritoAbierto: true }, "");
}

function cerrarSidebar() {
  if (!sidebar) return;
  document.activeElement.blur();
  sidebar.classList.remove("activo");
  overlay.classList.remove("show");
  document.body.style.overflow = "auto";
  history.replaceState({}, "");
}

overlay?.addEventListener("click", cerrarSidebar);
abrirCarrito?.addEventListener("click", e => { e.preventDefault(); abrirSidebar(); });
cerrarCarrito?.addEventListener("click", e => { e.preventDefault(); cerrarSidebar(); });
window.addEventListener("popstate", () => { if (sidebar?.classList.contains("activo")) cerrarSidebar(); });
window.addEventListener("pageshow", e => { if (e.persisted) { cerrarSidebar(); mostrarCarrito(); } });

// =========================
// AGREGAR AL CARRITO
// =========================
function agregarAlCarrito(idProducto) {
  if (!catalogo.length) {
    document.addEventListener("catalogoListo", function handler() {
      document.removeEventListener("catalogoListo", handler);
      agregarAlCarrito(idProducto);
    });
    return;
  }

  const producto = catalogo.find(p => p.id == idProducto);
  if (!producto) return mostrarToast("⚠️ Producto no encontrado en catálogo");

  const existe = carrito.find(p => p.id == idProducto);
  const stockDisponible = producto.stock - (existe ? existe.cantidad : 0);

  if (stockDisponible <= 0) return mostrarToast(`Lo sentimos, ${producto.nombre} está agotado 🛑`);

  if (existe) existe.cantidad++;
  else carrito.push({ ...producto, cantidad: 1 });

  guardarCarrito();
  mostrarCarrito();
  actualizarContador();
  mostrarToast(`${producto.nombre} agregado al carrito 🛒`);
}

// =========================
// MOSTRAR CARRITO
// =========================
function mostrarCarrito() {
  if (!carritoItems) return;
  carritoItems.innerHTML = "";

  if (!carrito.length) {
    carritoItems.innerHTML = `<p>Tu carrito está vacío</p>`;
    actualizarTotales();
    actualizarContador();
    return;
  }

  const tabla = document.createElement("table");
  tabla.classList.add("tabla-carrito");

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cantidad</th>
        <th>Precio</th>
        <th>Descuento aplicado</th>
        <th>Acción</th>
      </tr>
    </thead>
    <tbody>
      ${carrito.map((producto, index) => {
        let descuentoAplicado = false;
        if (producto.descuentoVolumen && ((Array.isArray(producto.descuentoVolumen) && producto.cantidad >= producto.descuentoVolumen[0]?.aplicaA) || (!Array.isArray(producto.descuentoVolumen) && producto.cantidad >= producto.descuentoVolumen.aplicaA))) {
          descuentoAplicado = true;
        } else if (producto.precio_con_descuento && producto.precio_con_descuento < producto.precio) descuentoAplicado = true;

        return `
          <tr>
            <td>
              <div class="carrito-item-info">
                <img src="${producto.img}" alt="${producto.nombre}" style="width:60px;height:60px;object-fit:contain;">
                <div>
                  <strong>${producto.nombre}</strong>
                  <p>${producto.descripcion || ""}</p>
                </div>
              </div>
            </td>
            <td>
              <button class="btn-decrementar" data-index="${index}" data-id="${producto.id}">-</button>
              <span>${producto.cantidad}</span>
              <button class="btn-incrementar" data-index="${index}" data-id="${producto.id}">+</button>
            </td>
            <td>S/ ${calcularTotalProducto(producto).toFixed(2)}</td>
            <td>${descuentoAplicado ? "Sí" : "No"}</td>
            <td><button class="carrito-item-close" data-index="${index}">X</button></td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;

  carritoItems.appendChild(tabla);
  carritoItems.style.overflowY = carrito.length >= 2 ? 'auto' : 'hidden';
  actualizarTotales();
  actualizarContador();
  guardarCarrito();
}

// =========================
// EVENTO DE BOTONES EN CARRITO
// =========================
carritoItems?.addEventListener("click", e => {
  const boton = e.target.closest("button");
  if (!boton) return;

  const index = Number(boton.dataset.index);
  if (isNaN(index)) return;

  const producto = carrito[index];
  if (!producto) return;

  // =========================
  // ACCIONES DEL CARRITO
  // =========================
  if (boton.classList.contains("carrito-item-close")) {
    carrito.splice(index, 1);
    mostrarToast(`Se eliminó ${producto.nombre} del carrito 🗑️`);

  } else if (boton.classList.contains("btn-incrementar")) {
    if (producto.cantidad < (producto.stock || 9999)) { // usa stock si está disponible
      producto.cantidad++;
    } else {
      mostrarToast(`Solo hay ${producto.stock || 0} unidades disponibles de ${producto.nombre} 🛑`);
      return;
    }

  } else if (boton.classList.contains("btn-decrementar")) {
    if (producto.cantidad > 1) {
      producto.cantidad--;
    } else {
      mostrarToast("La cantidad mínima es 1 ⚠️");
      return;
    }
  }

  // ✅ No necesitamos buscar el catálogo de nuevo
  // Guardar y actualizar UI
  guardarCarrito();
  mostrarCarrito();
});


// =========================
// GUARDAR EN LOCALSTORAGE
// =========================
function guardarCarrito() {
  try { localStorage.setItem("carrito", JSON.stringify(carrito)); }
  catch (e) { console.error("Error al guardar carrito", e); }
}

// =========================
// TOTALES Y BARRA DE ENVÍO
// =========================
const ENVIO_GRATIS_MINIMO = 99;
function actualizarBarra(totalCarrito) {
  const barraProgreso = document.getElementById("barra-progreso");
  const mensajeEl = document.getElementById("mensaje-envio");

  let porcentaje = Math.min(Math.max((totalCarrito / ENVIO_GRATIS_MINIMO) * 100, 0), 100);
  if (barraProgreso) barraProgreso.style.width = `${porcentaje}%`;

  if (mensajeEl) {
    if (totalCarrito >= ENVIO_GRATIS_MINIMO) {
      mensajeEl.textContent = "🎉 ¡Felicidades, tu compra califica para envío gratis!";
      mensajeEl.classList.add("gratis");
    } else if (totalCarrito > 0) {
      mensajeEl.textContent = `Agrega S/ ${(ENVIO_GRATIS_MINIMO - totalCarrito).toFixed(2)} y obtén envío gratis`;
      mensajeEl.classList.remove("gratis");
    } else {
      mensajeEl.textContent = `Agrega S/ ${ENVIO_GRATIS_MINIMO.toFixed(2)} y obtén envío gratis`;
      mensajeEl.classList.remove("gratis");
    }
  }

  if (costoEnvioEl) costoEnvioEl.textContent = totalCarrito >= ENVIO_GRATIS_MINIMO ? "Gratis" : "--";
}
// =========================
// ACTUALIZAR TOTALES, SUB TOTALES Y DESCUENTOS 
// =========================
function actualizarTotales() {
  let subtotal = 0, descuentoVolumenTotal = 0, descuentoDirectoTotal = 0;

  carrito.forEach(p => {
    const precioNormal = p.precio * p.cantidad;
    const precioConDescuento = calcularTotalProducto(p);
    subtotal += precioNormal;

    if (p.descuentoVolumen && p.cantidad >= (p.descuentoVolumen.aplicaA || p.descuentoVolumen[0]?.aplicaA)) descuentoVolumenTotal += precioNormal - precioConDescuento;
    else if (p.precio_con_descuento && p.precio_con_descuento < p.precio) descuentoDirectoTotal += precioNormal - precioConDescuento;
  });

  const ahorroTotal = descuentoVolumenTotal + descuentoDirectoTotal;
  const totalConDescuentos = subtotal - ahorroTotal;

  if (subtotalEl) subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
  if (descuentoVolumenEl) descuentoVolumenEl.textContent = `S/ ${descuentoVolumenTotal.toFixed(2)}`;
  if (descuentoDirectoEl) descuentoDirectoEl.textContent = `S/ ${descuentoDirectoTotal.toFixed(2)}`;
  if (ahorroTotalEl) ahorroTotalEl.textContent = `S/ ${ahorroTotal.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `S/ ${totalConDescuentos.toFixed(2)}`;

  actualizarBarra(totalConDescuentos);
}

// =========================
// CONTADOR
// =========================
function actualizarContador() {
  const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  if (contadorCarrito) contadorCarrito.textContent = totalItems;

  const contadorInline = document.getElementById("contador-inline");
  if (contadorInline) contadorInline.textContent = `(${totalItems})`;
}

// =========================
// TOAST
// =========================
let toastTimeout = null;
function mostrarToast(mensaje) {
  let toast = document.getElementById("mensajeCarrito");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mensajeCarrito";
    document.body.appendChild(toast);
  }

  toast.textContent = mensaje;
  toast.classList.add("mostrar");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("mostrar"), 1000);
}

// =========================
// COMPRAR AHORA POR WHATSAPP
// =========================
function comprarAhora() {
  if (!carrito.length) return mostrarToast("El carrito está vacío ⚠️");

  const totalCompra = totalEl ? totalEl.innerText : "";
  const productos = carrito.map(p => `${p.nombre} (x${p.cantidad}) - S/ ${calcularTotalProducto(p).toFixed(2)}`).join("\n");
  const mensaje = `¡Hola! Quiero comprar estos productos:\n${productos}\n\n💰 Total: ${totalCompra}`;
  const telefono = "51929261925";

  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const appUrl = `whatsapp://send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
    const fallbackUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.location.href = appUrl;
    setTimeout(() => { if (document.visibilityState === "visible") window.location.href = fallbackUrl; vaciarCarritoDespuesEnvio(); }, 1200);
  } else {
    window.open(`https://web.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`, "_blank");
    vaciarCarritoDespuesEnvio();
  }
}

function vaciarCarritoDespuesEnvio() {
  carrito = [];
  guardarCarrito();
  mostrarCarrito();
  actualizarContador();
  mostrarToast("Pedido enviado por WhatsApp y carrito vaciado 🧾");
  if (sidebar?.classList.contains("activo")) cerrarSidebar();
}

// =========================
// LISTENERS GENERALES
// =========================
document.getElementById("whatsapp-comprar")?.addEventListener("click", comprarAhora);
document.addEventListener("click", e => {
  if (e.target.classList.contains("btn-agregar-carrito")) agregarAlCarrito(e.target.dataset.id);
});
document.querySelector(".btn-ver-carrito")?.addEventListener("click", e => { e.preventDefault(); cerrarSidebar(); window.location.href = "carrito.html"; });
document.getElementById("ir-a-pagar")?.addEventListener("click", comprarAhora);
document.getElementById("btn-comprar-whatsapp")?.addEventListener("click", comprarAhora);
document.addEventListener("keydown", e => { if (e.key === "Escape" && sidebar?.classList.contains("activo")) cerrarSidebar(); });

// =========================
// INICIALIZAR
// =========================
mostrarCarrito();
actualizarContador();
