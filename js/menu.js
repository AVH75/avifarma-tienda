// =========================
// ELEMENTOS PRINCIPALES
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav");
  const overlayMenu = document.getElementById("overlay-menu");
  const closeMenu = document.getElementById("close-menu");
  const menuCategorias = document.getElementById('menu-categorias');
  const toggleCategoriasBtn = document.getElementById("toggle-categorias");
  const contenedorProductos = document.getElementById("catalogo");
  const promoBar = document.querySelector(".promo-bar"); // Barra de promo
  const topBar = document.querySelector(".top-bar");     // Barra superior
  const header = document.querySelector(".main-header"); // Header principal
  const body = document.body;

  let productosGlobal = [];

  // =====================================================
  // Abrir / cerrar menú lateral
  // =====================================================
  const abrirMenu = () => { 
    nav.classList.add("activo"); 
    overlayMenu.classList.add("activo"); 
  };
  const cerrarMenu = () => {
    nav.classList.remove("activo");
    overlayMenu.classList.remove("activo");
    // Limpiar clases activas al cerrar menú
    menuCategorias.querySelectorAll("li.active").forEach(li => li.classList.remove("active"));
  };

  menuToggle?.addEventListener("click", abrirMenu);
  closeMenu?.addEventListener("click", cerrarMenu);
  overlayMenu?.addEventListener("click", cerrarMenu);

  // =====================================================
  // Mostrar productos filtrados por subcategoría
  // =====================================================
  const mostrarProductosPorSubcategoria = (id) => {
    if (!contenedorProductos) return;
    contenedorProductos.innerHTML = "";
    const filtrados = productosGlobal.filter(p => Number(p.subcategoria) === Number(id));
    if (!filtrados.length) { 
      contenedorProductos.innerHTML = "<p>No hay productos en esta subcategoría.</p>"; 
      return; 
    }

    filtrados.forEach(prod => {
      const precio = prod.precio_con_descuento ?? prod.precio;
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <img src="${prod.img}" alt="${prod.nombre}">
        <h3>${prod.nombre}</h3>
        <p>${prod.descripcion || ""}</p>
        <span class="precio">S/ ${Number(precio).toFixed(2)}</span>
        <button onclick="agregarAlCarrito(${prod.id})">Agregar al carrito</button>
      `;
      contenedorProductos.appendChild(card);
    });

    contenedorProductos.scrollIntoView({ behavior: "smooth" });
  };
  window.mostrarProductosPorSubcategoria = mostrarProductosPorSubcategoria;

  // =====================================================
  // Ocultar la lista de categorías al inicio
  // =====================================================
  const toggleCategorias = document.getElementById('toggle-categorias'); // El enlace "Categorías"

toggleCategorias?.addEventListener('click', e => {
  e.preventDefault();
  menuCategorias.classList.toggle('activo'); // Muestra u oculta los li principales
});

  // =====================================================
// Construir menú dinámico con subcategorías
// =====================================================
const buildMenuFromData = (categorias) => {
  menuCategorias.innerHTML = "";

  categorias.forEach(cat => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = cat.nombre;
    li.appendChild(a);

    // Subcategorías
    if (cat.subcategorias?.length) {
      const ulSub = document.createElement("ul");

      cat.subcategorias.forEach(sub => {
        const liSub = document.createElement("li");
        const aSub = document.createElement("a");
        aSub.href = "#";
        aSub.textContent = sub.nombre;

        aSub.addEventListener("click", e => {
          e.preventDefault();
          mostrarProductosPorSubcategoria(sub.id);

          // Limpiar subcategorías activas
          menuCategorias.querySelectorAll("li ul li.active").forEach(liAct => liAct.classList.remove("active"));

          liSub.classList.add("active"); // marcar subcategoría activa

          // 🔹 Cerrar menú lateral al seleccionar subcategoría
          cerrarMenu();
        });

        liSub.appendChild(aSub);
        ulSub.appendChild(liSub);
      });

      li.appendChild(ulSub);

      // Click en categoría principal → alterna subcategorías
      a.addEventListener("click", e => {
        e.preventDefault();
        li.classList.toggle("active");
      });
    }

    menuCategorias.appendChild(li);
  });
};


  // =====================================================
  // Cargar JSON
  // =====================================================
  fetch("productos.json")
    .then(resp => resp.json())
    .then(data => {
      productosGlobal = [...(data.productos||[]), ...(data.ofertas||[])];
      buildMenuFromData(data.categorias||[]);
      console.log("Menú cargado correctamente");
    })
    .catch(e => console.error("Error cargando productos.json:", e));

  // =========================
  // OCULTAR/MOSTRAR BARRAS AL SCROLL
  // =========================
  let lastScrollTop = 0;

  const ajustarPadding = () => {
    const promoHeight = promoBar?.offsetHeight || 0;
    const topHeight = topBar?.offsetHeight || 0;
    const headerHeight = header?.offsetHeight || 0;
    const totalAltura = promoHeight + topHeight + headerHeight;
    body.style.paddingTop = `${totalAltura}px`;
  };

  window.addEventListener("load", ajustarPadding);
  window.addEventListener("resize", ajustarPadding);

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop && currentScroll > 100) {
      promoBar?.classList.add("oculto");
      topBar?.classList.add("oculto");
      header?.classList.add("fixed");
      body.classList.add("scrolled");
      body.style.paddingTop = `${header.offsetHeight}px`;
    } else if (currentScroll < lastScrollTop - 10) {
      promoBar?.classList.remove("oculto");
      topBar?.classList.remove("oculto");
      header?.classList.remove("fixed");
      body.classList.remove("scrolled");
      ajustarPadding();
    }

    lastScrollTop = Math.max(currentScroll, 0);
  });
});
